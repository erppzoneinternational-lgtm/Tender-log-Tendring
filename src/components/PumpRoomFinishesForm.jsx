import React, { useMemo, useEffect } from 'react';
import { 
  Building2, 
  Palette, 
  Layers, 
  Ruler, 
  Hammer, 
  Calculator,
  CheckCircle2, 
  AlertCircle,
  Paintbrush
} from 'lucide-react';
import StyledSelect from './StyledSelect';
import SearchableSelect from './SearchableSelect';
import { calculatePumpRoomFinishes } from '../utils/engine/modules/pumpRoomFinishesCalc';
import { buildPumpRoomFinishesBoq } from '../utils/engine/modules/pumpRoomFinishesBoqBuilder';
import { STATIC_ITEMS_LOOKUP } from '../lib/staticLookup';

// Reusable itemized BOQ Breakdown Table Component
function SectionBoqTable({ items = [], emptyMessage = "No active line items for this section." }) {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (Number(b.total_cost) || 0) - (Number(a.total_cost) || 0));
  }, [items]);

  const totalSectionCost = useMemo(() => {
    return sortedItems.reduce((acc, item) => acc + (Number(item.total_cost) || 0), 0);
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
            <tr key={it.id || it._spawnerid || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
              <td className="py-2 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
              <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">
                {STATIC_ITEMS_LOOKUP[it.item] || it.item_name || it.item_title || it.fallbackName || it.item || 'Generic Item'}
              </td>
              <td className="py-2 px-2 text-center">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  it.activity_type === 'Installation' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  it.activity_type === 'Accommodation' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {it.activity_type || 'Procurement'}
                </span>
              </td>
              <td className="py-2 px-2 text-center text-[10px] font-bold text-slate-500">{it.activity_responsibility || 'P.Zone'}</td>
              <td className="py-2 px-3 text-right font-bold text-slate-700 dark:text-slate-300">
                {typeof it.quantity === 'number' ? it.quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (it.quantity || 0)}
              </td>
              <td className="py-2 px-2 text-right text-[10px] text-slate-400 font-bold">
                {it.extra_amount_percentage ? `+${it.extra_amount_percentage}%` : '0%'}
              </td>
              <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                {typeof it.final_quantity === 'number' ? it.final_quantity.toLocaleString(undefined, { maximumFractionDigits: 2 }) : (it.final_quantity || 0)}
              </td>
              <td className="py-2 px-2 text-center font-sans font-bold text-slate-500">{it.unit || 'm²'}</td>
              <td className="py-2 px-3 text-right font-bold text-slate-600 dark:text-slate-400">
                {it.unit_cost ? Number(it.unit_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </td>
              <td className="py-2 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                {it.total_cost ? Number(it.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </td>
              <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">{it.days_to_complete || '—'}</td>
              <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">{it.total_laborers_per_day || it.laborers_per_group || '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 dark:bg-slate-800/90 border-t-2 border-slate-200 dark:border-slate-700 font-mono text-[11px] font-black">
            <td colSpan={9} className="py-2 px-3 text-right font-sans uppercase tracking-wider text-[10px] text-slate-600 dark:text-slate-300">
              Section Total Cost:
            </td>
            <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 text-xs">
              {Number(totalSectionCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td colSpan={2} className="py-2 px-3 text-center text-[10px] font-sans font-bold text-slate-400">
              EGP
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function PumpRoomFinishesForm({
  formData = {},
  onChange,
  proposals = [],
  phases = [],
  pumpRoomPhases = [],
  pumpRoomEntries = [],
  proposalEntries = [],
  clients = [],
  regions = [],
  dropdownContext = {},
  existingBoqItems = []
}) {
  const {
    id,
    linked_phase = '',
    phase_id = '',
    tender_log_id = '',
    linked_proposal = '',
    project_owner = '',
    main_contractor = '',
    civil_consultant = '',
    region = '',
    accommodations_required = 'No',

    // Section 2: Stucco / Plastering
    qty_stucco_m3_user = '',
    qty_stucco_m3_erp = 0,
    improving_material = 'None',
    add_fiberglass = 'No',
    qty_cement_stucco_vol_m3 = 0,
    qty_cement_for_stucco_ton = 0,
    qty_sand_for_stucco_m3 = 0,
    qty_water_for_stucco_ltr = 0,
    qty_addibond_for_stucco_ltr = 0,
    total_cost_stucco = 0,
    days_to_complete_stucco = 0,
    no_of_laborers_stucco = 0,

    // Section 3: Epoxy Paintings
    epoxy_brand_id = '',
    epoxy_material_id = '',
    qty_epoxy_m2_user = '',
    qty_epoxy_m2_erp = 0,
    total_cost_epoxy = 0,
    days_to_complete_epoxy = 0,
    no_of_laborers_epoxy = 0,

    // Section 4: Tiling Works
    pr_adhesive_brand = '',
    pr_adhesive_material = '',
    pr_grout_brand = '',
    pr_grout_material = '',
    qty_tiling_m2_user = '',
    qty_tiling_m2_erp = 0,

    bt_adhesive_brand = '',
    bt_adhesive_material = '',
    bt_grout_brand = '',
    bt_grout_material = '',
    qty_balance_tank_tiling_m2_user = '',
    qty_balance_tank_tiling_m2_erp = 0,
    qty_total_tiling_m2_erp = 0,
    total_cost_tiling = 0,
    days_to_complete_tiling = 0,
    no_of_laborers_tiling = 0
  } = formData || {};

  const rawPhase = linked_phase || phase_id || '';
  const prdeMatch = useMemo(() => {
    if (!rawPhase) return null;
    return (pumpRoomEntries || []).find(e => 
      String(e.id) === String(rawPhase) || 
      String(e.linked_phase) === String(rawPhase) || 
      String(e.phase_id) === String(rawPhase)
    ) || null;
  }, [rawPhase, pumpRoomEntries]);

  const currentPhaseId = useMemo(() => {
    if (!rawPhase) return '';
    const directPhase = phases.find(p => String(p.id) === String(rawPhase));
    if (directPhase) return directPhase.id;
    const target = prdeMatch?.linked_phase || prdeMatch?.phase_id;
    if (target) {
      const prPhase = phases.find(p => String(p.id) === String(target));
      if (prPhase) return prPhase.id;
    }
    return rawPhase;
  }, [rawPhase, phases, prdeMatch]);

  const currentProposalId = useMemo(() => {
    if (linked_proposal) return linked_proposal;
    if (tender_log_id) return tender_log_id;
    if (prdeMatch?.tender_log_id) return prdeMatch.tender_log_id;
    if (currentPhaseId) {
      const matchedPh = phases.find(p => String(p.id) === String(currentPhaseId));
      if (matchedPh?.tender_log_id) return matchedPh.tender_log_id;
    }
    return '';
  }, [linked_proposal, tender_log_id, prdeMatch, currentPhaseId, phases]);

  // Filtered Pump Room Phases for current proposal
  const filteredPrPhases = useMemo(() => {
    if (!currentProposalId) return pumpRoomPhases.length > 0 ? pumpRoomPhases : phases;
    const list = pumpRoomPhases.length > 0 ? pumpRoomPhases : phases;
    return list.filter(p => String(p.tender_log_id) === String(currentProposalId) || String(p.proposal_id) === String(currentProposalId));
  }, [currentProposalId, pumpRoomPhases, phases]);

  // Upstream Pump Room entry specs
  const upstreamEntry = useMemo(() => {
    if (!currentPhaseId && !rawPhase) return null;
    return (pumpRoomEntries || []).find(e => 
      String(e.linked_phase) === String(currentPhaseId) || 
      String(e.phase_id) === String(currentPhaseId) ||
      String(e.id) === String(currentPhaseId) ||
      String(e.linked_phase) === String(rawPhase) || 
      String(e.phase_id) === String(rawPhase) ||
      String(e.id) === String(rawPhase)
    );
  }, [currentPhaseId, rawPhase, pumpRoomEntries]);

  // Upstream Proposal Data Entry specs
  const upstreamProposalEntry = useMemo(() => {
    if (!currentPhaseId && !rawPhase) return null;
    return (proposalEntries || []).find(e => 
      String(e.phase_id) === String(currentPhaseId) ||
      String(e.linked_phase) === String(currentPhaseId) ||
      String(e.id) === String(currentPhaseId) ||
      String(e.phase_id) === String(rawPhase) ||
      String(e.linked_phase) === String(rawPhase) ||
      String(e.id) === String(rawPhase)
    );
  }, [currentPhaseId, rawPhase, proposalEntries]);

  const pool_length = Number(upstreamEntry?.pump_room_length_m || 0);
  const pool_width = Number(upstreamEntry?.pump_room_width_m || 0);
  const pool_height = Number(upstreamEntry?.pump_room_height_m || 0);
  const pr_area = Number(upstreamEntry?.pump_room_area_m2 || (pool_length * pool_width) || 0);
  const pr_perimeter = Number(upstreamEntry?.pump_room_perimeter_m || (2 * (pool_length + pool_width)) || 0);
  const bt_area = Number(upstreamEntry?.balance_tank_area_m2 || 0);
  const sumpit_area = Number(upstreamEntry?.sumpit_area_m2 || 0);

  // Field change dispatcher
  const handleFieldChange = (field, value) => {
    onChange({
      ...formData,
      [field]: value
    });
  };

  // Options Definitions
  const yesNoOptions = [
    { id: 'Yes', label: 'Yes' },
    { id: 'No', label: 'No' }
  ];

  const improvingMaterialOptions = [
    { id: 'None', label: 'None' },
    { id: 'Addibond 65', label: 'Addibond 65' }
  ];

  // Epoxy Brands & Materials
  const epoxyBrandOptions = [
    { id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', label: 'CMB' },
    { id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', label: 'Basf' }
  ];

  const epoxyMaterialOptionsMap = {
    // CMB
    '2c740ea7-58d6-42e7-9094-b7e3304cccbe': [
      { id: '952e42ba-16ca-44a8-9bbb-8500e52a2434', label: 'KEMAPOXY 150 QQ (2.5 kg)' }
    ],
    // Basf
    '94879bba-f69c-45c9-a6e1-c12b5a54f8c5': [
      { id: 'cac62fd4-a918-45c8-8830-fa4544a9c75a', label: 'MasterTop® 1110 (Floors & Walls - 5 kg)' },
      { id: '1c005ea2-69f6-4fd0-9ad7-e970b230ba15', label: 'MasterTop® 1207 (floors only - 5 kg)' }
    ]
  };

  const epoxyMaterialOptions = useMemo(() => {
    if (!epoxy_brand_id) return [];
    return epoxyMaterialOptionsMap[epoxy_brand_id] || [];
  }, [epoxy_brand_id]);

  // Ceramic Options
  const ceramicOptions = [
    { id: '86acaacf-f943-4845-aaeb-bd836ac641a8', label: 'Ceramic Tiles for Walls and Floor' }
  ];

  // Adhesive Brands & Materials
  const adhesiveBrandOptions = [
    { id: '25b1498a-9c86-46a2-943b-9b889001a650', label: 'Sika' },
    { id: '2c740ea7-58d6-42e7-9094-b7e3304cccbe', label: 'CMB' },
    { id: 'cc1cd635-c3dd-4fc4-8c49-25d7bf04df18', label: 'Tri Chem' }
  ];

  const adhesiveMaterialOptionsMap = {
    '25b1498a-9c86-46a2-943b-9b889001a650': [
      { id: '687b0379-7a49-440d-a209-7eb965978b37', label: 'Sika Ceram ® - 205 Large' },
      { id: 'b66d700e-a7f8-4866-9bc3-90ba653133cb', label: 'Sika Lasqa - WP' }
    ],
    '2c740ea7-58d6-42e7-9094-b7e3304cccbe': [
      { id: '1e143df8-7218-4cb6-8aab-fa9143915d38', label: 'Cetox U' }
    ],
    'cc1cd635-c3dd-4fc4-8c49-25d7bf04df18': [
      { id: 'd7fee6af-0523-4dac-913c-f75bcf06d75a', label: 'TRI – FIX 444' }
    ]
  };

  // Grout Brands & Materials
  const groutBrandOptions = [
    { id: '25b1498a-9c86-46a2-943b-9b889001a650', label: 'Sika' },
    { id: '94879bba-f69c-45c9-a6e1-c12b5a54f8c5', label: 'Basf' },
    { id: 'cc1cd635-c3dd-4fc4-8c49-25d7bf04df18', label: 'Tri Chem' }
  ];

  const groutMaterialOptionsMap = {
    '25b1498a-9c86-46a2-943b-9b889001a650': [
      { id: '00d65ca2-3343-4583-a7ee-ac341bc5331b', label: 'Sika Tile Grout' }
    ],
    '94879bba-f69c-45c9-a6e1-c12b5a54f8c5': [
      { id: '211c16be-e058-41e4-96bb-bbce1c58fb03', label: 'MasterTile® 530' }
    ],
    'cc1cd635-c3dd-4fc4-8c49-25d7bf04df18': [
      { id: 'e304431c-93c3-4d1f-9996-ba90b2d31587', label: 'TRI-TILE FG' }
    ]
  };

  const prAdhesiveMaterialOptions = useMemo(() => {
    if (!pr_adhesive_brand) return [];
    return adhesiveMaterialOptionsMap[pr_adhesive_brand] || [];
  }, [pr_adhesive_brand]);

  const prGroutMaterialOptions = useMemo(() => {
    if (!pr_grout_brand) return [];
    return groutMaterialOptionsMap[pr_grout_brand] || [];
  }, [pr_grout_brand]);

  const btAdhesiveMaterialOptions = useMemo(() => {
    if (!bt_adhesive_brand) return [];
    return adhesiveMaterialOptionsMap[bt_adhesive_brand] || [];
  }, [bt_adhesive_brand]);

  const btGroutMaterialOptions = useMemo(() => {
    if (!bt_grout_brand) return [];
    return groutMaterialOptionsMap[bt_grout_brand] || [];
  }, [bt_grout_brand]);

  // Real-time calculation and BOQ generation
  const liveBoqResult = useMemo(() => {
    if (!currentPhaseId) return { proposal_breakdown_items: [] };
    const calculated = calculatePumpRoomFinishes({
      ...formData,
      phase_id: currentPhaseId,
      linked_phase: currentPhaseId,
      tender_log_id: currentProposalId,
      linked_proposal: currentProposalId
    }, upstreamEntry, {
      proposal_data_entry: proposalEntries || [],
      proposals: proposals || []
    });
    return buildPumpRoomFinishesBoq(calculated, formData.proposal_breakdown_items || existingBoqItems || [], dropdownContext, upstreamEntry);
  }, [formData, currentPhaseId, currentProposalId, upstreamEntry, proposalEntries, proposals, dropdownContext, existingBoqItems]);

  // Sync auto-computed keys back to parent form state
  useEffect(() => {
    if (!liveBoqResult || !currentPhaseId) return;
    const keysToSync = [
      'qty_stucco_m3_erp', 'qty_stucco_m3_user', 'qty_stucco_m3', 'qty_cement_stucco_m3',
      'qty_cement_stucco_vol_m3', 'qty_cement_for_stucco_ton', 'qty_sand_for_stucco_m3',
      'qty_water_for_stucco_ltr', 'qty_addibond_for_stucco_ltr',
      'qty_epoxy_m2_erp', 'qty_epoxy_m2_user', 'qty_epoxy_paintings_m2',
      'qty_tiling_m2_erp', 'qty_tiling_m2_user', 'qty_pr_tiling_m2',
      'qty_balance_tank_tiling_m2_erp', 'qty_balance_tank_tiling_m2_user', 'qty_bt_tiling_m2',
      'qty_total_tiling_m2_erp',
      'total_cost_stucco', 'unit_cost_stucco', 'days_to_complete_stucco', 'no_of_laborers_stucco',
      'total_cost_epoxy', 'unit_cost_epoxy', 'days_to_complete_epoxy', 'no_of_laborers_epoxy',
      'total_cost_tiling', 'unit_cost_tiling', 'days_to_complete_tiling', 'no_of_laborers_tiling'
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
  }, [liveBoqResult, currentPhaseId]);

  const allBoqItems = liveBoqResult?.proposal_breakdown_items || [];

  // Filtered BOQ items per section
  const stuccoBoqItems = useMemo(() => {
    return allBoqItems.filter(i => 
      i._isWaterStuccoAuto || i._isSandStuccoAuto || i._isCementStuccoAuto || 
      i._isAddibondStuccoAuto || i._isStuccoSubAuto || i._isStuccoAptAuto || i._isStuccoMicrobusAuto ||
      ['_isWaterStuccoAuto', '_isSandStuccoAuto', '_isCementStuccoAuto', '_isAddibondStuccoAuto', '_isStuccoSubAuto', '_isStuccoAptAuto', '_isStuccoMicrobusAuto'].includes(i._spawnerid)
    );
  }, [allBoqItems]);

  const epoxyBoqItems = useMemo(() => {
    return allBoqItems.filter(i => 
      i._isEpoxyMaterialAuto || i._isEpoxySubAuto || i._isEpoxyAptAuto || i._isEpoxyMicrobusAuto ||
      ['_isEpoxyMaterialAuto', '_isEpoxySubAuto', '_isEpoxyAptAuto', '_isEpoxyMicrobusAuto'].includes(i._spawnerid)
    );
  }, [allBoqItems]);

  const tilingBoqItems = useMemo(() => {
    return allBoqItems.filter(i => 
      i._isSupplyTilesAuto || i._isPrCeramicAuto || i._isBtCeramicAuto ||
      i._isPrTileAdhesiveAuto || i._isPrTileGroutAuto || i._isBtTileAdhesiveAuto || 
      i._isBtTileGroutAuto || i._isTilingSubcontractorAuto || i._isTilingAptAuto || i._isTilingMicrobusAuto ||
      ['_isSupplyTilesAuto', '_isPrCeramicAuto', '_isBtCeramicAuto', '_isPrTileAdhesiveAuto', '_isPrTileGroutAuto', '_isBtTileAdhesiveAuto', '_isBtTileGroutAuto', '_isTilingSubcontractorAuto', '_isTilingAptAuto', '_isTilingMicrobusAuto'].includes(i._spawnerid)
    );
  }, [allBoqItems]);

  // Live computed sums from actual items
  const stuccoCost = useMemo(() => stuccoBoqItems.reduce((s, i) => s + (Number(i.total_cost) || 0), 0), [stuccoBoqItems]);
  const stuccoDays = Number(liveBoqResult?.days_to_complete_stucco || days_to_complete_stucco || 0);
  const stuccoLabor = Number(liveBoqResult?.no_of_laborers_stucco || no_of_laborers_stucco || 0);

  const epoxyCost = useMemo(() => epoxyBoqItems.reduce((s, i) => s + (Number(i.total_cost) || 0), 0), [epoxyBoqItems]);
  const epoxyDays = Number(liveBoqResult?.days_to_complete_epoxy || days_to_complete_epoxy || 0);
  const epoxyLabor = Number(liveBoqResult?.no_of_laborers_epoxy || no_of_laborers_epoxy || 0);

  const tilingCost = useMemo(() => tilingBoqItems.reduce((s, i) => s + (Number(i.total_cost) || 0), 0), [tilingBoqItems]);
  const tilingDays = Number(liveBoqResult?.days_to_complete_tiling || days_to_complete_tiling || 0);
  const tilingLabor = Number(liveBoqResult?.no_of_laborers_tiling || no_of_laborers_tiling || 0);

  // Overall KPI Rollups
  const totalFinishesCost = stuccoCost + epoxyCost + tilingCost;
  const totalDays = stuccoDays + epoxyDays + tilingDays;
  const totalLaborers = stuccoLabor + epoxyLabor + tilingLabor;

  // Linkage Handler
  const handleTenderSelect = (proposalId) => {
    const matchedProp = proposals.find(p => p.id === proposalId);
    onChange({
      ...formData,
      linked_proposal: proposalId,
      tender_log_id: proposalId,
      linked_phase: '',
      phase_id: '',
      project_owner: matchedProp?.client_id || '',
      main_contractor: matchedProp?.main_contractor || '',
      civil_consultant: matchedProp?.civil_consultant || '',
      region: matchedProp?.region || ''
    });
  };

  const handlePhaseSelect = (phaseId) => {
    const relatedEntry = (pumpRoomEntries || []).find(e => 
      String(e.linked_phase) === String(phaseId) || 
      String(e.phase_id) === String(phaseId) ||
      String(e.id) === String(phaseId)
    );
    const matchedProp = proposals.find(p => p.id === currentProposalId);

    onChange({
      ...formData,
      linked_phase: phaseId,
      phase_id: phaseId,
      project_owner: relatedEntry?.project_owner || matchedProp?.client_id || '',
      main_contractor: relatedEntry?.main_contractor || matchedProp?.main_contractor || '',
      civil_consultant: relatedEntry?.civil_consultant || matchedProp?.civil_consultant || '',
      region: relatedEntry?.region || matchedProp?.region || '',
      accommodations_required: relatedEntry?.accommodations_required || formData.accommodations_required || 'No'
    });
  };

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* SECTION 1: LINKAGE & PROJECT CONTEXT */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
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
              Pump Room Phase <span className="text-amber-600">*</span>
            </label>
            <SearchableSelect
              options={filteredPrPhases.map(ph => ({
                id: ph.id,
                label: ph.phase_title || 'Pump Room Phase Scope'
              }))}
              value={currentPhaseId}
              onChange={handlePhaseSelect}
              placeholder={currentProposalId ? "Select Pump Room Phase..." : "Select Tender first..."}
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
          <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" /> Inherited Pump Room Geometry & Data:
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              PR Dimensions: <strong>{pool_length} × {pool_width} × {pool_height} m</strong>
            </span>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              PR Floor: <strong>{pr_area} m²</strong> (Perim: <strong>{pr_perimeter} m</strong>)
            </span>
            {bt_area > 0 && (
              <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                Balance Tank: <strong>{bt_area} m²</strong>
              </span>
            )}
            {sumpit_area > 0 && (
              <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                Sump Pit: <strong>{sumpit_area} m²</strong>
              </span>
            )}
            <span className="px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
              Accommodations: <strong className={upstreamEntry?.accommodations_required === 'Yes' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}>{upstreamEntry?.accommodations_required || 'No'}</strong>
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: CEMENT STUCCO / PLASTERING WORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
            <Hammer className="w-4 h-4 text-amber-600" />
            <span>Section 2: Cement Stucco / Plastering Works</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Billable Stucco:</span>
            <div className="relative w-36">
              <input
                type="number"
                placeholder={String(liveBoqResult?.qty_stucco_m3_erp || qty_stucco_m3_erp || 0)}
                value={qty_stucco_m3_user}
                onChange={(e) => handleFieldChange('qty_stucco_m3_user', e.target.value)}
                className="w-full px-3 py-1.5 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 text-right pr-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 pointer-events-none">
                m²
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 font-bold">
              ERP: {liveBoqResult?.qty_stucco_m3_erp || qty_stucco_m3_erp || 0} m²
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StyledSelect
            label="Improving Material"
            value={improving_material}
            onChange={(val) => handleFieldChange('improving_material', val)}
            options={improvingMaterialOptions}
          />

          <StyledSelect
            label="Add Fiberglass"
            value={add_fiberglass}
            onChange={(val) => handleFieldChange('add_fiberglass', val)}
            options={yesNoOptions}
          />
        </div>

        {/* 3cm Plaster Consumables Summary Strip */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
            3cm Stucco Consumables (Pump Room, Balance Tank & Sump Pit):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px]">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block">Plaster Volume</span>
              <strong className="text-amber-600 dark:text-amber-400">{liveBoqResult?.qty_cement_stucco_vol_m3 || qty_cement_stucco_vol_m3 || 0} m³</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block">Cement</span>
              <strong className="text-slate-800 dark:text-slate-200">{liveBoqResult?.qty_cement_for_stucco_ton || qty_cement_for_stucco_ton || 0} Tons</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block">Sand</span>
              <strong className="text-slate-800 dark:text-slate-200">{liveBoqResult?.qty_sand_for_stucco_m3 || qty_sand_for_stucco_m3 || 0} m³</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block">Water</span>
              <strong className="text-cyan-600 dark:text-cyan-400">{liveBoqResult?.qty_water_for_stucco_ltr || qty_water_for_stucco_ltr || 0} L</strong>
            </div>
            <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 block">Addibond 65</span>
              <strong className="text-emerald-600 dark:text-emerald-400">{liveBoqResult?.qty_addibond_for_stucco_ltr || qty_addibond_for_stucco_ltr || 0} L</strong>
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
                Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{Number(stuccoCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong> • Days: <strong>{stuccoDays}</strong> • Laborers: <strong>{stuccoLabor}</strong>
              </span>
            </div>
            <SectionBoqTable items={stuccoBoqItems} />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: EPOXY PAINTINGS WORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
            <Paintbrush className="w-4 h-4 text-indigo-600" />
            <span>Section 3: Epoxy Paintings Works</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Billable Epoxy Area:</span>
            <div className="relative w-36">
              <input
                type="number"
                placeholder={String(liveBoqResult?.qty_epoxy_m2_erp || qty_epoxy_m2_erp || 0)}
                value={qty_epoxy_m2_user}
                onChange={(e) => handleFieldChange('qty_epoxy_m2_user', e.target.value)}
                className="w-full px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-indigo-900 dark:text-indigo-200 text-right pr-8"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 pointer-events-none">
                m²
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 font-bold">
              ERP: {liveBoqResult?.qty_epoxy_m2_erp || qty_epoxy_m2_erp || 0} m²
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StyledSelect
            label="Epoxy Paint Brand"
            value={epoxy_brand_id}
            onChange={(val) => {
              onChange({
                ...formData,
                epoxy_brand_id: val,
                epoxy_material_id: ''
              });
            }}
            options={epoxyBrandOptions}
            placeholder="Select Brand first..."
          />

          <StyledSelect
            label="Epoxy Material Specification"
            value={epoxy_material_id}
            onChange={(val) => handleFieldChange('epoxy_material_id', val)}
            options={epoxyMaterialOptions}
            placeholder={epoxy_brand_id ? "Select Material Spec..." : "Select Brand first..."}
            disabled={!epoxy_brand_id}
          />
        </div>

        {/* ITEMIZE EPOXY BOQ TABLE */}
        {epoxyBoqItems.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                Itemized Epoxy BOQ Breakdown ({epoxyBoqItems.length} items):
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{Number(epoxyCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong> • Days: <strong>{epoxyDays}</strong> • Laborers: <strong>{epoxyLabor}</strong>
              </span>
            </div>
            <SectionBoqTable items={epoxyBoqItems} />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: PUMP ROOM & BALANCE TANK TILING WORKS */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-900 dark:text-teal-300">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Section 4: Pump Room & Balance Tank Tiling Works</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Total Tiling Area:</span>
            <span className="px-3 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-black font-mono">
              {liveBoqResult?.qty_total_tiling_m2_erp || qty_total_tiling_m2_erp || 0} m²
            </span>
          </div>
        </div>

        {/* Ceramic Tile Specification Card */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
            Ceramic Tile Material Specification (Pump Room & Balance Tank)
          </span>
          <div className="max-w-md">
            <StyledSelect
              label="Ceramic Tile Type"
              value={formData.pr_ceramic_material || formData.ceramic_material_id || '86acaacf-f943-4845-aaeb-bd836ac641a8'}
              onChange={(val) => {
                handleFieldChange('pr_ceramic_material', val);
                handleFieldChange('bt_ceramic_material', val);
                handleFieldChange('ceramic_material_id', val);
              }}
              options={ceramicOptions}
              placeholder="Select Ceramic Tile..."
            />
          </div>
        </div>

        {/* Pump Room Internal Tiling Sub-block */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              1. Pump Room Floor & Wall Tiling
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Billable Area:</span>
              <div className="relative w-32">
                <input
                  type="number"
                  placeholder={String(liveBoqResult?.qty_tiling_m2_erp || qty_tiling_m2_erp || 0)}
                  value={qty_tiling_m2_user}
                  onChange={(e) => handleFieldChange('qty_tiling_m2_user', e.target.value)}
                  className="w-full px-3 py-1 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-xl text-xs font-bold text-teal-900 dark:text-teal-200 text-right pr-7"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-teal-600 pointer-events-none">
                  m²
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                ERP: {liveBoqResult?.qty_tiling_m2_erp || qty_tiling_m2_erp || 0} m²
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StyledSelect
              label="PR Adhesive Brand"
              value={pr_adhesive_brand}
              onChange={(val) => {
                onChange({
                  ...formData,
                  pr_adhesive_brand: val,
                  pr_adhesive_material: ''
                });
              }}
              options={adhesiveBrandOptions}
              placeholder="Select Brand..."
            />

            <StyledSelect
              label="PR Adhesive Material"
              value={pr_adhesive_material}
              onChange={(val) => handleFieldChange('pr_adhesive_material', val)}
              options={prAdhesiveMaterialOptions}
              placeholder={pr_adhesive_brand ? "Select Material..." : "Select Brand first..."}
              disabled={!pr_adhesive_brand}
            />

            <StyledSelect
              label="PR Tile Grout Brand"
              value={pr_grout_brand}
              onChange={(val) => {
                onChange({
                  ...formData,
                  pr_grout_brand: val,
                  pr_grout_material: ''
                });
              }}
              options={groutBrandOptions}
              placeholder="Select Brand..."
            />

            <StyledSelect
              label="PR Tile Grout Material"
              value={pr_grout_material}
              onChange={(val) => handleFieldChange('pr_grout_material', val)}
              options={prGroutMaterialOptions}
              placeholder={pr_grout_brand ? "Select Material..." : "Select Brand first..."}
              disabled={!pr_grout_brand}
            />
          </div>
        </div>

        {/* Balance Tank Internal Tiling Sub-block */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              2. Balance Tank Water-Retaining Tiling
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Billable Area:</span>
              <div className="relative w-32">
                <input
                  type="number"
                  placeholder={String(liveBoqResult?.qty_balance_tank_tiling_m2_erp || qty_balance_tank_tiling_m2_erp || 0)}
                  value={qty_balance_tank_tiling_m2_user}
                  onChange={(e) => handleFieldChange('qty_balance_tank_tiling_m2_user', e.target.value)}
                  className="w-full px-3 py-1 bg-white dark:bg-slate-900 border border-teal-300 dark:border-teal-700 rounded-xl text-xs font-bold text-teal-900 dark:text-teal-200 text-right pr-7"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-teal-600 pointer-events-none">
                  m²
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                ERP: {liveBoqResult?.qty_balance_tank_tiling_m2_erp || qty_balance_tank_tiling_m2_erp || 0} m²
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StyledSelect
              label="BT Adhesive Brand"
              value={bt_adhesive_brand}
              onChange={(val) => {
                onChange({
                  ...formData,
                  bt_adhesive_brand: val,
                  bt_adhesive_material: ''
                });
              }}
              options={adhesiveBrandOptions}
              placeholder="Select Brand..."
            />

            <StyledSelect
              label="BT Adhesive Material"
              value={bt_adhesive_material}
              onChange={(val) => handleFieldChange('bt_adhesive_material', val)}
              options={btAdhesiveMaterialOptions}
              placeholder={bt_adhesive_brand ? "Select Material..." : "Select Brand first..."}
              disabled={!bt_adhesive_brand}
            />

            <StyledSelect
              label="BT Tile Grout Brand"
              value={bt_grout_brand}
              onChange={(val) => {
                onChange({
                  ...formData,
                  bt_grout_brand: val,
                  bt_grout_material: ''
                });
              }}
              options={groutBrandOptions}
              placeholder="Select Brand..."
            />

            <StyledSelect
              label="BT Tile Grout Material"
              value={bt_grout_material}
              onChange={(val) => handleFieldChange('bt_grout_material', val)}
              options={btGroutMaterialOptions}
              placeholder={bt_grout_brand ? "Select Material..." : "Select Brand first..."}
              disabled={!bt_grout_brand}
            />
          </div>
        </div>

        {/* ITEMIZE TILING BOQ TABLE */}
        {tilingBoqItems.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-900 dark:text-teal-300">
                Itemized Tiling BOQ Breakdown ({tilingBoqItems.length} items):
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                Cost: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{Number(tilingCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong> • Days: <strong>{tilingDays}</strong> • Laborers: <strong>{tilingLabor}</strong>
              </span>
            </div>
            <SectionBoqTable items={tilingBoqItems} />
          </div>
        )}
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
