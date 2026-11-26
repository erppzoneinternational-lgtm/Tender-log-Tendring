import React, { useMemo } from 'react';
import { 
  Lightbulb, 
  Zap, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Boxes,
  Waves,
  Shield,
  Maximize2,
  Flame,
  Radio
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { STATIC_ITEMS_LOOKUP } from '../lib/staticLookup';

export default function WaterFeatureElectricalForm({
  formData = {},
  onChange,
  proposals = [],
  phases = [],
  wfTechnicalData = [],
  prTechnicalData = [],
  lightingList = [],
  cablesList = [],
  transformersList = [],
  junctionBoxesList = [],
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
  const lightingOptions = useMemo(() => {
    return lightingList.map(l => {
      const item = itemsMap[l.item_id];
      const brand = brandsMap[l.brand_id] || '';
      const code = l.item_code ? `Code: ${l.item_code}` : '';
      const label = [brand, 'LED Underwater Luminaire', code].filter(Boolean).join(' • ') || item?.item_name || `LED Light ${l.item_code}`;
      return { id: l.id, label };
    });
  }, [lightingList, brandsMap, itemsMap]);

  const transformerOptions = useMemo(() => {
    return transformersList.map(t => {
      const item = itemsMap[t.item_id];
      const brand = brandsMap[t.brand_id] || '';
      const code = t.item_code ? `Code: ${t.item_code}` : '';
      const label = [brand, 'Safety Transformer (220V → 12V/24V)', code].filter(Boolean).join(' • ') || item?.item_name || `Transformer ${t.item_code}`;
      return { id: t.id, label };
    });
  }, [transformersList, brandsMap, itemsMap]);

  const junctionBoxOptions = useMemo(() => {
    return junctionBoxesList.map(j => {
      const item = itemsMap[j.item_id];
      const brand = brandsMap[j.brand_id] || '';
      const code = j.code ? `Code: ${j.code}` : '';
      const depth = j.depth_mm ? `Depth: ${j.depth_mm}mm` : '';
      const label = [brand, 'IP68 Deck Junction Box', code, depth].filter(Boolean).join(' • ') || item?.item_name || `Junction Box ${j.code}`;
      return { id: j.id, label };
    });
  }, [junctionBoxesList, brandsMap, itemsMap]);

  const boqItems = formData.proposal_breakdown_items || [];
  const elecBoqItems = boqItems.filter(i => (i.work_type || '').toLowerCase() === 'electrical');
  const totalElecCost = elecBoqItems.reduce((acc, item) => acc + (Number(item.total_cost) || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* SECTION 0: PROPOSAL, WATER FEATURE PHASE & RELATED PUMP ROOMS */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 0: Water Feature Phase & Related Pump Room Linkage
            </h3>
            <p className="text-[11px] text-slate-500">
              Select the active proposal, water feature phase, and associated pump rooms to auto-inherit perimeter and cable routing pathing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Linked Proposal <span className="text-amber-600">*</span>
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
              Water Feature Phase <span className="text-amber-600">*</span>
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
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950/20 font-black'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400/50'
                    }`}
                  >
                    <Boxes className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-500'}`} />
                    <span>{pr.title}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* INHERITED PUMP ROOM DIMENSIONS SUMMARY */}
          {(Number(formData.pump_room_length) > 0 || Number(formData.pump_room_areas) > 0) && (
            <div className="mt-3 p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
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

      {/* SECTION 1: UNDERWATER LED LIGHTING & NICHE BACKBOXES */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 1: Underwater LED Lighting & Niche Backboxes
            </h3>
            <p className="text-[11px] text-slate-500">
              Lighting density rule: N_lights = max(1, ceil(P_WF / 10m)) with embedded concrete backboxes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Underwater LED Light Model
            </label>
            <SearchableSelect
              options={lightingOptions}
              value={formData.underwater_light_type || formData.water_feature_lighting_code || ''}
              onChange={(val) => handleFieldChange('underwater_light_type', val)}
              placeholder="Select Underwater LED Luminaire..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Number of Fixtures
            </label>
            <input
              type="number"
              value={formData.qty_lights || 1}
              onChange={(e) => handleFieldChange('qty_lights', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Lighting Embedded Niche Backbox
            </label>
            <input
              type="text"
              value={formData.water_feature_lighting_backbox || ''}
              onChange={(e) => handleFieldChange('water_feature_lighting_backbox', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs"
              placeholder="e.g. AstralPool Concrete Niche Backbox"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Cable Length Per Light (m)
            </label>
            <input
              type="number"
              value={formData.electric_cable_length_per_one_lighting || 5}
              onChange={(e) => handleFieldChange('electric_cable_length_per_one_lighting', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: TRANSFORMERS & FEEDER CONDUITS */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 2: Step-Down Transformers & Power Distribution Feeds
            </h3>
            <p className="text-[11px] text-slate-500">
              Safety isolating transformers (220V → 12V/24V) with primary feeding and secondary output branch conduit raceways.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Step-Down Safety Transformer
            </label>
            <SearchableSelect
              options={transformerOptions}
              value={formData.transformer_type || ''}
              onChange={(val) => handleFieldChange('transformer_type', val)}
              placeholder="Select Step-Down Transformer..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
              Transformer Qty
            </label>
            <input
              type="number"
              value={formData.transformer_qty || 1}
              onChange={(e) => handleFieldChange('transformer_qty', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
              placeholder="1"
            />
          </div>
        </div>

        {/* Feeding & Output Conduits */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Primary Feed (m)</label>
            <input
              type="text"
              readOnly
              value={formData.transfomer_feeding_cable_length || '30'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Output Lines Count</label>
            <input
              type="text"
              readOnly
              value={formData.no_of_output_electric_line_cables || '1'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Secondary Feed (m)</label>
            <input
              type="text"
              readOnly
              value={formData.transfomer_output_cable_length || '35'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Deck Junction Boxes</label>
            <input
              type="number"
              value={formData.junction_box_qty || formData.qty_lights || 1}
              onChange={(e) => handleFieldChange('junction_box_qty', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
            Deck IP68 Waterproof Junction Box Model
          </label>
          <SearchableSelect
            options={junctionBoxOptions}
            value={formData.junction_box_type || ''}
            onChange={(val) => handleFieldChange('junction_box_type', val)}
            placeholder="Select IP68 Deck Junction Box..."
          />
        </div>
      </div>

      {/* SECTION 3: CABLE TRAY RACEWAY & SUPPORTS */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 3: Cable Tray Raceway & Suspensions
            </h3>
            <p className="text-[11px] text-slate-500">
              L_tray = ceil((L_PR + W_PR) * 1.15) with automatic splice couplers & C-channel brackets.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Tray Length (m)</label>
            <input
              type="text"
              readOnly
              value={formData.main_cable_tray_length_m || '0'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Splice Plates Qty</label>
            <input
              type="text"
              readOnly
              value={formData.splice_plate_quantity || '0'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">C-Channels Qty</label>
            <input
              type="text"
              readOnly
              value={formData.main_cable_tray_c_channel_quantity || '0'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Drop Anchors Qty</label>
            <input
              type="text"
              readOnly
              value={formData.main_cable_tray_anchors_quantity || '0'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">90° Elbows Qty</label>
            <input
              type="text"
              readOnly
              value={formData.main_cable_tray_vertical_elbow_90_quantity || '2'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">End Caps Qty</label>
            <input
              type="text"
              readOnly
              value={formData.end_cap_qty_quantity || '2'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: EARTHING & GROUNDING */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 4: Earthing & Lightning Protection System
            </h3>
            <p className="text-[11px] text-slate-500">
              Copper-bonded earth rods 5/8" x 3m and bare copper ring conductor.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Earth Rods Qty (5/8" x 3m)</label>
            <input
              type="number"
              value={formData.no_of_earthing_rods_qty || 2}
              onChange={(e) => handleFieldChange('no_of_earthing_rods_qty', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Bare Copper Grounding Cable (m)</label>
            <input
              type="text"
              readOnly
              value={formData.total_earthing_cable_length_m || '0'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black font-mono text-right text-emerald-600 dark:text-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: PUMP ROOM INTERNAL MEP SERVICES & SAFETY */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
              Section 5: Pump Room Internal MEP Services, Lighting & Safety
            </h3>
            <p className="text-[11px] text-slate-500">
              IP65 Tri-proof LED luminaires, EMT raceways, weatherproof switches, IP66 power sockets, and fire extinguishers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Tri-Proof LED Lights</label>
            <input
              type="number"
              value={formData.pump_room_lighting_quantity || 2}
              onChange={(e) => handleFieldChange('pump_room_lighting_quantity', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">EMT Conduit (m)</label>
            <input
              type="text"
              readOnly
              value={formData.pump_room_lighting_cable_emt_conduit_length_m || '12'}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-slate-700 dark:text-slate-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Service Sockets IP66</label>
            <input
              type="number"
              value={formData.service_socket_qty || 2}
              onChange={(e) => handleFieldChange('service_socket_qty', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">Fire Extinguishers</label>
            <input
              type="number"
              value={formData.no_of_fire_extinguisher || 1}
              onChange={(e) => handleFieldChange('no_of_fire_extinguisher', e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* SECTION 6: SYNCHRONIZED LIVE ELECTRICAL MASTER BOQ TABLE */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Synchronized Electrical BOQ Preview
              </h3>
              <p className="text-[11px] text-slate-500">
                {elecBoqItems.length} electrical line items generated for this scope.
              </p>
            </div>
          </div>

          <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
            Total: {Number(totalElecCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
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
              {elecBoqItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No electrical items generated yet. Configure the fields above.
                  </td>
                </tr>
              ) : (
                elecBoqItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[150px]">
                      {item.work_main_category || 'Electrical'}
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
                    <td className="py-2 px-4 text-right font-black text-amber-600 dark:text-amber-400">
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
