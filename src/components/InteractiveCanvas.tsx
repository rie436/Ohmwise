/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Interactive Canvas with Draggable Sampling Markers and Real-Time Magnifier Loupe
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ResistorColor, RESISTOR_COLORS, BandCount } from '../lib/resistor';
import { sampleMedianColor, SampledColorInfo } from '../lib/scanner';
import { Eye, Crosshair, ZoomIn, RefreshCw } from 'lucide-react';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  markerPositions: { x: number; y: number }[];
  bandCount: BandCount;
  bands: ResistorColor[];
  activeMarkerIndex: number | null;
  onSelectMarker: (idx: number) => void;
  onMarkerChange: (idx: number, pos: { x: number; y: number }) => void;
  onMarkerDragEnd: (idx: number, sampled: SampledColorInfo) => void;
  onResetMarkers: () => void;
  scanlineY: number | null;
  showScanline: boolean;
}

export const InteractiveCanvas: React.FC<Props> = ({
  canvasRef,
  markerPositions,
  bandCount,
  bands,
  activeMarkerIndex,
  onSelectMarker,
  onMarkerChange,
  onMarkerDragEnd,
  onResetMarkers,
  scanlineY,
  showScanline,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [loupeInfo, setLoupeInfo] = useState<{
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    sample: SampledColorInfo | null;
    pixels: { r: number; g: number; b: number }[][];
  } | null>(null);

  // Extract a 9x9 grid around pixel coordinate for loupe
  const getLoupePixels = useCallback(
    (canvas: HTMLCanvasElement, px: number, py: number) => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return [];
      const radius = 4; // 9x9 grid
      const minX = Math.max(0, px - radius);
      const minY = Math.max(0, py - radius);
      const w = Math.min(canvas.width - minX, radius * 2 + 1);
      const h = Math.min(canvas.height - minY, radius * 2 + 1);

      if (w <= 0 || h <= 0) return [];
      const imgData = ctx.getImageData(minX, minY, w, h).data;
      const grid: { r: number; g: number; b: number }[][] = [];

      for (let y = 0; y < h; y++) {
        const row: { r: number; g: number; b: number }[] = [];
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          row.push({
            r: imgData[idx],
            g: imgData[idx + 1],
            b: imgData[idx + 2],
          });
        }
        grid.push(row);
      }
      return grid;
    },
    []
  );

  // Pointer down on marker
  const handlePointerDown = (idx: number, e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingIdx(idx);
    onSelectMarker(idx);

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      const pos = markerPositions[idx];
      const px = Math.round(pos.x * canvas.width);
      const py = Math.round(pos.y * canvas.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const sample = sampleMedianColor(ctx, px, py, 4);
        const pixels = getLoupePixels(canvas, px, py);
        setLoupeInfo({
          x: pos.x,
          y: pos.y,
          screenX: pos.x * container.clientWidth,
          screenY: pos.y * container.clientHeight,
          sample,
          pixels,
        });
      }
    }
  };

  // Pointer move during drag
  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const normX = Math.max(0.02, Math.min(0.98, clientX / rect.width));
    const normY = Math.max(0.02, Math.min(0.98, clientY / rect.height));

    onMarkerChange(draggingIdx, { x: normX, y: normY });

    const px = Math.round(normX * canvas.width);
    const py = Math.round(normY * canvas.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      const sample = sampleMedianColor(ctx, px, py, 4);
      const pixels = getLoupePixels(canvas, px, py);
      setLoupeInfo({
        x: normX,
        y: normY,
        screenX: clientX,
        screenY: clientY,
        sample,
        pixels,
      });
    }
  };

  // Pointer up after drag
  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingIdx !== null) {
      const canvas = canvasRef.current;
      if (canvas) {
        const pos = markerPositions[draggingIdx];
        const px = Math.round(pos.x * canvas.width);
        const py = Math.round(pos.y * canvas.height);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const sample = sampleMedianColor(ctx, px, py, 4);
          onMarkerDragEnd(draggingIdx, sample);
        }
      }
      setDraggingIdx(null);
      setLoupeInfo(null);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Top canvas controls toolbar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-mono text-cyan-400 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5" />
            Interactive Sampling Matrix
          </span>
          <span className="hidden sm:inline text-slate-500">·</span>
          <span className="hidden sm:inline">Drag pins 1–{bandCount} onto each band</span>
        </div>

        <button
          onClick={onResetMarkers}
          className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-slate-800 transition-colors cursor-pointer"
          title="Reset markers to default line"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Pins</span>
        </button>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full aspect-[16/9] sm:aspect-[12/7] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner select-none touch-none cursor-crosshair"
      >
        {/* Real Canvas element */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Scanline visualization */}
        {showScanline && scanlineY !== null && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-cyan-400/80 shadow-[0_0_8px_#06b6d4] pointer-events-none transition-all duration-300"
            style={{ top: `${scanlineY * 100}%` }}
          >
            <div className="absolute right-2 -top-4 text-[9px] font-mono text-cyan-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-500/40">
              SCANLINE {(scanlineY * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {/* SVG connection line between pins */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            points={markerPositions
              .slice(0, bandCount)
              .map((p) => `${p.x * 100}%,${p.y * 100}%`)
              .join(' ')}
            fill="none"
            stroke="rgba(6, 182, 212, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Draggable Numbered Markers */}
        {markerPositions.slice(0, bandCount).map((pos, idx) => {
          const colorName = bands[idx] || 'black';
          const def = RESISTOR_COLORS[colorName];
          const isSelected = activeMarkerIndex === idx;
          const isDragging = draggingIdx === idx;

          return (
            <div
              key={idx}
              onPointerDown={(e) => handlePointerDown(idx, e)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-20 transition-transform"
              style={{
                left: `${pos.x * 100}%`,
                top: `${pos.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${isDragging ? 1.25 : isSelected ? 1.15 : 1})`,
              }}
            >
              {/* Outer Glow Ring */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                  isDragging
                    ? 'border-cyan-300 ring-4 ring-cyan-500/40'
                    : isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-500/30'
                    : 'border-white/80 hover:scale-110'
                }`}
                style={{
                  backgroundColor: def.hex,
                  color: def.textColor,
                }}
              >
                <span className="text-xs font-mono font-bold select-none">
                  {idx + 1}
                </span>
              </div>

              {/* Pin pointer stem */}
              <div className="w-0.5 h-2 bg-white/70 mx-auto" />

              {/* Tag below pin */}
              <div className="absolute top-10 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 text-[10px] font-mono text-slate-200 border border-slate-700 whitespace-nowrap shadow-sm pointer-events-none">
                {def.label}
              </div>
            </div>
          );
        })}

        {/* Live Magnifier Loupe HUD */}
        {loupeInfo && loupeInfo.sample && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-900/95 border border-cyan-500/80 rounded-lg shadow-2xl p-2.5 backdrop-blur-md flex flex-col gap-2 min-w-[170px]"
            style={{
              // Position loupe offset from cursor so it doesn't get covered by finger/mouse
              left: loupeInfo.screenX > 200 ? `${loupeInfo.screenX - 190}px` : `${loupeInfo.screenX + 30}px`,
              top: loupeInfo.screenY > 200 ? `${loupeInfo.screenY - 170}px` : `${loupeInfo.screenY + 30}px`,
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[10px] font-mono text-cyan-400 font-semibold flex items-center gap-1">
                <ZoomIn className="w-3 h-3" /> LOUPE 9×9
              </span>
              <span
                className="w-3.5 h-3.5 rounded border border-white/30"
                style={{ backgroundColor: loupeInfo.sample.hex }}
              />
            </div>

            {/* 9x9 Pixel Matrix Grid */}
            <div className="w-[108px] h-[108px] mx-auto border border-slate-700 grid grid-cols-9 relative overflow-hidden bg-black">
              {loupeInfo.pixels.map((row, rIdx) =>
                row.map((px, cIdx) => {
                  const isCenter = rIdx === 4 && cIdx === 4;
                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`w-3 h-3 ${isCenter ? 'ring-1 ring-cyan-300 z-10' : ''}`}
                      style={{
                        backgroundColor: `rgb(${px.r}, ${px.g}, ${px.b})`,
                      }}
                    />
                  );
                })
              )}
              {/* Central Target Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3.5 h-3.5 border border-cyan-300 shadow-xs" />
              </div>
            </div>

            {/* Color Telemetry */}
            <div className="flex flex-col gap-0.5 text-[10px] font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Color:</span>
                <strong className="text-cyan-300">{loupeInfo.sample.label}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>RGB:</span>
                <span>{loupeInfo.sample.r},{loupeInfo.sample.g},{loupeInfo.sample.b}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>HEX:</span>
                <span className="uppercase">{loupeInfo.sample.hex}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>HSV:</span>
                <span>{loupeInfo.sample.hsv.h}°, {loupeInfo.sample.hsv.s}%, {loupeInfo.sample.hsv.v}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
