import React, { useMemo } from 'react';
import { 
  Waves, 
  Ruler, 
  Calculator
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';

export default function WaterFeatureDimensionsCard({
  featureData,
  onChange,
  categories = [],
  featureTypes = [],
  finishesList = []
}) {
  const {
    category_id = '',
    type_id = '',
    shape = 'Rectangular',
    length = 10,
    width = 5,
    shallow_depth = 1.0,
    deep_depth = 1.8,
    custom_perimeter = '',
    custom_surface_area = '',
    turnover_hours = 4,
    finishes_type_id = '',
    notes = ''
  } = featureData || {};

  // Filter types by selected category
  const filteredTypes = useMemo(() => {
    if (!category_id) return featureTypes;
    return featureTypes.filter(t => t.category_id === category_id);
  }, [category_id, featureTypes]);

  // Calculations
  const numLength = Number(length) || 0;
  const numWidth = Number(width) || 0;
  const numShallow = Number(shallow_depth) || 0;
  const numDeep = Number(deep_depth) || 0;
  const avgDepth = (numShallow + numDeep) / 2;

  // Surface Area & Perimeter
  let surfaceArea = Number(custom_surface_area) || 0;
  let perimeter = Number(custom_perimeter) || 0;

  if (!custom_surface_area) {
    if (shape === 'Rectangular' || shape === 'L-Shape') {
      surfaceArea = numLength * numWidth;
    } else if (shape === 'Circular') {
      const radius = numLength / 2;
      surfaceArea = Math.PI * radius * radius;
    } else {
      surfaceArea = numLength * numWidth * 0.85; // Freeform estimate
    }
  }

  if (!custom_perimeter) {
    if (shape === 'Rectangular') {
      perimeter = 2 * (numLength + numWidth);
    } else if (shape === 'Circular') {
      perimeter = Math.PI * numLength;
    } else {
      perimeter = 2.2 * (numLength + numWidth);
    }
  }

  const waterVolume = surfaceArea * avgDepth;
  const numTurnover = Number(turnover_hours) || 4;
  const requiredFlowRate = numTurnover > 0 ? (waterVolume / numTurnover) : 0;
  const totalWettedSurface = surfaceArea + (perimeter * avgDepth);

  const updateField = (field, value) => {
    onChange({
      ...featureData,
      [field]: value
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl text-cyan-600 dark:text-cyan-400">
            <Waves className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Water Feature Technical Specifications</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Geometric boundaries, water volume & turnover flow rate calculations.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-800 px-3 py-1 rounded-full">
          Hydro Dynamics
        </span>
      </div>

      {/* Classification */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Category */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Water Feature Category <span className="text-cyan-600">*</span>
          </label>
          <SearchableSelect
            options={categories.map(c => ({ id: c.id, label: c.name }))}
            value={category_id}
            onChange={(val) => {
              updateField('category_id', val);
              updateField('type_id', '');
            }}
            placeholder="Select Category (Pool, Lagoon...)"
          />
        </div>

        {/* Type */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Feature Type / System <span className="text-cyan-600">*</span>
          </label>
          <SearchableSelect
            options={filteredTypes.map(t => ({ id: t.id, label: t.name }))}
            value={type_id}
            onChange={(val) => updateField('type_id', val)}
            placeholder={category_id ? "Select Type (Skimmer, Overflow...)" : "Select Category first"}
            disabled={!category_id}
          />
        </div>

        {/* Geometry Shape */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Geometrical Shape
          </label>
          <select
            value={shape}
            onChange={(e) => updateField('shape', e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
          >
            <option value="Rectangular">Rectangular / Linear</option>
            <option value="Freeform">Organic / Freeform</option>
            <option value="Circular">Circular / Oval</option>
            <option value="L-Shape">L-Shape Multi-zone</option>
          </select>
        </div>

      </div>

      {/* Dimensions Matrix Inputs */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-cyan-600" />
          <span>Physical Dimensions & Depths</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Length (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={length}
              onChange={(e) => updateField('length', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 12.0"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Width / Span (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={width}
              onChange={(e) => updateField('width', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 6.0"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Shallow Depth (m)
            </label>
            <input
              type="number"
              step="0.05"
              value={shallow_depth}
              onChange={(e) => updateField('shallow_depth', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 1.00"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Deep Depth (m)
            </label>
            <input
              type="number"
              step="0.05"
              value={deep_depth}
              onChange={(e) => updateField('deep_depth', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 1.80"
            />
          </div>

        </div>
      </div>

      {/* Hydraulic & Filtration Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Turnover Cycle (Hours)
          </label>
          <select
            value={turnover_hours}
            onChange={(e) => updateField('turnover_hours', e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
          >
            <option value={1}>1.0 Hour (Jacuzzi / Spa / Whirlpool)</option>
            <option value={2}>2.0 Hours (Kids Pool / Wading Pool)</option>
            <option value={4}>4.0 Hours (Standard Commercial Pool)</option>
            <option value={6}>6.0 Hours (Standard Private Residential Pool)</option>
            <option value={8}>8.0 Hours (Decorative Water Feature / Fountain)</option>
            <option value={12}>12.0 Hours (Large Scale Artificial Lagoon)</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Finishing & Mosaic Specification
          </label>
          <SearchableSelect
            options={finishesList.map(f => ({ 
              id: f.id, 
              label: `${f.item_type || 'Finish'} - ${f.color || ''} (${f.unit || 'm²'})` 
            }))}
            value={finishes_type_id}
            onChange={(val) => updateField('finishes_type_id', val)}
            placeholder="Select Finishes Material..."
          />
        </div>

      </div>

      {/* Live Calculated Metric Gauges */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-cyan-600" />
            <span>Real-Time Hydraulic Calculations</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium font-mono">Auto-Engineered</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block font-semibold">Surface Area</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-black font-mono text-cyan-900 dark:text-cyan-300">
                {surfaceArea.toFixed(1)}
              </strong>
              <span className="text-xs text-slate-400 font-mono">m²</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block font-semibold">Water Volume</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-black font-mono text-cyan-900 dark:text-cyan-300">
                {waterVolume.toFixed(1)}
              </strong>
              <span className="text-xs text-slate-400 font-mono">m³</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block font-semibold">Required Flow Rate</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-black font-mono text-teal-700 dark:text-teal-400">
                {requiredFlowRate.toFixed(2)}
              </strong>
              <span className="text-xs text-slate-400 font-mono">m³/h</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block font-semibold">Total Wetted Area</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-black font-mono text-purple-700 dark:text-purple-400">
                {totalWettedSurface.toFixed(1)}
              </strong>
              <span className="text-xs text-slate-400 font-mono">m²</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
