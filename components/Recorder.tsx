'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Video, Square, Save, Loader2, RefreshCw, AlertCircle, Camera, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecorderProps {
  orderId: string;
  skuId: string;
  notes?: string;
  className?: string;
  onSaveSuccess?: () => void;
}

interface CapturedImage {
  id: string;
  blob: Blob;
  url: string;
}

export function Recorder({ orderId, skuId, notes, className, onSaveSuccess }: RecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('video/webm');
  const [showStoppedMessage, setShowStoppedMessage] = useState(false);

  // Helper function to detect supported video codec
  const getSupportedMimeType = (): string => {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm;codecs=h264',
      'video/webm',
      'video/mp4;codecs=h264',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using codec:', type);
        return type;
      }
    }

    return ''; // No supported type found
  };

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure permissions are granted.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];

    // Get supported mime type with fallback
    const mimeType = getSupportedMimeType();

    if (!mimeType) {
      setError('Your browser does not support video recording. Please try Chrome, Edge, or Firefox.');
      return;
    }

    setRecordedMimeType(mimeType);
    const mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setShowStoppedMessage(true);
      setTimeout(() => setShowStoppedMessage(false), 5000);
    };

    mediaRecorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = mediaRecorder;
    setSuccessMessage(null);
    setVideoUrl(null);
    setError(null);
    setShowStoppedMessage(false);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    // Mirror effect if needed (we mirror the video preview, so we might want to mirror the capture too)
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedImages(prev => [...prev, {
          id: crypto.randomUUID(),
          blob,
          url
        }]);
        setSuccessMessage('Image captured!');
        setTimeout(() => setSuccessMessage(null), 2000);
      }
    }, 'image/jpeg', 0.95);
  };

  const removeImage = (id: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id));
  };

  const uploadFile = async (blob: Blob, mimeType: string) => {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('orderId', orderId);
    if (skuId) formData.append('skuId', skuId);
    if (notes) formData.append('notes', notes);
    formData.append('mimeType', mimeType);

    const response = await fetch('/api/save-media', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    return response.json();
  };

  const saveAll = useCallback(async () => {
    if (!orderId) {
      setError('Missing Order ID');
      return;
    }

    // Don't allow saving while recording - must stop first
    if (isRecording) {
      setError('Please stop recording before saving');
      return;
    }

    if (!videoUrl && capturedImages.length === 0) {
      setError('No media to save');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveProgress('Starting upload...');

    try {
      let successCount = 0;
      const totalItems = (videoUrl ? 1 : 0) + capturedImages.length;

      // 1. Upload Video
      if (videoUrl) {
        setSaveProgress(`Uploading video (1/${totalItems})...`);
        const videoBlob = new Blob(chunksRef.current, { type: recordedMimeType });
        await uploadFile(videoBlob, recordedMimeType);
        successCount++;
      }

      // 2. Upload Images
      for (let i = 0; i < capturedImages.length; i++) {
        setSaveProgress(`Uploading image ${i + 1} of ${capturedImages.length} (${successCount + 1}/${totalItems})...`);
        await uploadFile(capturedImages[i].blob, 'image/jpeg');
        successCount++;
      }

      setSuccessMessage(`Successfully saved ${successCount} items`);
      if (onSaveSuccess) onSaveSuccess();

      // Reset state
      setVideoUrl(null);
      setCapturedImages([]);
      chunksRef.current = [];
      setShowStoppedMessage(false);
    } catch (err) {
      console.error('Error saving media:', err);
      setError('Failed to save some media items. Please check your connection.');
    } finally {
      setIsSaving(false);
      setSaveProgress('');
    }
  }, [orderId, videoUrl, capturedImages, isRecording, recordedMimeType, onSaveSuccess]);



  const reset = () => {
    setVideoUrl(null);
    setCapturedImages([]);
    setSuccessMessage(null);
    setError(null);
    chunksRef.current = [];
    setShowStoppedMessage(false);
  };

  const hasMedia = !!videoUrl || capturedImages.length > 0;
  const canSave = hasMedia && !isRecording;

  // Calculate what will be saved
  const getSaveLabel = () => {
    const videoCount = videoUrl ? 1 : 0;
    const imageCount = capturedImages.length;
    const total = videoCount + imageCount;

    if (total === 0) return 'Save';

    const parts = [];
    if (videoCount > 0) parts.push(`${videoCount} video`);
    if (imageCount > 0) parts.push(`${imageCount} image${imageCount > 1 ? 's' : ''}`);

    return `Save All (${parts.join(', ')})`;
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl group">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
            />
            <canvas ref={canvasRef} className="hidden" />
          </>
        )}

        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider">Recording</span>
          </div>
        )}

        {/* Capture Overlay Flash Effect could go here */}
      </div>

      {/* Captured Images Strip */}
      {capturedImages.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {capturedImages.map((img, idx) => (
            <div key={img.id} className="relative shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group/img">
              <img src={img.url} alt={`Capture ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(img.id)}
                disabled={isSaving}
                className="absolute top-1 right-1 p-1 bg-red-500/80 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {!isRecording && !videoUrl && (
              <button
                onClick={startRecording}
                disabled={!stream}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
              >
                <Video size={20} />
                Record Video
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all shadow-lg"
              >
                <Square size={20} fill="currentColor" />
                Stop Recording
              </button>
            )}

            {/* Capture Image Button - Only available during live stream (not during playback) */}
            {!videoUrl && stream && (
              <button
                onClick={captureImage}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                title="Capture a snapshot from the live camera feed"
              >
                <Camera size={20} />
                Capture Image
              </button>
            )}

            {/* Save button - only show when there's media to save and not recording */}
            {canSave && (
              <>
                <button
                  onClick={saveAll}
                  disabled={isSaving || !orderId}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
                >
                  {isSaving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  {isSaving ? 'Saving...' : getSaveLabel()}
                </button>

                <button
                  onClick={reset}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={20} />
                  Reset
                </button>
              </>
            )}

            {/* Warning when recording - must stop first */}
            {isRecording && (hasMedia || capturedImages.length > 0) && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
                <AlertCircle size={16} />
                <span>Stop recording to save your media</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar / Status */}
        {isSaving && (
          <div className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
            {saveProgress}
          </div>
        )}
        {/* Pending items indicator */}
        {hasMedia && !isRecording && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-medium">Ready to save:</span>
            </div>
            <span>
              {videoUrl && <span className="text-green-600 dark:text-green-400">1 video</span>}
              {videoUrl && capturedImages.length > 0 && <span className="mx-1">•</span>}
              {capturedImages.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  {capturedImages.length} image{capturedImages.length > 1 ? 's' : ''}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Error / Warning Alert */}
      {(error || !orderId) && (
        <div className={cn(
          "p-4 rounded-xl border flex items-start gap-3 transition-all",
          error
            ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
            : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400"
        )}>
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <div className="text-sm">
            {error ? (
              <p className="font-medium">{error}</p>
            ) : (
              <>
                <p className="font-medium">Missing Information</p>
                <p className="opacity-90 mt-1">
                  Please scan or enter <strong>Order ID</strong> before saving.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Recording stopped message */}
      {showStoppedMessage && !isSaving && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 flex items-center gap-3">
          <AlertCircle size={20} />
          <div className="text-sm">
            <p className="font-medium">Recording stopped</p>
            <p className="opacity-90 mt-0.5">Click "Save All" to upload your media, or click "Reset" to discard.</p>
          </div>
        </div>
      )}
    </div>
  );
}
