'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Video, Square, Save, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecorderProps {
  orderId: string;
  skuId: string;
  notes?: string;
  className?: string;
  onSaveSuccess?: () => void;
}

export function Recorder({ orderId, skuId, notes, className, onSaveSuccess }: RecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordedMimeType, setRecordedMimeType] = useState<string>('video/webm');

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
      setPreviewUrl(url);
    };

    mediaRecorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = mediaRecorder;
    setSuccessMessage(null);
    setPreviewUrl(null);
    setError(null);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async () => {
    if (!previewUrl || !orderId) {
      setError('Missing Order ID');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const blob = new Blob(chunksRef.current, { type: recordedMimeType });
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('orderId', orderId);
      if (skuId) formData.append('skuId', skuId);
      if (notes) formData.append('notes', notes);
      formData.append('mimeType', recordedMimeType);

      const response = await fetch('/api/save-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save video');
      }

      const data = await response.json();
      setSuccessMessage(`Video saved successfully to ${data.path}`);
      if (onSaveSuccess) onSaveSuccess();
      setPreviewUrl(null);
      chunksRef.current = [];
    } catch (err) {
      console.error('Error saving video:', err);
      setError('Failed to save video. Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setSuccessMessage(null);
    setError(null);
    chunksRef.current = [];
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
        {previewUrl ? (
          <video
            src={previewUrl}
            controls
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
          />
        )}

        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider">Recording</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 backdrop-blur-sm">
        <div className="flex gap-2">
          {!isRecording && !previewUrl && (
            <button
              onClick={startRecording}
              disabled={!stream}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
            >
              <Video size={20} />
              Start Recording
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all shadow-lg"
            >
              <Square size={20} fill="currentColor" />
              Stop
            </button>
          )}

          {previewUrl && (
            <>
              <button
                onClick={saveRecording}
                disabled={isSaving || !orderId}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {isSaving ? 'Saving...' : 'Save Recording'}
              </button>
              <button
                onClick={reset}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all"
              >
                <RefreshCw size={20} />
                Retake
              </button>
            </>
          )}
        </div>

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
                  Please scan or enter <strong>Order ID</strong> before saving the recording.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}
    </div>
  );
}
