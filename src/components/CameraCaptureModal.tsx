/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Camera Live Viewfinder and Frame Capture Modal
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, SwitchCamera, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (canvas: HTMLCanvasElement) => void;
}

export const CameraCaptureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isReady, setIsReady] = useState(false);

  // Stop camera tracks helper
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setIsReady(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    async function startCamera() {
      stopStream();
      setError(null);
      setIsReady(false);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser in this environment.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => setIsReady(true));
          };
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const msg = err instanceof Error ? err.message : 'Unable to access camera';
        setError(msg);
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      stopStream();
    };
  }, [isOpen, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !isReady) return;
    const video = videoRef.current;

    // Create offscreen capture canvas
    const canvas = document.createElement('canvas');
    let width = video.videoWidth || 1280;
    let height = video.videoHeight || 720;

    // Scale down to maximum 1200px on longest side as specified
    const maxDimension = 1200;
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    // Stop camera and send frame
    stopStream();
    onCapture(canvas);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-100">Capture Resistor Frame</h3>
          </div>
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Area */}
        <div className="relative aspect-[16/9] bg-black overflow-hidden flex items-center justify-center">
          {error ? (
            <div className="flex flex-col items-center gap-2 p-6 text-center text-rose-400">
              <AlertCircle className="w-8 h-8 text-rose-500" />
              <p className="text-sm font-semibold">Camera Unavailable</p>
              <p className="text-xs text-slate-400 max-w-sm">{error}</p>
              <p className="text-xs text-slate-500 mt-2">
                Make sure camera permissions are enabled in your browser, or upload an image instead.
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-28 border-2 border-dashed border-cyan-400/80 rounded-xl relative shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  {/* Center Line */}
                  <div className="absolute inset-y-1/2 left-0 right-0 h-0.5 bg-cyan-400/40" />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-cyan-300 font-mono text-[11px] px-2 py-0.5 rounded border border-cyan-500/50">
                    ALIGN RESISTOR HORIZONTALLY
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={toggleFacingMode}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <SwitchCamera className="w-4 h-4" />
            <span>Switch Camera ({facingMode === 'environment' ? 'Back' : 'Front'})</span>
          </button>

          <button
            disabled={!isReady || !!error}
            onClick={handleCapture}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Snap Resistor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
