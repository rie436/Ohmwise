/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Ohmwise - Local-First Resistor Color-Band Reader
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ResistorColor,
  BandCount,
  decodeResistor,
  DecodeResult,
} from './lib/resistor';
import {
  autoScanResistor,
  defaultBands,
  defaultNormalizedPositions,
  sampleMedianColor,
  SampledColorInfo,
} from './lib/scanner';
import {
  BENCHMARK_PRESETS,
  generateResistorImage,
  ResistorPreset,
} from './lib/preset-generator';
import { InteractiveCanvas } from './components/InteractiveCanvas';
import { BandColorSelector } from './components/BandColorSelector';
import { ResistorSvgPreview } from './components/ResistorSvgPreview';
import { ResultPanel } from './components/ResultPanel';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { ColorCodeGuideModal } from './components/ColorCodeGuideModal';
import {
  Camera,
  Upload,
  ScanLine,
  HelpCircle,
  Cpu,
} from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Core application state
  const [bandCount, setBandCount] = useState<BandCount>(4);
  const [bands, setBands] = useState<ResistorColor[]>(defaultBands(4));
  const [markerPositions, setMarkerPositions] = useState<{ x: number; y: number }[]>(
    defaultNormalizedPositions(4)
  );
  const [activeBandIndex, setActiveBandIndex] = useState<number | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('4k7-4band');

  // Scanning & Detection telemetry
  const [isScanning, setIsScanning] = useState(false);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('high');
  const [supportCount, setSupportCount] = useState<number>(3);
  const [scanlineY, setScanlineY] = useState<number | null>(0.5);
  const [showScanline, setShowScanline] = useState(true);
  const [scanNotes, setScanNotes] = useState<string[]>([
    'Benchmark 4-band calibrated image loaded.',
  ]);

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Compute decoded result reactively
  const decodeResult: DecodeResult = decodeResistor(bands.slice(0, bandCount));

  // Load a preset image onto the canvas
  const loadPreset = useCallback(
    (preset: ResistorPreset) => {
      setActivePresetId(preset.id);
      setBandCount(preset.bandCount);
      setBands([...preset.bands]);

      const sourceCanvas = generateResistorImage(preset);
      const targetCanvas = canvasRef.current;
      if (targetCanvas) {
        targetCanvas.width = sourceCanvas.width;
        targetCanvas.height = sourceCanvas.height;
        const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(sourceCanvas, 0, 0);
          // Run auto-scan on new canvas image
          runScanOnCanvas(targetCanvas, preset.bandCount);
        }
      }
    },
    []
  );

  // Run the computer vision scan on a canvas
  const runScanOnCanvas = (canvas: HTMLCanvasElement, count: BandCount) => {
    setIsScanning(true);
    setShowScanline(true);

    // Brief settling timeout for visual feedback
    setTimeout(() => {
      const scan = autoScanResistor(canvas, count);
      setBands(scan.bands);
      setConfidence(scan.confidence);
      setSupportCount(scan.supportCount);
      setMarkerPositions(scan.markerPositions);
      setScanlineY(scan.scanlineY);
      setScanNotes(scan.notes);
      setIsScanning(false);
    }, 250);
  };

  // Initial load: render benchmark preset on mount
  useEffect(() => {
    const defaultPreset = BENCHMARK_PRESETS[0];
    loadPreset(defaultPreset);
  }, [loadPreset]);

  // Handle Band Count Change (3, 4, 5, 6)
  const handleBandCountChange = (newCount: BandCount) => {
    setBandCount(newCount);
    setActiveBandIndex(null);

    // If active preset matches new count, keep preset; else use defaults
    const matchingPreset = BENCHMARK_PRESETS.find((p) => p.bandCount === newCount);
    if (matchingPreset && canvasRef.current) {
      loadPreset(matchingPreset);
    } else {
      const newBands = defaultBands(newCount);
      setBands(newBands);
      const newPos = defaultNormalizedPositions(newCount);
      setMarkerPositions(newPos);
      if (canvasRef.current) {
        runScanOnCanvas(canvasRef.current, newCount);
      }
    }
  };

  // Flip reading direction
  const handleFlipDirection = () => {
    const currentSlice = bands.slice(0, bandCount);
    const reversed = [...currentSlice].reverse();
    const remaining = bands.slice(bandCount);
    setBands([...reversed, ...remaining]);

    // Reverse markers positions as well
    const reversedPos = [...markerPositions.slice(0, bandCount)].reverse();
    setMarkerPositions([...reversedPos]);
    setScanNotes((prev) => ['Reading direction flipped by user.', ...prev.slice(0, 2)]);
  };

  // Manual update of a single band color
  const handleUpdateBandColor = (index: number, newColor: ResistorColor) => {
    const nextBands = [...bands];
    nextBands[index] = newColor;
    setBands(nextBands);
    setConfidence('low');
    setScanNotes(['Manual band color correction applied.']);
  };

  // Marker drag end - sample color under pin
  const handleMarkerDragEnd = (index: number, sample: SampledColorInfo) => {
    const nextBands = [...bands];
    nextBands[index] = sample.color;
    setBands(nextBands);
    setConfidence('low');
    setScanNotes([
      `Pin ${index + 1} sampled color "${sample.label}" (${sample.hex.toUpperCase()}).`,
    ]);
  };

  // Reset markers to evenly spaced horizontal line
  const handleResetMarkers = () => {
    const defaultPos = defaultNormalizedPositions(bandCount);
    setMarkerPositions(defaultPos);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const nextBands = [...bands];
        defaultPos.forEach((pos, i) => {
          const sample = sampleMedianColor(
            ctx,
            pos.x * canvasRef.current!.width,
            pos.y * canvasRef.current!.height,
            5
          );
          nextBands[i] = sample.color;
        });
        setBands(nextBands);
      }
    }
    setScanNotes(['Pins reset to standard center alignment.']);
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    const maxSizeBytes = 8 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError('Image size exceeds 8 MB limit. Please select a smaller photo.');
      return;
    }

    // Validate format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported format. Please upload JPG, PNG, or WEBP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Downscale to max 1200px on longest side
        const maxDim = 1200;
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setActivePresetId('');
          runScanOnCanvas(canvas, bandCount);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  // Camera capture handler
  const handleCameraCapture = (capturedCanvas: HTMLCanvasElement) => {
    const targetCanvas = canvasRef.current;
    if (targetCanvas) {
      targetCanvas.width = capturedCanvas.width;
      targetCanvas.height = capturedCanvas.height;
      const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(capturedCanvas, 0, 0);
        setActivePresetId('');
        runScanOnCanvas(targetCanvas, bandCount);
      }
    }
  };

  // Trigger auto-scan manually on current image
  const triggerAutoScan = () => {
    if (canvasRef.current) {
      runScanOnCanvas(canvasRef.current, bandCount);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-mono whitespace-nowrap">
            <span className="text-cyan-400">Ω</span>hmwise
          </span>
        </div>


        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
            title="Upload JPG, PNG or WEBP (max 8MB)"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Upload Image</span>
            <span className="sm:hidden">Upload</span>
          </button>

          <button
            onClick={() => setIsCameraOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
            title="Open camera viewfinder to capture a resistor"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Capture Camera</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Upload error banner if any */}
        {uploadError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center justify-between">
            <span>{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Control Ribbon: Band Count Selector & Scan Trigger */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Band Count:
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
              {([3, 4, 5, 6] as BandCount[]).map((count) => (
                <button
                  key={count}
                  onClick={() => handleBandCountChange(count)}
                  className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded-md transition-all cursor-pointer ${
                    bandCount === count
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {count} Bands
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isScanning}
              onClick={triggerAutoScan}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <ScanLine className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Pixels...' : 'Auto Scan Bands'}</span>
            </button>

            <button
              onClick={() => setIsGuideOpen(true)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Resistor color guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Split: Interactive Canvas Viewport (Left) & Results/Correction (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Canvas Viewport (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <InteractiveCanvas
              canvasRef={canvasRef}
              markerPositions={markerPositions}
              bandCount={bandCount}
              bands={bands}
              activeMarkerIndex={activeBandIndex}
              onSelectMarker={(idx) => setActiveBandIndex(idx)}
              onMarkerChange={(idx, pos) => {
                const updated = [...markerPositions];
                updated[idx] = pos;
                setMarkerPositions(updated);
              }}
              onMarkerDragEnd={handleMarkerDragEnd}
              onResetMarkers={handleResetMarkers}
              scanlineY={scanlineY}
              showScanline={showScanline}
            />

            {/* Realistic Schematic Visualizer */}
            <ResistorSvgPreview
              bands={bands}
              bandCount={bandCount}
              onFlipDirection={handleFlipDirection}
              onSelectBandIndex={(idx) => setActiveBandIndex(idx)}
              activeBandIndex={activeBandIndex}
              bodyType={
                activePresetId.includes('220r') || activePresetId.includes('1k') || activePresetId.includes('100r')
                  ? 'metal-film'
                  : 'carbon-film'
              }
            />
          </div>

          {/* Right Column: Decoded Result & Manual Color Palette (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <ResultPanel
              result={decodeResult}
              confidence={confidence}
              supportCount={supportCount}
              scanNotes={scanNotes}
            />

            <BandColorSelector
              bands={bands}
              bandCount={bandCount}
              roles={decodeResult.roles}
              activeBandIndex={activeBandIndex}
              onSelectBandIndex={(idx) => setActiveBandIndex(idx)}
              onUpdateBandColor={handleUpdateBandColor}
            />
          </div>
        </div>

        {/* Benchmark Presets Section */}
        <section id="benchmarks" className="mt-4 pt-6 border-t border-slate-800/80 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
            <h2 className="text-sm font-semibold text-slate-200">
              Sample Resistor Benchmarks
            </h2>
            <span className="text-xs text-slate-500">
              Click any sample to test optical detection and band decoding instantly
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {BENCHMARK_PRESETS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-500 bg-slate-900 shadow-md ring-1 ring-cyan-500/50'
                      : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                      {preset.bandCount} Bands
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {preset.bodyType === 'carbon-film' ? 'Carbon' : 'Metal'}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-200 truncate">
                    {preset.name}
                  </span>

                  {/* Tiny colored stripes indicator */}
                  <div className="flex items-center gap-0.5 mt-1 h-2 rounded overflow-hidden">
                    {preset.bands.map((b, i) => (
                      <div
                        key={i}
                        className="flex-1 h-full"
                        style={{
                          backgroundColor:
                            b === 'black'
                              ? '#0f172a'
                              : b === 'brown'
                              ? '#854d0e'
                              : b === 'red'
                              ? '#dc2626'
                              : b === 'orange'
                              ? '#ea580c'
                              : b === 'yellow'
                              ? '#eab308'
                              : b === 'green'
                              ? '#16a34a'
                              : b === 'blue'
                              ? '#2563eb'
                              : b === 'violet'
                              ? '#9333ea'
                              : b === 'gray'
                              ? '#64748b'
                              : b === 'white'
                              ? '#f8fafc'
                              : b === 'gold'
                              ? '#d97706'
                              : '#94a3b8',
                        }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500 font-mono">
        <p>Ωhmwise · EIA-60062 Compliant</p>
      </footer>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {/* Color Code Reference Modal */}
      <ColorCodeGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
