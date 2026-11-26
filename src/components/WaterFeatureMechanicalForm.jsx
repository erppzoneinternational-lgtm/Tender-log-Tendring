import React, { useMemo } from 'react';
import { 
  Gauge, 
  Filter, 
  Droplets, 
  Layers, 
  Waves, 
  Wrench, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Boxes,
  Activity,
  Flame,
  Pipette,
  GitFork
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { STATIC_ITEMS_LOOKUP } from '../lib/staticLookup';

export default function WaterFeatureMechanicalForm({
  formData = {},
  onChange,
  proposals = [],
  phases = [],
  wfTechnicalData = [],
  prTechnicalData = [],
  filterPumps = [],
  mediaFilters = [],
  accessories = [],
  mainDrains = [],
  chlorinators = [],
  heaters = [],
  brandsList = [],
  itemsList = []
}) {
  const handleFieldChange = (field, value) => {
    onChange({
      ...formData,
      [field]: value
    });
  };

  const selectedProposalId = formData.tender_log_id || formData.linked_proposal || '';
  const selectedPhaseId = formData.phase_id || formData.linked_phase || '';

  // Fast lookup dictionaries
  const brandsMap = useMemo(() => {
    return Object.fromEntries((brandsList || []).map(b => [b.id, b.title || b.name || '']));
  }, [brandsList]);

  const itemsMap = useMemo(() => {
    return Object.fromEntries((itemsList || []).map(i => [i.id, i]));
  }, [itemsList]);

  // 1. Strictly filter Water Feature phases belonging to selected proposal
  const waterFeaturePhases = useMemo(() => {
    if (!selectedProposalId) return [];
    return phases.filter(p => {
      if (String(p.tender_log_id) !== String(selectedProposalId)) return false;
      const comp = String(p.component_type || '').toLowerCase();
      const title = String(p.phase_title || '').toLowerCase();
      const isPumpRoom = comp.includes('pump') || title.includes('pump room') || title.includes('pump_room');
      return !isPumpRoom;
    });
  }, [phases, selectedProposalId]);

  // 2. Filter available Pump Rooms belonging to selected proposal
  const availablePumpRooms = useMemo(() => {
    if (!selectedProposalId) return [];
    const prPhases = phases.filter(p => {
      if (String(p.tender_log_id) !== String(selectedProposalId)) return false;
      const comp = String(p.component_type || '').toLowerCase();
      const title = String(p.phase_title || '').toLowerCase();
      return comp.includes('pump') || title.includes('pump');
    });

    const prSpecs = prTechnicalData.filter(pr => {
      return String(pr.tender_log_id) === String(selectedProposalId);
    });

    const result = [];
    prPhases.forEach(ph => {
      const matchedSpec = prSpecs.find(s => String(s.phase_id || s.linked_phase || s.id) === String(ph.id));
      result.push({
        id: matchedSpec ? matchedSpec.id : ph.id,
        phase_id: ph.id,
        title: ph.phase_title || 'Pump Room',
        spec: matchedSpec
      });
    });

    prSpecs.forEach(spec => {
      if (!result.some(r => r.id === spec.id || r.phase_id === spec.phase_id)) {
        result.push({
          id: spec.id,
          phase_id: spec.phase_id,
          title: spec.pump_room_name || spec.pump_room_title || 'Pump Room Spec',
          spec
        });
      }
    });

    return result;
  }, [phases, prTechnicalData, selectedProposalId]);

  const selectedPumpRoomIds = useMemo(() => {
    const raw = formData.related_pump_rooms;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(id => typeof id === 'object' ? String(id.id || id.value || '') : String(id));
    if (typeof raw === 'string') {
      try {
        if (raw.startsWith('[')) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed.map(id => typeof id === 'object' ? String(id.id || id.value || '') : String(id));
        }
      } catch (e) {}
      return raw.split(',').map(id => id.replace(/["'\[\]]/g, '').trim()).filter(Boolean);
    }
    return [];
  }, [formData.related_pump_rooms]);

  const handleTogglePumpRoom = (prId) => {
    const exists = selectedPumpRoomIds.includes(String(prId));
    let nextIds;
    if (exists) {
      nextIds = selectedPumpRoomIds.filter(id => id !== String(prId));
    } else {
      nextIds = [...selectedPumpRoomIds, String(prId)];
    }
    handleFieldChange('related_pump_rooms', nextIds);
  };

  // Formatted Dropdown Options
  const filterOptions = useMemo(() => {
    return mediaFilters.map(f => {
      const brand = brandsMap[f.filter_brand] || '';
      const dia = f.filter_dia ? `Ø${f.filter_dia}mm` : '';
      const flow = f.min_flow_rate ? `${f.min_flow_rate} m³/h` : '';
      const code = f.filter_code ? `Code: ${f.filter_code}` : '';
      const item = itemsMap[f.item_id];
      const itemName = item?.item_name || '';
      const label = [brand, 'Sand Filter', dia, flow, code].filter(Boolean).join(' • ') || itemName || `Filter ${f.filter_code}`;
      return { id: f.id, label };
    });
  }, [mediaFilters, brandsMap, itemsMap]);

  const pumpOptions = useMemo(() => {
    return filterPumps.map(p => {
      const brand = brandsMap[p.pump_brand] || '';
      const hp = p.filter_pump_hp ? `${p.filter_pump_hp} HP` : '';
      const kw = p.p_kw ? `${p.p_kw} kW` : '';
      const volt = p.operating_voltage ? `${p.operating_voltage}V` : '';
      const code = p.filter_pump_code ? `Code: ${p.filter_pump_code}` : '';
      const item = itemsMap[p.item_id];
      const itemName = item?.item_name || '';
      const label = [brand, 'Circulation Pump', hp, kw, volt, code].filter(Boolean).join(' • ') || itemName || `Pump ${p.filter_pump_code}`;
      return { id: p.id, label };
    });
  }, [filterPumps, brandsMap, itemsMap]);

  const chlorinatorOptions = useMemo(() => {
    return chlorinators.map(c => {
      const item = itemsMap[c.item_id];
      const cap = c.capacity ? `Capacity: ${c.capacity}` : '';
      const label = item?.item_name || ['Tablet Chlorinator', cap].filter(Boolean).join(' • ');
      return { id: c.id, label };
    });
  }, [chlorinators, itemsMap]);

  const heaterOptions = useMemo(() => {
    return heaters.map(h => {
      const item = itemsMap[h.item_id];
      const brand = brandsMap[h.brand_id] || '';
      const kw = h.output_kw ? `${h.output_kw} kW` : '';
      const label = [brand, 'Pool Heater', kw].filter(Boolean).join(' • ') || item?.item_name || 'Pool Heater';
      return { id: h.id, label };
    });
  }, [heaters, brandsMap, itemsMap]);

  const accessoryOptions = useMemo(() => {
    return accessories.map(a => {
      const item = itemsMap[a.item_id];
      const flow = a.flow_rate ? `${a.flow_rate} m³/h` : '';
      const label = item?.item_name || ['Circulation Inlet Fitting', flow].filter(Boolean).join(' • ');
      return { id: a.id, label };
    });
  }, [accessories, itemsMap]);

  const mainDrainOptions = useMemo(() => {
    return mainDrains.map(d => {
      const item = itemsMap[d.item_id];
      const brand = brandsMap[d.brand_id] || '';
      const flow = d.flowrate ? `${d.flowrate} m³/h` : '';
      const label = [brand, 'Anti-Vortex Main Drain Grille', flow].filter(Boolean).join(' • ') || item?.item_name || 'Main Drain Grille';
      return { id: d.id, label };
    });
  }, [mainDrains, brandsMap, itemsMap]);

  const boqItems = formData.proposal_breakdown_items || [];
  const mechBoqItems = boqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical');
  const totalMechCost = mechBoqItems.reduce((acc, item) => acc + (Number(item.total_cost) || 0), 0);

  const pipeSizes = ['63mm', '75mm', '90mm', '110mm', '160mm', '200mm', '250mm', '315mm'];
  const hdpePipeSizes = ['63mm', '75mm', '90mm', '110mm', '160mm', '200mm'];

  const upvcReducersList = [
    { key: 'upvc_reducer_7563mm', label: '75 / 63 mm Bush' },
    { key: 'upvc_reducer_9075mm', label: '90 / 75 mm Bush' },
    { key: 'upvc_reducer_11063mm', label: '110 / 63 mm Bush' },
    { key: 'upvc_reducer_11075mm', label: '110 / 75 mm Bush' },
    { key: 'upvc_reducer_11090mm', label: '110 / 90 mm Bush' },
    { key: 'upvc_reducer_110160mm', label: '160 / 110 mm Bush' },
    { key: 'upvc_reducer_200160mm', label: '200 / 160 mm Bush' },
    { key: 'upvc_reducer_250200mm', label: '250 / 200 mm Bush' },
    { key: 'upvc_reducer_315250mm', label: '315 / 250 mm Bush' }
  ];

  return (
    <div className="space-y-6">
      
      {/* SECTION 0: PROPOSAL, WATER FEATURE PHASE & RELATED PUMP ROOMS */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 0: Water Feature Phase & Related Pump Room Linkage
            </h3>
            <p className="text-[11px] text-slate-500">
              Select the active proposal, water feature phase, and all associated pump rooms to auto-inherit hydraulic and spatial geometry.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Linked Proposal <span className="text-teal-600">*</span>
            </label>
            <SearchableSelect
              options={proposals.map(p => ({
                id: p.id,
                label: `${p.proposal_number || 'SP.2026'}: ${p.proposal_title || p.proposal_full_title || 'Untitled'}`
              }))}
              value={selectedProposalId}
              onChange={(val) => {
                const matchingPhases = phases.filter(p => p.tender_log_id === val);
                const firstWf = matchingPhases.find(p => !p.component_type?.toLowerCase().includes('pump') && !p.phase_title?.toLowerCase().includes('pump'));
                const prs = matchingPhases.filter(p => p.component_type?.toLowerCase().includes('pump') || p.phase_title?.toLowerCase().includes('pump'));
                onChange({
                  ...formData,
                  tender_log_id: val,
                  linked_proposal: val,
                  phase_id: firstWf ? firstWf.id : '',
                  linked_phase: firstWf ? firstWf.id : '',
                  related_pump_rooms: prs.map(p => p.id)
                });
              }}
              placeholder="Select Proposal..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Water Feature Phase <span className="text-teal-600">*</span>
            </label>
            <SearchableSelect
              options={waterFeaturePhases.map(p => ({
                id: p.id,
                label: `${p.phase_title || 'Water Feature'} (${p.component_type || 'Pool / Feature'})`
              }))}
              value={selectedPhaseId}
              onChange={(val) => {
                const upstream = wfTechnicalData.find(w => String(w.phase_id || w.linked_phase || w.id) === String(val));
                let linkedPrs = formData.related_pump_rooms;
                if (upstream && upstream.related_pump_rooms) {
                  linkedPrs = upstream.related_pump_rooms;
                }
                onChange({
                  ...formData,
                  phase_id: val,
                  linked_phase: val,
                  related_pump_rooms: linkedPrs
                });
              }}
              placeholder={waterFeaturePhases.length > 0 ? "Select Water Feature Phase..." : "No Water Feature phases found for proposal"}
            />
          </div>
        </div>

        {/* RELATED PUMP ROOMS MULTI-SELECT BADGES */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
            Associated / Related Pump Room(s) to this Water Feature
          </label>
          
          {availablePumpRooms.length === 0 ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs text-slate-400 font-medium">
              No pump rooms configured for this tender proposal yet. You can configure pump rooms in the Pump Room portal.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availablePumpRooms.map(pr => {
                const isSelected = selectedPumpRoomIds.includes(String(pr.id)) || (pr.phase_id && selectedPumpRoomIds.includes(String(pr.phase_id)));
                return (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => handleTogglePumpRoom(pr.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      isSelected
                        ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md shadow-teal-950/20 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400/50'
                    }`}
                  >
                    <Boxes className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-teal-500'}`} />
                    <span>{pr.title}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* INHERITED PUMP ROOM DIMENSIONS SUMMARY */}
          {(Number(formData.pump_room_length) > 0 || Number(formData.pump_room_areas) > 0) && (
            <div className="mt-3 p-3 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 rounded-2xl flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300">
                Aggregated PR Geometry:
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                L: <strong>{formData.pump_room_length || '0'}m</strong>
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                W: <strong>{formData.pump_room_width || '0'}m</strong>
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                H: <strong>{formData.pump_room_height || '0'}m</strong>
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Area: <strong>{formData.pump_room_areas || '0'}m²</strong>
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Perimeter: <strong>{formData.pump_room_perimeter || '0'}m</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 1: HYDRAULICS & TURNOVER */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 1: Hydraulics, Turnover & Flow Rate Dimensioning
            </h3>
            <p className="text-[11px] text-slate-500">
              Flow Rate Q = Volume / Turnover Hours and filtration surface area A = Q / v.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Surface Area (m²)</label>
            <input
              type="number"
              value={formData.water_feature_area || ''}
              onChange={(e) => handleFieldChange('water_feature_area', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-right"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Water Volume (m³)</label>
            <input
              type="number"
              value={formData.water_feature_volume || ''}
              onChange={(e) => handleFieldChange('water_feature_volume', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-right"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Turnover Time (Hrs)</label>
            <input
              type="number"
              value={formData.hours_of_filtration || 6}
              onChange={(e) => handleFieldChange('hours_of_filtration', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="6"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Design Flow Q (m³/h)</label>
            <input
              type="text"
              readOnly
              value={formData.water_filtration || '0.00'}
              className="w-full px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-700 rounded-xl font-black font-mono text-right text-teal-800 dark:text-teal-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Filtration Speed (m/h)</label>
            <select
              value={formData.filtration_speed || '40'}
              onChange={(e) => handleFieldChange('filtration_speed', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center"
            >
              <option value="40">40 m³/m²·h (Standard)</option>
              <option value="50">50 m³/m²·h (High Rate)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Req. Filter Area (m²)</label>
            <input
              type="text"
              readOnly
              value={formData.required_filtration_area_m2 || '0.000'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black font-mono text-right text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: SAND MEDIA FILTERS & VACUUM FILTERS */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 2: Primary Sand Media Filters & Vacuum Vessels
            </h3>
            <p className="text-[11px] text-slate-500">
              Select certified sand media filters with brand specifications, flow rate curve, and diameter sizing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Primary Sand Media Filter
            </label>
            <SearchableSelect
              options={filterOptions}
              value={formData.water_filter_code || formData.preferred_water_filter || ''}
              onChange={(val) => handleFieldChange('water_filter_code', val)}
              placeholder="Select Sand Media Filter..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Number of Filters
            </label>
            <input
              type="number"
              value={formData.no_of_water_filter || 1}
              onChange={(e) => handleFieldChange('no_of_water_filter', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Vacuum Media Filter (If Required)
            </label>
            <SearchableSelect
              options={filterOptions}
              value={formData.vacuum_filter_code || ''}
              onChange={(val) => handleFieldChange('vacuum_filter_code', val)}
              placeholder="Select Vacuum Filter..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Vacuum Filters Qty
            </label>
            <input
              type="number"
              value={formData.no_of_vacuum_filter || 0}
              onChange={(e) => handleFieldChange('no_of_vacuum_filter', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: CIRCULATION, VACUUM & SUBMERSIBLE PUMPS */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 3: Circulation, Vacuum & Submersible Drainage Pumps
            </h3>
            <p className="text-[11px] text-slate-500">
              Centrifugal pool circulation pumps, power ratings, duty/standby configurations, and pit sump drainage.
            </p>
          </div>
        </div>

        {/* Primary Circulation Pump */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Filtration Circulation Pump
            </label>
            <SearchableSelect
              options={pumpOptions}
              value={formData.water_filter_pump_code || formData.preferred_water_filter_pump || formData.water_filter_pump || ''}
              onChange={(val) => handleFieldChange('water_filter_pump_code', val)}
              placeholder="Select Circulation Pump..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Duty Pumps
            </label>
            <input
              type="number"
              value={formData.no_of_water_filter_pump || 1}
              onChange={(e) => handleFieldChange('no_of_water_filter_pump', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="1"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Standby Pumps
            </label>
            <input
              type="number"
              value={formData.no_of_water_filter_pump_stand_by || 0}
              onChange={(e) => handleFieldChange('no_of_water_filter_pump_stand_by', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="0"
            />
          </div>
        </div>

        {/* Vacuum Booster Pump */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Vacuum Booster Pump
            </label>
            <SearchableSelect
              options={pumpOptions}
              value={formData.vacuum_filter_pump_code || ''}
              onChange={(val) => handleFieldChange('vacuum_filter_pump_code', val)}
              placeholder="Select Vacuum Pump..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Vac Duty Pumps
            </label>
            <input
              type="number"
              value={formData.no_of_vacuum_filter_pump || 0}
              onChange={(e) => handleFieldChange('no_of_vacuum_filter_pump', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="0"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Vac Standby Pumps
            </label>
            <input
              type="number"
              value={formData.no_of_vacuum_filter_pump_stand_by || 0}
              onChange={(e) => handleFieldChange('no_of_vacuum_filter_pump_stand_by', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="0"
            />
          </div>
        </div>

        {/* Submersible Drainage Pit Pump */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Submersible Pit Drainage Pump
            </label>
            <SearchableSelect
              options={pumpOptions}
              value={formData.submersible_pump_code || ''}
              onChange={(val) => handleFieldChange('submersible_pump_code', val)}
              placeholder="Select Submersible Drainage Pump..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Submersible Pump Qty
            </label>
            <input
              type="number"
              value={formData.no_of_submersible_pump || formData.submersible_pump_qty || 0}
              onChange={(e) => handleFieldChange('no_of_submersible_pump', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: INLETS, SKIMMERS & DRAINS */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 4: Circulation Inlets, Skimmers & Main Drains
            </h3>
            <p className="text-[11px] text-slate-500">
              Inlet returns, anti-vortex main drain grilles, skimmers, and vacuum suction points.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Skimmers Qty</label>
            <input
              type="number"
              value={formData.no_of_skimmer || 0}
              onChange={(e) => handleFieldChange('no_of_skimmer', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Floor Inlets Qty</label>
            <input
              type="number"
              value={formData.no_of_floor_inlets || 0}
              onChange={(e) => handleFieldChange('no_of_floor_inlets', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Wall Inlets Qty</label>
            <input
              type="number"
              value={formData.no_of_wall_inlets || 0}
              onChange={(e) => handleFieldChange('no_of_wall_inlets', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Vacuum Points Qty</label>
            <input
              type="number"
              value={formData.no_of_vacuum_inlets || 0}
              onChange={(e) => handleFieldChange('no_of_vacuum_inlets', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Main Drains Qty</label>
            <input
              type="number"
              value={formData.no_of_main_drain || 1}
              onChange={(e) => handleFieldChange('no_of_main_drain', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Gutter Drains Qty</label>
            <input
              type="number"
              value={formData.no_of_gutter_drain || 0}
              onChange={(e) => handleFieldChange('no_of_gutter_drain', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: CHEMICAL DOSING, MIXING & WATER TREATMENT */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <Pipette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 5: Chemical Dosing, Mixing Tanks & Water Treatment
            </h3>
            <p className="text-[11px] text-slate-500">
              pH/ORP controllers, chemical feeder systems, dosing pumps, electrical stirrers, and mixing tanks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Chemical Dosing Feeder System (pH / Chlorine)
            </label>
            <input
              type="text"
              value={formData.chemical_feeder_code || ''}
              onChange={(e) => handleFieldChange('chemical_feeder_code', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs"
              placeholder="e.g. AstralPool Dual pH/ORP Control Panel"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Dosing System Qty
            </label>
            <input
              type="number"
              value={formData.chemical_feeder_qty || formData.no_of_chemical_feeder || 1}
              onChange={(e) => handleFieldChange('chemical_feeder_qty', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Tablet Chlorinator</label>
            <SearchableSelect
              options={chlorinatorOptions}
              value={formData.tablet_chlorinator_type || ''}
              onChange={(val) => handleFieldChange('tablet_chlorinator_type', val)}
              placeholder="Select Chlorinator..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Chlorinator Qty</label>
            <input
              type="number"
              value={formData.tablet_chlorinator_quantity || 1}
              onChange={(e) => handleFieldChange('tablet_chlorinator_quantity', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Manual Cleaning Sets</label>
            <input
              type="number"
              value={formData.no_of_manual_cleaning_set || 1}
              onChange={(e) => handleFieldChange('no_of_manual_cleaning_set', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Drainage Chamber (2x2x2m)</label>
            <input
              type="number"
              value={formData.drainage_chamber || 1}
              onChange={(e) => handleFieldChange('drainage_chamber', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* SECTION 6: HEATING & TEMPERATURE CONTROL */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 6: Heating & Temperature Control Systems
            </h3>
            <p className="text-[11px] text-slate-500">
              Heat pump calorifiers, gas heaters, and electric thermal exchangers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Heating Equipment Model
            </label>
            <SearchableSelect
              options={heaterOptions}
              value={formData.heater_type || formData.recommended_heater_model || ''}
              onChange={(val) => handleFieldChange('heater_type', val)}
              placeholder="Select Heat Pump / Calorifier..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Heaters Quantity
            </label>
            <input
              type="number"
              value={formData.no_of_heaters || formData.heater_qty || 1}
              onChange={(e) => handleFieldChange('no_of_heaters', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* SECTION 7: PIPING NETWORKS (UPVC & HDPE) */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 7: Pressure Piping Networks (UPVC & HDPE Schedules)
            </h3>
            <p className="text-[11px] text-slate-500">
              Piping network schedules in meters from Ø63mm to Ø315mm for Water Feature, Pump Room, and HDPE supply runs.
            </p>
          </div>
        </div>

        {/* Water Feature UPVC Pipes */}
        <div>
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
            Water Feature UPVC Pressure Pipes (Length in Meters)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {pipeSizes.map(size => (
              <div key={`upvc_${size}`} className="p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-center">
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block mb-1">Ø{size}</span>
                <input
                  type="number"
                  value={formData[`upvc_pipe_${size}`] || ''}
                  onChange={(e) => handleFieldChange(`upvc_pipe_${size}`, e.target.value)}
                  className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-center"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Pump Room UPVC Pipes */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
            Pump Room Internal UPVC Manifolds (Length in Meters)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {pipeSizes.map(size => (
              <div key={`pr_upvc_${size}`} className="p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-center">
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block mb-1">PR Ø{size}</span>
                <input
                  type="number"
                  value={formData[`pump_room_upvc_pipe_${size}`] || ''}
                  onChange={(e) => handleFieldChange(`pump_room_upvc_pipe_${size}`, e.target.value)}
                  className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-center"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* HDPE Supply Pipes */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
            HDPE Underground Feed Networks (Length in Meters)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {hdpePipeSizes.map(size => (
              <div key={`hdpe_${size}`} className="p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-center">
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block mb-1">HDPE Ø{size}</span>
                <input
                  type="number"
                  value={formData[`hdpe_pipe_${size}`] || ''}
                  onChange={(e) => handleFieldChange(`hdpe_pipe_${size}`, e.target.value)}
                  className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-center"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* UPVC Reducer Bushes */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
            UPVC Reducer Bush Fittings (Quantity)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {upvcReducersList.map(red => (
              <div key={red.key} className="p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block mb-1 truncate">{red.label}</span>
                <input
                  type="number"
                  value={formData[red.key] || ''}
                  onChange={(e) => handleFieldChange(red.key, e.target.value)}
                  className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold font-mono text-center"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 8: MECHANICAL VALVES & AUTOMATION */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 8: Mechanical Valves & Water Feature Automation
            </h3>
            <p className="text-[11px] text-slate-500">
              Solenoid auto-fill valves, mechanical float level valves, and electric level switches.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Solenoid Auto-Fill Valves Qty</label>
            <input
              type="number"
              value={formData.no_of_selnoid_valve || 1}
              onChange={(e) => handleFieldChange('no_of_selnoid_valve', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Mechanical Float Valves Qty</label>
            <input
              type="number"
              value={formData.no_of_float_valve || 1}
              onChange={(e) => handleFieldChange('no_of_float_valve', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Electric Float Switches Qty</label>
            <input
              type="number"
              value={formData.no_of_float_switch || 1}
              onChange={(e) => handleFieldChange('no_of_float_switch', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* SECTION 9: SYNCHRONIZED LIVE MECHANICAL MASTER BOQ TABLE */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Synchronized Mechanical BOQ Preview
              </h3>
              <p className="text-[11px] text-slate-500">
                {mechBoqItems.length} mechanical line items generated for this scope.
              </p>
            </div>
          </div>

          <div className="text-sm font-black text-teal-600 dark:text-teal-400 font-mono">
            Total: {Number(totalMechCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-700 dark:text-slate-300">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Trade Category</th>
                <th className="py-2.5 px-4">Equipment / Item Description</th>
                <th className="py-2.5 px-3 text-right">Final Qty</th>
                <th className="py-2.5 px-2 text-center">Unit</th>
                <th className="py-2.5 px-3 text-right">Unit Cost (EGP)</th>
                <th className="py-2.5 px-4 text-right">Total Cost (EGP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {mechBoqItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No mechanical items generated yet. Configure the fields above.
                  </td>
                </tr>
              ) : (
                mechBoqItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[150px]">
                      {item.work_main_category || 'Mechanical'}
                    </td>
                    <td className="py-2 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                      {STATIC_ITEMS_LOOKUP[item.item] || item.item_name || item.fallbackName || item.item}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {item.final_quantity}
                    </td>
                    <td className="py-2 px-2 text-center font-sans font-bold text-slate-500">
                      {item.unit || 'Each'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-600 dark:text-slate-400">
                      {Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-4 text-right font-black text-teal-600 dark:text-teal-400">
                      {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
