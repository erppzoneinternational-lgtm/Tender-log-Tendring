import PptxGenJS from 'pptxgenjs';
import { STATIC_ITEMS_LOOKUP, resolveCategoryName } from './staticLookup.js';
import { DB_ITEM_NAME_FALLBACKS } from '../utils/engine/modules/waterFeatureStructuralBoqBuilder.js';

function getCairoDateIso() {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Official 44 Client BOQ Work Types & Measurement Units from `boq_work_type` (`PZ. Database - BOQ Work Type.csv`).
 */
export const OFFICIAL_BOQ_UNITS = {
  'Bituminous Waterproofing': 'm²',
  'Cementitious Waterproofing': 'm²',
  'Coffor': 'm²',
  'Geonets Works': 'm²',
  'Geotextiles Works': 'm²',
  'Plain Concrete': 'm³',
  'Reinforced Concrete': 'm³',
  'Epoxy Painting': 'm²',
  'Liner Works': 'm²',
  'Plastering Works': 'm²',
  'Ceramic Works': 'm²',
  'Stainless Steel Ladder': 'No.',
  'Tiling Works': 'm²',
  'Geomembrane Works': 'm²',
  'Copping Works': 'm',
  'Water Filter': 'No.',
  'Vacuum Filtration Pump': 'No.',
  'Vacuum Filter': 'No.',
  'Ventilation': 'No.',
  'Automatic Makeup System': 'No.',
  'Chemical Dosing System': 'No.',
  'Skimmer': 'No.',
  'Wall Inlets': 'No.',
  'Floor Inlets': 'No.',
  'Vacuum Points': 'No.',
  'Main Drain': 'No.',
  'Gutter Drain': 'No.',
  'Fire Extinguisher': 'No.',
  'Water Feature UPVC Pipes, Fittings & Valves': 'L.S',
  'Drainage Chamber': 'No.',
  'Pump Room UPVC Pipes, Fittings & Valves': 'L.S',
  'Submersible Pumps': 'No.',
  'Tablet Chlorinator': 'No.',
  'Water Filtration Pump': 'No.',
  'Mechanical': 'L.S',
  'Manual Cleaning Set': 'Set',
  'Heating System': 'No.',
  'Water Feature HDPE Pipes, Fittings & Valves': 'L.S',
  'Control Panel': 'L.S',
  'Electrical': 'L.S',
  'Water Feature Earthing': 'L.S',
  'Water Feature Lighting': 'No.',
  'Main Cable Tray': 'L.S',
  'Pump Room Lighting': 'No.',
  'Service Sockets': 'No.',
};

/**
 * Primary equipment / execution `_spawnerid` prefixes per BOQ Work Type so consolidated
 * BOQ quantities reflect exact engineering equipment/area/volume counts rather than summing
 * auxiliary fittings, cables, conduits, bags, or waste items.
 */
const PRIMARY_SPAWNER_PREFIXES_BY_WORK_TYPE = {
  'Water Filter': ['_isemsandfilterauto'],
  'Vacuum Filter': ['_isemvacuumfilterauto'],
  'Water Filtration Pump': ['_isemfilterpumpauto'],
  'Vacuum Filtration Pump': ['_isemvacuumpumpauto'],
  'Submersible Pumps': ['_isemsubmersiblepumpauto'],
  'Skimmer': ['_isemskimmerauto'],
  'Floor Inlets': ['_isemfloorinletauto'],
  'Wall Inlets': ['_isemwallinletauto'],
  'Vacuum Points': ['_isemvacuuminletauto'],
  'Main Drain': ['_isemmaindrainauto'],
  'Gutter Drain': ['_isemgutterdrainauto'],
  'Chemical Dosing System': ['_isemdosingpumpauto'],
  'Tablet Chlorinator': ['_isemtabletchlorinatorauto'],
  'Manual Cleaning Set': ['_isemmanualcleaningsetauto'],
  'Drainage Chamber': ['_isemdrainagechamberauto', '_isemgrpboxauto'],
  'Heating System': ['_isemheaterauto'],
  'Automatic Makeup System': ['_isemsolenoidvalveauto'],
  'Water Feature Lighting': ['_isemlightauto'],
  'Pump Room Lighting': ['_isemprlightauto'],
  'Service Sockets': ['_isemsocketauto', '_isemprsocket'],
  'Ventilation': ['_isemventilationauto', '_isemfan'],
  'Fire Extinguisher': ['_isemfireextauto', '_isemext'],
  'Plain Concrete': ['_ispccastingsubauto', '_ispccarpentrysubauto'],
  'Reinforced Concrete': ['_isrccastingsubauto', '_isrcsteelsubauto'],
  'Tiling Works': ['_istilingsubcontractorauto', '_issupplytilesauto'],
  'Plastering Works': ['_isstuccosubauto'],
  'Epoxy Painting': ['_isepoxysubauto'],
  'Liner Works': ['_islinersubcontractorauto'],
  'Copping Works': ['_iscopingsubcontractorauto', '_iscopingauto'],
  'Stainless Steel Ladder': ['_isladderauto'],
};

const DISCIPLINE_ORDER = ['Civil', 'Mechanical', 'Electrical'];

/**
 * Normalizes unit strings (`m2` -> `m²`, `m3` -> `m³`, `nos`/`pcs` -> `No.`, `ls` -> `L.S`) for clean matching.
 */
export function normalizeUnitLabel(rawUnit) {
  if (!rawUnit) return '';
  const u = String(rawUnit).trim();
  const low = u.toLowerCase();
  if (low === 'm2' || low === 'm²' || low === 'sqm' || low === 'sq.m') return 'm²';
  if (low === 'm3' || low === 'm³' || low === 'cum' || low === 'cu.m') return 'm³';
  if (low === 'ml' || low === 'm.l' || low === 'lm' || low === 'l.m' || low === 'm') return 'm';
  if (low === 'no' || low === 'no.' || low === 'nos' || low === 'nr' || low === 'pc' || low === 'pcs' || low === 'unit') return 'No.';
  if (low === 'ls' || low === 'l.s' || low === 'l.s.' || low === 'lump sum' || low === 'lumpsum') return 'L.S';
  if (low === 'set' || low === 'sets') return 'Set';
  return u;
}

/**
 * Classifies discipline strictly across the 44 official BOQ Work Types.
 */
export function classifyBreakdownDiscipline(item, boqWorkTypes = []) {
  const directWt = String(item?.work_type || '').toLowerCase().trim();
  if (directWt === 'electrical') return 'Electrical';
  if (directWt === 'mechanical') return 'Mechanical';
  if (directWt === 'civil' || directWt === 'finishing works' || directWt === 'finishes') return 'Civil';

  const resolvedName = resolveCategoryName(item, boqWorkTypes);
  if (
    resolvedName === 'Control Panel' ||
    resolvedName === 'Electrical' ||
    resolvedName === 'Water Feature Earthing' ||
    resolvedName === 'Water Feature Lighting' ||
    resolvedName === 'Main Cable Tray' ||
    resolvedName === 'Pump Room Lighting' ||
    resolvedName === 'Service Sockets'
  ) {
    return 'Electrical';
  }

  if (
    resolvedName === 'Water Filter' ||
    resolvedName === 'Vacuum Filtration Pump' ||
    resolvedName === 'Vacuum Filter' ||
    resolvedName === 'Ventilation' ||
    resolvedName === 'Automatic Makeup System' ||
    resolvedName === 'Chemical Dosing System' ||
    resolvedName === 'Skimmer' ||
    resolvedName === 'Wall Inlets' ||
    resolvedName === 'Floor Inlets' ||
    resolvedName === 'Vacuum Points' ||
    resolvedName === 'Main Drain' ||
    resolvedName === 'Gutter Drain' ||
    resolvedName === 'Fire Extinguisher' ||
    resolvedName === 'Water Feature UPVC Pipes, Fittings & Valves' ||
    resolvedName === 'Drainage Chamber' ||
    resolvedName === 'Pump Room UPVC Pipes, Fittings & Valves' ||
    resolvedName === 'Submersible Pumps' ||
    resolvedName === 'Tablet Chlorinator' ||
    resolvedName === 'Water Filtration Pump' ||
    resolvedName === 'Heating System' ||
    resolvedName === 'Water Feature HDPE Pipes, Fittings & Valves' ||
    resolvedName === 'Manual Cleaning Set' ||
    resolvedName === 'Mechanical'
  ) {
    return 'Mechanical';
  }

  return 'Civil';
}

/**
 * Determines whether a Phase record itself represents a dedicated Pump Room phase.
 */
export function isPumpRoomPhaseRecord(phase) {
  if (!phase) return false;
  const compType = String(phase.component_type || '').toLowerCase().trim();
  const title = String(phase.phase_title || phase.phase_full_title || '').toLowerCase().trim();
  return (
    compType.includes('pump room') ||
    compType.includes('plant room') ||
    title.includes('pump room') ||
    title.includes('pump_room') ||
    title.includes('plant room')
  );
}

/**
 * Determines whether an individual row in `proposal_breakdown_items` belongs to Pump Room scope
 * (via `phase_component`, dedicated Pump Room phase, or Pump Room MEP BOQ Work Types / spawners).
 */
export function isPumpRoomBreakdownItem(item, phase, boqWorkTypes = []) {
  if (isPumpRoomPhaseRecord(phase)) return true;

  const phaseComp = String(item?.phase_component || '').toLowerCase().trim();
  if (phaseComp.includes('pump room') || phaseComp.includes('plant room')) {
    return true;
  }

  const wtName = resolveCategoryName(item, boqWorkTypes);
  if (
    wtName === 'Pump Room UPVC Pipes, Fittings & Valves' ||
    wtName === 'Pump Room Lighting' ||
    wtName === 'Service Sockets' ||
    wtName === 'Ventilation' ||
    wtName === 'Main Cable Tray' ||
    wtName === 'Fire Extinguisher'
  ) {
    return true;
  }

  const sp = String(item?._spawnerid || item?._spawnerId || item?.rowIdFlag || '').toLowerCase().trim();
  if (
    sp.startsWith('_isempr') ||
    sp.startsWith('_isemsocket') ||
    sp.startsWith('_isemventilation') ||
    sp.startsWith('_isemcabletray') ||
    sp.startsWith('_isemvelbow') ||
    sp.startsWith('_isemhelbow') ||
    sp.startsWith('_isemendcap') ||
    sp.startsWith('_isemanchors') ||
    sp.startsWith('_isemcchannel') ||
    sp.startsWith('_isemfireext')
  ) {
    return true;
  }

  return false;
}

/**
 * Computes direct cost strictly from `proposal_breakdown_items` row.
 */
export function computeBreakdownDirectCost(item) {
  if (item?.activity_responsibility === 'Client') return 0;
  if (item?.total_cost !== undefined && item?.total_cost !== null && !Number.isNaN(Number(item.total_cost))) {
    return Number(item.total_cost);
  }
  const qty = Number(item?.final_quantity ?? item?.quantity ?? 0);
  const unitCost = Number(item?.unit_cost ?? 0);
  return Number((qty * unitCost).toFixed(2));
}

/**
 * Resolves human-readable item title for Detailed Line-Item mode.
 */
export function resolveBreakdownItemTitle(item, itemsMap = new Map(), boqWorkTypes = []) {
  const itemKey = String(item?.item || '').trim();
  const fromCatalogMap = itemKey && itemsMap.get(itemKey.toLowerCase());
  if (fromCatalogMap?.item_name) return fromCatalogMap.item_name;
  if (itemKey && STATIC_ITEMS_LOOKUP[itemKey]) return STATIC_ITEMS_LOOKUP[itemKey];
  if (itemKey && DB_ITEM_NAME_FALLBACKS[itemKey]) return DB_ITEM_NAME_FALLBACKS[itemKey];
  if (item?.item_name) return String(item.item_name);
  if (item?.fallbackName) return String(item.fallbackName);
  if (item?.item_description) return String(item.item_description);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemKey);
  if (itemKey && !isUuid) return itemKey;
  return resolveCategoryName(item, boqWorkTypes);
}

/**
 * Resolves canonical BOQ unit and exact engineering quantity for a group of breakdown items
 * sharing the same official `workTypeName` inside a component.
 */
function resolveConsolidatedWorkTypeQtyAndUnit(workTypeName, groupItems, boqUnitMap) {
  const canonicalUnit = normalizeUnitLabel(
    boqUnitMap.get(workTypeName.toLowerCase()) || OFFICIAL_BOQ_UNITS[workTypeName] || ''
  );

  if (canonicalUnit === 'L.S') {
    return { qty: 1, unit: 'L.S' };
  }

  // 1. Check primary equipment / subcontractor spawner flags
  const primaryPrefixes = PRIMARY_SPAWNER_PREFIXES_BY_WORK_TYPE[workTypeName] || [];
  if (primaryPrefixes.length > 0) {
    // Prefer first matching prefix in priority order so we don't double-count casting + carpentry subcontractors
    for (const prefix of primaryPrefixes) {
      const matched = groupItems.filter((it) => {
        const sp = String(it._spawnerid || it._spawnerId || it.rowIdFlag || '').toLowerCase().trim();
        return sp.startsWith(prefix);
      });
      if (matched.length > 0) {
        const sumQty = matched.reduce((acc, it) => {
          const base = Number(it.quantity ?? 0);
          const fin = Number(it.final_quantity ?? 0);
          return acc + (base > 0 ? base : fin);
        }, 0);
        if (sumQty > 0) {
          const rowUnit = normalizeUnitLabel(matched[0].unit);
          return {
            qty: Number(sumQty.toFixed(2)),
            unit: canonicalUnit || rowUnit || 'No.',
          };
        }
      }
    }
  }

  // 2. Match rows whose unit equals canonicalUnit (preferring Installation net area/volume over wasted material supply)
  if (canonicalUnit) {
    const unitMatched = groupItems.filter(
      (it) => normalizeUnitLabel(it.unit) === canonicalUnit
    );
    if (unitMatched.length > 0) {
      const installRows = unitMatched.filter(
        (it) => String(it.activity_type || '').toLowerCase() === 'installation'
      );
      if (installRows.length > 0) {
        // Take max within the same phase (e.g. if multiple installation passes cover the same surface),
        // or sum across distinct phase_ids when Pump Room is merged into Water Feature.
        const byPhase = new Map();
        for (const r of installRows) {
          const key = `${r.phase_id || 'default'}::${r.phase_component || 'wf'}`;
          const val = Number(r.quantity || r.final_quantity || 0);
          byPhase.set(key, Math.max(byPhase.get(key) || 0, val));
        }
        const totalInstallQty = Array.from(byPhase.values()).reduce((a, b) => a + b, 0);
        if (totalInstallQty > 0) {
          return { qty: Number(totalInstallQty.toFixed(2)), unit: canonicalUnit };
        }
      }

      // Otherwise use primary Procurement row matching canonicalUnit
      const procRows = unitMatched.filter(
        (it) => String(it.activity_type || '').toLowerCase() !== 'accommodation'
      );
      if (procRows.length > 0) {
        const byPhase = new Map();
        for (const r of procRows) {
          const key = `${r.phase_id || 'default'}::${r.phase_component || 'wf'}`;
          const val = Number(r.quantity || r.final_quantity || 0);
          byPhase.set(key, Math.max(byPhase.get(key) || 0, val));
        }
        const totalProcQty = Array.from(byPhase.values()).reduce((a, b) => a + b, 0);
        if (totalProcQty > 0) {
          return { qty: Number(totalProcQty.toFixed(2)), unit: canonicalUnit };
        }
      }
    }
  }

  // 3. Single-item fallback
  if (groupItems.length === 1) {
    const only = groupItems[0];
    const q = Number(only.quantity || only.final_quantity || 1);
    const u = canonicalUnit || normalizeUnitLabel(only.unit) || 'No.';
    return { qty: q > 0 ? Number(q.toFixed(2)) : 1, unit: u };
  }

  return { qty: 1, unit: canonicalUnit || 'L.S' };
}

/**
 * Builds structured Commercial Presentation Model directly from `proposal_breakdown_items`
 * and live `calculatedFinancials` multipliers.
 *
 * @param {Object} params
 * @param {Object} params.tender - Active ERP tender record (`proposal_number`, `proposal_title`, `clientName`, etc.)
 * @param {Array}  params.phases - Phases linked to the active tender
 * @param {Array}  params.breakdownItems - Master breakdown rows (`proposal_breakdown_items`) for the active tender
 * @param {Object} params.calculatedFinancials - Output of `CommercialBidPricePortal` 24-line financial engine
 * @param {Array}  [params.boqWorkTypes] - Optional rows from `boq_work_type` table (`work_type`, `boq_unit`)
 * @param {Array}  [params.catalogItems] - Optional rows from `items` table (`id`, `item_name`, `unit`)
 * @param {Object} [params.options]
 * @param {'full_boq' | 'all_lumpsum' | 'qty_and_total' | 'title_and_total'} [params.options.tableMode='full_boq']
 * @param {boolean} [params.options.pumpRoomSeparate=true]
 * @param {'work_types' | 'line_items'} [params.options.granularity='work_types']
 * @param {string} [params.options.currency='EGP']
 * @param {number} [params.options.fxRate=1]
 */
export function buildCommercialBoqPresentationModel({
  tender,
  phases = [],
  breakdownItems = [],
  calculatedFinancials = {},
  boqWorkTypes = [],
  catalogItems = [],
  options = {},
}) {
  const {
    tableMode = 'full_boq',
    pumpRoomSeparate = true,
    granularity = 'work_types',
    currency = 'EGP',
    fxRate = 1,
  } = options;

  const convDivisor = currency === 'USD' && fxRate > 0 ? Number(fxRate) : 1;

  const boqUnitMap = new Map();
  Object.entries(OFFICIAL_BOQ_UNITS).forEach(([k, v]) => {
    boqUnitMap.set(k.toLowerCase(), v);
  });
  (boqWorkTypes || []).forEach((row) => {
    const wt = String(row?.work_type || '').trim();
    const un = String(row?.boq_unit || row?.unit || '').trim();
    if (wt && un) boqUnitMap.set(wt.toLowerCase(), un);
  });

  const itemsMap = new Map();
  (catalogItems || []).forEach((it) => {
    if (it?.id) itemsMap.set(String(it.id).toLowerCase(), it);
  });

  const phaseMap = new Map();
  (phases || []).forEach((p) => {
    if (p?.id) phaseMap.set(String(p.id), p);
  });

  // 1. Enrich every master breakdown item with exact unrounded commercial selling price
  const enrichedItems = (breakdownItems || []).map((item) => {
    const isClientSupplied = item?.activity_responsibility === 'Client';
    const directCost = computeBreakdownDirectCost(item);
    const discipline = classifyBreakdownDiscipline(item, boqWorkTypes);
    const workTypeName = resolveCategoryName(item, boqWorkTypes);

    const wtInfo = calculatedFinancials?.workTypeBreakdown?.[workTypeName];
    const discInfo = calculatedFinancials?.disciplineBreakdown?.[discipline];

    let exactMultiplier = calculatedFinancials?.globalMarkupMultiplier || 1;
    if (wtInfo && Number(wtInfo.directCost) > 0 && Number(wtInfo.wtBidPrice) > 0) {
      exactMultiplier = Number(wtInfo.wtBidPrice) / Number(wtInfo.directCost);
    } else if (wtInfo?.wtMultiplier) {
      exactMultiplier = Number(wtInfo.wtMultiplier);
    } else if (discInfo && Number(discInfo.directCost) > 0 && Number(discInfo.discBidPrice) > 0) {
      exactMultiplier = Number(discInfo.discBidPrice) / Number(discInfo.directCost);
    } else if (discInfo?.discMultiplier) {
      exactMultiplier = Number(discInfo.discMultiplier);
    }

    const sellingTotalEgp = isClientSupplied ? 0 : directCost * exactMultiplier;
    const sellingTotal = sellingTotalEgp / convDivisor;
    const parentPhase = item?.phase_id ? phaseMap.get(String(item.phase_id)) : null;
    const isPumpRoom = isPumpRoomBreakdownItem(item, parentPhase, boqWorkTypes);

    return {
      raw: item,
      phaseId: item?.phase_id ? String(item.phase_id) : '',
      parentPhase,
      isPumpRoom,
      isClientSupplied,
      discipline,
      workTypeName,
      directCost,
      sellingTotal,
    };
  });

  // 2. Partition into Component Buckets honoring `pumpRoomSeparate`
  const wfPhases = (phases || []).filter((p) => !isPumpRoomPhaseRecord(p));
  const prPhases = (phases || []).filter((p) => isPumpRoomPhaseRecord(p));

  const componentBuckets = [];
  const bucketById = new Map();

  const ensureBucket = (key, title, kind) => {
    if (!bucketById.has(key)) {
      const b = { key, title, kind, items: [] };
      bucketById.set(key, b);
      componentBuckets.push(b);
    }
    return bucketById.get(key);
  };

  if (phases.length === 0) {
    // Fallback if tender has breakdown items without explicit phase records
    if (pumpRoomSeparate) {
      const wfItems = enrichedItems.filter((i) => !i.isPumpRoom);
      const prItems = enrichedItems.filter((i) => i.isPumpRoom);
      if (wfItems.length > 0) {
        ensureBucket('wf-main', 'Water Feature 01', 'water_feature').items.push(...wfItems);
      }
      if (prItems.length > 0) {
        ensureBucket('pr-main', 'Pump Room 01', 'pump_room').items.push(...prItems);
      }
    } else {
      ensureBucket('wf-merged', 'Water Feature (Incl. Pump Room)', 'water_feature').items.push(
        ...enrichedItems
      );
    }
  } else if (pumpRoomSeparate) {
    // Separate Mode: Water Feature phases get ONLY non-Pump-Room rows; Pump Room rows go to dedicated Pump Room bucket(s)
    wfPhases.forEach((p, idx) => {
      const title = p.phase_title || p.phase_full_title || `Water Feature ${idx + 1}`;
      ensureBucket(`wf-${p.id}`, title, 'water_feature');
    });
    prPhases.forEach((p, idx) => {
      const title = p.phase_title || p.phase_full_title || `Pump Room ${idx + 1}`;
      ensureBucket(`pr-${p.id}`, title, 'pump_room');
    });

    for (const item of enrichedItems) {
      if (!item.isPumpRoom) {
        const targetWfPhase =
          wfPhases.find((p) => String(p.id) === item.phaseId) || wfPhases[0];
        if (targetWfPhase) {
          ensureBucket(
            `wf-${targetWfPhase.id}`,
            targetWfPhase.phase_title || targetWfPhase.phase_full_title || 'Water Feature',
            'water_feature'
          ).items.push(item);
        } else {
          ensureBucket('wf-fallback', 'Water Feature', 'water_feature').items.push(item);
        }
      } else {
        // Pump Room item: route to matching Pump Room phase if present, otherwise create a dedicated Pump Room bucket for its parent WF
        const directPrPhase = prPhases.find((p) => String(p.id) === item.phaseId);
        if (directPrPhase) {
          ensureBucket(
            `pr-${directPrPhase.id}`,
            directPrPhase.phase_title || directPrPhase.phase_full_title || 'Pump Room',
            'pump_room'
          ).items.push(item);
        } else if (prPhases.length === 1 && wfPhases.length <= 1) {
          const onlyPr = prPhases[0];
          ensureBucket(
            `pr-${onlyPr.id}`,
            onlyPr.phase_title || onlyPr.phase_full_title || 'Pump Room',
            'pump_room'
          ).items.push(item);
        } else {
          const wfIdx = wfPhases.findIndex((p) => String(p.id) === item.phaseId);
          if (wfIdx >= 0 && prPhases[wfIdx]) {
            const pairedPr = prPhases[wfIdx];
            ensureBucket(
              `pr-${pairedPr.id}`,
              pairedPr.phase_title || pairedPr.phase_full_title || `Pump Room ${wfIdx + 1}`,
              'pump_room'
            ).items.push(item);
          } else {
            const parentWf = wfIdx >= 0 ? wfPhases[wfIdx] : null;
            const prTitle =
              wfPhases.length <= 1
                ? 'Pump Room'
                : `Pump Room (${parentWf?.phase_title || `Phase ${wfIdx + 1}`})`;
            const prKey = parentWf ? `pr-derived-${parentWf.id}` : 'pr-derived-main';
            ensureBucket(prKey, prTitle, 'pump_room').items.push(item);
          }
        }
      }
    }
  } else {
    // Merged Mode: Merge Pump Room BOQs into their parent / paired Water Feature component
    if (wfPhases.length > 0) {
      wfPhases.forEach((p, idx) => {
        const baseTitle = p.phase_title || p.phase_full_title || `Water Feature ${idx + 1}`;
        ensureBucket(`wf-${p.id}`, baseTitle, 'water_feature');
      });

      const mergedWfIds = new Set();

      for (const item of enrichedItems) {
        const directWf = wfPhases.find((p) => String(p.id) === item.phaseId);
        if (directWf) {
          if (item.isPumpRoom) mergedWfIds.add(String(directWf.id));
          bucketById.get(`wf-${directWf.id}`).items.push(item);
        } else {
          // Item was on a dedicated Pump Room phase -> pair by index with WF phase or first WF phase
          const prIdx = prPhases.findIndex((p) => String(p.id) === item.phaseId);
          const targetWf =
            (prIdx >= 0 && wfPhases[prIdx]) ? wfPhases[prIdx] : wfPhases[0];
          mergedWfIds.add(String(targetWf.id));
          bucketById.get(`wf-${targetWf.id}`).items.push(item);
        }
      }

      // Clarify title when Pump Room scope is merged into the Water Feature
      for (const wf of wfPhases) {
        if (mergedWfIds.has(String(wf.id))) {
          const b = bucketById.get(`wf-${wf.id}`);
          if (b && !b.title.toLowerCase().includes('pump room')) {
            b.title = `${b.title} (Incl. Pump Room)`;
          }
        }
      }
    } else {
      // Only Pump Room phase(s) exist in this tender
      prPhases.forEach((p, idx) => {
        const title = p.phase_title || p.phase_full_title || `Pump Room ${idx + 1}`;
        const bucket = ensureBucket(`pr-${p.id}`, title, 'pump_room');
        bucket.items.push(
          ...enrichedItems.filter((it) => it.phaseId === String(p.id))
        );
      });
    }
  }

  // Filter out empty buckets unless all buckets are empty
  const nonEmptyBuckets = componentBuckets.filter((b) => b.items.length > 0);
  const activeBuckets = nonEmptyBuckets.length > 0 ? nonEmptyBuckets : componentBuckets;

  // 3. Build BOQ Rows per Component Bucket
  const components = activeBuckets.map((bucket, compIdx) => {
    let rows = [];

    if (granularity === 'line_items') {
      // Detailed Line-Item Mode directly from `proposal_breakdown_items`
      const sortedItems = [...bucket.items].sort((a, b) => {
        const dDiff =
          DISCIPLINE_ORDER.indexOf(a.discipline) - DISCIPLINE_ORDER.indexOf(b.discipline);
        if (dDiff !== 0) return dDiff;
        return a.workTypeName.localeCompare(b.workTypeName);
      });

      rows = sortedItems
        .filter((it) => it.sellingTotal > 0 || !it.isClientSupplied)
        .map((it) => {
          const rawQty = Number(it.raw.final_quantity ?? it.raw.quantity ?? 1);
          const baseQty = rawQty > 0 ? Number(rawQty.toFixed(2)) : 1;
          const baseUnit =
            normalizeUnitLabel(it.raw.unit) ||
            normalizeUnitLabel(itemsMap.get(String(it.raw.item || '').toLowerCase())?.unit) ||
            'No.';
          const totalSelling = Number(it.sellingTotal.toFixed(2));
          const displayQty = tableMode === 'all_lumpsum' ? 1 : baseQty;
          const displayUnit = tableMode === 'all_lumpsum' ? 'L.S' : baseUnit;
          const unitSelling =
            displayQty > 0 ? Number((totalSelling / displayQty).toFixed(2)) : totalSelling;

          return {
            boqTitle: resolveBreakdownItemTitle(it.raw, itemsMap, boqWorkTypes),
            workTypeName: it.workTypeName,
            discipline: it.discipline,
            qty: displayQty,
            unit: displayUnit,
            unitSellingPrice: unitSelling,
            totalSellingPrice: totalSelling,
            breakdownLinesCount: 1,
          };
        });
    } else {
      // Consolidated Client BOQ Titles Mode (grouped by Discipline + Official BOQ Work Type)
      const groupMap = new Map();
      for (const it of bucket.items) {
        if (it.isClientSupplied || it.sellingTotal <= 0) continue;
        const key = `${it.discipline}::${it.workTypeName}`;
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            discipline: it.discipline,
            workTypeName: it.workTypeName,
            items: [],
            sellingSum: 0,
          });
        }
        const g = groupMap.get(key);
        g.items.push(it);
        g.sellingSum += it.sellingTotal;
      }

      const groupedList = Array.from(groupMap.values()).sort((a, b) => {
        const dDiff =
          DISCIPLINE_ORDER.indexOf(a.discipline) - DISCIPLINE_ORDER.indexOf(b.discipline);
        if (dDiff !== 0) return dDiff;
        return b.sellingSum - a.sellingSum;
      });

      rows = groupedList.map((g) => {
        const rawRecords = g.items.map((x) => x.raw);
        const { qty: calcQty, unit: calcUnit } = resolveConsolidatedWorkTypeQtyAndUnit(
          g.workTypeName,
          rawRecords,
          boqUnitMap
        );
        const totalSelling = Number(g.sellingSum.toFixed(2));
        const displayQty = tableMode === 'all_lumpsum' ? 1 : calcQty;
        const displayUnit = tableMode === 'all_lumpsum' ? 'L.S' : calcUnit;
        const unitSelling =
          displayQty > 0 ? Number((totalSelling / displayQty).toFixed(2)) : totalSelling;

        return {
          boqTitle: g.workTypeName,
          workTypeName: g.workTypeName,
          discipline: g.discipline,
          qty: displayQty,
          unit: displayUnit,
          unitSellingPrice: unitSelling,
          totalSellingPrice: totalSelling,
          breakdownLinesCount: rawRecords.length,
        };
      });
    }

    const civilSelling = Number(
      rows
        .filter((r) => r.discipline === 'Civil')
        .reduce((s, r) => s + r.totalSellingPrice, 0)
        .toFixed(2)
    );
    const mechanicalSelling = Number(
      rows
        .filter((r) => r.discipline === 'Mechanical')
        .reduce((s, r) => s + r.totalSellingPrice, 0)
        .toFixed(2)
    );
    const electricalSelling = Number(
      rows
        .filter((r) => r.discipline === 'Electrical')
        .reduce((s, r) => s + r.totalSellingPrice, 0)
        .toFixed(2)
    );
    const totalSelling = Number(
      (civilSelling + mechanicalSelling + electricalSelling).toFixed(2)
    );

    return {
      index: compIdx + 1,
      key: bucket.key,
      title: bucket.title,
      kind: bucket.kind,
      rows,
      civilSelling,
      mechanicalSelling,
      electricalSelling,
      totalSelling,
    };
  });

  // 4. Reconcile any sub-cent rounding delta on the largest row so Grand Total matches exact Final Bid Price
  const targetFinalBid =
    calculatedFinancials?.finalBidPrice > 0
      ? Number((Number(calculatedFinancials.finalBidPrice) / convDivisor).toFixed(2))
      : 0;
  const rawSumAll = Number(
    components.reduce((s, c) => s + c.totalSelling, 0).toFixed(2)
  );
  const delta = Number((targetFinalBid - rawSumAll).toFixed(2));

  if (targetFinalBid > 0 && Math.abs(delta) > 0 && Math.abs(delta) <= 5 && components.length > 0) {
    // Adjust largest row cleanly so component & summary tables match Final Bid Price to 0.00
    let maxRow = null;
    let maxComp = null;
    for (const comp of components) {
      for (const r of comp.rows) {
        if (!maxRow || r.totalSellingPrice > maxRow.totalSellingPrice) {
          maxRow = r;
          maxComp = comp;
        }
      }
    }
    if (maxRow && maxComp) {
      maxRow.totalSellingPrice = Number((maxRow.totalSellingPrice + delta).toFixed(2));
      maxRow.unitSellingPrice =
        maxRow.qty > 0
          ? Number((maxRow.totalSellingPrice / maxRow.qty).toFixed(2))
          : maxRow.totalSellingPrice;

      maxComp.civilSelling = Number(
        maxComp.rows
          .filter((r) => r.discipline === 'Civil')
          .reduce((s, r) => s + r.totalSellingPrice, 0)
          .toFixed(2)
      );
      maxComp.mechanicalSelling = Number(
        maxComp.rows
          .filter((r) => r.discipline === 'Mechanical')
          .reduce((s, r) => s + r.totalSellingPrice, 0)
          .toFixed(2)
      );
      maxComp.electricalSelling = Number(
        maxComp.rows
          .filter((r) => r.discipline === 'Electrical')
          .reduce((s, r) => s + r.totalSellingPrice, 0)
          .toFixed(2)
      );
      maxComp.totalSelling = Number(
        (
          maxComp.civilSelling +
          maxComp.mechanicalSelling +
          maxComp.electricalSelling
        ).toFixed(2)
      );
    }
  }

  const grandCivil = Number(
    components.reduce((s, c) => s + c.civilSelling, 0).toFixed(2)
  );
  const grandMechanical = Number(
    components.reduce((s, c) => s + c.mechanicalSelling, 0).toFixed(2)
  );
  const grandElectrical = Number(
    components.reduce((s, c) => s + c.electricalSelling, 0).toFixed(2)
  );
  const grandTotal = Number(
    (grandCivil + grandMechanical + grandElectrical).toFixed(2)
  );

  const summaryRows = components.map((c) => ({
    index: c.index,
    componentTitle: c.title,
    kind: c.kind,
    boqCount: c.rows.length,
    civilSelling: c.civilSelling,
    mechanicalSelling: c.mechanicalSelling,
    electricalSelling: c.electricalSelling,
    totalSelling: c.totalSelling,
    sharePct: grandTotal > 0 ? Number(((c.totalSelling / grandTotal) * 100).toFixed(1)) : 0,
  }));

  return {
    proposalCode: tender?.proposal_number || 'TND-000',
    proposalTitle:
      tender?.proposal_title || tender?.proposal_full_title || 'Commercial Offer',
    clientName: tender?.clientName || tender?.owner || 'Direct Client',
    dateStr: getCairoDateIso(),
    currency,
    tableMode,
    pumpRoomSeparate,
    granularity,
    totalMasterBreakdownItems: breakdownItems.length,
    components,
    summaryRows,
    totals: {
      civil: grandCivil,
      mechanical: grandMechanical,
      electrical: grandElectrical,
      grandTotal,
    },
  };
}

function fmtMoney(val) {
  return Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtQty(val) {
  const num = Number(val || 0);
  if (Number.isInteger(num)) return num.toLocaleString('en-US');
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export const PPTX_TEMPLATE_THEMES = {
  executive_navy: {
    id: 'executive_navy',
    name: 'P.ZONE Executive Navy & Teal',
    desc: 'Signature dark navy header, teal accent ribbon & emerald totals',
    swatches: ['#0B152C', '#00838F', '#059669'],
    navy: '0B152C',
    navyMid: '132242',
    headerText: 'FFFFFF',
    headerSub: '94A3B8',
    headerBadge: '5EEAD4',
    coverBg: '0B152C',
    coverPanel: '132242',
    coverText: 'FFFFFF',
    coverSub: '94A3B8',
    teal: '00838F',
    tealLight: 'E0F7FA',
    emerald: '059669',
    emeraldLight: 'ECFDF5',
    amber: 'B45309',
    amberLight: 'FEF3C7',
    indigo: '4338CA',
    indigoLight: 'EEF2FF',
    slateDark: '1E293B',
    slateText: '334155',
    slateMuted: '64748B',
    border: 'CBD5E1',
    rowAlt: 'F8FAFC',
    white: 'FFFFFF',
  },
  modern_light: {
    id: 'modern_light',
    name: 'Modern Architectural Light',
    desc: 'Clean warm-slate light header, charcoal tables & gold-teal accents',
    swatches: ['#F8FAFC', '#1E293B', '#0D9488'],
    navy: '1E293B',
    navyMid: '334155',
    headerText: '0F172A',
    headerSub: '475569',
    headerBadge: '0D9488',
    headerBgOverride: 'F1F5F9',
    coverBg: 'F8FAFC',
    coverPanel: '0F172A',
    coverText: '0F172A',
    coverSub: '475569',
    teal: '0D9488',
    tealLight: 'CCFBF1',
    emerald: '0F766E',
    emeraldLight: 'F0FDFA',
    amber: 'B45309',
    amberLight: 'FEF3C7',
    indigo: '3730A3',
    indigoLight: 'E0E7FF',
    slateDark: '0F172A',
    slateText: '334155',
    slateMuted: '64748B',
    border: 'CBD5E1',
    rowAlt: 'F8FAFC',
    white: 'FFFFFF',
  },
  hydro_blueprint: {
    id: 'hydro_blueprint',
    name: 'Hydro Engineering Blueprint',
    desc: 'Deep ocean cyan banner, sky-blue technical accents & crisp grid',
    swatches: ['#082F49', '#0284C7', '#0EA5E9'],
    navy: '082F49',
    navyMid: '0C4A6E',
    headerText: 'FFFFFF',
    headerSub: 'BAE6FD',
    headerBadge: '38BDF8',
    coverBg: '082F49',
    coverPanel: '0C4A6E',
    coverText: 'FFFFFF',
    coverSub: 'BAE6FD',
    teal: '0284C7',
    tealLight: 'E0F2FE',
    emerald: '0369A1',
    emeraldLight: 'F0F9FF',
    amber: 'B45309',
    amberLight: 'FEF3C7',
    indigo: '4338CA',
    indigoLight: 'EEF2FF',
    slateDark: '0F172A',
    slateText: '334155',
    slateMuted: '64748B',
    border: 'BAE6FD',
    rowAlt: 'F0F9FF',
    white: 'FFFFFF',
  },
};

function addSlideChrome(slide, pptx, model, subtitleRight, COLORS) {
  // Top brand accent ribbon
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.08,
    fill: { color: COLORS.teal },
    line: { color: COLORS.teal, width: 0 },
  });

  // Header bar
  const hdrBg = COLORS.headerBgOverride || COLORS.navy;
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.08,
    w: 13.333,
    h: 0.68,
    fill: { color: hdrBg },
    line: { color: COLORS.border, width: COLORS.headerBgOverride ? 0.5 : 0 },
  });

  slide.addText(
    `P.ZONE COMMERCIAL BOQ OFFER  |  ${model.proposalCode} — ${model.proposalTitle}`,
    {
      x: 0.45,
      y: 0.18,
      w: 8.6,
      h: 0.28,
      fontFace: 'Arial',
      fontSize: 12,
      bold: true,
      color: COLORS.headerText || COLORS.white,
      valign: 'middle',
    }
  );

  slide.addText(
    `Client: ${model.clientName}   •   Currency: ${model.currency}   •   Date: ${model.dateStr}`,
    {
      x: 0.45,
      y: 0.44,
      w: 8.6,
      h: 0.22,
      fontFace: 'Arial',
      fontSize: 8.5,
      color: COLORS.headerSub || '94A3B8',
      valign: 'middle',
    }
  );

  if (subtitleRight) {
    slide.addText(subtitleRight, {
      x: 9.1,
      y: 0.22,
      w: 3.8,
      h: 0.38,
      fontFace: 'Arial',
      fontSize: 10,
      bold: true,
      align: 'right',
      color: COLORS.headerBadge || '5EEAD4',
      valign: 'middle',
    });
  }

  // Footer bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 7.15,
    w: 13.333,
    h: 0.35,
    fill: { color: 'F1F5F9' },
    line: { color: COLORS.border, width: 0.5 },
  });

  slide.addText(
    `P.ZONE Intelligent Tendering System • Synchronized from Master Breakdown Table (${model.totalMasterBreakdownItems} Cost Lines)`,
    {
      x: 0.45,
      y: 7.2,
      w: 9.5,
      h: 0.24,
      fontFace: 'Arial',
      fontSize: 8,
      color: COLORS.slateMuted,
      valign: 'middle',
    }
  );
}

/**
 * Generates and downloads (or returns base64/arraybuffer in Node) a 16:9 widescreen `.pptx`
 * Commercial Offer & Component Discipline BOQ Presentation.
 */
export async function generateCommercialBoqPptx(model, exportOpts = {}) {
  const {
    includeCoverSlide = true,
    includeSummarySlide = true,
    templateId = 'executive_navy',
    download = true,
    fileName,
  } = exportOpts;

  const COLORS =
    PPTX_TEMPLATE_THEMES[templateId] || PPTX_TEMPLATE_THEMES.executive_navy;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 inches (16:9)
  pptx.author = 'P.ZONE Intelligent Tendering System';
  pptx.company = 'P.ZONE';
  pptx.subject = `${model.proposalCode} Commercial BOQ Offer`;
  pptx.title = `${model.proposalCode} - ${model.proposalTitle}`;

  const modeLabelMap = {
    full_boq: 'Full BOQ Table (Title, Discipline, QTY, Unit, Unit Price & Total)',
    all_lumpsum: 'Lump Sum BOQ Table (All Quantities as 1 L.S)',
    qty_and_total: 'Quantity & Total Selling Price Table',
    title_and_total: 'BOQ Title & Total Selling Price Table',
  };

  // =========================================================================
  // SLIDE 1: EXECUTIVE COVER SLIDE
  // =========================================================================
  if (includeCoverSlide) {
    const cover = pptx.addSlide();
    cover.background = { color: COLORS.coverBg };

    // Top Accent Bar
    cover.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.14,
      fill: { color: COLORS.teal },
      line: { color: COLORS.teal, width: 0 },
    });

    // Right decorative KPI panel
    cover.addShape(pptx.ShapeType.rect, {
      x: 8.75,
      y: 0.14,
      w: 4.583,
      h: 7.36,
      fill: { color: COLORS.coverPanel },
      line: { color: COLORS.teal, width: 0.75 },
    });

    cover.addText('P.ZONE COMMERCIAL BILL OF QUANTITIES', {
      x: 0.75,
      y: 1.15,
      w: 7.6,
      h: 0.35,
      fontFace: 'Arial',
      fontSize: 11,
      bold: true,
      charSpacing: 2,
      color: COLORS.teal,
    });

    cover.addText(model.proposalTitle, {
      x: 0.75,
      y: 1.65,
      w: 7.6,
      h: 1.35,
      fontFace: 'Arial',
      fontSize: 28,
      bold: true,
      color: COLORS.coverText,
      valign: 'top',
    });

    cover.addText(`Proposal Ref: ${model.proposalCode}`, {
      x: 0.75,
      y: 3.15,
      w: 7.5,
      h: 0.4,
      fontFace: 'Courier New',
      fontSize: 15,
      bold: true,
      color: COLORS.teal,
    });

    const metaPairs = [
      ['Client / Stakeholders:', model.clientName],
      ['Presentation Mode:', modeLabelMap[model.tableMode] || model.tableMode],
      [
        'Pump Room Structure:',
        model.pumpRoomSeparate
          ? 'Shown as Separate Component BOQ(s)'
          : 'Included Inside Water Feature BOQ(s)',
      ],
      ['Date Issued:', model.dateStr],
    ];

    metaPairs.forEach(([lbl, val], idx) => {
      const yPos = 3.95 + idx * 0.48;
      cover.addText(lbl, {
        x: 0.75,
        y: yPos,
        w: 2.35,
        h: 0.35,
        fontFace: 'Arial',
        fontSize: 10.5,
        bold: true,
        color: COLORS.coverSub,
      });
      cover.addText(val, {
        x: 3.15,
        y: yPos,
        w: 5.2,
        h: 0.35,
        fontFace: 'Arial',
        fontSize: 10.5,
        bold: true,
        color: COLORS.coverText,
      });
    });

    // Right Panel KPI Summary Cards
    cover.addText('COMMERCIAL OFFER SUMMARY', {
      x: 9.15,
      y: 1.15,
      w: 3.8,
      h: 0.35,
      fontFace: 'Arial',
      fontSize: 10.5,
      bold: true,
      charSpacing: 1.5,
      color: '94A3B8',
    });

    const kpis = [
      {
        label: 'TOTAL COMMERCIAL OFFER',
        val: `${fmtMoney(model.totals.grandTotal)} ${model.currency}`,
        accent: '10B981',
      },
      {
        label: 'CIVIL & FINISHES SCOPE',
        val: `${fmtMoney(model.totals.civil)} ${model.currency}`,
        accent: 'F59E0B',
      },
      {
        label: 'MECHANICAL SCOPE',
        val: `${fmtMoney(model.totals.mechanical)} ${model.currency}`,
        accent: '14B8A6',
      },
      {
        label: 'ELECTRICAL SCOPE',
        val: `${fmtMoney(model.totals.electrical)} ${model.currency}`,
        accent: '818CF8',
      },
    ];

    kpis.forEach((k, i) => {
      const cardY = 1.7 + i * 1.22;
      cover.addShape(pptx.ShapeType.roundRect, {
        x: 9.15,
        y: cardY,
        w: 3.8,
        h: 1.02,
        rectRadius: 0.08,
        fill: { color: COLORS.navy },
        line: { color: k.accent, width: 1.2 },
      });
      cover.addText(k.label, {
        x: 9.35,
        y: cardY + 0.14,
        w: 3.4,
        h: 0.25,
        fontFace: 'Arial',
        fontSize: 8.5,
        bold: true,
        color: '94A3B8',
      });
      cover.addText(k.val, {
        x: 9.35,
        y: cardY + 0.44,
        w: 3.4,
        h: 0.42,
        fontFace: 'Courier New',
        fontSize: i === 0 ? 15 : 13,
        bold: true,
        color: i === 0 ? '34D399' : COLORS.white,
      });
    });
  }

  // =========================================================================
  // SLIDE 2: EXECUTIVE COMPONENTS & DISCIPLINES SUMMARY TABLE
  // =========================================================================
  if (includeSummarySlide) {
    const sumSlide = pptx.addSlide();
    sumSlide.background = { color: COLORS.white };
    addSlideChrome(
      sumSlide,
      pptx,
      model,
      `${model.summaryRows.length} Component(s) Summary`,
      COLORS
    );

    sumSlide.addText('Executive Commercial Summary by Component & Discipline', {
      x: 0.45,
      y: 0.92,
      w: 8.8,
      h: 0.36,
      fontFace: 'Arial',
      fontSize: 15,
      bold: true,
      color: COLORS.navy,
    });

    sumSlide.addText(
      model.pumpRoomSeparate
        ? 'Pump Room BOQs are itemized as separate component row(s)'
        : 'Pump Room BOQs are included within Water Feature component row(s)',
      {
        x: 0.45,
        y: 1.26,
        w: 8.8,
        h: 0.24,
        fontFace: 'Arial',
        fontSize: 9.5,
        color: COLORS.slateMuted,
      }
    );

    const headerOpts = (align = 'left') => ({
      fill: { color: COLORS.navy },
      color: COLORS.white,
      bold: true,
      fontFace: 'Arial',
      fontSize: 9.5,
      align,
      valign: 'middle',
      margin: [5, 6, 5, 6],
    });

    const summaryTableRows = [
      [
        { text: '#', options: headerOpts('center') },
        { text: 'Component / Phase', options: headerOpts('left') },
        { text: `Civil Selling (${model.currency})`, options: headerOpts('right') },
        { text: `Mechanical Selling (${model.currency})`, options: headerOpts('right') },
        { text: `Electrical Selling (${model.currency})`, options: headerOpts('right') },
        { text: `Total Selling Price (${model.currency})`, options: headerOpts('right') },
        { text: 'Share %', options: headerOpts('center') },
      ],
    ];

    model.summaryRows.forEach((row, idx) => {
      const bg = idx % 2 === 0 ? COLORS.white : COLORS.rowAlt;
      summaryTableRows.push([
        {
          text: String(row.index),
          options: {
            fill: { color: bg },
            fontFace: 'Courier New',
            fontSize: 9,
            align: 'center',
            color: COLORS.slateMuted,
            valign: 'middle',
          },
        },
        {
          text: row.componentTitle,
          options: {
            fill: { color: bg },
            fontFace: 'Arial',
            fontSize: 9.5,
            bold: true,
            color: COLORS.navy,
            valign: 'middle',
          },
        },
        {
          text: row.civilSelling > 0 ? fmtMoney(row.civilSelling) : '—',
          options: {
            fill: { color: bg },
            fontFace: 'Courier New',
            fontSize: 9.5,
            bold: true,
            align: 'right',
            color: COLORS.amber,
            valign: 'middle',
          },
        },
        {
          text: row.mechanicalSelling > 0 ? fmtMoney(row.mechanicalSelling) : '—',
          options: {
            fill: { color: bg },
            fontFace: 'Courier New',
            fontSize: 9.5,
            bold: true,
            align: 'right',
            color: COLORS.teal,
            valign: 'middle',
          },
        },
        {
          text: row.electricalSelling > 0 ? fmtMoney(row.electricalSelling) : '—',
          options: {
            fill: { color: bg },
            fontFace: 'Courier New',
            fontSize: 9.5,
            bold: true,
            align: 'right',
            color: COLORS.indigo,
            valign: 'middle',
          },
        },
        {
          text: fmtMoney(row.totalSelling),
          options: {
            fill: { color: COLORS.emeraldLight },
            fontFace: 'Courier New',
            fontSize: 10,
            bold: true,
            align: 'right',
            color: COLORS.emerald,
            valign: 'middle',
          },
        },
        {
          text: `${row.sharePct.toFixed(1)}%`,
          options: {
            fill: { color: bg },
            fontFace: 'Courier New',
            fontSize: 9,
            bold: true,
            align: 'center',
            color: COLORS.slateText,
            valign: 'middle',
          },
        },
      ]);
    });

    // Grand Total Footer Row
    summaryTableRows.push([
      {
        text: 'Σ',
        options: {
          fill: { color: COLORS.navy },
          color: '5EEAD4',
          fontFace: 'Arial',
          fontSize: 10,
          bold: true,
          align: 'center',
          valign: 'middle',
        },
      },
      {
        text: 'TOTAL COMMERCIAL OFFER',
        options: {
          fill: { color: COLORS.navy },
          color: COLORS.white,
          fontFace: 'Arial',
          fontSize: 10,
          bold: true,
          align: 'left',
          valign: 'middle',
        },
      },
      {
        text: fmtMoney(model.totals.civil),
        options: {
          fill: { color: COLORS.navy },
          color: 'FCD34D',
          fontFace: 'Courier New',
          fontSize: 10,
          bold: true,
          align: 'right',
          valign: 'middle',
        },
      },
      {
        text: fmtMoney(model.totals.mechanical),
        options: {
          fill: { color: COLORS.navy },
          color: '5EEAD4',
          fontFace: 'Courier New',
          fontSize: 10,
          bold: true,
          align: 'right',
          valign: 'middle',
        },
      },
      {
        text: fmtMoney(model.totals.electrical),
        options: {
          fill: { color: COLORS.navy },
          color: 'A5B4FC',
          fontFace: 'Courier New',
          fontSize: 10,
          bold: true,
          align: 'right',
          valign: 'middle',
        },
      },
      {
        text: fmtMoney(model.totals.grandTotal),
        options: {
          fill: { color: COLORS.emerald },
          color: COLORS.white,
          fontFace: 'Courier New',
          fontSize: 10.5,
          bold: true,
          align: 'right',
          valign: 'middle',
        },
      },
      {
        text: '100.0%',
        options: {
          fill: { color: COLORS.navy },
          color: COLORS.white,
          fontFace: 'Courier New',
          fontSize: 9.5,
          bold: true,
          align: 'center',
          valign: 'middle',
        },
      },
    ]);

    sumSlide.addTable(summaryTableRows, {
      x: 0.45,
      y: 1.62,
      w: 12.43,
      colW: [0.55, 3.68, 1.85, 1.85, 1.85, 1.9, 0.75],
      border: { type: 'solid', pt: 0.5, color: COLORS.border },
      rowH: 0.38,
    });
  }

  // =========================================================================
  // SLIDES 3..N: COMPONENT DISCIPLINE BOQ TABLE SLIDES (AUTO-PAGINATED)
  // =========================================================================
  const MAX_ROWS_PER_SLIDE = 12;

  for (const comp of model.components) {
    const allCompRows = comp.rows;
    const totalPages = Math.max(1, Math.ceil(allCompRows.length / MAX_ROWS_PER_SLIDE));

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const sliceRows = allCompRows.slice(
        pageIdx * MAX_ROWS_PER_SLIDE,
        (pageIdx + 1) * MAX_ROWS_PER_SLIDE
      );
      const isLastPage = pageIdx === totalPages - 1;
      const pageBadge =
        totalPages > 1 ? ` (Part ${pageIdx + 1} of ${totalPages})` : '';

      const slide = pptx.addSlide();
      slide.background = { color: COLORS.white };
      addSlideChrome(
        slide,
        pptx,
        model,
        `Component ${comp.index} of ${model.components.length}${pageBadge}`,
        COLORS
      );

      // Component Banner Header
      slide.addShape(pptx.ShapeType.roundRect, {
        x: 0.45,
        y: 0.88,
        w: 12.43,
        h: 0.62,
        rectRadius: 0.06,
        fill: { color: 'F8FAFC' },
        line: { color: COLORS.border, width: 0.75 },
      });

      slide.addText(`${comp.title}${pageBadge}`, {
        x: 0.62,
        y: 0.94,
        w: 5.5,
        h: 0.3,
        fontFace: 'Arial',
        fontSize: 13.5,
        bold: true,
        color: COLORS.navy,
      });

      slide.addText(
        `Civil: ${fmtMoney(comp.civilSelling)}   |   Mechanical: ${fmtMoney(comp.mechanicalSelling)}   |   Electrical: ${fmtMoney(comp.electricalSelling)} ${model.currency}`,
        {
          x: 0.62,
          y: 1.22,
          w: 7.5,
          h: 0.22,
          fontFace: 'Courier New',
          fontSize: 8.5,
          bold: true,
          color: COLORS.slateMuted,
        }
      );

      slide.addText(
        `Component Total: ${fmtMoney(comp.totalSelling)} ${model.currency}`,
        {
          x: 8.2,
          y: 0.98,
          w: 4.5,
          h: 0.42,
          fontFace: 'Courier New',
          fontSize: 12,
          bold: true,
          align: 'right',
          color: COLORS.emerald,
          valign: 'middle',
        }
      );

      // Build Columns & Widths according to the 4 Table Modes
      let colWidths = [];
      let headerRow = [];

      const th = (text, align = 'left') => ({
        text,
        options: {
          fill: { color: COLORS.navy },
          color: COLORS.white,
          fontFace: 'Arial',
          fontSize: 9,
          bold: true,
          align,
          valign: 'middle',
          margin: [4, 6, 4, 6],
        },
      });

      if (model.tableMode === 'full_boq' || model.tableMode === 'all_lumpsum') {
        colWidths = [0.55, 4.98, 1.55, 1.05, 0.9, 1.65, 1.75];
        headerRow = [
          th('#', 'center'),
          th('BOQ Title', 'left'),
          th('Discipline', 'center'),
          th('QTY', 'right'),
          th('Unit', 'center'),
          th(`Unit Selling (${model.currency})`, 'right'),
          th(`Total Selling (${model.currency})`, 'right'),
        ];
      } else if (model.tableMode === 'qty_and_total') {
        colWidths = [0.6, 5.98, 1.75, 1.2, 1.0, 1.9];
        headerRow = [
          th('#', 'center'),
          th('BOQ Title', 'left'),
          th('Discipline', 'center'),
          th('QTY', 'right'),
          th('Unit', 'center'),
          th(`Total Selling (${model.currency})`, 'right'),
        ];
      } else {
        // 'title_and_total'
        colWidths = [0.65, 7.68, 1.9, 2.2];
        headerRow = [
          th('#', 'center'),
          th('BOQ Title', 'left'),
          th('Discipline', 'center'),
          th(`Total Selling Price (${model.currency})`, 'right'),
        ];
      }

      const tableRows = [headerRow];

      sliceRows.forEach((r, idx) => {
        const globalRowNum = pageIdx * MAX_ROWS_PER_SLIDE + idx + 1;
        const bg = idx % 2 === 0 ? COLORS.white : COLORS.rowAlt;
        const discColor =
          r.discipline === 'Electrical'
            ? COLORS.indigo
            : r.discipline === 'Mechanical'
              ? COLORS.teal
              : COLORS.amber;
        const discBg =
          r.discipline === 'Electrical'
            ? COLORS.indigoLight
            : r.discipline === 'Mechanical'
              ? COLORS.tealLight
              : COLORS.amberLight;

        const baseCells = [
          {
            text: String(globalRowNum),
            options: {
              fill: { color: bg },
              fontFace: 'Courier New',
              fontSize: 8.5,
              align: 'center',
              color: COLORS.slateMuted,
              valign: 'middle',
            },
          },
          {
            text: r.boqTitle,
            options: {
              fill: { color: bg },
              fontFace: 'Arial',
              fontSize: 9,
              bold: true,
              color: COLORS.slateDark,
              valign: 'middle',
            },
          },
          {
            text: r.discipline,
            options: {
              fill: { color: discBg },
              fontFace: 'Arial',
              fontSize: 8.5,
              bold: true,
              align: 'center',
              color: discColor,
              valign: 'middle',
            },
          },
        ];

        const totalCell = {
          text: fmtMoney(r.totalSellingPrice),
          options: {
            fill: { color: COLORS.emeraldLight },
            fontFace: 'Courier New',
            fontSize: 9.5,
            bold: true,
            align: 'right',
            color: COLORS.emerald,
            valign: 'middle',
          },
        };

        if (model.tableMode === 'full_boq' || model.tableMode === 'all_lumpsum') {
          tableRows.push([
            ...baseCells,
            {
              text: fmtQty(r.qty),
              options: {
                fill: { color: bg },
                fontFace: 'Courier New',
                fontSize: 9,
                bold: true,
                align: 'right',
                color: COLORS.slateText,
                valign: 'middle',
              },
            },
            {
              text: r.unit,
              options: {
                fill: { color: bg },
                fontFace: 'Courier New',
                fontSize: 8.5,
                align: 'center',
                color: COLORS.slateMuted,
                valign: 'middle',
              },
            },
            {
              text: fmtMoney(r.unitSellingPrice),
              options: {
                fill: { color: bg },
                fontFace: 'Courier New',
                fontSize: 9,
                align: 'right',
                color: COLORS.slateText,
                valign: 'middle',
              },
            },
            totalCell,
          ]);
        } else if (model.tableMode === 'qty_and_total') {
          tableRows.push([
            ...baseCells,
            {
              text: fmtQty(r.qty),
              options: {
                fill: { color: bg },
                fontFace: 'Courier New',
                fontSize: 9,
                bold: true,
                align: 'right',
                color: COLORS.slateText,
                valign: 'middle',
              },
            },
            {
              text: r.unit,
              options: {
                fill: { color: bg },
                fontFace: 'Courier New',
                fontSize: 8.5,
                align: 'center',
                color: COLORS.slateMuted,
                valign: 'middle',
              },
            },
            totalCell,
          ]);
        } else {
          tableRows.push([...baseCells, totalCell]);
        }
      });

      // Component Total Footer Row on final page of the component
      if (isLastPage) {
        const footerSpanCols = colWidths.length - 1;
        const footerCells = [
          {
            text: `TOTAL — ${comp.title.toUpperCase()}`,
            options: {
              colspan: footerSpanCols,
              fill: { color: COLORS.navy },
              color: COLORS.white,
              fontFace: 'Arial',
              fontSize: 9.5,
              bold: true,
              align: 'right',
              valign: 'middle',
              margin: [4, 10, 4, 10],
            },
          },
          {
            text: fmtMoney(comp.totalSelling),
            options: {
              fill: { color: COLORS.emerald },
              color: COLORS.white,
              fontFace: 'Courier New',
              fontSize: 10,
              bold: true,
              align: 'right',
              valign: 'middle',
            },
          },
        ];
        tableRows.push(footerCells);
      }

      slide.addTable(tableRows, {
        x: 0.45,
        y: 1.62,
        w: 12.43,
        colW: colWidths,
        border: { type: 'solid', pt: 0.5, color: COLORS.border },
        rowH: 0.36,
      });
    }
  }

  const safeCode = String(model.proposalCode || 'Proposal').replace(/[^a-zA-Z0-9._-]/g, '_');
  const resolvedFileName =
    fileName || `${safeCode}_Commercial_BOQ_Offer_${model.dateStr}.pptx`;

  if (download) {
    await pptx.writeFile({ fileName: resolvedFileName });
  }

  return { pptx, fileName: resolvedFileName };
}
