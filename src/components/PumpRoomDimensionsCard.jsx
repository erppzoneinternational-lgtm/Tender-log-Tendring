import React from 'react';
import { 
  Cpu, 
  Layers, 
  Zap, 
  Activity, 
  Ruler, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';

export default function PumpRoomDimensionsCard({
  pumpRoomData,
  onChange,
  filterPumps = [],
  mediaFilters = [],
  chlorinators = [],
  heaters = [],
  lightingList = []
}) {
  const {
    room_type = 'Underground Pit',
    length = 4.0,
    width = 3.0,
    internal_height = 2.4,
    distance_to_pool = 8.0,
    filter_pump_id = '',
    media_filter_id = '',
    chlorinator_id = '',
    heater_id = '',
    lighting_type_id = '',
    lighting_count = 4,
    notes = ''
  } = pumpRoomData || {};

  const numLength = Number(length) || 0;
  const numWidth = Number(width) || 0;
  const numHeight = Number(internal_height) || 0;
  
  const roomFloorArea = numLength * numWidth;
  const roomVolume = roomFloorArea * numHeight;

  // Selected equipment details
  const selectedPump = filterPumps.find(p => p.id === filter_pump_id);
  const selectedFilter = mediaFilters.find(f => f.id === media_filter_id);
  const selectedHeater = heaters.find(h => h.id === heater_id);

  const updateField = (field, value) => {
    onChange({
      ...pumpRoomData,
      [field]: value
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 rounded-2xl text-teal-600 dark:text-teal-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Pump Room Enclosure & MEP Equipment</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Structural pump room layout, filtration sizing & power loads.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 px-3 py-1 rounded-full">
          Pump Room MEP
        </span>
      </div>

      {/* Structural Room Geometry */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-teal-600" />
          <span>Pump Room Structural Dimensions</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Room Type
            </label>
            <select
              value={room_type}
              onChange={(e) => updateField('room_type', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-teal-500"
            >
              <option value="Underground Pit">Underground Pit</option>
              <option value="Surface Pump Room">Surface Pump Room</option>
              <option value="Pre-fab Fiber Enclosure">Pre-fab Fiber Enclosure</option>
              <option value="Basement Vault">Basement Vault</option>
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Length (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={length}
              onChange={(e) => updateField('length', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-teal-500"
              placeholder="4.0"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Width (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={width}
              onChange={(e) => updateField('width', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-teal-500"
              placeholder="3.0"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Internal Height (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={internal_height}
              onChange={(e) => updateField('internal_height', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-teal-500"
              placeholder="2.4"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <label className="text-[10px] font-bold text-slate-500 block mb-1">
              Distance to Pool (m)
            </label>
            <input
              type="number"
              step="0.5"
              value={distance_to_pool}
              onChange={(e) => updateField('distance_to_pool', e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-slate-100 font-bold font-mono focus:outline-none focus:border-teal-500"
              placeholder="8.0"
            />
          </div>

        </div>
      </div>

      {/* Equipment Sizing Matrix */}
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-teal-600" />
          <span>Filtration & MEP Equipment Selection</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Filter Pump */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Filter Pump Sizing (HP / kW / Voltage)
            </label>
            <SearchableSelect
              options={filterPumps.map(p => ({
                id: p.id,
                label: `Pump Code: ${p.filter_pump_code || p.id.slice(0,6)} • ${p.filter_pump_hp} HP (${p.p_kw || '-'} kW) • ${p.operating_voltage || '230'}V`
              }))}
              value={filter_pump_id}
              onChange={(val) => updateField('filter_pump_id', val)}
              placeholder="Select Filter Pump Type..."
            />
            {selectedPump && (
              <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] font-mono flex items-center justify-between text-teal-900 dark:text-teal-300">
                <span>Power: <strong>{selectedPump.filter_pump_hp} HP ({selectedPump.p_kw} kW)</strong></span>
                <span>Current: <strong>{selectedPump.i_230v_a || selectedPump.i_400v_a || '-'} A</strong></span>
              </div>
            )}
          </div>

          {/* Media Filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Media Sand Filter Sizing
            </label>
            <SearchableSelect
              options={mediaFilters.map(f => ({
                id: f.id,
                label: `Filter Code: ${f.filter_code || f.id.slice(0,6)} • Ø${f.filter_dia}mm (Flow: ${f.min_flow_rate} m³/h, Sand: ${f.filter_sand_capacity} kg)`
              }))}
              value={media_filter_id}
              onChange={(val) => updateField('media_filter_id', val)}
              placeholder="Select Sand Filter Type..."
            />
            {selectedFilter && (
              <div className="mt-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-[11px] font-mono flex items-center justify-between text-cyan-900 dark:text-cyan-300">
                <span>Diameter: <strong>Ø{selectedFilter.filter_dia} mm</strong></span>
                <span>Capacity: <strong>{selectedFilter.filter_sand_capacity} kg Sand</strong></span>
              </div>
            )}
          </div>

          {/* Chlorinator */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Chemical Disinfection Feeder
            </label>
            <SearchableSelect
              options={chlorinators.map(c => ({
                id: c.id,
                label: `Tablet Feeder • Capacity: ${c.capacity || 'Standard'} kg`
              }))}
              value={chlorinator_id}
              onChange={(val) => updateField('chlorinator_id', val)}
              placeholder="Select Chlorinator Feeder..."
            />
          </div>

          {/* Heating */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Pool / Spa Heater
            </label>
            <SearchableSelect
              options={heaters.map(h => ({
                id: h.id,
                label: `${h.heater_type || 'Pool Heater'} • Output: ${h.output_kw || '-'} kW`
              }))}
              value={heater_id}
              onChange={(val) => updateField('heater_id', val)}
              placeholder="Select Heater Unit (Optional)..."
            />
          </div>

        </div>
      </div>

      {/* Pump Room Summary Gauges */}
      <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-teal-600" />
            <span>Pump Room Load & Area Summary</span>
          </span>
          <span className="text-[10px] text-slate-500 font-medium font-mono">Structural Layout</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block font-semibold">Pump Room Floor Area</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-black font-mono text-teal-900 dark:text-teal-300">
                {roomFloorArea.toFixed(1)}
              </strong>
              <span className="text-xs text-slate-400 font-mono">m²</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block font-semibold">Enclosure Volume</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-black font-mono text-teal-900 dark:text-teal-300">
                {roomVolume.toFixed(1)}
              </strong>
              <span className="text-xs text-slate-400 font-mono">m³</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block font-semibold">Connected Power</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-black font-mono text-amber-700 dark:text-amber-400">
                {((selectedPump?.p_kw || 0) + (selectedHeater?.output_kw || 0)).toFixed(2)}
              </strong>
              <span className="text-xs text-slate-400 font-mono">kW</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-500 block font-semibold">Pipe Run Distance</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <strong className="text-base font-black font-mono text-cyan-700 dark:text-cyan-400">
                {Number(distance_to_pool || 0).toFixed(1)}
              </strong>
              <span className="text-xs text-slate-400 font-mono">m</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
