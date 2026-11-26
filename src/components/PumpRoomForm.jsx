import React from 'react';
import { 
  Cpu, 
  Ruler, 
  Layers, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import StyledSelect from './StyledSelect';

export default function PumpRoomForm({
  formData = {},
  onChange,
  proposals = [],
  phases = [],
  pumpRoomPhases = []
}) {
  const {
    tender_log_id = '',
    linked_phase = '',
    pump_room_length_m = '',
    pump_room_width_m = '',
    pump_room_height_m = '',
    pump_room_area_m2 = '',
    pump_room_perimeter_m = '',
    sumpit_area_m2 = '',
    sumpit_perimeter_m = '',
    sumpit_height_m = '',
    balance_tank_length_m = '',
    balance_tank_width_m = '',
    balance_tank_height_m = '',
    balance_tank_area_m2 = '',
    balance_tank_perimeter_m = '',
    balance_tank_volume_m3 = '',
    accommodations_required = 'No'
  } = formData || {};

  const handleFieldChange = (field, value) => {
    const updated = {
      ...formData,
      [field]: value
    };

    // Auto-calculate Room Specs
    const pL = field === 'pump_room_length_m' ? value : updated.pump_room_length_m;
    const pW = field === 'pump_room_width_m' ? value : updated.pump_room_width_m;
    if (pL !== '' || pW !== '') {
      const len = Number(pL) || 0;
      const wid = Number(pW) || 0;
      if (len > 0 && wid > 0) {
        updated.pump_room_area_m2 = Number((len * wid).toFixed(2));
        updated.pump_room_perimeter_m = Number((2 * (len + wid)).toFixed(2));
      }
    }

    // Auto-calculate Balance Tank Specs
    const btL = field === 'balance_tank_length_m' ? value : updated.balance_tank_length_m;
    const btW = field === 'balance_tank_width_m' ? value : updated.balance_tank_width_m;
    const btH = field === 'balance_tank_height_m' ? value : updated.balance_tank_height_m;
    if (btL !== '' || btW !== '' || btH !== '') {
      const btLen = Number(btL) || 0;
      const btWid = Number(btW) || 0;
      const btHgt = Number(btH) || 0;
      if (btLen > 0 && btWid > 0) {
        updated.balance_tank_area_m2 = Number((btLen * btWid).toFixed(2));
        updated.balance_tank_perimeter_m = Number((2 * (btLen + btWid)).toFixed(2));
        if (btHgt > 0) {
          updated.balance_tank_volume_m3 = Number((btLen * btWid * btHgt).toFixed(2));
        }
      }
    }

    onChange(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION 0: Linkage */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <span>Section 0: Proposal & Phase Linkage</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Active Tender Proposal <span className="text-teal-600">*</span>
            </label>
            <SearchableSelect
              options={proposals.map(p => ({
                id: p.id,
                label: `${p.proposal_number || 'SP.2026'}: ${p.proposal_title || p.proposal_full_title || 'Untitled'}`
              }))}
              value={tender_log_id}
              onChange={(val) => {
                const matchingPhases = phases ? phases.filter(p => p.tender_log_id === val) : [];
                const firstPhase = matchingPhases.find(p => p.component_type === 'Pump Room') || matchingPhases[0];
                onChange({
                  ...formData,
                  tender_log_id: val,
                  linked_phase: firstPhase ? firstPhase.id : ''
                });
              }}
              placeholder="Select Tender Proposal..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Linked Pump Room Phase <span className="text-teal-600">*</span>
            </label>
            <SearchableSelect
              options={pumpRoomPhases.map(ph => ({
                id: ph.id,
                label: `${ph.phase_title || 'Phase'} ${ph.component_type ? `(${ph.component_type})` : ''}`
              }))}
              value={linked_phase}
              onChange={(val) => handleFieldChange('linked_phase', val)}
              disabled={!tender_log_id}
              placeholder={
                !tender_log_id 
                  ? "Select Tender Proposal first..." 
                  : (pumpRoomPhases.length > 0 ? "Select Pump Room Phase..." : "No phases found for this proposal")
              }
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: Main Pump Room Geometry */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <span>Section 1: Main Pump Room Geometry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Pump Room Length (m) <span className="text-teal-600">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 4.0"
              value={pump_room_length_m}
              onChange={(e) => handleFieldChange('pump_room_length_m', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Pump Room Width (m) <span className="text-teal-600">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 3.0"
              value={pump_room_width_m}
              onChange={(e) => handleFieldChange('pump_room_width_m', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Pump Room Height (m) <span className="text-teal-600">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 2.5"
              value={pump_room_height_m}
              onChange={(e) => handleFieldChange('pump_room_height_m', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Room Area (m²) <span className="text-teal-600 text-[10px]">[Auto: L × W]</span>
            </label>
            <input
              type="number"
              readOnly
              value={pump_room_area_m2}
              placeholder="Auto"
              className="w-full px-3 py-2 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-mono font-black text-teal-900 dark:text-teal-300"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Room Perimeter (m) <span className="text-teal-600 text-[10px]">[Auto]</span>
            </label>
            <input
              type="number"
              readOnly
              value={pump_room_perimeter_m}
              placeholder="Auto"
              className="w-full px-3 py-2 bg-teal-50/50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-mono font-black text-teal-900 dark:text-teal-300"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Sump Pit (Drainage Pit) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>Section 2: Sump Pit (Drainage Pit)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Sump Pit Footprint Area (m²)
            </label>
            <input
              type="number"
              step="0.05"
              placeholder="e.g. 1.0"
              value={sumpit_area_m2}
              onChange={(e) => handleFieldChange('sumpit_area_m2', e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Sump Pit Formwork Perimeter (m)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 4.0"
              value={sumpit_perimeter_m}
              onChange={(e) => handleFieldChange('sumpit_perimeter_m', e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Sump Pit Depth Below Slab (m)
            </label>
            <input
              type="number"
              step="0.05"
              placeholder="e.g. 1.0"
              value={sumpit_height_m}
              onChange={(e) => handleFieldChange('sumpit_height_m', e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Balance Tank (Surge Storage) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Section 3: Balance Tank (Surge Storage)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Tank Length (m)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 3.0"
              value={balance_tank_length_m}
              onChange={(e) => handleFieldChange('balance_tank_length_m', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Tank Width (m)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 2.0"
              value={balance_tank_width_m}
              onChange={(e) => handleFieldChange('balance_tank_width_m', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Tank Height (m)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 2.0"
              value={balance_tank_height_m}
              onChange={(e) => handleFieldChange('balance_tank_height_m', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Tank Area (m²) <span className="text-purple-600 text-[10px]">[Auto]</span>
            </label>
            <input
              type="number"
              readOnly
              value={balance_tank_area_m2}
              placeholder="Auto"
              className="w-full px-3 py-2 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-mono font-bold text-purple-900 dark:text-purple-300"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Tank Perimeter (m) <span className="text-purple-600 text-[10px]">[Auto]</span>
            </label>
            <input
              type="number"
              readOnly
              value={balance_tank_perimeter_m}
              placeholder="Auto"
              className="w-full px-3 py-2 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-mono font-bold text-purple-900 dark:text-purple-300"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5 truncate">
              Tank Volume (m³) <span className="text-emerald-600 text-[10px]">[Auto]</span>
            </label>
            <input
              type="number"
              readOnly
              value={balance_tank_volume_m3}
              placeholder="Auto"
              className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-mono font-black text-emerald-900 dark:text-emerald-300"
            />
          </div>
        </div>

        <div className="pt-2 w-full sm:w-72">
          <StyledSelect
            label="Site Accommodations Required"
            value={accommodations_required}
            onChange={(acc) => handleFieldChange('accommodations_required', acc)}
            options={[
              { id: 'No', label: 'No' },
              { id: 'Yes', label: 'Yes' }
            ]}
          />
        </div>

      </div>

    </div>
  );
}
