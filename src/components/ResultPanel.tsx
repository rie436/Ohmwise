/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Decoded Resistor Value Result Panel
 */

import React from 'react';
import { DecodeResult, formatResistance } from '../lib/resistor';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  result: DecodeResult;
  confidence: 'high' | 'medium' | 'low';
  supportCount: number;
  scanNotes: string[];
}

export const ResultPanel: React.FC<Props> = ({
  result,
  confidence,
  supportCount,
  scanNotes,
}) => {
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
      {/* Top Value Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
            Nominal Decoded Resistance
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl sm:text-5xl font-mono font-bold text-cyan-400 tabular-nums tracking-tight">
              {result.formattedResistance}
            </span>
            <span className="text-xl sm:text-2xl font-mono font-semibold text-slate-300">
              ±{result.tolerancePercent}%
            </span>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {confidence === 'high' ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                High Confidence ({supportCount} Scans)
              </span>
            ) : confidence === 'medium' ? (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Medium Confidence ({supportCount} Scans)
              </span>
            ) : (
              <span className="text-cyan-400 flex items-center gap-1 font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Manual Sampled / Review
              </span>
            )}
          </div>
          {result.matchedSeries && (
            <span className="text-xs text-slate-400 font-mono">
              {result.matchedSeries}
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row: Min/Max Tolerance Range & Temperature Coefficient */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Min Tolerance Bound (-{result.tolerancePercent}%)</div>
          <div className="text-base font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
            {formatResistance(result.minOhms)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Max Tolerance Bound (+{result.tolerancePercent}%)</div>
          <div className="text-base font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
            {formatResistance(result.maxOhms)}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 col-span-2 sm:col-span-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Temperature Coeff. (TCR)</div>
          <div className="text-base font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
            {result.tempCoPpm ? `${result.tempCoPpm} ppm/K` : 'Standard Grade'}
          </div>
        </div>
      </div>

      {/* Band Roles Breakdown Table */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-slate-300">Band Role Decomposition</span>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2 px-3 font-medium">Position</th>
                <th className="py-2 px-3 font-medium">Role</th>
                <th className="py-2 px-3 font-medium">Decoded Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {result.roles.map((role, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-cyan-400 font-bold">Band {idx + 1}</td>
                  <td className="py-2 px-3 text-slate-300">{role.label}</td>
                  <td className="py-2 px-3 text-slate-100 font-semibold">{role.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Notes & Physical Verification Disclaimer */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
        {(scanNotes.length > 0 || result.notes.length > 0) && (
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            {[...scanNotes, ...result.notes].map((note, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="text-cyan-500 font-bold">·</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        )}

        {/* Verification Warning */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Verification Notice:</strong> Lighting, camera white-balance, and specular glare can shift color readings. Always verify estimated values against your physical resistor or circuit schematic.
          </span>
        </div>
      </div>
    </div>
  );
};
