'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Video, Square, Save, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecorderProps {
  orderId: string;
  skuId: string;
  className?: string;
}

export function Recorder({ orderId, skuId, className }: RecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

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
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    };

    mediaRecorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = mediaRecorder;
    setSuccessMessage(null);
    setPreviewUrl(null);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const saveRecording = async () => {
    if (!previewUrl || !orderId || !skuId) {
      setError('Missing Order ID or SKU ID');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('file', blob);
      formData.append('orderId', orderId);
      formData.append('skuId', skuId);

      const response = await fetch('/api/save-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to save video');
      }

      const data = await response.json();
      setSuccessMessage(`Video saved successfully to ${data.path}`);
      setPreviewUrl(null);
      chunksRef.current = [];
    } catch (err) {
      console.error('Error saving video:', err);
      setError('Failed to save video. Please try again.');
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
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
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

      <div className="flex items-center justify-between gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
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
                disabled={isSaving || !orderId || !skuId}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20"
              >
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {isSaving ? 'Saving...' : 'Save Recording'}
              </button>
              <button
                onClick={reset}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium transition-all"
              >
                <RefreshCw size={20} />
                Retake
              </button>
            </>
          )}
        </div>

        <div className="text-sm">
          {error && <span className="text-red-400">{error}</span>}
          {successMessage && <span className="text-green-400">{successMessage}</span>}
          {!orderId || !skuId ? (
            <span className="text-yellow-500/80 italic">Enter Order ID & SKU to save</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
