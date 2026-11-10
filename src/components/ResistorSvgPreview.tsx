/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Realistic SVG visualization of the resistor with accurate bands and leads
 */

import React from 'react';
import { ResistorColor, RESISTOR_COLORS, BandCount } from '../lib/resistor';
import { ArrowLeftRight } from 'lucide-react';

interface Props {
  bands: ResistorColor[];
  bandCount: BandCount;
  onFlipDirection: () => void;
  onSelectBandIndex?: (idx: number) => void;
  activeBandIndex?: number | null;
  bodyType?: 'carbon-film' | 'metal-film';
}

export const ResistorSvgPreview: React.FC<Props> = ({
  bands,
  bandCount,
  onFlipDirection,
  onSelectBandIndex,
  activeBandIndex,
  bodyType = 'carbon-film',
}) => {
  const isCarbon = bodyType === 'carbon-film';

  // Calculate band X positions inside the 600x160 SVG viewbox
  // Resistor body spans from x=160 to x=440 (width = 280)
  const bodyLeft = 160;
  const bodyRight = 440;
  const centerY = 80;

  const bandPositions: number[] = [];
  if (bandCount === 4) {
    bandPositions.push(bodyLeft + 45);
    bandPositions.push(bodyLeft + 90);
    bandPositions.push(bodyLeft + 135);
    bandPositions.push(bodyRight - 45); // noticeable gap for tolerance band
  } else if (bandCount === 5) {
    bandPositions.push(bodyLeft + 40);
    bandPositions.push(bodyLeft + 78);
    bandPositions.push(bodyLeft + 116);
    bandPositions.push(bodyLeft + 154);
    bandPositions.push(bodyRight - 40);
  } else if (bandCount === 6) {
    bandPositions.push(bodyLeft + 36);
    bandPositions.push(bodyLeft + 72);
    bandPositions.push(bodyLeft + 108);
    bandPositions.push(bodyLeft + 144);
    bandPositions.push(bodyRight - 65);
    bandPositions.push(bodyRight - 35);
  } else {
    // 3 bands
    bandPositions.push(bodyLeft + 55);
    bandPositions.push(bodyLeft + 115);
    bandPositions.push(bodyLeft + 175);
  }

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2">
        <span className="font-mono uppercase tracking-wider">Schematic Preview (Pin 1 → Pin {bandCount})</span>
        <button
          onClick={onFlipDirection}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded border border-slate-700/60 transition-colors cursor-pointer"
          title="Reverse reading order"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Flip Direction</span>
        </button>
      </div>

      <div className="relative w-full max-w-xl aspect-[600/150] select-none">
        <svg viewBox="0 0 600 150" className="w-full h-full drop-shadow-md">
          <defs>
            {/* Metallic Lead Gradient */}
            <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="30%" stopColor="#94a3b8" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Ceramic Body Gradients */}
            <linearGradient id="carbonBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#edd8b4" />
              <stop offset="20%" stopColor="#f7ebd8" />
              <stop offset="55%" stopColor="#dfba8a" />
              <stop offset="85%" stopColor="#b48b57" />
              <stop offset="100%" stopColor="#7e5c33" />
            </linearGradient>

            <linearGradient id="metalBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#93cee3" />
              <stop offset="20%" stopColor="#d5edf8" />
              <stop offset="55%" stopColor="#69b4cf" />
              <stop offset="85%" stopColor="#3d8ba7" />
              <stop offset="100%" stopColor="#225d73" />
            </linearGradient>

            <clipPath id="bodyClip">
              <path d="M 195,44 L 405,44 C 430,38 440,55 440,75 C 440,95 430,112 405,106 L 195,106 C 170,112 160,95 160,75 C 160,55 170,38 195,44 Z" />
            </clipPath>
          </defs>

          {/* Left Wire Lead */}
          <rect x="20" y="72" width="145" height="6" fill="url(#leadGrad)" rx="1" />
          {/* Right Wire Lead */}
          <rect x="435" y="72" width="145" height="6" fill="url(#leadGrad)" rx="1" />

          {/* Resistor Body */}
          <path
            d="M 195,44 L 405,44 C 430,38 440,55 440,75 C 440,95 430,112 405,106 L 195,106 C 170,112 160,95 160,75 C 160,55 170,38 195,44 Z"
            fill={isCarbon ? 'url(#carbonBodyGrad)' : 'url(#metalBodyGrad)'}
            stroke="rgba(0,0,0,0.25)"
            strokeWidth="1.5"
          />

          {/* Color Bands Clipped into body */}
          <g clipPath="url(#bodyClip)">
            {bands.slice(0, bandCount).map((color, idx) => {
              const x = bandPositions[idx] || (bodyLeft + 40 + idx * 40);
              const def = RESISTOR_COLORS[color] || RESISTOR_COLORS.black;
              const isSelected = activeBandIndex === idx;

              return (
                <g
                  key={idx}
                  className="cursor-pointer transition-opacity hover:opacity-90"
                  onClick={() => onSelectBandIndex?.(idx)}
                >
                  <rect
                    x={x - 8}
                    y="30"
                    width="16"
                    height="90"
                    fill={def.hex}
                    stroke={isSelected ? '#38bdf8' : 'rgba(0,0,0,0.3)'}
                    strokeWidth={isSelected ? '2' : '0.5'}
                  />
                  {/* Band Cylindrical Highlight */}
                  <rect
                    x={x - 8}
                    y="45"
                    width="16"
                    height="10"
                    fill="white"
                    opacity="0.25"
                  />
                </g>
              );
            })}
          </g>

          {/* Band Number Indicators below body */}
          {bands.slice(0, bandCount).map((_, idx) => {
            const x = bandPositions[idx] || (bodyLeft + 40 + idx * 40);
            const isSelected = activeBandIndex === idx;

            return (
              <g
                key={`label-${idx}`}
                className="cursor-pointer"
                onClick={() => onSelectBandIndex?.(idx)}
              >
                <circle
                  cx={x}
                  cy="125"
                  r="9"
                  fill={isSelected ? '#0284c7' : '#1e293b'}
                  stroke={isSelected ? '#38bdf8' : '#475569'}
                  strokeWidth="1.5"
                />
                <text
                  x={x}
                  y="128.5"
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill="#f8fafc"
                  fontWeight="bold"
                >
                  {idx + 1}
                </text>
              </g>
            );
          })}

          {/* Direction indicator arrow */}
          <path
            d="M 50,30 L 120,30 M 115,26 L 122,30 L 115,34"
            stroke="#06b6d4"
            strokeWidth="1.5"
            fill="none"
          />
          <text
            x="85"
            y="23"
            textAnchor="middle"
            fontSize="9"
            fontFamily="monospace"
            fill="#06b6d4"
            letterSpacing="0.05em"
          >
            READING DIRECTION
          </text>
        </svg>
      </div>
    </div>
  );
};
