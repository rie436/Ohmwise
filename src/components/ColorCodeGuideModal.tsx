/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Resistor Color Code Interactive Guide & Reference Table
 */

import React from 'react';
import { COLOR_LIST, RESISTOR_COLORS } from '../lib/resistor';
import { X, BookOpen, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ColorCodeGuideModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                EIA / IEC 60062 Resistor Color Code Guide
              </h3>
              <p className="text-xs text-slate-400">
                Official standard reference for 3, 4, 5, and 6-band axial resistors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 flex flex-col gap-6 overflow-y-auto text-sm text-slate-300">
          {/* Main Color Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-300 font-mono border-b border-slate-700">
                    <th className="py-2.5 px-3">Color Band</th>
                    <th className="py-2.5 px-3">1st Digit</th>
                    <th className="py-2.5 px-3">2nd Digit</th>
                    <th className="py-2.5 px-3">3rd Digit (5/6-Band)</th>
                    <th className="py-2.5 px-3">Multiplier (10ⁿ)</th>
                    <th className="py-2.5 px-3">Tolerance</th>
                    <th className="py-2.5 px-3">Temp. Coeff (6-Band)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {COLOR_LIST.map((colorName) => {
                    const def = RESISTOR_COLORS[colorName];
                    return (
                      <tr key={colorName} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 flex items-center gap-2 font-sans font-medium text-slate-200">
                          <span
                            className="w-4 h-4 rounded-full border border-black/30 shrink-0 shadow-xs"
                            style={{ backgroundColor: def.hex }}
                          />
                          <span>{def.label}</span>
                        </td>
                        <td className="py-2 px-3">{def.digit !== null ? def.digit : '—'}</td>
                        <td className="py-2 px-3">{def.digit !== null ? def.digit : '—'}</td>
                        <td className="py-2 px-3">{def.digit !== null ? def.digit : '—'}</td>
                        <td className="py-2 px-3 text-cyan-400">
                          {def.multiplier !== null ? `×${def.multiplier}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-emerald-400">
                          {def.tolerance !== null ? `±${def.tolerance}%` : '—'}
                        </td>
                        <td className="py-2 px-3 text-amber-400">
                          {def.tempCo !== null ? `${def.tempCo} ppm/K` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-900/40 text-slate-400">
                    <td className="py-2 px-3 italic font-sans">None (3-band)</td>
                    <td className="py-2 px-3">—</td>
                    <td className="py-2 px-3">—</td>
                    <td className="py-2 px-3">—</td>
                    <td className="py-2 px-3">—</td>
                    <td className="py-2 px-3 text-emerald-400">±20%</td>
                    <td className="py-2 px-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Reading Direction & Identification Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-cyan-400">How to Determine Reading Direction</h4>
              <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                <li>
                  <strong className="text-slate-200">The Gap:</strong> The tolerance band is separated from the other bands by a noticeably wider gap. Read starting from the clustered side.
                </li>
                <li>
                  <strong className="text-slate-200">Gold & Silver:</strong> Gold and Silver are multipliers ($0.1$ and $0.01$) or tolerances ($\pm 5\%$ and $\pm 10\%$). They are <em>never</em> the first significant digit. If you see Gold or Silver on the far left, the resistor is flipped!
                </li>
                <li>
                  <strong className="text-slate-200">End proximity:</strong> The first significant digit band is usually printed closer to the lead edge than the tolerance band.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-cyan-400">Band Role Conventions</h4>
              <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                <li>
                  <strong className="text-slate-200">3 Bands:</strong> 2 significant digits + multiplier. Default tolerance of $\pm 20\%$.
                </li>
                <li>
                  <strong className="text-slate-200">4 Bands:</strong> 2 significant digits + multiplier + tolerance (most common carbon-film).
                </li>
                <li>
                  <strong className="text-slate-200">5 Bands:</strong> 3 significant digits + multiplier + tolerance (high-precision metal-film).
                </li>
                <li>
                  <strong className="text-slate-200">6 Bands:</strong> 3 significant digits + multiplier + tolerance + temperature coefficient (TCR in ppm/K).
                </li>
              </ul>
            </div>
          </div>

          {/* Popular Mnemonic */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col gap-1 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Color Mnemonic:</span>
            <span className="font-mono text-cyan-300">
              <strong>B</strong>lack, <strong>B</strong>rown, <strong>R</strong>ed, <strong>O</strong>range, <strong>Y</strong>ellow, <strong>G</strong>reen, <strong>B</strong>lue, <strong>V</strong>iolet, <strong>G</strong>ray, <strong>W</strong>hite
            </span>
            <span className="text-slate-400 italic">
              "Better Be Right Or Your Great Big Venture Goes Wrong" (0 through 9)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
