/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Band Color Selector and Manual Correction Bar
 */

import React from 'react';
import {
  ResistorColor,
  RESISTOR_COLORS,
  COLOR_LIST,
  BandCount,
  BandRole,
} from '../lib/resistor';
import { Check } from 'lucide-react';

interface Props {
  bands: ResistorColor[];
  bandCount: BandCount;
  roles: BandRole[];
  activeBandIndex: number | null;
  onSelectBandIndex: (idx: number) => void;
  onUpdateBandColor: (index: number, color: ResistorColor) => void;
}

export const BandColorSelector: React.FC<Props> = ({
  bands,
  bandCount,
  roles,
  activeBandIndex,
  onSelectBandIndex,
  onUpdateBandColor,
}) => {
  const activeColor = activeBandIndex !== null ? bands[activeBandIndex] : null;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Band Color Configuration</h3>
          <p className="text-xs text-slate-400">Click a band to inspect or manually override its color</p>
        </div>
        <div className="text-xs font-mono text-cyan-400">
          {bandCount} Bands Active
        </div>
      </div>

      {/* Row of Bands */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {bands.slice(0, bandCount).map((color, idx) => {
          const def = RESISTOR_COLORS[color] || RESISTOR_COLORS.black;
          const role = roles[idx];
          const isSelected = activeBandIndex === idx;

          return (
            <button
              key={idx}
              onClick={() => onSelectBandIndex(idx)}
              className={`flex flex-col items-center p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/50'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="text-[11px] font-mono font-semibold text-slate-400">
                  Band {idx + 1}
                </span>
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-xs"
                  style={{ backgroundColor: def.hex }}
                />
              </div>

              <div
                className="w-full py-1 px-1.5 rounded text-center text-xs font-bold mb-1 shadow-xs"
                style={{
                  backgroundColor: def.hex,
                  color: def.textColor,
                }}
              >
                {def.label}
              </div>

              <span className="text-[10px] text-slate-400 truncate w-full text-center">
                {role ? role.label : ''}
              </span>
              <span className="text-[10px] font-mono text-cyan-400/90 truncate w-full text-center">
                {role ? role.value : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Color Palette Picker for Active Band */}
      {activeBandIndex !== null && (
        <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              Select color for <strong className="text-cyan-400">Band {activeBandIndex + 1}</strong>:
            </span>
            <span className="text-xs font-mono text-slate-400">
              Current: {RESISTOR_COLORS[bands[activeBandIndex]].label}
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
            {COLOR_LIST.map((colorName) => {
              const def = RESISTOR_COLORS[colorName];
              const isCurrent = activeColor === colorName;

              return (
                <button
                  key={colorName}
                  onClick={() => onUpdateBandColor(activeBandIndex, colorName)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-102'
                      : 'border-slate-800/80 hover:border-slate-600 hover:scale-102'
                  }`}
                  style={{
                    backgroundColor: def.hex,
                    color: def.textColor,
                  }}
                  title={`${def.label} (${def.digit !== null ? `Digit: ${def.digit}` : ''}${def.multiplier !== null ? ` ×${def.multiplier}` : ''}${def.tolerance !== null ? ` ±${def.tolerance}%` : ''})`}
                >
                  <span className="text-[11px] font-bold leading-tight drop-shadow-xs">
                    {def.label}
                  </span>
                  {isCurrent && <Check className="w-3 h-3 mt-0.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
