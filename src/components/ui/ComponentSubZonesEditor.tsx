import React, { useState } from 'react';
import { Layers, Plus, Trash2 } from 'lucide-react';
import type { ComponentSubZone } from '@/types/database';
import { formatNumber, summarizeComponentSubZones } from '@/lib/formulas';

export interface ComponentSubZonesEditorProps {
  subZones: ComponentSubZone[] | null | undefined;
  currentAreaM2?: number | null;
  currentAvgDepthM?: number | null;
  onChange: (next: {
    sub_zones: ComponentSubZone[] | null;
    each_area_m2: number;
    each_avg_depth_m: number;
    each_volume_m3: number;
    volume_is_manual: boolean;
  }) => void;
}

function makeZoneId(): string {
  return `zone-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const ComponentSubZonesEditor: React.FC<ComponentSubZonesEditorProps> = ({
  subZones,
  currentAreaM2,
  currentAvgDepthM,
  onChange,
}) => {
  const isEnabled = Array.isArray(subZones) && subZones.length > 0;
  const [depthMode, setDepthMode] = useState<'weighted' | 'simple'>('weighted');

  const emitZones = (
    rawZones: ComponentSubZone[],
    mode: 'weighted' | 'simple' = depthMode
  ) => {
    const rollup = summarizeComponentSubZones(rawZones);
    const avgDepth =
      mode === 'weighted' ? rollup.weighted_avg_depth_m : rollup.simple_avg_depth_m;
    onChange({
      sub_zones: rollup.zones,
      each_area_m2: rollup.sum_area_m2,
      each_avg_depth_m: avgDepth,
      each_volume_m3: rollup.sum_volume_m3,
      volume_is_manual: true,
    });
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      const seedArea = Math.max(0, Number(currentAreaM2) || 0);
      const seedDepth = Math.max(0, Number(currentAvgDepthM) || 1.4);
      const initial: ComponentSubZone[] = [
        {
          id: makeZoneId(),
          label: 'Piece 1',
          area_m2: seedArea,
          depth_m: seedDepth,
          volume_m3: Number((seedArea * seedDepth).toFixed(2)),
        },
        {
          id: makeZoneId(),
          label: 'Piece 2',
          area_m2: 0,
          depth_m: seedDepth,
          volume_m3: 0,
        },
      ];
      emitZones(initial, depthMode);
    } else {
      const safeArea = Math.max(0, Number(currentAreaM2) || 0);
      const safeDepth = Math.max(0, Number(currentAvgDepthM) || 0);
      onChange({
        sub_zones: null,
        each_area_m2: safeArea,
        each_avg_depth_m: safeDepth,
        each_volume_m3: Number((safeArea * safeDepth).toFixed(2)),
        volume_is_manual: false,
      });
    }
  };

  const zones = isEnabled ? subZones : [];
  const rollup = summarizeComponentSubZones(zones);
  const activeAvgDepth =
    depthMode === 'weighted' ? rollup.weighted_avg_depth_m : rollup.simple_avg_depth_m;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] bg-slate-50/70 dark:bg-[#0B1218]/80 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="w-4 h-4 rounded accent-brand-500 cursor-pointer"
          />
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Layers className="w-3.5 h-3.5 text-brand-500" />
            Divide into Pieces / Sub-Zones{' '}
            <span className="font-normal text-slate-400">
              (Optional — Lagoons, Lakes & Multi-Depth Basins)
            </span>
          </span>
        </label>

        {isEnabled && (
          <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] p-0.5 text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => {
                setDepthMode('weighted');
                emitZones(zones, 'weighted');
              }}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                depthMode === 'weighted'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Weighted Average Depth = Total Volume ÷ Total Area"
            >
              Weighted Avg (ΣV÷ΣA)
            </button>
            <button
              type="button"
              onClick={() => {
                setDepthMode('simple');
                emitZones(zones, 'simple');
              }}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                depthMode === 'simple'
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Simple Average Depth = Sum of Depths ÷ Number of Pieces"
            >
              Simple Avg Depth
            </button>
          </div>
        )}
      </div>

      {isEnabled && (
        <div className="space-y-2.5">
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B1218] border-b border-slate-200 dark:border-[#1E2D3D] text-[10px] font-bold uppercase text-slate-500">
                  <th className="py-1.5 px-2 w-8">#</th>
                  <th className="py-1.5 px-2 min-w-[130px]">Piece / Zone Name</th>
                  <th className="py-1.5 px-2 text-right min-w-[100px]">Area (m²)</th>
                  <th className="py-1.5 px-2 text-right min-w-[100px]">Depth (m)</th>
                  <th className="py-1.5 px-2 text-right min-w-[110px]">
                    Volume (m³)
                  </th>
                  <th className="py-1.5 px-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D]">
                {rollup.zones.map((z, idx) => (
                  <tr key={z.id}>
                    <td className="py-1.5 px-2 font-mono text-[11px] text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        placeholder={`Piece ${idx + 1}`}
                        value={zones[idx]?.label ?? z.label}
                        onChange={(e) => {
                          const next = zones.map((item, i) =>
                            i === idx ? { ...item, label: e.target.value } : item
                          );
                          emitZones(next);
                        }}
                        className="w-full rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2 py-1 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={zones[idx]?.area_m2 ?? 0}
                        onChange={(e) => {
                          const area = Math.max(0, Number(e.target.value) || 0);
                          const next = zones.map((item, i) =>
                            i === idx ? { ...item, area_m2: area } : item
                          );
                          emitZones(next);
                        }}
                        className="w-full text-right rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2 py-1 font-mono text-xs"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        min={0}
                        step="0.05"
                        value={zones[idx]?.depth_m ?? 0}
                        onChange={(e) => {
                          const depth = Math.max(0, Number(e.target.value) || 0);
                          const next = zones.map((item, i) =>
                            i === idx ? { ...item, depth_m: depth } : item
                          );
                          emitZones(next);
                        }}
                        className="w-full text-right rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2 py-1 font-mono text-xs"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-brand-600 dark:text-brand-300">
                      {formatNumber(z.volume_m3, 2)} m³
                    </td>
                    <td className="py-1.5 px-2 text-center">
                      {zones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = zones.filter((_, i) => i !== idx);
                            emitZones(next);
                          }}
                          title="Remove Piece"
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                const nextIdx = zones.length + 1;
                const defaultDepth =
                  zones[zones.length - 1]?.depth_m ??
                  Math.max(0, Number(currentAvgDepthM) || 1.4);
                const next: ComponentSubZone[] = [
                  ...zones,
                  {
                    id: makeZoneId(),
                    label: `Piece ${nextIdx}`,
                    area_m2: 0,
                    depth_m: defaultDepth,
                    volume_m3: 0,
                  },
                ];
                emitZones(next);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-[11px] font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Piece / Zone
            </button>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono bg-white dark:bg-[#111C28] border border-brand-500/25 rounded-lg px-3 py-1">
              <span>
                <span className="text-slate-400 font-sans">Σ Area:</span>{' '}
                <strong className="text-slate-900 dark:text-white">
                  {formatNumber(rollup.sum_area_m2, 2)} m²
                </strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>
                <span className="text-slate-400 font-sans">Avg Depth:</span>{' '}
                <strong className="text-slate-900 dark:text-white">
                  {formatNumber(activeAvgDepth, 2)} m
                </strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>
                <span className="text-slate-400 font-sans">Σ Volume:</span>{' '}
                <strong className="text-brand-600 dark:text-brand-300">
                  {formatNumber(rollup.sum_volume_m3, 2)} m³
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
