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
  Droplets
} from 'lucide-react';
import StyledSelect from './StyledSelect';
import SearchableSelect from './SearchableSelect';
import { buildWaterFeatureStructuralBoq } from '../utils/engine/modules/waterFeatureStructuralBoqBuilder';
import { 
  isWfOverflow,
  isWfSkimmer,
  isWfSkimfilter,
  isWfLagoon,
  isWfSandBaseLagoon,
  isWfConcreteBaseLagoon,
  STATIC_WF_TYPES_LOOKUP,
  STATIC_WF_CATEGORIES_LOOKUP,
  STATIC_ITEMS_LOOKUP,
  STATIC_BRANDS_LOOKUP,
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
                {it.total_laborers_per_day || '—'}
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

export default function WaterFeatureStructuralForm({
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
  itemCategories = []
}) {
  const {
    id = null,
    linked_phase = '',
    linked_proposal = '',
    project_owner = '',
    main_contractor = '',
    civil_consultant = '',
    region = '',

    // SECTION 2: EXCAVATION
    excavation_in_scope = 'No',
    excavation_type_beach = '',
    excavation_method = '',
    excavation_footing_m = 0.70,
    excavation_length_m = '',
    excavation_width_m = '',
    excavation_height_m = '',
    excavation_area_m2 = '',
    excavation_vol_inc_pct = '',

    // SECTION 3: PC WORKS
    pc_grade = '',
    polyethylene_brand = '',
    pc_thickness_ground_m = 0.10,
    pc_footing_ground_m = 0.10,
    pc_waterproofing_thickness_m = 0.02,
    pc_length_m = '',
    pc_width_m = '',
    pc_footing_vol_inc_pct = '',

    // SECTION 4: RC WORKS & COFFOR
    concrete_forming_type = 'dcf713e9-afca-44fe-a577-2cab176f1d2d',
    coffor_boq_title = '',
    rc_grade = '',
    rebar_diameter_mm = '',
    rebar_density_kg_m3 = 85,
    rc_thickness_ground_m = 0.25,
    rc_thickness_wall_m = 0.25,
    rc_avg_wall_height_m = '',
    rc_wall_height_deep_m = '',
    rc_length_m = '',
    rc_width_m = '',
    rc_avg_overflow_perimeter_m = '',
    rc_outer_overflow_perimeter_m = '',
    rc_ground_vol_inc_pct = '',
    rc_wall_vol_inc_pct = '',

    // SECTION 5: WATERPROOFING
    wp_bituminous_brand = '',
    wp_bituminous_material = '',
    wp_bitumen_layers = 1,
    wp_membrane_brand = '',
    wp_membrane_material = '',
    wp_cementitious_brand = '',
    wp_cementitious_material = '',
    wp_cementitious_layers = 2,
    expansion_joint_length_m = 0,
    control_joint_length_m = 0,

    // SECTION 6: BACKFILLING & EARTHWORKS
    backfilling_included = 'No',
    backfilling_method = '',
    soil_components = '',
    qty_geotextiles_m2 = '',
    qty_geomembranes_m2 = '',
    qty_geonets_m2 = '',

    // MASTER BOQ QUANTITIES ([ERP] vs [User])
    qty_excavation_m3_erp = 0,
    qty_excavation_m3_user = '',

    qty_pc_m3_erp = 0,
    qty_pc_m3_user = '',
    qty_polyethylene_kg = 0,

    qty_rc_ground_m3 = 0,
    qty_rc_ground_user_m3 = '',
    qty_rc_walls_m3 = 0,
    qty_rc_walls_user_m3 = '',
    qty_rc_island_ground_m3 = 0,
    qty_rc_island_ground_user_m3 = '',
    qty_rc_island_walls_m3 = 0,
    qty_rc_stairs_m3 = 0,
    qty_rc_stairs_user_m3 = '',
    qty_rc_lounges_m3 = 0,
    qty_rc_love_seats_m3 = 0,
    qty_rc_m3_erp = 0,
    total_rc_qty_user = '',
    coffor_qty_m2_erp = 0,
    coffor_qty_m2_user = '',

    bituminous_wp_qty_m2_erp = 0,
    bituminous_wp_qty_m2_user = '',
    qty_wp_bituminous_m2 = 0,
    qty_plaster_ext_protect_vol_m3 = 0,
    qty_cement_ext_protect_tons = 0,
    qty_sand_ext_protect_m3 = 0,
    qty_water_ext_protect_ltr = 0,
    qty_adipond_ext_ltr = 0,
    qty_grout_ext_repair_m3 = 0,

    membrane_wp_qty_m2_erp = 0,
    membrane_wp_qty_m2_user = '',
    cementitious_wp_qty_m2_erp = 0,
    cementitious_wp_qty_m2_user = '',
    qty_wp_cementitious_m2 = 0,
    qty_plaster_int_area_m2 = 0,
    qty_plaster_int_vol_m3 = 0,
    qty_cement_int_tons = 0,
    qty_sand_int_m3 = 0,
    qty_water_int_ltr = 0,
    qty_adipond_int_ltr = 0,
    qty_grout_int_repair_m3 = 0,

    // ROLLED UP COSTS & DAYS
    total_cost_pc = 0,
    days_to_complete_pc = 0,
    plain_concrete_no_of_laborers = 0,
    rc_total_cost = 0,
    rc_no_of_days_to_complete_installation = 0,
    rc_no_of_laborers = 0,
    bituminous_wp_total_cost = 0,
    bituminous_wp_no_of_days_to_complete_installation = 0,
    bituminous_wp_no_of_laborers = 0,
    cementitious_wp_total_cost = 0,
    cementitious_wp_no_of_days_to_complete_installation = 0,
    cementitious_wp_no_of_laborers = 0,
    coffor_total_cost = 0,
    coffor_no_of_days_to_complete_installation = 0,
    coffor_no_of_laborers = 0,

    accommodations_required = 'No'
  } = formData;

  // DB ITEM NAME FALLBACKS
  const DB_ITEM_NAME_FALLBACKS = {
    '8e8ef6e6-9943-455b-b9fb-1c4b78bb932a': 'Masterseal 501',
    '3395c5ef-1a41-47fe-bb08-01e4aeb0268a': 'Masterseal 588',
    'a5c99837-9b3c-4031-bbb4-b13bbfef5be8': 'masterseal 681',
    '141f6eb6-0eaa-4d32-b091-019b7e8640d5': 'Ceroplast',
    '89731c2e-01ff-4b0b-b523-d67144f82093': 'Sika Bitumen - w',
    'daaf37a1-3345-4399-b412-1bbd05d2a460': 'Sika Bitucoat - M',
    'af1b70e6-e46e-4711-a2c8-b2b152691a18': 'Insucoat - WB',
    '779d5d0d-5113-4732-acb1-1b99b7cdb93e': 'Insuprimer',
    '2780d58f-3311-4c7c-b4c4-b9cd8f88a638': 'Bitucoat',
    'debffd2d-3348-4a70-aa0a-c4145099ff82': 'Bitunil - Primanil',
    '51d71e10-d0a3-4c03-bd27-1d93345744ff': 'Bitumode Alpha - P Anti Root 4mm',
    '44377311-fa5c-4f02-85bc-58abe262b1ad': 'Bitumode Gamma - P 4mm',
    '2a35452e-9c2d-4d8c-8a1a-689bb5b30580': 'Bitumode Beta - P 4mm',
    '83d56e44-35e7-447e-bfef-5f8d5f0f700d': 'Bitumode - Delta - P 4mm',
    '3cfc7af8-20f3-4bea-9f5e-0a47a259e4aa': 'Masterseal 732AT 4mm',
    '90649a11-8d46-431e-996e-829469fcde2a': 'Sika Bit Pro 4mm',
    '1952189f-abe2-4593-a62b-a420851eda80': 'Membranil CMB 4mm',
    '93418ed4-fd56-4956-a409-49fb3a215236': 'Insutech - APP ANTIROOT',
    '18fa4190-5fb5-42e8-97e2-d64e51222132': 'Insutech N 4mm',
    '13b269b0-262a-4ef9-add2-f85f68ace6fe': 'Bitunil - Bituguard 4 mm',
    'aafb3b9b-b7ed-4245-b6c6-5411569633ae': 'Bitunil - Bituguarden - Anti Root 4 mm',
    '2d43472a-b804-4742-a1a7-b72e53b360a4': 'masterseal 521',
    'e5fbfaba-2cfc-49c0-b0a5-72085d421289': 'masterseal 541',
    '3a752e2a-ba19-4f44-b51b-d4068e02cd2e': 'masterseal 550',
    '0f9e8ac4-b4a2-4e0c-b7e5-454b9e1fbc3f': 'masterseal 599',
    'e8212c72-ea9f-4d32-801e-fa5891877509': 'Sika top seal 107',
    '8298f657-eb01-4271-ac90-e3b14b65bdaf': 'Addicur E2',
    '18e7d8a5-cd50-4832-8eee-3ff9aa7127b8': 'Addicur E2 BR',
    '8c665915-e095-4da7-9d9d-e8477e1295ec': 'Armada DPE Geomembrane 400 micron',
    'cc67f864-bdf0-4091-b3f4-7db297fc35ab': 'Shouman DPE Geomembrane 400 micron',
    'daa27b0c-d1d5-4d13-8361-430487dc3f7c': 'Ready-mixed Concrete for Plain concrete 15 N/mm²',
    'a4e313a3-2009-4878-a66e-5a9178a08d0a': 'Ready-mixed Concrete for Plain concrete 20 N/mm²',
    'ab0c6e75-d851-42cc-acb5-4680380b50c3': 'Ready-mixed Concrete for Plain concrete 25 N/mm²',
    '4e8b5ca6-4570-417f-97b9-bdf199aa012a': 'Ready-mixed Concrete for Reinforced concrete 25 N/mm²',
    'd1c44be1-b986-4993-9939-a19fb793b214': 'Ready-mixed Concrete for Reinforced concrete 30 N/mm²',
    'a1923c48-9211-4746-a6e5-e61e2e6daca9': 'Ready-mixed Concrete for Reinforced concrete 35 N/mm²',
    'ce2ed151-3c6c-43e2-bbeb-8f1f1bef9702': 'Steel Rebar ⌀ 10mm',
    '814b9a89-31e5-4fe4-8809-a0c5dbddf74d': 'Steel Rebar ⌀ 12mm',
    '20c2a434-42d2-4ed3-b088-aa234de79fff': 'Steel Rebar ⌀ 16mm'
  };

  const itemsMap = useMemo(() => {
    const map = { ...DB_ITEM_NAME_FALLBACKS };
    items.forEach(i => {
      if (i.id && i.item_name) map[i.id] = i.item_name;
    });
    return map;
  }, [items]);

  const catMap = useMemo(() => Object.fromEntries(itemCategories.map(c => [c.id, c.category_name])), [itemCategories]);
  const brandMap = useMemo(() => Object.fromEntries(brands.map(b => [b.id, b.title || b.name])), [brands]);

  // Dropdowns
  const plainConcreteOptions = useMemo(() => {
    const list = materials.filter(m => (catMap[m.item_category] || m.item_category || '').toLowerCase().includes('plain concrete'));
    if (list.length === 0) {
      return [
        { id: 'ab0c6e75-d851-42cc-acb5-4680380b50c3', item_id: 'ab0c6e75-d851-42cc-acb5-4680380b50c3', label: 'Ready-mixed Concrete for Plain concrete 25 N/mm²' },
        { id: 'a4e313a3-2009-4878-a66e-5a9178a08d0a', item_id: 'a4e313a3-2009-4878-a66e-5a9178a08d0a', label: 'Ready-mixed Concrete for Plain concrete 20 N/mm²' },
        { id: 'daa27b0c-d1d5-4d13-8361-430487dc3f7c', item_id: 'daa27b0c-d1d5-4d13-8361-430487dc3f7c', label: 'Ready-mixed Concrete for Plain concrete 15 N/mm²' }
      ];
    }
    return list.map(m => {
      const name = itemsMap[m.item_id] || DB_ITEM_NAME_FALLBACKS[m.item_id] || STATIC_ITEMS_LOOKUP[m.item_id] || `Ready-mixed Concrete for Plain concrete ${m.specification_rate} N/mm²`;
      const targetId = m.item_id || m.id;
      return { id: targetId, item_id: m.item_id, material_id: m.id, label: name, item_name: name, value: targetId };
    });
  }, [materials, itemsMap, catMap]);

  const rcGradeOptions = useMemo(() => {
    const list = materials.filter(m => (catMap[m.item_category] || m.item_category || '').toLowerCase().includes('reinforced concrete'));
    if (list.length === 0) {
      return [
        { id: 'd1c44be1-b986-4993-9939-a19fb793b214', item_id: 'd1c44be1-b986-4993-9939-a19fb793b214', label: 'Ready-mixed Concrete for Reinforced concrete 30 N/mm²' },
        { id: '4e8b5ca6-4570-417f-97b9-bdf199aa012a', item_id: '4e8b5ca6-4570-417f-97b9-bdf199aa012a', label: 'Ready-mixed Concrete for Reinforced concrete 25 N/mm²' },
        { id: 'a1923c48-9211-4746-a6e5-e61e2e6daca9', item_id: 'a1923c48-9211-4746-a6e5-e61e2e6daca9', label: 'Ready-mixed Concrete for Reinforced concrete 35 N/mm²' }
      ];
    }
    return list.map(m => {
      const name = itemsMap[m.item_id] || DB_ITEM_NAME_FALLBACKS[m.item_id] || STATIC_ITEMS_LOOKUP[m.item_id] || `Ready-mixed Concrete for Reinforced concrete ${m.specification_rate} N/mm²`;
      const targetId = m.item_id || m.id;
      return { id: targetId, item_id: m.item_id, material_id: m.id, label: name, item_name: name, value: targetId };
    });
  }, [materials, itemsMap, catMap]);

  const rebarDiameterOptions = useMemo(() => {
    const list = materials.filter(m => (catMap[m.item_category] || m.item_category || '').toLowerCase().includes('rebar'));
    if (list.length === 0) {
      return [
        { id: '814b9a89-31e5-4fe4-8809-a0c5dbddf74d', item_id: '814b9a89-31e5-4fe4-8809-a0c5dbddf74d', label: 'Steel Rebar ⌀ 12mm' },
        { id: 'ce2ed151-3c6c-43e2-bbeb-8f1f1bef9702', item_id: 'ce2ed151-3c6c-43e2-bbeb-8f1f1bef9702', label: 'Steel Rebar ⌀ 10mm' },
        { id: '20c2a434-42d2-4ed3-b088-aa234de79fff', item_id: '20c2a434-42d2-4ed3-b088-aa234de79fff', label: 'Steel Rebar ⌀ 16mm' }
      ];
    }
    return list.map(m => {
      const name = itemsMap[m.item_id] || DB_ITEM_NAME_FALLBACKS[m.item_id] || STATIC_ITEMS_LOOKUP[m.item_id] || `Steel Rebar ⌀ ${m.specification_rate}mm`;
      const targetId = m.item_id || m.id;
      return { id: targetId, item_id: m.item_id, material_id: m.id, label: name, item_name: name, value: targetId };
    });
  }, [materials, itemsMap, catMap]);

  const formingTypes = [
    { id: 'dcf713e9-afca-44fe-a577-2cab176f1d2d', label: 'Coffor Panels' }
  ];

  const normalizedFormingType = useMemo(() => {
    return 'dcf713e9-afca-44fe-a577-2cab176f1d2d';
  }, []);

  const polyethyleneOptions = useMemo(() => {
    const list = materials.filter(m => (catMap[m.item_category] || m.item_category || '').toLowerCase().includes('polyethylene') || (catMap[m.item_category] || m.item_category || '').toLowerCase().includes('geomembrane'));
    if (list.length > 0) {
      return list.map(m => {
        const name = itemsMap[m.item_id] || DB_ITEM_NAME_FALLBACKS[m.item_id] || STATIC_ITEMS_LOOKUP[m.item_id] || brandMap[m.brand_id] || STATIC_BRANDS_LOOKUP[m.brand_id] || m.name || 'Polyethylene Sheet';
        const targetId = m.item_id || m.brand_id || m.id;
        return { id: targetId, item_id: m.item_id, brand_id: m.brand_id, material_id: m.id, label: name, item_name: name, value: targetId };
      });
    }
    return [
      { id: 'cc67f864-bdf0-4091-b3f4-7db297fc35ab', item_id: 'cc67f864-bdf0-4091-b3f4-7db297fc35ab', brand_id: '80ac88d0-33c7-4aa8-9e53-e3f9de7ff5f4', label: 'Shouman DPE Geomembrane 400 micron' },
      { id: '8c665915-e095-4da7-9d9d-e8477e1295ec', item_id: '8c665915-e095-4da7-9d9d-e8477e1295ec', brand_id: 'e1650748-60f8-429d-8c52-d6b6d9cd1bea', label: 'Armada DPE Geomembrane 400 micron' }
    ];
  }, [materials, itemsMap, catMap, brandMap]);

  const bitumMats = useMemo(() => {
    const list = materials.filter(m => (catMap[m.item_category] || m.item_category || '').toLowerCase().includes('bitum'));
    if (list.length > 0) return list;
    return [
      { id: '43fb3f6c-ea99-4d69-a1b7-9aa2a0a2df33', brand_id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', item_id: '8e8ef6e6-9943-455b-b9fb-1c4b78bb932a' },
      { id: 'ad888c3f-c3fb-464a-9b16-43d9646b5a3e', brand_id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', item_id: '3395c5ef-1a41-47fe-bb08-01e4aeb0268a' },
      { id: '5373347b-1cb8-48b2-b435-0c7f2ba4d299', brand_id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', item_id: 'a5c99837-9b3c-4031-bbb4-b13bbfef5be8' },
      { id: 'e164e22a-f8be-41eb-8c6a-115f5c353c7a', brand_id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', item_id: '141f6eb6-0eaa-4d32-b091-019b7e8640d5' },
      { id: '900b991b-8534-455a-ae67-5d098d5c483a', brand_id: '25b1498a-9c86-46a2-943b-9b889001a650', item_id: '89731c2e-01ff-4b0b-b523-d67144f82093' },
      { id: 'be522e86-43b7-4c74-b52e-c5332dfce9cf', brand_id: '25b1498a-9c86-46a2-943b-9b889001a650', item_id: 'daaf37a1-3345-4399-b412-1bbd05d2a460' },
      { id: '792f9d14-cb91-455b-b9d9-bb3ff8d2eb92', brand_id: '7bc84040-9e0d-45c3-b9be-f6a1624a5a99', item_id: 'af1b70e6-e46e-4711-a2c8-b2b152691a18' },
      { id: 'a51e60dc-4d92-4cb6-ab80-60b615967b5b', brand_id: '795fa352-18ce-4122-9291-56c214dca3cf', item_id: '779d5d0d-5113-4732-acb1-1b99b7cdb93e' },
      { id: '7b70dcfa-14dc-4fa6-84fe-cfeb345511dc', brand_id: '795fa352-18ce-4122-9291-56c214dca3cf', item_id: '2780d58f-3311-4c7c-b4c4-b9cd8f88a638' },
      { id: 'e69622d6-444a-4e20-94cb-faef4ef550f2', brand_id: 'f386bedd-cdc7-4924-a024-f73de4986f5c', item_id: 'debffd2d-3348-4a70-aa0a-c4145099ff82' }
    ];
  }, [materials, catMap]);

  const bitumBrandOptions = useMemo(() => {
    const brandIds = [...new Set(bitumMats.map(m => m.brand_id).filter(Boolean))];
    const opts = brands.filter(b => brandIds.includes(b.id)).map(b => ({ id: b.id, label: b.title || b.name }));
    if (opts.length > 0) return opts;
    return [
      { id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', label: 'Basf' },
      { id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', label: 'CMB' },
      { id: '25b1498a-9c86-46a2-943b-9b889001a650', label: 'Sika' },
      { id: '7bc84040-9e0d-45c3-b9be-f6a1624a5a99', label: 'Insutech' },
      { id: '795fa352-18ce-4122-9291-56c214dca3cf', label: 'Insumat' },
      { id: 'f386bedd-cdc7-4924-a024-f73de4986f5c', label: 'Bitunil' }
    ];
  }, [bitumMats, brands]);

  const bitumMaterialOptions = useMemo(() => {
    const list = wp_bituminous_brand ? bitumMats.filter(m => m.brand_id === wp_bituminous_brand) : bitumMats;
    return list.map(m => {
      const name = itemsMap[m.item_id] || DB_ITEM_NAME_FALLBACKS[m.item_id] || 'Bituminous Material';
      return { id: m.id, label: name, item_name: name, brand_id: m.brand_id };
    });
  }, [bitumMats, wp_bituminous_brand, itemsMap]);

  const membMats = useMemo(() => {
    const list = materials.filter(m => (catMap[m.item_category] || m.item_category || '').toLowerCase().includes('membrane'));
    if (list.length > 0) return list;
    return [
      { id: '08b76313-5b87-43cf-8aa1-faea1b5a57a5', brand_id: '0b40bd94-76a2-4437-8281-8d40ff41d925', item_id: '51d71e10-d0a3-4c03-bd27-1d93345744ff' },
      { id: 'b5eeb4fe-1f06-4fc6-bca5-b3e34a6d13d7', brand_id: '0b40bd94-76a2-4437-8281-8d40ff41d925', item_id: '44377311-fa5c-4f02-85bc-58abe262b1ad' },
      { id: '4b6453e6-b119-47bb-957d-e573ee42ad5a', brand_id: '0b40bd94-76a2-4437-8281-8d40ff41d925', item_id: '2a35452e-9c2d-4d8c-8a1a-689bb5b30580' },
      { id: '22140b5c-8351-4c37-a46a-aac3d93a4bf7', brand_id: '0b40bd94-76a2-4437-8281-8d40ff41d925', item_id: '83d56e44-35e7-447e-bfef-5f8d5f0f700d' },
      { id: '44346fa9-0a55-4414-93fe-108d17cd223c', brand_id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', item_id: '3cfc7af8-20f3-4bea-9f5e-0a47a259e4aa' },
      { id: '24462e67-b95b-4d6f-acda-3e4c85642a01', brand_id: '25b1498a-9c86-46a2-943b-9b889001a650', item_id: '90649a11-8d46-431e-996e-829469fcde2a' },
      { id: 'bd7bcc1f-b773-4ba5-b13d-66c5e089466d', brand_id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', item_id: '1952189f-abe2-4593-a62b-a420851eda80' },
      { id: '93418ed4-fd56-4956-a409-49fb3a215236', brand_id: '7bc84040-9e0d-45c3-b9be-f6a1624a5a99', item_id: '93418ed4-fd56-4956-a409-49fb3a215236' },
      { id: '18fa4190-5fb5-42e8-97e2-d64e51222132', brand_id: '795fa352-18ce-4122-9291-56c214dca3cf', item_id: '18fa4190-5fb5-42e8-97e2-d64e51222132' },
      { id: '13b269b0-262a-4ef9-add2-f85f68ace6fe', brand_id: 'f386bedd-cdc7-4924-a024-f73de4986f5c', item_id: '13b269b0-262a-4ef9-add2-f85f68ace6fe' },
      { id: 'aafb3b9b-b7ed-4245-b6c6-5411569633ae', brand_id: 'f386bedd-cdc7-4924-a024-f73de4986f5c', item_id: 'aafb3b9b-b7ed-4245-b6c6-5411569633ae' }
    ];
  }, [materials, catMap]);

  const membraneBrandOptions = useMemo(() => {
    const brandIds = [...new Set(membMats.map(m => m.brand_id).filter(Boolean))];
    const opts = brands.filter(b => brandIds.includes(b.id)).map(b => ({ id: b.id, label: b.title || b.name }));
    if (opts.length > 0) return opts;
    return [
      { id: '0b40bd94-76a2-4437-8281-8d40ff41d925', label: 'Bitumode' },
      { id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', label: 'Basf' },
      { id: '25b1498a-9c86-46a2-943b-9b889001a650', label: 'Sika' },
      { id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', label: 'CMB' },
      { id: '7bc84040-9e0d-45c3-b9be-f6a1624a5a99', label: 'Insutech' },
      { id: '795fa352-18ce-4122-9291-56c214dca3cf', label: 'Insumat' },
      { id: 'f386bedd-cdc7-4924-a024-f73de4986f5c', label: 'Bitunil' }
    ];
  }, [membMats, brands]);

  const membraneMaterialOptions = useMemo(() => {
    const list = wp_membrane_brand ? membMats.filter(m => m.brand_id === wp_membrane_brand) : membMats;
    return list.map(m => {
      const name = itemsMap[m.item_id] || DB_ITEM_NAME_FALLBACKS[m.item_id] || 'Membrane Material';
      return { id: m.id, label: name, item_name: name, brand_id: m.brand_id };
    });
  }, [membMats, wp_membrane_brand, itemsMap]);

  const cementMats = useMemo(() => {
    const list = materials.filter(m => (catMap[m.item_category] || m.item_category || '').toLowerCase().includes('cement'));
    if (list.length > 0) return list;
    return [
      { id: '3ef92f0a-6829-40fc-a61a-53a42f054156', brand_id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', item_id: '2d43472a-b804-4742-a1a7-b72e53b360a4' },
      { id: 'c9b1fa3f-09a6-4f44-b51b-d4068e02cd2e', brand_id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', item_id: 'e5fbfaba-2cfc-49c0-b0a5-72085d421289' },
      { id: 'ca13a4ff-3a07-4609-9ab6-71bbe69948a0', brand_id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', item_id: '3a752e2a-ba19-4f44-b51b-d4068e02cd2e' },
      { id: '42b9a9cc-5b53-4465-9165-58458fcac431', brand_id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', item_id: '0f9e8ac4-b4a2-4e0c-b7e5-454b9e1fbc3f' },
      { id: '8e8f888e-6344-4abf-9617-9081603baae2', brand_id: '25b1498a-9c86-46a2-943b-9b889001a650', item_id: 'e8212c72-ea9f-4d32-801e-fa5891877509' },
      { id: '377bba5d-e65c-4554-86db-e85edd623a85', brand_id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', item_id: '8298f657-eb01-4271-ac90-e3b14b65bdaf' },
      { id: '81bdd941-a99f-44f9-b496-6859e4608b88', brand_id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', item_id: '18e7d8a5-cd50-4832-8eee-3ff9aa7127b8' }
    ];
  }, [materials, catMap]);

  const cementBrandOptions = useMemo(() => {
    const brandIds = [...new Set(cementMats.map(m => m.brand_id).filter(Boolean))];
    const opts = brands.filter(b => brandIds.includes(b.id)).map(b => ({ id: b.id, label: b.title || b.name }));
    if (opts.length > 0) return opts;
    return [
      { id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', label: 'Basf' },
      { id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', label: 'CMB' },
      { id: '25b1498a-9c86-46a2-943b-9b889001a650', label: 'Sika' }
    ];
  }, [cementMats, brands]);

  const cementMaterialOptions = useMemo(() => {
    const list = wp_cementitious_brand ? cementMats.filter(m => m.brand_id === wp_cementitious_brand) : cementMats;
    return list.map(m => {
      const name = itemsMap[m.item_id] || DB_ITEM_NAME_FALLBACKS[m.item_id] || 'Cementitious Material';
      return { id: m.id, label: name, item_name: name, brand_id: m.brand_id };
    });
  }, [cementMats, wp_cementitious_brand, itemsMap]);

  const rawPhase = formData.linked_phase || formData.phase_id || '';
  const pdeMatch = useMemo(() => {
    if (!rawPhase) return null;
    return wfDataEntries.find(e => 
      String(e.id) === String(rawPhase) || 
      String(e.phase_id) === String(rawPhase) ||
      String(e.linked_phase) === String(rawPhase)
    ) || null;
  }, [rawPhase, wfDataEntries]);

  const effectivePhaseId = useMemo(() => {
    if (!rawPhase) return '';
    const directPhase = phases.find(p => String(p.id) === String(rawPhase));
    if (directPhase) return directPhase.id;
    if (pdeMatch?.phase_id) {
      const pdePhase = phases.find(p => String(p.id) === String(pdeMatch.phase_id));
      if (pdePhase) return pdePhase.id;
    }
    return rawPhase;
  }, [rawPhase, phases, pdeMatch]);

  const effectiveProposalId = useMemo(() => {
    if (formData.linked_proposal) return formData.linked_proposal;
    if (formData.tender_log_id) return formData.tender_log_id;
    if (pdeMatch?.tender_log_id) return pdeMatch.tender_log_id;
    if (effectivePhaseId) {
      const matchedPh = phases.find(p => String(p.id) === String(effectivePhaseId));
      if (matchedPh?.tender_log_id) return matchedPh.tender_log_id;
    }
    return '';
  }, [formData.linked_proposal, formData.tender_log_id, pdeMatch, effectivePhaseId, phases]);

  // Filter Water Feature phases strictly belonging to the chosen tender
  const filteredWfPhases = useMemo(() => {
    return phases.filter(p => {
      const comp = String(p.component_type || '').toLowerCase();
      const isWf = comp.includes('water') || comp.includes('feature') || comp.includes('pool') || comp.includes('lagoon') || comp.includes('fountain');
      const isPr = comp.includes('pump') || comp.includes('room');
      if (isPr || !isWf) return false;

      if (effectiveProposalId) {
        return String(p.tender_log_id) === String(effectiveProposalId);
      }
      return true;
    });
  }, [phases, effectiveProposalId]);

  // Find upstream proposal_data_entry record linked to this phase
  const upstreamEntry = useMemo(() => {
    if (!effectivePhaseId && !rawPhase) return null;
    return wfDataEntries.find(e => 
      String(e.phase_id) === String(effectivePhaseId) || 
      String(e.id) === String(effectivePhaseId) ||
      String(e.linked_phase) === String(effectivePhaseId) ||
      String(e.phase_id) === String(rawPhase) ||
      String(e.id) === String(rawPhase) ||
      String(e.linked_phase) === String(rawPhase)
    ) || null;
  }, [effectivePhaseId, rawPhase, wfDataEntries]);

  // Inherited Geometry from upstream
  const pool_length = Number(upstreamEntry?.pool_length_m || formData.pool_length_m) || 0;
  const pool_width = Number(upstreamEntry?.pool_width_m || formData.pool_width_m) || 0;
  const area_wf = Number(upstreamEntry?.water_feature_area_m2 || formData.water_feature_area_m2 || formData.water_feature_area) || 0;
  const perimeter_wf = Number(upstreamEntry?.water_feature_perimeter_m || formData.water_feature_perimeter_m || formData.water_feature_perimeter) || 0;
  const avg_height = Number(upstreamEntry?.avg_height_m || formData.avg_height_m) || 0;
  const shallow_h = Number(upstreamEntry?.water_shallow_height_m || formData.water_shallow_height_m) || 0;
  const deep_h = Number(upstreamEntry?.water_deep_height_m || formData.water_deep_height_m) || 0;
  const rawShape = upstreamEntry?.swimming_pool_shape || formData.swimming_pool_shape || 'Rectangle';
  const rawCategory = upstreamEntry?.water_feature_category || formData.water_feature_category || '';
  const rawType = upstreamEntry?.water_feature_type || formData.water_feature_type || '';

  const categoryTitle = useMemo(() => {
    const matched = categories.find(c => c.id === rawCategory);
    return matched?.title || matched?.name || STATIC_WF_CATEGORIES_LOOKUP[rawCategory] || (rawCategory.includes('-') ? 'Swimming Pool' : rawCategory || 'Swimming Pool');
  }, [categories, rawCategory]);

  const typeTitle = useMemo(() => {
    const matched = featureTypes.find(t => t.id === rawType);
    return matched?.title || matched?.name || STATIC_WF_TYPES_LOOKUP[rawType] || (rawType.includes('-') ? 'Overflow' : rawType || 'Overflow');
  }, [featureTypes, rawType]);

  const isSwimmingPool = !isWfLagoon(rawCategory) && !isWfLagoon(categoryTitle);
  const isLagoon = isWfLagoon(rawCategory) || isWfLagoon(categoryTitle);
  const isRectangle = isSwimmingPool && rawShape === 'Rectangle' && pool_length > 0 && pool_width > 0;
  const isOverflow = isWfOverflow(rawType) || isWfOverflow(typeTitle);
  const isSkimmer = isWfSkimmer(rawType) || isWfSkimmer(typeTitle);
  const isSkimfilter = isWfSkimfilter(rawType, upstreamEntry?.method_of_water_filtration) || isWfSkimfilter(typeTitle);
  const isSandBaseLagoon = isWfSandBaseLagoon(rawType) || isWfSandBaseLagoon(typeTitle);
  const isConcreteBaseLagoon = isWfConcreteBaseLagoon(rawType) || isWfConcreteBaseLagoon(typeTitle);
  const isBeachYes = (upstreamEntry?.beach_included || formData.beach_included) === 'Yes';


  // Multiplier Helpers
  const getExcavationVolInc = (a) => {
    if (a < 5000) return 1.3252;
    if (a < 10000) return 1.1444;
    if (a < 20000) return 1.1022;
    if (a < 30000) return 1.0721;
    if (a < 40000) return 1.0595;
    return 1.0521;
  };

  const getPcFootingVolInc = (a) => {
    if (a < 1000) return 1.1078;
    if (a < 5000) return 1.0480;
    if (a < 10000) return 1.0341;
    if (a < 20000) return 1.0240;
    if (a < 30000) return 1.0203;
    return 1.0182;
  };

  const getRcGroundVolInc = (a) => {
    if (a < 5000) return 1.0770;
    if (a < 10000) return 1.0343;
    if (a < 20000) return 1.0244;
    if (a < 30000) return 1.0172;
    if (a < 40000) return 1.0147;
    return 1.0133;
  };

  const getRcWallVolInc = (p) => {
    if (p < 684.1) return 1.0052;
    if (p < 967.5) return 1.0023;
    if (p < 1368.2) return 1.0016;
    if (p < 1676.3) return 1.0016;
    if (p < 1936.1) return 1.0010;
    return 1.0008;
  };

  // Live BOQ Calculation Engine
  const dropdownOptions = useMemo(() => ({
    items,
    items_database: items,
    civil_material_types: materials,
    phases,
    proposal_data_entry: wfDataEntries,
    water_feature_categories: categories,
    brands
  }), [items, materials, phases, wfDataEntries, categories, brands]);

  const liveBoqResult = useMemo(() => {
    if (!linked_phase) return { items: [], form: formData, totalCost: 0 };
    const formWithContext = {
      ...formData,
      phase_id: linked_phase,
      linked_phase: linked_phase,
      tender_log_id: linked_proposal,
      linked_proposal: linked_proposal,
      accommodations_required: upstreamEntry?.accommodations_required || formData.accommodations_required
    };
    const resForm = buildWaterFeatureStructuralBoq(formWithContext, formData.proposal_breakdown_items || [], dropdownOptions);
    const items = resForm.proposal_breakdown_items || [];
    const totalCost = items
      .filter(it => it.activity_responsibility !== 'Client')
      .reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
    return {
      items,
      form: resForm,
      totalCost
    };
  }, [formData, linked_phase, linked_proposal, upstreamEntry, dropdownOptions]);

  // Section Subsystem Filtered Items
  const excavationBoqItems = useMemo(() => {
    return liveBoqResult.items.filter(i => {
      const cat = resolveCategoryName(i) || i.work_main_category || '';
      return ['Excavation', 'Geotextiles Works', 'Geomembrane Works', 'Geonets Works'].includes(cat);
    });
  }, [liveBoqResult]);

  const pcBoqItems = useMemo(() => {
    return liveBoqResult.items.filter(i => (resolveCategoryName(i) || i.work_main_category) === 'Plain Concrete');
  }, [liveBoqResult]);

  const rcBoqItems = useMemo(() => {
    return liveBoqResult.items.filter(i => (resolveCategoryName(i) || i.work_main_category) === 'Reinforced Concrete');
  }, [liveBoqResult]);

  const cofforBoqItems = useMemo(() => {
    return liveBoqResult.items.filter(i => (resolveCategoryName(i) || i.work_main_category) === 'Coffor');
  }, [liveBoqResult]);

  const bituBoqItems = useMemo(() => {
    return liveBoqResult.items.filter(i => (resolveCategoryName(i) || i.work_main_category) === 'Bituminous Waterproofing');
  }, [liveBoqResult]);

  const cemBoqItems = useMemo(() => {
    return liveBoqResult.items.filter(i => (resolveCategoryName(i) || i.work_main_category) === 'Cementitious Waterproofing');
  }, [liveBoqResult]);

  const pcTotals = useMemo(() => {
    const cost = pcBoqItems.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
    const days = liveBoqResult.form?.days_to_complete_pc || pcBoqItems.reduce((acc, it) => acc + (Number(it.days_to_complete) || 0), 0);
    const laborers = liveBoqResult.form?.plain_concrete_no_of_laborers || pcBoqItems.reduce((acc, it) => acc + (Number(it.total_laborers_per_day) || Number(it.laborers_per_group) || 0), 0);
    return { cost, days, laborers };
  }, [pcBoqItems, liveBoqResult]);

  const rcTotals = useMemo(() => {
    const cost = rcBoqItems.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
    const days = liveBoqResult.form?.rc_no_of_days_to_complete_installation || rcBoqItems.reduce((acc, it) => acc + (Number(it.days_to_complete) || 0), 0);
    const laborers = liveBoqResult.form?.rc_no_of_laborers || rcBoqItems.reduce((acc, it) => acc + (Number(it.total_laborers_per_day) || Number(it.laborers_per_group) || 0), 0);
    return { cost, days, laborers };
  }, [rcBoqItems, liveBoqResult]);

  const cofforTotals = useMemo(() => {
    const cost = cofforBoqItems.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
    const days = liveBoqResult.form?.coffor_no_of_days_to_complete_installation || cofforBoqItems.reduce((acc, it) => acc + (Number(it.days_to_complete) || 0), 0);
    const laborers = liveBoqResult.form?.coffor_no_of_laborers || cofforBoqItems.reduce((acc, it) => acc + (Number(it.total_laborers_per_day) || Number(it.laborers_per_group) || 0), 0);
    return { cost, days, laborers };
  }, [cofforBoqItems, liveBoqResult]);

  const bituTotals = useMemo(() => {
    const cost = bituBoqItems.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
    const days = liveBoqResult.form?.bituminous_wp_no_of_days_to_complete_installation || bituBoqItems.reduce((acc, it) => acc + (Number(it.days_to_complete) || 0), 0);
    const laborers = liveBoqResult.form?.bituminous_wp_no_of_laborers || bituBoqItems.reduce((acc, it) => acc + (Number(it.total_laborers_per_day) || Number(it.laborers_per_group) || 0), 0);
    return { cost, days, laborers };
  }, [bituBoqItems, liveBoqResult]);

  const cemTotals = useMemo(() => {
    const cost = cemBoqItems.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
    const days = liveBoqResult.form?.cementitious_wp_no_of_days_to_complete_installation || cemBoqItems.reduce((acc, it) => acc + (Number(it.days_to_complete) || 0), 0);
    const laborers = liveBoqResult.form?.cementitious_wp_no_of_laborers || cemBoqItems.reduce((acc, it) => acc + (Number(it.total_laborers_per_day) || Number(it.laborers_per_group) || 0), 0);
    return { cost, days, laborers };
  }, [cemBoqItems, liveBoqResult]);

  const excTotals = useMemo(() => {
    const cost = excavationBoqItems.reduce((acc, it) => acc + (Number(it.total_cost) || 0), 0);
    const days = liveBoqResult.form?.days_to_complete_excavation || excavationBoqItems.reduce((acc, it) => acc + (Number(it.days_to_complete) || 0), 0);
    const laborers = liveBoqResult.form?.no_of_laborers_excavation || excavationBoqItems.reduce((acc, it) => acc + (Number(it.total_laborers_per_day) || Number(it.laborers_per_group) || 0), 0);
    return { cost, days, laborers };
  }, [excavationBoqItems, liveBoqResult]);

  const totalStructuralCost = useMemo(() => {
    return (
      (Number(excTotals.cost) || 0) +
      (Number(pcTotals.cost) || 0) +
      (Number(rcTotals.cost) || 0) +
      (Number(cofforTotals.cost) || 0) +
      (Number(bituTotals.cost) || 0) +
      (Number(cemTotals.cost) || 0)
    );
  }, [excTotals, pcTotals, rcTotals, cofforTotals, bituTotals, cemTotals]);

  const totalStructuralDays = useMemo(() => {
    return (
      (Number(excTotals.days) || 0) +
      (Number(pcTotals.days) || 0) +
      (Number(rcTotals.days) || 0) +
      (Number(cofforTotals.days) || 0) +
      (Number(bituTotals.days) || 0) +
      (Number(cemTotals.days) || 0)
    );
  }, [excTotals, pcTotals, rcTotals, cofforTotals, bituTotals, cemTotals]);

  const totalStructuralLaborers = useMemo(() => {
    return (
      (Number(excTotals.laborers) || 0) +
      (Number(pcTotals.laborers) || 0) +
      (Number(rcTotals.laborers) || 0) +
      (Number(cofforTotals.laborers) || 0) +
      (Number(bituTotals.laborers) || 0) +
      (Number(cemTotals.laborers) || 0)
    );
  }, [excTotals, pcTotals, rcTotals, cofforTotals, bituTotals, cemTotals]);

  // Auto-fill and Calculate on Geometry changes (ONLY when phase is linked)
  useEffect(() => {
    if ((!linked_phase && !effectivePhaseId) || !upstreamEntry) return;

    const updated = { ...formData };
    const t_wall = Number(rc_thickness_wall_m) || 0.25;
    const t_ground = Number(rc_thickness_ground_m) || 0.25;
    const t_pc = Number(pc_thickness_ground_m) || 0.10;
    const footing_pc = Number(pc_footing_ground_m) || 0.10;
    const footing_exc = Number(excavation_footing_m) || 0.70;

    // Smart Defaults on Linkage if not yet selected
    if (!updated.pc_grade) updated.pc_grade = 'ab0c6e75-d851-42cc-acb5-4680380b50c3';
    if (!updated.polyethylene_brand) updated.polyethylene_brand = 'cc67f864-bdf0-4091-b3f4-7db297fc35ab';
    if (!updated.rc_grade) updated.rc_grade = 'd1c44be1-b986-4993-9939-a19fb793b214';
    if (!updated.rebar_diameter_mm) updated.rebar_diameter_mm = '814b9a89-31e5-4fe4-8809-a0c5dbddf74d';
    if (!updated.wp_bituminous_brand) updated.wp_bituminous_brand = '25b1498a-9c86-46a2-943b-9b889001a650';
    if (!updated.wp_bituminous_material) updated.wp_bituminous_material = '89731c2e-01ff-4b0b-b523-d67144f82093';
    if (!updated.wp_bitumen_layers) updated.wp_bitumen_layers = 2;
    if (!updated.wp_membrane_brand) updated.wp_membrane_brand = '795fa352-18ce-4122-9291-56c214dca3cf';
    if (!updated.wp_membrane_material) updated.wp_membrane_material = '18fa4190-5fb5-42e8-97e2-d64e51222132';
    if (!updated.wp_cementitious_brand) updated.wp_cementitious_brand = '94879bba-f69c-45c9-a6e1-c12b5a54f8c5';
    if (!updated.wp_cementitious_material) updated.wp_cementitious_material = '3395c5ef-1a41-47fe-bb08-01e4aeb0268a';
    if (!updated.wp_cementitious_layers) updated.wp_cementitious_layers = 2;

    // 1. RC Outer Dimensions
    if (isRectangle && pool_length > 0 && pool_width > 0) {
      updated.rc_length_m = Number((pool_length + 2 * t_wall).toFixed(2));
      updated.rc_width_m = Number((pool_width + 2 * t_wall).toFixed(2));
    } else {
      updated.rc_length_m = 0;
      updated.rc_width_m = 0;
    }
    const l_rc = isRectangle ? (Number(updated.rc_length_m) || (pool_length + 2 * t_wall)) : 0;
    const w_rc = isRectangle ? (Number(updated.rc_width_m) || (pool_width + 2 * t_wall)) : 0;

    // 2. PC Length & Width
    if (isRectangle && l_rc > 0 && w_rc > 0) {
      const gutterOffset = isOverflow ? 1.0 : 0;
      updated.pc_length_m = Number((l_rc + gutterOffset + 2 * footing_pc).toFixed(2));
      updated.pc_width_m = Number((w_rc + gutterOffset + 2 * footing_pc).toFixed(2));
    } else {
      updated.pc_length_m = 0;
      updated.pc_width_m = 0;
    }

    // 3. Wall Heights
    let h_avg_wall = avg_height;
    if (isSwimmingPool) {
      h_avg_wall = avg_height + (isSkimmer ? 0.15 : 0);
    } else if (isLagoon) {
      const inner_h = Number(upstreamEntry?.internal_walls_height_deep_part_m) || avg_height;
      const outer_h = Number(upstreamEntry?.outer_walls_height_deep_part_m) || avg_height;
      h_avg_wall = (inner_h + outer_h) / 2 || avg_height;
    }
    updated.rc_avg_wall_height_m = Number(h_avg_wall.toFixed(2));

    const h_deep_wall = (deep_h || avg_height) + t_ground + ((isSkimmer || isSkimfilter) ? 0.14 : 0);
    updated.rc_wall_height_deep_m = Number(h_deep_wall.toFixed(2));

    // Lagoon Axes & Joints
    if (isLagoon) {
      const longAxis = area_wf > 0 ? Number((area_wf / 35).toFixed(2)) : 0;
      const transAxis = 35.0;
      updated.rc_long_axis_m = longAxis;
      updated.rc_transverse_axis_m = transAxis;
      updated.expansion_joint_length_m = longAxis > 0 ? Number(((longAxis / 35) * transAxis).toFixed(2)) : 0;
      updated.control_joint_length_m = longAxis > 0 ? Number((((longAxis / 5) * transAxis) + ((transAxis / 5) * longAxis)).toFixed(2)) : 0;
    }

    // 4. Overflow Perimeters
    if (isOverflow && isRectangle && l_rc > 0 && w_rc > 0) {
      updated.rc_avg_overflow_perimeter_m = Number((2 * ((l_rc + 0.5) + (w_rc + 0.5))).toFixed(2));
      updated.rc_outer_overflow_perimeter_m = Number((2 * ((l_rc + 1.0) + (w_rc + 1.0))).toFixed(2));
    } else {
      updated.rc_avg_overflow_perimeter_m = 0;
      updated.rc_outer_overflow_perimeter_m = 0;
    }

    // 5. Excavation Geometry
    if (isRectangle && pool_length > 0 && pool_width > 0) {
      if (isOverflow) {
        updated.excavation_length_m = Number((pool_length + 2 * t_wall + 2 * footing_exc + 1.0).toFixed(2));
        updated.excavation_width_m = Number((pool_width + 2 * t_wall + 2 * footing_exc + 1.0).toFixed(2));
      } else {
        updated.excavation_length_m = Number((pool_length + 2 * t_wall + 2 * footing_pc + 2 * footing_exc).toFixed(2));
        updated.excavation_width_m = Number((pool_width + 2 * t_wall + 2 * footing_pc + 2 * footing_exc).toFixed(2));
      }
    } else {
      updated.excavation_length_m = 0;
      updated.excavation_width_m = 0;
    }
    updated.excavation_height_m = Number((h_deep_wall + 0.06 + 0.02 + t_pc).toFixed(2));

    // Multipliers
    const vol_inc_exc = getExcavationVolInc(area_wf);
    const vol_inc_pc = getPcFootingVolInc(area_wf);
    const vol_inc_rc_ground = getRcGroundVolInc(area_wf);
    const vol_inc_rc_wall = getRcWallVolInc(perimeter_wf);

    updated.excavation_vol_inc_pct = vol_inc_exc;
    updated.pc_footing_vol_inc_pct = vol_inc_pc;
    updated.rc_ground_vol_inc_pct = vol_inc_rc_ground;
    updated.rc_wall_vol_inc_pct = vol_inc_rc_wall;

    // 6. Quantities
    // (a) Excavation QTY
    let qty_exc = 0;
    if (isRectangle && Number(updated.excavation_length_m) > 0 && Number(updated.excavation_width_m) > 0) {
      qty_exc = Math.ceil(Number(updated.excavation_length_m) * Number(updated.excavation_width_m) * Number(updated.excavation_height_m));
    } else if (isLagoon && area_wf > 0) {
      const a_beach = Number(upstreamEntry?.beach_area_m2) || 0;
      const h_outer = Number(upstreamEntry?.outer_walls_height_deep_part_m) || Number(updated.excavation_height_m) || avg_height;
      const v_beach = a_beach > 0 ? (a_beach * h_outer / 2) : 0;
      qty_exc = Math.ceil(((area_wf - a_beach) * Number(updated.excavation_height_m) + v_beach) * vol_inc_exc);
    } else if (area_wf > 0) {
      qty_exc = Math.ceil(area_wf * Number(updated.excavation_height_m) * vol_inc_exc);
    }
    updated.qty_excavation_m3_erp = qty_exc;
    if (!updated.qty_excavation_m3_user || updated.qty_excavation_m3_user === updated.qty_excavation_m3_erp || (isLagoon && Number(updated.qty_excavation_m3_user) <= 10 && qty_exc > 10)) {
      updated.qty_excavation_m3_user = qty_exc;
    }

    // (b) PC QTY
    let qty_pc = 0;
    if (isRectangle && l_rc > 0 && w_rc > 0) {
      const pc_l = Number(updated.pc_length_m) || (l_rc + (isOverflow ? 1.0 : 0) + 2 * footing_pc);
      const pc_w = Number(updated.pc_width_m) || (w_rc + (isOverflow ? 1.0 : 0) + 2 * footing_pc);
      qty_pc = Math.ceil(pc_l * pc_w * t_pc);
    } else if (isLagoon && isSandBaseLagoon) {
      const a_beach = Number(upstreamEntry?.beach_area_m2) || 0;
      const base_w = Number(upstreamEntry?.walls_ground_base_width_m) || 1.2;
      const l_deep = Number(upstreamEntry?.total_wall_length_deep_part_m) || perimeter_wf || 0;
      const a_chaise = Number(upstreamEntry?.chaise_lounges_area_m2) || 0;
      const l_love = Number(upstreamEntry?.length_of_love_seats_m) || 0;
      const a_islands = (Number(upstreamEntry?.island_01_area_m2) || 0) + (Number(upstreamEntry?.island_02_area_m2) || 0) + (Number(upstreamEntry?.island_03_area_m2) || 0);
      const subTotalPcArea = a_beach + (base_w * l_deep) + a_chaise + (l_love * 0.45) + a_islands;
      if (subTotalPcArea > 0) {
        qty_pc = Math.ceil(subTotalPcArea * t_pc);
      } else if (area_wf > 0) {
        qty_pc = Math.ceil(area_wf * vol_inc_pc * t_pc);
      }
    } else if (area_wf > 0) {
      qty_pc = Math.ceil(area_wf * vol_inc_pc * t_pc);
    }
    updated.qty_pc_m3_erp = qty_pc;
    if (!updated.qty_pc_m3_user || updated.qty_pc_m3_user === updated.qty_pc_m3_erp || (Number(updated.qty_pc_m3_user) === 1 && qty_pc > 1)) {
      updated.qty_pc_m3_user = qty_pc;
    }

    // (c) Polyethylene Sheets QTY
    if (t_pc > 0 && qty_pc > 0) {
      const peMat = materials.find(m => m.id === updated.polyethylene_brand || m.item_id === updated.polyethylene_brand || m.brand_id === updated.polyethylene_brand);
      const peSpecRate = Number(peMat?.specification_rate) || 2.0;
      updated.qty_polyethylene_kg = Math.ceil((qty_pc / t_pc) / peSpecRate);
    }

    // (d) RC Ground & Walls
    let v_ground = 0;
    if (isRectangle && l_rc > 0 && w_rc > 0) {
      const p_outer = Number(updated.rc_outer_overflow_perimeter_m) || 0;
      v_ground = Math.ceil(l_rc * w_rc * t_ground + (isOverflow ? p_outer * 0.75 * t_ground : 0));
    } else if (isLagoon && isConcreteBaseLagoon) {
      const a_beach = Number(upstreamEntry?.beach_area_m2) || 0;
      const t_beach = Number(upstreamEntry?.rc_thickness_beach_m) || 0.20;
      v_ground = Math.ceil((area_wf * t_ground) + (isBeachYes ? a_beach * t_beach : 0));
    } else if (isLagoon && isSandBaseLagoon) {
      const base_w = Number(upstreamEntry?.walls_ground_base_width_m) || 1.2;
      const l_deep = Number(upstreamEntry?.total_wall_length_deep_part_m) || perimeter_wf || 0;
      const a_beach = Number(upstreamEntry?.beach_area_m2) || 0;
      const t_beach = Number(upstreamEntry?.rc_thickness_beach_m) || 0.20;
      const subGroundArea = (base_w * l_deep) + (isBeachYes ? a_beach : 0);
      if (subGroundArea > 0) {
        v_ground = Math.ceil((base_w * l_deep * t_ground) + (isBeachYes ? a_beach * t_beach : 0));
      } else if (area_wf > 0) {
        v_ground = Math.ceil(area_wf * vol_inc_rc_ground * t_ground);
      }
    } else if (area_wf > 0) {
      v_ground = Math.ceil(area_wf * vol_inc_rc_ground * t_ground);
    }
    updated.qty_rc_ground_m3 = v_ground;
    if (!updated.qty_rc_ground_user_m3 || updated.qty_rc_ground_user_m3 === updated.qty_rc_ground_m3 || (Number(updated.qty_rc_ground_user_m3) <= 1 && v_ground > 1)) {
      updated.qty_rc_ground_user_m3 = v_ground;
    }

    let v_walls = 0;
    if (perimeter_wf > 0 && h_avg_wall > 0) {
      v_walls = Math.ceil((perimeter_wf * (isRectangle ? 1 : vol_inc_rc_wall)) * h_avg_wall * t_wall);
    }
    updated.qty_rc_walls_m3 = v_walls;
    if (!updated.qty_rc_walls_user_m3 || updated.qty_rc_walls_user_m3 === updated.qty_rc_walls_m3 || (Number(updated.qty_rc_walls_user_m3) === 0 && v_walls > 0)) {
      updated.qty_rc_walls_user_m3 = v_walls;
    }

    // Islands RC
    const i1_a = Number(upstreamEntry?.island_01_area_m2) || 0;
    const i2_a = Number(upstreamEntry?.island_02_area_m2) || 0;
    const i3_a = Number(upstreamEntry?.island_03_area_m2) || 0;
    const total_i_a = i1_a + i2_a + i3_a;

    const i1_h = Number(upstreamEntry?.island_01_height_m) || 0;
    const i2_h = Number(upstreamEntry?.island_02_height_m) || 0;
    const i3_h = Number(upstreamEntry?.island_03_height_m) || 0;
    const v_i_walls = (i1_a * i1_h + i2_a * i2_h + i3_a * i3_h) * t_wall;

    updated.qty_rc_island_ground_m3 = Number((total_i_a * t_ground).toFixed(2));
    updated.qty_rc_island_walls_m3 = Number(v_i_walls.toFixed(2));

    // Stairs RC
    const stair_l = Number(upstreamEntry?.lengths_of_concrete_stairs) || 0;
    const stair_h = Number(upstreamEntry?.height_of_concrete_stairs_m) || 0;
    const v_stairs = stair_l > 0 && stair_h > 0 ? (0.5 * stair_h * (2 * stair_h) * stair_l) : 0;
    updated.qty_rc_stairs_m3 = Number(v_stairs.toFixed(2));

    // Lounges & Love Seats RC
    const a_chaise = Number(upstreamEntry?.chaise_lounges_area_m2) || 0;
    const l_love = Number(upstreamEntry?.length_of_love_seats_m) || 0;
    updated.qty_rc_lounges_m3 = Number((a_chaise * t_ground).toFixed(2));
    updated.qty_rc_love_seats_m3 = Number((l_love * 0.45 * 0.45).toFixed(2));

    const total_rc = Number((
      v_ground + v_walls + 
      updated.qty_rc_island_ground_m3 + updated.qty_rc_island_walls_m3 + 
      updated.qty_rc_stairs_m3 + updated.qty_rc_lounges_m3 + updated.qty_rc_love_seats_m3
    ).toFixed(2));
    updated.qty_rc_m3_erp = Math.ceil(total_rc);
    if (!updated.total_rc_qty_user || updated.total_rc_qty_user === updated.qty_rc_m3_erp || (Number(updated.total_rc_qty_user) <= 2 && total_rc > 2)) {
      updated.total_rc_qty_user = Math.ceil(total_rc);
    }

    // (e) Coffor Formwork Area QTY
    let qty_coffor = 0;
    const p_outer = Number(updated.rc_outer_overflow_perimeter_m) || 0;
    const i_p_h = (Number(upstreamEntry?.island_01_perimeter_m) || 0) * i1_h + 
                  (Number(upstreamEntry?.island_02_perimeter_m) || 0) * i2_h + 
                  (Number(upstreamEntry?.island_03_perimeter_m) || 0) * i3_h;

    if (isRectangle && l_rc > 0 && w_rc > 0) {
      qty_coffor = Math.ceil(2 * (l_rc + w_rc) * h_deep_wall + (isOverflow ? 0.5 * p_outer : 0) + i_p_h);
    } else if (perimeter_wf > 0) {
      qty_coffor = Math.ceil((perimeter_wf * vol_inc_rc_wall) * h_deep_wall + (isOverflow ? 0.5 * p_outer : 0) + i_p_h);
    }
    updated.coffor_qty_m2_erp = qty_coffor;
    if (!updated.coffor_qty_m2_user || updated.coffor_qty_m2_user === updated.coffor_qty_m2_erp || (Number(updated.coffor_qty_m2_user) <= 4 && qty_coffor > 4)) {
      updated.coffor_qty_m2_user = qty_coffor;
    }

    // (f) Waterproofing & Plastering
    // 1. Bituminous Waterproofing (External)
    let a_ground_pc = 0;
    let p_base = 0;
    if (isRectangle && l_rc > 0 && w_rc > 0) {
      const pc_l = Number(updated.pc_length_m) || (l_rc + (isOverflow ? 1.0 : 0) + 2 * footing_pc);
      const pc_w = Number(updated.pc_width_m) || (w_rc + (isOverflow ? 1.0 : 0) + 2 * footing_pc);
      a_ground_pc = pc_l * pc_w;
      p_base = 2 * (pc_l + pc_w);
    } else if (isLagoon && isSandBaseLagoon) {
      const base_w = Number(upstreamEntry?.walls_ground_base_width_m) || 1.2;
      const l_deep = Number(upstreamEntry?.total_wall_length_deep_part_m) || perimeter_wf || 0;
      a_ground_pc = base_w * l_deep;
      p_base = perimeter_wf * vol_inc_rc_wall;
    } else {
      a_ground_pc = area_wf * vol_inc_pc;
      p_base = perimeter_wf * vol_inc_rc_wall;
    }
    const bitum_qty = Number((a_ground_pc + p_base * h_deep_wall).toFixed(2));
    updated.qty_wp_bituminous_m2 = bitum_qty;
    updated.bituminous_wp_qty_m2_erp = bitum_qty;
    if (!updated.bituminous_wp_qty_m2_user || updated.bituminous_wp_qty_m2_user === updated.bituminous_wp_qty_m2_erp || (Number(updated.bituminous_wp_qty_m2_user) <= 6 && bitum_qty > 6)) {
      updated.bituminous_wp_qty_m2_user = bitum_qty;
    }

    // External Protection Plaster
    const v_plaster_ext = Number((bitum_qty * 0.02).toFixed(3));
    updated.qty_plaster_ext_protect_vol_m3 = v_plaster_ext;
    updated.qty_cement_ext_protect_tons = Number(((v_plaster_ext * 1.5 * 0.2) * 1.4).toFixed(3));
    updated.qty_sand_ext_protect_m3 = Number((v_plaster_ext * 1.5 * 0.8).toFixed(3));
    updated.qty_water_ext_protect_ltr = Number((updated.qty_cement_ext_protect_tons * 0.5 * 1000).toFixed(1));
    updated.qty_adipond_ext_ltr = Number((updated.qty_water_ext_protect_ltr / 10).toFixed(1));
    updated.qty_grout_ext_repair_m3 = Number((bitum_qty * 0.001).toFixed(4));

    // 2. Membrane Waterproofing (External 4mm)
    updated.membrane_wp_qty_m2_erp = bitum_qty;
    if (!updated.membrane_wp_qty_m2_user || updated.membrane_wp_qty_m2_user === updated.membrane_wp_qty_m2_erp || (Number(updated.membrane_wp_qty_m2_user) <= 6 && bitum_qty > 6)) {
      updated.membrane_wp_qty_m2_user = bitum_qty;
    }

    // 3. Cementitious Waterproofing (Internal)
    let cem_qty = 0;
    const h_cem_wall = avg_height + 0.15;
    if (isRectangle && pool_length > 0 && pool_width > 0) {
      const a_floor = pool_length * pool_width;
      const p_inner = 2 * (pool_length + pool_width);
      cem_qty = Math.ceil(a_floor + p_inner * h_cem_wall + a_chaise + total_i_a);
    } else if (isLagoon && isSandBaseLagoon) {
      const l_deep = Number(upstreamEntry?.total_wall_length_deep_part_m) || perimeter_wf || 0;
      cem_qty = Math.ceil(l_deep * h_cem_wall + a_chaise + total_i_a);
    } else if (area_wf > 0) {
      cem_qty = Math.ceil(area_wf + perimeter_wf * h_cem_wall + a_chaise + total_i_a);
    }
    updated.qty_wp_cementitious_m2 = cem_qty;
    updated.cementitious_wp_qty_m2_erp = cem_qty;
    if (!updated.cementitious_wp_qty_m2_user || updated.cementitious_wp_qty_m2_user === updated.cementitious_wp_qty_m2_erp || (Number(updated.cementitious_wp_qty_m2_user) <= 2 && cem_qty > 2)) {
      updated.cementitious_wp_qty_m2_user = cem_qty;
    }

    // Internal 2cm Screed Plaster
    const a_plaster_int = (isRectangle && pool_length > 0 && pool_width > 0) 
      ? (pool_length * pool_width + 2 * (pool_length + pool_width) * avg_height) 
      : (isLagoon && isSandBaseLagoon)
      ? ((Number(upstreamEntry?.total_wall_length_deep_part_m) || perimeter_wf || 0) * avg_height)
      : (area_wf + perimeter_wf * avg_height);
    updated.qty_plaster_int_area_m2 = Number(a_plaster_int.toFixed(2));
    const v_plaster_int = Number((a_plaster_int * 0.02).toFixed(3));
    updated.qty_plaster_int_vol_m3 = v_plaster_int;
    updated.qty_cement_int_tons = Number(((v_plaster_int * 1.5 * 0.2) * 1.4).toFixed(3));
    updated.qty_sand_int_m3 = Number((v_plaster_int * 1.5 * 0.8).toFixed(3));
    updated.qty_water_int_ltr = Number((updated.qty_cement_int_tons * 0.5 * 1000).toFixed(1));
    updated.qty_adipond_int_ltr = Number((updated.qty_water_int_ltr / 10).toFixed(1));
    updated.qty_grout_int_repair_m3 = Number((cem_qty * 0.001).toFixed(4));

    // Earthworks Lagoon Layers
    if (isLagoon) {
      const a_beach = Number(upstreamEntry?.beach_area_m2) || 0;
      const effectiveLagoonArea = Math.max(0, area_wf - a_beach) || area_wf;
      updated.qty_geotextiles_m2 = Math.ceil(effectiveLagoonArea * 1.15);
      updated.qty_geomembranes_m2 = Math.ceil(effectiveLagoonArea * 1.15);
      updated.qty_geonets_m2 = Math.ceil(effectiveLagoonArea * 1.10);
    }

    // Check if changed
    let isDifferent = false;
    for (const key of Object.keys(updated)) {
      if (updated[key] !== formData[key]) {
        isDifferent = true;
        break;
      }
    }

    if (isDifferent) {
      onChange(updated);
    }
  }, [
    linked_phase, effectivePhaseId, upstreamEntry,
    rc_thickness_wall_m, rc_thickness_ground_m, pc_thickness_ground_m, 
    pc_footing_ground_m, excavation_footing_m, pool_length, pool_width, 
    area_wf, perimeter_wf, avg_height, isRectangle, isSwimmingPool, 
    isLagoon, isOverflow, isSkimmer, isSkimfilter, isSandBaseLagoon, isConcreteBaseLagoon
  ]);


  // Field change handler
  const handleFieldChange = (field, value) => {
    let nextForm = {
      ...formData,
      [field]: value
    };
    if (field === 'wp_membrane_brand') {
      const available = membMats.filter(m => m.brand_id === value);
      if (available.length > 0 && !available.some(m => m.id === formData.wp_membrane_material || m.item_id === formData.wp_membrane_material)) {
        nextForm.wp_membrane_material = available[0].id || available[0].item_id;
      }
    } else if (field === 'wp_bituminous_brand') {
      const available = bitumMats.filter(m => m.brand_id === value);
      if (available.length > 0 && !available.some(m => m.id === formData.wp_bituminous_material || m.item_id === formData.wp_bituminous_material)) {
        nextForm.wp_bituminous_material = available[0].id || available[0].item_id;
      }
    } else if (field === 'wp_cementitious_brand') {
      const available = cementMats.filter(m => m.brand_id === value);
      if (available.length > 0 && !available.some(m => m.id === formData.wp_cementitious_material || m.item_id === formData.wp_cementitious_material)) {
        nextForm.wp_cementitious_material = available[0].id || available[0].item_id;
      }
    }
    onChange(nextForm);
  };

  // Sync All Handler
  const handleSyncAllToErp = () => {
    onChange({
      ...formData,
      qty_excavation_m3_user: qty_excavation_m3_erp,
      qty_pc_m3_user: qty_pc_m3_erp,
      total_rc_qty_user: qty_rc_m3_erp,
      qty_rc_ground_user_m3: qty_rc_ground_m3,
      qty_rc_walls_user_m3: qty_rc_walls_m3,
      qty_rc_island_ground_user_m3: qty_rc_island_ground_m3,
      qty_rc_stairs_user_m3: qty_rc_stairs_m3,
      coffor_qty_m2_user: coffor_qty_m2_erp,
      bituminous_wp_qty_m2_user: bituminous_wp_qty_m2_erp,
      membrane_wp_qty_m2_user: membrane_wp_qty_m2_erp,
      cementitious_wp_qty_m2_user: cementitious_wp_qty_m2_erp
    });
  };

  // Phase selection handler
  const handlePhaseSelect = (phaseId) => {
    const selectedPh = phases.find(p => p.id === phaseId);
    const relatedProp = selectedPh ? proposals.find(p => p.id === selectedPh.tender_log_id) : null;
    const relatedEntry = wfDataEntries.find(e => e.phase_id === phaseId || e.id === phaseId);
    
    onChange({
      ...formData,
      linked_phase: phaseId,
      phase_id: phaseId,
      linked_proposal: relatedProp ? relatedProp.id : linked_proposal,
      project_owner: relatedProp?.client_id || project_owner,
      main_contractor: relatedProp?.main_contractor || main_contractor,
      civil_consultant: relatedProp?.civil_consultant || civil_consultant,
      region: relatedProp?.region || region,
      accommodations_required: relatedEntry?.accommodations_required || formData.accommodations_required || 'No',
      wp_bituminous_brand: formData.wp_bituminous_brand || '25b1498a-9c86-46a2-943b-9b889001a650',
      wp_bituminous_material: formData.wp_bituminous_material || '89731c2e-01ff-4b0b-b523-d67144f82093',
      wp_bitumen_layers: formData.wp_bitumen_layers || 2,
      wp_membrane_brand: formData.wp_membrane_brand || '795fa352-18ce-4122-9291-56c214dca3cf',
      wp_membrane_material: formData.wp_membrane_material || '18fa4190-5fb5-42e8-97e2-d64e51222132',
      wp_cementitious_brand: formData.wp_cementitious_brand || '94879bba-f69c-45c9-a6e1-c12b5a54f8c5',
      wp_cementitious_material: formData.wp_cementitious_material || '3395c5ef-1a41-47fe-bb08-01e4aeb0268a',
      wp_cementitious_layers: formData.wp_cementitious_layers || 2
    });
  };

  const handleTenderSelect = (tenderId) => {
    const matchedProp = proposals.find(p => p.id === tenderId);
    onChange({
      ...formData,
      linked_proposal: tenderId,
      linked_phase: '',
      phase_id: '',
      project_owner: matchedProp?.client_id || '',
      main_contractor: matchedProp?.main_contractor || '',
      civil_consultant: matchedProp?.civil_consultant || '',
      region: matchedProp?.region || ''
    });
  };

  const yesNoOptions = [
    { id: 'No', label: 'No' },
    { id: 'Yes', label: 'Yes' }
  ];

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* SECTION 1: LINKAGE & PROJECT CONTEXT */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
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
              value={effectiveProposalId || linked_proposal}
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
              value={effectivePhaseId || linked_phase}
              onChange={handlePhaseSelect}
              placeholder={effectiveProposalId ? "Select Water Feature Phase..." : "Select Tender first..."}
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
              {isSwimmingPool ? (
                <>Shape: <strong>{rawShape}</strong></>
              ) : (
                <>Geometry: <strong>Free Form / Lagoon</strong></>
              )}
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
      {/* SECTION 2: EXCAVATION WORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-900 dark:text-orange-300">
            <Truck className="w-4 h-4 text-orange-600" />
            <span>Section 2: Excavation Works</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-32">
              <StyledSelect
                value={excavation_in_scope}
                onChange={(val) => handleFieldChange('excavation_in_scope', val)}
                options={yesNoOptions}
              />
            </div>

            {excavation_in_scope === 'Yes' && linked_phase && (
              <div className="flex items-center gap-2 bg-orange-50/80 dark:bg-orange-950/40 p-1.5 px-3 rounded-xl border border-orange-200 dark:border-orange-800 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block">[ERP] Auto</span>
                  <span className="font-mono font-black text-orange-600 dark:text-orange-400">{qty_excavation_m3_erp || 0} m³</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div>
                  <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
                  <input
                    type="number"
                    value={qty_excavation_m3_user}
                    onChange={(e) => handleFieldChange('qty_excavation_m3_user', e.target.value)}
                    className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {!linked_phase ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Please select a <strong>Water Feature Phase</strong> in Section 1 to load project geometry and calculate BOQ line items.</span>
          </div>
        ) : (
          excavation_in_scope === 'Yes' && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLagoon && isBeachYes && (
                  <StyledSelect
                    label="Excavation Type for Beach"
                    value={excavation_type_beach}
                    onChange={(val) => handleFieldChange('excavation_type_beach', val)}
                    options={[
                      { id: 'Slope Area Excavation', label: 'Slope Area Excavation' },
                      { id: 'Full Area Excavation', label: 'Full Area Excavation' }
                    ]}
                    placeholder="Select Beach Profile..."
                  />
                )}

                <StyledSelect
                  label="Method of Excavation"
                  value={excavation_method}
                  onChange={(val) => handleFieldChange('excavation_method', val)}
                  options={[
                    { id: 'Excavation Subcontractor', label: 'Excavation Subcontractor' },
                    { id: 'Heavy Tool and Machines', label: 'Heavy Tool and Machines' }
                  ]}
                  placeholder="Select Method..."
                />

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Footing of Excavation (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={excavation_footing_m}
                    onChange={(e) => handleFieldChange('excavation_footing_m', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Excavation Height (m)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={excavation_height_m}
                    className="w-full px-3.5 py-2 bg-orange-50/50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl text-xs font-mono font-black text-orange-900 dark:text-orange-300"
                  />
                </div>
              </div>

              {/* Excavation Geometry Breakdown */}
              <div className="overflow-x-auto rounded-2xl border border-orange-200/70 dark:border-orange-900/40 bg-orange-50/20 dark:bg-orange-950/10">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-orange-100/50 dark:bg-orange-950/40 border-b border-orange-200/60 dark:border-orange-900/40 text-[10px] font-bold uppercase tracking-wider text-orange-900 dark:text-orange-300">
                      {isRectangle ? (
                        <>
                          <th className="py-2.5 px-3">Pit Length</th>
                          <th className="py-2.5 px-3">Pit Width</th>
                          <th className="py-2.5 px-3">Pit Height</th>
                          <th className="py-2.5 px-3">Pit Footing Offset</th>
                          <th className="py-2.5 px-3">Vol Multiplier</th>
                          <th className="py-2.5 px-3 text-right">Calculated Excavation Vol</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2.5 px-3">Water Feature Area</th>
                          <th className="py-2.5 px-3">Perimeter</th>
                          <th className="py-2.5 px-3">Excavation Depth</th>
                          <th className="py-2.5 px-3">Vol Multiplier</th>
                          <th className="py-2.5 px-3 text-right">Calculated Excavation Vol</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr>
                      {isRectangle ? (
                        <>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{excavation_length_m || '—'} m</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{excavation_width_m || '—'} m</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{excavation_height_m || '—'} m</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">+{excavation_footing_m || 0.7} m</td>
                          <td className="py-2.5 px-3 text-orange-700 dark:text-orange-400">×{excavation_vol_inc_pct || 1.0}</td>
                          <td className="py-2.5 px-3 text-right font-black text-orange-600 dark:text-orange-400 text-sm">
                            {qty_excavation_m3_erp || 0} m³
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{area_wf} m²</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{perimeter_wf} m</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{excavation_height_m || '—'} m</td>
                          <td className="py-2.5 px-3 text-orange-700 dark:text-orange-400">×{excavation_vol_inc_pct || 1.0}</td>
                          <td className="py-2.5 px-3 text-right font-black text-orange-600 dark:text-orange-400 text-sm">
                            {qty_excavation_m3_erp || 0} m³
                          </td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Lagoon Earthworks BOQ Items if present */}
              {excavationBoqItems.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 block">
                    Lagoon Earthworks BOQ Items:
                  </span>
                  <SectionBoqTable items={excavationBoqItems} />
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: PLAIN CONCRETE (PC) WORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-blue-900 dark:text-blue-300">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Section 3: Plain Concrete (PC) Works</span>
          </div>

          {linked_phase && (
            <div className="flex items-center gap-2 bg-blue-50/80 dark:bg-blue-950/40 p-1.5 px-3 rounded-xl border border-blue-200 dark:border-blue-800 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block">[ERP] Auto</span>
                <span className="font-mono font-black text-blue-600 dark:text-blue-400">{qty_pc_m3_erp || 0} m³</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div>
                <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
                <input
                  type="number"
                  value={qty_pc_m3_user}
                  onChange={(e) => handleFieldChange('qty_pc_m3_user', e.target.value)}
                  className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
                />
              </div>
            </div>
          )}
        </div>

        {!linked_phase ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Please select a <strong>Water Feature Phase</strong> in Section 1 to load project geometry and calculate BOQ line items.</span>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Row 1: Material Specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StyledSelect
                label="Grade of Plain Concrete"
                value={pc_grade}
                onChange={(val) => handleFieldChange('pc_grade', val)}
                options={plainConcreteOptions}
                placeholder="Select Plain Concrete..."
              />

              <StyledSelect
                label="Polyethylene Sheets Brand"
                value={polyethylene_brand}
                onChange={(val) => handleFieldChange('polyethylene_brand', val)}
                options={polyethyleneOptions}
                placeholder="Select Sheet Type..."
              />
            </div>

            {/* Row 2: Physical Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Thickness of PC Ground (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pc_thickness_ground_m}
                  onChange={(e) => handleFieldChange('pc_thickness_ground_m', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Footing of PC Ground (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pc_footing_ground_m}
                  onChange={(e) => handleFieldChange('pc_footing_ground_m', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* ALL PLAIN CONCRETE BOQ ITEMS BREAKDOWN TABLE */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-300">
                  Itemized Plain Concrete BOQ Breakdown ({pcBoqItems.length} items):
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Total Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{pcTotals.cost ? Number(pcTotals.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} EGP</strong> • Days: <strong>{pcTotals.days}</strong> • Laborers: <strong>{pcTotals.laborers}</strong>
                </span>
              </div>
              <SectionBoqTable items={pcBoqItems} />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: REINFORCED CONCRETE (RC) WORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
            <Building2 className="w-4 h-4 text-cyan-600" />
            <span>Section 4: Reinforced Concrete (RC) Works</span>
          </div>

          {linked_phase && (
            <div className="flex items-center gap-2 bg-cyan-50/80 dark:bg-cyan-950/40 p-1.5 px-3 rounded-xl border border-cyan-200 dark:border-cyan-800 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block">Total RC [ERP]</span>
                <span className="font-mono font-black text-cyan-600 dark:text-cyan-400">{qty_rc_m3_erp || 0} m³</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div>
                <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
                <input
                  type="number"
                  value={total_rc_qty_user}
                  onChange={(e) => handleFieldChange('total_rc_qty_user', e.target.value)}
                  className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
                />
              </div>
            </div>
          )}
        </div>

        {!linked_phase ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Please select a <strong>Water Feature Phase</strong> in Section 1 to load project geometry and calculate BOQ line items.</span>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StyledSelect
                label="Grade of RC (N/mm²)"
                value={rc_grade}
                onChange={(val) => handleFieldChange('rc_grade', val)}
                options={rcGradeOptions}
                placeholder="Select Reinforced Concrete..."
              />

              <StyledSelect
                label="Rebar Diameter (mm)"
                value={rebar_diameter_mm}
                onChange={(val) => handleFieldChange('rebar_diameter_mm', val)}
                options={rebarDiameterOptions}
                placeholder="Select Rebar Diameter..."
              />

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Rebar Density (Kg/m³)
                </label>
                <input
                  type="number"
                  value={rebar_density_kg_m3}
                  onChange={(e) => handleFieldChange('rebar_density_kg_m3', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  RC Thickness Ground (m)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={rc_thickness_ground_m}
                  onChange={(e) => handleFieldChange('rc_thickness_ground_m', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  RC Thickness Walls (m)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={rc_thickness_wall_m}
                  onChange={(e) => handleFieldChange('rc_thickness_wall_m', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Avg Height RC Walls (m)
                </label>
                <input
                  type="number"
                  readOnly
                  value={rc_avg_wall_height_m}
                  className="w-full px-3.5 py-2 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-mono font-black text-cyan-900 dark:text-cyan-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Height Walls Deep Part (m)
                </label>
                <input
                  type="number"
                  readOnly
                  value={rc_wall_height_deep_m}
                  className="w-full px-3.5 py-2 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-mono font-black text-cyan-900 dark:text-cyan-300"
                />
              </div>
            </div>

            {/* RC Component Quantities Breakdown Strip */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400 block">
                Component Geometry Breakdown:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Ground Slab</span>
                  <strong className="text-cyan-600 dark:text-cyan-400">{qty_rc_ground_m3 || 0} m³</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">RC Walls</span>
                  <strong className="text-cyan-600 dark:text-cyan-400">{qty_rc_walls_m3 || 0} m³</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Islands</span>
                  <strong className="text-slate-800 dark:text-slate-200">{((Number(qty_rc_island_ground_m3) || 0) + (Number(qty_rc_island_walls_m3) || 0)).toFixed(2)} m³</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Stairs</span>
                  <strong className="text-slate-800 dark:text-slate-200">{qty_rc_stairs_m3 || 0} m³</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Lounges/Seats</span>
                  <strong className="text-slate-800 dark:text-slate-200">{((Number(qty_rc_lounges_m3) || 0) + (Number(qty_rc_love_seats_m3) || 0)).toFixed(2)} m³</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Total RC</span>
                  <strong className="text-cyan-600 dark:text-cyan-400 font-black">{qty_rc_m3_erp || 0} m³</strong>
                </div>
              </div>
            </div>

            {/* ITEMIZE RC BOQ BREAKDOWN TABLE */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
                  Itemized RC BOQ Breakdown ({rcBoqItems.length} items):
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Total Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{rcTotals.cost ? Number(rcTotals.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} EGP</strong> • Days: <strong>{rcTotals.days}</strong> • Laborers: <strong>{rcTotals.laborers}</strong>
                </span>
              </div>
              <SectionBoqTable items={rcBoqItems} />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: COFFOR WORKS & FORMING SYSTEM */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Section 5: Coffor Works & Forming System</span>
          </div>

          {linked_phase && (
            <div className="flex items-center gap-2 bg-amber-50/80 dark:bg-amber-950/40 p-1.5 px-3 rounded-xl border border-amber-200 dark:border-amber-800 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block">Coffor Area [ERP]</span>
                <span className="font-mono font-black text-amber-600 dark:text-amber-400">{coffor_qty_m2_erp || 0} m²</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <div>
                <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
                <input
                  type="number"
                  value={coffor_qty_m2_user}
                  onChange={(e) => handleFieldChange('coffor_qty_m2_user', e.target.value)}
                  className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
                />
              </div>
            </div>
          )}
        </div>

        {!linked_phase ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Please select a <strong>Water Feature Phase</strong> in Section 1 to load project geometry and calculate BOQ line items.</span>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StyledSelect
                label="Concrete Forming System"
                value={normalizedFormingType}
                onChange={(val) => handleFieldChange('concrete_forming_type', val)}
                options={formingTypes}
                placeholder="Select Formwork..."
              />

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Coffor BOQ Line Item Title
                </label>
                <input
                  type="text"
                  value={coffor_boq_title || ''}
                  placeholder="Supply & Installation of Coffor Formwork Panels"
                  onChange={(e) => handleFieldChange('coffor_boq_title', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* ITEMIZE COFFOR BOQ BREAKDOWN TABLE */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Itemized Coffor BOQ Breakdown ({cofforBoqItems.length} items):
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Total Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{cofforTotals.cost ? Number(cofforTotals.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} EGP</strong> • Days: <strong>{cofforTotals.days}</strong> • Laborers: <strong>{cofforTotals.laborers}</strong>
                </span>
              </div>
              <SectionBoqTable items={cofforBoqItems} />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: BITUMINOUS & MEMBRANE WATERPROOFING */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Section 6: Bituminous & Membrane Waterproofing</span>
          </div>

          {linked_phase && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Bituminous / Membrane Area */}
              <div className="flex items-center gap-2 bg-indigo-50/80 dark:bg-indigo-950/40 p-1.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block">External WP [ERP]</span>
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{bituminous_wp_qty_m2_erp || 0} m²</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div>
                  <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
                  <input
                    type="number"
                    value={bituminous_wp_qty_m2_user}
                    onChange={(e) => handleFieldChange('bituminous_wp_qty_m2_user', e.target.value)}
                    className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {!linked_phase ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Please select a <strong>Water Feature Phase</strong> in Section 1 to load project geometry and calculate BOQ line items.</span>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Input Grid for Bituminous & Membrane */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Sub-card 1: Bituminous Waterproofing */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    1. Bituminous Waterproofing (Liquid / Primer)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StyledSelect
                    label="Brand"
                    value={wp_bituminous_brand}
                    onChange={(val) => handleFieldChange('wp_bituminous_brand', val)}
                    options={bitumBrandOptions}
                    placeholder="Select Brand..."
                  />

                  <StyledSelect
                    label="Material Specification"
                    value={wp_bituminous_material}
                    onChange={(val) => handleFieldChange('wp_bituminous_material', val)}
                    options={bitumMaterialOptions}
                    placeholder="Select Material Spec..."
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Application Layers</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={wp_bitumen_layers}
                      onChange={(e) => handleFieldChange('wp_bitumen_layers', e.target.value)}
                      className="w-16 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-center text-xs font-mono font-bold"
                    />
                    <span className="text-[11px] text-slate-400">Layers</span>
                  </div>
                </div>
              </div>

              {/* Sub-card 2: Membrane Waterproofing */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    2. Membrane Waterproofing (Anti-Root Sheet)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StyledSelect
                    label="Brand"
                    value={wp_membrane_brand}
                    onChange={(val) => handleFieldChange('wp_membrane_brand', val)}
                    options={membraneBrandOptions}
                    placeholder="Select Brand..."
                  />

                  <StyledSelect
                    label="Material Specification"
                    value={wp_membrane_material}
                    onChange={(val) => handleFieldChange('wp_membrane_material', val)}
                    options={membraneMaterialOptions}
                    placeholder="Select Material Spec..."
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Specification Type</span>
                  <span className="px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 font-mono font-bold rounded-lg text-[11px]">
                    4mm Anti-Root Sheet
                  </span>
                </div>
              </div>

            </div>

            {/* External Protective Screed Summary Strip */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-400 block">
                External Protective Screed Consumables:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px]">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Volume</span>
                  <strong className="text-indigo-600 dark:text-indigo-400">{qty_plaster_ext_protect_vol_m3 || 0} m³</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Cement</span>
                  <strong className="text-amber-600 dark:text-amber-400">{qty_cement_ext_protect_tons || 0} Tons</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Sand</span>
                  <strong className="text-slate-800 dark:text-slate-200">{qty_sand_ext_protect_m3 || 0} m³</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Water</span>
                  <strong className="text-blue-600 dark:text-blue-400">{qty_water_ext_protect_ltr || 0} L</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Addibond</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{qty_adipond_ext_ltr || 0} L</strong>
                </div>
              </div>
            </div>

            {/* ITEMIZE BITUMINOUS & MEMBRANE BOQ BREAKDOWN TABLE */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                  Itemized Bituminous & Membrane BOQ Breakdown ({bituBoqItems.length} items):
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Total Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{bituTotals.cost ? Number(bituTotals.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} EGP</strong> • Days: <strong>{bituTotals.days}</strong> • Laborers: <strong>{bituTotals.laborers}</strong>
                </span>
              </div>
              <SectionBoqTable items={bituBoqItems} />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: CEMENTITIOUS WATERPROOFING */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
            <Droplets className="w-4 h-4 text-cyan-600" />
            <span>Section 7: Cementitious Waterproofing</span>
          </div>

          {linked_phase && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Cementitious Area */}
              <div className="flex items-center gap-2 bg-cyan-50/80 dark:bg-cyan-950/40 p-1.5 px-3 rounded-xl border border-cyan-200 dark:border-cyan-800 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block">Internal WP [ERP]</span>
                  <span className="font-mono font-black text-cyan-600 dark:text-cyan-400">{cementitious_wp_qty_m2_erp || 0} m²</span>
                </div>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <div>
                  <span className="text-[9px] text-amber-600 font-bold block">[User] Billable</span>
                  <input
                    type="number"
                    value={cementitious_wp_qty_m2_user}
                    onChange={(e) => handleFieldChange('cementitious_wp_qty_m2_user', e.target.value)}
                    className="w-20 px-2 py-0.5 bg-white dark:bg-slate-900 border border-amber-400 rounded text-xs font-mono font-black text-amber-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {!linked_phase ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Please select a <strong>Water Feature Phase</strong> in Section 1 to load project geometry and calculate BOQ line items.</span>
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Input Grid for Cementitious WP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StyledSelect
                label="Brand"
                value={wp_cementitious_brand}
                onChange={(val) => handleFieldChange('wp_cementitious_brand', val)}
                options={cementBrandOptions}
                placeholder="Select Brand..."
              />

              <StyledSelect
                label="Material Specification"
                value={wp_cementitious_material}
                onChange={(val) => handleFieldChange('wp_cementitious_material', val)}
                options={cementMaterialOptions}
                placeholder="Select Material Spec..."
              />

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Coats / Specification
                </label>
                <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  2 Coats + 2cm Screed Protection
                </div>
              </div>
            </div>

            {/* Internal 2cm Plaster Screed Summary Strip */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-800 dark:text-cyan-400 block">
                Internal 2cm Plaster Screed Consumables:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px]">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Plaster Area</span>
                  <strong className="text-slate-800 dark:text-slate-200">{qty_plaster_int_area_m2 || 0} m²</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Volume</span>
                  <strong className="text-cyan-600 dark:text-cyan-400">{qty_plaster_int_vol_m3 || 0} m³</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Cement</span>
                  <strong className="text-amber-600 dark:text-amber-400">{qty_cement_int_tons || 0} Tons</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Sand</span>
                  <strong className="text-slate-800 dark:text-slate-200">{qty_sand_int_m3 || 0} m³</strong>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Addibond 65</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{qty_adipond_int_ltr || 0} L</strong>
                </div>
              </div>
            </div>

            {/* ITEMIZE CEMENTITIOUS BOQ BREAKDOWN TABLE */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
                  Itemized Cementitious BOQ Breakdown ({cemBoqItems.length} items):
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  Total Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{cemTotals.cost ? Number(cemTotals.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} EGP</strong> • Days: <strong>{cemTotals.days}</strong> • Laborers: <strong>{cemTotals.laborers}</strong>
                </span>
              </div>
              <SectionBoqTable items={cemBoqItems} />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8: BACKFILLING & EARTHWORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-stone-900 dark:text-stone-300">
            <Truck className="w-4 h-4 text-stone-600" />
            <span>Section 8: Backfilling & Earthworks</span>
          </div>
          <div className="w-36">
            <StyledSelect
              value={backfilling_included}
              onChange={(val) => handleFieldChange('backfilling_included', val)}
              options={yesNoOptions}
            />
          </div>
        </div>

        {!linked_phase ? (
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Please select a <strong>Water Feature Phase</strong> in Section 1 to load project geometry and calculate BOQ line items.</span>
          </div>
        ) : (
          backfilling_included === 'Yes' && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StyledSelect
                  label="Methods of Backfilling"
                  value={backfilling_method}
                  onChange={(val) => handleFieldChange('backfilling_method', val)}
                  options={[
                    { id: 'Backfilling Subcontractor', label: 'Backfilling Subcontractor' },
                    { id: 'Heavy Tools and Machines', label: 'Heavy Tools and Machines' }
                  ]}
                  placeholder="Select Method..."
                />

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Soil Components
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Graded clean sand & crushed aggregate"
                    value={soil_components}
                    onChange={(e) => handleFieldChange('soil_components', e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {(qty_geotextiles_m2 || qty_geomembranes_m2 || qty_geonets_m2 || isLagoon) && (
                <div className="overflow-x-auto rounded-2xl border border-stone-200/70 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-950/20">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100/60 dark:bg-stone-900/40 border-b border-stone-200/70 dark:border-stone-800 text-[10px] font-bold uppercase tracking-wider text-stone-800 dark:text-stone-300">
                        <th className="py-2 px-3">Earthworks Layer</th>
                        <th className="py-2 px-3">Specification</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                        <th className="py-2 px-3 text-right">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800 font-mono">
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">1. Geotextiles</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Non-woven filtration layer</td>
                        <td className="py-2 px-3 text-right font-black text-stone-700 dark:text-stone-300">{qty_geotextiles_m2 || 0}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-500">m²</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">2. Geomembranes</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">HDPE barrier layer</td>
                        <td className="py-2 px-3 text-right font-black text-stone-700 dark:text-stone-300">{qty_geomembranes_m2 || 0}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-500">m²</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">3. Geonets</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">Drainage grid layer</td>
                        <td className="py-2 px-3 text-right font-black text-stone-700 dark:text-stone-300">{qty_geonets_m2 || 0}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-500">m²</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUMMARY KPI RIBBON */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
            Total Structural Cost
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {Number(totalStructuralCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-sans font-bold text-slate-400">EGP</span>
          </span>
        </div>

        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/20 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1">
            Total Execution Days
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {totalStructuralDays} <span className="text-xs font-sans font-bold text-slate-400">Days</span>
          </span>
        </div>

        <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-500/20 rounded-3xl shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
            Total Labor Crew Force
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">
            {totalStructuralLaborers} <span className="text-xs font-sans font-bold text-slate-400">Laborers</span>
          </span>
        </div>
      </div>

    </div>
  );
}
