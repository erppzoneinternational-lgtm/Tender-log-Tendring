import React, { useMemo, useEffect } from 'react';
import { 
  Hammer, 
  Layers, 
  Ruler, 
  ShieldCheck, 
  Truck, 
  Calculator,
  CheckCircle2, 
  AlertCircle,
  Building2,
  HardHat,
  RotateCcw,
  Sparkles,
  DollarSign,
  Calendar,
  Users,
  Droplets,
  Palette
} from 'lucide-react';
import StyledSelect from './StyledSelect';
import SearchableSelect from './SearchableSelect';
import { calculateWaterFeatureFinishes } from '../utils/engine/modules/waterFeatureFinishesCalc';
import { buildWaterFeatureFinishesBoq } from '../utils/engine/modules/waterFeatureFinishesBoqBuilder';
import { 
  STATIC_ITEMS_LOOKUP, 
  STATIC_WF_CATEGORIES_LOOKUP, 
  STATIC_WF_TYPES_LOOKUP, 
  isWfLagoon,
  resolveCategoryName
} from '../lib/staticLookup';

// Reusable itemized BOQ Breakdown Table Component (Sorted High to Low Cost)
function SectionBoqTable({ items = [], emptyMessage = "No active line items for this section." }) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (Number(b.total_cost) || 0) - (Number(a.total_cost) || 0));
  }, [items]);

  const sectionTotalCost = useMemo(() => {
    return sortedItems
      .filter(it => it.activity_responsibility !== 'Client')
      .reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
  }, [sortedItems]);

  if (sortedItems.length === 0) {
    return (
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400 font-medium">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <th className="py-2.5 px-3 w-8 text-center">#</th>
            <th className="py-2.5 px-3">Item / Trade Description</th>
            <th className="py-2.5 px-2 text-center">Type</th>
            <th className="py-2.5 px-2 text-center">Resp</th>
            <th className="py-2.5 px-3 text-right">Base Qty</th>
            <th className="py-2.5 px-2 text-right">Extra %</th>
            <th className="py-2.5 px-3 text-right">Final Qty</th>
            <th className="py-2.5 px-2 text-center">Unit</th>
            <th className="py-2.5 px-3 text-right">Unit Cost (EGP)</th>
            <th className="py-2.5 px-3 text-right">Total Cost (EGP)</th>
            <th className="py-2.5 px-2 text-center">Days</th>
            <th className="py-2.5 px-2 text-center">Labor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
          {sortedItems.map((it, idx) => (
            <tr key={it.id || it._spawnerid || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
              <td className="py-2 px-3 text-slate-400 text-center font-sans">{idx + 1}</td>
              <td className="py-2 px-3 font-bold font-sans text-slate-800 dark:text-slate-200">{STATIC_ITEMS_LOOKUP[it.item] || it.item_name || it.item}</td>
              <td className="py-2 px-2 text-center">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-sans ${
                  it.activity_type === 'Installation' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  it.activity_type === 'Accommodation' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {it.activity_type || 'Procurement'}
                </span>
              </td>
              <td className="py-2 px-2 text-center font-sans text-[10px] text-slate-500">
                {it.activity_responsibility || 'P.Zone'}
              </td>
              <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                {Number(it.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">
                {it.extra_amount_percentage ? `+${it.extra_amount_percentage}%` : '0%'}
              </td>
              <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                {Number(it.final_quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-2 text-center font-sans font-bold text-slate-500">{it.unit}</td>
              <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                {it.unit_cost ? Number(it.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
              </td>
              <td className="py-2 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                {it.total_cost ? Number(it.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </td>
              <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-400">
                {it.days_to_complete || '—'}
              </td>
              <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-400">
                {it.total_laborers_per_day || it.laborers_per_group || '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 font-mono text-xs">
            <td colSpan={9} className="py-2 px-3 text-right font-sans font-black uppercase text-[10px] tracking-wider text-slate-600 dark:text-slate-300">
              Section Total ({sortedItems.length} items):
            </td>
            <td className="py-2 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
              {sectionTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td colSpan={2}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function WaterFeatureFinishesForm({
  formData = {},
  onChange,
  proposals = [],
  phases = [],
  wfDataEntries = [],
  categories = [],
  featureTypes = [],
  materials = [],
  brands = [],
  clients = [],
  regions = [],
  items = [],
  itemCategories = [],
  finishesTypes = [],
  finishesCategories = []
}) {
  const {
    id = null,
    linked_phase = '',
    phase_id = '',
    linked_proposal = '',
    tender_log_id = '',
    project_owner = '',
    main_contractor = '',
    civil_consultant = '',
    region = '',
    accommodations_required = 'No',

    // SECTION 2: SS LADDERS
    ladder_2_steps_no = 0,
    ladder_3_steps_no = 0,
    ladder_4_steps_no = 0,
    ladder_5_steps_no = 0,
    qty_ladder_no_erp = 0,
    qty_ladder_no_user = 0,

    // SECTION 3: PLASTERING / STUCCO
    qty_stucco_m2_erp = 0,
    qty_stucco_m2_user = '',
    add_fiberglass = 'No',
    improving_material = 'None',
    qty_stucco_vol_ton = 0,
    qty_cement_stucco_tons = 0,
    qty_sand_stucco_m3 = 0,
    qty_water_stucco_ltr = 0,
    qty_addibond_stucco_ltr = 0,

    // SECTION 4: LINER WORKS
    qty_resilient_sheet_m2_erp = 0,
    qty_resilient_sheet_m2_user = '',
    qty_slip_resistant_vinyl_m2_erp = 0,
    qty_slip_resistant_vinyl_m2_user = '',
    resilient_sheet_brand_id = '',
    resilient_sheet_brand = '',
    resilient_sheet_type_id = '',
    wf_resilient_sheet_type = '',
    resilient_sheet_stairs_type_id = '',
    resilient_sheet_type_stairs = '',
    resilient_sheet_color_id = '',
    resilient_sheet_color = '',
    qty_linerlock_m_erp = 0,
    qty_linerlock_m_user = '',
    qty_rivet_nails_no_erp = 0,
    qty_rivet_nails_no_user = '',
    qty_wood_screw_no_erp = 0,

    // SECTION 5: TILING WORKS
    tiles_type = 'mosaic glass',
    water_feature_tiling_type_id = '',
    water_feature_mosaic_type_id = '',
    qty_tiling_m2_erp = 0,
    qty_tiling_m2_user = '',
    wf_adhesive_brand_id = '',
    adhesive_brand_id = '',
    wf_adhesive_brand = '',
    wf_adhesive_material = '',
    adhesive_material_id = '',
    wf_grout_brand_id = '',
    grout_brand_id = '',
    wf_grout_brand = '',
    wf_grout_material = '',
    grout_material_id = '',

    // SECTION 6: COPING STONE WORKS
    coping_stone_type = 'marble',
    floor_tile_type_id = '',
    qty_stone_floor_m_erp = 0,
    qty_stone_floor_m_user = '',

    // SECTION 7: ROLLED UP COSTS & DAYS
    total_cost_ladder = 0,
    total_cost_stucco = 0,
    total_cost_liner = 0,
    total_cost_tiling = 0,
    total_cost_stone_floor = 0,
    days_to_complete_ladder = 0,
    days_to_complete_stucco = 0,
    days_to_complete_liner = 0,
    days_to_complete_tiling = 0,
    days_to_complete_stone_floor = 0,
    no_of_laborers_ladder = 0,
    no_of_laborers_stucco = 0,
    no_of_laborers_liner = 0,
    no_of_laborers_tiling = 0,
    no_of_laborers_stone_floor = 0
  } = formData;

  const rawPhase = linked_phase || phase_id || '';
  const pdeMatch = useMemo(() => {
    if (!rawPhase) return null;
    return wfDataEntries.find(e => 
      String(e.id) === String(rawPhase) || 
      String(e.phase_id) === String(rawPhase) ||
      String(e.linked_phase) === String(rawPhase)
    ) || null;
  }, [rawPhase, wfDataEntries]);

  const currentPhaseId = useMemo(() => {
    if (!rawPhase) return '';
    const directPhase = phases.find(p => String(p.id) === String(rawPhase));
    if (directPhase) return directPhase.id;
    if (pdeMatch?.phase_id) {
      const pdePhase = phases.find(p => String(p.id) === String(pdeMatch.phase_id));
      if (pdePhase) return pdePhase.id;
    }
    return rawPhase;
  }, [rawPhase, phases, pdeMatch]);

  const currentProposalId = useMemo(() => {
    if (linked_proposal) return linked_proposal;
    if (tender_log_id) return tender_log_id;
    if (pdeMatch?.tender_log_id) return pdeMatch.tender_log_id;
    if (currentPhaseId) {
      const matchedPh = phases.find(p => String(p.id) === String(currentPhaseId));
      if (matchedPh?.tender_log_id) return matchedPh.tender_log_id;
    }
    return '';
  }, [linked_proposal, tender_log_id, pdeMatch, currentPhaseId, phases]);

  const catMap = useMemo(() => Object.fromEntries(itemCategories.map(c => [c.id, c.category_name])), [itemCategories]);

  // DB ITEM NAME FALLBACKS matching civil_material_types and staticLookup.js
  const DB_ITEM_NAME_FALLBACKS = {
    // Adhesives
    '336b1191-1cfc-4cc7-96dd-362b4df9ff4d': 'Sika Ceram ® - 205 Large',
    '061e4d20-9ca0-4ccb-83c5-44a4eb4865c0': 'Sika Lasqa - WP',
    '3d9c1d64-c491-43db-a77c-8b256b43f827': 'Cetox U',
    'fc266ea5-2246-4e34-952f-2328bed6a25a': 'TRI – FIX 444',
    // Tile Grouts
    '10204891-acb3-41dc-a72c-6dd700ec37d1': 'MasterTile® 530',
    'aeefc930-9189-48fc-9bff-979563cf6a76': 'TRI-TILE FG',
    'dbd926ca-be4b-4904-9559-f659f053e82f': 'Sika Tile Grout',
    // Mosaics & Ceramic
    '2e230add-9db2-413b-a970-74f4ec111524': 'Dot Mounted Mosaic',
    'a2ce01aa-a7ed-4b8c-89e6-1f163cc15a5a': 'Mesh Mounted Mosaic',
    '86acaacf-f943-4845-aaeb-bd836ac641a8': 'Ceramic'
  };

  const itemsMap = useMemo(() => {
    const map = { ...STATIC_ITEMS_LOOKUP, ...DB_ITEM_NAME_FALLBACKS };
    items.forEach(i => {
      if (i.id && (i.item_name || i.item || i.name)) {
        map[i.id] = i.item_name || i.item || i.name;
      }
    });
    return map;
  }, [items]);

  // 1. Filter Water Feature phases strictly belonging to the chosen tender (excluding pump rooms)
  const filteredWfPhases = useMemo(() => {
    return phases.filter(p => {
      if (currentPhaseId && String(p.id) === String(currentPhaseId)) return true;
      const comp = String(p.component_type || '').toLowerCase();
      const isWf = comp.includes('water') || comp.includes('feature') || comp.includes('pool') || comp.includes('lagoon') || comp.includes('fountain');
      const isPr = comp.includes('pump') || comp.includes('room');
      if (isPr || !isWf) return false;

      if (currentProposalId) {
        return String(p.tender_log_id) === String(currentProposalId);
      }
      return true;
    });
  }, [phases, currentProposalId, currentPhaseId]);

  // 2. Find upstream proposal_data_entry record linked to this phase
  const upstreamEntry = useMemo(() => {
    if (!currentPhaseId && !rawPhase) return null;
    return wfDataEntries.find(e => 
      String(e.phase_id) === String(currentPhaseId) || 
      String(e.id) === String(currentPhaseId) ||
      String(e.linked_phase) === String(currentPhaseId) ||
      String(e.phase_id) === String(rawPhase) ||
      String(e.id) === String(rawPhase) ||
      String(e.linked_phase) === String(rawPhase)
    ) || null;
  }, [currentPhaseId, rawPhase, wfDataEntries]);

  // 3. Inherited Technical Specifications from upstream entry
  const pool_length = Number(upstreamEntry?.pool_length_m) || 0;
  const pool_width = Number(upstreamEntry?.pool_width_m) || 0;
  const area_wf = Number(upstreamEntry?.water_feature_area_m2) || 0;
  const perimeter_wf = Number(upstreamEntry?.water_feature_perimeter_m) || 0;
  const avg_height = Number(upstreamEntry?.avg_height_m || upstreamEntry?.water_feature_height_m) || 1.2;
  const beach_area = Number(upstreamEntry?.beach_area_m2) || 0;
  const love_seats_area = Number(upstreamEntry?.love_seats_area_m2 || (Number(upstreamEntry?.length_of_love_seats_m || 0) * 0.45)) || 0;
  const rawShape = upstreamEntry?.swimming_pool_shape || 'Rectangle';
  const rawCategory = upstreamEntry?.water_feature_category || '';
  const rawType = upstreamEntry?.water_feature_type || '';

  const categoryTitle = useMemo(() => {
    const matched = categories.find(c => String(c.id).toLowerCase() === String(rawCategory).toLowerCase());
    return matched?.title || matched?.name || STATIC_WF_CATEGORIES_LOOKUP[rawCategory] || (rawCategory.includes('-') ? 'Swimming Pool' : rawCategory || 'Swimming Pool');
  }, [categories, rawCategory]);

  const typeTitle = useMemo(() => {
    const matched = featureTypes.find(t => String(t.id).toLowerCase() === String(rawType).toLowerCase());
    return matched?.title || matched?.name || STATIC_WF_TYPES_LOOKUP[rawType] || (rawType.includes('-') ? 'Overflow' : rawType || 'Overflow');
  }, [featureTypes, rawType]);

  const isLagoon = isWfLagoon(rawCategory) || isWfLagoon(categoryTitle);
  const isSwimmingPool = !isLagoon;

  const upstreamFinishesType = String(upstreamEntry?.swimming_pool_finishes_type_id || upstreamEntry?.swimming_pool_finishes_type || '').toLowerCase();
  const isSmoothLinerType = upstreamFinishesType.includes('e68a9618-f808-49b8-bb84-08361ad96eda') || upstreamFinishesType.includes('liner');

  // Show Liner if category is Lagoon OR (Swimming pool with Liner finish) OR tiles_type === 'liner'
  const isLinerActive = isLagoon || (isSwimmingPool && isSmoothLinerType) || tiles_type === 'liner';
  
  // Show Tiling if category is Swimming pool with non-liner finish OR (!isLinerActive)
  const isTilingActive = !isLinerActive;

  // 4. Dropdowns options
  const yesNoOptions = [
    { id: 'No', label: 'No' },
    { id: 'Yes', label: 'Yes' }
  ];

  const tilesTypeOptions = [
    { id: 'mosaic glass', label: 'Mosaic Glass' },
    { id: 'ceramic tiles', label: 'Ceramic Tiles' },
    { id: 'plastering', label: 'Plastering / Cement Stucco Only' }
  ];

  const copingOptions = [
    { id: 'marble', label: 'Egyptian Treista Marble' },
    { id: 'granite', label: 'Olympic Granite' },
    { id: 'artificial stone', label: 'Pre-Cast Artificial Stone' }
  ];

  const improvingMaterialOptions = [
    { id: 'None', label: 'None' },
    { id: '3942cb95-38aa-4bca-a00a-b4ab0700a5a8', label: 'Addibond 65' },
    { id: '061e4d20-9ca0-4ccb-83c5-44a4eb4865c0', label: 'Sika Latex Emulsion' }
  ];

  const mosaicOptions = [
    { id: '2e230add-9db2-413b-a970-74f4ec111524', label: 'Dot Mounted Mosaic' },
    { id: 'a2ce01aa-a7ed-4b8c-89e6-1f163cc15a5a', label: 'Mesh Mounted Mosaic' }
  ];

  const ceramicOptions = [
    { id: '86acaacf-f943-4845-aaeb-bd836ac641a8', label: 'Ceramic' }
  ];

  // Raw Adhesive Materials from civil_material_types
  const adhesiveMats = useMemo(() => {
    const list = materials.filter(m => String(m.item_category).toLowerCase() === 'b547689a-e132-4fed-a418-49cb28e73d2c' || (catMap[m.item_category] || '').toLowerCase().includes('adhesive'));
    if (list.length > 0) return list;
    return [
      { id: '687b0379-7a49-440d-a209-7eb965978b37', brand_id: '25b1498a-9c86-46a2-943b-9b889001a650', item_id: '336b1191-1cfc-4cc7-96dd-362b4df9ff4d', specification_rate: 8.33, item_unit: '25 kg' },
      { id: 'b66d700e-a7f8-4866-9bc3-90ba653133cb', brand_id: '25b1498a-9c86-46a2-943b-9b889001a650', item_id: '061e4d20-9ca0-4ccb-83c5-44a4eb4865c0', specification_rate: 10, item_unit: '25 kg' },
      { id: '1e143df8-7218-4cb6-8aab-fa9143915d38', brand_id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', item_id: '3d9c1d64-c491-43db-a77c-8b256b43f827', specification_rate: 10, item_unit: '25 kg' },
      { id: 'd7fee6af-0523-4dac-913c-f75bcf06d75a', brand_id: 'cc1cd635-c3dd-4fc4-8c49-25d7bf04df18', item_id: 'fc266ea5-2246-4e34-952f-2328bed6a25a', specification_rate: 9, item_unit: '25 kg' }
    ];
  }, [materials, catMap]);

  // Adhesive Brands
  const adhesiveBrandOptions = useMemo(() => {
    const brandIds = [...new Set(adhesiveMats.map(m => m.brand_id).filter(Boolean))];
    const opts = brands.filter(b => brandIds.includes(b.id)).map(b => ({ id: b.id, label: b.title || b.name }));
    if (opts.length > 0) return opts;
    return [
      { id: '25b1498a-9c86-46a2-943b-9b889001a650', label: 'Sika' },
      { id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', label: 'CMB' },
      { id: 'cc1cd635-c3dd-4fc4-8c49-25d7bf04df18', label: 'Tri Chem' }
    ];
  }, [adhesiveMats, brands]);

  // Filtered Adhesive Materials by Brand
  const currentAdhesiveBrand = useMemo(() => {
    if (wf_adhesive_brand_id) return wf_adhesive_brand_id;
    if (wf_adhesive_brand) return wf_adhesive_brand;
    if (adhesive_brand_id) return adhesive_brand_id;
    const curMat = wf_adhesive_material || adhesive_material_id;
    if (curMat) {
      const matched = adhesiveMats.find(m => m.id === curMat || m.item_id === curMat);
      if (matched?.brand_id) return matched.brand_id;
    }
    return adhesiveBrandOptions[0]?.id || '25b1498a-9c86-46a2-943b-9b889001a650';
  }, [wf_adhesive_brand_id, wf_adhesive_brand, adhesive_brand_id, wf_adhesive_material, adhesive_material_id, adhesiveMats, adhesiveBrandOptions]);

  const adhesiveMaterialOptions = useMemo(() => {
    const list = currentAdhesiveBrand ? adhesiveMats.filter(m => m.brand_id === currentAdhesiveBrand) : adhesiveMats;
    return list.map(m => {
      const name = itemsMap[m.item_id] || DB_ITEM_NAME_FALLBACKS[m.item_id] || STATIC_ITEMS_LOOKUP[m.item_id] || STATIC_ITEMS_LOOKUP[m.id] || 'Adhesive Material';
      return { id: m.id, label: name, item_id: m.item_id, brand_id: m.brand_id };
    });
  }, [adhesiveMats, currentAdhesiveBrand, itemsMap]);

  const currentAdhesiveMatId = useMemo(() => {
    const cur = wf_adhesive_material || adhesive_material_id || '';
    if (cur) {
      const matched = adhesiveMaterialOptions.find(o => o.id === cur || o.item_id === cur);
      if (matched) return matched.id;
    }
    return adhesiveMaterialOptions[0]?.id || '';
  }, [wf_adhesive_material, adhesive_material_id, adhesiveMaterialOptions]);

  // Raw Grout Materials from civil_material_types
  const groutMats = useMemo(() => {
    const list = materials.filter(m => String(m.item_category).toLowerCase() === '1720cf29-02b4-48c5-8e12-8d0f3de040e4' || (catMap[m.item_category] || '').toLowerCase().includes('grout'));
    if (list.length > 0) return list;
    return [
      { id: '00d65ca2-3343-4583-a7ee-ac341bc5331b', brand_id: '25b1498a-9c86-46a2-943b-9b889001a650', item_id: 'dbd926ca-be4b-4904-9559-f659f053e82f', specification_rate: 68.75, item_unit: '25 kg' },
      { id: '211c16be-e058-41e4-96bb-bbce1c58fb03', brand_id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', item_id: '10204891-acb3-41dc-a72c-6dd700ec37d1', specification_rate: 41.25, item_unit: '15 kg' },
      { id: 'e304431c-93c3-4d1f-9996-ba90b2d31587', brand_id: 'cc1cd635-c3dd-4fc4-8c49-25d7bf04df18', item_id: 'aeefc930-9189-48fc-9bff-979563cf6a76', specification_rate: 16.67, item_unit: '6 kg' }
    ];
  }, [materials, catMap]);

  // Grout Brands
  const groutBrandOptions = useMemo(() => {
    const brandIds = [...new Set(groutMats.map(m => m.brand_id).filter(Boolean))];
    const opts = brands.filter(b => brandIds.includes(b.id)).map(b => ({ id: b.id, label: b.title || b.name }));
    if (opts.length > 0) return opts;
    return [
      { id: '25b1498a-9c86-46a2-943b-9b889001a650', label: 'Sika' },
      { id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', label: 'Basf' },
      { id: 'cc1cd635-c3dd-4fc4-8c49-25d7bf04df18', label: 'Tri Chem' }
    ];
  }, [groutMats, brands]);

  // Filtered Grout Materials by Brand
  const currentGroutBrand = useMemo(() => {
    if (wf_grout_brand_id) return wf_grout_brand_id;
    if (wf_grout_brand) return wf_grout_brand;
    if (grout_brand_id) return grout_brand_id;
    const curMat = wf_grout_material || grout_material_id;
    if (curMat) {
      const matched = groutMats.find(m => m.id === curMat || m.item_id === curMat);
      if (matched?.brand_id) return matched.brand_id;
    }
    return groutBrandOptions[0]?.id || '25b1498a-9c86-46a2-943b-9b889001a650';
  }, [wf_grout_brand_id, wf_grout_brand, grout_brand_id, wf_grout_material, grout_material_id, groutMats, groutBrandOptions]);

  const groutMaterialOptions = useMemo(() => {
    const list = currentGroutBrand ? groutMats.filter(m => m.brand_id === currentGroutBrand) : groutMats;
    return list.map(m => {
      const name = itemsMap[m.item_id] || DB_ITEM_NAME_FALLBACKS[m.item_id] || STATIC_ITEMS_LOOKUP[m.item_id] || STATIC_ITEMS_LOOKUP[m.id] || 'Tile Grout';
      return { id: m.id, label: name, item_id: m.item_id, brand_id: m.brand_id };
    });
  }, [groutMats, currentGroutBrand, itemsMap]);

  const currentGroutMatId = useMemo(() => {
    const cur = wf_grout_material || grout_material_id || '';
    if (cur) {
      const matched = groutMaterialOptions.find(o => o.id === cur || o.item_id === cur);
      if (matched) return matched.id;
    }
    return groutMaterialOptions[0]?.id || '';
  }, [wf_grout_material, grout_material_id, groutMaterialOptions]);

  const linerBrandOptions = useMemo(() => {
    const linerRecords = finishesTypes.filter(f => 
      String(f.finishes_category_id || '').toLowerCase() === 'e68a9618-f808-49b8-bb84-08361ad96eda' ||
      String(f.item_type || '').toLowerCase().includes('liner') ||
      String(f.item_type || '').toLowerCase().includes('sheet')
    );

    const brandIdsInFinishes = Array.from(new Set(linerRecords.map(f => f.brand_id).filter(Boolean)));
    
    let opts = brandIdsInFinishes.map(bId => {
      const bObj = brands.find(b => String(b.id) === String(bId));
      return {
        id: bId,
        label: bObj?.title || bObj?.name || 'Brand'
      };
    });

    if (opts.length === 0) {
      opts = [
        { id: 'a336ab8d-488e-48dc-bd82-9dd01c9ac39a', label: 'Soprema' },
        { id: 'b9cc82c4-0c10-48af-8f06-7aa8414baeac', label: 'Insuwrap' }
      ];
    }

    const curBrand = resilient_sheet_brand_id || resilient_sheet_brand;
    if (curBrand && !opts.some(o => o.id === curBrand)) {
      const bObj = brands.find(b => String(b.id) === String(curBrand));
      opts.push({
        id: curBrand,
        label: bObj?.title || bObj?.name || 'Selected Brand'
      });
    }

    return opts;
  }, [finishesTypes, brands, resilient_sheet_brand_id, resilient_sheet_brand]);

  const linerColorOptions = useMemo(() => {
    const linerRecords = finishesTypes.filter(f => 
      String(f.finishes_category_id || '').toLowerCase() === 'e68a9618-f808-49b8-bb84-08361ad96eda' ||
      String(f.item_type || '').toLowerCase().includes('liner') ||
      String(f.item_type || '').toLowerCase().includes('sheet')
    );

    const targetBrand = resilient_sheet_brand_id || resilient_sheet_brand;
    const scopedRecords = targetBrand 
      ? linerRecords.filter(f => String(f.brand_id) === String(targetBrand))
      : linerRecords;

    const colors = Array.from(new Set(scopedRecords.map(f => f.color).filter(Boolean)));

    let opts = colors.map(c => ({ id: c, label: c }));

    const standardColors = ['White', 'Caribbean Green', 'Light Blue', 'Adriatic Blue', 'Sand'];
    if (opts.length === 0) {
      opts = standardColors.map(c => ({ id: c, label: c }));
    } else {
      standardColors.forEach(sc => {
        if (!opts.some(o => o.id.toLowerCase() === sc.toLowerCase())) {
          opts.push({ id: sc, label: sc });
        }
      });
    }
    return opts;
  }, [finishesTypes, resilient_sheet_brand_id, resilient_sheet_brand]);

  const antiSlipOptions = useMemo(() => {
    const antiRecords = finishesTypes.filter(f => 
      String(f.finishes_category_id || '').toLowerCase() === 'e68a9618-f808-49b8-bb84-08361ad96eda' ||
      String(f.item_type || '').toLowerCase().includes('anti') ||
      String(f.item_type || '').toLowerCase().includes('slip')
    );

    let opts = antiRecords.map(f => {
      const bObj = brands.find(b => String(b.id) === String(f.brand_id));
      const brandName = bObj?.title || bObj?.name || '';
      const itm = items.find(i => String(i.id) === String(f.item_id));
      const itmName = itm?.item_name || itm?.['ITEM NAME'];
      
      const label = itmName 
        ? itmName 
        : `${brandName ? brandName + ' ' : ''}${f.item_type || 'Anti-Slip Liner'} - ${f.color || ''}`.trim();
        
      return {
        id: f.id,
        itemId: f.item_id,
        brandId: f.brand_id,
        color: f.color,
        label: label
      };
    });

    if (opts.length === 0) {
      opts = [
        { id: 'b6cb2aff-8a50-4172-9f82-51b77bab90ad', label: 'Slip Resistant Sheet - White Brand Soprema' },
        { id: '6f3105d0-18f7-43f7-9289-deaaf64a95eb', label: 'Slip Resistant Sheet - White Brand Insuwrap' },
        { id: 'cba9b2fb-f2ae-49d7-880f-136133137940', label: 'Slip Resistant Sheet - Caribbean Green Brand Soprema' },
        { id: 'c708ced2-7b5a-4860-b240-d65da607a39e', label: 'Slip Resistant Sheet - Caribbean Green Brand Insuwrap' }
      ];
    }
    return opts;
  }, [finishesTypes, brands, items]);

  // 5. Live Calculation & BOQ Engine
  const dropdownContext = useMemo(() => ({
    items,
    items_database: items,
    civil_material_types: materials,
    finishes_type: finishesTypes,
    finishes_types: finishesTypes,
    finishes_category: finishesCategories,
    finishes_categories: finishesCategories,
    phases,
    proposal_data_entry: wfDataEntries,
    water_feature_categories: categories,
    brands,
    item_categories: itemCategories
  }), [items, materials, finishesTypes, finishesCategories, phases, wfDataEntries, categories, brands, itemCategories]);

  const liveBoqResult = useMemo(() => {
    const calcInput = calculateWaterFeatureFinishes({
      ...formData,
      phase_id: currentPhaseId,
      linked_phase: currentPhaseId,
      tender_log_id: currentProposalId,
      linked_proposal: currentProposalId,
      accommodations_required: accommodations_required || upstreamEntry?.accommodations_required || 'No'
    }, upstreamEntry);

    return buildWaterFeatureFinishesBoq(
      calcInput, 
      formData.proposal_breakdown_items || [], 
      dropdownContext, 
      upstreamEntry
    );
  }, [formData, currentPhaseId, currentProposalId, accommodations_required, upstreamEntry, dropdownContext]);

  // Sync auto-computed keys back to parent form state
  useEffect(() => {
    if (!liveBoqResult) return;
    const keysToSync = [
      'total_cost_ladder', 'unit_cost_ladder', 'days_to_complete_ladder', 'no_of_laborers_ladder',
      'total_cost_stucco', 'unit_cost_stucco', 'days_to_complete_stucco', 'no_of_laborers_stucco',
      'total_cost_liner', 'unit_cost_liner', 'days_to_complete_liner', 'no_of_laborers_liner',
      'total_cost_total_liner', 'unit_cost_total_liner', 'days_to_complete_total_liner', 'no_of_laborers_total_liner',
      'total_cost_tiling', 'unit_cost_tiling', 'days_to_complete_tiling', 'no_of_laborers_tiling',
      'total_cost_stone_floor', 'unit_cost_stone_floor', 'days_to_complete_stone_floor', 'no_of_laborers_stone_floor',
      'qty_ladder_no_erp', 'qty_stucco_m2_erp', 'qty_resilient_sheet_m2_erp', 'qty_slip_resistant_vinyl_m2_erp',
      'qty_total_liner_m2_erp', 'qty_rivet_nails_no_erp', 'qty_linerlock_m_erp', 'qty_wood_screw_no_erp',
      'qty_tiling_m2_erp', 'qty_stone_floor_m_erp',
      'qty_stucco_vol_ton', 'qty_cement_stucco_tons', 'qty_sand_stucco_m3', 'qty_water_stucco_ltr', 'qty_addibond_stucco_ltr'
    ];

    let hasDiff = false;
    keysToSync.forEach(k => {
      if (liveBoqResult[k] !== undefined && liveBoqResult[k] !== formData[k]) {
        hasDiff = true;
      }
    });

    if (hasDiff) {
      const merged = { ...formData };
      keysToSync.forEach(k => {
        if (liveBoqResult[k] !== undefined) merged[k] = liveBoqResult[k];
      });
      merged.proposal_breakdown_items = liveBoqResult.proposal_breakdown_items;
      onChange(merged);
    }
  }, [liveBoqResult]);

  // Section Breakdown Line Items
  const allBoqItems = liveBoqResult?.proposal_breakdown_items || formData.proposal_breakdown_items || [];
  const ladderBoqItems = useMemo(() => allBoqItems.filter(i => {
    const cat = String(resolveCategoryName(i) || i.work_main_category || '').toLowerCase();
    const spawner = String(i._spawnerid || '').toLowerCase();
    return cat.includes('ladder') || spawner.includes('ladder') || i._isLadder2Auto || i._isLadder3Auto || i._isLadder4Auto || i._isLadder5Auto || i._isLadderInstallAuto;
  }), [allBoqItems]);
  const stuccoBoqItems = useMemo(() => allBoqItems.filter(i => {
    const cat = String(resolveCategoryName(i) || i.work_main_category || '').toLowerCase();
    const spawner = String(i._spawnerid || '').toLowerCase();
    return cat.includes('plaster') || spawner.includes('plaster') || i._isWaterPlasteringAuto || i._isSandPlasteringAuto || i._isCementPlasteringAuto || i._isAddibondPlasteringAuto || i._isPlasteringSubAuto || i._isPlasterAptAuto || i._isPlasterMicrobusAuto;
  }), [allBoqItems]);
  const linerBoqItems = useMemo(() => allBoqItems.filter(i => {
    const cat = String(resolveCategoryName(i) || i.work_main_category || '').toLowerCase();
    const spawner = String(i._spawnerid || '').toLowerCase();
    return cat.includes('liner') || spawner.includes('liner') || i._isSmoothLinerAuto || i._isAntiSlipLinerAuto || i._isRivetScrewLinerAuto || i._isLinerlockAuto || i._isLinerSubcontractorAuto || i._isLinerAptAuto || i._isLinerMicrobusAuto;
  }), [allBoqItems]);
  const tilingBoqItems = useMemo(() => allBoqItems.filter(i => {
    const cat = String(resolveCategoryName(i) || i.work_main_category || '').toLowerCase();
    const spawner = String(i._spawnerid || '').toLowerCase();
    return cat.includes('tiling') || spawner.includes('tiling') || spawner.includes('tile') && !spawner.includes('coping') || i._isSupplyTilesAuto || i._isTileAdhesiveAuto || i._isTileGroutAuto || i._isTilingSubcontractorAuto || i._isTilingAptAuto || i._isTilingMicrobusAuto;
  }), [allBoqItems]);
  const copingBoqItems = useMemo(() => allBoqItems.filter(i => {
    const cat = String(resolveCategoryName(i) || i.work_main_category || '').toLowerCase();
    const spawner = String(i._spawnerid || '').toLowerCase();
    return cat.includes('copp') || cat.includes('coping') || spawner.includes('coping') || i._isSupplyCopingTilesAuto || i._isCopingSubcontractorAuto || i._isCopingSikaLasqaAuto || i._isCopingAptAuto || i._isCopingMicrobusAuto;
  }), [allBoqItems]);

  const ladderCost = useMemo(() => {
    const sum = ladderBoqItems.filter(i => i.activity_responsibility !== 'Client').reduce((s, i) => s + (Number(i.total_cost) || 0), 0);
    return sum > 0 ? sum : Number(total_cost_ladder || liveBoqResult?.total_cost_ladder || 0);
  }, [ladderBoqItems, total_cost_ladder, liveBoqResult]);

  const stuccoCost = useMemo(() => {
    const sum = stuccoBoqItems.filter(i => i.activity_responsibility !== 'Client').reduce((s, i) => s + (Number(i.total_cost) || 0), 0);
    return sum > 0 ? sum : Number(total_cost_stucco || liveBoqResult?.total_cost_stucco || 0);
  }, [stuccoBoqItems, total_cost_stucco, liveBoqResult]);

  const linerCost = useMemo(() => {
    const sum = linerBoqItems.filter(i => i.activity_responsibility !== 'Client').reduce((s, i) => s + (Number(i.total_cost) || 0), 0);
    return sum > 0 ? sum : Number(total_cost_liner || formData.total_cost_total_liner || liveBoqResult?.total_cost_liner || 0);
  }, [linerBoqItems, total_cost_liner, formData.total_cost_total_liner, liveBoqResult]);

  const tilingCost = useMemo(() => {
    const sum = tilingBoqItems.filter(i => i.activity_responsibility !== 'Client').reduce((s, i) => s + (Number(i.total_cost) || 0), 0);
    return sum > 0 ? sum : Number(total_cost_tiling || liveBoqResult?.total_cost_tiling || 0);
  }, [tilingBoqItems, total_cost_tiling, liveBoqResult]);

  const copingCost = useMemo(() => {
    const sum = copingBoqItems.filter(i => i.activity_responsibility !== 'Client').reduce((s, i) => s + (Number(i.total_cost) || 0), 0);
    return sum > 0 ? sum : Number(total_cost_stone_floor || liveBoqResult?.total_cost_stone_floor || 0);
  }, [copingBoqItems, total_cost_stone_floor, liveBoqResult]);

  // Grand Totals
  const totalFinishesCost = ladderCost + stuccoCost + linerCost + tilingCost + copingCost;

  const totalDays = (
    Number(days_to_complete_ladder || liveBoqResult?.days_to_complete_ladder || 0) +
    Number(days_to_complete_stucco || liveBoqResult?.days_to_complete_stucco || 0) +
    Number(days_to_complete_liner || formData.days_to_complete_total_liner || liveBoqResult?.days_to_complete_liner || 0) +
    Number(days_to_complete_tiling || liveBoqResult?.days_to_complete_tiling || 0) +
    Number(days_to_complete_stone_floor || liveBoqResult?.days_to_complete_stone_floor || 0)
  );

  const totalLaborers = (
    Number(no_of_laborers_ladder || liveBoqResult?.no_of_laborers_ladder || 0) +
    Number(no_of_laborers_stucco || liveBoqResult?.no_of_laborers_stucco || 0) +
    Number(no_of_laborers_liner || formData.no_of_laborers_total_liner || liveBoqResult?.no_of_laborers_liner || 0) +
    Number(no_of_laborers_tiling || liveBoqResult?.no_of_laborers_tiling || 0) +
    Number(no_of_laborers_stone_floor || liveBoqResult?.no_of_laborers_stone_floor || 0)
  );

  // Field change handler
  const handleFieldsChange = (updates) => {
    const fullUpdates = { ...updates };
    if (fullUpdates.wf_adhesive_brand_id !== undefined) {
      fullUpdates.adhesive_brand_id = fullUpdates.wf_adhesive_brand_id;
      fullUpdates.wf_adhesive_brand = fullUpdates.wf_adhesive_brand_id;
    }
    if (fullUpdates.wf_adhesive_brand !== undefined) {
      fullUpdates.wf_adhesive_brand_id = fullUpdates.wf_adhesive_brand;
      fullUpdates.adhesive_brand_id = fullUpdates.wf_adhesive_brand;
    }
    if (fullUpdates.adhesive_brand_id !== undefined) {
      fullUpdates.wf_adhesive_brand_id = fullUpdates.adhesive_brand_id;
      fullUpdates.wf_adhesive_brand = fullUpdates.adhesive_brand_id;
    }
    if (fullUpdates.wf_adhesive_material !== undefined) {
      fullUpdates.adhesive_material_id = fullUpdates.wf_adhesive_material;
    }
    if (fullUpdates.adhesive_material_id !== undefined) {
      fullUpdates.wf_adhesive_material = fullUpdates.adhesive_material_id;
    }
    if (fullUpdates.wf_grout_brand_id !== undefined) {
      fullUpdates.grout_brand_id = fullUpdates.wf_grout_brand_id;
      fullUpdates.wf_grout_brand = fullUpdates.wf_grout_brand_id;
    }
    if (fullUpdates.wf_grout_brand !== undefined) {
      fullUpdates.wf_grout_brand_id = fullUpdates.wf_grout_brand;
      fullUpdates.grout_brand_id = fullUpdates.wf_grout_brand;
    }
    if (fullUpdates.grout_brand_id !== undefined) {
      fullUpdates.wf_grout_brand_id = fullUpdates.grout_brand_id;
      fullUpdates.wf_grout_brand = fullUpdates.grout_brand_id;
    }
    if (fullUpdates.wf_grout_material !== undefined) {
      fullUpdates.grout_material_id = fullUpdates.wf_grout_material;
    }
    if (fullUpdates.grout_material_id !== undefined) {
      fullUpdates.wf_grout_material = fullUpdates.grout_material_id;
    }
    if (fullUpdates.water_feature_mosaic_type_id !== undefined) {
      fullUpdates.wf_mosaic_type = fullUpdates.water_feature_mosaic_type_id;
    }
    if (fullUpdates.water_feature_tiling_type_id !== undefined) {
      fullUpdates.wf_tiling_type = fullUpdates.water_feature_tiling_type_id;
    }

    // Liner Brand & Color sync and auto-pairing
    if (fullUpdates.resilient_sheet_brand_id !== undefined || fullUpdates.resilient_sheet_brand !== undefined) {
      const bVal = fullUpdates.resilient_sheet_brand_id || fullUpdates.resilient_sheet_brand;
      fullUpdates.resilient_sheet_brand_id = bVal;
      fullUpdates.resilient_sheet_brand = bVal;
    }
    if (fullUpdates.resilient_sheet_color_id !== undefined || fullUpdates.resilient_sheet_color !== undefined) {
      const cVal = fullUpdates.resilient_sheet_color_id || fullUpdates.resilient_sheet_color;
      fullUpdates.resilient_sheet_color_id = cVal;
      fullUpdates.resilient_sheet_color = cVal;
    }

    if (fullUpdates.resilient_sheet_brand_id !== undefined || fullUpdates.resilient_sheet_color_id !== undefined) {
      const effBrand = fullUpdates.resilient_sheet_brand_id || resilient_sheet_brand_id || resilient_sheet_brand || 'a336ab8d-488e-48dc-bd82-9dd01c9ac39a';
      const effColor = fullUpdates.resilient_sheet_color_id || resilient_sheet_color_id || resilient_sheet_color || 'White';

      // 1. Auto-find matching Smooth Liner in finishesTypes
      const smoothMatch = finishesTypes.find(f => 
        String(f.brand_id) === String(effBrand) && 
        String(f.color || '').toLowerCase() === String(effColor || '').toLowerCase() &&
        (String(f.item_type || '').toLowerCase().includes('smooth') || String(f.item_type || '').toLowerCase().includes('resilient'))
      );
      if (smoothMatch) {
        fullUpdates.resilient_sheet_type_id = smoothMatch.id;
        fullUpdates.wf_resilient_sheet_type = smoothMatch.id;
      }

      // 2. Auto-find matching Anti-Slip Liner in finishesTypes
      const antiMatch = finishesTypes.find(f => 
        String(f.brand_id) === String(effBrand) && 
        String(f.color || '').toLowerCase() === String(effColor || '').toLowerCase() &&
        (String(f.item_type || '').toLowerCase().includes('anti') || String(f.item_type || '').toLowerCase().includes('slip'))
      );
      if (antiMatch) {
        fullUpdates.resilient_sheet_stairs_type_id = antiMatch.id;
        fullUpdates.resilient_sheet_type_stairs = antiMatch.id;
      }
    }

    if (fullUpdates.resilient_sheet_stairs_type_id !== undefined) {
      fullUpdates.resilient_sheet_type_stairs = fullUpdates.resilient_sheet_stairs_type_id;
    }
    if (fullUpdates.resilient_sheet_type_stairs !== undefined) {
      fullUpdates.resilient_sheet_stairs_type_id = fullUpdates.resilient_sheet_type_stairs;
    }
    if (fullUpdates.resilient_sheet_type_id !== undefined) {
      fullUpdates.wf_resilient_sheet_type = fullUpdates.resilient_sheet_type_id;
    }
    if (fullUpdates.wf_resilient_sheet_type !== undefined) {
      fullUpdates.resilient_sheet_type_id = fullUpdates.wf_resilient_sheet_type;
    }

    onChange({
      ...formData,
      ...fullUpdates
    });
  };

  // Auto-sync brand/color from existing record's type IDs if brand/color are empty
  useEffect(() => {
    if (finishesTypes.length > 0 && (resilient_sheet_type_id || wf_resilient_sheet_type) && (!resilient_sheet_brand_id || !resilient_sheet_color_id)) {
      const typeId = resilient_sheet_type_id || wf_resilient_sheet_type;
      const matched = finishesTypes.find(f => String(f.id) === String(typeId) || String(f.item_id) === String(typeId));
      if (matched) {
        const updates = {};
        if (!resilient_sheet_brand_id && matched.brand_id) {
          updates.resilient_sheet_brand_id = matched.brand_id;
          updates.resilient_sheet_brand = matched.brand_id;
        }
        if (!resilient_sheet_color_id && matched.color) {
          updates.resilient_sheet_color_id = matched.color;
          updates.resilient_sheet_color = matched.color;
        }
        if (Object.keys(updates).length > 0) {
          handleFieldsChange(updates);
        }
      }
    }
  }, [finishesTypes, resilient_sheet_type_id, wf_resilient_sheet_type, resilient_sheet_brand_id, resilient_sheet_color_id]);

  const handleFieldChange = (field, value) => {
    handleFieldsChange({ [field]: value });
  };

  // Phase selection handler
  const handlePhaseSelect = (phaseId) => {
    const selectedPh = phases.find(p => String(p.id) === String(phaseId));
    const relatedProp = selectedPh ? proposals.find(p => String(p.id) === String(selectedPh.tender_log_id)) : null;
    const relatedEntry = wfDataEntries.find(e => 
      String(e.phase_id) === String(phaseId) || 
      String(e.id) === String(phaseId) ||
      String(e.linked_phase) === String(phaseId)
    );

    onChange({
      ...formData,
      linked_phase: phaseId,
      phase_id: phaseId,
      linked_proposal: relatedProp ? relatedProp.id : (currentProposalId || ''),
      tender_log_id: relatedProp ? relatedProp.id : (currentProposalId || ''),
      project_owner: relatedProp?.client_id || project_owner,
      main_contractor: relatedProp?.main_contractor || main_contractor,
      civil_consultant: relatedProp?.civil_consultant || civil_consultant,
      region: relatedProp?.region || region,
      accommodations_required: relatedEntry?.accommodations_required || formData.accommodations_required || 'No'
    });
  };

  // Proposal selection handler
  const handleTenderSelect = (tenderId) => {
    const matchedProp = proposals.find(p => String(p.id) === String(tenderId));
    onChange({
      ...formData,
      linked_proposal: tenderId,
      tender_log_id: tenderId,
      linked_phase: '',
      phase_id: '',
      project_owner: matchedProp?.client_id || '',
      main_contractor: matchedProp?.main_contractor || '',
      civil_consultant: matchedProp?.civil_consultant || '',
      region: matchedProp?.region || ''
    });
  };

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* SECTION 1: LINKAGE & PROJECT CONTEXT */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Section 1: Linkage & Project Context</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Linked Tender / Proposal <span className="text-amber-600">*</span>
            </label>
            <SearchableSelect
              options={proposals.map(p => ({
                id: p.id,
                label: `${p.proposal_number || 'SP.2026'}: ${p.proposal_title || p.proposal_full_title || 'Untitled'}`
              }))}
              value={currentProposalId}
              onChange={handleTenderSelect}
              placeholder="Select Tender / Proposal first..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Water Feature Phase <span className="text-amber-600">*</span>
            </label>
            <SearchableSelect
              options={filteredWfPhases.map(ph => ({
                id: ph.id,
                label: ph.phase_title || 'Phase Scope'
              }))}
              value={currentPhaseId}
              onChange={handlePhaseSelect}
              placeholder={currentProposalId ? "Select Water Feature Phase..." : "Select Tender first..."}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Project Owner / Client
            </label>
            <SearchableSelect
              options={clients.map(c => ({ id: c.id, label: c.title || c.name }))}
              value={project_owner}
              disabled
              placeholder="Auto-filled from proposal"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Main Contractor
            </label>
            <SearchableSelect
              options={clients.map(c => ({ id: c.id, label: c.title || c.name }))}
              value={main_contractor}
              disabled
              placeholder="Auto-filled from proposal"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Civil Consultant
            </label>
            <SearchableSelect
              options={clients.map(c => ({ id: c.id, label: c.title || c.name }))}
              value={civil_consultant}
              disabled
              placeholder="Auto-filled from proposal"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Region
            </label>
            <SearchableSelect
              options={regions.map(r => ({ id: r.id, label: r.title || r.name }))}
              value={region}
              disabled
              placeholder="Auto-filled from proposal"
            />
          </div>
        </div>

        {upstreamEntry && (
          <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" /> Inherited Basin Geometry & Data:
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              Category: <strong className="text-amber-800 dark:text-amber-300">{categoryTitle}</strong>
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              Type: <strong className="text-cyan-800 dark:text-cyan-300">{typeTitle}</strong>
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              Accommodations: <strong className={upstreamEntry?.accommodations_required === 'Yes' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}>{upstreamEntry?.accommodations_required || 'No'}</strong>
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              Shape: <strong>{rawShape}</strong>
            </span>
            {pool_length > 0 && pool_width > 0 && (
              <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                L × W: <strong>{pool_length} × {pool_width} m</strong>
              </span>
            )}
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              Area: <strong>{area_wf} m²</strong>
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              Perimeter: <strong>{perimeter_wf} m</strong>
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              Avg Depth: <strong>{avg_height} m</strong>
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: STAINLESS STEEL LADDERS WORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
            <Hammer className="w-4 h-4 text-slate-600" />
            <span>Section 2: Stainless Steel Ladders Works</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 px-3 rounded-xl text-xs font-mono">
            <span className="text-[10px] text-slate-400">Total Ladders:</span>
            <strong className="text-slate-900 dark:text-slate-100">
              {Number(ladder_2_steps_no || 0) + Number(ladder_3_steps_no || 0) + Number(ladder_4_steps_no || 0) + Number(ladder_5_steps_no || 0)} Units
            </strong>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                2-Step Ladder (Qty)
              </label>
              <input
                type="number"
                min="0"
                value={ladder_2_steps_no}
                onChange={(e) => handleFieldChange('ladder_2_steps_no', e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                3-Step Ladder (Qty)
              </label>
              <input
                type="number"
                min="0"
                value={ladder_3_steps_no}
                onChange={(e) => handleFieldChange('ladder_3_steps_no', e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                4-Step Ladder (Qty)
              </label>
              <input
                type="number"
                min="0"
                value={ladder_4_steps_no}
                onChange={(e) => handleFieldChange('ladder_4_steps_no', e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                5-Step Ladder (Qty)
              </label>
              <input
                type="number"
                min="0"
                value={ladder_5_steps_no}
                onChange={(e) => handleFieldChange('ladder_5_steps_no', e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* ITEMIZE LADDERS BOQ TABLE */}
          {ladderBoqItems.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Itemized Ladder BOQ Breakdown ({ladderBoqItems.length} items):
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{Number(ladderCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong> • Days: <strong>{days_to_complete_ladder}</strong> • Laborers: <strong>{no_of_laborers_ladder}</strong>
                </span>
              </div>
              <SectionBoqTable items={ladderBoqItems} />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: PLASTERING / CEMENT STUCCO WORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Section 3: Plastering / Cement Stucco Works</span>
          </div>

          <div className="flex items-center gap-2 bg-amber-50/80 dark:bg-amber-950/40 p-1.5 px-3 rounded-xl border border-amber-200 dark:border-amber-800 text-xs">
            <div>
              <span className="text-[9px] text-slate-400 block">[ERP] Auto</span>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400">{qty_stucco_m2_erp || liveBoqResult?.qty_stucco_m2_erp || 0} m²</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div>
              <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
              <input
                type="number"
                value={qty_stucco_m2_user !== undefined && qty_stucco_m2_user !== '' ? qty_stucco_m2_user : (qty_stucco_m2_erp || liveBoqResult?.qty_stucco_m2_erp || '')}
                onChange={(e) => handleFieldChange('qty_stucco_m2_user', e.target.value)}
                className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Plastering Thickness
              </label>
              <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                0.03 m (30 mm Stucco)
              </div>
            </div>

            <StyledSelect
              label="Add Fiberglass Mesh"
              value={add_fiberglass}
              onChange={(val) => handleFieldChange('add_fiberglass', val)}
              options={yesNoOptions}
            />

            <StyledSelect
              label="Improving Mortar Additive"
              value={improving_material}
              onChange={(val) => handleFieldChange('improving_material', val)}
              options={improvingMaterialOptions}
            />
          </div>

          {/* Plastering Consumables Strip */}
          <div className="p-3.5 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 text-xs font-mono space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
              Cement Stucco Consumables (1:4 Mix Ratio):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px]">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Mortar Vol</span>
                <strong className="text-amber-700 dark:text-amber-300">{qty_stucco_vol_ton || liveBoqResult?.qty_stucco_vol_ton || 0} Tons</strong>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Cement</span>
                <strong className="text-slate-800 dark:text-slate-200">{qty_cement_stucco_tons || liveBoqResult?.qty_cement_stucco_tons || 0} Tons</strong>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Sand</span>
                <strong className="text-slate-800 dark:text-slate-200">{qty_sand_stucco_m3 || liveBoqResult?.qty_sand_stucco_m3 || 0} m³</strong>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Water</span>
                <strong className="text-blue-600 dark:text-blue-400">{qty_water_stucco_ltr || liveBoqResult?.qty_water_stucco_ltr || 0} L</strong>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 block font-sans">Addibond 65</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{qty_addibond_stucco_ltr || liveBoqResult?.qty_addibond_stucco_ltr || 0} L</strong>
              </div>
            </div>
          </div>

          {/* ITEMIZE PLASTERING BOQ TABLE */}
          {stuccoBoqItems.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Itemized Plastering BOQ Breakdown ({stuccoBoqItems.length} items):
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{Number(stuccoCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong> • Days: <strong>{days_to_complete_stucco}</strong> • Laborers: <strong>{no_of_laborers_stucco}</strong>
                </span>
              </div>
              <SectionBoqTable items={stuccoBoqItems} />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: LINER WORKS (SMOOTH & ANTI-SLIP) - Shown only for Liner / Lagoon */}
      {/* ========================================================================= */}
      {isLinerActive && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Section 4: Liner Works (Smooth & Anti-Slip Sheets)</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Smooth Liner Chip */}
              <div className="flex items-center gap-2 bg-indigo-50/80 dark:bg-indigo-950/40 p-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block">Smooth Liner [ERP]</span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{qty_resilient_sheet_m2_erp || liveBoqResult?.qty_resilient_sheet_m2_erp || 0} m²</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div>
                  <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
                  <input
                    type="number"
                    value={qty_resilient_sheet_m2_user !== undefined && qty_resilient_sheet_m2_user !== '' ? qty_resilient_sheet_m2_user : (qty_resilient_sheet_m2_erp || liveBoqResult?.qty_resilient_sheet_m2_erp || '')}
                    onChange={(e) => handleFieldChange('qty_resilient_sheet_m2_user', e.target.value)}
                    className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
                  />
                </div>
              </div>

              {/* Anti-Slip Liner Chip */}
              <div className="flex items-center gap-2 bg-teal-50/80 dark:bg-teal-950/40 p-1.5 px-3 rounded-xl border border-teal-200 dark:border-teal-800 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block">Anti-Slip [ERP]</span>
                  <span className="font-mono font-black text-teal-600 dark:text-teal-400">{qty_slip_resistant_vinyl_m2_erp || liveBoqResult?.qty_slip_resistant_vinyl_m2_erp || 0} m²</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div>
                  <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
                  <input
                    type="number"
                    value={qty_slip_resistant_vinyl_m2_user !== undefined && qty_slip_resistant_vinyl_m2_user !== '' ? qty_slip_resistant_vinyl_m2_user : (qty_slip_resistant_vinyl_m2_erp || liveBoqResult?.qty_slip_resistant_vinyl_m2_erp || '')}
                    onChange={(e) => handleFieldChange('qty_slip_resistant_vinyl_m2_user', e.target.value)}
                    className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Smooth Liner Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                  1. Smooth Liner Specifications
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StyledSelect
                    label="Brand"
                    value={resilient_sheet_brand_id}
                    onChange={(val) => handleFieldChange('resilient_sheet_brand_id', val)}
                    options={linerBrandOptions}
                    placeholder="Select Brand..."
                  />
                  <StyledSelect
                    label="Color"
                    value={resilient_sheet_color_id}
                    onChange={(val) => handleFieldChange('resilient_sheet_color_id', val)}
                    options={linerColorOptions}
                    placeholder="Select Color..."
                  />
                </div>
              </div>

              {/* Anti-Slip Liner Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 block">
                  2. Anti-Slip Liner (Stairs & Beach)
                </span>
                <StyledSelect
                  label="Anti-Slip Stairs Material"
                  value={resilient_sheet_stairs_type_id}
                  onChange={(val) => handleFieldChange('resilient_sheet_stairs_type_id', val)}
                  options={antiSlipOptions}
                  placeholder="Select Anti-Slip Type..."
                />
              </div>

            </div>

            {/* Linerlock, Rivets & Wood Screws Card */}
            <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/40 text-xs font-mono">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400 block mb-2">
                Fixing Fasteners & Profile Accessories:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-sans">Linerlock Profile</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={qty_linerlock_m_user !== undefined && qty_linerlock_m_user !== '' ? qty_linerlock_m_user : (qty_linerlock_m_erp || liveBoqResult?.qty_linerlock_m_erp || 0)}
                      onChange={(e) => handleFieldChange('qty_linerlock_m_user', e.target.value)}
                      className="w-16 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-right text-xs font-bold text-indigo-600"
                    />
                    <span className="text-[10px] text-slate-400">m</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-sans">Rivet Nails</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={qty_rivet_nails_no_user !== undefined && qty_rivet_nails_no_user !== '' ? qty_rivet_nails_no_user : (qty_rivet_nails_no_erp || liveBoqResult?.qty_rivet_nails_no_erp || 0)}
                      onChange={(e) => handleFieldChange('qty_rivet_nails_no_user', e.target.value)}
                      className="w-16 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-right text-xs font-bold text-indigo-600"
                    />
                    <span className="text-[10px] text-slate-400">pcs</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-sans">Wood Screws</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {Math.ceil(qty_wood_screw_no_erp || liveBoqResult?.qty_wood_screw_no_erp || 0)} pcs
                  </strong>
                </div>
              </div>
            </div>

            {/* ITEMIZE LINER BOQ TABLE */}
            {linerBoqItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                    Itemized Liner BOQ Breakdown ({linerBoqItems.length} items):
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{Number(linerCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong> • Days: <strong>{days_to_complete_liner}</strong> • Laborers: <strong>{no_of_laborers_liner}</strong>
                  </span>
                </div>
                <SectionBoqTable items={linerBoqItems} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* SECTION 4: TILING WORKS (MOSAIC OR CERAMIC - Inherited from Proposal Entry) */}
      {/* ========================================================================= */}
      {isTilingActive && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
              <Palette className="w-4 h-4 text-cyan-600" />
              <span>
                {upstreamFinishesType.includes('0f870c8e') || upstreamFinishesType.includes('ceramic') || tiles_type === 'ceramic tiles'
                  ? 'Section 4: Ceramic Tiling Works'
                  : 'Section 4: Mosaic Glass Works'}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-cyan-50/80 dark:bg-cyan-950/40 p-1.5 px-3 rounded-xl border border-cyan-200 dark:border-cyan-800 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block">[ERP] Auto Area</span>
                <span className="font-mono font-black text-cyan-600 dark:text-cyan-400">{qty_tiling_m2_erp || liveBoqResult?.qty_tiling_m2_erp || 0} m²</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div>
                <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
                <input
                  type="number"
                  value={qty_tiling_m2_user !== undefined && qty_tiling_m2_user !== '' ? qty_tiling_m2_user : (qty_tiling_m2_erp || liveBoqResult?.qty_tiling_m2_erp || '')}
                  onChange={(e) => handleFieldChange('qty_tiling_m2_user', e.target.value)}
                  className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            {/* Primary Surface Specification */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300 block">
                {upstreamFinishesType.includes('0f870c8e') || upstreamFinishesType.includes('ceramic') || tiles_type === 'ceramic tiles'
                  ? '1. Ceramic Tile Specification'
                  : '1. Mosaic Glass Specification'}
              </span>
              <div className="max-w-md">
                {(upstreamFinishesType.includes('0f870c8e') || upstreamFinishesType.includes('ceramic') || tiles_type === 'ceramic tiles') ? (
                  <StyledSelect
                    label="Ceramic Tile Type"
                    value={water_feature_tiling_type_id || '86acaacf-f943-4845-aaeb-bd836ac641a8'}
                    onChange={(val) => handleFieldChange('water_feature_tiling_type_id', val)}
                    options={ceramicOptions}
                    placeholder="Select Ceramic..."
                  />
                ) : (
                  <StyledSelect
                    label="Mosaic Mounting Type"
                    value={water_feature_mosaic_type_id || '2e230add-9db2-413b-a970-74f4ec111524'}
                    onChange={(val) => handleFieldChange('water_feature_mosaic_type_id', val)}
                    options={mosaicOptions}
                    placeholder="Select Mosaic..."
                  />
                )}
              </div>
            </div>

            {/* Adhesive & Grout Dual Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Adhesive Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300 block">
                  2. Tile Adhesive System
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StyledSelect
                    label="Adhesive Brand"
                    value={currentAdhesiveBrand}
                    onChange={(val) => {
                      const validMats = adhesiveMats.filter(m => m.brand_id === val);
                      const firstMatId = validMats[0]?.id || '';
                      handleFieldsChange({
                        wf_adhesive_brand_id: val,
                        wf_adhesive_brand: val,
                        adhesive_brand_id: val,
                        wf_adhesive_material: firstMatId,
                        adhesive_material_id: firstMatId
                      });
                    }}
                    options={adhesiveBrandOptions}
                    placeholder="Select Brand..."
                  />
                  <StyledSelect
                    label="Adhesive Material Type"
                    value={currentAdhesiveMatId}
                    onChange={(val) => {
                      const selectedMat = adhesiveMats.find(m => m.id === val || m.item_id === val);
                      const brandId = selectedMat?.brand_id || currentAdhesiveBrand;
                      handleFieldsChange({
                        wf_adhesive_material: val,
                        adhesive_material_id: val,
                        wf_adhesive_brand_id: brandId,
                        wf_adhesive_brand: brandId,
                        adhesive_brand_id: brandId
                      });
                    }}
                    options={adhesiveMaterialOptions}
                    placeholder="Select Material..."
                  />
                </div>
              </div>

              {/* Grout Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-300 block">
                  3. Tile Grout System
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StyledSelect
                    label="Grout Brand"
                    value={currentGroutBrand}
                    onChange={(val) => {
                      const validMats = groutMats.filter(m => m.brand_id === val);
                      const firstMatId = validMats[0]?.id || '';
                      handleFieldsChange({
                        wf_grout_brand_id: val,
                        wf_grout_brand: val,
                        grout_brand_id: val,
                        wf_grout_material: firstMatId,
                        grout_material_id: firstMatId
                      });
                    }}
                    options={groutBrandOptions}
                    placeholder="Select Brand..."
                  />
                  <StyledSelect
                    label="Grout Material Type"
                    value={currentGroutMatId}
                    onChange={(val) => {
                      const selectedMat = groutMats.find(m => m.id === val || m.item_id === val);
                      const brandId = selectedMat?.brand_id || currentGroutBrand;
                      handleFieldsChange({
                        wf_grout_material: val,
                        grout_material_id: val,
                        wf_grout_brand_id: brandId,
                        wf_grout_brand: brandId,
                        grout_brand_id: brandId
                      });
                    }}
                    options={groutMaterialOptions}
                    placeholder="Select Material..."
                  />
                </div>
              </div>
            </div>

            {/* ITEMIZE TILING BOQ TABLE */}
            {tilingBoqItems.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
                    Itemized Tiling BOQ Breakdown ({tilingBoqItems.length} items):
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{Number(tilingCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong> • Days: <strong>{days_to_complete_tiling}</strong> • Laborers: <strong>{no_of_laborers_tiling}</strong>
                  </span>
                </div>
                <SectionBoqTable items={tilingBoqItems} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: COPING STONE WORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-300">
            <Ruler className="w-4 h-4 text-teal-600" />
            <span>Section 5: Coping Stone Works</span>
          </div>

          <div className="flex items-center gap-2 bg-teal-50/80 dark:bg-teal-950/40 p-1.5 px-3 rounded-xl border border-teal-200 dark:border-teal-800 text-xs">
            <div>
              <span className="text-[9px] text-slate-400 block">[ERP] Auto Length</span>
              <span className="font-mono font-black text-teal-600 dark:text-teal-400">{qty_stone_floor_m_erp || liveBoqResult?.qty_stone_floor_m_erp || 0} m</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div>
              <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
              <input
                type="number"
                value={qty_stone_floor_m_user !== undefined && qty_stone_floor_m_user !== '' ? qty_stone_floor_m_user : (qty_stone_floor_m_erp || liveBoqResult?.qty_stone_floor_m_erp || '')}
                onChange={(e) => handleFieldChange('qty_stone_floor_m_user', e.target.value)}
                className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StyledSelect
              label="Coping Stone Material"
              value={coping_stone_type}
              onChange={(val) => handleFieldChange('coping_stone_type', val)}
              options={copingOptions}
            />

            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Sika Lasqa Adhesive</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {((Number(qty_stone_floor_m_user || qty_stone_floor_m_erp || 0)) / 3.1623).toFixed(2)} kg
                </span>
              </div>
              <span className="text-[10px] text-teal-600 bg-teal-50 dark:bg-teal-950/60 px-2 py-1 rounded-lg border border-teal-200 font-bold">
                Q / 3.1623
              </span>
            </div>
          </div>

          {/* ITEMIZE COPING BOQ TABLE */}
          {copingBoqItems.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-900 dark:text-teal-300">
                  Itemized Coping BOQ Breakdown ({copingBoqItems.length} items):
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{Number(copingCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong> • Days: <strong>{days_to_complete_stone_floor}</strong> • Laborers: <strong>{no_of_laborers_stone_floor}</strong>
                </span>
              </div>
              <SectionBoqTable items={copingBoqItems} />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUMMARY KPI RIBBON */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
            Total Finishes Cost
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {Number(totalFinishesCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-sans font-bold text-slate-400">EGP</span>
          </span>
        </div>

        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
            Total Execution Days
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {totalDays} <span className="text-xs font-sans font-bold text-slate-400">Days</span>
          </span>
        </div>

        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-500/20 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
            Total Labor Crew Force
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {totalLaborers} <span className="text-xs font-sans font-bold text-slate-400">Laborers</span>
          </span>
        </div>
      </div>

    </div>
  );
}

