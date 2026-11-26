const CONDUIT_FAMILY_MAP = {
  'Liquid Tight': {
    conduit: '65e37519-39a2-49cf-97e3-0e791084ca45',
    adapter: '752fdb9d-a15b-465d-8155-3f6462d07e8e',
    coupler: '',
    strap: ''
  },
  'EMT': {
    conduit: '325663e7-139d-4f3c-a291-8452ca523ed3',
    adapter: '355786f3-4957-450b-9fa1-e62badd263d0',
    coupler: 'a9ae9651-8222-4458-b9e1-081e284c5652',
    strap: 'f489563c-5c1f-476d-91d9-f76e35ce007e'
  },
  'IMC': {
    conduit: 'c76b8789-7583-4c64-82d5-1e2fd69a9961',
    adapter: 'd025d1a4-60a5-40c4-a17f-555d4aafc100',
    coupler: '2cd9f6ea-8d0e-45b3-b669-a1832327cc1b',
    strap: 'd471d4da-eb6d-4b44-8d5a-87019834a6e6'
  },
  'RGS': {
    conduit: 'cddf37d6-4318-4c9a-b865-767913908234',
    adapter: '2efc8c90-e6e9-429c-be33-046f73a7cd66',
    coupler: '506fcb30-7ff4-4718-bb38-12968d967b65',
    strap: '6927855d-9436-4b55-82b6-558878cdf014'
  },
  'UPVC': {
    conduit: 'd6f60ed4-a79c-4bc4-8abf-1e8d5aacbc9d',
    adapter: '73ecee8c-1621-49cb-99ba-2644156f4daa',
    coupler: '40318900-a7d3-48de-8f83-9c3b4a860cbe',
    strap: ''
  }
};

const applyConduitFamily = (mat, prefix, next) => {
  const family = CONDUIT_FAMILY_MAP[mat] || CONDUIT_FAMILY_MAP['Liquid Tight'];
  next[`${prefix}_cable_type_01_conduit_type`] = mat;
  next[`${prefix}_cable_conduit_liquid_tight_type_01_id`] = family.conduit;
  next[`${prefix}_recommended_conduit_for_type_01`] = family.conduit;
  next[`${prefix}_recommended_conduit_adapter_for_type_01`] = family.adapter;
  next[`${prefix}_conduit_adapter_for_type_01_quantity_no`] = String(family.adapterQty);
  next[`${prefix}_recommended_conduit_coupler_for_type_01`] = family.coupler;
  next[`${prefix}_conduit_coupler_for_type_01_quantity_no`] = String(family.couplerQty);
  next[`${prefix}_recommended_conduit_straps_for_type_01`] = family.strap;
  next[`${prefix}_conduit_straps_for_type_01_quantity_no`] = String(family.strapQty);
};

const getSafePumpProp = (p, ...keys) => {
  if (!p) return '';
  for (const k of keys) {
    if (p[k] !== undefined && p[k] !== null && p[k] !== '') return p[k];
  }
  return '';
};

import { buildWaterFeatureElectromechanicalBoq } from '../utils/engine/modules/waterFeatureElectromechanicalBoqBuilder';
import { calculateWaterFeatureElectromechanical } from '../utils/engine/modules/waterFeatureElectromechanicalCalc';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  HardHat,
  Hammer,
  Truck,
  Building2,
  Droplets, 
  Cpu, 
  Flame, 
  Lightbulb, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Wrench, 
  FileSpreadsheet, 
  Boxes, 
  Waves, 
  CheckCircle2, 
  AlertCircle, 
  Maximize2, 
  Pipette, 
  GitFork, 
  Radio, 
  Sliders,
  Sparkles,
  Thermometer,
  Activity,
  ArrowRight,
  Calculator,
  Info,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  Filter,
  Check
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { 
  STATIC_WF_TYPES_LOOKUP, 
  STATIC_ITEMS_LOOKUP,
  isWfOverflow,
  isWfSkimmer,
  isWfSkimfilter,
  isWfLagoon
} from '../lib/staticLookup';


export default function WaterFeatureElectromechanicalSuite({
  formData = {},
  onChange,
  proposals = [],
  phases = [],
  pdeData = [],
  wfTechnicalData = [],
  prTechnicalData = [],
  filterPumps = [],
  mediaFilters = [],
  itemCategories = [],
  accessories = [],
  mainDrains = [],
  chlorinators = [],
  heaters = [],
  lightingList = [],
  transformersList = [],
  junctionBoxesList = [],
  disconnectSwitchesList = [],
  conduitsList = [],
  cablesList = [],
  brandsList = [],
  itemsList = [],
  mechCost: propMechCost,
  elecCost: propElecCost,
  totalMepCost: propTotalMepCost,
  allBoqItems: propAllBoqItems
}) {
  const [emSection, setEmSection] = useState('filtration');

  const selectedProposalId = formData.tender_log_id || formData.linked_proposal || '';
  const selectedPhaseId = formData.phase_id || formData.linked_phase || '';

  const activeProposal = useMemo(() => {
    return proposals.find(p => String(p.id) === String(selectedProposalId));
  }, [proposals, selectedProposalId]);

  const activePhase = useMemo(() => {
    return phases.find(p => String(p.id) === String(selectedPhaseId));
  }, [phases, selectedPhaseId]);

  // Robust PDE lookup prioritizing candidate with dimensions
  const activePde = useMemo(() => {
    if (!selectedPhaseId) return null;
    const candidates = (pdeData || wfTechnicalData || []).filter(
      w => String(w.phase_id || w.linked_phase || w.id) === String(selectedPhaseId)
    );
    const withDimensions = candidates.find(
      w => Number(w.water_feature_area_m2 || w.water_feature_area || (Number(w.pool_length_m) * Number(w.pool_width_m))) > 0
    );
    return withDimensions || candidates[0] || null;
  }, [pdeData, wfTechnicalData, selectedPhaseId]);

  const pLen = Number(formData.pool_length_m || activePde?.pool_length_m || 0);
  const pWid = Number(formData.pool_width_m || activePde?.pool_width_m || 0);
  const calcDimArea = (pLen > 0 && pWid > 0) ? Number((pLen * pWid).toFixed(2)) : 0;

  const resolvedArea = Number(
    formData.water_feature_area_m2 || 
    formData.water_feature_area || 
    formData.area_m2 ||
    activePde?.water_feature_area_m2 || 
    activePde?.water_feature_area ||
    calcDimArea ||
    activePhase?.area_sqm ||
    50
  );

  const resolvedDepth = Number(
    formData.depth_m || 
    formData.avg_height_m || 
    formData.pool_depth_m || 
    activePde?.avg_height_m || 
    activePde?.water_deep_height_m || 
    1.4
  );

  const resolvedVolume = Number(
    formData.water_feature_volume_m3 || 
    formData.water_feature_volume || 
    formData.volume_m3 ||
    activePde?.water_feature_volume_m3 || 
    activePde?.water_feature_volume ||
    activePhase?.pool_volume_m3 ||
    (resolvedArea > 0 ? Number((resolvedArea * resolvedDepth).toFixed(2)) : 70)
  );

  const resolvedPerimeter = Number(
    formData.water_feature_perimeter_m || 
    formData.water_feature_perimeter || 
    activePde?.water_feature_perimeter_m || 
    activePde?.water_feature_perimeter ||
    (pLen > 0 && pWid > 0 ? Number((2 * (pLen + pWid)).toFixed(2)) : 30)
  );

  // Fast Dictionary Lookups
  const brandsMap = useMemo(() => {
    const map = {};
    (brandsList || []).forEach(b => {
      map[b.id] = b.title || b.name || b.brand_name || b['Brand Name'] || '';
    });
    map['fe7c3a44-3e9d-4a32-8831-d47a042826ee'] = 'Pedrollo';
    map['2d99b439-f9f7-47a9-9202-ed7d94a5ca26'] = 'EBARA';
    map['e052dc94-8b69-4042-b587-49a266f11a33'] = 'Astral Pool';
    return map;
  }, [brandsList]);

  const itemsMap = useMemo(() => {
    return Object.fromEntries((itemsList || []).map(i => [i.id, i]));
  }, [itemsList]);

  // Safe Dynamic BOQ Items & Discipline Costs (Always computed live from active formData)
  const boqItems = useMemo(() => {
    try {
      const parentRecord = {
        pool_length_m: pLen,
        pool_width_m: pWid,
        pool_depth_m: resolvedDepth,
        water_feature_perimeter_m: resolvedPerimeter,
        water_feature_volume_m3: resolvedVolume,
        water_feature_area_m2: resolvedArea,
        accommodations_required: formData.accommodations_required || 'No'
      };
      let activeForm = { ...formData };
      if (
        (!activeForm.water_filter_code || !activeForm.water_filter_pump_code || !activeForm.submersible_pump_code) &&
        ((mediaFilters && mediaFilters.length > 0) || (filterPumps && filterPumps.length > 0))
      ) {
        try {
          const calcResult = calculateWaterFeatureElectromechanical(
            activeForm,
            parentRecord,
            {
              mediaFilters: mediaFilters || [],
              filter_types: mediaFilters || [],
              filterPumps: filterPumps || [],
              filter_pump_types: filterPumps || [],
              proposal_data_entry: pdeData || [],
              pump_room_data_entry: prTechnicalData || []
            }
          );
          if (calcResult) {
            activeForm = { ...activeForm, ...calcResult };
          }
        } catch (calcErr) {
          console.warn('Live calc in Suite boqItems fallback:', calcErr);
        }
      }
      const scopeExistingBreakdown = (activeForm?.proposal_breakdown_items && activeForm.proposal_breakdown_items.length > 0)
        ? activeForm.proposal_breakdown_items
        : [];
      const res = buildWaterFeatureElectromechanicalBoq(
        activeForm, 
        scopeExistingBreakdown, 
        {
          items: itemsList || [],
          items_database: itemsList || [],
          phases: phases || [],
          proposal_data_entry: pdeData || [],
          pump_room_data_entry: prTechnicalData || [],
          water_feature_category: itemCategories || [],
          filter_pump_types: filterPumps || [],
          filter_types: mediaFilters || [],
          mediaFilters: mediaFilters || [],
          filterPumps: filterPumps || [],
          lighting_type: lightingList || [],
          lightingList: lightingList || [],
          transformer_type: transformersList || [],
          cable_types: cablesList || [],
          cables: cablesList || [],
          junction_box: junctionBoxesList || [],
          circulation_accessories: accessories || [],
          main_drain: mainDrains || [],
          tablet_chlorinator: chlorinators || [],
          heaters: heaters || [],
          disconnect_switch_types: disconnectSwitchesList || [],
          cable_conduits: conduitsList || []
        }, 
        parentRecord
      );

      const rawList = Array.isArray(res) ? res : (res?.proposal_breakdown_items || res?.items || []);
      const seenSpawners = new Set();
      const dynamicList = rawList.filter(item => {
        const sp = String(item._spawnerid || item.rowIdFlag || '').toLowerCase();
        if (sp.startsWith('_isem')) {
          if (seenSpawners.has(sp)) return false;
          seenSpawners.add(sp);
        }
        return true;
      });
      if (dynamicList.length > 0) {
        return dynamicList;
      }
    } catch (e) {
      console.warn('Dynamic BOQ generation fallback in Suite:', e);
    }

    if (formData && Array.isArray(formData.proposal_breakdown_items) && formData.proposal_breakdown_items.length > 0) {
      return formData.proposal_breakdown_items;
    }
    return [];
  }, [
    propAllBoqItems, 
    formData, 
    itemsList, 
    phases, 
    itemCategories,
    filterPumps, 
    mediaFilters, 
    lightingList, 
    transformersList, 
    cablesList, 
    junctionBoxesList, 
    accessories, 
    mainDrains, 
    chlorinators, 
    heaters, 
    disconnectSwitchesList, 
    conduitsList
  ]);

  useEffect(() => {
    if (!onChange || typeof onChange !== 'function') return;
    const needsFilter = !formData.water_filter_code;
    const needsPump = !formData.water_filter_pump_code;
    const needsSub = !formData.submersible_pump_code;
    if ((needsFilter || needsPump || needsSub) && ((mediaFilters && mediaFilters.length > 0) || (filterPumps && filterPumps.length > 0))) {
      try {
        const parentRecord = {
          pool_length_m: pLen,
          pool_width_m: pWid,
          pool_depth_m: resolvedDepth,
          water_feature_perimeter_m: resolvedPerimeter,
          water_feature_volume_m3: resolvedVolume,
          water_feature_area_m2: resolvedArea,
          accommodations_required: formData.accommodations_required || 'No'
        };
        const calculated = calculateWaterFeatureElectromechanical(
          { ...formData },
          parentRecord,
          {
            mediaFilters: mediaFilters || [],
            filter_types: mediaFilters || [],
            filterPumps: filterPumps || [],
            filter_pump_types: filterPumps || [],
            proposal_data_entry: pdeData || [],
            pump_room_data_entry: prTechnicalData || []
          }
        );
        if (
          calculated && (
            (calculated.water_filter_code && calculated.water_filter_code !== formData.water_filter_code) ||
            (calculated.water_filter_pump_code && calculated.water_filter_pump_code !== formData.water_filter_pump_code) ||
            (calculated.submersible_pump_code && calculated.submersible_pump_code !== formData.submersible_pump_code)
          )
        ) {
          onChange(calculated);
        }
      } catch (e) {
        console.warn('Suite smart auto-selection effect error:', e);
      }
    }
  }, [
    formData.water_filter_code,
    formData.water_filter_pump_code,
    formData.submersible_pump_code,
    mediaFilters,
    filterPumps
  ]);

  const mechItems = useMemo(() => {
    return boqItems.filter(i => (i?.work_type || '').toLowerCase() === 'mechanical');
  }, [boqItems]);

  const elecItems = useMemo(() => {
    return boqItems.filter(i => (i?.work_type || '').toLowerCase() === 'electrical');
  }, [boqItems]);

  const calculatedMechCost = useMemo(() => {
    const computed = mechItems.reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);
    if (computed > 0) return computed;
    if (propMechCost !== undefined && propMechCost !== null) return propMechCost;
    return computed;
  }, [propMechCost, mechItems]);

  const calculatedElecCost = useMemo(() => {
    const computed = elecItems.reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);
    if (computed > 0) return computed;
    if (propElecCost !== undefined && propElecCost !== null) return propElecCost;
    return computed;
  }, [propElecCost, elecItems]);

  const calculatedTotalCost = useMemo(() => {
    const total = calculatedMechCost + calculatedElecCost;
    if (total > 0) return total;
    if (propTotalMepCost !== undefined && propTotalMepCost !== null) return propTotalMepCost;
    return total;
  }, [propTotalMepCost, calculatedMechCost, calculatedElecCost]);

  // Real BOQ Table Interactive View State & Filters
  const [isBoqExpanded, setIsBoqExpanded] = useState(false);
  const [boqSearchQuery, setBoqSearchQuery] = useState('');
  const [boqFilterDiscipline, setBoqFilterDiscipline] = useState('all'); // 'all' | 'mechanical' | 'electrical'
  const [boqFilterActivity, setBoqFilterActivity] = useState('all'); // 'all' | 'procurement' | 'installation'
  const [boqFilterCategory, setBoqFilterCategory] = useState('all');

  const uniqueBoqCategories = useMemo(() => {
    const set = new Set();
    boqItems.forEach(i => {
      const cat = i.work_main_category || i.main_category;
      if (cat) set.add(cat);
    });
    return Array.from(set).sort();
  }, [boqItems]);

  const filteredBoqItems = useMemo(() => {
    return boqItems.filter(item => {
      if (boqFilterDiscipline !== 'all' && (item.work_type || '').toLowerCase() !== boqFilterDiscipline) return false;
      if (boqFilterActivity !== 'all' && (item.activity_type || '').toLowerCase() !== boqFilterActivity) return false;
      if (boqFilterCategory !== 'all') {
        const cat = item.work_main_category || item.main_category;
        if (cat !== boqFilterCategory) return false;
      }
      if (boqSearchQuery.trim()) {
        const q = boqSearchQuery.toLowerCase().trim();
        const itemName = (STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item_name || item.item || '').toLowerCase();
        const cat = (item.work_main_category || item.main_category || '').toLowerCase();
        const wt = (item.work_type || '').toLowerCase();
        return itemName.includes(q) || cat.includes(q) || wt.includes(q);
      }
      return true;
    });
  }, [boqItems, boqFilterDiscipline, boqFilterActivity, boqFilterCategory, boqSearchQuery, itemsMap]);

  const filteredBoqTotalCost = useMemo(() => {
    return filteredBoqItems.reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [filteredBoqItems]);


  // Filter BOQ Items specifically belonging to Sub-Tab 1 (Filtration & Pumps Infrastructure)
  const subTab1BoqItems = useMemo(() => {
    const validSubTab1Categories = [
      'water filter',
      'sand filter',
      'water filtration pump',
      'filtration pump',
      'filtration pump electrical cable',
      'vacuum pump',
      'vacuum filtration pump',
      'vacuum pump electrical cable',
      'submersible pump',
      'submersible pump electrical cable',
      'submersible drainage pump',
      'grp box'
    ];

    return boqItems.filter(item => {
      const cat = (item.work_main_category || item.main_category || '').toLowerCase().trim();
      const flag = (item.rowIdFlag || item._spawnerid || item._spawnerId || '').toLowerCase().trim();

      if (
        flag.startsWith('_isemfilterpump') || 
        flag.startsWith('_isemsandfilter') || 
        (flag.startsWith('_isemvacuum') && !flag.startsWith('_isemvacuuminlet')) || 
        flag.startsWith('_isemsubmersible') || 
        flag.startsWith('_isemgrpbox') ||
        flag.startsWith('_isem_filtration_pump') ||
        flag.startsWith('_isem_vacuum_pump') ||
        flag.startsWith('_isem_submersible_pump')
      ) {
        return true;
      }

      return validSubTab1Categories.some(validCat => cat === validCat || cat.includes(validCat));
    });
  }, [boqItems]);

  const subTab1MechCost = useMemo(() => {
    return subTab1BoqItems
      .filter(i => (i.work_type || '').toLowerCase() === 'mechanical')
      .reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab1BoqItems]);

  const subTab1ElecCost = useMemo(() => {
    return subTab1BoqItems
      .filter(i => (i.work_type || '').toLowerCase() === 'electrical')
      .reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab1BoqItems]);

  const subTab1TotalCost = useMemo(() => {
    return subTab1MechCost + subTab1ElecCost;
  }, [subTab1MechCost, subTab1ElecCost]);

  // Filter BOQ Items specifically belonging to Sub-Tab 2 (Dosing, Fittings, Inlets, Drains & Pipes)
  const subTab2BoqItems = useMemo(() => {
    return boqItems.filter(item => {
      const cat = (item.work_main_category || item.main_category || '').toLowerCase().trim();
      const flag = (item.rowIdFlag || item._spawnerid || item._spawnerId || '').toLowerCase().trim();
      const name = (item.item_name || item.fallbackName || item.item || '').toLowerCase().trim();
      const workType = (item.work_type || '').toLowerCase().trim();
      const act = (item.activity_type || '').toLowerCase().trim();

      // Exclude any electrical/cable tray items or Sub-Tab 7 installation/accommodation items
      if (
        workType === 'electrical' ||
        act === 'installation' ||
        act === 'accommodation' ||
        cat.includes('cable') ||
        cat.includes('tray') ||
        cat.includes('conduit') ||
        name.includes('cable tray')
      ) {
        return false;
      }

      // 1. Piping Networks, Fittings & Valves (UPVC / HDPE)
      if (
        flag.startsWith('_isemupvc') || 
        flag.startsWith('_isemhdpe') || 
        (flag.startsWith('_isempumproom') && !flag.startsWith('_isempumproommechinstallation')) ||
        flag.startsWith('_isempipenetwork') ||
        flag.startsWith('_isemvalve') ||
        flag.startsWith('_isembv') ||
        flag.startsWith('_isemballvalve') ||
        flag.startsWith('_isemcheckvalve') ||
        cat.includes('upvc pipe') ||
        cat.includes('hdpe pipe') ||
        cat.includes('pipes, fittings & valves')
      ) {
        return true;
      }

      // 2. Pool Shell Fittings (Inlets, Drains, Skimmers)
      if (
        flag.startsWith('_isemskimmer') ||
        flag.startsWith('_isemfloorinlet') ||
        flag.startsWith('_isemwallinlet') ||
        flag.startsWith('_isemvacuuminlet') ||
        flag.startsWith('_isemmaindrain') ||
        flag.startsWith('_isemgutterdrain') ||
        cat.includes('skimmer') ||
        cat.includes('inlet') ||
        cat.includes('drain') ||
        cat.includes('vacuum point')
      ) {
        return true;
      }

      // 3. Chemical Dosing & Tablet Chlorinators
      if (
        flag.startsWith('_isemdosing') ||
        flag.startsWith('_isemtabletchlorinator') ||
        flag.startsWith('_isemstirrer') ||
        flag.startsWith('_isemmixingtank') ||
        cat.includes('chemical dosing') ||
        cat.includes('tablet chlorinator') ||
        cat.includes('chlorinator')
      ) {
        return true;
      }

      // 4. Manual Cleaning Set
      if (
        flag.startsWith('_isemmanualclean') ||
        flag.startsWith('_isemcleaning') ||
        cat.includes('manual cleaning set') ||
        cat.includes('cleaning set') ||
        cat.includes('circulation accessories') ||
        workType === 'manual cleaning set' ||
        name.includes('manual cleaning set')
      ) {
        return true;
      }

      // 5. Automatic Makeup System (Float Valve, Float Switch)
      if (
        flag.startsWith('_isemfloat') ||
        flag.startsWith('_isemmakeup') ||
        flag.startsWith('_isemautofill') ||
        cat.includes('automatic makeup') ||
        cat.includes('makeup system') ||
        cat.includes('float valve') ||
        cat.includes('float switch') ||
        name.includes('float valve') ||
        name.includes('float switch')
      ) {
        return true;
      }

      return false;
    });
  }, [boqItems]);

  const subTab2TotalCost = useMemo(() => {
    return subTab2BoqItems.reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab2BoqItems]);

  // Filter BOQ Items specifically belonging to Sub-Tab 3 (Lighting & Transformers)
  const subTab3BoqItems = useMemo(() => {
    return boqItems.filter(item => {
      const cat = (item.work_main_category || item.main_category || '').toLowerCase().trim();
      const flag = (item.rowIdFlag || item._spawnerid || item._spawnerId || '').toLowerCase().trim();
      const name = (item.item_name || item.fallbackName || item.item || '').toLowerCase().trim();

      if (
        flag.startsWith('_isemlight') || 
        flag.startsWith('_isemtrans') || 
        flag.startsWith('_isemjbox') || 
        flag.startsWith('_isemelectriccable') ||
        flag.startsWith('_isemcablegland') ||
        flag.startsWith('_isemprotectiveconduit') ||
        flag.startsWith('_isemmainconduit') ||
        flag.startsWith('_isemfeedingcable') ||
        flag.startsWith('_isemoutputcable') ||
        cat.includes('lighting') ||
        cat.includes('transformer') ||
        name.includes('underwater led') ||
        name.includes('luminaire') ||
        name.includes('transformer') ||
        name.includes('deck box') ||
        name.includes('niche')
      ) {
        return true;
      }
      return false;
    });
  }, [boqItems]);

  const subTab3TotalCost = useMemo(() => {
    return subTab3BoqItems.reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab3BoqItems]);

  // Filter BOQ Items specifically belonging to Sub-Tab 4 (Heating Systems & Heat Pumps)
  const subTab4BoqItems = useMemo(() => {
    const heaterId = formData.heater_type || formData.recommended_heater_model;
    const heaterQty = Number(formData.no_of_heaters || formData.heater_qty || 0);
    const hasHeaterConfig = Boolean(heaterId && heaterQty > 0);

    return boqItems.filter(item => {
      const cat = (item.work_main_category || item.main_category || '').toLowerCase().trim();
      const flag = (item.rowIdFlag || item._spawnerid || item._spawnerId || '').toLowerCase().trim();
      const name = (item.item_name || item.fallbackName || item.item || '').toLowerCase().trim();

      const isHeater = flag.includes('heater') || flag.includes('heatpump') || 
                       cat.includes('heater') || cat.includes('heat pump') || cat.includes('heating') ||
                       name.includes('heater') || name.includes('heat pump') || name.includes('heat exchanger');

      if (isHeater) {
        if (!hasHeaterConfig && (flag === '_isemheaterauto' || !item.isManual)) {
          return false;
        }
        return true;
      }
      return false;
    });
  }, [boqItems, formData.heater_type, formData.recommended_heater_model, formData.no_of_heaters, formData.heater_qty]);

  const subTab4MechCost = useMemo(() => {
    return subTab4BoqItems
      .filter(i => (i.work_type || '').toLowerCase() === 'mechanical')
      .reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab4BoqItems]);

  const subTab4ElecCost = useMemo(() => {
    return subTab4BoqItems
      .filter(i => (i.work_type || '').toLowerCase() === 'electrical')
      .reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab4BoqItems]);

  const subTab4TotalCost = useMemo(() => {
    return subTab4MechCost + subTab4ElecCost;
  }, [subTab4MechCost, subTab4ElecCost]);

  // Filter BOQ Items specifically belonging to Sub-Tab 5 (Earthing & Lightning Grounding Protection System)
  const subTab5BoqItems = useMemo(() => {
    return boqItems.filter(item => {
      const cat = (item.work_main_category || item.main_category || '').toLowerCase().trim();
      const flag = (item.rowIdFlag || item._spawnerid || item._spawnerId || '').toLowerCase().trim();
      const name = (STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item_name || item.fallbackName || item.item || '').toLowerCase().trim();

      // STRICT EXCLUSIONS: lighting, sockets, conduits, cable tray, ventilation, mechanical
      if (
        cat.includes('lighting') ||
        cat.includes('socket') ||
        cat.includes('ventilation') ||
        cat.includes('cable tray') ||
        cat.includes('fire extinguisher') ||
        name.includes('emt') ||
        name.includes('tri-proof') ||
        name.includes('greenperform') ||
        name.includes('gw66004') ||
        name.includes('gw20571') ||
        name.includes('gw27062') ||
        name.includes('rosenberg') ||
        name.includes('bavaria') ||
        flag.startsWith('_isemprlight') ||
        flag.startsWith('_isemsocket') ||
        flag.startsWith('_isemventilation') ||
        flag.startsWith('_isemcabletray') ||
        flag.startsWith('_isemvelbow') ||
        flag.startsWith('_isemhelbow') ||
        flag.startsWith('_isemendcap') ||
        flag.startsWith('_isemanchors') ||
        flag.startsWith('_isemcchannel') ||
        flag.startsWith('_isemfireext')
      ) {
        return false;
      }

      // STRICT INCLUSIONS: Earthing items only
      return (
        flag.startsWith('_isemearthing') ||
        flag.startsWith('_isemdriv') ||
        flag.startsWith('_isemconcreteearth') ||
        flag.startsWith('_isembarecopper') ||
        flag.startsWith('_isemcabletosteel') ||
        flag.startsWith('_isemthermoweld') ||
        cat === 'water feature earthing' ||
        cat === 'earthing & cable trays' ||
        cat === 'earthing' ||
        cat === 'grounding'
      );
    });
  }, [boqItems, itemsMap]);

  const subTab5TotalCost = useMemo(() => {
    return subTab5BoqItems.reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab5BoqItems]);

  // Filter BOQ Items specifically belonging to Sub-Tab 6 (Pump Room MEP Services, Containment & Cable Trays)
  const subTab6BoqItems = useMemo(() => {
    return boqItems.filter(item => {
      const cat = (item.work_main_category || item.main_category || '').toLowerCase().trim();
      const flag = (item.rowIdFlag || item._spawnerid || item._spawnerId || '').toLowerCase().trim();
      const name = (item.item_name || item.fallbackName || item.item || '').toLowerCase().trim();

      if (
        flag.startsWith('_isemprlight') ||
        flag.startsWith('_isemsocket') ||
        flag.startsWith('_isemventilation') ||
        flag.startsWith('_isemcabletray') ||
        flag.startsWith('_isemvelbow') ||
        flag.startsWith('_isemhelbow') ||
        flag.startsWith('_isemendcap') ||
        flag.startsWith('_isemanchors') ||
        flag.startsWith('_isemcchannel') ||
        flag.startsWith('_isemfireext') ||
        cat.includes('pump room lighting') ||
        cat.includes('service sockets') ||
        cat.includes('service socket') ||
        cat.includes('ventilation') ||
        cat.includes('main cable tray') ||
        cat.includes('fire extinguisher') ||
        name.includes('tri-proof') ||
        name.includes('greenperform') ||
        name.includes('gw66004') ||
        name.includes('gw20571') ||
        name.includes('gw27062') ||
        name.includes('rosenberg') ||
        name.includes('bavaria') ||
        name.includes('cable tray') ||
        name.includes('splice plate') ||
        name.includes('c channel')
      ) {
        return true;
      }
      return false;
    });
  }, [boqItems]);

  const subTab6MechCost = useMemo(() => {
    return subTab6BoqItems
      .filter(i => (i.work_type || '').toLowerCase() === 'mechanical')
      .reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab6BoqItems]);

  const subTab6ElecCost = useMemo(() => {
    return subTab6BoqItems
      .filter(i => (i.work_type || '').toLowerCase() === 'electrical' || (i.work_type || '').toLowerCase() !== 'mechanical')
      .reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab6BoqItems]);

  const subTab6TotalCost = useMemo(() => {
    return subTab6BoqItems.reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab6BoqItems]);

  // Filter BOQ Items specifically belonging to Sub-Tab 7 (Installation, Labor, Accommodations & Other Scope Items)
  const subTab7BoqItems = useMemo(() => {
    return boqItems.filter(item => {
      // Exclude any items already claimed by Sub-Tabs 1-6 so all 7 sub-tabs are mutually exclusive
      const inSubTab1 = subTab1BoqItems.some(i => i === item || (i.id && i.id === item.id) || (i.rowIdFlag && i.rowIdFlag === item.rowIdFlag) || (i._spawnerid && i._spawnerid === item._spawnerid));
      const inSubTab2 = subTab2BoqItems.some(i => i === item || (i.id && i.id === item.id) || (i.rowIdFlag && i.rowIdFlag === item.rowIdFlag) || (i._spawnerid && i._spawnerid === item._spawnerid));
      const inSubTab3 = subTab3BoqItems.some(i => i === item || (i.id && i.id === item.id) || (i.rowIdFlag && i.rowIdFlag === item.rowIdFlag) || (i._spawnerid && i._spawnerid === item._spawnerid));
      const inSubTab4 = subTab4BoqItems.some(i => i === item || (i.id && i.id === item.id) || (i.rowIdFlag && i.rowIdFlag === item.rowIdFlag) || (i._spawnerid && i._spawnerid === item._spawnerid));
      const inSubTab5 = subTab5BoqItems.some(i => i === item || (i.id && i.id === item.id) || (i.rowIdFlag && i.rowIdFlag === item.rowIdFlag) || (i._spawnerid && i._spawnerid === item._spawnerid));
      const inSubTab6 = subTab6BoqItems.some(i => i === item || (i.id && i.id === item.id) || (i.rowIdFlag && i.rowIdFlag === item.rowIdFlag) || (i._spawnerid && i._spawnerid === item._spawnerid));

      return !inSubTab1 && !inSubTab2 && !inSubTab3 && !inSubTab4 && !inSubTab5 && !inSubTab6;
    });
  }, [boqItems, subTab1BoqItems, subTab2BoqItems, subTab3BoqItems, subTab4BoqItems, subTab5BoqItems, subTab6BoqItems]);

  const subTab7MechCost = useMemo(() => {
    return subTab7BoqItems
      .filter(i => (i.work_type || '').toLowerCase() === 'mechanical' && (i.activity_type || '').toLowerCase() !== 'accommodation')
      .reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab7BoqItems]);

  const subTab7ElecCost = useMemo(() => {
    return subTab7BoqItems
      .filter(i => (i.work_type || '').toLowerCase() === 'electrical' && (i.activity_type || '').toLowerCase() !== 'accommodation')
      .reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab7BoqItems]);

  const subTab7AccomCost = useMemo(() => {
    return subTab7BoqItems
      .filter(i => (i.activity_type || '').toLowerCase() === 'accommodation' || (i.work_main_category || '').toLowerCase().includes('accommodation'))
      .reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab7BoqItems]);

  const subTab7TotalCost = useMemo(() => {
    return subTab7BoqItems.reduce((acc, i) => acc + (Number(i.total_cost) || 0), 0);
  }, [subTab7BoqItems]);

  const handleExportBoqCsv = () => {
    if (filteredBoqItems.length === 0) return;
    const headers = [
      '#', 'Item Description', 'Trade Category', 'Discipline', 'Activity Type', 
      'Base Qty', 'Extra %', 'Final Qty', 'Unit', 'Unit Cost (EGP)', 'Total Cost (EGP)'
    ];
    const rows = filteredBoqItems.map((item, idx) => {
      const itemName = STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item_name || item.item || '';
      return [
        idx + 1,
        `"${itemName.replace(/"/g, '""')}"`,
        `"${(item.work_main_category || item.main_category || '').replace(/"/g, '""')}"`,
        `"${item.work_type || ''}"`,
        `"${item.activity_type || ''}"`,
        item.quantity || 0,
        item.extra_amount_percentage || 0,
        item.final_quantity || 0,
        `"${item.unit || ''}"`,
        item.unit_cost || 0,
        item.total_cost || 0
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cairoToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(new Date());
    link.setAttribute('download', `Electromechanical_BOQ_${activeProposal?.proposal_number || 'Tender'}_${cairoToday}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Water Feature Phase filtering (strictly dependent on selected proposal)
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

  // 2. Pump Room filtering (strictly dependent on selected proposal)
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
    if (!selectedProposalId) return [];
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
  }, [formData.related_pump_rooms, selectedProposalId]);

  // Handle updates with automatic equation cascading
const handleFieldsChange = (updates) => {
    const nextForm = {
      ...formData,
      ...updates
    };

    // If turnover hours or filtration speed changed, recalculate Q and Req Area
    if ('hours_of_filtration' in updates || 'filtration_speed' in updates) {
      const vol = Number(nextForm.water_feature_volume) || 0;
      const hrs = Number(nextForm.hours_of_filtration) || 6;
      const spd = Number(nextForm.filtration_speed) || 40;
      if (vol > 0 && hrs > 0) {
        const qFilt = Number((vol / hrs).toFixed(2));
        nextForm.water_filtration = qFilt.toString();
        nextForm.required_filtration_area_m2 = Number((qFilt / spd).toFixed(3));
      }
    }

// If filter changed, recalculate quantity and match circulation pump HP
    if ('water_filter_code' in updates && updates.water_filter_code) {
      const fObj = mediaFilters.find(f => String(f.id) === String(updates.water_filter_code));
      if (fObj) {
        const qFilt = Number(nextForm.water_filtration) || 0;
        const modelFlow = Number(fObj.min_flow_rate) || 14;
        if (qFilt > 0 && modelFlow > 0) {
          const qty = Math.max(1, Math.ceil(qFilt / modelFlow));
          nextForm.no_of_water_filter = String(qty);
          nextForm.no_of_water_filter_pump = String(qty);
          nextForm.no_of_water_filter_pump_stand_by = String(Math.max(1, Math.ceil(qty / 3)));
        }

        // Auto-match circulation pump by HP
        const targetHp = Number(fObj.pump_hp || 0);
        if (targetHp > 0 && filterPumps.length > 0) {
          const circPumps = filterPumps.filter(p => 
            String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
            (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
          );
          const pBrand = nextForm.pump_brand || nextForm.water_filter_pump_brand || fObj.filter_brand || fObj.brand_id;
          const brandPumps = circPumps.filter(p => String(p.pump_brand) === String(pBrand) || String(p.brand_id) === String(pBrand));
          const list = brandPumps.length > 0 ? brandPumps : circPumps;
          const sorted = [...list].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
          const matched = sorted.find(p => Number(p.filter_pump_hp || 0) >= targetHp) || sorted[sorted.length - 1];
          if (matched) {
            nextForm.water_filter_pump_code = matched.id;
            nextForm.preferred_water_filter_pump = matched.id;
            nextForm.water_filter_pump = matched.id;
            if (matched.pump_brand) {
              nextForm.pump_brand = matched.pump_brand;
              nextForm.water_filter_pump_brand = matched.pump_brand;
            }
            populatePumpElectricals(matched, 'water_filter_pump', nextForm);
          }
        }
      }
    }

        onChange(nextForm);
  };

  const handleFieldChange = (field, value, extraUpdates = null) => {
    const nextForm = {
      ...formData,
      ...(extraUpdates && typeof extraUpdates === 'object' ? extraUpdates : {}),
      [field]: value
    };

    // If changing area, recalculate volume & flow
    if (field === 'water_feature_area_m2' || field === 'water_feature_area') {
      const newArea = Number(value) || 0;
      nextForm.water_feature_area = String(newArea);
      nextForm.water_feature_area_m2 = newArea;
      const depth = Number(nextForm.depth_m || nextForm.avg_height_m || resolvedDepth || 1.4);
      if (newArea > 0 && depth > 0) {
        const newVol = Number((newArea * depth).toFixed(2));
        nextForm.water_feature_volume = String(newVol);
        nextForm.water_feature_volume_m3 = newVol;
        const hrs = Number(nextForm.hours_of_filtration || 6);
        if (hrs > 0) {
          const qFilt = Number((newVol / hrs).toFixed(2));
          nextForm.water_filtration = qFilt.toString();
          const spd = Number(nextForm.filtration_speed || 40);
          nextForm.required_filtration_area_m2 = Number((qFilt / spd).toFixed(3));
        }
      }
    }

    // If changing depth, recalculate volume & flow
    if (field === 'depth_m' || field === 'avg_height_m') {
      const newDepth = Number(value) || 1.4;
      nextForm.depth_m = newDepth;
      const area = Number(nextForm.water_feature_area_m2 || nextForm.water_feature_area || resolvedArea || 50);
      if (area > 0 && newDepth > 0) {
        const newVol = Number((area * newDepth).toFixed(2));
        nextForm.water_feature_volume = String(newVol);
        nextForm.water_feature_volume_m3 = newVol;
        const hrs = Number(nextForm.hours_of_filtration || 6);
        if (hrs > 0) {
          const qFilt = Number((newVol / hrs).toFixed(2));
          nextForm.water_filtration = qFilt.toString();
          const spd = Number(nextForm.filtration_speed || 40);
          nextForm.required_filtration_area_m2 = Number((qFilt / spd).toFixed(3));
        }
      }
    }

    // If changing volume directly
    if (field === 'water_feature_volume' || field === 'water_feature_volume_m3') {
      const newVol = Number(value) || 0;
      nextForm.water_feature_volume = String(newVol);
      nextForm.water_feature_volume_m3 = newVol;
      const hrs = Number(nextForm.hours_of_filtration || 6);
      if (newVol > 0 && hrs > 0) {
        const qFilt = Number((newVol / hrs).toFixed(2));
        nextForm.water_filtration = qFilt.toString();
        const spd = Number(nextForm.filtration_speed || 40);
        nextForm.required_filtration_area_m2 = Number((qFilt / spd).toFixed(3));
      }
    }

    // If changing turnover hours or filtration speed, recalculate Q and Req Area
    if (field === 'hours_of_filtration' || field === 'filtration_speed') {
      const vol = Number(nextForm.water_feature_volume_m3 || nextForm.water_feature_volume || resolvedVolume) || 0;
      const hrs = Number(field === 'hours_of_filtration' ? value : nextForm.hours_of_filtration) || 6;
      const spd = Number(field === 'filtration_speed' ? value : nextForm.filtration_speed) || 40;
      if (vol > 0 && hrs > 0) {
        const qFilt = Number((vol / hrs).toFixed(2));
        nextForm.water_filtration = qFilt.toString();
        nextForm.required_filtration_area_m2 = Number((qFilt / spd).toFixed(3));
      }
    }

    // If selecting a filter model directly, recalculate filter quantity and suggest pump
    if (field === 'water_filter_code') {
      const selectedFilter = mediaFilters.find(f => String(f.id) === String(value));
      if (selectedFilter) {
        if (selectedFilter.filter_dia) nextForm.water_filter_diameter = String(selectedFilter.filter_dia);
        if (selectedFilter.filter_brand) nextForm.water_filter_brand = selectedFilter.filter_brand;
        const qFilt = Number(nextForm.water_filtration) || 0;
        const modelFlow = Number(selectedFilter.min_flow_rate) || 14;
        if (qFilt > 0 && modelFlow > 0) {
          const qty = Math.max(1, Math.ceil(qFilt / modelFlow));
          nextForm.no_of_water_filter = String(qty);
          nextForm.no_of_water_filter_pump = String(qty);
          nextForm.no_of_water_filter_pump_stand_by = String(Math.max(1, Math.ceil(qty / 3)));
        }

        // Auto-match circulation pump HP to filter recommended pump_hp
        if (selectedFilter.pump_hp && filterPumps.length > 0) {
          const targetHp = Number(selectedFilter.pump_hp);
          const circPumps = filterPumps.filter(p => 
            String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
            (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
          );
          const brandPumps = circPumps.filter(p => String(p.pump_brand) === String(selectedFilter.filter_brand) || String(p.brand_id) === String(selectedFilter.filter_brand));
          const listToSearch = brandPumps.length > 0 ? brandPumps : circPumps;
          const sorted = [...listToSearch].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
          const matchedPump = sorted.find(p => Number(p.filter_pump_hp) >= targetHp) || sorted[0];
          if (matchedPump) {
            nextForm.water_filter_pump_code = matchedPump.id;
            if (matchedPump.pump_brand) nextForm.pump_brand = matchedPump.pump_brand;
          }
        }
      }
    }

    // If selecting a filter brand, auto-pick optimal diameter & model (preserving diameter if already selected)
    if (field === 'water_filter_brand') {
      const brandFilters = mediaFilters.filter(f => String(f.filter_brand) === String(value) || String(f.brand_id) === String(value));
      const curVol = Number(nextForm.water_feature_volume_m3 || nextForm.water_feature_volume || nextForm.pool_volume_m3 || resolvedVolume || 0);
      const curHrs = Number(nextForm.hours_of_filtration || 6);
      const qFilt = Number(nextForm.water_filtration) || (curHrs > 0 && curVol > 0 ? Number((curVol / curHrs).toFixed(2)) : 0);
      if (qFilt > 0 && !nextForm.water_filtration) {
        nextForm.water_filtration = qFilt.toFixed(2);
      }
      const validFilters = brandFilters.filter(f => Number(f.min_flow_rate || 0) > 0);
      
      if (validFilters.length > 0) {
        let optimal = null;
        // If diameter already chosen by user, preserve it!
        if (nextForm.water_filter_diameter) {
          optimal = brandFilters.find(f => String(f.filter_dia) === String(nextForm.water_filter_diameter));
        }
        if (!optimal) {
          if (qFilt > 0) {
            const sufficient = validFilters.filter(f => Number(f.min_flow_rate) >= qFilt);
            if (sufficient.length > 0) {
              optimal = [...sufficient].sort((a, b) => Number(a.min_flow_rate) - Number(b.min_flow_rate))[0];
            } else {
              optimal = [...validFilters].sort((a, b) => Number(b.min_flow_rate) - Number(a.min_flow_rate))[0];
            }
          } else {
            optimal = validFilters.find(f => Number(f.filter_dia) === 1050 || Number(f.filter_dia) === 650) || validFilters[0];
          }
        }

        if (optimal) {
          nextForm.water_filter_code = optimal.id;
          if (optimal.filter_dia) nextForm.water_filter_diameter = String(optimal.filter_dia);
          const modelFlow = Number(optimal.min_flow_rate) || 14;
          if (qFilt > 0 && modelFlow > 0) {
            const qty = Math.max(1, Math.ceil(qFilt / modelFlow));
            nextForm.no_of_water_filter = String(qty);
            nextForm.no_of_water_filter_pump = String(qty);
            nextForm.no_of_water_filter_pump_stand_by = String(Math.max(1, Math.ceil(qty / 3)));
          }

          // Auto-match circulation pump
          if (optimal.pump_hp && filterPumps.length > 0) {
            const targetHp = Number(optimal.pump_hp);
            const circPumps = filterPumps.filter(p => 
              String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
              (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
            );
            const brandPumps = circPumps.filter(p => String(p.pump_brand) === String(optimal.filter_brand) || String(p.brand_id) === String(optimal.filter_brand));
            const listToSearch = brandPumps.length > 0 ? brandPumps : circPumps;
            const sortedPumps = [...listToSearch].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
            const matchedPump = sortedPumps.find(p => Number(p.filter_pump_hp) >= targetHp) || sortedPumps[0];
            if (matchedPump) {
              nextForm.water_filter_pump_code = matchedPump.id;
              if (matchedPump.pump_brand) nextForm.pump_brand = matchedPump.pump_brand;
            }
          }
        }
      }
    }

    // If selecting a vacuum filter model directly, recalculate vacuum filter quantity and suggest pump
    if (field === 'vacuum_filter_code') {
      const selectedVacFilter = mediaFilters.find(f => String(f.id) === String(value));
      if (selectedVacFilter) {
        if (selectedVacFilter.filter_dia) nextForm.vacuum_filter_diameter = String(selectedVacFilter.filter_dia);
        if (selectedVacFilter.filter_brand) nextForm.vacuum_filter_brand = selectedVacFilter.filter_brand;
        const currentVacQty = Number(nextForm.no_of_vacuum_filter) || 0;
        const vacQty = currentVacQty > 0 ? currentVacQty : 1;
        nextForm.no_of_vacuum_filter = String(vacQty);
        nextForm.no_of_vacuum_filter_pump = String(vacQty);
        nextForm.no_of_vacuum_filter_pump_stand_by = String(Math.max(1, Math.ceil(vacQty / 3)));
        
        // Auto-match vacuum booster pump
        if (!nextForm.vacuum_filter_pump_code && filterPumps.length > 0) {
          const targetHp = Number(selectedVacFilter.pump_hp) || 1.5;
          const matchedPump = filterPumps.find(p => Number(p.filter_pump_hp) >= targetHp) || filterPumps[0];
          if (matchedPump) {
            nextForm.vacuum_filter_pump_code = matchedPump.id;
            if (matchedPump.pump_brand) nextForm.vacuum_pump_brand = matchedPump.pump_brand;
          }
        }
      } else {
        nextForm.no_of_vacuum_filter = '0';
        nextForm.no_of_vacuum_filter_pump = '0';
        nextForm.no_of_vacuum_filter_pump_stand_by = '0';
        nextForm.vacuum_filter_pump_code = '';
        nextForm.vacuum_pump_brand = '';
      }
    }

    // If user changes circulation pump brand, auto-pick matching pump from that brand
    if (field === 'pump_brand') {
      if (!value) {
        nextForm.pump_brand = '';
        nextForm.water_filter_pump_code = '';
        nextForm.preferred_water_filter_pump = '';
      } else {
        const circPumps = filterPumps.filter(p => 
          String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
          (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
        );
        const brandPumps = circPumps.filter(p => String(p.pump_brand) === String(value) || String(p.brand_id) === String(value));
        if (brandPumps.length > 0) {
          const selectedFilter = mediaFilters.find(f => String(f.id) === String(nextForm.water_filter_code));
          const targetHp = Number(selectedFilter?.pump_hp) || 1.5;
          const sorted = [...brandPumps].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
          const matched = sorted.find(p => Number(p.filter_pump_hp || 0) >= targetHp) || sorted[0];
          if (matched) {
            nextForm.water_filter_pump_code = matched.id;
            nextForm.pump_brand = matched.pump_brand || value;
          }
        } else {
          nextForm.water_filter_pump_code = '';
        }
      }
    }

    // If user changes vacuum booster pump brand, auto-pick matching pump
    if (field === 'vacuum_pump_brand') {
      if (!value) {
        nextForm.vacuum_pump_brand = '';
        nextForm.vacuum_filter_pump_code = '';
      } else {
        const circPumps = filterPumps.filter(p => 
          String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
          (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
        );
        const brandPumps = circPumps.filter(p => String(p.pump_brand) === String(value) || String(p.brand_id) === String(value));
        if (brandPumps.length > 0) {
          const sorted = [...brandPumps].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
          nextForm.vacuum_filter_pump_code = sorted[0].id;
          nextForm.vacuum_pump_brand = sorted[0].pump_brand || value;
        } else {
          nextForm.vacuum_filter_pump_code = '';
        }
      }
    }

    // If user changes submersible drainage pump brand, auto-pick matching pump
    if (field === 'submersible_pump_brand') {
      if (!value) {
        nextForm.submersible_pump_brand = '';
        nextForm.submersible_pump_code = '';
      } else {
        const subPumps = filterPumps.filter(p => 
          String(p.item_category) === '6b8ed887-6fc1-4bc4-be82-9964255679a5' ||
          String(p.filter_pump_code || '').toUpperCase().startsWith('DW') ||
          String(p.filter_pump_code || '').toUpperCase().startsWith('MC')
        );
        const brandPumps = subPumps.filter(p => String(p.pump_brand) === String(value) || String(p.brand_id) === String(value));
        if (brandPumps.length > 0) {
          const sorted = [...brandPumps].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
          nextForm.submersible_pump_code = sorted[0].id;
          nextForm.submersible_pump_brand = sorted[0].pump_brand || value;
        } else {
          nextForm.submersible_pump_code = '';
          nextForm.submersible_pump_brand = value;
        }
      }
    }

    // If user changes heater model (direct selection or clear)
    if (field === 'heater_type' || field === 'recommended_heater_model') {
      if (!value) {
        nextForm.heater_type = '';
        nextForm.recommended_heater_model = '';
        nextForm.heater_brand = '';
        nextForm.heater_output_kw = '0';
        nextForm.no_of_heaters = '0';
        nextForm.heater_qty = '0';
        nextForm.installed_heating_capacity_kw = '0';
      } else {
        const selected = heaters.find(h => String(h.id) === String(value));
        if (selected) {
          nextForm.heater_type = selected.id;
          nextForm.recommended_heater_model = selected.id;
          nextForm.heater_brand = selected.brand_id || nextForm.heater_brand;
          nextForm.heater_output_kw = String(selected.output_kw);
          const reqKw = Number(nextForm.required_heating_power_kw) || 0;
          if (reqKw > 0 && selected.output_kw > 0) {
            nextForm.no_of_heaters = String(Math.max(1, Math.ceil(reqKw / Number(selected.output_kw))));
          } else {
            nextForm.no_of_heaters = '1';
          }
          nextForm.heater_qty = nextForm.no_of_heaters;
          nextForm.installed_heating_capacity_kw = String(Number((Number(nextForm.no_of_heaters) * Number(selected.output_kw)).toFixed(2)));
        }
      }
    }

    // If user changes heater brand, auto-pick best matching heater from that brand, or clear if removed
    if (field === 'heater_brand') {
      if (!value) {
        nextForm.heater_brand = '';
        nextForm.heater_type = '';
        nextForm.recommended_heater_model = '';
        nextForm.heater_output_kw = '0';
        nextForm.no_of_heaters = '0';
        nextForm.heater_qty = '0';
        nextForm.installed_heating_capacity_kw = '0';
      } else {
        nextForm.heater_brand = value;
        const brandHeaters = heaters.filter(h => String(h.brand_id) === String(value));
        const reqKw = Number(nextForm.required_heating_power_kw) || 0;
        if (brandHeaters.length > 0) {
          let optimal = null;
          if (reqKw >= 100) {
            const sorted = [...brandHeaters].sort((a, b) => Number(b.output_kw || 0) - Number(a.output_kw || 0));
            optimal = sorted[0];
          } else {
            const sorted = [...brandHeaters].sort((a, b) => Number(a.output_kw || 0) - Number(b.output_kw || 0));
            optimal = sorted.find(h => Number(h.output_kw || 0) >= reqKw) || sorted[sorted.length - 1];
          }
          if (optimal) {
            nextForm.heater_type = optimal.id;
            nextForm.recommended_heater_model = optimal.id;
            nextForm.heater_brand = optimal.brand_id || value;
            nextForm.heater_output_kw = String(optimal.output_kw);
            if (reqKw > 0 && optimal.output_kw > 0) {
              nextForm.no_of_heaters = String(Math.max(1, Math.ceil(reqKw / Number(optimal.output_kw))));
            } else {
              nextForm.no_of_heaters = '1';
            }
            nextForm.heater_qty = nextForm.no_of_heaters;
            nextForm.installed_heating_capacity_kw = String(Number((Number(nextForm.no_of_heaters) * Number(optimal.output_kw)).toFixed(2)));
          }
        } else {
          nextForm.heater_type = '';
          nextForm.recommended_heater_model = '';
          nextForm.no_of_heaters = '0';
          nextForm.heater_qty = '0';
          nextForm.installed_heating_capacity_kw = '0';
        }
      }
    }

    // Helper to auto-link niche, transformer & deck box when a lighting model is chosen
    const autoLinkLightingComponents = (lightObj, brandId, currentForm) => {
      const lightsCount = Number(currentForm.qty_lights) || 1;
      const bId = brandId || lightObj?.brand_id;
      
      // 1. Auto-select Niche Backbox
      const matchedNiche = (lightingList || []).find(l => {
        const itm = itemsMap[l.item_id];
        const name = (itm?.item_name || '').toLowerCase();


  return (name.includes('backbox') || name.includes('niche')) && (name.includes('concrete') || name.includes('07844') || name.includes('par56'));
      }) || (itemsList || []).find(i => {
        const name = (i.item_name || '').toLowerCase();
        return (name.includes('backbox') || name.includes('niche')) && 
               (name.includes('concrete') || name.includes('07844') || name.includes('par56')) &&
               i.activity_type !== 'Drawings';
      });
      if (matchedNiche) {
        currentForm.water_feature_lighting_backbox = matchedNiche.id;
      }

      // 2. Auto-select Transformer Brand & Model
      const matchedTransBrand = brandsList.find(b => String(b.id) === String(bId)) || brandsList.find(b => (b.brand_title || '').toLowerCase().includes('astral'));
      if (matchedTransBrand) {
        currentForm.transformer_brand = matchedTransBrand.id;
      }
      
      const totalWattage = lightsCount * 35; // Standard 35W per LED fixture
      const brandTrans = (transformersList || []).filter(t => !bId || String(t.brand_id) === String(bId));
      const transToSearch = brandTrans.length > 0 ? brandTrans : (transformersList || []);
      
      // Pick 400VA or 800VA transformer strictly from transformer_type table
      const optimalTrans = transToSearch.find(t => String(t.item_code || '').includes('400') || String(t.id || '').includes('400')) ||
                           transToSearch[0];
      
      if (optimalTrans) {
        currentForm.transformer_type = optimalTrans.id;
        const transVa = String(optimalTrans.item_code || '').includes('800') ? 800 : (String(optimalTrans.item_code || '').includes('130') ? 130 : 400);
        currentForm.transformer_qty = String(Math.max(1, Math.ceil(totalWattage / (transVa * 0.8))));
      } else {
        currentForm.transformer_qty = String(Math.max(1, Math.ceil(lightsCount / 10)));
      }

      // 3. Auto-select Deck IP68 Waterproof Junction Box
      const matchedDeckBox = (itemsList || []).find(i => {
        const name = (i.item_name || '').toLowerCase();
        return (name.includes('deck box') || name.includes('junction box')) && (name.includes('30825') || name.includes('astral'));
      }) || (junctionBoxesList || []).find(j => {
        const itm = itemsMap[j.item_id];
        const name = (itm?.item_name || '').toLowerCase();
        return name.includes('deck box') || name.includes('gw44204');
      });
      if (matchedDeckBox) {
        currentForm.junction_box_type = matchedDeckBox.id;
      }
      currentForm.junction_box_qty = String(lightsCount);
      if (!currentForm.electric_cable_length_per_one_lighting || currentForm.electric_cable_length_per_one_lighting === '0') {
        currentForm.electric_cable_length_per_one_lighting = '5';
      }
    };

    // If user changes lighting model directly
    if (field === 'underwater_light_type') {
      if (!value) {
        nextForm.underwater_light_type = '';
        nextForm.water_feature_lighting_code = '';
        nextForm.qty_lights = '0';
        nextForm.water_feature_lighting_backbox = '';
        nextForm.transformer_brand = '';
        nextForm.transformer_type = '';
        nextForm.transformer_qty = '0';
        nextForm.junction_box_type = '';
        nextForm.junction_box_qty = '0';
        nextForm.electric_cable_length_per_one_lighting = '0';
      } else {
        nextForm.underwater_light_type = value;
        nextForm.water_feature_lighting_code = value;
        const lightObj = lightingList.find(l => String(l.id) === String(value));
        if (lightObj) {
          nextForm.lighting_brand = lightObj.brand_id;
        }
        if (!nextForm.qty_lights || nextForm.qty_lights === '0') {
          const perim = Number(nextForm.water_feature_perimeter) || 150;
          nextForm.qty_lights = String(Math.max(1, Math.ceil(perim / 10)));
        }
        autoLinkLightingComponents(lightObj, lightObj?.brand_id || nextForm.lighting_brand, nextForm);
      }
    }

    // If user changes lighting brand, auto-pick best matching LED and components, or clear if removed
    if (field === 'lighting_brand') {
      if (!value) {
        nextForm.lighting_brand = '';
        nextForm.underwater_light_type = '';
        nextForm.water_feature_lighting_code = '';
        nextForm.qty_lights = '0';
        nextForm.water_feature_lighting_backbox = '';
        nextForm.transformer_brand = '';
        nextForm.transformer_type = '';
        nextForm.transformer_qty = '0';
        nextForm.junction_box_type = '';
        nextForm.junction_box_qty = '0';
        nextForm.electric_cable_length_per_one_lighting = '0';
      } else {
        nextForm.lighting_brand = value;
        const brandLights = lightingList.filter(l => String(l.brand_id) === String(value));
        const optimalLight = brandLights.find(l => String(l.item_code || '').includes('67510') || String(l.id || '').includes('67510')) ||
                             brandLights[0];
        if (optimalLight) {
          nextForm.underwater_light_type = optimalLight.id;
          nextForm.water_feature_lighting_code = optimalLight.id;
          if (!nextForm.qty_lights || nextForm.qty_lights === '0') {
            const perim = Number(nextForm.water_feature_perimeter) || 150;
            nextForm.qty_lights = String(Math.max(1, Math.ceil(perim / 10)));
          }
          autoLinkLightingComponents(optimalLight, value, nextForm);
        }
      }
    }

    // If user changes light fixtures quantity, update transformers and junction boxes
    if (field === 'qty_lights') {
      const q = Number(value) || 0;
      nextForm.qty_lights = String(q);
      nextForm.junction_box_qty = String(q);
      const totalWattage = q * 35;
      nextForm.transformer_qty = String(Math.max(q > 0 ? 1 : 0, Math.ceil(totalWattage / 320)));
    }

    // If user changes filtration method, adjust Skimfilter rules vs Sand Filter
    if (field === 'water_filtration_method') {
      const isSkim = String(value).toLowerCase().includes('skimfilter');
      const nFilt = Number(nextForm.no_of_water_filter) || 0;
      const expectedChamber = isSkim && nFilt >= 12 ? Math.floor(nFilt / 12) : 0;
      nextForm.drainage_chamber = String(expectedChamber);
      nextForm.no_of_submersible_pump = isSkim ? String(expectedChamber) : String(Math.max(Number(nextForm.no_pump_rooms || 1), 1));
      nextForm.submersible_pump_qty = nextForm.no_of_submersible_pump;
    }

    // If user changes number of filters manually, keep duty circulation pumps, drainage chambers & submersible pumps in sync
    if (field === 'no_of_water_filter') {
      const qty = Number(value) || 1;
      nextForm.no_of_water_filter_pump = String(qty);
      nextForm.no_of_water_filter_pump_stand_by = String(Math.max(1, Math.ceil(qty / 3)));
      
      const isSkim = String(nextForm.water_filtration_method || '').toLowerCase().includes('skimfilter');
      const expectedChamber = isSkim && qty >= 12 ? Math.floor(qty / 12) : 0;
      nextForm.drainage_chamber = String(expectedChamber);
      nextForm.no_of_submersible_pump = isSkim ? String(expectedChamber) : String(Math.max(Number(nextForm.no_pump_rooms || 1), 1));
      nextForm.submersible_pump_qty = nextForm.no_of_submersible_pump;
    }

    // If user changes drainage chambers manually, keep submersible pumps in sync
    if (field === 'drainage_chamber') {
      const chQty = Math.max(0, Number(value) || 0);
      nextForm.drainage_chamber = String(chQty);
      const isSkim = String(nextForm.water_filtration_method || '').toLowerCase().includes('skimfilter');
      if (isSkim) {
        nextForm.no_of_submersible_pump = String(chQty);
        nextForm.submersible_pump_qty = String(chQty);
      }
    }

    // If user changes number of vacuum filters manually, keep vacuum pumps in sync
    if (field === 'no_of_vacuum_filter') {
      const vacQty = Number(value) || 0;
      if (vacQty <= 0) {
        nextForm.no_of_vacuum_filter = '0';
        nextForm.no_of_vacuum_filter_pump = '0';
        nextForm.no_of_vacuum_filter_pump_stand_by = '0';
        nextForm.vacuum_filter_pump_code = '';
      } else {
        nextForm.no_of_vacuum_filter = String(vacQty);
        nextForm.no_of_vacuum_filter_pump = String(vacQty);
        nextForm.no_of_vacuum_filter_pump_stand_by = String(Math.max(1, Math.ceil(vacQty / 3)));
      }
    }

// Equipment field synchronization
    if (field === 'water_filter_code') {
      nextForm.water_filter_code = value || '';
      nextForm.preferred_water_filter = value || '';
      nextForm.water_filter = value || '';
      if (!value) {
        nextForm.water_filter_definition = '';
      }
    }

    if (field === 'water_filter_pump_code') {
      nextForm.water_filter_pump_code = value || '';
      nextForm.preferred_water_filter_pump = value || '';
      nextForm.water_filter_pump = value || '';
      if (!value) {
        nextForm.water_filter_pump_definition = '';
        nextForm.filtration_pump_disconnect_switches_types_one_quantity_no = '0';
      }
    }

    if (field === 'vacuum_filter_code') {
      nextForm.vacuum_filter_code = value || '';
      nextForm.preferred_vacuum_filter = value || '';
      nextForm.vacuum_filter = value || '';
    }

    if (field === 'vacuum_filter_pump_code') {
      nextForm.vacuum_filter_pump_code = value || '';
      nextForm.preferred_vacuum_filter_pump = value || '';
      nextForm.vacuum_filter_pump = value || '';
      nextForm.vacuum_pump_code = value || '';
    }

    if (field === 'submersible_pump_code') {
      nextForm.submersible_pump_code = value || '';
      nextForm.preferred_submersible_pump = value || '';
      nextForm.submersible_pump = value || '';
    }

    // =========================================================================
    // LIVE EARTHING & LIGHTNING PROTECTION EQUATION ENGINE (IEEE 80 / BS 7430)
    // =========================================================================
    const earthingFieldList = [
      'soil_sensitivity_type', 'soil_sensitivity_probable_value', 'required_earthing_system_resistant',
      'no_of_rods_for_one_component', 'one_rod_length', 'overall_length_of_one_rod_component',
      'cross_section_of_the_rod_inch', 'earthing_rod_resistance_rr', 'no_of_electrodes_to_reach_required_resistance',
      'lambda_factor', 'distance_between_adjacent_rods_m', 'alpha_coefficient',
      'total_resistance_of_earthing_rods_rn', 'earthing_cable_diameter_m', 'burial_depth_of_cable_m',
      'earthing_cable_resistance_rc', 'final_earthing_resistance_rt', 'total_earthing_cable_length_m'
    ];

    if (earthingFieldList.includes(field)) {
      // 1. Soil Type & Resistivity
      if (field === 'soil_sensitivity_type') {
        const soilMap = {
          'Marls (e.g. Keuper marl)': 20,
          'Alluvium, Loam, Clay': 30,
          'Clay, Sandy Clay': 50,
          'Sand and Gravel': 100,
          'Porous Limestone': 150,
          'Limestone / Sandstone': 300,
          'Granite / Basalt / Rock': 1000
        };
        if (soilMap[value]) {
          nextForm.soil_sensitivity_probable_value = soilMap[value];
        }
      }

      // 2. Rod Dimensions & Spacing
      if (field === 'no_of_rods_for_one_component' || field === 'one_rod_length') {
        const nR = Number(field === 'no_of_rods_for_one_component' ? value : nextForm.no_of_rods_for_one_component) || 2;
        const lR = Number(field === 'one_rod_length' ? value : nextForm.one_rod_length) || 1.5;
        const totL = Number((nR * lR).toFixed(2));
        nextForm.overall_length_of_one_rod_component = totL;
        nextForm.distance_between_adjacent_rods_m = Number((totL * 2).toFixed(2));
      }
      if (field === 'overall_length_of_one_rod_component') {
        const totL = Number(value) || 3;
        nextForm.distance_between_adjacent_rods_m = Number((totL * 2).toFixed(2));
      }

      // 3. Single Rod Resistance (Rr) - Dwight Formula
      // Rr = (rho / (2 * pi * L)) * (ln(8L / d) - 1)
      if (['soil_sensitivity_type', 'soil_sensitivity_probable_value', 'no_of_rods_for_one_component', 'one_rod_length', 'overall_length_of_one_rod_component', 'cross_section_of_the_rod_inch'].includes(field)) {
        const rho = Number(nextForm.soil_sensitivity_probable_value) || 20;
        const L = Number(nextForm.overall_length_of_one_rod_component) || 3;
        const d = Number(field === 'cross_section_of_the_rod_inch' ? value : nextForm.cross_section_of_the_rod_inch) || 0.0019;
        if (L > 0 && d > 0) {
          const logTerm = Math.log((8 * L) / d) - 1;
          const rr = (rho / (2 * Math.PI * L)) * Math.max(0.1, logTerm);
          nextForm.earthing_rod_resistance_rr = Number(rr.toFixed(2));
        }
      }

      // 4. Number of Electrodes (Ne)
      if (['soil_sensitivity_type', 'soil_sensitivity_probable_value', 'required_earthing_system_resistant', 'no_of_rods_for_one_component', 'one_rod_length', 'overall_length_of_one_rod_component', 'cross_section_of_the_rod_inch', 'earthing_rod_resistance_rr'].includes(field)) {
        const rr = Number(nextForm.earthing_rod_resistance_rr) || 8.96;
        const reqR = Number(field === 'required_earthing_system_resistant' ? value : nextForm.required_earthing_system_resistant) || 0.50;
        if (reqR > 0) {
          const ne = Math.max(1, Math.ceil(rr / reqR));
          nextForm.no_of_electrodes_to_reach_required_resistance = ne;
          nextForm.no_of_earthing_rods_qty = Math.max(2, ne);
          nextForm.no_of_earth_pits = Math.max(2, ne);
          nextForm.thermoweld_qty = Math.max(2, ne);
          const nRodsPerComp = Number(nextForm.no_of_rods_for_one_component) || 2;
          nextForm.rod_coupler_qty = Math.max(1, Math.ceil(nRodsPerComp * ne));
          nextForm.rebar_clamp_qty = Math.max(1, Math.ceil(nRodsPerComp * ne));
        }
      }

      // If user directly modifies no_of_electrodes_to_reach_required_resistance
      if (field === 'no_of_electrodes_to_reach_required_resistance') {
        const ne = Math.max(1, Number(value) || 1);
        nextForm.no_of_earthing_rods_qty = Math.max(2, ne);
        nextForm.no_of_earth_pits = Math.max(2, ne);
        nextForm.thermoweld_qty = Math.max(2, ne);
        const nRodsPerComp = Number(nextForm.no_of_rods_for_one_component) || 2;
        nextForm.rod_coupler_qty = Math.max(1, Math.ceil(nRodsPerComp * ne));
        nextForm.rebar_clamp_qty = Math.max(1, Math.ceil(nRodsPerComp * ne));
      }

      // 5. Alpha Coefficient (alpha = lambda / Ne)
      if (['lambda_factor', 'no_of_electrodes_to_reach_required_resistance', 'soil_sensitivity_type', 'soil_sensitivity_probable_value', 'required_earthing_system_resistant', 'no_of_rods_for_one_component', 'one_rod_length', 'overall_length_of_one_rod_component', 'earthing_rod_resistance_rr'].includes(field)) {
        const lambda = Number(field === 'lambda_factor' ? value : nextForm.lambda_factor) || 0.85;
        const ne = Number(nextForm.no_of_electrodes_to_reach_required_resistance) || 1;
        nextForm.alpha_coefficient = Number((lambda / Math.max(1, ne)).toFixed(2));
      }

      // 6. Total Rods Resistance (Rn = (Rr / Ne) * (1 + alpha))
      if (['soil_sensitivity_type', 'soil_sensitivity_probable_value', 'required_earthing_system_resistant', 'no_of_rods_for_one_component', 'one_rod_length', 'overall_length_of_one_rod_component', 'cross_section_of_the_rod_inch', 'earthing_rod_resistance_rr', 'no_of_electrodes_to_reach_required_resistance', 'lambda_factor', 'alpha_coefficient', 'distance_between_adjacent_rods_m'].includes(field)) {
        const rr = Number(nextForm.earthing_rod_resistance_rr) || 8.96;
        const ne = Number(nextForm.no_of_electrodes_to_reach_required_resistance) || 1;
        const alpha = Number(nextForm.alpha_coefficient) || 0.05;
        const rn = (rr / Math.max(1, ne)) * (1 + alpha);
        nextForm.total_resistance_of_earthing_rods_rn = Number(rn.toFixed(2));
      }

      // 7. Earthing Cable Resistance (Rc) - BS 7430 / Dwight formula for buried horizontal conductor
      // Rc = (rho / (2 * pi * Lc)) * ln((2 * Lc^2) / (h * dc))
      if (['soil_sensitivity_type', 'soil_sensitivity_probable_value', 'earthing_cable_diameter_m', 'burial_depth_of_cable_m', 'total_earthing_cable_length_m', 'no_of_rods_for_one_component', 'no_of_electrodes_to_reach_required_resistance'].includes(field)) {
        const rho = Number(nextForm.soil_sensitivity_probable_value) || 20;
        const dc = Number(field === 'earthing_cable_diameter_m' ? value : nextForm.earthing_cable_diameter_m) || 0.0067;
        const h = Number(field === 'burial_depth_of_cable_m' ? value : nextForm.burial_depth_of_cable_m) || 0.6;
        const Lc = Number(field === 'total_earthing_cable_length_m' ? value : nextForm.total_earthing_cable_length_m) || 50;
        if (Lc > 0 && h > 0 && dc > 0) {
          const logTerm = Math.log((2 * Math.pow(Lc, 2)) / (h * dc));
          const rc = (rho / (2 * Math.PI * Lc)) * Math.max(0.1, logTerm);
          nextForm.earthing_cable_resistance_rc = Number(rc.toFixed(2));
        }
      }

      // 8. Final Combined Resistance (Rt = (Rn * Rc) / (Rn + Rc))
      const rn = Number(nextForm.total_resistance_of_earthing_rods_rn) || 0.52;
      const rc = Number(nextForm.earthing_cable_resistance_rc) || 0.24;
      if (rn > 0 && rc > 0) {
        const rt = (rn * rc) / (rn + rc);
        nextForm.final_earthing_resistance_rt = Number(rt.toFixed(2));
      }
    }

        onChange(nextForm);
  };

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

  // Pool Type & Hydraulics Scope
  const rawType = String(formData.water_feature_type || '');
  const resolvedType = (STATIC_WF_TYPES_LOOKUP[rawType] || rawType).toLowerCase();
  const isOverflow = isWfOverflow(rawType) || isWfOverflow(resolvedType);
  const isSkimfilter = isWfSkimfilter(rawType, formData.water_filtration_method) || isWfSkimfilter(resolvedType);


  // =========================================================================
  // EQUIPMENT-SPECIFIC BRANDS LISTS (STRICTLY FROM CORRESPONDING DB TABLES)
  // =========================================================================
  
  // 1. Water Filter Brands (Strictly Filter manufacturers: Astral Pool, ACIS, Atecpool)
  const filterBrandOptions = useMemo(() => {
    const brandIds = new Set();
    mediaFilters.forEach(f => {
      if (f.filter_brand) brandIds.add(String(f.filter_brand));
      if (f.brand_id) brandIds.add(String(f.brand_id));
    });
    const opts = [{ id: '', label: '-- All Filter Brands --' }];
    Array.from(brandIds).forEach(bId => {
      const bObj = (brandsList || []).find(b => String(b.id) === String(bId));
      const label = bObj?.title || bObj?.name || brandsMap[bId] || `Brand ${bId}`;
      opts.push({ id: bId, label });
    });
    return opts;
  }, [mediaFilters, brandsList, brandsMap]);

  // 2. Circulation Pump Brands (Strictly Circulation Pump manufacturers: Astral Pool, Bombas PSH, Pedrollo, EBARA)
  const circPumpBrandOptions = useMemo(() => {
    const circPumps = filterPumps.filter(p => 
      String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
      (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
    );
    const brandIds = new Set();
    circPumps.forEach(p => {
      if (p.pump_brand) brandIds.add(String(p.pump_brand));
      if (p.brand_id) brandIds.add(String(p.brand_id));
    });
    const opts = [{ id: '', label: '-- All Circulation Pump Brands --' }];
    Array.from(brandIds).forEach(bId => {
      const bObj = (brandsList || []).find(b => String(b.id) === String(bId));
      const label = bObj?.title || bObj?.name || brandsMap[bId] || `Brand ${bId}`;
      opts.push({ id: bId, label });
    });
    return opts;
  }, [filterPumps, brandsList, brandsMap]);

  // 3. Submersible Drainage Pump Brands (Pedrollo, EBARA)
  const subPumpBrandOptions = useMemo(() => {
    return [
      { id: '', label: '-- All Submersible Pump Brands --' },
      { id: 'Pedrollo', label: 'Pedrollo' },
      { id: 'EBARA', label: 'EBARA' }
    ];
  }, []);

  // 3. Heater Brands (from heaters)
  const heaterBrandOptions = useMemo(() => {
    const brandIds = new Set(heaters.map(h => h.brand_id).filter(Boolean));
    const list = brandsList.filter(b => brandIds.has(b.id));
    return [
      { id: '', label: '-- All Heater Brands --' },
      ...list.map(b => ({ id: b.id, label: b.title || b.name || '' }))
    ];
  }, [heaters, brandsList]);

  // 4. Lighting Brands (from lighting_type)
  const lightingBrandOptions = useMemo(() => {
    const brandIds = new Set(lightingList.map(l => l.brand_id).filter(Boolean));
    const list = brandsList.filter(b => brandIds.has(b.id));
    return [
      { id: '', label: '-- All Lighting Brands --' },
      ...list.map(b => ({ id: b.id, label: b.title || b.name || '' }))
    ];
  }, [lightingList, brandsList]);

  // 5. Transformer Brands (from transformer_type)
  const transformerBrandOptions = useMemo(() => {
    const brandIds = new Set(transformersList.map(t => t.brand_id).filter(Boolean));
    const list = brandsList.filter(b => brandIds.has(b.id));
    return [
      { id: '', label: '-- All Transformer Brands --' },
      ...list.map(b => ({ id: b.id, label: b.title || b.name || '' }))
    ];
  }, [transformersList, brandsList]);

  // ==========================================
  // CASCADING DROPDOWNS & FILTERED OPTIONS
  // ==========================================
  
  // Water Filter Diameters & Models Cascading
  const availableFilterDiameters = useMemo(() => {
    const brand = formData.water_filter_brand;
    let list = mediaFilters;
    if (brand) {
      list = list.filter(f => String(f.filter_brand) === String(brand) || String(f.brand_id) === String(brand));
    }
    const dias = [...new Set(list.map(f => f.filter_dia).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
    return dias.map(d => ({ id: String(d), label: `Ø${d} mm` }));
  }, [mediaFilters, formData.water_filter_brand]);

  const filteredMediaFilters = useMemo(() => {
    const brand = formData.water_filter_brand;
    const dia = formData.water_filter_diameter;
    let list = mediaFilters;
    if (brand) {
      list = list.filter(f => String(f.filter_brand) === String(brand) || String(f.brand_id) === String(brand));
    }
    if (dia) {
      list = list.filter(f => String(f.filter_dia) === String(dia));
    }
    return list.map(f => {
      const item = itemsMap[f.item_id];
      if (item?.item_name) {
        return { id: f.id, label: item.item_name, item_id: f.item_id, spec: f };
      }
      const bTitle = brandsMap[f.filter_brand] || brandsMap[f.brand_id] || '';
      const diaStr = f.filter_dia ? `Ø${f.filter_dia}mm` : '';
      const flow = f.min_flow_rate ? `${f.min_flow_rate} m³/h` : '';
      const code = f.filter_code ? `Code: ${f.filter_code}` : '';
      const label = [bTitle, 'Sand Filter', diaStr, flow, code].filter(Boolean).join(' • ') || `Filter ${f.filter_code}`;
      return { id: f.id, label, item_id: f.item_id, spec: f };
    });
  }, [mediaFilters, formData.water_filter_brand, formData.water_filter_diameter, brandsMap, itemsMap]);

  // Selected Filter Spec for Equation derivation
  const selectedMediaFilterSpec = useMemo(() => {
    return mediaFilters.find(f => String(f.id) === String(formData.water_filter_code || formData.preferred_water_filter)) || null;
  }, [mediaFilters, formData.water_filter_code, formData.preferred_water_filter]);

  // Vacuum Filter Diameters & Models Cascading
  const availableVacFilterDiameters = useMemo(() => {
    const brand = formData.vacuum_filter_brand;
    let list = mediaFilters;
    if (brand) {
      list = list.filter(f => String(f.filter_brand) === String(brand) || String(f.brand_id) === String(brand));
    }
    const dias = [...new Set(list.map(f => f.filter_dia).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
    return dias.map(d => ({ id: String(d), label: `Ø${d} mm` }));
  }, [mediaFilters, formData.vacuum_filter_brand]);

  const filteredVacMediaFilters = useMemo(() => {
    const brand = formData.vacuum_filter_brand;
    const dia = formData.vacuum_filter_diameter;
    let list = mediaFilters;
    if (brand) {
      list = list.filter(f => String(f.filter_brand) === String(brand) || String(f.brand_id) === String(brand));
    }
    if (dia) {
      list = list.filter(f => String(f.filter_dia) === String(dia));
    }
    return list.map(f => {
      const item = itemsMap[f.item_id];
      if (item?.item_name) {
        return { id: f.id, label: item.item_name, item_id: f.item_id, spec: f };
      }
      const bTitle = brandsMap[f.filter_brand] || brandsMap[f.brand_id] || '';
      const diaStr = f.filter_dia ? `Ø${f.filter_dia}mm` : '';
      const flow = f.min_flow_rate ? `${f.min_flow_rate} m³/h` : '';
      const code = f.filter_code ? `Code: ${f.filter_code}` : '';
      const label = [bTitle, 'Sand Filter', diaStr, flow, code].filter(Boolean).join(' • ') || `Filter ${f.filter_code}`;
      return { id: f.id, label, item_id: f.item_id, spec: f };
    });
  }, [mediaFilters, formData.vacuum_filter_brand, formData.vacuum_filter_diameter, brandsMap, itemsMap]);

  // Pumps Cascading strictly by pump brand (filtered from filter_pump_types)
  const filteredCircPumps = useMemo(() => {
    const brand = formData.pump_brand || formData.water_filter_pump_brand;
    // Only circulation pumps (item_category Circulation Pumps or non-submersible/dosing)
    let list = filterPumps.filter(p => 
      String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
      (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
    );
    if (brand) {
      list = list.filter(p => String(p.pump_brand) === String(brand) || String(p.brand_id) === String(brand));
    }
    // Sort by HP ascending
    list = [...list].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
    return list.map(p => {
      const item = itemsMap[p.item_id];
      if (item?.item_name) {
        return { id: p.id, label: item.item_name, item_id: p.item_id, spec: p };
      }
      const bTitle = brandsMap[p.pump_brand] || brandsMap[p.brand_id] || '';
      const hp = p.filter_pump_hp ? `${p.filter_pump_hp} HP` : '';
      const kw = p.p_kw ? `(${p.p_kw} kW)` : '';
      const volt = p.operating_voltage ? `${p.operating_voltage}V` : '';
      const code = p.filter_pump_code ? `Code: ${p.filter_pump_code}` : '';
      const label = [bTitle, hp, kw, volt, code].filter(Boolean).join(' • ');
      return { id: p.id, label, item_id: p.item_id, spec: p };
    });
  }, [filterPumps, formData.pump_brand, formData.water_filter_pump_brand, brandsMap, itemsMap]);

  const filteredVacPumps = useMemo(() => {
    const brand = formData.vacuum_pump_brand;
    let list = filterPumps.filter(p => 
      String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
      (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
    );
    if (brand) {
      list = list.filter(p => String(p.pump_brand) === String(brand) || String(p.brand_id) === String(brand));
    }
    list = [...list].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
    return list.map(p => {
      const item = itemsMap[p.item_id];
      if (item?.item_name) {
        return { id: p.id, label: item.item_name, item_id: p.item_id, spec: p };
      }
      const bTitle = brandsMap[p.pump_brand] || brandsMap[p.brand_id] || '';
      const hp = p.filter_pump_hp ? `${p.filter_pump_hp} HP` : '';
      const kw = p.p_kw ? `(${p.p_kw} kW)` : '';
      const volt = p.operating_voltage ? `${p.operating_voltage}V` : '';
      const code = p.filter_pump_code ? `Code: ${p.filter_pump_code}` : '';
      const label = [bTitle, 'Booster Pump', hp, kw, volt, code].filter(Boolean).join(' • ');
      return { id: p.id, label, item_id: p.item_id, spec: p };
    });
  }, [filterPumps, formData.vacuum_pump_brand, brandsMap, itemsMap]);

  const filteredSubPumps = useMemo(() => {
    const brand = formData.submersible_pump_brand;
    let list = filterPumps.filter(p => 
      String(p.item_category) === '6b8ed887-6fc1-4bc4-be82-9964255679a5' ||
      String(p.filter_pump_code || '').toUpperCase().startsWith('DW') ||
      String(p.filter_pump_code || '').toUpperCase().startsWith('MC') ||
      String(p.filter_pump_code || '').toUpperCase().startsWith('TOP')
    );
    if (brand) {
      list = list.filter(p => {
        const pb = String(p.pump_brand || p.brand_id || '').toLowerCase();
        const b = String(brand).toLowerCase();
        return pb === b || pb.includes(b) || (b.includes('pedrollo') && pb.includes('fe7c3a44')) || (b.includes('ebara') && pb.includes('2d99b439')) || (b.includes('fe7c3a44') && pb.includes('fe7c3a44')) || (b.includes('2d99b439') && pb.includes('2d99b439'));
      });
    }
    list = [...list].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
    return list.map(p => {
      const item = itemsMap[p.item_id];
      if (item?.item_name) {
        return { id: p.id, label: item.item_name, item_id: p.item_id, spec: p };
      }
      const bTitle = brandsMap[p.pump_brand] || brandsMap[p.brand_id] || (String(p.pump_brand).includes('fe7c3a44') ? 'Pedrollo' : (String(p.pump_brand).includes('2d99b439') ? 'EBARA' : ''));
      const hp = p.filter_pump_hp ? `${p.filter_pump_hp} HP` : '';
      const kw = p.p_kw ? `(${p.p_kw} kW)` : '';
      const volt = p.operating_voltage ? `${p.operating_voltage}V` : '';
      const code = p.filter_pump_code ? `Code: ${p.filter_pump_code}` : '';
      const label = [bTitle, 'Submersible Pit Pump', hp, kw, volt, code].filter(Boolean).join(' • ');
      return { id: p.id, label, item_id: p.item_id, spec: p };
    });
  }, [filterPumps, formData.submersible_pump_brand, brandsMap, itemsMap]);

  // Selected Pump Specs for Electrical Connection Cards
  const selectedCircPump = useMemo(() => {
    return filterPumps.find(p => String(p.id) === String(formData.water_filter_pump_code || formData.preferred_water_filter_pump || formData.water_filter_pump)) || null;
  }, [filterPumps, formData.water_filter_pump_code, formData.preferred_water_filter_pump, formData.water_filter_pump]);

  const selectedVacPump = useMemo(() => {
    return filterPumps.find(p => String(p.id) === String(formData.vacuum_filter_pump_code)) || null;
  }, [filterPumps, formData.vacuum_filter_pump_code]);

  const selectedSubPump = useMemo(() => {
    return filterPumps.find(p => String(p.id) === String(formData.submersible_pump_code)) || null;
  }, [filterPumps, formData.submersible_pump_code]);

  // Helper to evaluate Rotary Isolator Switch per pump power & phase
  const getRecommendedSwitch = (pump) => {
    if (!pump) return { code: 'GW70432P', desc: '3P 16A Rotary Isolator' };
    const pKw = Number(pump.p_kw) || 2.2;
    const isSingle = String(pump.operating_voltage || '').includes('220') || String(pump.operating_voltage || '').includes('230') || pKw < 2.0;
    
    if (isSingle) {
      if (pKw <= 0.80) return { code: 'GW70431P', desc: '2P 16A Surface Rotary Isolator' };
      if (pKw <= 1.55) return { code: 'GW70480P', desc: '2P 25A Surface Rotary Isolator' };
      return { code: 'GW70434P', desc: '2P 32A Surface Rotary Isolator' };
    } else {
      if (pKw <= 4.0) return { code: 'GW70432P', desc: '3P 16A Surface Rotary Isolator' };
      if (pKw <= 11.0) return { code: 'GW70435P', desc: '3P 32A Surface Rotary Isolator' };
      if (pKw <= 22.0) return { code: 'CW70451M', desc: '3P 63A Metal Rotary Isolator' };
      if (pKw <= 30.0) return { code: 'CW70454M', desc: '3P 80A Metal Rotary Isolator' };
      return { code: 'CW70457M', desc: '3P 100A Metal Rotary Isolator' };
    }
  };

  // Disconnect Switches & Rotary Isolators
  const disconnectSwitchOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('rot.ctrl.switch') || name.includes('isolator') || (name.includes('disconnect') && name.includes('switch'))) &&
             !name.includes('gw20571') && !name.includes('gw27062') && !name.includes('gw20265') &&
             i.activity_type !== 'Drawings';
    });
    const fromList = (disconnectSwitchesList || []).filter(s => {
      const code = String(s.code || '').toUpperCase();
      return code !== 'GW20571' && code !== 'GW27062' && code !== 'GW20265';
    }).map(s => {
      const item = itemsMap[s.item_id];
      const itemId = s.item_id || s.id;
      return { id: itemId, label: item?.item_name || `Rotary Switch ${s.code || s.id}`, item_id: itemId };
    });
    const map = new Map();
    [...fromList, ...matched.map(i => ({ id: i.id, label: i.item_name, item_id: i.id }))].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [disconnectSwitchesList, itemsList, itemsMap]);

  const populateCableAccessories = (cableId, prefix, targetObj, overrideMat = null) => {
    if (!cableId || !targetObj) return;
    const cableRow = (cablesList || []).find(c => String(c.item_id) === String(cableId) || String(c.id) === String(cableId));
    if (!cableRow) return;

    if (cableRow.cable_glands_id && !targetObj[`${prefix}_electric_cable_type_01_gland_id`]) {
      targetObj[`${prefix}_electric_cable_type_01_gland_id`] = cableRow.cable_glands_id;
      if (prefix === 'water_filter_pump') {
        targetObj.filtration_pump_electric_cable_type_01_gland_id = cableRow.cable_glands_id;
      }
    }

    const mat = String(overrideMat || targetObj[`${prefix}_cable_type_01_conduit_type`] || formData[`${prefix}_cable_type_01_conduit_type`] || 'Liquid Tight').toLowerCase();
    let condId = '';
    let adapId = '';
    let coupId = '';
    let strapId = '';

    if (mat.includes('liquid')) {
      condId = cableRow.liquid_tight_conduit_id || '';
      adapId = cableRow.liquid_tight_conduit_adapter_id || '';
    } else if (mat.includes('emt')) {
      condId = cableRow.emt_conduit_id || '';
      adapId = cableRow.emt_conduit_adapter_id || '';
      coupId = cableRow.emt_conduit_coupler_id || '';
      strapId = cableRow.emt_conduit_straps_id || '';
    } else if (mat.includes('imc')) {
      condId = cableRow.imc_conduit_id || '';
      adapId = cableRow.imc_conduit_adapter_id || '';
      coupId = cableRow.imc_conduit_coupler_id || '';
      strapId = cableRow.imc_conduit_straps_id || '';
    } else if (mat.includes('rgs')) {
      condId = cableRow.rgs_conduit_id || '';
      adapId = cableRow.rgs_conduit_adapter_id || '';
      coupId = cableRow.rgs_conduit_coupler_id || '';
      strapId = cableRow.rgs_conduit_straps_id || '';
    } else if (mat.includes('upvc') || mat.includes('pvc')) {
      condId = cableRow.upvc_conduits_id || '';
      adapId = cableRow.upvc_conduits_adapter_id || '';
      coupId = cableRow.upvc_conduits_coupler_id || '';
    }

    if (condId) {
      targetObj[`${prefix}_cable_conduit_liquid_tight_type_01_id`] = condId;
      targetObj[`${prefix}_recommended_conduit_for_type_01`] = condId;
      if (prefix === 'water_filter_pump') {
        targetObj.filtration_pump_cable_conduit_liquid_tight_type_01_id = condId;
        targetObj.filtration_pump_recommended_conduit_for_type_01 = condId;
      }
    }
    if (adapId) {
      targetObj[`${prefix}_recommended_conduit_adapter_for_type_01`] = adapId;
      if (prefix === 'water_filter_pump') {
        targetObj.filtration_pump_recommended_conduit_adapter_for_type_01 = adapId;
      }
    }
    if (coupId) {
      targetObj[`${prefix}_recommended_conduit_coupler_for_type_01`] = coupId;
      if (prefix === 'water_filter_pump') {
        targetObj.filtration_pump_recommended_conduit_coupler_for_type_01 = coupId;
      }
    }
    if (strapId) {
      targetObj[`${prefix}_recommended_conduit_straps_for_type_01`] = strapId;
      if (prefix === 'water_filter_pump') {
        targetObj.filtration_pump_recommended_conduit_straps_for_type_01 = strapId;
      }
    }
  };

  const populatePumpElectricals = (pump, prefix, targetObj) => {
    if (!pump || !targetObj) return;
    const altPrefix = prefix === 'water_filter_pump' ? 'filtration_pump' : prefix;

    if (pump.filter_pump_hp) targetObj[`${prefix}_hp`] = String(pump.filter_pump_hp);
    if (pump.p_kw) {
      targetObj[`${prefix}_p_kw`] = String(pump.p_kw);
      targetObj[`${altPrefix}_p_kw`] = String(pump.p_kw);
    }
    if (pump.operating_voltage) {
      targetObj[`${prefix}_operating_voltage`] = String(pump.operating_voltage);
      targetObj[`${altPrefix}_operating_voltage`] = String(pump.operating_voltage);
    }

    const cable1 = pump.elec_cable_1_id || pump.electric_cable_type_01_id;
    const gland1 = pump.elec_cable_1_gland || pump.electric_cable_type_01_gland_id;
    const cable2 = pump.elec_cable_2_id || pump.electric_cable_type_02_id;
    const gland2 = pump.elec_cable_2_gland || pump.electric_cable_type_02_gland_id;
    const ds1 = pump.disconnect_switch_1 || pump.disconnect_switches_types_one_id;
    const ds2 = pump.disconnect_switch_2 || pump.disconnect_switches_types_two_id;
    const branchTray = pump.branch_tray_id || pump.branch_cable_tray_type_id;
    const splicePlate = pump.splice_plate_id || pump.splice_plate_type_id;
    const elbow90 = pump.elbow_90_id || pump.cable_tray_elbow_90_id;
    const cChannel = pump.c_channel_id || pump.c_channel_type_id;
    const endCap = pump.end_cap_id || pump.end_cap_type_id;
    const anchors = pump.anchors_id || pump.anchors_type_id;
    const offsetTee = pump.offset_tee_id || pump.offset_tee_type_id;

    if (cable1) {
      targetObj[`${prefix}_electric_cable_type_01_id`] = cable1;
      targetObj[`${altPrefix}_electric_cable_type_01_id`] = cable1;
    }
    if (gland1) {
      targetObj[`${prefix}_electric_cable_type_01_gland_id`] = gland1;
      targetObj[`${altPrefix}_electric_cable_type_01_gland_id`] = gland1;
    }
    if (cable2) {
      targetObj[`${prefix}_electric_cable_type_02_id`] = cable2;
      targetObj[`${altPrefix}_electric_cable_type_02_id`] = cable2;
    }
    if (gland2) {
      targetObj[`${prefix}_electric_cable_type_02_gland_id`] = gland2;
      targetObj[`${altPrefix}_electric_cable_type_02_gland_id`] = gland2;
    }
    if (branchTray) {
      targetObj[`${prefix}_branch_cable_tray_type_id`] = branchTray;
      targetObj[`${altPrefix}_branch_cable_tray_type_id`] = branchTray;
    }
    if (splicePlate) {
      targetObj[`${prefix}_splice_plate_type_id`] = splicePlate;
      targetObj[`${altPrefix}_splice_plate_type_id`] = splicePlate;
    }
    if (elbow90) {
      targetObj[`${prefix}_cable_tray_elbow_90_id`] = elbow90;
      targetObj[`${altPrefix}_cable_tray_elbow_90_id`] = elbow90;
    }
    if (cChannel) {
      targetObj[`${prefix}_c_channel_type_id`] = cChannel;
      targetObj[`${altPrefix}_c_channel_type_id`] = cChannel;
    }
    if (endCap) {
      targetObj[`${prefix}_end_cap_type_id`] = endCap;
      targetObj[`${altPrefix}_end_cap_type_id`] = endCap;
    }
    if (anchors) {
      targetObj[`${prefix}_anchors_type_id`] = anchors;
      targetObj[`${altPrefix}_anchors_type_id`] = anchors;
    }
    if (offsetTee) {
      targetObj[`${prefix}_offset_tee_type_id`] = offsetTee;
      targetObj[`${altPrefix}_offset_tee_type_id`] = offsetTee;
    }

    if (ds1) {
      targetObj[`${prefix}_disconnect_switches_types_one_id`] = ds1;
      targetObj[`${altPrefix}_disconnect_switches_types_one_id`] = ds1;
    } else {
      const recSwitch = getRecommendedSwitch(pump);
      const matchedSw = disconnectSwitchOptions.find(s => s.label?.includes(recSwitch.code));
      if (matchedSw) {
        targetObj[`${prefix}_disconnect_switches_types_one_id`] = matchedSw.id;
        targetObj[`${altPrefix}_disconnect_switches_types_one_id`] = matchedSw.id;
      }
    }
    if (ds2) {
      targetObj[`${prefix}_disconnect_switches_types_two_id`] = ds2;
      targetObj[`${altPrefix}_disconnect_switches_types_two_id`] = ds2;
    }

    if (cable1) {
      populateCableAccessories(cable1, prefix, targetObj);
    }
  };

  // Auto-sync pump electrical fields when pump objects load or have stale fallback IDs
  useEffect(() => {
    if (!onChange || typeof onChange !== 'function') return;
    const patch = {};
    let hasChanges = false;

    const checkAndSync = (pump, prefix, staleCable, staleDs) => {
      if (!pump) return;
      const dbCable = pump.elec_cable_1_id || pump.electric_cable_type_01_id;
      const dbDs = pump.disconnect_switch_1 || pump.disconnect_switches_types_one_id;
      const curCable = formData[`${prefix}_electric_cable_type_01_id`];
      const curDs = formData[`${prefix}_disconnect_switches_types_one_id`];

      const cableNeedsSync = dbCable && (!curCable || (curCable === staleCable && dbCable !== staleCable));
      const dsNeedsSync = (dbDs && (!curDs || (curDs === staleDs && dbDs !== staleDs))) || (!curDs && !dbDs);

      if (cableNeedsSync || dsNeedsSync) {
        const temp = { ...formData, ...patch };
        populatePumpElectricals(pump, prefix, temp);
        Object.keys(temp).forEach(k => {
          if (temp[k] !== formData[k]) {
            patch[k] = temp[k];
            hasChanges = true;
          }
        });
      }
    };

    checkAndSync(selectedCircPump, 'water_filter_pump', '3378ce89-417d-4bd3-adc7-9ba9413553ae', 'fa7cbaaa-3b15-43f2-9cd0-76267473e749');
    checkAndSync(selectedVacPump, 'vacuum_pump', '475decb5-e92b-4d55-b455-603ecec25095', 'cb9e357d-c7c2-4803-b8ff-a5a17d8a13d9');
    checkAndSync(selectedSubPump, 'submersible_pump', '3378ce89-417d-4bd3-adc7-9ba9413553ae', '222ec164-1dae-4cef-a984-fb449450442f');

    if (hasChanges) {
      onChange({ ...formData, ...patch });
    }
  }, [
    selectedCircPump?.id,
    selectedVacPump?.id,
    selectedSubPump?.id,
    cablesList?.length,
    disconnectSwitchOptions?.length
  ]);

  // Heaters Cascading by Brand
  const filteredHeaters = useMemo(() => {
    const brand = formData.heater_brand;
    let list = heaters;
    if (brand) {
      list = list.filter(h => String(h.brand_id) === String(brand));
    }
    return list.map(h => {
      const item = itemsMap[h.item_id];
      if (item?.item_name) {
        return { id: h.id, label: item.item_name, item_id: h.item_id, output_kw: h.output_kw };
      }
      const bTitle = brandsMap[h.brand_id] || '';
      const kw = h.output_kw ? `${h.output_kw} kW` : '';
      const label = [bTitle, 'Pool Heater', kw].filter(Boolean).join(' • ') || 'Pool Heater';
      return { id: h.id, label, item_id: h.item_id, output_kw: h.output_kw };
    });
  }, [heaters, formData.heater_brand, brandsMap, itemsMap]);

  const selectedHeaterObj = useMemo(() => {
    return heaters.find(h => String(h.id) === String(formData.heater_type || formData.recommended_heater_model));
  }, [heaters, formData.heater_type, formData.recommended_heater_model]);

  // Direct Underwater LED Luminaires Catalog (with Brand included in label)
  const filteredLighting = useMemo(() => {
    const list = (lightingList || []).filter(l => {
      const itm = itemsMap[l.item_id];
      const name = (itm?.item_name || '').toLowerCase();
      // Exclude concrete/liner backbox niches from the luminaire fixture selector
      return !name.includes('backbox') && !name.includes('niche');
    });
    return list.map(l => {
      const item = itemsMap[l.item_id];
      const brand = brandsMap[l.brand_id]?.brand_name || brandsMap[l.brand_id]?.name || '';
      const baseName = item?.item_name || `LED Underwater Luminaire ${l.item_code || l.id}`;
      const label = brand && !baseName.toLowerCase().includes(brand.toLowerCase()) ? `${brand} • ${baseName}` : baseName;
      return { 
        id: l.id, 
        label, 
        item_id: l.item_id 
      };
    });
  }, [lightingList, brandsMap, itemsMap]);

  // Embedded Concrete / Liner Niche Backbox Options (from lighting_type and items)
  const nicheOptions = useMemo(() => {
    const fromLightingType = (lightingList || []).filter(l => {
      const itm = itemsMap[l.item_id];
      const name = (itm?.item_name || '').toLowerCase();
      return name.includes('backbox') || name.includes('niche');
    }).map(l => {
      const item = itemsMap[l.item_id];
      return { id: l.id, label: item?.item_name || `Niche Backbox ${l.item_code || l.id}`, item_id: l.item_id };
    });

    const fromItems = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('niche') || name.includes('backbox')) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const map = new Map();
    [...fromLightingType, ...fromItems].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [lightingList, itemsList, itemsMap]);

  // Safety Step-Down Transformers (Exact database item name as it is)
  const filteredTransformers = useMemo(() => {
    return (transformersList || []).map(t => {
      const item = itemsMap[t.item_id];
      return { 
        id: t.id, 
        label: item?.item_name || `Safety Transformer ${t.item_code || t.id}`, 
        item_id: t.item_id 
      };
    });
  }, [transformersList, itemsMap]);

  // Deck IP68 Waterproof Junction Boxes (from items and junction_box)
  const junctionBoxOptions = useMemo(() => {
    const deckBoxes = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('deck box') || (name.includes('upvc junct.box') && name.includes('gw44204'))) && 
             i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const fromJbTable = (junctionBoxesList || []).filter(j => {
      const itm = itemsMap[j.item_id];
      const name = (itm?.item_name || '').toLowerCase();
      return name.includes('deck box') || name.includes('gw44204');
    }).map(j => {
      const item = itemsMap[j.item_id];
      return { id: j.id, label: item?.item_name || `Junction Box ${j.code || j.id}`, item_id: j.item_id };
    });

    const map = new Map();
    [...deckBoxes, ...fromJbTable].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [junctionBoxesList, itemsList, itemsMap]);

  // Cable Types Options (from cable_types catalog and items table)
  const cableOptions = useMemo(() => {
    const opts = [];
    const seenIds = new Set();

    // 1. Primary: Load all cable items directly from itemsList (which matches pump Electric Cable Type 01 IDs)
    (itemsList || []).forEach(i => {
      const name = (i.item_name || '').toLowerCase();
      if ((name.includes('mm²') || name.includes('mm2') || name.includes('h07rn-f') || name.includes('cu/xlpe') || name.includes('cu/pvc') || name.includes('cable')) &&
          !name.includes('bare copper') && !name.includes('gland') && !name.includes('tray') && !name.includes('conduit') && i.activity_type !== 'Drawings') {
        opts.push({
          id: i.id,
          label: i.item_name,
          item_id: i.id
        });
        seenIds.add(i.id);
      }
    });

    // 2. Also support cablesList table IDs
    (cablesList || []).forEach(c => {
      if (c.id && !seenIds.has(c.id)) {
        const item = itemsMap[c.item_id] || (itemsList || []).find(i => i.id === c.item_id);
        opts.push({
          id: c.id,
          label: item?.item_name || `${c.size_mm2 || ''} ${c.insulation || ''} ${c.type || ''}`.trim() || `Cable ${c.id}`,
          item_id: c.item_id || c.id
        });
        seenIds.add(c.id);
      }
      if (c.item_id && !seenIds.has(c.item_id)) {
        const item = itemsMap[c.item_id] || (itemsList || []).find(i => i.id === c.item_id);
        if (item) {
          opts.push({
            id: c.item_id,
            label: item.item_name,
            item_id: c.item_id
          });
          seenIds.add(c.item_id);
        }
      }
    });

    return opts;
  }, [cablesList, itemsList, itemsMap]);

// Gland Options
  const glandOptions = useMemo(() => {
    return (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('cable gland') || name.includes('gland size') || name.startsWith('ha2-')) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));
  }, [itemsList]);


  // Helper to filter conduits and accessories strictly from database tables
  // Accurately indexes conduit accessories directly from itemsList
  const getConduitAccessoriesForMaterial = (material) => {
    const mat = (material || 'Liquid Tight').toLowerCase().replace('-', ' ').replace('_', ' ');

    const conduits = (itemsList || []).filter(i => {
      const cat = (i.item_category || '').toLowerCase();
      const name = (i.item_name || '').toLowerCase();
      if (name.includes('adapter') || name.includes('adaptor') || name.includes('coupler') || name.includes('strap') || name.includes('tee') || name.includes('elbow') || name.includes('channel')) return false;
      if (mat.includes('liquid')) return (cat.includes('liquid tight') || name.includes('liquid tight')) && name.includes('liquid tight size:');
      if (mat.includes('emt')) return (cat.includes('emt') || name.includes('emt')) && name.includes('emt size:');
      if (mat.includes('imc')) return (cat.includes('imc') || name.includes('imc')) && name.includes('imc size:');
      if (mat.includes('rgs')) return (cat.includes('rgs') || name.includes('rgs')) && name.includes('rgs size:');
      if (mat.includes('upvc')) return (cat.includes('upvc') || name.includes('upvc')) && (name.includes('conduit') || name.includes('heavy gauge') || name.includes('pipe'));
      return false;
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const adapters = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      if (!name.includes('adapter') && !name.includes('adaptor')) return false;
      if (mat.includes('liquid')) return name.includes('liquid');
      if (mat.includes('emt')) return name.includes('emt');
      if (mat.includes('imc')) return name.includes('imc');
      if (mat.includes('rgs')) return name.includes('rgs');
      if (mat.includes('upvc')) return name.includes('upvc');
      return false;
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const couplers = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      if (!name.includes('coupler')) return false;
      if (mat.includes('liquid')) return false; // Liquid tight has NO couplers
      if (mat.includes('emt')) return name.includes('emt');
      if (mat.includes('imc')) return name.includes('imc');
      if (mat.includes('rgs')) return name.includes('rgs');
      if (mat.includes('upvc')) return name.includes('upvc');
      return false;
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const straps = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      if (!name.includes('strap')) return false;
      if (mat.includes('liquid')) return false; // Liquid tight has NO straps
      if (mat.includes('emt')) return name.includes('emt');
      if (mat.includes('imc')) return name.includes('imc');
      if (mat.includes('rgs')) return name.includes('rgs');
      return false;
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    return { conduits, adapters, couplers, straps };
  };

  const circConduitMat = formData.water_filter_pump_cable_type_01_conduit_type || 'Liquid Tight';
  const circConduitAccs = useMemo(() => {
    return getConduitAccessoriesForMaterial(circConduitMat);
  }, [circConduitMat, conduitsList, itemsList, itemsMap]);

  const vacConduitMat = formData.vacuum_pump_cable_type_01_conduit_type || 'Liquid Tight';
  const vacConduitAccs = useMemo(() => {
    return getConduitAccessoriesForMaterial(vacConduitMat);
  }, [vacConduitMat, conduitsList, itemsList, itemsMap]);

  const subConduitMat = formData.submersible_pump_cable_type_01_conduit_type || 'Liquid Tight';
  const subConduitAccs = useMemo(() => {
    return getConduitAccessoriesForMaterial(subConduitMat);
  }, [subConduitMat, conduitsList, itemsList, itemsMap]);

    // Conduit Adapter Options
  const mainConduitCategoryOptions = [
    { id: 'Flexible Fire Resistant', label: 'Flexible Fire Resistant' },
    { id: 'Liquid Tight', label: 'Liquid Tight (Flexible Steel)' },
    { id: 'EMT', label: 'EMT Rigid Metallic Conduit' },
    { id: 'PVC', label: 'PVC Heavy Duty Rigid Conduit' }
  ];

  const conduitAdapterOptions = useMemo(() => {
    return (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('adapter') && (name.includes('conduit') || name.includes('liquid tight') || name.includes('emt') || name.includes('flex'))) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));
  }, [itemsList]);

  // Conduit Coupler Options
  const conduitCouplerOptions = useMemo(() => {
    return (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return name.includes('coupler') && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));
  }, [itemsList]);

  // C-Channel Options
  const cChannelOptions = useMemo(() => {
    return (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('channel') || name.includes('c-channel')) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));
  }, [itemsList]);

  // Anchor Options
  const anchorOptions = useMemo(() => {
    return (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return name.includes('anchor') && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));
  }, [itemsList]);

  // Conduit Strap Options
  const conduitStrapOptions = useMemo(() => {
    return (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('strap') && (name.includes('conduit') || name.includes('emt') || name.includes('imc') || name.includes('rgs'))) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));
  }, [itemsList]);

  // Cable Tray 90 Elbow Options (General / Pumps)
  const trayElbowOptions = useMemo(() => {
    return (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('tray') && (name.includes('elbow') || name.includes('90'))) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));
  }, [itemsList]);

  // Vertical Elbow 90 Options (Specific)
  const vElbowOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('vertical') && (name.includes('elbow') || name.includes('90'))) || (name.includes('elbow') && name.includes('vertical')) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
    });
    if (!map.has('def_velbow')) {
      map.set('def_velbow', {
        id: '0ebdaaf7-0350-4f11-a7f9-ac95a72dde99',
        label: 'Hot dip Galvanized after fabrication, Vertical outside Elbow 90, 140mm Radius with cover',
        item_id: '0ebdaaf7-0350-4f11-a7f9-ac95a72dde99'
      });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Horizontal Elbow 90 Options (Specific)
  const hElbowOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('horizontal') && (name.includes('elbow') || name.includes('90'))) || (name.includes('elbow') && name.includes('horizontal')) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
    });
    if (!map.has('def_helbow')) {
      map.set('def_helbow', {
        id: '6f04bc07-418b-46c0-9b25-f353f8886a6a',
        label: 'Hot dip Galvanized after fabrication, Horizontal outside Elbow 90, 140mm Radius with cover',
        item_id: '6f04bc07-418b-46c0-9b25-f353f8886a6a'
      });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Splice Plate Options
  const splicePlateOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return name.includes('splice plate') && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
    });
    if (!map.has('def_splice')) {
      map.set('def_splice', {
        id: 'ac7ed164-c456-4f01-8334-a3d5bc4d804c',
        label: 'Splice plate',
        item_id: 'ac7ed164-c456-4f01-8334-a3d5bc4d804c'
      });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // End Cap Options
  const endCapOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('end cap') || name.includes('endcap')) && !name.includes('pipe') && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
    });
    if (!map.has('def_endcap')) {
      map.set('def_endcap', {
        id: 'b020d2c8-d214-4209-bfe4-dca2afd3456e',
        label: 'END Cap',
        item_id: 'b020d2c8-d214-4209-bfe4-dca2afd3456e'
      });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Anchors Options
  const anchorsOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('anchor') || name.includes('drop-in') || name.includes('threaded rod')) && !name.includes('pipe anchor') && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
    });
    if (!map.has('def_anchor')) {
      map.set('def_anchor', {
        id: '3dd3f13d-9db8-4542-8191-ff3ae2f25d8c',
        label: 'Anchors (10cm*10mm)',
        item_id: '3dd3f13d-9db8-4542-8191-ff3ae2f25d8c'
      });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Offset Tee Options
  const offsetTeeOptions = useMemo(() => {
    return (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('offset tee') || (name.includes('tee') && name.includes('tray'))) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));
  }, [itemsList]);

  // Cable Conduits Options (from cable_conduits and items table)

  const cableTrayOptions = useMemo(() => {
    return (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('perforated cable tray') || name.includes('cable tray') || name.includes('tray')) && !name.includes('splice') && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));
  }, [itemsList]);

  const conduitOptions = useMemo(() => {
    const fromConduitsTable = (conduitsList || []).map(c => {
      const item = itemsMap[c.item_id];
      return {
        id: c.id,
        label: item?.item_name || `Conduit ${c.size || ''} ${c.type || ''}`.trim(),
        item_id: c.item_id,
        spec: c
      };
    });
    const fromItemsTable = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('liquid tight') || name.includes('emt conduit') || name.includes('conduit size')) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const map = new Map();
    [...fromConduitsTable, ...fromItemsTable].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [conduitsList, itemsList, itemsMap]);

  // Tablet Chlorinators
  const chlorinatorOptions = useMemo(() => {
    return chlorinators.map(c => {
      const item = itemsMap[c.item_id];
      if (item?.item_name) {
        return { id: c.id, label: item.item_name, item_id: c.item_id };
      }
      const cap = c.capacity ? `Capacity: ${c.capacity}` : '';
      const label = ['Tablet Chlorinator', cap].filter(Boolean).join(' • ');
      return { id: c.id, label, item_id: c.item_id };
    });
  }, [chlorinators, itemsMap]);

  // Automated pH/ORP Chemical Analyzer & Controller Panels
  const chemicalControllerOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      const isPoolChemicalController = (name.includes('ph/orp') || name.includes('ph controller') || name.includes('chemical controller') || name.includes('dosing system')) &&
        !name.includes('document') && !name.includes('drawing') && !name.includes('engineer') && !name.includes('staff');
      return isPoolChemicalController;
    });
    return matched.map(i => ({
      id: i.id,
      label: i.item_name,
      item_id: i.id
    }));
  }, [itemsList]);

  // Automated pH/ORP Dosing Pump Equipment Models (from filter_pump_types & items where category is Dosing Pump)
  const dosingPumpOptions = useMemo(() => {
    // 1. Match from filter_pump_types if any category contains dosing
    const pumpTypesDosing = (filterPumps || []).filter(p => {
      const cat = String(p.item_category || '').toLowerCase();
      const code = String(p.filter_pump_code || '').toLowerCase();
      return cat.includes('dosing') || code.includes('dosing') || cat === 'eb18002a-9e12-4eb2-bc24-cf511d73c1c1';
    }).map(p => {
      const item = itemsMap[p.item_id];
      if (item?.item_name) return { id: p.id, label: item.item_name, item_id: p.item_id, spec: p };
      return { id: p.id, label: `Dosing Pump ${p.filter_pump_code || p.id}`, item_id: p.item_id, spec: p };
    });

    // 2. Match from items catalog
    const itemsDosing = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('dosing pump') || name.includes('dosing-pump')) && 
        !name.includes('controller') && !name.includes('panel') && !name.includes('stirrer') && !name.includes('tank');
    }).map(i => ({
      id: i.id,
      label: i.item_name,
      item_id: i.id
    }));

    // Merge & deduplicate by item_id/id
    const combined = [...pumpTypesDosing, ...itemsDosing];
    const seen = new Set();
    const result = [];
    for (const opt of combined) {
      const key = opt.label?.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(opt);
      }
    }
    return result;
  }, [filterPumps, itemsList, itemsMap]);

  // Chemical Mixing / Storage Tank Models (Strictly PE Chemical Tanks)
  const chemicalTankOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      const isExplicitPeChemical = name.includes('mixing tank') || name.includes('pe chemical tank') || (name.includes('tank') && name.includes('shawwa'));
      const isCivilOrUnderground = name.includes('underground') || name.includes('undeaground') || name.includes('masonry') || name.includes('rc ') || name.includes('balance tank') || name.includes('drainage chamber');
      return isExplicitPeChemical && !isCivilOrUnderground;
    });
    return matched.map(i => ({
      id: i.id,
      label: i.item_name,
      item_id: i.id
    }));
  }, [itemsList]);

  // Chemical Stirrer / Mixer Models
  const chemicalStirrerOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('electrical stirrer') || name.includes('stirrer') || name.includes('agitator') || (name.includes('mixer') && !name.includes('concrete') && !name.includes('shower')));
    });
    return matched.map(i => ({
      id: i.id,
      label: i.item_name,
      item_id: i.id
    }));
  }, [itemsList]);

  // Floor Inlets Options (Deduplicated)
  const floorInletOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('floor return inlet') || name.includes('floor inlet') || (name.includes('floor') && name.includes('inlet'))) &&
        i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    return Array.from(map.values());
  }, [itemsList]);

  // Wall Inlets Options (Deduplicated)
  const wallInletOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('wall inlet') || (name.includes('wall') && name.includes('inlet'))) &&
        i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    return Array.from(map.values());
  }, [itemsList]);

  // Skimmer Options (Deduplicated)
  const skimmerOptions = useMemo(() => {
    const fromAcc = (accessories || []).filter(a => {
      const itm = itemsMap[a.item_id];
      const name = (itm?.item_name || '').toLowerCase();
      return name.includes('skimmer') || String(a.item_category).includes('c30d9509');
    }).map(a => {
      const itm = itemsMap[a.item_id];
      return { id: a.id, label: itm?.item_name || `Skimmer ${a.id}`, item_id: a.item_id };
    });

    const fromItems = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return name.includes('skimmer') && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const map = new Map();
    [...fromAcc, ...fromItems].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [accessories, itemsList, itemsMap]);

  // Vacuum Point Options (Deduplicated)
  const vacuumPointOptions = useMemo(() => {
    const fromAcc = (accessories || []).filter(a => {
      const itm = itemsMap[a.item_id];
      const name = (itm?.item_name || '').toLowerCase();
      return name.includes('vaccum') || name.includes('vacuum') || String(a.item_category).includes('27a3e0c6');
    }).map(a => {
      const itm = itemsMap[a.item_id];
      return { id: a.id, label: itm?.item_name || `Vacuum Point ${a.id}`, item_id: a.item_id };
    });

    const fromItems = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('vacuum point') || name.includes('vaccum point')) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const map = new Map();
    [...fromAcc, ...fromItems].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [accessories, itemsList, itemsMap]);

  // Main Drain Options (Deduplicated)
  const mainDrainOptions = useMemo(() => {
    const fromMd = (mainDrains || []).map(m => {
      const itm = itemsMap[m.item_id];
      const bTitle = brandsMap[m.brand_id] || '';
      const flow = m.flowrate ? `${m.flowrate} m³/h` : '';
      const label = itm?.item_name || [bTitle, 'Anti-Vortex Main Drain', flow].filter(Boolean).join(' • ');
      return { id: m.id, label, item_id: m.item_id };
    });

    const fromItems = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return name.includes('main drain') && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const map = new Map();
    [...fromMd, ...fromItems].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [mainDrains, itemsList, itemsMap, brandsMap]);

  // Gutter Drain Options (Deduplicated)
  const gutterDrainOptions = useMemo(() => {
    const fromAcc = (accessories || []).filter(a => {
      const itm = itemsMap[a.item_id];
      const name = (itm?.item_name || '').toLowerCase();
      return name.includes('gutter drain') || String(a.item_category).includes('9f72c25a');
    }).map(a => {
      const itm = itemsMap[a.item_id];
      return { id: a.id, label: itm?.item_name || `Gutter Drain ${a.id}`, item_id: a.item_id };
    });

    const fromItems = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('gutter drain') || (name.includes('drain') && name.includes('gutter'))) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const map = new Map();
    [...fromAcc, ...fromItems].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [accessories, itemsList, itemsMap]);

  // Manual Cleaning Set Options (Filtered specifically to pool cleaning kits)
  const cleaningKitOptions = useMemo(() => {
    const procurementCleaning = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name === 'manual cleaning set' || name.includes('cleaning set') || name.includes('cleaning kit')) &&
        i.activity_type !== 'Drawings' &&
        !name.includes('site') &&
        !name.includes('truck') &&
        !name.includes('handing') &&
        !name.includes('chamber');
    }).map(i => ({ id: i.id, label: `${i.item_name} (Complete Set)`, item_id: i.id }));

    const standard = [
      { id: '8f8944f3-ffe0-44ed-91da-4c935b2351f8', label: 'Manual Cleaning Set (Pole, Vacuum Head, Hose, Net, Brush, Test Kit)', item_id: '8f8944f3-ffe0-44ed-91da-4c935b2351f8' },
      { id: 'astral_cleaning_kit', label: 'AstralPool Complete Manual Pool Cleaning Kit Set' }
    ];

    const map = new Map();
    [...procurementCleaning, ...standard].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [itemsList]);

  // Solenoid Valves Options (Deduplicated)
  const solenoidValveOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('solenoid') || name.includes('seneloid')) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    if (map.size === 0) {
      map.set('hunter_solenoid_50', { id: 'hunter_solenoid_50', label: 'Hunter Solenoid Valve 50 mm (2") Auto-Fill' });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Float Valves Options (Deduplicated)
  const floatValveOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('float valve') || (name.includes('float') && name.includes('valve'))) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    if (map.size === 0) {
      map.set('brass_float_valve_1in', { id: 'brass_float_valve_1in', label: 'Brass Heavy-Duty Mechanical Float Valve 1"' });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Float Switches Options (Deduplicated)
  const floatSwitchOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('float switch') || name.includes('level switch')) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    if (map.size === 0) {
      map.set('dual_float_switch', { id: 'dual_float_switch', label: 'Electric Float Level Switch (Dual High/Low Protection)' });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Ventilation Fan Models
  const ventilationOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('ventilat') || name.includes('exhaust') || (name.includes('fan') && name.includes('rosenberg'))) &&
             !name.includes('stand fan') && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    return Array.from(map.values());
  }, [itemsList]);

  // Light Switch Options
  const lightSwitchOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('switch') || name.includes('gw20571') || name.includes('1p 16ax')) && !name.includes('disconnect') && !name.includes('rotary') && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
    });
    if (!map.has('def_switch')) {
      map.set('def_switch', {
        id: '8cc7cd49-6d9b-490c-ab2e-f902d3122e36',
        label: '1P 16AX ONE-WAY SWITCH-1 MODULE-WHITE Brand: Gewiss Code: GW20571',
        item_id: '8cc7cd49-6d9b-490c-ab2e-f902d3122e36'
      });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Switch Enclosure Options
  const switchEnclosureOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('enclosure') || name.includes('gw27062') || name.includes('water-tight') || name.includes('watertight')) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
    });
    if (!map.has('def_enclosure')) {
      map.set('def_enclosure', {
        id: 'c23c71c4-d5a4-431d-ab30-3bc9bb969964',
        label: 'WATER-TIGHT COMBI ENCLOSURE-2 GANG-IP65 Brand: Gewiss Code: GW27062',
        item_id: 'c23c71c4-d5a4-431d-ab30-3bc9bb969964'
      });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Service Sockets Options
  const socketOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('socket') || name.includes('s.-outlet')) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    return Array.from(map.values());
  }, [itemsList]);

  // Soil Sensitivity Types & Typical Resistivity (rho in Ohm-m)
  const soilSensitivityTypes = useMemo(() => [
    { id: 'Marls (e.g. Keuper marl)', label: 'Marls (e.g. Keuper marl)', value: 20 },
    { id: 'Alluvium, Loam, Clay', label: 'Alluvium, Loam, Clay', value: 30 },
    { id: 'Clay, Sandy Clay', label: 'Clay, Sandy Clay', value: 50 },
    { id: 'Sand and Gravel', label: 'Sand and Gravel', value: 100 },
    { id: 'Porous Limestone', label: 'Porous Limestone', value: 150 },
    { id: 'Limestone / Sandstone', label: 'Limestone / Sandstone', value: 300 },
    { id: 'Granite / Basalt / Rock', label: 'Granite / Basalt / Rock', value: 1000 },
  ], []);

  // Tri-Proof IP65 Waterproof Lighting Options
  const triProofLightingOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('tri-proof') || name.includes('tri proof') || name.includes('waterproof light') || (name.includes('lighting') && name.includes('philips'))) &&
        !name.includes('underwater') && !name.includes('pool') && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    if (map.size === 0) {
      map.set('def_tri_proof', {
        id: 'eebc0bd2-37ff-49ef-9d71-bdce4dadbebb',
        label: 'Waterproof Light fixture 120 cm Type: LED Tri-Proof Brand: Philips WT198C',
        item_id: 'eebc0bd2-37ff-49ef-9d71-bdce4dadbebb'
      });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Earth Rod Options
  const earthRodOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('earth rod') || name.includes('bonded earth') || name.includes('copper bonded')) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    if (map.size === 0) {
      map.set('def_earth_rod', { id: 'b416f815-ead6-47fc-a3c4-4d7052fd5f91', label: 'Copper-bonded earth rod 5/8" x 3m (1500X3/4)' });
    }
    return Array.from(map.values());
  }, [itemsList]);

  // Grounding Conductor Cable Options
  const groundingCableOptions = useMemo(() => {
    const fromCables = (cablesList || []).map(c => {
      const itm = itemsMap[c.item_id];
      return { id: c.id, label: itm?.item_name || `${c.cable_type || 'Cu'} ${c.nominal_cross_sectional_area_mm_2 || '70'}mm² Grounding Conductor`, item_id: c.item_id };
    });
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('bare copper') || (name.includes('cable') && (name.includes('ground') || name.includes('earth')))) && i.activity_type !== 'Drawings';
    }).map(i => ({ id: i.id, label: i.item_name, item_id: i.id }));

    const map = new Map();
    [...fromCables, ...matched].forEach(opt => {
      const key = opt.label?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, opt);
      }
    });
    return Array.from(map.values());
  }, [cablesList, itemsList, itemsMap]);

  // Earth Inspection Pit Options
  const earthPitOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('earth pit') || name.includes('concreat earth pit') || name.includes('concrete earth pit')) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    return Array.from(map.values());
  }, [itemsList]);

  // Pump Room Tri-Proof Lighting Options
  const prLightingOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('greenperform') || name.includes('tri-proof') || name.includes('waterproof g3') || (name.includes('led') && name.includes('waterproof'))) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    return Array.from(map.values());
  }, [itemsList]);

  // Mechanical Networks Installation Options
  const mechanicalNetworksOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      const cat = (i.work_main_category || i.main_category || '').toLowerCase();
      const act = (i.activity_type || '').toLowerCase();
      return (
        act === 'installation' ||
        name.includes('mechanical networks installation') ||
        name.includes('mechanical installation') ||
        (cat.includes('mechanical') && name.includes('installation'))
      );
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    return Array.from(map.values());
  }, [itemsList]);

  // Fire Extinguishers Options
  const fireExtOptions = useMemo(() => {
    const matched = (itemsList || []).filter(i => {
      const name = (i.item_name || '').toLowerCase();
      return (name.includes('fire ext') || name.includes('extinguisher') || name.includes('naffco')) && i.activity_type !== 'Drawings';
    });
    const map = new Map();
    matched.forEach(i => {
      const key = i.item_name?.trim().toLowerCase();
      if (key && !map.has(key)) {
        map.set(key, { id: i.id, label: i.item_name, item_id: i.id });
      }
    });
    return Array.from(map.values());
  }, [itemsList]);

  const pipeSizes = ['63mm', '75mm', '90mm', '110mm', '160mm', '200mm', '250mm', '315mm'];
  const hdpePipeSizes = ['63mm', '75mm', '90mm', '110mm', '160mm', '200mm'];

  const liveTotalNoH = useMemo(() => {
    const rawVal = Number(formData.total_no_of_h_networks);
    if (!isNaN(rawVal) && rawVal > 0) return Math.ceil(rawVal);
    const numFilters = Number(formData.no_of_water_filter) || 1;
    const fObj = (mediaFilters || []).find(f => String(f.id) === String(formData.water_filter_code) || String(f.id) === String(formData.preferred_water_filter));
    const qFilt = Number(fObj?.min_flow_rate) || Number(formData.water_filter_quanitity_coverage_filtration) || 14;
    return Math.ceil((numFilters * qFilt) / 40);
  }, [formData.total_no_of_h_networks, formData.no_of_water_filter, formData.water_filter_code, formData.preferred_water_filter, formData.water_filter_quanitity_coverage_filtration, mediaFilters]);

  const liveTotalNoT = useMemo(() => {
    return liveTotalNoH > 1 ? Math.ceil(liveTotalNoH / 2) : 0;
  }, [liveTotalNoH]);

  const upvcPipesCatalog = useMemo(() => {
    return pipeSizes.map(sz => {
      const num = sz.replace('mm', '');
      const itm = (itemsList || []).find(i => (i.item_name || '').toLowerCase().includes(`upvc pipes ø${num}`) && !i.item_name?.toLowerCase().includes('adapter'));
      return { size: sz, item: itm, name: itm?.item_name || `UPVC Pipes Ø${num} mm Brand: Misr Al Nour`, cost: itm?.unit_cost || 0 };
    });
  }, [itemsList]);

  const hdpePipesCatalog = useMemo(() => {
    return hdpePipeSizes.map(sz => {
      const num = sz.replace('mm', '');
      const itm = (itemsList || []).find(i => (i.item_name || '').toLowerCase().includes(`hdpe pipes ø ${num} mm`));
      return { size: sz, item: itm, name: itm?.item_name || `HDPE pipes Ø ${num} mm Brand: Red Sea`, cost: itm?.unit_cost || 0 };
    });
  }, [itemsList]);

  const ballValvesCatalog = useMemo(() => {
    return pipeSizes.map(sz => {
      const num = sz.replace('mm', '');
      const itm = (itemsList || []).find(i => (i.item_name || '').toLowerCase().includes(`ball valve ${num} mm brand: comer`));
      return { size: sz, item: itm, name: itm?.item_name || `Ball Valve ${num} mm Brand: Comer`, cost: itm?.unit_cost || 0 };
    });
  }, [itemsList]);

  const checkValvesCatalog = useMemo(() => {
    return pipeSizes.map(sz => {
      const num = sz.replace('mm', '');
      const itm = (itemsList || []).find(i => (i.item_name || '').toLowerCase().includes(`non return valve ${num} mm`));
      return { size: sz, item: itm, name: itm?.item_name || `Non Return Valve ${num} mm Brand Comer`, cost: itm?.unit_cost || 0 };
    });
  }, [itemsList]);

  // Sub-Tabs Suite Definition for Left Sidebar
  // Sub-Tabs Suite Definition for Left Sidebar (Merged 1 & 2 into Unified Filtration & Pumps Tab)
  const subTabs = [
    { id: 'filtration', label: '1. Filtration, Pumps & Power', desc: 'Turnover, filters, pumps & electrical', icon: Droplets, color: 'text-rose-500' },
    { id: 'dosing', label: '2. Dosing, Fittings & Pipes', desc: 'Pipes, inlets, drains & chemical', icon: Wrench, color: 'text-emerald-500' },
    { id: 'heaters', label: '3. Heating System', desc: 'Heat pumps, gas heaters & sizing', icon: Flame, color: 'text-amber-500' },
    { id: 'lighting', label: '4. Lighting & Transformers', desc: 'Underwater LED lights & power', icon: Lightbulb, color: 'text-yellow-500' },
    { id: 'earthing', label: '5. Earthing & Protection', desc: 'Grounding rods & bonding', icon: Zap, color: 'text-teal-500' },
    { id: 'pumps_room_mep', label: '6. Pump Room MEP & Trays', desc: 'Cable trays, ventilation, sockets & lighting', icon: ShieldCheck, color: 'text-cyan-500' },
    { id: 'installation_scope', label: '7. Installation & Other Scope', desc: 'Networks installation, labor, accommodations & scope works', icon: HardHat, color: 'text-indigo-500' }
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0 flex-1 overflow-hidden">
      
      {/* ========================================================================= */}
      {/* 1. PERMANENTLY FIXED LEFT SIDEBAR NAVIGATION                              */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 h-full overflow-y-auto p-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 z-10 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="px-1 py-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Engineering Sub-Modules</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200">7 Sub-Tabs Suite</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/60">
              {subTabs.findIndex(t => t.id === emSection) + 1} / 7
            </span>
          </div>

          {/* 7 SUB-TABS VERTICAL LIST */}
          <div className="space-y-1">
            {subTabs.map((tab) => {
              const isActive = emSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setEmSection(tab.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition-all cursor-pointer border ${
                    isActive 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md border-transparent font-black' 
                      : 'bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-xl flex-shrink-0 ${
                    isActive 
                      ? 'bg-white/10 dark:bg-slate-900/10 text-teal-400 dark:text-teal-600' 
                      : 'bg-white dark:bg-slate-900 ' + tab.color + ' border border-slate-200 dark:border-slate-700'
                  }`}>
                    <tab.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-black truncate ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'}`}>
                      {tab.label}
                    </div>
                    <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR MINI FINANCIAL SUMMARY */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Mechanical:</span>
            <span className="font-bold text-teal-600 dark:text-teal-400">{calculatedMechCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP</span>
          </div>
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Electrical:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{calculatedElecCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP</span>
          </div>
          <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800 font-black">
            <span className="text-slate-800 dark:text-slate-200 text-[11px]">Total MEP:</span>
            <span className="text-emerald-600 dark:text-emerald-400">{calculatedTotalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })} EGP</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIGHT MAIN CONTENT AREA (Section 0 + Summary + Active Sub-Tab Form)   */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 space-y-6">
        
        {/* SECTION 0: PROPOSAL, WATER FEATURE PHASE & RELATED PUMP ROOMS LINKAGE */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Section 0: Water Feature Phase & Associated Pump Rooms Linkage
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
                const matchingPhases = phases.filter(p => String(p.tender_log_id) === String(val));
                const prs = matchingPhases.filter(p => p.component_type?.toLowerCase().includes('pump') || p.phase_title?.toLowerCase().includes('pump'));
                onChange({
                  ...formData,
                  tender_log_id: val,
                  linked_proposal: val,
                  phase_id: '',
                  linked_phase: '',
                  water_feature_type: '',
                  water_feature_area: '',
                  water_feature_volume: '',
                  water_feature_perimeter: '',
                  related_pump_rooms: prs.map(p => p.id),
                  water_filter_code: '',
                  water_filter_diameter: '',
                  water_filter_pump_code: '',
                  proposal_breakdown_items: []
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
                label: `${p.phase_title || 'Water Feature'} (${p.component_type || 'Water Feature'})`
              }))}
              value={selectedPhaseId}
              onChange={(val) => {
                const candidates = (pdeData || wfTechnicalData || []).filter(w => String(w.phase_id || w.linked_phase || w.id) === String(val));
                const upstream = candidates.find(w => Number(w.water_feature_area_m2 || w.water_feature_area || (Number(w.pool_length_m) * Number(w.pool_width_m))) > 0) || candidates[0];
                let linkedPrs = formData.related_pump_rooms || [];
                if (upstream && upstream.related_pump_rooms && upstream.related_pump_rooms.length > 0) {
                  linkedPrs = upstream.related_pump_rooms;
                }
                const pL = Number(upstream?.pool_length_m) || 0;
                const pW = Number(upstream?.pool_width_m) || 0;
                const area = Number(upstream?.water_feature_area_m2 || upstream?.water_feature_area) || 
                  (pL > 0 && pW > 0 ? Number((pL * pW).toFixed(2)) : 0) || 50;
                const depth = Number(upstream?.avg_height_m || upstream?.water_deep_height_m || upstream?.depth_m) || 1.4;
                const vol = Number(upstream?.water_feature_volume_m3 || upstream?.water_feature_volume) || 
                  Number((area * depth).toFixed(2));
                const perim = Number(upstream?.water_feature_perimeter_m || upstream?.water_feature_perimeter) || 
                  (pL > 0 && pW > 0 ? Number((2 * (pL + pW)).toFixed(2)) : 30);
                const hrs = upstream?.hours_of_water_filtration_h ? String(upstream.hours_of_water_filtration_h) : (formData.hours_of_filtration || '6');
                const flow = Number((vol / (Number(hrs) || 6)).toFixed(2));

                const nextData = {
                  ...formData,
                  phase_id: val,
                  linked_phase: val,
                  water_feature_type: upstream?.water_feature_type || formData.water_feature_type || '',
                  water_feature_category: upstream?.water_feature_category || formData.water_feature_category || '2af5028b-4bec-403e-8825-75984bcbda28',
                  water_feature_area: String(area),
                  water_feature_area_m2: area,
                  water_feature_volume: String(vol),
                  water_feature_volume_m3: vol,
                  water_feature_perimeter: String(perim),
                  water_feature_perimeter_m: perim,
                  depth_m: depth,
                  pool_length_m: upstream?.pool_length_m || '',
                  pool_width_m: upstream?.pool_width_m || '',
                  hours_of_filtration: hrs,
                  water_filtration: String(flow),
                  related_pump_rooms: linkedPrs,
                  water_filter_code: '',
                  water_filter_diameter: '',
                  water_filter_pump_code: ''
                };
                onChange(nextData);
              }}
              placeholder={!selectedProposalId ? "Please select a proposal first..." : waterFeaturePhases.length > 0 ? "Select Water Feature Phase..." : "No Water Feature phases found for proposal"}
            />
          </div>
        </div>

        {/* RELATED PUMP ROOMS MULTI-SELECT BADGES */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
            Associated / Related Pump Room(s) to this Water Feature
          </label>
          
          {!selectedProposalId ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs text-slate-400 font-medium">
              Please select a proposal above to view associated pump rooms.
            </div>
          ) : availablePumpRooms.length === 0 ? (
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
          {selectedProposalId && (Number(formData.pump_room_length) > 0 || Number(formData.pump_room_areas) > 0) && (
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

      {/* ELECTROMECHANICAL SUMMARY & REAL BOQ BREAKDOWN TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-0">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span>Water Feature Electromechanical Summary</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                  {boqItems.length} BOQ Items
                </span>
              </h4>
              <p className="text-[10px] text-slate-400">
                Total Mechanical & Electrical Engineering Cost per Proposal & Phase Scope
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBoqCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Export filtered items to CSV"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Export BOQ (.csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBoqExpanded(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/80 border border-teal-200 dark:border-teal-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isBoqExpanded ? 'Collapse BOQ Table' : 'Expand BOQ Table'}</span>
              {isBoqExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* HIGH-LEVEL DISCIPLINE TOTALS ROW */}
        <div className="overflow-x-auto border-b border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-4 text-center w-12">#</th>
                <th className="py-2.5 px-4">Proposal</th>
                <th className="py-2.5 px-4">Phase Scope</th>
                <th className="py-2.5 px-4 text-right">Total Mechanical Cost</th>
                <th className="py-2.5 px-4 text-right">Total Electrical Cost</th>
                <th className="py-2.5 px-4 text-right pr-6">Total Electromechanical Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                <td className="py-2.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                  1
                </td>
                <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                  <span className="text-teal-800 dark:text-teal-300 font-mono mr-2 bg-teal-50 dark:bg-teal-950/80 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                    {activeProposal?.proposal_number || 'SP.2026.01'}:
                  </span>
                  <span>{activeProposal?.proposal_title || activeProposal?.proposal_full_title || 'Untitled Proposal'}</span>
                </td>
                <td className="py-2.5 px-4 font-sans font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-[11px] border border-slate-200 dark:border-slate-700">
                    {activePhase?.phase_title || activePhase?.phase_full_title || 'Water Feature Phase'}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right font-black text-teal-600 dark:text-teal-400 text-xs whitespace-nowrap">
                  {calculatedMechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </td>
                <td className="py-2.5 px-4 text-right font-black text-amber-600 dark:text-amber-400 text-xs whitespace-nowrap">
                  {calculatedElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </td>
                <td className="py-2.5 px-4 text-right pr-6 font-black text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                  {calculatedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FULL REAL BOQ BREAKDOWN TABLE */}
        {isBoqExpanded && (
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            
            {/* SEARCH & FILTER CONTROLS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs">
              
              {/* Discipline Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => setBoqFilterDiscipline('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    boqFilterDiscipline === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({boqItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBoqFilterDiscipline('mechanical')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    boqFilterDiscipline === 'mechanical'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                  }`}
                >
                  Mechanical ({mechItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBoqFilterDiscipline('electrical')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    boqFilterDiscipline === 'electrical'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  Electrical ({elecItems.length})
                </button>
              </div>

              {/* Activity Filter */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setBoqFilterActivity('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    boqFilterActivity === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Activities
                </button>
                <button
                  type="button"
                  onClick={() => setBoqFilterActivity('procurement')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    boqFilterActivity === 'procurement'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  Procurement
                </button>
                <button
                  type="button"
                  onClick={() => setBoqFilterActivity('installation')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    boqFilterActivity === 'installation'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                  }`}
                >
                  Installation
                </button>
              </div>

              {/* Work Category Filter Dropdown */}
              <div className="w-full sm:w-56">
                <select
                  value={boqFilterCategory}
                  onChange={(e) => setBoqFilterCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="all">All Trade Categories ({uniqueBoqCategories.length})</option>
                  {uniqueBoqCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Search Filter Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search item, code, category..."
                  value={boqSearchQuery}
                  onChange={(e) => setBoqSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* REAL BOQ LINE ITEMS TABLE */}
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-500 shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3 min-w-[280px]">Item Description & Specification</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Official Trade Category</th>
                    <th className="py-2.5 px-3 text-center">Discipline</th>
                    <th className="py-2.5 px-3 text-center">Activity</th>
                    <th className="py-2.5 px-3 text-right">Base Qty</th>
                    <th className="py-2.5 px-3 text-right">Extra %</th>
                    <th className="py-2.5 px-3 text-right">Final Qty</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                  {filteredBoqItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                        No BOQ items match the active filters or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredBoqItems.map((item, idx) => {
                      const itemName = STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item_name || item.item || 'Item Description';
                      const isMech = (item.work_type || '').toLowerCase() === 'mechanical';
                      const isProc = (item.activity_type || '').toLowerCase() === 'procurement';

                      return (
                        <tr 
                          key={item.id || `${item.item}-${idx}`}
                          className="hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-2">
                              {itemName}
                            </div>
                            {item.item && typeof item.item === 'string' && item.item.length > 20 && (
                              <span className="text-[9px] text-slate-400 font-mono block truncate max-w-[320px]">
                                UUID: {item.item}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 inline-block">
                              {item.work_main_category || item.main_category || 'Water Feature'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isMech 
                                ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800' 
                                : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}>
                              {item.work_type || 'MEP'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isProc
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            }`}>
                              {item.activity_type || 'Procurement'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                            {Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">
                            {item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">
                            {Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">
                            {item.unit || 'No.'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                            {Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right pr-4 font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-700 text-xs font-mono font-bold">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 font-sans text-slate-800 dark:text-slate-200">
                      Showing {filteredBoqItems.length} of {boqItems.length} BOQ line items
                    </td>
                    <td colSpan={4} className="py-3 px-3 text-right text-slate-500">
                      Filtered Total Cost:
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {filteredBoqTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TURNOVER, FILTRATION & MATCHING PUMPS */}
      {emSection === 'filtration' && (() => {
        const area = resolvedArea;
        const depth = resolvedDepth;
        const volume = resolvedVolume;
        const turnoverHours = Number(formData.hours_of_filtration || 6);
        const filtrationFlow = Number(formData.water_filtration) || (turnoverHours > 0 && volume > 0 ? Number((volume / turnoverHours).toFixed(2)) : 0);
        const speed = Number(formData.filtration_speed || 40);
        const requiredFilterArea = speed > 0 ? Number((filtrationFlow / speed).toFixed(3)) : 0;
        
        const totalCircPumps = (Number(formData.no_of_water_filter_pump) || 0) + (Number(formData.no_of_water_filter_pump_stand_by) || 0);
        const totalVacPumps = (Number(formData.no_of_vacuum_filter_pump) || 0) + (Number(formData.no_of_vacuum_filter_pump_stand_by) || 0);
        const totalSubPumps = Number(formData.no_of_submersible_pump || formData.submersible_pump_qty || 0);

        return (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
            {/* Header & Sub-Tab Summary */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>1. Filtration, Pumps & Power Infrastructure</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                      Module 1 / 7
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Turnover cycle, media vessels, circulation/vacuum/sump pumps, local isolator disconnect switches, power feeding cables, conduits, and branch cable trays.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Filters: {formData.no_of_water_filter || 1}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                  Circ: {totalCircPumps}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                  Vac: {totalVacPumps}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Sump: {totalSubPumps}
                </span>
              </div>
            </div>

            {/* Geometric Dimensions & Pool Volume Configuration Card */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Geometric Boundaries & Pool Water Volume
                  </span>
                </div>
                {(!activePde?.water_feature_area_m2 && !formData.water_feature_area_m2) && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    Defaults applied (editable below)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Surface Area */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Pool Surface Area (m²)</span>
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('water_feature_area_m2', Math.max(1, area - 5))}
                      className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      step="0.5"
                      value={area}
                      onChange={(e) => handleFieldChange('water_feature_area_m2', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('water_feature_area_m2', area + 5)}
                      className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Average Depth */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Average Depth (m)</span>
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('depth_m', Math.max(0.2, Number((depth - 0.1).toFixed(2))))}
                      className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      step="0.05"
                      value={depth}
                      onChange={(e) => handleFieldChange('depth_m', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('depth_m', Number((depth + 0.1).toFixed(2)))}
                      className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Water Volume */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Water Volume (m³)</span>
                    <span className="text-[9px] text-teal-600 font-mono">Auto (A × H)</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={volume}
                    onChange={(e) => handleFieldChange('water_feature_volume', e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono font-black text-rose-600 dark:text-rose-400 focus:outline-none"
                  />
                </div>

                {/* Perimeter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Perimeter (m)
                  </label>
                  <div className="w-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{resolvedPerimeter.toFixed(1)} m</span>
                    <span className="text-[10px] text-slate-400 font-medium font-sans">Linear</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Turnover Calculations Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-rose-50/60 via-violet-50/60 to-blue-50/60 dark:from-rose-950/20 dark:via-violet-950/20 dark:to-blue-950/20 rounded-2xl border border-rose-200/60 dark:border-rose-800/40 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Water Volume (V)</span>
                <div className="text-sm font-mono font-black text-rose-600 dark:text-rose-400">
                  {volume.toFixed(2)} <span className="text-[10px]">m³</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Filtration Flow (Q)</span>
                <div className="text-sm font-mono font-black text-violet-600 dark:text-violet-400">
                  {filtrationFlow.toFixed(2)} <span className="text-[10px]">m³/h</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Filtration Speed (v)</span>
                <div className="text-sm font-mono font-black text-blue-600 dark:text-blue-400">
                  {speed} <span className="text-[10px]">m³/h/m²</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Required Area (A)</span>
                <div className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">
                  {requiredFilterArea.toFixed(2)} <span className="text-[10px]">m²</span>
                </div>
              </div>
            </div>

            {/* Hydraulic Parameters Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Turnover Cycle Duration
                  </label>
                  <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    Fixed (PDE)
                  </span>
                </div>
                <div className="w-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono font-black text-slate-700 dark:text-slate-300 flex items-center justify-between shadow-inner">
                  <span className="text-rose-600 dark:text-rose-400">{formData.hours_of_filtration || 6} Hours</span>
                  <span className="text-[10px] text-slate-400 font-medium">({formData.hours_of_filtration || 6}h / cycle)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Calculated Design Flow Q
                  </label>
                  <span className="text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                    V ÷ T
                  </span>
                </div>
                <div className="w-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono font-black text-teal-700 dark:text-teal-300 flex items-center justify-between shadow-inner">
                  <span>{(Number(formData.water_filtration) || filtrationFlow).toFixed(2)} m³/hr</span>
                  <span className="text-[10px] text-slate-400 font-medium">({volume} m³ ÷ {formData.hours_of_filtration || 6}h)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Water Filtration Method
                </label>
                <select
                  value={formData.water_filtration_method || 'bd0239e7-cf36-42a7-ba39-aa8b70d36bc3'}
                  onChange={(e) => handleFieldChange('water_filtration_method', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="bd0239e7-cf36-42a7-ba39-aa8b70d36bc3">Sand Filter</option>
                  <option value="c63b93c2-a684-4171-adad-289c2450a748">RMF Filters</option>
                  <option value="4ec9604f-02b4-4540-8e1d-10c95b9f3652">Skimfilters</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Filtration Speed (m³/h/m²)
                </label>
                <select
                  value={formData.filtration_speed || '40'}
                  onChange={(e) => handleFieldChange('filtration_speed', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="15">15 m³/h/m² (Ultra-Low Velocity)</option>
                  <option value="20">20 m³/h/m² (Lagoon Slow Sand)</option>
                  <option value="30">30 m³/h/m² (Standard Commercial)</option>
                  <option value="40">40 m³/h/m² (Standard Swimming Pool)</option>
                  <option value="50">50 m³/h/m² (High-Rate Sand)</option>
                </select>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 1. PRIMARY SAND MEDIA FILTERS & CIRCULATION PUMPS WITH FULL ELECTRICALS   */}
            {/* ========================================================================= */}
            <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    1. Primary Sand Media Filters & Matching Circulation Pumps
                  </h4>
                </div>
                {selectedCircPump && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-violet-700 dark:text-violet-300">
                    <span>Rating: <strong>{selectedCircPump.p_kw || '2.2'} kW ({selectedCircPump.filter_pump_hp || '3.0'} HP)</strong></span>
                    <span>•</span>
                    <span>FLC: <strong>{selectedCircPump.operating_voltage ? `${selectedCircPump.operating_voltage}V` : '380V (3-Phase)'}</strong></span>
                    <span>•</span>
                    <span>Total: <strong>{totalCircPumps} Pumps ({formData.no_of_water_filter_pump || 1} Duty + {formData.no_of_water_filter_pump_stand_by || 0} SB)</strong></span>
                  </div>
                )}
              </div>

              {/* Filter Selection Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Filter Brand
                  </label>
                  <SearchableSelect
                    options={filterBrandOptions}
                    value={formData.water_filter_brand || ''}
                    onChange={(val) => {
                      const next = { water_filter_brand: val || '' };
                      if (!val) {
                        next.water_filter_diameter = '';
                        next.water_filter_code = '';
                        next.preferred_water_filter = '';
                        next.water_filter = '';
                      } else {
                        const matching = mediaFilters.filter(f => String(f.filter_brand) === String(val) || String(f.brand_id) === String(val));
                        const curVol = Number(formData.water_feature_volume_m3 || formData.water_feature_volume || formData.pool_volume_m3 || volume || 0);
                        const curHrs = Number(formData.hours_of_filtration || 6);
                        const qFilt = Number(formData.water_filtration) || (curHrs > 0 && curVol > 0 ? Number((curVol / curHrs).toFixed(2)) : 0);
                        if (qFilt > 0 && !formData.water_filtration) {
                          next.water_filtration = qFilt.toFixed(2);
                        }
                        const validFilters = matching.filter(f => Number(f.min_flow_rate || 0) > 0);
                        
                        let best = null;
                        if (formData.water_filter_diameter) {
                          best = matching.find(f => String(f.filter_dia) === String(formData.water_filter_diameter));
                        }
                        if (!best) {
                          if (qFilt > 0) {
                            const sufficient = validFilters.filter(f => Number(f.min_flow_rate) >= qFilt);
                            if (sufficient.length > 0) {
                              best = [...sufficient].sort((a, b) => Number(a.min_flow_rate) - Number(b.min_flow_rate))[0];
                            } else {
                              best = [...validFilters].sort((a, b) => Number(b.min_flow_rate) - Number(a.min_flow_rate))[0];
                            }
                          } else {
                            best = validFilters.find(f => Number(f.filter_dia) === 1050 || Number(f.filter_dia) === 650) || validFilters[0];
                          }
                        }

                        if (best) {
                          const modelFlow = Number(best.min_flow_rate) || 14;
                          const calculatedQty = qFilt > 0 && modelFlow > 0 ? Math.max(1, Math.ceil(qFilt / modelFlow)) : 1;
                          next.no_of_water_filter = String(calculatedQty);
                          next.no_of_water_filter_pump = String(calculatedQty);
                          next.no_of_water_filter_pump_stand_by = isSkimfilter ? '0' : String(Math.max(1, Math.ceil(calculatedQty / 3)));
                        }

                        if (best) {
                          next.water_filter_diameter = String(best.filter_dia);
                          next.water_filter_code = best.id;
                          next.preferred_water_filter = best.id;
                          next.water_filter = best.id;
                          
                          // Auto-match pump for this filter
                          const targetHp = Number(best.pump_hp || 0);
                          const circPumps = filterPumps.filter(p => 
                            String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
                            (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
                          );
                          const brandPumps = circPumps.filter(p => 
                            String(p.pump_brand) === String(formData.pump_brand || formData.water_filter_pump_brand || val) || 
                            String(p.brand_id) === String(formData.pump_brand || formData.water_filter_pump_brand || val)
                          );
                          const listToSearch = brandPumps.length > 0 ? brandPumps : circPumps;
                          const sortedPumps = [...listToSearch].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
                          const matchedPump = targetHp > 0 
                            ? (sortedPumps.find(p => Number(p.filter_pump_hp || 0) >= targetHp) || sortedPumps[sortedPumps.length - 1])
                            : sortedPumps[0];
                          if (matchedPump) {
                            next.water_filter_pump_code = matchedPump.id;
                            next.preferred_water_filter_pump = matchedPump.id;
                            next.water_filter_pump = matchedPump.id;
                            next.pump_brand = matchedPump.pump_brand;
                            next.water_filter_pump_brand = matchedPump.pump_brand;
                            populatePumpElectricals(matchedPump, 'water_filter_pump', next);
                          }
                        }
                      }
                      handleFieldsChange(next);
                    }}
                    placeholder="Select Filter Brand..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Filter Diameter (Ø mm)
                  </label>
                  <SearchableSelect
                    options={availableFilterDiameters.length > 0 ? availableFilterDiameters : [{ id: '1050', label: 'Ø1050 mm' }, { id: '1200', label: 'Ø1200 mm' }, { id: '1400', label: 'Ø1400 mm' }, { id: '1800', label: 'Ø1800 mm' }, { id: '2000', label: 'Ø2000 mm' }]}
                    value={formData.water_filter_diameter || ''}
                    onChange={(val) => {
                      const next = { water_filter_diameter: val || '' };
                      if (!val) {
                        next.water_filter_code = '';
                        next.preferred_water_filter = '';
                        next.water_filter = '';
                      } else {
                        const matching = mediaFilters.filter(f => 
                          (!formData.water_filter_brand || String(f.filter_brand) === String(formData.water_filter_brand) || String(f.brand_id) === String(formData.water_filter_brand)) &&
                          String(f.filter_dia) === String(val)
                        );
                        const matched = matching.sort((a, b) => Number(b.min_flow_rate || 0) - Number(a.min_flow_rate || 0))[0] || mediaFilters.find(f => String(f.filter_dia) === String(val));
                        if (matched) {
                          next.water_filter_code = matched.id;
                          next.preferred_water_filter = matched.id;
                          next.water_filter = matched.id;
                          if (matched.filter_brand) next.water_filter_brand = matched.filter_brand;

                          // Auto-match pump for this newly selected diameter filter!
                          const targetHp = Number(matched.pump_hp || 0);
                          const circPumps = filterPumps.filter(p => 
                            String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
                            (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
                          );
                          const brandPumps = circPumps.filter(p => 
                            String(p.pump_brand) === String(formData.pump_brand || formData.water_filter_pump_brand || matched.filter_brand) || 
                            String(p.brand_id) === String(formData.pump_brand || formData.water_filter_pump_brand || matched.filter_brand)
                          );
                          const listToSearch = brandPumps.length > 0 ? brandPumps : circPumps;
                          const sortedPumps = [...listToSearch].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
                          const matchedPump = targetHp > 0 
                            ? (sortedPumps.find(p => Number(p.filter_pump_hp || 0) >= targetHp) || sortedPumps[sortedPumps.length - 1])
                            : sortedPumps[0];
                          if (matchedPump) {
                            next.water_filter_pump_code = matchedPump.id;
                            next.preferred_water_filter_pump = matchedPump.id;
                            next.water_filter_pump = matchedPump.id;
                            next.pump_brand = matchedPump.pump_brand;
                            next.water_filter_pump_brand = matchedPump.pump_brand;
                            populatePumpElectricals(matchedPump, 'water_filter_pump', next);
                          }
                        }
                      }
                      handleFieldsChange(next);
                    }}
                    placeholder="Select Diameter..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Primary Sand Media Filter Model
                  </label>
                  <SearchableSelect
                    options={filteredMediaFilters.length > 0 ? filteredMediaFilters : mediaFilters.map(f => ({ id: f.id, label: `Sand Filter Ø${f.filter_dia || '1050'}mm`, item_id: f.item_id }))}
                    value={formData.water_filter_code || ''}
                    onChange={(val) => {
                      const next = {
                        water_filter_code: val || '',
                        preferred_water_filter: val || '',
                        water_filter: val || ''
                      };
                      if (val) {
                        const fObj = mediaFilters.find(f => String(f.id) === String(val));
                        if (fObj) {
                          if (fObj.filter_dia) next.water_filter_diameter = String(fObj.filter_dia);
                          if (fObj.filter_brand) next.water_filter_brand = fObj.filter_brand;

                          // Auto-match pump for this newly selected filter model!
                          const targetHp = Number(fObj.pump_hp || 0);
                          const circPumps = filterPumps.filter(p => 
                            String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
                            (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
                          );
                          const brandPumps = circPumps.filter(p => 
                            String(p.pump_brand) === String(formData.pump_brand || formData.water_filter_pump_brand || fObj.filter_brand) || 
                            String(p.brand_id) === String(formData.pump_brand || formData.water_filter_pump_brand || fObj.filter_brand)
                          );
                          const listToSearch = brandPumps.length > 0 ? brandPumps : circPumps;
                          const sortedPumps = [...listToSearch].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
                          const matchedPump = targetHp > 0 
                            ? (sortedPumps.find(p => Number(p.filter_pump_hp || 0) >= targetHp) || sortedPumps[sortedPumps.length - 1])
                            : sortedPumps[0];
                          if (matchedPump) {
                            next.water_filter_pump_code = matchedPump.id;
                            next.preferred_water_filter_pump = matchedPump.id;
                            next.water_filter_pump = matchedPump.id;
                            next.pump_brand = matchedPump.pump_brand;
                            next.water_filter_pump_brand = matchedPump.pump_brand;
                            populatePumpElectricals(matchedPump, 'water_filter_pump', next);
                          }
                        }
                      }
                      handleFieldsChange(next);
                    }}
                    placeholder="Select Filter Model..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Number of Water Filters (Qty)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const next = Math.max(1, (Number(formData.no_of_water_filter) || 1) - 1);
                        handleFieldChange('no_of_water_filter', next);
                        handleFieldChange('no_of_water_filter_pump', next);
                      }}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 text-xs font-black transition-colors"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.no_of_water_filter !== undefined && formData.no_of_water_filter !== null ? formData.no_of_water_filter : ''}
                      placeholder="0"
                      onChange={(e) => {
                        handleFieldChange('no_of_water_filter', e.target.value);
                        handleFieldChange('no_of_water_filter_pump', e.target.value);
                      }}
                      className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = (Number(formData.no_of_water_filter) || 1) + 1;
                        handleFieldChange('no_of_water_filter', next);
                        handleFieldChange('no_of_water_filter_pump', next);
                      }}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-r-xl border border-l-0 border-slate-200 dark:border-slate-700 text-xs font-black transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Matching Circulation Pump Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Circulation Pump Brand
                  </label>
                  <SearchableSelect
                    options={circPumpBrandOptions}
                    value={formData.pump_brand || formData.water_filter_pump_brand || ''}
                    onChange={(val) => {
                      const next = {
                        pump_brand: val || '',
                        water_filter_pump_brand: val || ''
                      };
                      if (!val) {
                        next.water_filter_pump_code = '';
                        next.preferred_water_filter_pump = '';
                        next.water_filter_pump = '';
                        next.water_filter_pump_definition = '';
                      } else {
                        const circPumps = filterPumps.filter(p => 
                          String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
                          (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
                        );
                        const brandPumps = circPumps.filter(p => String(p.pump_brand) === String(val) || String(p.brand_id) === String(val));
                        if (brandPumps.length > 0) {
                          const selectedFilter = mediaFilters.find(f => String(f.id) === String(formData.water_filter_code || formData.preferred_water_filter));
                          const targetHp = Number(selectedFilter?.pump_hp || 0);
                          const sorted = [...brandPumps].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
                          const matched = targetHp > 0 
                            ? (sorted.find(p => Number(p.filter_pump_hp || 0) >= targetHp) || sorted[sorted.length - 1])
                            : sorted[0];
                          if (matched) {
                            next.water_filter_pump_code = matched.id;
                            next.preferred_water_filter_pump = matched.id;
                            next.water_filter_pump = matched.id;
                            populatePumpElectricals(matched, 'water_filter_pump', next);
                          }
                        }
                      }
                      handleFieldsChange(next);
                    }}
                    placeholder="Select Pump Brand..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Matching Circulation Pump Model
                  </label>
                  <SearchableSelect
                    options={filteredCircPumps.length > 0 ? filteredCircPumps : filterPumps.map(p => ({ id: p.id, label: `Circulation Pump ${p.filter_pump_hp || ''} HP`, item_id: p.item_id }))}
                    value={formData.water_filter_pump_code || ''}
                    onChange={(val) => {
                      const next = {
                        water_filter_pump_code: val || '',
                        preferred_water_filter_pump: val || '',
                        water_filter_pump: val || '',
                        water_filter_pump_definition: ''
                      };
                      if (val) {
                        const pObj = filterPumps.find(p => String(p.id) === String(val));
                        if (pObj) {
                          if (pObj.pump_brand) {
                            next.pump_brand = pObj.pump_brand;
                            next.water_filter_pump_brand = pObj.pump_brand;
                          }
                          populatePumpElectricals(pObj, 'water_filter_pump', next);
                        }
                      }
                      handleFieldsChange(next);
                    }}
                    placeholder="Select Pump Model..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Duty Pumps (Qty = Filters)
                  </label>
                  <input
                    type="number"
                    value={formData.no_of_water_filter_pump ?? 1}
                    onChange={(e) => handleFieldChange('no_of_water_filter_pump', e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Standby Pumps (Qty)
                  </label>
                  <input
                    type="number"
                    value={formData.no_of_water_filter_pump_stand_by ?? 0}
                    onChange={(e) => handleFieldChange('no_of_water_filter_pump_stand_by', e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Total Pumps (Duty + SB)
                  </label>
                  <div className="w-full bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800/80 rounded-xl px-3 py-2 text-xs font-mono font-black text-center text-violet-700 dark:text-violet-300">
                    {totalCircPumps} Total
                    <span className="text-[10px] text-violet-500 dark:text-violet-400 font-semibold block">
                      ({formData.no_of_water_filter_pump || 1} Duty + {formData.no_of_water_filter_pump_stand_by || 0} SB)
                    </span>
                  </div>
                </div>
              </div>

              {/* Comprehensive Circulation Pump Electrical & Containment Sizing Panel */}
              {totalCircPumps > 0 && selectedCircPump ? (
              <div className="p-4 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-800/50 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-200/60 dark:border-violet-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-xs font-black text-violet-900 dark:text-violet-100 uppercase tracking-wider">
                      Circulation Pump Electrical Infrastructure, Disconnect Switches, Cables & Containment
                    </span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-violet-700 dark:text-violet-300">
                    Motor: {selectedCircPump?.p_kw || '2.2'} kW ({selectedCircPump?.filter_pump_hp || '3.0'} HP) • {selectedCircPump?.operating_voltage ? `${selectedCircPump.operating_voltage}V` : '380V (3-Phase)'}
                  </div>
                </div>

                {/* 1. Rotary Isolator Disconnect Switches (Switch 1 & Switch 2) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-violet-600" />
                    <span>Local Rotary Isolator Disconnect Switches</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Disconnect Switch Type 01:
                      </label>
                      <SearchableSelect
                        options={disconnectSwitchOptions}
                        value={
                          (formData.water_filter_pump_disconnect_switches_types_one_id && formData.water_filter_pump_disconnect_switches_types_one_id !== 'fa7cbaaa-3b15-43f2-9cd0-76267473e749')
                            ? formData.water_filter_pump_disconnect_switches_types_one_id
                            : (selectedCircPump?.disconnect_switch_1 || formData.water_filter_pump_disconnect_switches_types_one_id || 'fa7cbaaa-3b15-43f2-9cd0-76267473e749')
                        }
                        onChange={(val) => handleFieldsChange({
                          water_filter_pump_disconnect_switches_types_one_id: val,
                          filtration_pump_disconnect_switches_types_one_id: val
                        })}
                        placeholder="Select Switch 01..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Switch 01 Qty (No.):
                      </label>
                      <input
                        type="number"
                        value={formData.filtration_pump_disconnect_switches_types_one_quantity_no ?? totalCircPumps}
                        onChange={(e) => handleFieldChange('filtration_pump_disconnect_switches_types_one_quantity_no', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Disconnect Switch Type 02 (Aux / Standby):
                      </label>
                      <SearchableSelect
                        options={[{ id: '', label: '-- None / Single Feed --' }, ...disconnectSwitchOptions]}
                        value={formData.water_filter_pump_disconnect_switches_types_two_id || formData.filtration_pump_disconnect_switches_types_two_id || selectedCircPump?.disconnect_switch_2 || ''}
                        onChange={(val) => handleFieldsChange({
                          water_filter_pump_disconnect_switches_types_two_id: val,
                          filtration_pump_disconnect_switches_types_two_id: val
                        })}
                        placeholder="Select Switch 02..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Switch 02 Qty (No.):
                      </label>
                      <input
                        type="number"
                        value={formData.filtration_pump_disconnect_switches_types_two_quantity_no ?? 0}
                        onChange={(e) => handleFieldChange('filtration_pump_disconnect_switches_types_two_quantity_no', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Power Feeding Cables & Glands (Cable 1 & Cable 2) */}
                <div className="space-y-1.5 pt-2 border-t border-violet-200/50 dark:border-violet-800/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-violet-600" />
                    <span>Power Feeding Cables & Submersible IP68 Glands</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Power Cable Type 01:
                      </label>
                      <SearchableSelect
                        options={cableOptions}
                        value={
                          (formData.water_filter_pump_electric_cable_type_01_id && formData.water_filter_pump_electric_cable_type_01_id !== '3378ce89-417d-4bd3-adc7-9ba9413553ae')
                            ? formData.water_filter_pump_electric_cable_type_01_id
                            : (selectedCircPump?.elec_cable_1_id || formData.water_filter_pump_electric_cable_type_01_id || '3378ce89-417d-4bd3-adc7-9ba9413553ae')
                        }
                        onChange={(val) => {
                          const next = {
                            water_filter_pump_electric_cable_type_01_id: val,
                            filtration_pump_electric_cable_type_01_id: val
                          };
                          populateCableAccessories(val, 'water_filter_pump', next);
                          handleFieldsChange(next);
                        }}
                        placeholder="Select Cable 01..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Cable 01 Length per Pump (m):
                      </label>
                      <input
                        type="number"
                        value={formData.water_filter_pump_electric_cable_type_01_length ?? 30}
                        onChange={(e) => {
                          handleFieldsChange({
                            water_filter_pump_electric_cable_type_01_length: e.target.value,
                            water_filter_pump_conduit_for_cable_type_01_length_m: e.target.value
                          });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Cable 01 Gland Type:
                      </label>
                      <SearchableSelect
                        options={glandOptions.length > 0 ? glandOptions : [{ id: '73e5eca3-396a-4318-a30b-cbbcc4a8f84a', label: 'HA2-20 S Submersible IP68 Gland' }]}
                        value={formData.water_filter_pump_electric_cable_type_01_gland_id || selectedCircPump?.elec_cable_1_gland || '73e5eca3-396a-4318-a30b-cbbcc4a8f84a'}
                        onChange={(val) => handleFieldsChange({
                          water_filter_pump_electric_cable_type_01_gland_id: val,
                          filtration_pump_electric_cable_type_01_gland_id: val
                        })}
                        placeholder="Select Gland 01..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Gland 01 Qty per Pump (No.):
                      </label>
                      <input
                        type="number"
                        value={formData.water_filter_pump_electric_cable_type_01_gland_quantity_no ?? 2}
                        onChange={(e) => handleFieldChange('water_filter_pump_electric_cable_type_01_gland_quantity_no', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Conduits, Adapters, Couplers & Straps (Separated Items & Quantities) */}
                <div className="space-y-2.5 pt-2 border-t border-violet-200/50 dark:border-violet-800/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-violet-600" />
                    <span>Conduit Infrastructure, Couplers, Adapters & Straps</span>
                  </span>
                  
                  {/* Row 1: Conduit Material, Sizing & Length */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Conduit Material / Category:
                      </label>
                      <select
                        value={formData.water_filter_pump_cable_type_01_conduit_type || 'Liquid Tight'}
                        onChange={(e) => {
                          const newMat = e.target.value;
                          const accs = getConduitAccessoriesForMaterial(newMat);
                          const next = {
                            water_filter_pump_cable_type_01_conduit_type: newMat
                          };
                          if (accs.conduits.length > 0) {
                            const match34 = accs.conduits.find(c => c.label.includes('3/4') || c.spec?.size === '3/4"') || accs.conduits[0];
                            next.water_filter_pump_cable_conduit_liquid_tight_type_01_id = match34.id;
                            next.water_filter_pump_recommended_conduit_for_type_01 = match34.id;
                          } else {
                            next.water_filter_pump_cable_conduit_liquid_tight_type_01_id = '';
                            next.water_filter_pump_recommended_conduit_for_type_01 = '';
                          }
                          if (accs.adapters.length > 0) {
                            const matchAd = accs.adapters.find(a => a.label.includes('3/4') || a.label.includes('20mm') || a.label.includes('25mm')) || accs.adapters[0];
                            next.water_filter_pump_recommended_conduit_adapter_for_type_01 = matchAd.id;
                            next.water_filter_pump_conduit_adapter_for_type_01_quantity_no = '2';
                          } else {
                            next.water_filter_pump_recommended_conduit_adapter_for_type_01 = '';
                            next.water_filter_pump_conduit_adapter_for_type_01_quantity_no = '0';
                          }
                          if (accs.couplers.length > 0) {
                            const matchCp = accs.couplers.find(c => c.label.includes('3/4') || c.label.includes('20mm') || c.label.includes('25mm')) || accs.couplers[0];
                            next.water_filter_pump_recommended_conduit_coupler_for_type_01 = matchCp.id;
                            next.water_filter_pump_conduit_coupler_for_type_01_quantity_no = '1';
                          } else {
                            next.water_filter_pump_recommended_conduit_coupler_for_type_01 = '';
                            next.water_filter_pump_conduit_coupler_for_type_01_quantity_no = '0';
                          }
                          if (accs.straps.length > 0) {
                            const matchSt = accs.straps.find(s => s.label.includes('3/4') || s.label.includes('20mm') || s.label.includes('25mm')) || accs.straps[0];
                            next.water_filter_pump_recommended_conduit_straps_for_type_01 = matchSt.id;
                            next.water_filter_pump_conduit_straps_for_type_01_quantity_no = '3';
                          } else {
                            next.water_filter_pump_recommended_conduit_straps_for_type_01 = '';
                            next.water_filter_pump_conduit_straps_for_type_01_quantity_no = '0';
                          }
                          const curCable = formData.water_filter_pump_electric_cable_type_01_id || selectedCircPump?.elec_cable_1_id;
                          if (curCable) {
                            populateCableAccessories(curCable, 'water_filter_pump', next, newMat);
                          }
                          handleFieldsChange(next);
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                      >
                        <option value="Liquid Tight">Liquid Tight</option>
                        <option value="EMT">EMT</option>
                        <option value="IMC">IMC</option>
                        <option value="RGS">RGS</option>
                        <option value="UPVC">UPVC</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Conduit Model & Size:
                      </label>
                      <SearchableSelect
                        options={circConduitAccs.conduits.length > 0 ? circConduitAccs.conduits : conduitOptions}
                        value={formData.water_filter_pump_cable_conduit_liquid_tight_type_01_id || formData.water_filter_pump_recommended_conduit_for_type_01 || '65e37519-39a2-49cf-97e3-0e791084ca45'}
                        onChange={(val) => {
                          handleFieldsChange({
                            water_filter_pump_cable_conduit_liquid_tight_type_01_id: val,
                            water_filter_pump_recommended_conduit_for_type_01: val
                          });
                        }}
                        placeholder="Select Conduit..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Conduit 01 Route Length per Pump (m) [Matches Cable 01]:
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formData.water_filter_pump_conduit_for_cable_type_01_length_m || formData.water_filter_pump_electric_cable_type_01_length || 30}
                        onChange={(e) => handleFieldChange('water_filter_pump_conduit_for_cable_type_01_length_m', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-center"
                      />
                    </div>
                  </div>

                  {/* Row 2: Separated Adapters, Couplers, and Straps with their Quantities */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* 1. Adapters */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-300 block">
                          Conduit Adapter
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Qty / Pump:</span>
                      </div>
                      <div className="space-y-1.5">
                        <SearchableSelect
                          options={circConduitAccs.adapters.length > 0 ? circConduitAccs.adapters : conduitAdapterOptions}
                          value={formData.water_filter_pump_recommended_conduit_adapter_for_type_01 || '752fdb9d-a15b-465d-8155-3f6462d07e8e'}
                          onChange={(val) => handleFieldChange('water_filter_pump_recommended_conduit_adapter_for_type_01', val)}
                          placeholder="Select Adapter..."
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-medium text-slate-500">Adapter Qty (No.):</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.water_filter_pump_conduit_adapter_for_type_01_quantity_no || 2}
                            onChange={(e) => handleFieldChange('water_filter_pump_conduit_adapter_for_type_01_quantity_no', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Couplers */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-300 block">
                          Conduit Coupler
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Qty / Pump:</span>
                      </div>
                      <div className="space-y-1.5">
                        <SearchableSelect
                          options={circConduitAccs.couplers.length > 0 ? circConduitAccs.couplers : conduitCouplerOptions}
                          value={formData.water_filter_pump_recommended_conduit_coupler_for_type_01 || ''}
                          onChange={(val) => handleFieldChange('water_filter_pump_recommended_conduit_coupler_for_type_01', val)}
                          placeholder={formData.water_filter_pump_cable_type_01_conduit_type === 'Liquid Tight' ? 'N/A for Liquid Tight (Flexible)' : 'Select Coupler...'}
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-medium text-slate-500">Coupler Qty (No.):</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.water_filter_pump_conduit_coupler_for_type_01_quantity_no ?? (formData.water_filter_pump_cable_type_01_conduit_type === 'Liquid Tight' ? 0 : 1)}
                            onChange={(e) => handleFieldChange('water_filter_pump_conduit_coupler_for_type_01_quantity_no', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Straps */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-300 block">
                          Conduit Strap
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Qty / Pump:</span>
                      </div>
                      <div className="space-y-1.5">
                        <SearchableSelect
                          options={circConduitAccs.straps.length > 0 ? circConduitAccs.straps : conduitStrapOptions}
                          value={formData.water_filter_pump_recommended_conduit_straps_for_type_01 || ''}
                          onChange={(val) => handleFieldChange('water_filter_pump_recommended_conduit_straps_for_type_01', val)}
                          placeholder="Select Straps..."
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-medium text-slate-500">Strap Qty (No.):</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.water_filter_pump_conduit_straps_for_type_01_quantity_no ?? (formData.water_filter_pump_cable_type_01_conduit_type === 'Liquid Tight' ? 0 : 3)}
                            onChange={(e) => handleFieldChange('water_filter_pump_conduit_straps_for_type_01_quantity_no', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Branch Cable Tray & Separated Support Fittings (Exact Database Columns) */}
                <div className="space-y-2.5 pt-2 border-t border-violet-200/50 dark:border-violet-800/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-800 dark:text-violet-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-violet-600" />
                    <span>Branch Cable Tray Containment & Individual Accessories (Unmerged Columns)</span>
                  </span>
                  
                  {/* Row 1: Tray Type & Length */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Branch Cable Tray Type:
                      </label>
                      <SearchableSelect
                        options={cableTrayOptions}
                        value={formData.water_filter_pump_branch_cable_tray_type_id || 'a8b1c9d4-8c88-4a33-95dc-9e56084b3dc0'}
                        onChange={(val) => handleFieldChange('water_filter_pump_branch_cable_tray_type_id', val)}
                        placeholder="Select Cable Tray..."
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                          Branch Cable Tray Length (m) [Height × Total Pumps]:
                        </label>
                        <span className="text-[9px] font-mono text-violet-600 dark:text-violet-400 font-bold">
                          {(Number(formData.pump_room_height_m) || 3)}m × {totalCircPumps} Pumps = {(Number(formData.pump_room_height_m) || 3) * totalCircPumps}m
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.water_filter_pump_branch_cable_tray_length ?? (isSkimfilter ? 0 : ((Number(formData.pump_room_height_m) || 3) * totalCircPumps))}
                        onChange={(e) => handleFieldChange('water_filter_pump_branch_cable_tray_length', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  {/* Row 2: Separated Individual Accessories with Dedicated Quantities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 text-xs">
                    {/* 1. 90° Elbow */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-300 block">
                        Cable Tray 90° Elbow
                      </label>
                      <SearchableSelect
                        options={trayElbowOptions.length > 0 ? trayElbowOptions : [{ id: '0ebdaaf7-0350-4f11-a7f9-ac95a72dde99', label: 'Cable Tray Elbow 90° 100mm' }]}
                        value={formData.water_filter_pump_cable_tray_elbow_90_id || '0ebdaaf7-0350-4f11-a7f9-ac95a72dde99'}
                        onChange={(val) => handleFieldChange('water_filter_pump_cable_tray_elbow_90_id', val)}
                        placeholder="Select Elbow..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.water_filter_pump_cable_tray_elbow_90_quantity_no ?? 1}
                          onChange={(e) => handleFieldChange('water_filter_pump_cable_tray_elbow_90_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 2. Splice Plate */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-300 block">
                        Splice Plate
                      </label>
                      <SearchableSelect
                        options={splicePlateOptions.length > 0 ? splicePlateOptions : [{ id: 'ac7ed164-c456-4f01-8334-a3d5bc4d804c', label: 'Splice plate' }]}
                        value={formData.water_filter_pump_splice_plate_type_id || 'ac7ed164-c456-4f01-8334-a3d5bc4d804c'}
                        onChange={(val) => handleFieldChange('water_filter_pump_splice_plate_type_id', val)}
                        placeholder="Select Splice Plate..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.water_filter_pump_splice_plate_type_quantity_m ?? 2}
                          onChange={(e) => handleFieldChange('water_filter_pump_splice_plate_type_quantity_m', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 3. C-Channel Support */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-300 block">
                        C-Channel Support
                      </label>
                      <SearchableSelect
                        options={cChannelOptions.length > 0 ? cChannelOptions : [{ id: '262ea9ff-a237-4d75-840b-54c0a0d304ba', label: 'C Channel (2cm*4cm)' }]}
                        value={formData.water_filter_pump_c_channel_type_id || '262ea9ff-a237-4d75-840b-54c0a0d304ba'}
                        onChange={(val) => handleFieldChange('water_filter_pump_c_channel_type_id', val)}
                        placeholder="Select C-Channel..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.water_filter_pump_c_channel_type_quantity_no ?? 2}
                          onChange={(e) => handleFieldChange('water_filter_pump_c_channel_type_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 4. END Cap */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-300 block">
                        END Cap
                      </label>
                      <SearchableSelect
                        options={endCapOptions.length > 0 ? endCapOptions : [{ id: 'b020d2c8-d214-4209-bfe4-dca2afd3456e', label: 'END Cap' }]}
                        value={formData.water_filter_pump_end_cap_type_id || 'b020d2c8-d214-4209-bfe4-dca2afd3456e'}
                        onChange={(val) => handleFieldChange('water_filter_pump_end_cap_type_id', val)}
                        placeholder="Select End Cap..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.water_filter_pump_end_cap_type_quantity_no ?? 2}
                          onChange={(e) => handleFieldChange('water_filter_pump_end_cap_type_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 5. Anchors */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-300 block">
                        Anchors
                      </label>
                      <SearchableSelect
                        options={anchorOptions.length > 0 ? anchorOptions : [{ id: '3dd3f13d-9db8-4542-8191-ff3ae2f25d8c', label: 'Anchors (10cm*10mm)' }]}
                        value={formData.water_filter_pump_anchors_type_id || '3dd3f13d-9db8-4542-8191-ff3ae2f25d8c'}
                        onChange={(val) => handleFieldChange('water_filter_pump_anchors_type_id', val)}
                        placeholder="Select Anchors..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.water_filter_pump_anchors_type_no ?? 4}
                          onChange={(e) => handleFieldChange('water_filter_pump_anchors_type_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 6. Offset Tee */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-violet-100 dark:border-violet-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-violet-700 dark:text-violet-300 block">
                        Offset Tee
                      </label>
                      <SearchableSelect
                        options={trayElbowOptions.length > 0 ? trayElbowOptions : [{ id: '2dee9412-29e8-473e-9c22-bb3b625161d8', label: 'Offset Tee' }]}
                        value={formData.water_filter_pump_offset_tee_type_id || '2dee9412-29e8-473e-9c22-bb3b625161d8'}
                        onChange={(val) => handleFieldChange('water_filter_pump_offset_tee_type_id', val)}
                        placeholder="Select Offset Tee..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.water_filter_pump_offset_tee_type_quantity_no ?? 1}
                          onChange={(e) => handleFieldChange('water_filter_pump_offset_tee_type_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-100/60 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700/70 rounded-2xl text-center py-6">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="font-black text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    No Circulation Pump Model Selected (or 0 Pumps)
                  </span>
                  <p className="text-[11px] text-slate-400 max-w-md">
                    Please select a Circulation Pump Model above. Its matching isolator switches, cables, glands, conduits, and branch containment will automatically activate.
                  </p>
                </div>
              </div>
            )}
            </div>

                        {/* ========================================================================= */}
            {/* 2. VACUUM MEDIA FILTERS & BOOSTER PUMPS WITH FULL ELECTRICALS             */}
            {/* ========================================================================= */}
            <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    2. Vacuum Media Filters & Matching Booster Pumps
                  </h4>
                </div>
                {selectedVacPump && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-sky-700 dark:text-sky-300">
                    <span>Vac Rating: <strong>{selectedVacPump.p_kw || '1.5'} kW ({selectedVacPump.filter_pump_hp || '2.0'} HP)</strong></span>
                    <span>•</span>
                    <span>Total: <strong>{totalVacPumps} Pumps ({formData.no_of_vacuum_filter_pump || 0} Duty + {formData.no_of_vacuum_filter_pump_stand_by || 0} SB)</strong></span>
                  </div>
                )}
              </div>

              {/* Vacuum Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Vacuum Filter Brand
                  </label>
                  <SearchableSelect
                    options={filterBrandOptions}
                    value={formData.vacuum_filter_brand || ''}
                    onChange={(val) => {
                      handleFieldChange('vacuum_filter_brand', val);
                      const matching = mediaFilters.filter(f => String(f.filter_brand) === String(val) || String(f.brand_id) === String(val));
                      if (matching.length > 0) {
                        handleFieldChange('vacuum_filter_diameter', matching[0].filter_dia || '');
                        handleFieldChange('vacuum_filter_code', matching[0].id);
                      }
                    }}
                    placeholder="Select Vacuum Brand..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Vacuum Filter Diameter
                  </label>
                  <SearchableSelect
                    options={availableVacFilterDiameters.length > 0 ? availableVacFilterDiameters : [{ id: '1050', label: 'Ø1050 mm' }, { id: '1200', label: 'Ø1200 mm' }]}
                    value={formData.vacuum_filter_diameter || ''}
                    onChange={(val) => {
                      handleFieldChange('vacuum_filter_diameter', val);
                      const matched = mediaFilters.find(f => 
                        (String(f.filter_brand) === String(formData.vacuum_filter_brand) || String(f.brand_id) === String(formData.vacuum_filter_brand)) &&
                        String(f.filter_dia) === String(val)
                      );
                      if (matched) {
                        handleFieldChange('vacuum_filter_code', matched.id);
                      }
                    }}
                    placeholder="Select Diameter..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Vacuum Filter Model
                  </label>
                  <SearchableSelect
                    options={filteredVacMediaFilters.length > 0 ? filteredVacMediaFilters : mediaFilters.map(f => ({ id: f.id, label: `Vacuum Filter Ø${f.filter_dia || '1050'}mm`, item_id: f.item_id }))}
                    value={formData.vacuum_filter_code || ''}
                    onChange={(val) => handleFieldChange('vacuum_filter_code', val)}
                    placeholder="Select Vacuum Filter..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Vacuum Filters (Qty)
                  </label>
                  <input
                    type="number"
                    value={formData.no_of_vacuum_filter || 0}
                    onChange={(e) => handleFieldChange('no_of_vacuum_filter', e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Vacuum Pump Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Vacuum Booster Pump Brand
                  </label>
                  <SearchableSelect
                    options={circPumpBrandOptions}
                    value={formData.vacuum_pump_brand || ''}
                    onChange={(val) => {
                      const next = { vacuum_pump_brand: val || '' };
                      if (!val) {
                        next.vacuum_filter_pump_code = '';
                      } else {
                        const circPumps = filterPumps.filter(p => 
                          String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
                          (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
                        );
                        const brandPumps = circPumps.filter(p => String(p.pump_brand) === String(val) || String(p.brand_id) === String(val));
                        if (brandPumps.length > 0) {
                          const selectedVacFilter = mediaFilters.find(f => String(f.id) === String(formData.vacuum_filter_code));
                          const targetHp = Number(selectedVacFilter?.pump_hp || 0) || 2.0;
                          const sorted = [...brandPumps].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
                          const matched = sorted.find(p => Number(p.filter_pump_hp || 0) >= targetHp) || sorted[sorted.length - 1];
                          if (matched) {
                            next.vacuum_filter_pump_code = matched.id;
                            next.vacuum_pump_brand = matched.pump_brand || val;
                            populatePumpElectricals(matched, 'vacuum_pump', next);
                          }
                        }
                      }
                      handleFieldsChange(next);
                    }}
                    placeholder="Select Pump Brand..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Matching Vacuum Booster Pump Model
                  </label>
                  <SearchableSelect
                    options={filteredVacPumps.length > 0 ? filteredVacPumps : filterPumps.map(p => ({ id: p.id, label: `Vacuum Pump ${p.filter_pump_hp || ''} HP`, item_id: p.item_id }))}
                    value={formData.vacuum_filter_pump_code || ''}
                    onChange={(val) => {
                      const next = { vacuum_filter_pump_code: val || '' };
                      if (val) {
                        const pObj = filterPumps.find(p => String(p.id) === String(val));
                        if (pObj) {
                          if (pObj.pump_brand) next.vacuum_pump_brand = pObj.pump_brand;
                          populatePumpElectricals(pObj, 'vacuum_pump', next);
                        }
                      }
                      handleFieldsChange(next);
                    }}
                    placeholder="Select Vacuum Pump..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Vac Duty Pumps (Qty)
                  </label>
                  <input
                    type="number"
                    value={formData.no_of_vacuum_filter_pump || 0}
                    onChange={(e) => handleFieldChange('no_of_vacuum_filter_pump', e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Vac Standby Pumps (Qty)
                  </label>
                  <input
                    type="number"
                    value={formData.no_of_vacuum_filter_pump_stand_by || 0}
                    onChange={(e) => handleFieldChange('no_of_vacuum_filter_pump_stand_by', e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Total Vac Pumps (Duty + SB)
                  </label>
                  <div className="w-full bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 rounded-xl px-3 py-2 text-xs font-mono font-black text-center text-sky-700 dark:text-sky-300">
                    {totalVacPumps} Total
                    <span className="text-[10px] text-sky-500 dark:text-sky-400 font-semibold block">
                      ({formData.no_of_vacuum_filter_pump || 0} Duty + {formData.no_of_vacuum_filter_pump_stand_by || 0} SB)
                    </span>
                  </div>
                </div>
              </div>

              {totalVacPumps > 0 && selectedVacPump ? (
              <div className="p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/50 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/60 dark:border-sky-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-black text-sky-900 dark:text-sky-100 uppercase tracking-wider">
                      Vacuum Booster Pump Electrical Specifications, Disconnect Switches & Containment
                    </span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-sky-700 dark:text-sky-300">
                    Rating: {selectedVacPump?.p_kw || '1.5'} kW ({selectedVacPump?.filter_pump_hp || '2.0'} HP) • {selectedVacPump?.operating_voltage ? `${selectedVacPump.operating_voltage}V` : '220V/380V'}
                  </div>
                </div>

                {/* 1. Rotary Isolator Disconnect Switches */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-sky-600" />
                    <span>Rotary Isolator Disconnect Switches (Local Safety Isolators)</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Rotary Isolator Switch 01:
                      </label>
                      <SearchableSelect
                        options={disconnectSwitchOptions}
                        value={
                          (formData.vacuum_pump_disconnect_switches_types_one_id && formData.vacuum_pump_disconnect_switches_types_one_id !== 'cb9e357d-c7c2-4803-b8ff-a5a17d8a13d9')
                            ? formData.vacuum_pump_disconnect_switches_types_one_id
                            : (selectedVacPump?.disconnect_switch_1 || formData.vacuum_pump_disconnect_switches_types_one_id || 'cb9e357d-c7c2-4803-b8ff-a5a17d8a13d9')
                        }
                        onChange={(val) => handleFieldChange('vacuum_pump_disconnect_switches_types_one_id', val)}
                        placeholder="Select Isolator Switch..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Isolator 01 Qty per Pump (No.):
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.vacuum_pump_disconnect_switches_types_one_quantity_no ?? 1}
                        onChange={(e) => handleFieldChange('vacuum_pump_disconnect_switches_types_one_quantity_no', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Power Feeding Cables & Submersible IP68 Glands */}
                <div className="space-y-1.5 pt-2 border-t border-sky-200/50 dark:border-sky-800/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-sky-600" />
                    <span>Power Feeding Cables & Submersible IP68 Glands</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Power Cable Type 01:
                      </label>
                      <SearchableSelect
                        options={cableOptions}
                        value={
                          (formData.vacuum_pump_electric_cable_type_01_id && formData.vacuum_pump_electric_cable_type_01_id !== '475decb5-e92b-4d55-b455-603ecec25095')
                            ? formData.vacuum_pump_electric_cable_type_01_id
                            : (selectedVacPump?.elec_cable_1_id || formData.vacuum_pump_electric_cable_type_01_id || '475decb5-e92b-4d55-b455-603ecec25095')
                        }
                        onChange={(val) => {
                          const next = { vacuum_pump_electric_cable_type_01_id: val };
                          populateCableAccessories(val, 'vacuum_pump', next);
                          handleFieldsChange(next);
                        }}
                        placeholder="Select Cable 01..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Cable 01 Length per Pump (m):
                      </label>
                      <input
                        type="number"
                        value={formData.vacuum_pump_electric_cable_type_01_length ?? 30}
                        onChange={(e) => {
                          handleFieldsChange({
                            vacuum_pump_electric_cable_type_01_length: e.target.value,
                            vacuum_pump_conduit_for_cable_type_01_length_m: e.target.value
                          });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Cable 01 Gland Type:
                      </label>
                      <SearchableSelect
                        options={glandOptions.length > 0 ? glandOptions : [{ id: '73e5eca3-396a-4318-a30b-cbbcc4a8f84a', label: 'HA2-20 S Submersible IP68 Gland' }]}
                        value={formData.vacuum_pump_electric_cable_type_01_gland_id || selectedVacPump?.elec_cable_1_gland || '73e5eca3-396a-4318-a30b-cbbcc4a8f84a'}
                        onChange={(val) => handleFieldChange('vacuum_pump_electric_cable_type_01_gland_id', val)}
                        placeholder="Select Gland 01..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Gland 01 Qty per Pump (No.):
                      </label>
                      <input
                        type="number"
                        value={formData.vacuum_pump_electric_cable_type_01_gland_quantity_no ?? 2}
                        onChange={(e) => handleFieldChange('vacuum_pump_electric_cable_type_01_gland_quantity_no', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Conduits, Adapters, Couplers & Straps (Material-Scoped) */}
                <div className="space-y-2.5 pt-2 border-t border-sky-200/50 dark:border-sky-800/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-sky-600" />
                    <span>Conduit Infrastructure, Couplers, Adapters & Straps</span>
                  </span>
                  
                  {/* Row 1: Conduit Material, Sizing & Length */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Conduit Material / Category:
                      </label>
                      <select
                        value={formData.vacuum_pump_cable_type_01_conduit_type || 'Liquid Tight'}
                        onChange={(e) => {
                          const newMat = e.target.value;
                          const accs = getConduitAccessoriesForMaterial(newMat);
                          const next = {
                            vacuum_pump_cable_type_01_conduit_type: newMat
                          };
                          if (accs.conduits.length > 0) {
                            const match34 = accs.conduits.find(c => c.label.includes('3/4') || c.spec?.size === '3/4"') || accs.conduits[0];
                            next.vacuum_pump_cable_conduit_liquid_tight_type_01_id = match34.id;
                            next.vacuum_pump_recommended_conduit_for_type_01 = match34.id;
                          } else {
                            next.vacuum_pump_cable_conduit_liquid_tight_type_01_id = '';
                            next.vacuum_pump_recommended_conduit_for_type_01 = '';
                          }
                          if (accs.adapters.length > 0) {
                            const matchAd = accs.adapters.find(a => a.label.includes('3/4') || a.label.includes('20mm') || a.label.includes('25mm')) || accs.adapters[0];
                            next.vacuum_pump_recommended_conduit_adapter_for_type_01 = matchAd.id;
                            next.vacuum_pump_conduit_adapter_for_type_01_quantity_no = '2';
                          } else {
                            next.vacuum_pump_recommended_conduit_adapter_for_type_01 = '';
                            next.vacuum_pump_conduit_adapter_for_type_01_quantity_no = '0';
                          }
                          if (accs.couplers.length > 0) {
                            const matchCp = accs.couplers.find(c => c.label.includes('3/4') || c.label.includes('20mm') || c.label.includes('25mm')) || accs.couplers[0];
                            next.vacuum_pump_recommended_conduit_coupler_for_type_01 = matchCp.id;
                            next.vacuum_pump_conduit_coupler_for_type_01_quantity_no = '1';
                          } else {
                            next.vacuum_pump_recommended_conduit_coupler_for_type_01 = '';
                            next.vacuum_pump_conduit_coupler_for_type_01_quantity_no = '0';
                          }
                          if (accs.straps.length > 0) {
                            const matchSt = accs.straps.find(s => s.label.includes('3/4') || s.label.includes('20mm') || s.label.includes('25mm')) || accs.straps[0];
                            next.vacuum_pump_recommended_conduit_straps_for_type_01 = matchSt.id;
                            next.vacuum_pump_conduit_straps_for_type_01_quantity_no = '3';
                          } else {
                            next.vacuum_pump_recommended_conduit_straps_for_type_01 = '';
                            next.vacuum_pump_conduit_straps_for_type_01_quantity_no = '0';
                          }
                          const curCable = formData.vacuum_pump_electric_cable_type_01_id || selectedVacPump?.elec_cable_1_id;
                          if (curCable) {
                            populateCableAccessories(curCable, 'vacuum_pump', next, newMat);
                          }
                          handleFieldsChange(next);
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                      >
                        <option value="Liquid Tight">Liquid Tight</option>
                        <option value="EMT">EMT</option>
                        <option value="IMC">IMC</option>
                        <option value="RGS">RGS</option>
                        <option value="UPVC">UPVC</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Conduit Model & Size:
                      </label>
                      <SearchableSelect
                        options={vacConduitAccs.conduits.length > 0 ? vacConduitAccs.conduits : conduitOptions}
                        value={formData.vacuum_pump_cable_conduit_liquid_tight_type_01_id || formData.vacuum_pump_recommended_conduit_for_type_01 || '65e37519-39a2-49cf-97e3-0e791084ca45'}
                        onChange={(val) => {
                          handleFieldsChange({
                            vacuum_pump_cable_conduit_liquid_tight_type_01_id: val,
                            vacuum_pump_recommended_conduit_for_type_01: val
                          });
                        }}
                        placeholder="Select Conduit..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Conduit 01 Route Length per Pump (m) [Matches Cable 01]:
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formData.vacuum_pump_conduit_for_cable_type_01_length_m || formData.vacuum_pump_electric_cable_type_01_length || 30}
                        onChange={(e) => handleFieldChange('vacuum_pump_conduit_for_cable_type_01_length_m', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-center"
                      />
                    </div>
                  </div>

                  {/* Row 2: Separated Adapters, Couplers, and Straps with their Quantities */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* 1. Adapters */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block">
                          Conduit Adapter
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Qty / Pump:</span>
                      </div>
                      <div className="space-y-1.5">
                        <SearchableSelect
                          options={vacConduitAccs.adapters.length > 0 ? vacConduitAccs.adapters : conduitAdapterOptions}
                          value={formData.vacuum_pump_recommended_conduit_adapter_for_type_01 || '752fdb9d-a15b-465d-8155-3f6462d07e8e'}
                          onChange={(val) => handleFieldChange('vacuum_pump_recommended_conduit_adapter_for_type_01', val)}
                          placeholder="Select Adapter..."
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-medium text-slate-500">Adapter Qty (No.):</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.vacuum_pump_conduit_adapter_for_type_01_quantity_no ?? 2}
                            onChange={(e) => handleFieldChange('vacuum_pump_conduit_adapter_for_type_01_quantity_no', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Couplers */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block">
                          Conduit Coupler
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Qty / Pump:</span>
                      </div>
                      <div className="space-y-1.5">
                        <SearchableSelect
                          options={vacConduitAccs.couplers.length > 0 ? vacConduitAccs.couplers : conduitCouplerOptions}
                          value={formData.vacuum_pump_recommended_conduit_coupler_for_type_01 || ''}
                          onChange={(val) => handleFieldChange('vacuum_pump_recommended_conduit_coupler_for_type_01', val)}
                          placeholder="Select Coupler..."
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-medium text-slate-500">Coupler Qty (No.):</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.vacuum_pump_conduit_coupler_for_type_01_quantity_no ?? (formData.vacuum_pump_cable_type_01_conduit_type === 'Liquid Tight' ? 0 : 1)}
                            onChange={(e) => handleFieldChange('vacuum_pump_conduit_coupler_for_type_01_quantity_no', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Straps */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block">
                          Conduit Strap
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Qty / Pump:</span>
                      </div>
                      <div className="space-y-1.5">
                        <SearchableSelect
                          options={vacConduitAccs.straps.length > 0 ? vacConduitAccs.straps : conduitStrapOptions}
                          value={formData.vacuum_pump_recommended_conduit_straps_for_type_01 || ''}
                          onChange={(val) => handleFieldChange('vacuum_pump_recommended_conduit_straps_for_type_01', val)}
                          placeholder="Select Straps..."
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-medium text-slate-500">Strap Qty (No.):</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.vacuum_pump_conduit_straps_for_type_01_quantity_no ?? (formData.vacuum_pump_cable_type_01_conduit_type === 'Liquid Tight' ? 0 : 3)}
                            onChange={(e) => handleFieldChange('vacuum_pump_conduit_straps_for_type_01_quantity_no', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Branch Cable Tray & Separated Support Fittings */}
                <div className="space-y-2.5 pt-2 border-t border-sky-200/50 dark:border-sky-800/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-sky-600" />
                    <span>Branch Cable Tray Containment & Individual Accessories (Unmerged Columns)</span>
                  </span>
                  
                  {/* Row 1: Tray Type & Length */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Branch Cable Tray Type:
                      </label>
                      <SearchableSelect
                        options={cableTrayOptions}
                        value={formData.vacuum_pump_branch_cable_tray_type_id || 'a8b1c9d4-8c88-4a33-95dc-9e56084b3dc0'}
                        onChange={(val) => handleFieldChange('vacuum_pump_branch_cable_tray_type_id', val)}
                        placeholder="Select Cable Tray..."
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                          Branch Cable Tray Length (m) [Height × Total Pumps]:
                        </label>
                        <span className="text-[9px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                          {(Number(formData.pump_room_height_m) || 3)}m × {totalVacPumps} Pumps = {(Number(formData.pump_room_height_m) || 3) * totalVacPumps}m
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.vacuum_pump_branch_cable_tray_length ?? (isSkimfilter ? 0 : ((Number(formData.pump_room_height_m) || 3) * totalVacPumps))}
                        onChange={(e) => handleFieldChange('vacuum_pump_branch_cable_tray_length', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  {/* Row 2: Separated Individual Accessories with Dedicated Quantities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 text-xs">
                    {/* 1. 90° Elbow */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block">
                        Cable Tray 90° Elbow
                      </label>
                      <SearchableSelect
                        options={trayElbowOptions.length > 0 ? trayElbowOptions : [{ id: '0ebdaaf7-0350-4f11-a7f9-ac95a72dde99', label: 'Cable Tray Elbow 90° 100mm' }]}
                        value={formData.vacuum_pump_cable_tray_elbow_90_id || '0ebdaaf7-0350-4f11-a7f9-ac95a72dde99'}
                        onChange={(val) => handleFieldChange('vacuum_pump_cable_tray_elbow_90_id', val)}
                        placeholder="Select Elbow..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.vacuum_pump_cable_tray_elbow_90_quantity_no ?? 1}
                          onChange={(e) => handleFieldChange('vacuum_pump_cable_tray_elbow_90_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 2. Splice Plate */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block">
                        Splice Plate
                      </label>
                      <SearchableSelect
                        options={splicePlateOptions.length > 0 ? splicePlateOptions : [{ id: 'ac7ed164-c456-4f01-8334-a3d5bc4d804c', label: 'Splice plate' }]}
                        value={formData.vacuum_pump_splice_plate_type_id || 'ac7ed164-c456-4f01-8334-a3d5bc4d804c'}
                        onChange={(val) => handleFieldChange('vacuum_pump_splice_plate_type_id', val)}
                        placeholder="Select Splice Plate..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.vacuum_pump_splice_plate_type_quantity_m ?? 2}
                          onChange={(e) => handleFieldChange('vacuum_pump_splice_plate_type_quantity_m', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 3. C-Channel Support */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block">
                        C-Channel Support
                      </label>
                      <SearchableSelect
                        options={cChannelOptions.length > 0 ? cChannelOptions : [{ id: '262ea9ff-a237-4d75-840b-54c0a0d304ba', label: 'C Channel (2cm*4cm)' }]}
                        value={formData.vacuum_pump_c_channel_type_id || '262ea9ff-a237-4d75-840b-54c0a0d304ba'}
                        onChange={(val) => handleFieldChange('vacuum_pump_c_channel_type_id', val)}
                        placeholder="Select C-Channel..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.vacuum_pump_c_channel_type_quantity_no ?? 2}
                          onChange={(e) => handleFieldChange('vacuum_pump_c_channel_type_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 4. END Cap */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block">
                        END Cap
                      </label>
                      <SearchableSelect
                        options={endCapOptions.length > 0 ? endCapOptions : [{ id: 'b020d2c8-d214-4209-bfe4-dca2afd3456e', label: 'END Cap' }]}
                        value={formData.vacuum_pump_end_cap_type_id || 'b020d2c8-d214-4209-bfe4-dca2afd3456e'}
                        onChange={(val) => handleFieldChange('vacuum_pump_end_cap_type_id', val)}
                        placeholder="Select End Cap..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.vacuum_pump_end_cap_type_quantity_no ?? 2}
                          onChange={(e) => handleFieldChange('vacuum_pump_end_cap_type_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 5. Anchors */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block">
                        Anchors
                      </label>
                      <SearchableSelect
                        options={anchorOptions.length > 0 ? anchorOptions : [{ id: '3dd3f13d-9db8-4542-8191-ff3ae2f25d8c', label: 'Anchors (10cm*10mm)' }]}
                        value={formData.vacuum_pump_anchors_type_id || '3dd3f13d-9db8-4542-8191-ff3ae2f25d8c'}
                        onChange={(val) => handleFieldChange('vacuum_pump_anchors_type_id', val)}
                        placeholder="Select Anchors..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.vacuum_pump_anchors_type_no ?? 4}
                          onChange={(e) => handleFieldChange('vacuum_pump_anchors_type_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 6. Offset Tee */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-sky-700 dark:text-sky-300 block">
                        Offset Tee
                      </label>
                      <SearchableSelect
                        options={trayElbowOptions.length > 0 ? trayElbowOptions : [{ id: '2dee9412-29e8-473e-9c22-bb3b625161d8', label: 'Offset Tee' }]}
                        value={formData.vacuum_pump_offset_tee_type_id || '2dee9412-29e8-473e-9c22-bb3b625161d8'}
                        onChange={(val) => handleFieldChange('vacuum_pump_offset_tee_type_id', val)}
                        placeholder="Select Offset Tee..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.vacuum_pump_offset_tee_type_quantity_no ?? 1}
                          onChange={(e) => handleFieldChange('vacuum_pump_offset_tee_type_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-100/60 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700/70 rounded-2xl text-center py-6">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="font-black text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    No Vacuum Booster Pumps Configured (0 Pumps)
                  </span>
                  <p className="text-[11px] text-slate-400 max-w-md">
                    Isolator switches, power feeding cables, conduits, adapters, and branch containment will automatically activate once vacuum pump quantity &gt; 0.
                  </p>
                </div>
              </div>
            )}
            </div>

            {/* ========================================================================= */}
            {/* 3. DRAINAGE CHAMBERS & SUBMERSIBLE PIT PUMPS WITH FULL ELECTRICALS        */}
            {/* ========================================================================= */}
            <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {isSkimfilter ? '3. Drainage Chambers & Submersible Drainage Pumps (Skimfilters)' : '3. Pump Room Sump Pit & Submersible Drainage Pumps'}
                  </h4>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isSkimfilter ? (
                    <span className="text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                      Skimfilter Rule: {Number(formData.no_of_water_filter || 0) >= 12 ? `floor(${formData.no_of_water_filter || 0} / 12) = ${formData.drainage_chamber || 0} Chambers` : '<12 Filters → 0 Chambers'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                      Pump Room Rule: 1 Submersible Sump Pump per Pump Room ({formData.no_pump_rooms || 1} PR)
                    </span>
                  )}
                  {selectedSubPump && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                      <span>•</span>
                      <span>Submersible: <strong>{selectedSubPump.p_kw || '0.75'} kW ({selectedSubPump.filter_pump_hp || '1.0'} HP)</strong></span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`grid grid-cols-1 sm:grid-cols-2 ${isSkimfilter ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
                {isSkimfilter && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Drainage Chamber (2m x 2m x 2m Qty)
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('drainage_chamber', Math.max(0, (Number(formData.drainage_chamber) || 0) - 1))}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 text-xs font-black transition-colors"
                      >
                        —
                      </button>
                      <input
                        type="number"
                        value={formData.drainage_chamber ?? 0}
                        onChange={(e) => handleFieldChange('drainage_chamber', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange('drainage_chamber', (Number(formData.drainage_chamber) || 0) + 1)}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-r-xl border border-l-0 border-slate-200 dark:border-slate-700 text-xs font-black transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Submersible Pump Brand
                  </label>
                  <SearchableSelect
                    options={subPumpBrandOptions}
                    value={formData.submersible_pump_brand === 'fe7c3a44-3e9d-4a32-8831-d47a042826ee' ? 'Pedrollo' : (formData.submersible_pump_brand === '2d99b439-f9f7-47a9-9202-ed7d94a5ca26' ? 'EBARA' : (formData.submersible_pump_brand || ''))}
                    onChange={(val) => {
                      const brandName = val === 'fe7c3a44-3e9d-4a32-8831-d47a042826ee' ? 'Pedrollo' : (val === '2d99b439-f9f7-47a9-9202-ed7d94a5ca26' ? 'EBARA' : (val || ''));
                      const next = { submersible_pump_brand: brandName };
                      if (!brandName) {
                        next.submersible_pump_code = '';
                      } else {
                        // Ensure qty is at least 1 when user explicitly selects a brand
                        const currentQty = Number(formData.no_of_submersible_pump || formData.submersible_pump_qty || 0);
                        if (currentQty <= 0) {
                          next.no_of_submersible_pump = '1';
                          next.submersible_pump_qty = '1';
                        }
                        const targetVal = brandName.toLowerCase();
                        const subPumps = filterPumps.filter(p => {
                          const pBrand = String(p.pump_brand || p.brand_id || '').toLowerCase();
                          const isSub = (
                            String(p.item_category) === '6b8ed887-6fc1-4bc4-be82-9964255679a5' ||
                            String(p.filter_pump_code || '').toUpperCase().startsWith('DW') ||
                            String(p.filter_pump_code || '').toUpperCase().startsWith('MC') ||
                            String(p.filter_pump_code || '').toUpperCase().startsWith('TOP') ||
                            String(p.filter_pump_hp || '') !== ''
                          );
                          return isSub && (
                            pBrand === targetVal || 
                            pBrand.includes(targetVal) || 
                            (targetVal.includes('pedrollo') && pBrand.includes('fe7c3a44')) || 
                            (targetVal.includes('ebara') && pBrand.includes('2d99b439')) ||
                            (targetVal.includes('fe7c3a44') && pBrand.includes('fe7c3a44')) ||
                            (targetVal.includes('2d99b439') && pBrand.includes('2d99b439'))
                          );
                        });

                        if (subPumps.length > 0) {
                          const sorted = [...subPumps].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
                          const matched = sorted[0];
                          if (matched) {
                            next.submersible_pump_code = matched.id;
                            populatePumpElectricals(matched, 'submersible_pump', next);
                          }
                        }
                      }
                      handleFieldsChange(next);
                    }}
                    placeholder="Select Pump Brand..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Submersible Drainage Pump Model
                  </label>
                  <SearchableSelect
                    options={filteredSubPumps.length > 0 ? filteredSubPumps : filterPumps.map(p => ({ id: p.id, label: `Submersible Pump ${p.filter_pump_hp || ''} HP`, item_id: p.item_id }))}
                    value={formData.submersible_pump_code || ''}
                    onChange={(val) => {
                      const next = { submersible_pump_code: val || '' };
                      if (val) {
                        const pObj = filterPumps.find(p => String(p.id) === String(val));
                        if (pObj) {
                          if (pObj.pump_brand) next.submersible_pump_brand = pObj.pump_brand;
                          populatePumpElectricals(pObj, 'submersible_pump', next);
                        }
                      }
                      handleFieldsChange(next);
                    }}
                    placeholder="Select Submersible Drainage Pump..."
                  />
                </div>

                {/* Interactive Counter for No. of Submersible Pumps */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    No. of Submersible Pumps
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('no_of_submersible_pump', Math.max(0, (Number(formData.no_of_submersible_pump || formData.submersible_pump_qty) || 0) - 1))}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-l-xl border border-r-0 border-slate-200 dark:border-slate-700 text-xs font-black transition-colors"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.no_of_submersible_pump ?? formData.submersible_pump_qty ?? 0}
                      onChange={(e) => handleFieldChange('no_of_submersible_pump', e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('no_of_submersible_pump', (Number(formData.no_of_submersible_pump || formData.submersible_pump_qty) || 0) + 1)}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-r-xl border border-l-0 border-slate-200 dark:border-slate-700 text-xs font-black transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {totalSubPumps > 0 && selectedSubPump ? (
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-wider">
                      Submersible Sump Pump Electrical Specifications, Disconnect Switches & Containment
                    </span>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    Rating: {selectedSubPump?.p_kw || '0.75'} kW ({selectedSubPump?.filter_pump_hp || '1.0'} HP) • {selectedSubPump?.operating_voltage ? `${selectedSubPump.operating_voltage}V` : '220V (1-Phase)'}
                  </div>
                </div>

                {/* 1. Rotary Isolator Disconnect Switches */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Rotary Isolator Disconnect Switches (Local Safety Isolators)</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Rotary Isolator Switch 01:
                      </label>
                      <SearchableSelect
                        options={disconnectSwitchOptions}
                        value={
                          (formData.submersible_pump_disconnect_switches_types_one_id && formData.submersible_pump_disconnect_switches_types_one_id !== '222ec164-1dae-4cef-a984-fb449450442f')
                            ? formData.submersible_pump_disconnect_switches_types_one_id
                            : (selectedSubPump?.disconnect_switch_1 || formData.submersible_pump_disconnect_switches_types_one_id || '222ec164-1dae-4cef-a984-fb449450442f')
                        }
                        onChange={(val) => handleFieldChange('submersible_pump_disconnect_switches_types_one_id', val)}
                        placeholder="Select Isolator Switch..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Isolator 01 Qty per Pump (No.):
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.submersible_pump_disconnect_switches_types_one_quantity_no ?? 1}
                        onChange={(e) => handleFieldChange('submersible_pump_disconnect_switches_types_one_quantity_no', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Power Feeding Cables & Submersible IP68 Glands */}
                <div className="space-y-1.5 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Power Feeding Cables & Submersible IP68 Glands</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Power Cable Type 01:
                      </label>
                      <SearchableSelect
                        options={cableOptions}
                        value={
                          (formData.submersible_pump_electric_cable_type_01_id && formData.submersible_pump_electric_cable_type_01_id !== '3378ce89-417d-4bd3-adc7-9ba9413553ae')
                            ? formData.submersible_pump_electric_cable_type_01_id
                            : (selectedSubPump?.elec_cable_1_id || formData.submersible_pump_electric_cable_type_01_id || '1fa7ea2b-5573-436f-9b57-1951566e16ab')
                        }
                        onChange={(val) => {
                          const next = { submersible_pump_electric_cable_type_01_id: val };
                          populateCableAccessories(val, 'submersible_pump', next);
                          handleFieldsChange(next);
                        }}
                        placeholder="Select Cable 01..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Cable 01 Length per Pump (m):
                      </label>
                      <input
                        type="number"
                        value={formData.submersible_pump_electric_cable_type_01_length ?? 30}
                        onChange={(e) => {
                          handleFieldsChange({
                            submersible_pump_electric_cable_type_01_length: e.target.value,
                            submersible_pump_conduit_for_cable_type_01_length_m: e.target.value
                          });
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Cable 01 Gland Type:
                      </label>
                      <SearchableSelect
                        options={glandOptions.length > 0 ? glandOptions : [{ id: '73e5eca3-396a-4318-a30b-cbbcc4a8f84a', label: 'HA2-20 S Submersible IP68 Gland' }]}
                        value={formData.submersible_pump_electric_cable_type_01_gland_id || selectedSubPump?.elec_cable_1_gland || '73e5eca3-396a-4318-a30b-cbbcc4a8f84a'}
                        onChange={(val) => handleFieldChange('submersible_pump_electric_cable_type_01_gland_id', val)}
                        placeholder="Select Gland 01..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Gland 01 Qty per Pump (No.):
                      </label>
                      <input
                        type="number"
                        value={formData.submersible_pump_electric_cable_type_01_gland_quantity_no ?? 2}
                        onChange={(e) => handleFieldChange('submersible_pump_electric_cable_type_01_gland_quantity_no', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Conduits, Adapters, Couplers & Straps (Material-Scoped) */}
                <div className="space-y-2.5 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Conduit Infrastructure, Couplers, Adapters & Straps</span>
                  </span>
                  
                  {/* Row 1: Conduit Material, Sizing & Length */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Conduit Material / Category:
                      </label>
                      <select
                        value={formData.submersible_pump_cable_type_01_conduit_type || 'Liquid Tight'}
                        onChange={(e) => {
                          const newMat = e.target.value;
                          const accs = getConduitAccessoriesForMaterial(newMat);
                          const next = {
                            submersible_pump_cable_type_01_conduit_type: newMat
                          };
                          if (accs.conduits.length > 0) {
                            const match34 = accs.conduits.find(c => c.label.includes('3/4') || c.spec?.size === '3/4"') || accs.conduits[0];
                            next.submersible_pump_cable_conduit_liquid_tight_type_01_id = match34.id;
                            next.submersible_pump_recommended_conduit_for_type_01 = match34.id;
                          } else {
                            next.submersible_pump_cable_conduit_liquid_tight_type_01_id = '';
                            next.submersible_pump_recommended_conduit_for_type_01 = '';
                          }
                          if (accs.adapters.length > 0) {
                            const matchAd = accs.adapters.find(a => a.label.includes('3/4') || a.label.includes('20mm') || a.label.includes('25mm')) || accs.adapters[0];
                            next.submersible_pump_recommended_conduit_adapter_for_type_01 = matchAd.id;
                            next.submersible_pump_conduit_adapter_for_type_01_quantity_no = '2';
                          } else {
                            next.submersible_pump_recommended_conduit_adapter_for_type_01 = '';
                            next.submersible_pump_conduit_adapter_for_type_01_quantity_no = '0';
                          }
                          if (accs.couplers.length > 0) {
                            const matchCp = accs.couplers.find(c => c.label.includes('3/4') || c.label.includes('20mm') || c.label.includes('25mm')) || accs.couplers[0];
                            next.submersible_pump_recommended_conduit_coupler_for_type_01 = matchCp.id;
                            next.submersible_pump_conduit_coupler_for_type_01_quantity_no = '1';
                          } else {
                            next.submersible_pump_recommended_conduit_coupler_for_type_01 = '';
                            next.submersible_pump_conduit_coupler_for_type_01_quantity_no = '0';
                          }
                          if (accs.straps.length > 0) {
                            const matchSt = accs.straps.find(s => s.label.includes('3/4') || s.label.includes('20mm') || s.label.includes('25mm')) || accs.straps[0];
                            next.submersible_pump_recommended_conduit_straps_for_type_01 = matchSt.id;
                            next.submersible_pump_conduit_straps_for_type_01_quantity_no = '3';
                          } else {
                            next.submersible_pump_recommended_conduit_straps_for_type_01 = '';
                            next.submersible_pump_conduit_straps_for_type_01_quantity_no = '0';
                          }
                          const curCable = formData.submersible_pump_electric_cable_type_01_id || selectedSubPump?.elec_cable_1_id;
                          if (curCable) {
                            populateCableAccessories(curCable, 'submersible_pump', next, newMat);
                          }
                          handleFieldsChange(next);
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                      >
                        <option value="Liquid Tight">Liquid Tight</option>
                        <option value="EMT">EMT</option>
                        <option value="IMC">IMC</option>
                        <option value="RGS">RGS</option>
                        <option value="UPVC">UPVC</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Conduit Model & Size:
                      </label>
                      <SearchableSelect
                        options={subConduitAccs.conduits.length > 0 ? subConduitAccs.conduits : conduitOptions}
                        value={formData.submersible_pump_cable_conduit_liquid_tight_type_01_id || formData.submersible_pump_recommended_conduit_for_type_01 || '65e37519-39a2-49cf-97e3-0e791084ca45'}
                        onChange={(val) => {
                          handleFieldsChange({
                            submersible_pump_cable_conduit_liquid_tight_type_01_id: val,
                            submersible_pump_recommended_conduit_for_type_01: val
                          });
                        }}
                        placeholder="Select Conduit..."
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Conduit 01 Route Length per Pump (m) [Matches Cable 01]:
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={formData.submersible_pump_conduit_for_cable_type_01_length_m || formData.submersible_pump_electric_cable_type_01_length || 30}
                        onChange={(e) => handleFieldChange('submersible_pump_conduit_for_cable_type_01_length_m', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-center"
                      />
                    </div>
                  </div>

                  {/* Row 2: Separated Adapters, Couplers, and Straps with their Quantities */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* 1. Adapters */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                          Conduit Adapter
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Qty / Pump:</span>
                      </div>
                      <div className="space-y-1.5">
                        <SearchableSelect
                          options={subConduitAccs.adapters.length > 0 ? subConduitAccs.adapters : conduitAdapterOptions}
                          value={formData.submersible_pump_recommended_conduit_adapter_for_type_01 || '752fdb9d-a15b-465d-8155-3f6462d07e8e'}
                          onChange={(val) => handleFieldChange('submersible_pump_recommended_conduit_adapter_for_type_01', val)}
                          placeholder="Select Adapter..."
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-medium text-slate-500">Adapter Qty (No.):</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.submersible_pump_conduit_adapter_for_type_01_quantity_no ?? 2}
                            onChange={(e) => handleFieldChange('submersible_pump_conduit_adapter_for_type_01_quantity_no', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Couplers */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                          Conduit Coupler
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Qty / Pump:</span>
                      </div>
                      <div className="space-y-1.5">
                        <SearchableSelect
                          options={subConduitAccs.couplers.length > 0 ? subConduitAccs.couplers : conduitCouplerOptions}
                          value={formData.submersible_pump_recommended_conduit_coupler_for_type_01 || ''}
                          onChange={(val) => handleFieldChange('submersible_pump_recommended_conduit_coupler_for_type_01', val)}
                          placeholder="Select Coupler..."
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-medium text-slate-500">Coupler Qty (No.):</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.submersible_pump_conduit_coupler_for_type_01_quantity_no ?? (formData.submersible_pump_cable_type_01_conduit_type === 'Liquid Tight' ? 0 : 1)}
                            onChange={(e) => handleFieldChange('submersible_pump_conduit_coupler_for_type_01_quantity_no', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Straps */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                          Conduit Strap
                        </label>
                        <span className="text-[10px] font-bold text-slate-400">Qty / Pump:</span>
                      </div>
                      <div className="space-y-1.5">
                        <SearchableSelect
                          options={subConduitAccs.straps.length > 0 ? subConduitAccs.straps : conduitStrapOptions}
                          value={formData.submersible_pump_recommended_conduit_straps_for_type_01 || ''}
                          onChange={(val) => handleFieldChange('submersible_pump_recommended_conduit_straps_for_type_01', val)}
                          placeholder="Select Straps..."
                        />
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-medium text-slate-500">Strap Qty (No.):</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={formData.submersible_pump_conduit_straps_for_type_01_quantity_no ?? (formData.submersible_pump_cable_type_01_conduit_type === 'Liquid Tight' ? 0 : 3)}
                            onChange={(e) => handleFieldChange('submersible_pump_conduit_straps_for_type_01_quantity_no', e.target.value)}
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Branch Cable Tray & Separated Support Fittings */}
                <div className="space-y-2.5 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/30">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Branch Cable Tray Containment & Individual Accessories (Unmerged Columns)</span>
                  </span>
                  
                  {/* Row 1: Tray Type & Length */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50/80 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                        Branch Cable Tray Type:
                      </label>
                      <SearchableSelect
                        options={cableTrayOptions}
                        value={formData.submersible_pump_branch_cable_tray_type_id || 'a8b1c9d4-8c88-4a33-95dc-9e56084b3dc0'}
                        onChange={(val) => handleFieldChange('submersible_pump_branch_cable_tray_type_id', val)}
                        placeholder="Select Cable Tray..."
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                          Branch Cable Tray Length (m) [Height × Total Pumps]:
                        </label>
                        <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {(Number(formData.pump_room_height_m) || 3)}m × {totalSubPumps} Pumps = {(Number(formData.pump_room_height_m) || 3) * totalSubPumps}m
                        </span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.submersible_pump_branch_cable_tray_length ?? (isSkimfilter ? 0 : ((Number(formData.pump_room_height_m) || 3) * totalSubPumps))}
                        onChange={(e) => handleFieldChange('submersible_pump_branch_cable_tray_length', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                      />
                    </div>
                  </div>

                  {/* Row 2: Separated Individual Accessories with Dedicated Quantities */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 text-xs">
                    {/* 1. 90° Elbow */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                        Cable Tray 90° Elbow
                      </label>
                      <SearchableSelect
                        options={trayElbowOptions.length > 0 ? trayElbowOptions : [{ id: '0ebdaaf7-0350-4f11-a7f9-ac95a72dde99', label: 'Cable Tray Elbow 90° 100mm' }]}
                        value={formData.submersible_pump_cable_tray_elbow_90_id || '0ebdaaf7-0350-4f11-a7f9-ac95a72dde99'}
                        onChange={(val) => handleFieldChange('submersible_pump_cable_tray_elbow_90_id', val)}
                        placeholder="Select Elbow..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.submersible_pump_cable_tray_elbow_90_quantity_no ?? 1}
                          onChange={(e) => handleFieldChange('submersible_pump_cable_tray_elbow_90_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 2. Splice Plate */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                        Splice Plate
                      </label>
                      <SearchableSelect
                        options={splicePlateOptions.length > 0 ? splicePlateOptions : [{ id: 'ac7ed164-c456-4f01-8334-a3d5bc4d804c', label: 'Splice plate' }]}
                        value={formData.submersible_pump_splice_plate_type_id || 'ac7ed164-c456-4f01-8334-a3d5bc4d804c'}
                        onChange={(val) => handleFieldChange('submersible_pump_splice_plate_type_id', val)}
                        placeholder="Select Splice Plate..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.submersible_pump_splice_plate_type_quantity_m ?? 2}
                          onChange={(e) => handleFieldChange('submersible_pump_splice_plate_type_quantity_m', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 3. C-Channel Support */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                        C-Channel Support
                      </label>
                      <SearchableSelect
                        options={cChannelOptions.length > 0 ? cChannelOptions : [{ id: '262ea9ff-a237-4d75-840b-54c0a0d304ba', label: 'C Channel (2cm*4cm)' }]}
                        value={formData.submersible_pump_c_channel_type_id || '262ea9ff-a237-4d75-840b-54c0a0d304ba'}
                        onChange={(val) => handleFieldChange('submersible_pump_c_channel_type_id', val)}
                        placeholder="Select C-Channel..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.submersible_pump_c_channel_type_quantity_no ?? 2}
                          onChange={(e) => handleFieldChange('submersible_pump_c_channel_type_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 4. END Cap */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                        END Cap
                      </label>
                      <SearchableSelect
                        options={endCapOptions.length > 0 ? endCapOptions : [{ id: 'b020d2c8-d214-4209-bfe4-dca2afd3456e', label: 'END Cap' }]}
                        value={formData.submersible_pump_end_cap_type_id || 'b020d2c8-d214-4209-bfe4-dca2afd3456e'}
                        onChange={(val) => handleFieldChange('submersible_pump_end_cap_type_id', val)}
                        placeholder="Select End Cap..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.submersible_pump_end_cap_type_quantity_no ?? 2}
                          onChange={(e) => handleFieldChange('submersible_pump_end_cap_type_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 5. Anchors */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                        Anchors
                      </label>
                      <SearchableSelect
                        options={anchorOptions.length > 0 ? anchorOptions : [{ id: '3dd3f13d-9db8-4542-8191-ff3ae2f25d8c', label: 'Anchors (10cm*10mm)' }]}
                        value={formData.submersible_pump_anchors_type_id || '3dd3f13d-9db8-4542-8191-ff3ae2f25d8c'}
                        onChange={(val) => handleFieldChange('submersible_pump_anchors_type_id', val)}
                        placeholder="Select Anchors..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.submersible_pump_anchors_type_no ?? 4}
                          onChange={(e) => handleFieldChange('submersible_pump_anchors_type_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>

                    {/* 6. Offset Tee */}
                    <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block">
                        Offset Tee
                      </label>
                      <SearchableSelect
                        options={trayElbowOptions.length > 0 ? trayElbowOptions : [{ id: '2dee9412-29e8-473e-9c22-bb3b625161d8', label: 'Offset Tee' }]}
                        value={formData.submersible_pump_offset_tee_type_id || '2dee9412-29e8-473e-9c22-bb3b625161d8'}
                        onChange={(val) => handleFieldChange('submersible_pump_offset_tee_type_id', val)}
                        placeholder="Select Offset Tee..."
                      />
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-medium text-slate-500">Qty (No.):</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.submersible_pump_offset_tee_type_quantity_no ?? 1}
                          onChange={(e) => handleFieldChange('submersible_pump_offset_tee_type_quantity_no', e.target.value)}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-100/60 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700/70 rounded-2xl text-center py-6">
                <div className="flex flex-col items-center justify-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-slate-400" />
                  </div>
                  <span className="font-black text-xs text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    No Submersible Drainage Pumps Configured (0 Pumps)
                  </span>
                  <p className="text-[11px] text-slate-400 max-w-md">
                    Isolator switches, power feeding cables, conduits, and accessories will automatically activate once submersible pump quantity &gt; 0.
                  </p>
                </div>
              </div>
            )}
            </div>

            {/* ========================================================================= */}
            {/* 4. SUB-TAB 1 REAL BOQ BREAKDOWN TABLES (SPLIT BY DISCIPLINE / WORK TYPE)  */}
            {/* ========================================================================= */}
            <div className="space-y-6">
              {/* Grand Summary Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:to-slate-900 text-white rounded-3xl shadow-md border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20" />
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                      <span>Sub-Tab 1 BOQ Breakdown Summary</span>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {subTab1BoqItems.length} Real Line Items
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Auto-calculated BOQ items divided into Mechanical Equipment and Electrical & Containment infrastructure.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-200 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    <span>Mechanical: {subTab1MechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Electrical: {subTab1ElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm shadow-sm flex items-center gap-2">
                    <span>Subtotal:</span>
                    <span>{subTab1TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                  </div>
                </div>
              </div>

              {/* TABLE 1: MECHANICAL WORKS BREAKDOWN */}
              <div className="p-5 bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/50 rounded-3xl space-y-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-200/60 dark:border-teal-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-teal-950 dark:text-teal-200 uppercase tracking-wider flex items-center gap-2">
                        <span>1. Mechanical Equipment & Filtration Works</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                          {subTab1BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical').length} Items
                        </span>
                      </h4>
                      <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80">
                        Sand media filters, circulation pumps, vacuum pumps, submersible pumps, and plumbing accessories.
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-black text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-3 py-1 rounded-xl border border-teal-300/50 dark:border-teal-700/50">
                    Mechanical Subtotal: {subTab1MechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-teal-200/80 dark:border-teal-800/80 bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-teal-50 dark:bg-teal-950/60 text-[10px] font-black uppercase tracking-wider text-teal-900 dark:text-teal-300 border-b border-teal-200 dark:border-teal-800">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3 min-w-[280px]">Mechanical Item & Specification</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                        <th className="py-2.5 px-3 text-center">Discipline</th>
                        <th className="py-2.5 px-3 text-center">Activity</th>
                        <th className="py-2.5 px-3 text-right">Base Qty</th>
                        <th className="py-2.5 px-3 text-right">Extra %</th>
                        <th className="py-2.5 px-3 text-right">Final Qty</th>
                        <th className="py-2.5 px-3 text-center">Unit</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                      {subTab1BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical').length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-6 text-center text-slate-400 font-sans">
                            No mechanical items populated.
                          </td>
                        </tr>
                      ) : (
                        subTab1BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical').map((item, idx) => {
                          const itemName = STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item_name || item.item || 'Item Description';
                          const isProc = (item.activity_type || '').toLowerCase() === 'procurement';
                          return (
                            <tr key={item.id || item.item || idx} className="hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-sans">
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 inline-block">
                                  {item.work_main_category || item.main_category || 'Mechanical'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                  Mechanical
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                  {item.activity_type || 'Procurement'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right pr-4 font-black text-teal-700 dark:text-teal-300 whitespace-nowrap">
                                {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-teal-50/80 dark:bg-teal-950/60 border-t-2 border-teal-200 dark:border-teal-800 text-xs font-mono font-bold">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 font-sans text-teal-950 dark:text-teal-200">
                          Mechanical Equipment Total ({subTab1BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical').length} items)
                        </td>
                        <td colSpan={4} className="py-3 px-3 text-right text-teal-700 dark:text-teal-400">
                          Mechanical Subtotal:
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-teal-700 dark:text-teal-300 text-sm">
                          {subTab1MechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* TABLE 2: ELECTRICAL & CONTAINMENT WORKS BREAKDOWN */}
              <div className="p-5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 rounded-3xl space-y-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                        <span>2. Electrical Power, Cables & Containment Infrastructure</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          {subTab1BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'electrical').length} Items
                        </span>
                      </h4>
                      <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                        Power feeding cables, rotary isolators, cable glands, conduit infrastructure, and branch cable tray fittings.
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/60 px-3 py-1 rounded-xl border border-amber-300/50 dark:border-amber-700/50">
                    Electrical Subtotal: {subTab1ElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-amber-200/80 dark:border-amber-800/80 bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-amber-50 dark:bg-amber-950/60 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3 min-w-[280px]">Electrical Item & Specification</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                        <th className="py-2.5 px-3 text-center">Discipline</th>
                        <th className="py-2.5 px-3 text-center">Activity</th>
                        <th className="py-2.5 px-3 text-right">Base Qty</th>
                        <th className="py-2.5 px-3 text-right">Extra %</th>
                        <th className="py-2.5 px-3 text-right">Final Qty</th>
                        <th className="py-2.5 px-3 text-center">Unit</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                      {subTab1BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'electrical').length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-6 text-center text-slate-400 font-sans">
                            No electrical items populated.
                          </td>
                        </tr>
                      ) : (
                        subTab1BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'electrical').map((item, idx) => {
                          const itemName = STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item_name || item.item || 'Item Description';
                          const isProc = (item.activity_type || '').toLowerCase() === 'procurement';
                          return (
                            <tr key={item.id || item.item || idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-sans">
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-block">
                                  {item.work_main_category || item.main_category || 'Electrical'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Electrical
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                  {item.activity_type || 'Procurement'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right pr-4 font-black text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot className="bg-amber-50/80 dark:bg-amber-950/60 border-t-2 border-amber-200 dark:border-amber-800 text-xs font-mono font-bold">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 font-sans text-amber-950 dark:text-amber-200">
                          Electrical Infrastructure Total ({subTab1BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'electrical').length} items)
                        </td>
                        <td colSpan={4} className="py-3 px-3 text-right text-amber-700 dark:text-amber-400">
                          Electrical Subtotal:
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-amber-700 dark:text-amber-300 text-sm">
                          {subTab1ElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>


          </div>
        );
      })()}


      {/* ========================================================================= */}
      {/* SUB-TAB 3: DOSING & FITTINGS                                              */}
      {/* ========================================================================= */}
      {emSection === 'dosing' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Sub-Tab 3: Chemical Dosing, Disinfection & Circulation Inlets / Drains
                </h3>
                <p className="text-[11px] text-slate-500">
                  pH/ORP controllers, tablet chlorinators, cleaning accessories, inlets, drains, and automation valves.
                </p>
              </div>
            </div>
          </div>

          {/* Dosing System Branching */}
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                Select Disinfection System Architecture
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFieldChange('type_of_chlorinator_system', 'Chlorinator Tablet')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    (formData.type_of_chlorinator_system || 'Chlorinator Tablet') === 'Chlorinator Tablet'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Tablet Chlorinator
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleFieldsChange({
                      type_of_chlorinator_system: 'Dosing Pump',
                      dosing_pump_type: formData.dosing_pump_type || '34681aa7-c226-4ef8-9f86-aadf236159a7',
                      chemical_feeder_code: formData.chemical_feeder_code || '34681aa7-c226-4ef8-9f86-aadf236159a7',
                      chemical_feeder_qty: formData.chemical_feeder_qty !== undefined ? formData.chemical_feeder_qty : 2,
                      mixing_tank_capacity: formData.mixing_tank_capacity || '82639f46-6af2-4dd6-9302-0e86e5d8b637',
                      no_of_mixing_tank: formData.no_of_mixing_tank !== undefined ? formData.no_of_mixing_tank : 2,
                      electrical_stirrer_type: formData.electrical_stirrer_type || 'bbecbd5a-6c54-40b3-97db-48bbd1599b0e',
                      no_of_electrical_stirrer: formData.no_of_electrical_stirrer !== undefined ? formData.no_of_electrical_stirrer : 2
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    formData.type_of_chlorinator_system === 'Dosing Pump'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Automated pH/ORP Dosing Pump System
                </button>
              </div>
            </div>

            {formData.type_of_chlorinator_system === 'Dosing Pump' ? (
              <div className="space-y-4 pt-2">
                {/* 1. Dosing Pumps */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                    1. Chemical Dosing Pumps (pH & Chlorine / ORP)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block">
                        Dosing Pump Model (from filter_pump_types)
                      </label>
                      <SearchableSelect
                        options={dosingPumpOptions.length > 0 ? dosingPumpOptions : [
                          { id: '34681aa7-c226-4ef8-9f86-aadf236159a7', label: 'Astral Pool • Dosing Pump 5 L/H (Code: 57132)' },
                          { id: 'b58a48b2-f7a6-47ae-9f7e-a7909241d8c3', label: 'Astral Pool • Dosing Pump 10 L/H (Code: 57133)' },
                          { id: '229ad5a7-3d46-4440-8e41-9b2a3f003989', label: 'Astral Pool • Dosing Pump 20 L/H (Code: 57135)' },
                          { id: 'a78671c2-3cac-42d2-95d1-c400e685b5d9', label: 'Injecta Italy • Dosing Pump 120 L/H (Code: TM04108C)' }
                        ]}
                        value={formData.dosing_pump_type || formData.chemical_feeder_code || '34681aa7-c226-4ef8-9f86-aadf236159a7'}
                        onChange={(val) => {
                          handleFieldChange('dosing_pump_type', val);
                          handleFieldChange('chemical_feeder_code', val);
                        }}
                        placeholder="Select Dosing Pump..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Dosing Pumps (Qty)</label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleFieldChange('chemical_feeder_qty', Math.max(0, (Number(formData.chemical_feeder_qty || 2) - 1)))}
                          className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-l-xl text-xs font-black"
                        >
                          —
                        </button>
                        <input
                          type="number"
                          value={formData.chemical_feeder_qty !== undefined ? formData.chemical_feeder_qty : 2}
                          onChange={(e) => handleFieldChange('chemical_feeder_qty', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                          placeholder="2"
                        />
                        <button
                          type="button"
                          onClick={() => handleFieldChange('chemical_feeder_qty', (Number(formData.chemical_feeder_qty || 0) + 1))}
                          className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-r-xl text-xs font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Chemical PE Mixing / Storage Tanks */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                    2. Chemical Polyethylene (PE) Mixing / Storage Tanks
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block">
                        PE Chemical Tank Model (Shawwa Plastics)
                      </label>
                      <SearchableSelect
                        options={chemicalTankOptions.length > 0 ? chemicalTankOptions : [
                          { id: 'b36efdb6-7e7b-4dba-bd75-bc9c3cdcf0f6', label: '500 Liter Mixing Tank Brand:Shawwa Plastics' },
                          { id: '82639f46-6af2-4dd6-9302-0e86e5d8b637', label: '300 Liter Mixing Tank Brand:Shawwa Plastics' }
                        ]}
                        value={formData.mixing_tank_capacity || '82639f46-6af2-4dd6-9302-0e86e5d8b637'}
                        onChange={(val) => handleFieldChange('mixing_tank_capacity', val)}
                        placeholder="Select PE Chemical Tank..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Chemical Tanks (Qty)</label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleFieldChange('no_of_mixing_tank', Math.max(0, (Number(formData.no_of_mixing_tank || 2) - 1)))}
                          className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-l-xl text-xs font-black"
                        >
                          —
                        </button>
                        <input
                          type="number"
                          value={formData.no_of_mixing_tank !== undefined ? formData.no_of_mixing_tank : 2}
                          onChange={(e) => handleFieldChange('no_of_mixing_tank', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                          placeholder="2"
                        />
                        <button
                          type="button"
                          onClick={() => handleFieldChange('no_of_mixing_tank', (Number(formData.no_of_mixing_tank || 0) + 1))}
                          className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-r-xl text-xs font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Chemical Tank Mixers / Electrical Stirrers */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                    3. Chemical Tank Mixers & Electrical Stirrers
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block">
                        Electrical Stirrer / Agitator Model (Motovario)
                      </label>
                      <SearchableSelect
                        options={chemicalStirrerOptions.length > 0 ? chemicalStirrerOptions : [
                          { id: 'bbecbd5a-6c54-40b3-97db-48bbd1599b0e', label: '1/3 Electrical stirrer Brand:Motovario / Italy Code: TS71B4' }
                        ]}
                        value={formData.electrical_stirrer_type || 'bbecbd5a-6c54-40b3-97db-48bbd1599b0e'}
                        onChange={(val) => handleFieldChange('electrical_stirrer_type', val)}
                        placeholder="Select Electrical Stirrer..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Stirrers / Mixers (Qty)</label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleFieldChange('no_of_electrical_stirrer', Math.max(0, (Number(formData.no_of_electrical_stirrer || 2) - 1)))}
                          className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-l-xl text-xs font-black"
                        >
                          —
                        </button>
                        <input
                          type="number"
                          value={formData.no_of_electrical_stirrer !== undefined ? formData.no_of_electrical_stirrer : 2}
                          onChange={(e) => handleFieldChange('no_of_electrical_stirrer', e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                          placeholder="2"
                        />
                        <button
                          type="button"
                          onClick={() => handleFieldChange('no_of_electrical_stirrer', (Number(formData.no_of_electrical_stirrer || 0) + 1))}
                          className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 rounded-r-xl text-xs font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block">Tablet Chlorinator Model</label>
                  <SearchableSelect
                    options={chlorinatorOptions}
                    value={formData.tablet_chlorinator_type || ''}
                    onChange={(val) => handleFieldChange('tablet_chlorinator_type', val)}
                    placeholder="Select Chlorinator..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block">Chlorinator Qty</label>
                  <input
                    type="number"
                    value={formData.tablet_chlorinator_quantity || 1}
                    onChange={(e) => handleFieldChange('tablet_chlorinator_quantity', e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-center"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Inlets and Drains */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Pool Inlets, Suction Points & Drainage Grilles Models & Quantities
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {isOverflow ? (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">
                      Floor Inlets (Bottom Return)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-slate-500">Qty</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                      <SearchableSelect
                        options={floorInletOptions}
                        value={formData.floor_inlets_type || ''}
                        onChange={(val) => handleFieldChange('floor_inlets_type', val)}
                        placeholder="Select Floor Inlet..."
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.no_of_floor_inlets || 0}
                        onChange={(e) => handleFieldChange('no_of_floor_inlets', e.target.value)}
                        className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">
                        Surface Skimmers
                      </label>
                      <span className="text-[10px] font-mono font-bold text-slate-500">Qty</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-3">
                        <SearchableSelect
                          options={skimmerOptions}
                          value={formData.skimmer_type || ''}
                          onChange={(val) => handleFieldChange('skimmer_type', val)}
                          placeholder="Select Skimmer..."
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.no_of_skimmer || 0}
                          onChange={(e) => handleFieldChange('no_of_skimmer', e.target.value)}
                          className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300">
                        Wall Inlets (Side Delivery)
                      </label>
                      <span className="text-[10px] font-mono font-bold text-slate-500">Qty</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-3">
                        <SearchableSelect
                          options={wallInletOptions}
                          value={formData.wall_inlets_type || ''}
                          onChange={(val) => handleFieldChange('wall_inlets_type', val)}
                          placeholder="Select Wall Inlet..."
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          value={formData.no_of_wall_inlets || 0}
                          onChange={(e) => handleFieldChange('no_of_wall_inlets', e.target.value)}
                          className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {isOverflow && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                      Gutter Drains (Perimeter Gutters)
                    </label>
                    <span className="text-[10px] font-mono font-bold text-slate-500">Qty</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                      <SearchableSelect
                        options={gutterDrainOptions}
                        value={formData.gutter_drain_type || ''}
                        onChange={(val) => handleFieldChange('gutter_drain_type', val)}
                        placeholder="Select Gutter Drain..."
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.no_of_gutter_drain || 0}
                        onChange={(e) => handleFieldChange('no_of_gutter_drain', e.target.value)}
                        className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Vacuum Suction Points
                  </label>
                  <span className="text-[10px] font-mono font-bold text-slate-500">Qty</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <SearchableSelect
                      options={vacuumPointOptions}
                      value={formData.vacuum_inlets_type || ''}
                      onChange={(val) => handleFieldChange('vacuum_inlets_type', val)}
                      placeholder="Select Vacuum Point..."
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.no_of_vacuum_inlets || 0}
                      onChange={(e) => handleFieldChange('no_of_vacuum_inlets', e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Main Drains (Dual Anti-Vortex)
                  </label>
                  <span className="text-[10px] font-mono font-bold text-slate-500">Qty</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <SearchableSelect
                      options={mainDrainOptions}
                      value={formData.main_drain_type || ''}
                      onChange={(val) => handleFieldChange('main_drain_type', val)}
                      placeholder="Select Main Drain..."
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.no_of_main_drain || 2}
                      onChange={(e) => handleFieldChange('no_of_main_drain', e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Manual Cleaning Set & Components (Exact Database Structure) */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-4 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 dark:border-amber-800/40 pb-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 block">
                      Manual Cleaning Set
                    </span>
                    <span className="text-[10px] font-medium text-amber-700/80 dark:text-amber-400 block">
                      Manual Cleaning Set components
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                      Rule: ceil(Area / 500m²) = {formData.no_of_manual_cleaning_set || 1} Sets
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">No. of Manual Cleaning Set:</span>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            const val = Math.max(1, (Number(formData.no_of_manual_cleaning_set) || 1) - 1);
                            handleFieldsChange({
                              no_of_manual_cleaning_set: val,
                              no_of_telescopic_pole: val,
                              no_of_vacuum_head: val,
                              no_of_floating_hose: val,
                              no_of_leaf_rake_net: val,
                              no_of_wall_brush: val,
                              no_of_chemical_test_kit: val
                            });
                          }}
                          className="px-2 py-1 bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 text-amber-800 dark:text-amber-200 rounded-l-lg text-xs font-black"
                        >
                          —
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={formData.no_of_manual_cleaning_set || 1}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleFieldsChange({
                              no_of_manual_cleaning_set: val,
                              no_of_telescopic_pole: val,
                              no_of_vacuum_head: val,
                              no_of_floating_hose: val,
                              no_of_leaf_rake_net: val,
                              no_of_wall_brush: val,
                              no_of_chemical_test_kit: val
                            });
                          }}
                          className="w-12 bg-white dark:bg-slate-900 border-y border-amber-200 dark:border-amber-800 py-1 text-xs font-mono font-bold text-center"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = (Number(formData.no_of_manual_cleaning_set) || 1) + 1;
                            handleFieldsChange({
                              no_of_manual_cleaning_set: val,
                              no_of_telescopic_pole: val,
                              no_of_vacuum_head: val,
                              no_of_floating_hose: val,
                              no_of_leaf_rake_net: val,
                              no_of_wall_brush: val,
                              no_of_chemical_test_kit: val
                            });
                          }}
                          className="px-2 py-1 bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 text-amber-800 dark:text-amber-200 rounded-r-lg text-xs font-black"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Complete Set Summary from Items Database */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 flex items-center justify-center font-bold text-xs">
                      SET
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-slate-100">
                        Manual Cleaning Set
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Includes telescopic handle 4.8m, 18" vacuum head, 15m floating hose, leaf net, nylon brush, and manual chemical test kit.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl">
                      Qty: {formData.no_of_manual_cleaning_set || 1} Set(s)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Valves and Automation */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Mechanical Valves & Automation Controls
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Solenoid Auto-Fill Valve
                  </label>
                  <span className="text-[10px] font-mono font-bold text-slate-500">Qty</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <SearchableSelect
                      options={solenoidValveOptions}
                      value={formData.solenoid_valve_type || ''}
                      onChange={(val) => handleFieldChange('solenoid_valve_type', val)}
                      placeholder="Select Solenoid Valve..."
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.no_of_selnoid_valve || 1}
                      onChange={(e) => handleFieldChange('no_of_selnoid_valve', e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Mechanical Float Valve
                  </label>
                  <span className="text-[10px] font-mono font-bold text-slate-500">Qty</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <SearchableSelect
                      options={floatValveOptions}
                      value={formData.float_valve_type || ''}
                      onChange={(val) => handleFieldChange('float_valve_type', val)}
                      placeholder="Select Float Valve..."
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.no_of_float_valve || 1}
                      onChange={(e) => handleFieldChange('no_of_float_valve', e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Electric Float Level Switches (Dual)
                  </label>
                  <span className="text-[10px] font-mono font-bold text-slate-500">Qty</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <SearchableSelect
                      options={floatSwitchOptions}
                      value={formData.float_switch_type || ''}
                      onChange={(val) => handleFieldChange('float_switch_type', val)}
                      placeholder="Select Level Switch..."
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={formData.no_of_float_switch || 2}
                      onChange={(e) => handleFieldChange('no_of_float_switch', e.target.value)}
                      className="w-full px-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-center text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PIPING MATERIAL SPECIFICATION & PIPE NETWORKS                            */}
          {/* ========================================================================= */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gradient-to-r from-teal-500/10 via-sky-500/5 to-transparent border border-teal-500/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-mono font-black text-xs">
                  (H)
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Total No. of (H) Networks
                  </span>
                  <span className="text-xl font-mono font-black text-teal-700 dark:text-teal-300">
                    {liveTotalNoH}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 font-mono font-black text-xs">
                  (T)
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Total No. of (T) Networks
                  </span>
                  <span className="text-xl font-mono font-black text-sky-700 dark:text-sky-300">
                    {liveTotalNoT}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60">
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">Piping Material Specification System</span>
                <span className="text-[11px] text-slate-500">Choose whether external underground lines are all UPVC or combined with HDPE feeds.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFieldChange('piping_material_system', 'upvc_only')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    (formData.piping_material_system || 'upvc_only') === 'upvc_only'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  1. UPVC Only (All Circuits)
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange('piping_material_system', 'upvc_and_hdpe')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    formData.piping_material_system === 'upvc_and_hdpe'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  2. UPVC & HDPE (Underground HDPE Feeds)
                </button>
              </div>
            </div>

                        {/* ========================================================================= */}
            {/* 1. WATER FEATURE UPVC NETWORKS (POOL RING / EXTERNAL)                     */}
            {/* ========================================================================= */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    1. Water Feature UPVC Networks (Pool Ring / External Lines)
                  </h5>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  Brand: Misr Al Nour (PN10/PN16)
                </span>
              </div>

              {/* UPVC Pipes Grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">UPVC Pressure Pipes (m):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {['63mm', '75mm', '90mm', '110mm', '160mm', '200mm'].map(sz => {
                    const num = sz.replace('mm', '');
                    const pipeObj = upvcPipesCatalog.find(p => p.size === sz);
                    const val = formData[`upvc_pipe_${sz}`] || '';
                    return (
                      <div key={`wf_upvc_pipe_${sz}`} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1 shadow-xs">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-black text-slate-800 dark:text-slate-200">Ø {num} mm</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{pipeObj?.cost > 0 ? `${pipeObj.cost} EGP` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => handleFieldChange(`upvc_pipe_${sz}`, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center text-xs"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-mono font-bold text-slate-400">m</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* UPVC Fittings Grid (Elbows 90°, Tees) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Water Feature UPVC Elbows 90° & Tees (No.):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {['63mm', '75mm', '90mm', '110mm', '160mm', '200mm'].map(sz => {
                    const num = sz.replace('mm', '');
                    return (
                      <div key={`wf_upvc_fittings_${sz}`} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1 text-[10px]">
                        <span className="font-black text-slate-700 dark:text-slate-300 block text-center">Ø {num} mm</span>
                        <div>
                          <label className="text-slate-400 block text-[9px] font-medium">Elbow 90° (No.)</label>
                          <input
                            type="number"
                            value={formData[`upvc_elbow_90_degree_${sz}`] || ''}
                            onChange={(e) => handleFieldChange(`upvc_elbow_90_degree_${sz}`, e.target.value)}
                            className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-center text-[11px] font-mono font-bold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[9px] font-medium">Tee (No.)</label>
                          <input
                            type="number"
                            value={formData[`upvc_tee_${sz}`] || ''}
                            onChange={(e) => handleFieldChange(`upvc_tee_${sz}`, e.target.value)}
                            className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-center text-[11px] font-mono font-bold"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* UPVC Reducers Grid */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Water Feature UPVC Reducers (No.):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[
                    { key: '75_63mm', label: '75/63 mm' },
                    { key: '90_75mm', label: '90/75 mm' },
                    { key: '110_63mm', label: '110/63 mm' },
                    { key: '110_75mm', label: '110/75 mm' },
                    { key: '110_90mm', label: '110/90 mm' },
                    { key: '110_160mm', label: '110/160 mm' },
                    { key: '200_160mm', label: '200/160 mm' }
                  ].map(red => (
                    <div key={`wf_upvc_red_${red.key}`} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1 text-[10px]">
                      <span className="font-black text-slate-700 dark:text-slate-300 block text-center">Ø {red.label}</span>
                      <input
                        type="number"
                        value={formData[`upvc_reducer_${red.key}`] || ''}
                        onChange={(e) => handleFieldChange(`upvc_reducer_${red.key}`, e.target.value)}
                        className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-center text-[11px] font-mono font-bold"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2. WATER FEATURE HDPE NETWORKS (UNDERGROUND FEEDS)                        */}
            {/* ========================================================================= */}
            <div className={`p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3 transition-opacity ${
              formData.piping_material_system === 'upvc_and_hdpe' ? 'opacity-100' : 'opacity-40 pointer-events-none'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    2. Water Feature HDPE Networks (Underground Trench Feeds)
                  </h5>
                </div>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60">
                  Brand: Red Sea (PE100 PN16)
                </span>
              </div>

              {/* HDPE Pipes Grid */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">HDPE Pressure Pipes (m):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {['63mm', '75mm', '90mm', '110mm', '160mm', '200mm'].map(sz => {
                    const num = sz.replace('mm', '');
                    const pipeObj = hdpePipesCatalog.find(p => p.size === sz);
                    const val = formData[`hdpe_pipe_${sz}`] || '';
                    return (
                      <div key={`wf_hdpe_pipe_${sz}`} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1 shadow-xs">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-black text-slate-800 dark:text-slate-200">Ø {num} mm</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{pipeObj?.cost > 0 ? `${pipeObj.cost} EGP` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            disabled={formData.piping_material_system !== 'upvc_and_hdpe'}
                            value={val}
                            onChange={(e) => handleFieldChange(`hdpe_pipe_${sz}`, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center text-xs"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-mono font-bold text-slate-400">m</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HDPE Fittings Grid (Elbows 90°, Tees) */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Water Feature HDPE Elbows 90° & Tees (No.):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {['63mm', '75mm', '90mm', '110mm', '160mm', '200mm'].map(sz => {
                    const num = sz.replace('mm', '');
                    return (
                      <div key={`wf_hdpe_fittings_${sz}`} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1 text-[10px]">
                        <span className="font-black text-slate-700 dark:text-slate-300 block text-center">Ø {num} mm</span>
                        <div>
                          <label className="text-slate-400 block text-[9px] font-medium">Elbow 90° (No.)</label>
                          <input
                            type="number"
                            disabled={formData.piping_material_system !== 'upvc_and_hdpe'}
                            value={formData[`hdpe_elbow_90_degree_${sz}`] || ''}
                            onChange={(e) => handleFieldChange(`hdpe_elbow_90_degree_${sz}`, e.target.value)}
                            className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-center text-[11px] font-mono font-bold"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block text-[9px] font-medium">Tee (No.)</label>
                          <input
                            type="number"
                            disabled={formData.piping_material_system !== 'upvc_and_hdpe'}
                            value={formData[`hdpe_tee_${sz}`] || ''}
                            onChange={(e) => handleFieldChange(`hdpe_tee_${sz}`, e.target.value)}
                            className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-center text-[11px] font-mono font-bold"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HDPE Reducers Grid */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Water Feature HDPE Reducers (No.):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {[
                    { key: '75_63mm', label: '75/63 mm' },
                    { key: '90_75mm', label: '90/75 mm' },
                    { key: '110_63mm', label: '110/63 mm' },
                    { key: '110_75mm', label: '110/75 mm' },
                    { key: '110_90mm', label: '110/90 mm' },
                    { key: '110_160mm', label: '110/160 mm' },
                    { key: '200_160mm', label: '200/160 mm' }
                  ].map(red => (
                    <div key={`wf_hdpe_red_${red.key}`} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1 text-[10px]">
                      <span className="font-black text-slate-700 dark:text-slate-300 block text-center">Ø {red.label}</span>
                      <input
                        type="number"
                        disabled={formData.piping_material_system !== 'upvc_and_hdpe'}
                        value={formData[`hdpe_reducer_${red.key}`] || ''}
                        onChange={(e) => handleFieldChange(`hdpe_reducer_${red.key}`, e.target.value)}
                        className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-center text-[11px] font-mono font-bold"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. PUMP ROOM NETWORKS (PIPES, TEES, REDUCERS & BALL VALVES)               */}
            {/* ========================================================================= */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    3. Pump Room Networks (Headers, Internal Pipes & Isolation Ball Valves)
                  </h5>
                </div>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-200/60">
                  Valves Brand: Comer (Italy) • Pipes Brand: Misr Al Nour
                </span>
              </div>

              {/* Pump Room UPVC Pipes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Pump Room UPVC Pipes (m):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {['63mm', '75mm', '90mm', '110mm', '160mm', '200mm', '250mm', '315mm'].map(sz => {
                    const num = sz.replace('mm', '');
                    const val = formData[`pump_room_upvc_pipe_${sz}`] || '';
                    return (
                      <div key={`pr_upvc_pipe_${sz}`} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1 text-[10px] shadow-xs">
                        <span className="font-black text-slate-800 dark:text-slate-200 block text-center">Ø {num} mm</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={val}
                            onChange={(e) => handleFieldChange(`pump_room_upvc_pipe_${sz}`, e.target.value)}
                            className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center text-xs"
                            placeholder="0"
                          />
                          <span className="text-[9px] font-mono font-bold text-slate-400">m</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pump Room Double Union Ball Valves */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300 block">Pump Room Double Union Ball Valves (No.):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {['63mm', '75mm', '90mm', '110mm', '160mm', '200mm', '250mm', '315mm'].map(sz => {
                    const num = sz.replace('mm', '');
                    const val = formData[`pump_room_ball_valve_${sz}`] || '';
                    return (
                      <div key={`pr_bv_${sz}`} className="p-2 bg-white dark:bg-slate-900 border border-cyan-200/60 dark:border-cyan-800/40 rounded-xl space-y-1 text-[10px] shadow-xs">
                        <span className="font-black text-cyan-900 dark:text-cyan-200 block text-center">Ø {num} mm</span>
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => handleFieldChange(`pump_room_ball_valve_${sz}`, e.target.value)}
                          className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center text-xs"
                          placeholder="0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pump Room UPVC Tees */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Pump Room UPVC Tees (No.):</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {['63mm', '75mm', '90mm', '110mm', '160mm', '200mm', '250mm', '315mm'].map(sz => {
                    const num = sz.replace('mm', '');
                    const val = formData[`pump_room_upvc_tee_${sz}`] || '';
                    return (
                      <div key={`pr_tee_${sz}`} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1 text-[10px]">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block text-center">Ø {num} mm</span>
                        <input
                          type="number"
                          value={val}
                          onChange={(e) => handleFieldChange(`pump_room_upvc_tee_${sz}`, e.target.value)}
                          className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-center text-[11px] font-mono font-bold"
                          placeholder="0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pump Room UPVC Reducers */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Pump Room UPVC Reducers (No.):</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {[
                    { key: '75_63mm', label: '75/63 mm' },
                    { key: '90_75mm', label: '90/75 mm' },
                    { key: '110_160mm', label: '110/160 mm' },
                    { key: '200_160mm', label: '200/160 mm' },
                    { key: '250_200mm', label: '250/200 mm' },
                    { key: '315_250mm', label: '315/250 mm' }
                  ].map(red => (
                    <div key={`pr_red_${red.key}`} className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1 text-[10px]">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block text-center">Ø {red.label}</span>
                      <input
                        type="number"
                        value={formData[`pump_room_upvc_reducer_${red.key}`] || ''}
                        onChange={(e) => handleFieldChange(`pump_room_upvc_reducer_${red.key}`, e.target.value)}
                        className="w-full px-1 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-center text-[11px] font-mono font-bold"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 4. WATER FEATURE VALVES (POOL NETWORK VALVES)                             */}
            {/* ========================================================================= */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  4. Water Feature Valves (Pool Circuit Check & Isolation Valves)
                </h5>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 shadow-xs">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                    Ball Valve Ø 63mm (No.)
                  </label>
                  <input
                    type="number"
                    value={formData['ball_valve_63mm'] || formData['pump_room_ball_valve_63mm'] || ''}
                    onChange={(e) => handleFieldChange('ball_valve_63mm', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center text-xs"
                    placeholder="0"
                  />
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1 shadow-xs">
                  <label className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block">
                    Check Valve 63 mm (No.)
                  </label>
                  <input
                    type="number"
                    value={formData['check_valve_63mm'] || formData['check_valve_63'] || ''}
                    onChange={(e) => handleFieldChange('check_valve_63mm', e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg font-mono font-bold text-center text-xs"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SUB-TAB 2 LIVE BOQ BREAKDOWN TABLE                                        */}
            {/* ========================================================================= */}
            <div className="mt-8 pt-6 border-t-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 text-white rounded-3xl border border-cyan-800/50 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-pulse ring-4 ring-cyan-400/20" />
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                      <span>Sub-Tab 2 Networks & Fittings BOQ Breakdown Summary</span>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        {subTab2BoqItems.length} Real Line Items
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Live bill of quantities for UPVC & HDPE pressure pipes, 90° elbows, tees, reducers, and pump room valves.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-sm shadow-sm flex items-center gap-2">
                    <span>Networks Subtotal:</span>
                    <span>{subTab2TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                  </div>
                </div>
              </div>

              {/* TABLE: NETWORKS & FITTINGS BREAKDOWN */}
              <div className="p-5 bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-200/70 dark:border-cyan-800/50 rounded-3xl space-y-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-200/60 dark:border-cyan-800/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-600 text-white shadow-xs">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-cyan-950 dark:text-cyan-200 uppercase tracking-wider flex items-center gap-2">
                        <span>Piping Networks, Fittings & Isolation Valves</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700">
                          {subTab2BoqItems.length} Items
                        </span>
                      </h4>
                      <p className="text-[10px] text-cyan-700/80 dark:text-cyan-400/80">
                        External pool loop pipes, underground trench lines, pump room headers, tees, reducers, elbows, and ball valves.
                      </p>
                    </div>
                  </div>

                  <div className="text-xs font-mono font-black text-cyan-800 dark:text-cyan-300 bg-cyan-100/80 dark:bg-cyan-900/60 px-3 py-1 rounded-xl border border-cyan-300/50 dark:border-cyan-700/50">
                    Total: {subTab2TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-cyan-200/80 dark:border-cyan-800/80 bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-cyan-50 dark:bg-cyan-950/60 text-[10px] font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300 border-b border-cyan-200 dark:border-cyan-800">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3 min-w-[280px]">Item & Technical Specification</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                        <th className="py-2.5 px-3 text-center">Discipline</th>
                        <th className="py-2.5 px-3 text-center">Activity</th>
                        <th className="py-2.5 px-3 text-right">Base Qty</th>
                        <th className="py-2.5 px-3 text-right">Extra %</th>
                        <th className="py-2.5 px-3 text-right">Final Qty</th>
                        <th className="py-2.5 px-3 text-center">Unit</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                      {subTab2BoqItems.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="font-bold text-xs">No piping network items populated.</span>
                              <span className="text-[11px] text-slate-400">Configure turnover parameters in Sub-Tab 1 to calculate network requirements.</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        subTab2BoqItems.map((item, idx) => {
                          const itemName = STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item_name || item.item || 'Item Description';
                          return (
                            <tr key={item.id || item.item || idx} className="hover:bg-cyan-50/50 dark:hover:bg-cyan-950/30 transition-colors">
                              <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-sans">
                                <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                              </td>
                              <td className="py-2.5 px-3 font-sans">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 inline-block">
                                  {item.work_main_category || item.main_category || 'Mechanical'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                                  {item.work_type || 'Mechanical'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                  {item.activity_type || 'Procurement'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                              <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                              <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-2.5 px-3 text-right pr-4 font-black text-cyan-700 dark:text-cyan-300 whitespace-nowrap">
                                {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {subTab2BoqItems.length > 0 && (
                      <tfoot className="bg-cyan-50/80 dark:bg-cyan-950/60 border-t-2 border-cyan-200 dark:border-cyan-800 text-xs font-mono font-bold">
                        <tr>
                          <td colSpan={5} className="py-3 px-4 font-sans text-cyan-950 dark:text-cyan-200">
                            Piping & Fittings Total ({subTab2BoqItems.length} items)
                          </td>
                          <td colSpan={4} className="py-3 px-3 text-right text-cyan-700 dark:text-cyan-400">
                            Total Networks Cost:
                          </td>
                          <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-cyan-700 dark:text-cyan-300 text-sm">
                            {subTab2TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: HEATING SYSTEM                                                 */}
      {/* ========================================================================= */}
      {emSection === 'heaters' && (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Sub-Tab 4: Pool Heating, Heat Pumps & Thermal Demand Sizing
                </h3>
                <p className="text-[11px] text-slate-500">
                  Thermodynamic heat balance for pool water heating & surface losses.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-xs font-mono">
              <Thermometer className="w-3.5 h-3.5 text-amber-500" />
              <span>Req Power: <strong className="text-amber-700 dark:text-amber-300">{formData.required_heating_power_kw || '0'} kW</strong></span>
            </div>
          </div>

          {/* Sizing Thermodynamics Equations Box */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Thermodynamic Heat Balance Equation & Design Criteria
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-200/50 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                ASHRAE / DIN 19643 Standards
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                <span className="text-[10px] text-slate-500 block font-medium">Pool Water Volume (V)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{resolvedVolume.toFixed(2)} m³</span>
              </div>
              <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                <span className="text-[10px] text-slate-500 block font-medium">Temperature Delta (ΔT)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">13 °C (28°C - 15°C)</span>
              </div>
              <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                <span className="text-[10px] text-slate-500 block font-medium">Initial Heat-Up Time (t)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">24 Hours</span>
              </div>
              <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                <span className="text-[10px] text-slate-500 block font-medium">Surface & Wind Losses</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">+20% Factor (1.20)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Heater Brand (Cascading Filter)
              </label>
              <SearchableSelect
                options={heaterBrandOptions}
                value={formData.heater_brand || ''}
                onChange={(val) => handleFieldChange('heater_brand', val)}
                placeholder="Select Heater Brand..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Heating Equipment Model (Database Ref)
              </label>
              <SearchableSelect
                options={filteredHeaters}
                value={formData.heater_type || formData.recommended_heater_model || ''}
                onChange={(val) => handleFieldChange('heater_type', val)}
                placeholder="Select Heater Model..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Heaters Quantity (Calculated Units)
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleFieldChange('no_of_heaters', Math.max(0, (Number(formData.no_of_heaters || 1) - 1)))}
                  className="px-3 py-2 bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 text-amber-800 dark:text-amber-200 rounded-l-xl text-xs font-black"
                >
                  —
                </button>
                <input
                  type="number"
                  value={formData.no_of_heaters || formData.heater_qty || ''}
                  onChange={(e) => handleFieldChange('no_of_heaters', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                  placeholder="1"
                />
                <button
                  type="button"
                  onClick={() => handleFieldChange('no_of_heaters', (Number(formData.no_of_heaters || 0) + 1))}
                  className="px-3 py-2 bg-amber-100 dark:bg-amber-900 hover:bg-amber-200 text-amber-800 dark:text-amber-200 rounded-r-xl text-xs font-black"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Comprehensive Thermal System Sizing & Columns Dashboard */}
          {(() => {
            const reqKw = Number(formData.required_heating_power_kw || 0);
            const unitKw = Number(selectedHeaterObj?.output_kw || formData.heater_output_kw || 0);
            const qty = Number(formData.no_of_heaters || formData.heater_qty || 0);
            const installedKw = Number((qty * unitKw).toFixed(2));
            const marginKw = Number((installedKw - reqKw).toFixed(2));
            const coveragePct = reqKw > 0 ? Number(((installedKw / reqKw) * 100).toFixed(1)) : 100;
            const elecLoadKw = Number(((qty * (unitKw / 4.5)).toFixed(2))); // Standard Heat Pump COP = 4.5

            return (
              <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Heating Engineering Columns & Thermal Performance Metrics
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    Coverage: {coveragePct}% {coveragePct >= 100 ? '✓ Sized' : '⚠ Undersized'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
                  {/* Column 1: Required Thermal Power */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                      Required Power (P_req)
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm block">
                      {reqKw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW
                    </span>
                    <span className="text-[9px] text-slate-400">ASHRAE 24h Heat-Up</span>
                  </div>

                  {/* Column 2: Unit Rated Output */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                      Unit Output (kW/Unit)
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm block">
                      {unitKw > 0 ? `${unitKw} kW` : 'N/A'}
                    </span>
                    <span className="text-[9px] text-slate-400">Per Heater Unit</span>
                  </div>

                  {/* Column 3: Sized Quantity */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                      Quantity (No.)
                    </span>
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm block">
                      {qty} Units
                    </span>
                    <span className="text-[9px] text-slate-400">⌈ P_req / Unit_kW ⌉</span>
                  </div>

                  {/* Column 4: Total Installed Capacity */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                      Installed Capacity
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm block">
                      {installedKw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW
                    </span>
                    <span className="text-[9px] text-slate-400">Qty × Unit kW</span>
                  </div>

                  {/* Column 5: Thermal Surplus Margin */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                      Thermal Margin (ΔkW)
                    </span>
                    <span className={`font-mono font-bold text-sm block ${marginKw >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {marginKw >= 0 ? `+${marginKw}` : marginKw} kW
                    </span>
                    <span className="text-[9px] text-slate-400">Installed - Required</span>
                  </div>

                  {/* Column 6: Est. Electrical Input Load */}
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">
                      Electrical Input Load
                    </span>
                    <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm block">
                      {elecLoadKw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kW
                    </span>
                    <span className="text-[9px] text-slate-400">COP ~ 4.5 (3-Phase)</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* SUB-TAB 4 LIVE BOQ BREAKDOWN TABLE                                        */}
          {/* ========================================================================= */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-amber-200 dark:border-amber-900/60 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl border border-amber-800/50 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse ring-4 ring-amber-400/20" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <span>Sub-Tab 4 Heating BOQ Breakdown Summary</span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {subTab4BoqItems.length} Real Line Items
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Live bill of quantities for pool heating systems, heat pumps & auxiliary plumbing.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-sm flex items-center gap-2">
                  <span>Heating Subtotal:</span>
                  <span>{subTab4TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                </div>
              </div>
            </div>

            {/* TABLE: HEATING EQUIPMENT BREAKDOWN */}
            <div className="p-5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 rounded-3xl space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                      <span>Heating Equipment & Thermal System Line Items</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        {subTab4BoqItems.length} Items
                      </span>
                    </h4>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                      High-efficiency heat pumps, electric/gas pool heaters, thermal exchangers, and isolation bypass kits.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/60 px-3 py-1 rounded-xl border border-amber-300/50 dark:border-amber-700/50">
                  Total: {subTab4TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-amber-200/80 dark:border-amber-800/80 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-amber-50 dark:bg-amber-950/60 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Item & Technical Specification</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                      <th className="py-2.5 px-3 text-center">Discipline</th>
                      <th className="py-2.5 px-3 text-center">Activity</th>
                      <th className="py-2.5 px-3 text-right">Base Qty</th>
                      <th className="py-2.5 px-3 text-right">Extra %</th>
                      <th className="py-2.5 px-3 text-right">Final Qty</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {subTab4BoqItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Flame className="w-8 h-8 text-amber-300 dark:text-amber-700 opacity-60" />
                            <span className="font-bold text-xs">No heating equipment selected yet.</span>
                            <span className="text-[11px] text-slate-400">Select a Heater Model or set Heater Qty &gt; 0 above to populate line items.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      subTab4BoqItems.map((item, idx) => {
                        const itemName = STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item_name || item.item || 'Item Description';
                        return (
                          <tr key={item.id || item.item || idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-block">
                                {item.work_main_category || item.main_category || 'Mechanical'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {item.work_type || 'Mechanical'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                {item.activity_type || 'Procurement'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right pr-4 font-black text-amber-700 dark:text-amber-300 whitespace-nowrap">
                              {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {subTab4BoqItems.length > 0 && (
                    <tfoot className="bg-amber-50/80 dark:bg-amber-950/60 border-t-2 border-amber-200 dark:border-amber-800 text-xs font-mono font-bold">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 font-sans text-amber-950 dark:text-amber-200">
                          Heating Equipment Total ({subTab4BoqItems.length} items)
                        </td>
                        <td colSpan={4} className="py-3 px-3 text-right text-amber-700 dark:text-amber-400">
                          Total Heating Cost:
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-amber-700 dark:text-amber-300 text-sm">
                          {subTab4TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4/5: LIGHTING & TRANSFORMERS                                     */}
      {emSection === 'lighting' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-200 dark:border-amber-800/40 rounded-3xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Sub-Tab 4: Underwater LED Lighting, Transformers & Containment Raceway
                </h3>
                <p className="text-[11px] text-slate-500">
                  Complete multi-tier database spec: LED fixtures, wet niches, submersible cables, 1/2" & 3/4" conduits, IP68 deck boxes & step-down transformers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Lights: <strong>{formData.qty_lights || '1'} Units</strong></span>
              <span>•</span>
              <span>Trans: <strong>{formData.transformer_qty || '1'} Units</strong></span>
            </div>
          </div>

          {/* CARD 1: UNDERWATER LIGHTING & SUBMERSIBLE CABLE SELECTION */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  1. Underwater LED Luminaire & Submersible Cable Selection
                </h4>
                <p className="text-[10px] text-slate-400">
                  Lighting density rule: N_lights = max(1, ceil(P_WF / 10m)) with matched wet niche & IP68 rubber cable.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Underwater LED Luminaire Model (Database Column)
                </label>
                <SearchableSelect
                  options={filteredLighting}
                  value={formData.underwater_light_type || formData.water_feature_lighting_code || ''}
                  onChange={(val) => handleFieldChange('underwater_light_type', val)}
                  placeholder="Select Underwater Light Model..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Total Light Fixtures (Qty)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('qty_lights', Math.max(0, (Number(formData.qty_lights || 1) - 1)))}
                    className="px-3 py-2 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 rounded-l-xl text-xs font-black cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.qty_lights !== undefined ? formData.qty_lights : 1}
                    onChange={(e) => handleFieldChange('qty_lights', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('qty_lights', (Number(formData.qty_lights || 0) + 1))}
                    className="px-3 py-2 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-800 dark:text-amber-200 rounded-r-xl text-xs font-black cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Embedded Concrete Niche Backbox
                </label>
                <SearchableSelect
                  options={nicheOptions}
                  value={formData.water_feature_lighting_backbox || ''}
                  onChange={(val) => handleFieldChange('water_feature_lighting_backbox', val)}
                  placeholder="Select Niche Backbox..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Submersible Electric Cable Type
                </label>
                <SearchableSelect
                  options={cableOptions}
                  value={formData.recommended_electric_cable_type || '870785ee-c1e4-4f2b-8233-bf662ce78dd1'}
                  onChange={(val) => handleFieldChange('recommended_electric_cable_type', val)}
                  placeholder="Select Submersible Cable..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Electric Cable Length per one Lighting (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('electric_cable_length_per_one_lighting', Math.max(0, (Number(formData.electric_cable_length_per_one_lighting || 5) - 1)))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.electric_cable_length_per_one_lighting !== undefined ? formData.electric_cable_length_per_one_lighting : 5}
                    onChange={(e) => handleFieldChange('electric_cable_length_per_one_lighting', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('electric_cable_length_per_one_lighting', (Number(formData.electric_cable_length_per_one_lighting || 0) + 1))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Total Electric Cable Lengths (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_electric_cable_lengths', Math.max(0, (Number(formData.total_electric_cable_lengths || 0) - 5)))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.total_electric_cable_lengths !== undefined ? formData.total_electric_cable_lengths : (Number(formData.qty_lights || 1) * Number(formData.electric_cable_length_per_one_lighting || 5))}
                    onChange={(e) => handleFieldChange('total_electric_cable_lengths', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center text-amber-600 dark:text-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_electric_cable_lengths', (Number(formData.total_electric_cable_lengths || 0) + 5))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Recommended Electric Cable Gland
                </label>
                <SearchableSelect
                  options={glandOptions.length > 0 ? glandOptions : [{ id: '73e5eca3-396a-4318-a30b-cbbcc4a8f84a', label: 'HA2-20 S Submersible IP68 Gland' }]}
                  value={formData.recommended_electric_cable_gland || '73e5eca3-396a-4318-a30b-cbbcc4a8f84a'}
                  onChange={(val) => handleFieldChange('recommended_electric_cable_gland', val)}
                  placeholder="Select Cable Gland..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Electric Cable Gland Quantity (No.)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('electric_cable_gland_quantity', Math.max(0, (Number(formData.electric_cable_gland_quantity || 1) - 1)))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.electric_cable_gland_quantity !== undefined ? formData.electric_cable_gland_quantity : (formData.qty_lights || 1)}
                    onChange={(e) => handleFieldChange('electric_cable_gland_quantity', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('electric_cable_gland_quantity', (Number(formData.electric_cable_gland_quantity || 0) + 1))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: PROTECTIVE CONDUIT AND ACCESSORIES SELECTION (1/2" LIQUID-TIGHT) */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  2. Protective Conduit & Wet Niche Conduit Accessories (1/2" Liquid-Tight)
                </h4>
                <p className="text-[10px] text-slate-400">
                  Flexible liquid-tight conduit encasement protecting underwater light cable from wet niche to deck box.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Protective Conduit Model
                </label>
                <SearchableSelect
                  options={conduitOptions}
                  value={formData.protective_conduit || '3906d89e-476f-450d-be1b-90ce73a60906'}
                  onChange={(val) => handleFieldChange('protective_conduit', val)}
                  placeholder="Select Protective Conduit..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Protective Conduit length (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('protective_conduit_length', Math.max(0, (Number(formData.protective_conduit_length || 5) - 1)))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.protective_conduit_length !== undefined ? formData.protective_conduit_length : 5}
                    onChange={(e) => handleFieldChange('protective_conduit_length', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('protective_conduit_length', (Number(formData.protective_conduit_length || 0) + 1))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Total Protective Conduit length (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_protective_conduit_length', Math.max(0, (Number(formData.total_protective_conduit_length || 0) - 5)))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.total_protective_conduit_length !== undefined ? formData.total_protective_conduit_length : (Number(formData.qty_lights || 1) * Number(formData.protective_conduit_length || 5))}
                    onChange={(e) => handleFieldChange('total_protective_conduit_length', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center text-teal-600 dark:text-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_protective_conduit_length', (Number(formData.total_protective_conduit_length || 0) + 5))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: MAIN CONDUIT AND ACCESSORIES SELECTION */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  3. Main Conduit and Accessories Selection
                </h4>
                <p className="text-[10px] text-slate-400">
                  Main underground feeder raceway connecting deck junction boxes to the pump room distribution board.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Main Conduit Category
                </label>
                <SearchableSelect
                  options={mainConduitCategoryOptions}
                  value={formData.main_conduit_category || 'Flexible Fire Resistant'}
                  onChange={(val) => handleFieldChange('main_conduit_category', val)}
                  placeholder="Select Conduit Category..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Recommended Main Conduit Type
                </label>
                <SearchableSelect
                  options={conduitOptions}
                  value={formData.recommended_main_conduit_type || '65e37519-39a2-49cf-97e3-0e791084ca45'}
                  onChange={(val) => handleFieldChange('recommended_main_conduit_type', val)}
                  placeholder="Select Main Conduit Type..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Main Conduit Length per one Electric Cable (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('main_conduit_length_per_one_electric_cable', Math.max(0, (Number(formData.main_conduit_length_per_one_electric_cable || 5) - 1)))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.main_conduit_length_per_one_electric_cable !== undefined ? formData.main_conduit_length_per_one_electric_cable : 5}
                    onChange={(e) => handleFieldChange('main_conduit_length_per_one_electric_cable', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('main_conduit_length_per_one_electric_cable', (Number(formData.main_conduit_length_per_one_electric_cable || 0) + 1))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Total Main Conduit Lengths (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_main_conduit_lengths', Math.max(0, (Number(formData.total_main_conduit_lengths || 0) - 5)))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.total_main_conduit_lengths !== undefined ? formData.total_main_conduit_lengths : (Number(formData.qty_lights || 1) * 10)}
                    onChange={(e) => handleFieldChange('total_main_conduit_lengths', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center text-blue-600 dark:text-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_main_conduit_lengths', (Number(formData.total_main_conduit_lengths || 0) + 5))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Main Conduit Adapter Type
                </label>
                <SearchableSelect
                  options={conduitAdapterOptions}
                  value={formData.main_conduit_adapter_type || '752fdb9d-a15b-465d-8155-3f6462d07e8e'}
                  onChange={(val) => handleFieldChange('main_conduit_adapter_type', val)}
                  placeholder="Select Conduit Adapter..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Total Main Conduit Adapter Qty
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_main_conduit_adapter_qty', Math.max(0, (Number(formData.total_main_conduit_adapter_qty || 2) - 1)))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.total_main_conduit_adapter_qty !== undefined ? formData.total_main_conduit_adapter_qty : (Number(formData.qty_lights || 1) * 2)}
                    onChange={(e) => handleFieldChange('total_main_conduit_adapter_qty', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_main_conduit_adapter_qty', (Number(formData.total_main_conduit_adapter_qty || 0) + 1))}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: JUNCTION BOXES AND TRANSFORMER SELECTION */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/60">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  4. Junction Boxes And Transformer Selection
                </h4>
                <p className="text-[10px] text-slate-400">
                  Deck IP68 poolside terminal boxes and safety isolating step-down transformers (220V → 12V/24V).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Junction Box Type
                </label>
                <SearchableSelect
                  options={junctionBoxOptions}
                  value={formData.junction_box_type || ''}
                  onChange={(val) => handleFieldChange('junction_box_type', val)}
                  placeholder="Select IP68 Deck Box..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Junction Box QTY
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('junction_box_qty', Math.max(0, (Number(formData.junction_box_qty || 1) - 1)))}
                    className="px-3 py-2 bg-orange-100 dark:bg-orange-900/60 hover:bg-orange-200 text-orange-800 dark:text-orange-200 rounded-l-xl text-xs font-black cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.junction_box_qty !== undefined ? formData.junction_box_qty : (formData.qty_lights || 1)}
                    onChange={(e) => handleFieldChange('junction_box_qty', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('junction_box_qty', (Number(formData.junction_box_qty || 0) + 1))}
                    className="px-3 py-2 bg-orange-100 dark:bg-orange-900/60 hover:bg-orange-200 text-orange-800 dark:text-orange-200 rounded-r-xl text-xs font-black cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Transformer Type (Safety Step-Down Model)
                </label>
                <SearchableSelect
                  options={filteredTransformers}
                  value={formData.transformer_type || ''}
                  onChange={(val) => handleFieldChange('transformer_type', val)}
                  placeholder="Select Step-Down Transformer Model..."
                />
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Transformer QTY
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('transformer_qty', Math.max(0, (Number(formData.transformer_qty || 1) - 1)))}
                    className="px-3 py-2 bg-orange-100 dark:bg-orange-900/60 hover:bg-orange-200 text-orange-800 dark:text-orange-200 rounded-l-xl text-xs font-black cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.transformer_qty !== undefined ? formData.transformer_qty : 1}
                    onChange={(e) => handleFieldChange('transformer_qty', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('transformer_qty', (Number(formData.transformer_qty || 0) + 1))}
                    className="px-3 py-2 bg-orange-100 dark:bg-orange-900/60 hover:bg-orange-200 text-orange-800 dark:text-orange-200 rounded-r-xl text-xs font-black cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 5: TRANSFORMER FEEDING & OUTPUT CABLES, CONDUITS & ACCESSORIES */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  5. Transformer Feeding Cables, Output Cables & Conduits Accessories
                </h4>
                <p className="text-[10px] text-slate-400">
                  Dedicated 220V primary high-voltage feed and 12V low-voltage branch distribution cables, conduits, and IP68 glands.
                </p>
              </div>
            </div>

            {/* Sub-Section 5A: 220V Primary Feeder Run */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-600" />
                Primary 220V Feeder Run (Main Distribution Board → Transformer)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block">Transformer 220V Primary Feeding Cable</label>
                  <SearchableSelect
                    options={cableOptions}
                    value={formData.transfomer_feeding_cable_type || '9a8108d6-98d6-4fdb-8a43-992ae321f6df'}
                    onChange={(val) => handleFieldChange('transfomer_feeding_cable_type', val)}
                    placeholder="Select Feeder Cable..."
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Feeding Cable Length (m)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transfomer_feeding_cable_length', Math.max(0, (Number(formData.transfomer_feeding_cable_length || 30) - 5)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.transfomer_feeding_cable_length !== undefined ? formData.transfomer_feeding_cable_length : (Number(formData.transformer_qty || 1) * 30)}
                      onChange={(e) => handleFieldChange('transfomer_feeding_cable_length', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transfomer_feeding_cable_length', (Number(formData.transfomer_feeding_cable_length || 0) + 5))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Feeder Cable Glands (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transfomer_feeding_cable_gland_no', Math.max(0, (Number(formData.transfomer_feeding_cable_gland_no || 2) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.transfomer_feeding_cable_gland_no !== undefined ? formData.transfomer_feeding_cable_gland_no : (Number(formData.transformer_qty || 1) * 2)}
                      onChange={(e) => handleFieldChange('transfomer_feeding_cable_gland_no', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transfomer_feeding_cable_gland_no', (Number(formData.transfomer_feeding_cable_gland_no || 0) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block">Transformer Feeding Conduit</label>
                  <SearchableSelect
                    options={conduitOptions}
                    value={formData.transformer_feeding_cable_conduit || '3906d89e-476f-450d-be1b-90ce73a60906'}
                    onChange={(val) => handleFieldChange('transformer_feeding_cable_conduit', val)}
                    placeholder="Select Feeder Conduit..."
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Feeder Conduit Length (m)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transformer_feeding_cable_conduit_length_m', Math.max(0, (Number(formData.transformer_feeding_cable_conduit_length_m || 30) - 5)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.transformer_feeding_cable_conduit_length_m !== undefined ? formData.transformer_feeding_cable_conduit_length_m : (Number(formData.transformer_qty || 1) * 30)}
                      onChange={(e) => handleFieldChange('transformer_feeding_cable_conduit_length_m', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transformer_feeding_cable_conduit_length_m', (Number(formData.transformer_feeding_cable_conduit_length_m || 0) + 5))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Feeder Conduit Adapters (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transformer_feeding_cable_conduit_adapter_qty_no', Math.max(0, (Number(formData.transformer_feeding_cable_conduit_adapter_qty_no || 2) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.transformer_feeding_cable_conduit_adapter_qty_no !== undefined ? formData.transformer_feeding_cable_conduit_adapter_qty_no : (Number(formData.transformer_qty || 1) * 2)}
                      onChange={(e) => handleFieldChange('transformer_feeding_cable_conduit_adapter_qty_no', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transformer_feeding_cable_conduit_adapter_qty_no', (Number(formData.transformer_feeding_cable_conduit_adapter_qty_no || 0) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Section 5B: 12V Secondary Output Branch */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Secondary 12V Output Branch (Transformer → Deck IP68 Junction Boxes)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block">Transformer 12V Secondary Output Cable</label>
                  <SearchableSelect
                    options={cableOptions}
                    value={formData.transformer_output_cable_type || '64363bdb-ba97-4f54-8a39-8d4d4c256615'}
                    onChange={(val) => handleFieldChange('transformer_output_cable_type', val)}
                    placeholder="Select Output Cable..."
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Output Cable Length (m)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transfomer_output_cable_length', Math.max(0, (Number(formData.transfomer_output_cable_length || 35) - 5)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.transfomer_output_cable_length !== undefined ? formData.transfomer_output_cable_length : ((30 * Number(formData.transformer_qty || 1)) + (5 * Number(formData.qty_lights || 1)))}
                      onChange={(e) => handleFieldChange('transfomer_output_cable_length', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transfomer_output_cable_length', (Number(formData.transfomer_output_cable_length || 0) + 5))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Output Cable Glands (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transfomer_output_cable_gland_no', Math.max(0, (Number(formData.transfomer_output_cable_gland_no || 2) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.transfomer_output_cable_gland_no !== undefined ? formData.transfomer_output_cable_gland_no : (Number(formData.qty_lights || 1) * 2)}
                      onChange={(e) => handleFieldChange('transfomer_output_cable_gland_no', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transfomer_output_cable_gland_no', (Number(formData.transfomer_output_cable_gland_no || 0) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-slate-500 block">Transformer Output Conduit</label>
                  <SearchableSelect
                    options={conduitOptions}
                    value={formData.transformer_output_cable_conduit_type || '65e37519-39a2-49cf-97e3-0e791084ca45'}
                    onChange={(val) => handleFieldChange('transformer_output_cable_conduit_type', val)}
                    placeholder="Select Output Conduit..."
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Output Conduit Length (m)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transformer_output_cable_conduit_length_m', Math.max(0, (Number(formData.transformer_output_cable_conduit_length_m || 30) - 5)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.transformer_output_cable_conduit_length_m !== undefined ? formData.transformer_output_cable_conduit_length_m : (30 * Math.max(1, Math.ceil(Number(formData.qty_lights || 1) / (Number(formData.transformer_qty || 1) * 5))))}
                      onChange={(e) => handleFieldChange('transformer_output_cable_conduit_length_m', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transformer_output_cable_conduit_length_m', (Number(formData.transformer_output_cable_conduit_length_m || 0) + 5))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Output Conduit Adapters (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transformer_output_cable_conduit_adapter_quantity_no', Math.max(0, (Number(formData.transformer_output_cable_conduit_adapter_quantity_no || 2) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.transformer_output_cable_conduit_adapter_quantity_no !== undefined ? formData.transformer_output_cable_conduit_adapter_quantity_no : (2 * Math.max(1, Math.ceil(Number(formData.qty_lights || 1) / (Number(formData.transformer_qty || 1) * 5))))}
                      onChange={(e) => handleFieldChange('transformer_output_cable_conduit_adapter_quantity_no', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transformer_output_cable_conduit_adapter_quantity_no', (Number(formData.transformer_output_cable_conduit_adapter_quantity_no || 0) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SUB-TAB 4 LIVE BOQ BREAKDOWN TABLE                                        */}
          {/* ========================================================================= */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-amber-200 dark:border-amber-900/60 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white rounded-3xl border border-amber-800/50 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-pulse ring-4 ring-amber-400/20" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <span>Sub-Tab 4 Lighting & Transformers BOQ Breakdown Summary</span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      {subTab3BoqItems.length} Real Line Items
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Live bill of quantities for underwater LED luminaires, niches, submersible cables, step-down transformers, deck boxes & containment.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-sm shadow-sm flex items-center gap-2">
                  <span>Lighting Subtotal:</span>
                  <span>{subTab3TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                </div>
              </div>
            </div>

            {/* TABLE: LIGHTING & TRANSFORMERS BREAKDOWN */}
            <div className="p-5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 rounded-3xl space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                      <span>Underwater Lighting, Transformers & Containment Line Items</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        {subTab3BoqItems.length} Items
                      </span>
                    </h4>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                      LED fixtures, niche backboxes, submersible cables, conduits, IP68 deck boxes and step-down transformers.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/60 px-3 py-1 rounded-xl border border-amber-300/50 dark:border-amber-700/50">
                  Total: {subTab3TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-amber-200/80 dark:border-amber-800/80 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-amber-50 dark:bg-amber-950/60 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Item & Technical Specification</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                      <th className="py-2.5 px-3 text-center">Discipline</th>
                      <th className="py-2.5 px-3 text-center">Activity</th>
                      <th className="py-2.5 px-3 text-right">Base Qty</th>
                      <th className="py-2.5 px-3 text-right">Extra %</th>
                      <th className="py-2.5 px-3 text-right">Final Qty</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {subTab3BoqItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <Lightbulb className="w-8 h-8 text-amber-300 dark:text-amber-700 opacity-60" />
                            <span className="font-bold text-xs">No lighting equipment selected yet.</span>
                            <span className="text-[11px] text-slate-400">Select an Underwater Light Model or set Light Qty &gt; 0 above to populate line items.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      subTab3BoqItems.map((item, idx) => {
                        const itemName = STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item_name || item.item || 'Item Description';
                        return (
                          <tr key={item.id || item.item || idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-block">
                                {item.work_main_category || item.main_category || 'Electrical'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {item.work_type || 'Electrical'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                {item.activity_type || 'Procurement'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right pr-4 font-black text-amber-700 dark:text-amber-300 whitespace-nowrap">
                              {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {subTab3BoqItems.length > 0 && (
                    <tfoot className="bg-amber-50/80 dark:bg-amber-950/60 border-t-2 border-amber-200 dark:border-amber-800 text-xs font-mono font-bold">
                      <tr>
                        <td colSpan={5} className="py-3 px-4 font-sans text-amber-950 dark:text-amber-200">
                          Lighting & Transformers Total ({subTab3BoqItems.length} items)
                        </td>
                        <td colSpan={4} className="py-3 px-3 text-right text-amber-700 dark:text-amber-400">
                          Total Lighting Cost:
                        </td>
                        <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-amber-700 dark:text-amber-300 text-sm">
                          {subTab3TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
          </div>
        )}

      {/* ========================================================================= */}
      {/* SUB-TAB 7: EARTHING & PROTECTION                                          */}
      {/* ========================================================================= */}
      {/* SUB-TAB 5: EARTHING & PROTECTION                                          */}
      {emSection === 'earthing' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent border border-teal-200 dark:border-teal-800/40 rounded-3xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Sub-Tab 5: Earthing & Lightning Grounding Protection System
                </h3>
                <p className="text-[11px] text-slate-500">
                  Soil resistivity calculations, electrode grouping parameters, equipotential bonding & database items matching.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 rounded-2xl text-xs font-mono">
              <span>Soil: <strong>{formData.soil_sensitivity_probable_value || 20} Ω·m</strong></span>
              <span>•</span>
              <span>Req. R: <strong>{formData.required_earthing_system_resistant || '0.50'} Ω</strong></span>
              <span>•</span>
              <span>Rods: <strong className="text-teal-700 dark:text-teal-300">{formData.no_of_earthing_rods_qty || '2'} Units</strong></span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 1: SOIL SENSITIVITY & EARTHING SYSTEM ENGINEERING CALCULATIONS       */}
          {/* ========================================================================= */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    1. Soil Sensitivity & IEEE 80 / BS 7430 Grounding Resistance Calculations
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Exact engineering parameters matching your database: soil resistivity, electrode grouping factors, rod resistance & cable mesh resistance.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-800/50">
                Final Rt: {formData.final_earthing_resistance_rt || '0.48'} Ω
              </span>
            </div>

            {/* Grid of 16 Database Columns from Screenshots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Soil Sensitivity Type */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Soil Sensitivity Type
                </label>
                <select
                  value={formData.soil_sensitivity_type || 'Marls (e.g. Keuper marl)'}
                  onChange={(e) => {
                    const sel = soilSensitivityTypes.find(s => s.label === e.target.value);
                    handleFieldChange('soil_sensitivity_type', e.target.value);
                    if (sel) handleFieldChange('soil_sensitivity_probable_value', sel.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  {soilSensitivityTypes.map(s => (
                    <option key={s.id} value={s.label}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* 2. Probable value (rho in Ohm-m) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Probable value (Ω·m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('soil_sensitivity_probable_value', Math.max(1, Math.round(Number(formData.soil_sensitivity_probable_value || 20) - 5)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.soil_sensitivity_probable_value !== undefined ? formData.soil_sensitivity_probable_value : 20}
                    onChange={(e) => handleFieldChange('soil_sensitivity_probable_value', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('soil_sensitivity_probable_value', Math.round(Number(formData.soil_sensitivity_probable_value || 20) + 5))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. Required Earthing System Resistant (Segmented buttons) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Required Earthing Resistant (Ω)
                </label>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  {['0.50', '1.00', '2.00'].map((val) => {
                    const isSelected = (formData.required_earthing_system_resistant || '0.50') === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleFieldChange('required_earthing_system_resistant', val)}
                        className={'py-1.5 rounded-lg text-xs font-mono font-bold transition-all ' + (
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Number of Rods for one Rod Components (No.) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Rods for one Component (No.)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('no_of_rods_for_one_component', Math.max(1, Math.round(Number(formData.no_of_rods_for_one_component || 2) - 1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.no_of_rods_for_one_component !== undefined ? formData.no_of_rods_for_one_component : 2}
                    onChange={(e) => handleFieldChange('no_of_rods_for_one_component', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('no_of_rods_for_one_component', Math.round(Number(formData.no_of_rods_for_one_component || 2) + 1))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 5. One Rod Length (m) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  One Rod Length (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('one_rod_length', Number(Math.max(0.5, Number(formData.one_rod_length || 1.5) - 0.5).toFixed(1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.one_rod_length !== undefined ? formData.one_rod_length : 1.5}
                    onChange={(e) => handleFieldChange('one_rod_length', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('one_rod_length', Number((Number(formData.one_rod_length || 1.5) + 0.5).toFixed(1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 6. Overall length of one Rod Components (m) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Overall Length of Rod Component (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('overall_length_of_one_rod_component', Number(Math.max(0.5, Number(formData.overall_length_of_one_rod_component || (Number(formData.no_of_rods_for_one_component || 2) * Number(formData.one_rod_length || 1.5))) - 0.5).toFixed(1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.overall_length_of_one_rod_component !== undefined ? formData.overall_length_of_one_rod_component : (Number(formData.no_of_rods_for_one_component || 2) * Number(formData.one_rod_length || 1.5))}
                    onChange={(e) => handleFieldChange('overall_length_of_one_rod_component', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('overall_length_of_one_rod_component', Number((Number(formData.overall_length_of_one_rod_component || (Number(formData.no_of_rods_for_one_component || 2) * Number(formData.one_rod_length || 1.5))) + 0.5).toFixed(1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 7. Cross Section of the Rod (inch) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Cross Section of Rod (inch / m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('cross_section_of_the_rod_inch', Number(Math.max(0.0001, Number(formData.cross_section_of_the_rod_inch || 0.0019) - 0.0005).toFixed(4)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.cross_section_of_the_rod_inch !== undefined ? formData.cross_section_of_the_rod_inch : 0.0019}
                    onChange={(e) => handleFieldChange('cross_section_of_the_rod_inch', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('cross_section_of_the_rod_inch', Number((Number(formData.cross_section_of_the_rod_inch || 0.0019) + 0.0005).toFixed(4)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 8. Earthing Rod Resistance (Rr) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 block">
                  Earthing Rod Resistance (Rr) (Ω)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('earthing_rod_resistance_rr', Number(Math.max(0.1, Number(formData.earthing_rod_resistance_rr || 8.96) - 0.5).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-teal-100 dark:bg-teal-900/60 hover:bg-teal-200 text-teal-800 dark:text-teal-200 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.earthing_rod_resistance_rr !== undefined ? formData.earthing_rod_resistance_rr : 8.96}
                    onChange={(e) => handleFieldChange('earthing_rod_resistance_rr', e.target.value)}
                    className="w-full bg-teal-50/50 dark:bg-teal-950/40 border-y border-teal-200 dark:border-teal-700 py-1.5 text-xs font-mono font-black text-center text-teal-700 dark:text-teal-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('earthing_rod_resistance_rr', Number((Number(formData.earthing_rod_resistance_rr || 8.96) + 0.5).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-teal-100 dark:bg-teal-900/60 hover:bg-teal-200 text-teal-800 dark:text-teal-200 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 9. No of Electrods to reach the required earthing system resistant */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  No of Electrodes for Target R
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('no_of_electrodes_to_reach_required_resistance', Math.max(1, Math.round(Number(formData.no_of_electrodes_to_reach_required_resistance || 1) - 1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.no_of_electrodes_to_reach_required_resistance !== undefined ? formData.no_of_electrodes_to_reach_required_resistance : 1}
                    onChange={(e) => handleFieldChange('no_of_electrodes_to_reach_required_resistance', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('no_of_electrodes_to_reach_required_resistance', Math.round(Number(formData.no_of_electrodes_to_reach_required_resistance || 1) + 1))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 10. Lambda Factor (λ) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Lambda Factor (λ)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('lambda_factor', Number(Math.max(0, Number(formData.lambda_factor || 0.85) - 0.05).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.lambda_factor !== undefined ? formData.lambda_factor : 0.85}
                    onChange={(e) => handleFieldChange('lambda_factor', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('lambda_factor', Number((Number(formData.lambda_factor || 0.85) + 0.05).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 11. Distance between each Adjacant rod */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Distance Adjacent Rods (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('distance_between_adjacent_rods_m', Number(Math.max(0, Number(formData.distance_between_adjacent_rods_m || 6) - 1).toFixed(1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.distance_between_adjacent_rods_m !== undefined ? formData.distance_between_adjacent_rods_m : 6}
                    onChange={(e) => handleFieldChange('distance_between_adjacent_rods_m', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('distance_between_adjacent_rods_m', Number((Number(formData.distance_between_adjacent_rods_m || 6) + 1).toFixed(1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 12. Alpha coffiecent (α) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Alpha Coefficient (α)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('alpha_coefficient', Number(Math.max(0, Number(formData.alpha_coefficient || 0.05) - 0.05).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.alpha_coefficient !== undefined ? formData.alpha_coefficient : 0.05}
                    onChange={(e) => handleFieldChange('alpha_coefficient', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('alpha_coefficient', Number((Number(formData.alpha_coefficient || 0.05) + 0.05).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 13. Total Resistance of Earthing Rods (Rn) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Total Rods Resistance (Rn) (Ω)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_resistance_of_earthing_rods_rn', Number(Math.max(0, Number(formData.total_resistance_of_earthing_rods_rn || 0.52) - 0.1).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total_resistance_of_earthing_rods_rn !== undefined ? formData.total_resistance_of_earthing_rods_rn : 0.52}
                    onChange={(e) => handleFieldChange('total_resistance_of_earthing_rods_rn', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('total_resistance_of_earthing_rods_rn', Number((Number(formData.total_resistance_of_earthing_rods_rn || 0.52) + 0.1).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 14. Earthing Cable Diameter (ø) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Earthing Cable Diameter (ø) (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('earthing_cable_diameter_m', Number(Math.max(0.0001, Number(formData.earthing_cable_diameter_m || 0.0067) - 0.001).toFixed(4)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.earthing_cable_diameter_m !== undefined ? formData.earthing_cable_diameter_m : 0.0067}
                    onChange={(e) => handleFieldChange('earthing_cable_diameter_m', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('earthing_cable_diameter_m', Number((Number(formData.earthing_cable_diameter_m || 0.0067) + 0.001).toFixed(4)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 15. Burial depth of cable (m) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                  Burial Depth of Cable (m)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('burial_depth_of_cable_m', Number(Math.max(0.1, Number(formData.burial_depth_of_cable_m || 0.6) - 0.1).toFixed(1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.burial_depth_of_cable_m !== undefined ? formData.burial_depth_of_cable_m : 0.6}
                    onChange={(e) => handleFieldChange('burial_depth_of_cable_m', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('burial_depth_of_cable_m', Number((Number(formData.burial_depth_of_cable_m || 0.6) + 0.1).toFixed(1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 16. Earthing Cable Resistance (Rc) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-300 block">
                  Earthing Cable Resistance (Rc) (Ω)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('earthing_cable_resistance_rc', Number(Math.max(0.01, Number(formData.earthing_cable_resistance_rc || 0.24) - 0.05).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-teal-100 dark:bg-teal-900/60 hover:bg-teal-200 text-teal-800 dark:text-teal-200 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.earthing_cable_resistance_rc !== undefined && !isNaN(formData.earthing_cable_resistance_rc) ? (typeof formData.earthing_cable_resistance_rc === 'number' ? Number(formData.earthing_cable_resistance_rc.toFixed(2)) : formData.earthing_cable_resistance_rc) : 0.24}
                    onChange={(e) => handleFieldChange('earthing_cable_resistance_rc', e.target.value)}
                    className="w-full bg-teal-50/50 dark:bg-teal-950/40 border-y border-teal-200 dark:border-teal-700 py-1.5 text-xs font-mono font-bold text-center text-teal-700 dark:text-teal-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('earthing_cable_resistance_rc', Number((Number(formData.earthing_cable_resistance_rc || 0.24) + 0.05).toFixed(2)))}
                    className="px-2.5 py-1.5 bg-teal-100 dark:bg-teal-900/60 hover:bg-teal-200 text-teal-800 dark:text-teal-200 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 17. Final Earthing Resistance (Rt) */}
              <div className="space-y-1 sm:col-span-2 lg:col-span-4 p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black uppercase text-teal-900 dark:text-teal-200 block">
                    Final System Earthing Resistance (Rt)
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400">
                    Combined total parallel resistance of Earth Rods Array (Rn) & Buried Copper Cable Mesh (Rc).
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">Target ≤ {formData.required_earthing_system_resistant || '0.50'} Ω</span>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('final_earthing_resistance_rt', Number(Math.max(0.01, Number(formData.final_earthing_resistance_rt || 0.22) - 0.05).toFixed(2)))}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.final_earthing_resistance_rt !== undefined && !isNaN(formData.final_earthing_resistance_rt) ? (typeof formData.final_earthing_resistance_rt === 'number' ? Number(formData.final_earthing_resistance_rt.toFixed(2)) : formData.final_earthing_resistance_rt) : 0.22}
                      onChange={(e) => handleFieldChange('final_earthing_resistance_rt', e.target.value)}
                      className="w-24 bg-white dark:bg-slate-900 border-y border-teal-300 dark:border-teal-700 py-2 text-sm font-mono font-black text-center text-teal-700 dark:text-teal-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('final_earthing_resistance_rt', Number((Number(formData.final_earthing_resistance_rt || 0.22) + 0.05).toFixed(2)))}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>



          {/* ========================================================================= */}
          {/* CARD 2: LIVE 11-COLUMN EARTHING & GROUNDING BOQ BREAKDOWN TABLE           */}
          {/* ========================================================================= */}
          <div className="p-5 bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/50 rounded-3xl space-y-3.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-200/60 dark:border-teal-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-teal-950 dark:text-teal-200 uppercase tracking-wider flex items-center gap-2">
                    <span>Earthing & Lightning Grounding Protection BOQ Breakdown</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                      {subTab5BoqItems.length} Items
                    </span>
                  </h4>
                  <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80">
                    Copper-bonded rods, driving studs, brass couplers, earth pits, rebar clamps, exothermic cadweld & bare copper conductors.
                  </p>
                </div>
              </div>

              <div className="text-xs font-mono font-black text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-3 py-1 rounded-xl border border-teal-300/50 dark:border-teal-700/50">
                Earthing Subtotal: {subTab5TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-teal-200/80 dark:border-teal-800/80 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-teal-50 dark:bg-teal-950/60 text-[10px] font-black uppercase tracking-wider text-teal-900 dark:text-teal-300 border-b border-teal-200 dark:border-teal-800">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3 min-w-[280px]">Item & Technical Specification</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                    <th className="py-2.5 px-3 text-center">Discipline</th>
                    <th className="py-2.5 px-3 text-center">Activity</th>
                    <th className="py-2.5 px-3 text-right">Base Qty</th>
                    <th className="py-2.5 px-3 text-right">Extra %</th>
                    <th className="py-2.5 px-3 text-right">Final Qty</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                  {subTab5BoqItems.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-6 text-center text-slate-400 font-sans">
                        No earthing equipment populated.
                      </td>
                    </tr>
                  ) : (
                    subTab5BoqItems.map((item, idx) => {
                      const itemName = item.item_name || item.fallbackName || STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item || 'Item Description';
                      return (
                        <tr key={item.id || item.item || idx} className="hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-colors">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 inline-block">
                              {item.work_main_category || item.main_category || 'Water Feature Earthing'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                              Electrical
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                              {item.activity_type || 'Procurement'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                          <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          <td className="py-2.5 px-3 text-right pr-4 font-black text-teal-700 dark:text-teal-300 whitespace-nowrap">
                            {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-teal-50/80 dark:bg-teal-950/60 border-t-2 border-teal-200 dark:border-teal-800 text-xs font-mono font-bold">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 font-sans text-teal-950 dark:text-teal-200">
                      Earthing & Grounding Protection Total ({subTab5BoqItems.length} items)
                    </td>
                    <td colSpan={4} className="py-3 px-3 text-right text-teal-700 dark:text-teal-400">
                      Earthing Subtotal:
                    </td>
                    <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-teal-700 dark:text-teal-300 text-sm">
                      {subTab5TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* SUB-TAB 8: PUMP ROOM MEP & SAFETY                                         */}
      {/* ========================================================================= */}
      {emSection === 'pumps_room_mep' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-5 bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent border border-cyan-200 dark:border-cyan-800/40 rounded-3xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Sub-Tab 6: Pump Room Internal MEP Services, Containment & Cable Trays
                </h3>
                <p className="text-[11px] text-slate-500">
                  Complete database specification: Exhaust fans, industrial sockets & EMT conduits, tri-proof LED lighting & enclosures, rotary isolators, fire extinguishers and main cable tray.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 rounded-2xl text-xs font-mono">
              <span>Sockets: <strong>{formData.service_socket_qty || '2'} Units</strong></span>
              <span>•</span>
              <span>Lights: <strong>{formData.pump_room_lighting_quantity || '2'} Units</strong></span>
              <span>•</span>
              <span>Tray: <strong className="text-cyan-700 dark:text-cyan-300">{formData.main_cable_tray_length_m || '0'}m</strong></span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 1: VENTILATION, ROTARY ISOLATORS & FIRE SAFETY                       */}
          {/* ========================================================================= */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  1. Ventilation Exhaust Fans & Fire Extinguishers
                </h4>
                <p className="text-[10px] text-slate-400">
                  Forced mechanical air extraction and high-pressure fire safety equipment.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Ventilation Fan Model & Qty */}
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Pump Room Ventilation Fan Model
                </label>
                <SearchableSelect
                  options={ventilationOptions}
                  value={formData.pump_room_ventilation_type || ''}
                  onChange={(val) => handleFieldChange('pump_room_ventilation_type', val)}
                  placeholder="Select Ventilation Fan..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Ventilation Fans (Qty)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('no_of_ventilation_fan', Math.max(0, (Number(formData.no_of_ventilation_fan || 1) - 1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.no_of_ventilation_fan || 1}
                    onChange={(e) => handleFieldChange('no_of_ventilation_fan', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('no_of_ventilation_fan', (Number(formData.no_of_ventilation_fan || 0) + 1))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Fire Extinguisher Model & Qty */}
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Fire Extinguisher Model
                </label>
                <SearchableSelect
                  options={fireExtOptions}
                  value={formData.fire_extinguisher_type || ''}
                  onChange={(val) => handleFieldChange('fire_extinguisher_type', val)}
                  placeholder="Select Fire Extinguisher..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Extinguishers (Qty)
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('no_of_fire_extinguisher', Math.max(0, (Number(formData.no_of_fire_extinguisher || 1) - 1)))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                  >
                    —
                  </button>
                  <input
                    type="number"
                    value={formData.no_of_fire_extinguisher || 1}
                    onChange={(e) => handleFieldChange('no_of_fire_extinguisher', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('no_of_fire_extinguisher', (Number(formData.no_of_fire_extinguisher || 0) + 1))}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 2: INDUSTRIAL SERVICE SOCKETS & ELECTRICAL CONTAINMENT               */}
          {/* ========================================================================= */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    2. Industrial Service Sockets & Electrical Containment Schedule
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Industrial IP67 socket outlets, power feeding cables, glands, EMT metallic conduits, adapters, couplers, straps & deck junction boxes.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800/50">
                {formData.service_socket_qty || 2} Sockets Installed
              </span>
            </div>

            <div className="space-y-4">
              {/* Row 1: Socket Outlet Model & Qty */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Industrial Service Socket Outlet Model
                  </label>
                  <SearchableSelect
                    options={socketOptions}
                    value={formData.service_socket_type || '532885f1-bd29-4eef-98a4-f9af4436d701'}
                    onChange={(val) => handleFieldChange('service_socket_type', val)}
                    placeholder="Select Service Socket..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    IP66/IP67 Sockets (Qty)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_qty', Math.max(0, (Number(formData.service_socket_qty || 2) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.service_socket_qty || 2}
                      onChange={(e) => handleFieldChange('service_socket_qty', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_qty', (Number(formData.service_socket_qty || 0) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Socket Cable & Glands */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Socket Power Feeding Cable Model
                  </label>
                  <SearchableSelect
                    options={cableOptions}
                    value={formData.service_socket_cable_type || '9a8108d6-98d6-4fdb-8a43-992ae321f6df'}
                    onChange={(val) => handleFieldChange('service_socket_cable_type', val)}
                    placeholder="Select Socket Cable..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Cable Length (m)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_cable_length_m', Math.max(0, (Number(formData.service_socket_cable_length_m || (Number(formData.service_socket_qty || 2) * 12)) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.service_socket_cable_length_m !== undefined ? formData.service_socket_cable_length_m : ((Number(formData.service_socket_qty) || 2) * 12)}
                      onChange={(e) => handleFieldChange('service_socket_cable_length_m', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_cable_length_m', (Number(formData.service_socket_cable_length_m || ((Number(formData.service_socket_qty) || 2) * 12)) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Cable Glands (Qty)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_cable_gland_quantity', Math.max(0, (Number(formData.service_socket_cable_gland_quantity || (Number(formData.service_socket_qty || 2) * 2)) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.service_socket_cable_gland_quantity !== undefined ? formData.service_socket_cable_gland_quantity : ((Number(formData.service_socket_qty) || 2) * 2)}
                      onChange={(e) => handleFieldChange('service_socket_cable_gland_quantity', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_cable_gland_quantity', (Number(formData.service_socket_cable_gland_quantity || ((Number(formData.service_socket_qty) || 2) * 2)) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Socket EMT Conduit, Adapters, Couplers, Straps & J-Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1 lg:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Socket Surface EMT Conduit
                  </label>
                  <SearchableSelect
                    options={conduitOptions}
                    value={formData.service_socket_cable_conduit_emt_type || '325663e7-139d-4f3c-a291-8452ca523ed3'}
                    onChange={(val) => handleFieldChange('service_socket_cable_conduit_emt_type', val)}
                    placeholder="Select EMT Conduit..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">EMT Length (m)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_cable_emt_conduit_length_m', Math.max(0, (Number(formData.service_socket_cable_emt_conduit_length_m || (Number(formData.service_socket_qty || 2) * 6)) - 1)))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.service_socket_cable_emt_conduit_length_m !== undefined ? formData.service_socket_cable_emt_conduit_length_m : ((Number(formData.service_socket_qty) || 2) * 6)}
                      onChange={(e) => handleFieldChange('service_socket_cable_emt_conduit_length_m', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_cable_emt_conduit_length_m', (Number(formData.service_socket_cable_emt_conduit_length_m || ((Number(formData.service_socket_qty) || 2) * 6)) + 1))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Adapters (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_emt_conduit_adapter_quantity', Math.max(0, (Number(formData.service_socket_emt_conduit_adapter_quantity || (Number(formData.service_socket_qty || 2) * 2)) - 1)))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.service_socket_emt_conduit_adapter_quantity !== undefined ? formData.service_socket_emt_conduit_adapter_quantity : ((Number(formData.service_socket_qty) || 2) * 2)}
                      onChange={(e) => handleFieldChange('service_socket_emt_conduit_adapter_quantity', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_emt_conduit_adapter_quantity', (Number(formData.service_socket_emt_conduit_adapter_quantity || ((Number(formData.service_socket_qty) || 2) * 2)) + 1))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Couplers (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_emt_conduit_coupler_quantity', Math.max(0, (Number(formData.service_socket_emt_conduit_coupler_quantity || Math.ceil((Number(formData.service_socket_qty || 2) * 6) / 3)) - 1)))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.service_socket_emt_conduit_coupler_quantity !== undefined ? formData.service_socket_emt_conduit_coupler_quantity : Math.ceil(((Number(formData.service_socket_qty) || 2) * 6) / 3)}
                      onChange={(e) => handleFieldChange('service_socket_emt_conduit_coupler_quantity', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_emt_conduit_coupler_quantity', (Number(formData.service_socket_emt_conduit_coupler_quantity || Math.ceil(((Number(formData.service_socket_qty) || 2) * 6) / 3)) + 1))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Straps (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_emt_conduit_strap_quantity', Math.max(0, (Number(formData.service_socket_emt_conduit_strap_quantity || Math.ceil((Number(formData.service_socket_qty || 2) * 6) / 1.5)) - 1)))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.service_socket_emt_conduit_strap_quantity !== undefined ? formData.service_socket_emt_conduit_strap_quantity : Math.ceil(((Number(formData.service_socket_qty) || 2) * 6) / 1.5)}
                      onChange={(e) => handleFieldChange('service_socket_emt_conduit_strap_quantity', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('service_socket_emt_conduit_strap_quantity', (Number(formData.service_socket_emt_conduit_strap_quantity || Math.ceil(((Number(formData.service_socket_qty) || 2) * 6) / 1.5)) + 1))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 3: PUMP ROOM INTERNAL LIGHTING & CONTROL SWITCHES                    */}
          {/* ========================================================================= */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    3. Pump Room Internal Waterproof Lighting (IP65 Tri-Proof) Schedule
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Tri-proof LED fixtures, power cables, glands, EMT metallic conduits, adapters, couplers, straps, 1P 16AX switches & watertight enclosures.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-3 py-1 rounded-xl border border-cyan-200 dark:border-cyan-800/50">
                {formData.pump_room_lighting_quantity || 2} Fixtures Installed
              </span>
            </div>

            <div className="space-y-4">
              {/* Row 1: Lighting Fixture Model & Qty */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1 sm:col-span-3">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Tri-Proof LED Waterproof Fixture Model
                  </label>
                  <SearchableSelect
                    options={triProofLightingOptions}
                    value={formData.pump_room_lighting_type || 'eebc0bd2-37ff-49ef-9d71-bdce4dadbebb'}
                    onChange={(val) => handleFieldChange('pump_room_lighting_type', val)}
                    placeholder="Select Tri-Proof Lighting..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Fixtures (Qty)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_quantity', Math.max(0, (Number(formData.pump_room_lighting_quantity || 2) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.pump_room_lighting_quantity || 2}
                      onChange={(e) => handleFieldChange('pump_room_lighting_quantity', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_quantity', (Number(formData.pump_room_lighting_quantity || 0) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Lighting Cable & Glands */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Lighting Power Feeding Cable Model
                  </label>
                  <SearchableSelect
                    options={cableOptions}
                    value={formData.pump_room_lighting_cable_type || '9a8108d6-98d6-4fdb-8a43-992ae321f6df'}
                    onChange={(val) => handleFieldChange('pump_room_lighting_cable_type', val)}
                    placeholder="Select Lighting Cable..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Cable Length (m)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_cable_length_m', Math.max(0, (Number(formData.pump_room_lighting_cable_length_m || (Number(formData.pump_room_lighting_quantity || 2) * 8)) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.pump_room_lighting_cable_length_m !== undefined ? formData.pump_room_lighting_cable_length_m : ((Number(formData.pump_room_lighting_quantity) || 2) * 8)}
                      onChange={(e) => handleFieldChange('pump_room_lighting_cable_length_m', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_cable_length_m', (Number(formData.pump_room_lighting_cable_length_m || ((Number(formData.pump_room_lighting_quantity) || 2) * 8)) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Cable Glands (Qty)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_cable_gland_quantity', Math.max(0, (Number(formData.pump_room_lighting_cable_gland_quantity || (Number(formData.pump_room_lighting_quantity || 2) * 2)) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.pump_room_lighting_cable_gland_quantity !== undefined ? formData.pump_room_lighting_cable_gland_quantity : ((Number(formData.pump_room_lighting_quantity) || 2) * 2)}
                      onChange={(e) => handleFieldChange('pump_room_lighting_cable_gland_quantity', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_cable_gland_quantity', (Number(formData.pump_room_lighting_cable_gland_quantity || ((Number(formData.pump_room_lighting_quantity) || 2) * 2)) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Lighting EMT Conduit, Adapters, Couplers, Straps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1 lg:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Lighting Surface EMT Conduit
                  </label>
                  <SearchableSelect
                    options={conduitOptions}
                    value={formData.pump_room_lighting_cable_conduit_emt_type || '325663e7-139d-4f3c-a291-8452ca523ed3'}
                    onChange={(val) => handleFieldChange('pump_room_lighting_cable_conduit_emt_type', val)}
                    placeholder="Select EMT Conduit..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">EMT Length (m)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_cable_emt_conduit_length_m', Math.max(0, (Number(formData.pump_room_lighting_cable_emt_conduit_length_m || (Number(formData.pump_room_lighting_quantity || 2) * 4)) - 1)))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.pump_room_lighting_cable_emt_conduit_length_m !== undefined ? formData.pump_room_lighting_cable_emt_conduit_length_m : ((Number(formData.pump_room_lighting_quantity) || 2) * 4)}
                      onChange={(e) => handleFieldChange('pump_room_lighting_cable_emt_conduit_length_m', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_cable_emt_conduit_length_m', (Number(formData.pump_room_lighting_cable_emt_conduit_length_m || ((Number(formData.pump_room_lighting_quantity) || 2) * 4)) + 1))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Adapters (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_emt_conduit_adapter_quantity', Math.max(0, (Number(formData.pump_room_lighting_emt_conduit_adapter_quantity || (Number(formData.pump_room_lighting_quantity || 2) * 2)) - 1)))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.pump_room_lighting_emt_conduit_adapter_quantity !== undefined ? formData.pump_room_lighting_emt_conduit_adapter_quantity : ((Number(formData.pump_room_lighting_quantity) || 2) * 2)}
                      onChange={(e) => handleFieldChange('pump_room_lighting_emt_conduit_adapter_quantity', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_emt_conduit_adapter_quantity', (Number(formData.pump_room_lighting_emt_conduit_adapter_quantity || ((Number(formData.pump_room_lighting_quantity) || 2) * 2)) + 1))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Couplers (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_emt_conduit_coupler_quantity', Math.max(0, (Number(formData.pump_room_lighting_emt_conduit_coupler_quantity || Math.ceil((Number(formData.pump_room_lighting_quantity || 2) * 4) / 3)) - 1)))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.pump_room_lighting_emt_conduit_coupler_quantity !== undefined ? formData.pump_room_lighting_emt_conduit_coupler_quantity : Math.ceil(((Number(formData.pump_room_lighting_quantity) || 2) * 4) / 3)}
                      onChange={(e) => handleFieldChange('pump_room_lighting_emt_conduit_coupler_quantity', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_emt_conduit_coupler_quantity', (Number(formData.pump_room_lighting_emt_conduit_coupler_quantity || Math.ceil(((Number(formData.pump_room_lighting_quantity) || 2) * 4) / 3)) + 1))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 block">Straps (Qty)</label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_emt_conduit_strap_quantity', Math.max(0, (Number(formData.pump_room_lighting_emt_conduit_strap_quantity || Math.ceil((Number(formData.pump_room_lighting_quantity || 2) * 4) / 1.5)) - 1)))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.pump_room_lighting_emt_conduit_strap_quantity !== undefined ? formData.pump_room_lighting_emt_conduit_strap_quantity : Math.ceil(((Number(formData.pump_room_lighting_quantity) || 2) * 4) / 1.5)}
                      onChange={(e) => handleFieldChange('pump_room_lighting_emt_conduit_strap_quantity', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('pump_room_lighting_emt_conduit_strap_quantity', (Number(formData.pump_room_lighting_emt_conduit_strap_quantity || Math.ceil(((Number(formData.pump_room_lighting_quantity) || 2) * 4) / 1.5)) + 1))}
                      className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Weatherproof Light Switch & Watertight Enclosure */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Weatherproof Light Switch Model
                  </label>
                  <SearchableSelect
                    options={lightSwitchOptions}
                    value={formData.pump_room_lighting_switch_type || '8cc7cd49-6d9b-490c-ab2e-f902d3122e36'}
                    onChange={(val) => handleFieldChange('pump_room_lighting_switch_type', val)}
                    placeholder="Select Switch..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Switches (Qty)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('weatherproof_light_switch_qty', Math.max(0, (Number(formData.weatherproof_light_switch_qty || 1) - 1)))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.weatherproof_light_switch_qty !== undefined ? formData.weatherproof_light_switch_qty : 1}
                      onChange={(e) => handleFieldChange('weatherproof_light_switch_qty', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('weatherproof_light_switch_qty', (Number(formData.weatherproof_light_switch_qty || 1) + 1))}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Water-Tight Switch Enclosure
                  </label>
                  <SearchableSelect
                    options={switchEnclosureOptions}
                    value={formData.pump_room_lighting_water_tight_enclosure_type || 'c23c71c4-d5a4-431d-ab30-3bc9bb969964'}
                    onChange={(val) => handleFieldChange('pump_room_lighting_water_tight_enclosure_type', val)}
                    placeholder="Select Enclosure..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CARD 4 (IN THE END): MAIN CABLE TRAY RACEWAY & STRUCTURAL SUSPENSIONS     */}
          {/* ========================================================================= */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  4. Main Cable Tray Raceway & Structural Suspensions
                </h4>
                <p className="text-[10px] text-slate-400">
                  Perforated galvanized steel cable tray schedule, splice plates, C-channels, drop anchors, 90° elbows & end caps.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Row 1: Main Cable Tray Specification & Length */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Main Cable Tray Specification
                  </label>
                  <SearchableSelect
                    options={cableTrayOptions}
                    value={formData.main_cable_tray_type || 'c7e9c566-a367-4bb9-8267-33a90807b1d3'}
                    onChange={(val) => handleFieldChange('main_cable_tray_type', val)}
                    placeholder="Select Cable Tray Model..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Tray Length (m)
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('main_cable_tray_length_m', Math.max(0, (Number(formData.main_cable_tray_length_m || 0) - 1)))}
                      className="px-3 py-2 bg-sky-100 dark:bg-sky-900/60 hover:bg-sky-200 text-sky-800 dark:text-sky-200 rounded-l-xl text-xs font-black cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.main_cable_tray_length_m !== undefined ? formData.main_cable_tray_length_m : 0}
                      onChange={(e) => handleFieldChange('main_cable_tray_length_m', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('main_cable_tray_length_m', (Number(formData.main_cable_tray_length_m || 0) + 1))}
                      className="px-3 py-2 bg-sky-100 dark:bg-sky-900/60 hover:bg-sky-200 text-sky-800 dark:text-sky-200 rounded-r-xl text-xs font-black cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Splice Plates & C-Channel Support Brackets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Splice Plate */}
                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Splice Plate Specification & Qty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <SearchableSelect
                        options={splicePlateOptions}
                        value={formData.splice_plate_type || 'ac7ed164-c456-4f01-8334-a3d5bc4d804c'}
                        onChange={(val) => handleFieldChange('splice_plate_type', val)}
                        placeholder="Select Splice Plate..."
                      />
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('splice_plate_quantity', Math.max(0, (Number(formData.splice_plate_quantity || 0) - 1)))}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                      >
                        —
                      </button>
                      <input
                        type="number"
                        value={formData.splice_plate_quantity !== undefined ? formData.splice_plate_quantity : 0}
                        onChange={(e) => handleFieldChange('splice_plate_quantity', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange('splice_plate_quantity', (Number(formData.splice_plate_quantity || 0) + 1))}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* C-Channel Support */}
                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    C-Channel Support Hanger & Qty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <SearchableSelect
                        options={cChannelOptions}
                        value={formData.main_cable_tray_c_channel_type || '262ea9ff-a237-4d75-840b-54c0a0d304ba'}
                        onChange={(val) => handleFieldChange('main_cable_tray_c_channel_type', val)}
                        placeholder="Select C-Channel..."
                      />
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('main_cable_tray_c_channel_quantity', Math.max(0, (Number(formData.main_cable_tray_c_channel_quantity || 0) - 1)))}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                      >
                        —
                      </button>
                      <input
                        type="number"
                        value={formData.main_cable_tray_c_channel_quantity !== undefined ? formData.main_cable_tray_c_channel_quantity : 0}
                        onChange={(e) => handleFieldChange('main_cable_tray_c_channel_quantity', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange('main_cable_tray_c_channel_quantity', (Number(formData.main_cable_tray_c_channel_quantity || 0) + 1))}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Drop Anchors & End Caps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Drop Anchors */}
                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Drop-In Anchors Specification & Qty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <SearchableSelect
                        options={anchorsOptions}
                        value={formData.main_cable_tray_anchors_type || '3dd3f13d-9db8-4542-8191-ff3ae2f25d8c'}
                        onChange={(val) => handleFieldChange('main_cable_tray_anchors_type', val)}
                        placeholder="Select Anchors..."
                      />
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('main_cable_tray_anchors_quantity', Math.max(0, (Number(formData.main_cable_tray_anchors_quantity || 0) - 1)))}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                      >
                        —
                      </button>
                      <input
                        type="number"
                        value={formData.main_cable_tray_anchors_quantity !== undefined ? formData.main_cable_tray_anchors_quantity : 0}
                        onChange={(e) => handleFieldChange('main_cable_tray_anchors_quantity', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange('main_cable_tray_anchors_quantity', (Number(formData.main_cable_tray_anchors_quantity || 0) + 1))}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* End Cap */}
                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    Tray End Cap Specification & Qty
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <SearchableSelect
                        options={endCapOptions}
                        value={formData.main_cable_tray_end_cap_type || 'b020d2c8-d214-4209-bfe4-dca2afd3456e'}
                        onChange={(val) => handleFieldChange('main_cable_tray_end_cap_type', val)}
                        placeholder="Select End Cap..."
                      />
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('end_cap_qty_quantity', Math.max(0, (Number(formData.end_cap_qty_quantity || 2) - 1)))}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                      >
                        —
                      </button>
                      <input
                        type="number"
                        value={formData.end_cap_qty_quantity !== undefined ? formData.end_cap_qty_quantity : 2}
                        onChange={(e) => handleFieldChange('end_cap_qty_quantity', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange('end_cap_qty_quantity', (Number(formData.end_cap_qty_quantity || 0) + 1))}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: 90° Elbows (Single Consolidated Field) */}
              <div className="grid grid-cols-1 gap-4">
                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
                    90° Elbow Specification & Qty
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-3">
                      <SearchableSelect
                        options={trayElbowOptions}
                        value={formData.main_cable_tray_vertical_elbow_90_type || '0ebdaaf7-0350-4f11-a7f9-ac95a72dde99'}
                        onChange={(val) => handleFieldChange('main_cable_tray_vertical_elbow_90_type', val)}
                        placeholder="Select 90° Elbow..."
                      />
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('main_cable_tray_vertical_elbow_90_quantity', Math.max(0, (Number(formData.main_cable_tray_vertical_elbow_90_quantity || 2) - 1)))}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                      >
                        —
                      </button>
                      <input
                        type="number"
                        value={formData.main_cable_tray_vertical_elbow_90_quantity !== undefined ? formData.main_cable_tray_vertical_elbow_90_quantity : 2}
                        onChange={(e) => handleFieldChange('main_cable_tray_vertical_elbow_90_quantity', e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-1.5 text-xs font-mono font-bold text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange('main_cable_tray_vertical_elbow_90_quantity', (Number(formData.main_cable_tray_vertical_elbow_90_quantity || 0) + 1))}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SUB-TAB 6 REAL BOQ BREAKDOWN TABLES (SPLIT: MECHANICAL & ELECTRICAL)       */}
          {/* ========================================================================= */}
          <div className="mt-8 pt-6 border-t-2 border-dashed border-cyan-200 dark:border-cyan-900/60 space-y-6">
            {/* Grand Summary Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:to-slate-900 text-white rounded-3xl shadow-md border border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-pulse ring-4 ring-cyan-400/20" />
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                    <span>Sub-Tab 6 BOQ Breakdown Summary</span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                      {subTab6BoqItems.length} Real Line Items
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Auto-calculated BOQ items separated into Mechanical Services (Ventilation & Fire Safety) and Electrical Infrastructure (Lighting, Sockets & Cable Trays).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <div className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-200 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span>Mechanical: {subTab6MechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Electrical: {subTab6ElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black text-sm shadow-sm flex items-center gap-2">
                  <span>Subtotal:</span>
                  <span>{subTab6TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                </div>
              </div>
            </div>

            {/* TABLE 1: MECHANICAL SERVICES (VENTILATION & FIRE EXTINGUISHERS) */}
            <div className="p-5 bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200/70 dark:border-teal-800/50 rounded-3xl space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-teal-200/60 dark:border-teal-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-teal-950 dark:text-teal-200 uppercase tracking-wider flex items-center gap-2">
                      <span>1. Mechanical Services, Ventilation & Fire Safety Works</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-300 dark:border-teal-700">
                        {subTab6BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical').length} Items
                      </span>
                    </h4>
                    <p className="text-[10px] text-teal-700/80 dark:text-teal-400/80">
                      Pump room exhaust ventilation fans, air extraction equipment, and safety fire extinguishers.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-black text-teal-800 dark:text-teal-300 bg-teal-100/80 dark:bg-teal-900/60 px-3 py-1 rounded-xl border border-teal-300/50 dark:border-teal-700/50">
                  Mechanical Subtotal: {subTab6MechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-teal-200/80 dark:border-teal-800/80 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-teal-50 dark:bg-teal-950/60 text-[10px] font-black uppercase tracking-wider text-teal-900 dark:text-teal-300 border-b border-teal-200 dark:border-teal-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Mechanical Item & Specification</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                      <th className="py-2.5 px-3 text-center">Discipline</th>
                      <th className="py-2.5 px-3 text-center">Activity</th>
                      <th className="py-2.5 px-3 text-right">Base Qty</th>
                      <th className="py-2.5 px-3 text-right">Extra %</th>
                      <th className="py-2.5 px-3 text-right">Final Qty</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {subTab6BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical').length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-slate-400 font-sans">
                          No mechanical pump room items populated.
                        </td>
                      </tr>
                    ) : (
                      subTab6BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical').map((item, idx) => {
                        const itemName = item.item_name || item.fallbackName || STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item || 'Item Description';
                        return (
                          <tr key={item.id || item.item || idx} className="hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 inline-block">
                                {item.work_main_category || item.main_category || 'Mechanical'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                Mechanical
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                {item.activity_type || 'Procurement'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right pr-4 font-black text-teal-700 dark:text-teal-300 whitespace-nowrap">
                              {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-teal-50/80 dark:bg-teal-950/60 border-t-2 border-teal-200 dark:border-teal-800 text-xs font-mono font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 font-sans text-teal-950 dark:text-teal-200">
                        Mechanical Services Total ({subTab6BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical').length} items)
                      </td>
                      <td colSpan={4} className="py-3 px-3 text-right text-teal-700 dark:text-teal-400">
                        Mechanical Subtotal:
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-teal-700 dark:text-teal-300 text-sm">
                        {subTab6MechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TABLE 2: ELECTRICAL INFRASTRUCTURE, LIGHTING, SOCKETS & CABLE TRAYS */}
            <div className="p-5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 rounded-3xl space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-amber-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-600 text-white shadow-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">
                      <span>2. Electrical Containment, Lighting, Sockets & Main Cable Tray Infrastructure</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        {subTab6BoqItems.filter(i => (i.work_type || '').toLowerCase() !== 'mechanical').length} Items
                      </span>
                    </h4>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                      IP65 tri-proof LED luminaires, switches, enclosures, IP67 industrial service sockets, EMT raceways, and galvanized main cable tray structural suspensions.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-black text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/60 px-3 py-1 rounded-xl border border-amber-300/50 dark:border-amber-700/50">
                  Electrical Subtotal: {subTab6ElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-amber-200/80 dark:border-amber-800/80 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-amber-50 dark:bg-amber-950/60 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Electrical Item & Specification</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                      <th className="py-2.5 px-3 text-center">Discipline</th>
                      <th className="py-2.5 px-3 text-center">Activity</th>
                      <th className="py-2.5 px-3 text-right">Base Qty</th>
                      <th className="py-2.5 px-3 text-right">Extra %</th>
                      <th className="py-2.5 px-3 text-right">Final Qty</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {subTab6BoqItems.filter(i => (i.work_type || '').toLowerCase() !== 'mechanical').length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-slate-400 font-sans">
                          No electrical pump room items populated.
                        </td>
                      </tr>
                    ) : (
                      subTab6BoqItems.filter(i => (i.work_type || '').toLowerCase() !== 'mechanical').map((item, idx) => {
                        const itemName = item.item_name || item.fallbackName || STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item || 'Item Description';
                        return (
                          <tr key={item.id || item.item || idx} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 inline-block">
                                {item.work_main_category || item.main_category || 'Electrical'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Electrical
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                                {item.activity_type || 'Procurement'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right pr-4 font-black text-amber-700 dark:text-amber-300 whitespace-nowrap">
                              {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-amber-50/80 dark:bg-amber-950/60 border-t-2 border-amber-200 dark:border-amber-800 text-xs font-mono font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 font-sans text-amber-950 dark:text-amber-200">
                        Electrical Containment & Tray Total ({subTab6BoqItems.filter(i => (i.work_type || '').toLowerCase() !== 'mechanical').length} items)
                      </td>
                      <td colSpan={4} className="py-3 px-3 text-right text-amber-700 dark:text-amber-400">
                        Electrical Subtotal:
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-amber-700 dark:text-amber-300 text-sm">
                        {subTab6ElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* SUB-TAB 7: INSTALLATION, LABOR, ACCOMMODATIONS & OTHER BREAKDOWN ITEMS    */}
      {/* ========================================================================= */}
      {emSection === 'installation_scope' && (() => {
        const a = Number(formData.water_feature_area_m2 || 50);
        let calculatedDays = 1;
        if (a <= 1000) calculatedDays = 1;
        else if (a <= 2500) calculatedDays = 1;
        else if (a <= 4000) calculatedDays = 2;
        else if (a <= 5500) calculatedDays = 2;
        else if (a <= 7000) calculatedDays = 2;
        else if (a <= 8500) calculatedDays = 3;
        else if (a <= 10000) calculatedDays = 5;
        else if (a <= 12000) calculatedDays = 5;
        else if (a <= 14000) calculatedDays = 5;
        else if (a <= 16000) calculatedDays = 10;
        else if (a <= 18000) calculatedDays = 10;
        else calculatedDays = 10;

        const isAccom = String(formData.accommodations_required || 'No').trim().toLowerCase() === 'yes';
        const mechLaborers = 8;
        const elecLaborers = 8;
        const totalMechLaborDays = calculatedDays + 30; // Water Feature (calculatedDays) + Pump Room (30 Days)
        const totalElecLaborDays = calculatedDays + 30; // Water Feature (calculatedDays) + Pump Room (30 Days)
        const mechApt = isAccom ? Math.ceil(mechLaborers / 6) * totalMechLaborDays : 0;
        const mechBus = isAccom ? Math.ceil(mechLaborers / 14) * totalMechLaborDays : 0;
        const elecApt = isAccom ? Math.ceil(elecLaborers / 6) * totalElecLaborDays : 0;
        const elecBus = isAccom ? Math.ceil(elecLaborers / 14) * totalElecLaborDays : 0;

        const mechInstItems = subTab7BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'mechanical' && (i.activity_type || '').toLowerCase() !== 'accommodation');
        const elecInstItems = subTab7BoqItems.filter(i => (i.work_type || '').toLowerCase() === 'electrical' && (i.activity_type || '').toLowerCase() !== 'accommodation');
        const accomItems = subTab7BoqItems.filter(i => (i.activity_type || '').toLowerCase() === 'accommodation' || (i.work_main_category || '').toLowerCase().includes('accommodation'));

        return (
          <div className="space-y-6 animate-fadeIn pb-16">
            
            {/* TOP HERO BANNER */}
            <div className="p-5 bg-gradient-to-r from-indigo-900/90 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-lg border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-400/30 backdrop-blur-xs">
                  <HardHat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wide flex items-center gap-2">
                    <span>Sub-Tab 7: Installation Works, Labor & Site Accommodations</span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                      {subTab7BoqItems.length} Real Line Items
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200/80 font-medium">
                    Mechanical pipe networks installation, electrical equipment installation, labor crew sizing, housing apartments & daily microbuses.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold block">Installation & Scope Subtotal</span>
                  <span className="text-lg font-mono font-black text-indigo-100">
                    {subTab7TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-indigo-300 font-normal">EGP</span>
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 1: LABOR SIZING & LOGISTICS KPI DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* 1. Mechanical Labor KPI */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                    Mechanical Installation Labor
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    {calculatedDays} Days
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <span className="text-[10px] text-slate-400 block">Crew Size</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300">{mechLaborers} Laborers</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <span className="text-[10px] text-slate-400 block">Total Effort</span>
                    <span className="font-black text-emerald-700 dark:text-emerald-300">{mechLaborers * calculatedDays} Man-Days</span>
                  </div>
                </div>
              </div>

              {/* 2. Electrical Labor KPI */}
              <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    Electrical Installation Labor
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                    {calculatedDays} Days
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900">
                    <span className="text-[10px] text-slate-400 block">Crew Size</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-300">{elecLaborers} Laborers</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900">
                    <span className="text-[10px] text-slate-400 block">Total Effort</span>
                    <span className="font-black text-indigo-700 dark:text-indigo-300">{elecLaborers * calculatedDays} Man-Days</span>
                  </div>
                </div>
              </div>

              {/* 3. Accommodations & Logistics KPI */}
              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    Housing & Transport
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                    {isAccom ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-purple-900">
                    <span className="text-[10px] text-slate-400 block">Apartments (Class C)</span>
                    <span className="font-black text-purple-700 dark:text-purple-300">{mechApt + elecApt} Units</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-purple-100 dark:border-purple-900">
                    <span className="text-[10px] text-slate-400 block">Microbuses</span>
                    <span className="font-black text-purple-700 dark:text-purple-300">{mechBus + elecBus} Vehicles</span>
                  </div>
                </div>
              </div>

            </div>

            {/* CARD 2: INSTALLATION PARAMETERS CONTROL */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Hammer className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Installation Works & Logistics Parameters
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      Define network installation specification, surface area duration scaling, and accommodation requirements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                
                {/* 1. Mechanical Networks Installation Type */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Mechanical Networks Installation Spec</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">Item 23</span>
                  </label>
                  <SearchableSelect
                    options={mechanicalNetworksOptions}
                    value={formData.mechanical_networks_type || 'ed841fd6-79c8-4829-aab9-dddd13d4d166'}
                    onChange={(val) => handleFieldChange('mechanical_networks_type', val)}
                    placeholder="Select Mechanical Installation Spec..."
                  />
                </div>

                {/* 2. Water Feature Area (m2) for Installation Scaling */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Water Feature Surface Area (m²)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Duration Scaling</span>
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('water_feature_area_m2', Math.max(1, Number(formData.water_feature_area_m2 || 50) - 10))}
                      className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-l-xl text-xs font-bold cursor-pointer"
                    >
                      —
                    </button>
                    <input
                      type="number"
                      value={formData.water_feature_area_m2 || 50}
                      onChange={(e) => handleFieldChange('water_feature_area_m2', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-2 text-xs font-mono font-bold text-center text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleFieldChange('water_feature_area_m2', Number(formData.water_feature_area_m2 || 50) + 10)}
                      className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-r-xl text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 3. Accommodations & Transportation Required */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Accommodations & Transport</span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">Housing</span>
                  </label>
                  <select
                    value={String(formData.accommodations_required || 'No').trim().toLowerCase() === 'yes' ? 'Yes' : 'No'}
                    onChange={(e) => handleFieldChange('accommodations_required', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Yes">Yes (Enable Apartments Class C & Microbus)</option>
                    <option value="No">No (Local Labor / No Accommodations)</option>
                  </select>
                </div>

              </div>
            </div>

            {/* ========================================================================= */}
            {/* CARD 3: MECHANICAL INSTALLATION & SCOPE TABLE (Emerald Theme)             */}
            {/* ========================================================================= */}
            <div className="p-5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 rounded-3xl space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-200/60 dark:border-emerald-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">
                      <span>1. Mechanical Networks Installation & Works</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                        {mechInstItems.length} Items
                      </span>
                    </h4>
                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                      Mechanical pipe networks, pumps installation, fitting assembly & testing works.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-3 py-1 rounded-xl border border-emerald-300/50 dark:border-emerald-700/50">
                  Mechanical Installation Subtotal: {subTab7MechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-emerald-50 dark:bg-emerald-950/60 text-[10px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 border-b border-emerald-200 dark:border-emerald-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Mechanical Item & Specification</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                      <th className="py-2.5 px-3 text-center">Discipline</th>
                      <th className="py-2.5 px-3 text-center">Activity</th>
                      <th className="py-2.5 px-3 text-right">Base Qty</th>
                      <th className="py-2.5 px-3 text-right">Extra %</th>
                      <th className="py-2.5 px-3 text-right">Final Qty</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {mechInstItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-slate-400 font-sans">
                          No mechanical installation lines populated.
                        </td>
                      </tr>
                    ) : (
                      mechInstItems.map((item, idx) => {
                        const itemName = item.item_name || item.fallbackName || STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item || 'Item Description';
                        return (
                          <tr key={item.id || item.item || idx} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-block">
                                {item.work_main_category || item.main_category || 'Mechanical'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Mechanical
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                {item.activity_type || 'Installation'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right pr-4 font-black text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                              {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-emerald-50/80 dark:bg-emerald-950/60 border-t-2 border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 font-sans text-emerald-950 dark:text-emerald-200">
                        Mechanical Installation Total ({mechInstItems.length} items)
                      </td>
                      <td colSpan={4} className="py-3 px-3 text-right text-emerald-700 dark:text-emerald-400">
                        Mechanical Subtotal:
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-emerald-700 dark:text-emerald-300 text-sm">
                        {subTab7MechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* CARD 4: ELECTRICAL INSTALLATION & PANELS TABLE (Indigo Theme)              */}
            {/* ========================================================================= */}
            <div className="p-5 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-800/50 rounded-3xl space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-indigo-200/60 dark:border-indigo-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-2">
                      <span>2. Electrical Works Installation & Control Panels</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                        {elecInstItems.length} Items
                      </span>
                    </h4>
                    <p className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80">
                      Electrical equipment installation, control panels, wiring terminations & testing.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-black text-indigo-800 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-900/60 px-3 py-1 rounded-xl border border-indigo-300/50 dark:border-indigo-700/50">
                  Electrical Installation Subtotal: {subTab7ElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-indigo-50 dark:bg-indigo-950/60 text-[10px] font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 border-b border-indigo-200 dark:border-indigo-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Electrical Item & Specification</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                      <th className="py-2.5 px-3 text-center">Discipline</th>
                      <th className="py-2.5 px-3 text-center">Activity</th>
                      <th className="py-2.5 px-3 text-right">Base Qty</th>
                      <th className="py-2.5 px-3 text-right">Extra %</th>
                      <th className="py-2.5 px-3 text-right">Final Qty</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {elecInstItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-slate-400 font-sans">
                          No electrical installation lines populated.
                        </td>
                      </tr>
                    ) : (
                      elecInstItems.map((item, idx) => {
                        const itemName = item.item_name || item.fallbackName || STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item || 'Item Description';
                        return (
                          <tr key={item.id || item.item || idx} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 inline-block">
                                {item.work_main_category || item.main_category || 'Electrical'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Electrical
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                                {item.activity_type || 'Installation'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right pr-4 font-black text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                              {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-indigo-50/80 dark:bg-indigo-950/60 border-t-2 border-indigo-200 dark:border-indigo-800 text-xs font-mono font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 font-sans text-indigo-950 dark:text-indigo-200">
                        Electrical Installation Total ({elecInstItems.length} items)
                      </td>
                      <td colSpan={4} className="py-3 px-3 text-right text-indigo-700 dark:text-indigo-400">
                        Electrical Subtotal:
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-indigo-700 dark:text-indigo-300 text-sm">
                        {subTab7ElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* CARD 5: ACCOMMODATIONS & TRANSPORTATION LOGISTICS TABLE (Purple Theme)     */}
            {/* ========================================================================= */}
            <div className="p-5 bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-800/50 rounded-3xl space-y-3.5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-200/60 dark:border-purple-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-purple-950 dark:text-purple-200 uppercase tracking-wider flex items-center gap-2">
                      <span>3. Labor Accommodations & Daily Transportation</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700">
                        {accomItems.length} Items
                      </span>
                    </h4>
                    <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80">
                      Housing for mechanical & electrical labor crews (Apartments Class C) and daily commuter transport (Microbus).
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono font-black text-purple-800 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-900/60 px-3 py-1 rounded-xl border border-purple-300/50 dark:border-purple-700/50">
                  Logistics Subtotal: {subTab7AccomCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-purple-200/80 dark:border-purple-800/80 bg-white dark:bg-slate-900">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-purple-50 dark:bg-purple-950/60 text-[10px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 border-b border-purple-200 dark:border-purple-800">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10">#</th>
                      <th className="py-2.5 px-3 min-w-[280px]">Item & Scope Description</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Trade Category</th>
                      <th className="py-2.5 px-3 text-center">Discipline</th>
                      <th className="py-2.5 px-3 text-center">Activity</th>
                      <th className="py-2.5 px-3 text-right">Base Qty</th>
                      <th className="py-2.5 px-3 text-right">Extra %</th>
                      <th className="py-2.5 px-3 text-right">Final Qty</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right pr-4">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-[11px]">
                    {accomItems.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-6 text-center text-slate-400 font-sans">
                          {isAccom ? 'No accommodations lines generated.' : 'Accommodations are currently set to "No". Select "Yes" above to auto-generate Apartments Class C and Microbus transport.'}
                        </td>
                      </tr>
                    ) : (
                      accomItems.map((item, idx) => {
                        const itemName = item.item_name || item.fallbackName || STATIC_ITEMS_LOOKUP[item.item] || itemsMap[item.item]?.item_name || item.item || 'Item Description';
                        return (
                          <tr key={item.id || item.item || idx} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">{itemName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 inline-block">
                                {item.work_main_category || item.main_category || 'General Scope'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                {item.work_type || item.discipline || 'General'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                                {item.activity_type || 'Accommodation'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">{item.extra_amount_percentage ? `${item.extra_amount_percentage}%` : '0%'}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-slate-100">{Number(item.final_quantity || item.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-center font-sans font-bold text-[10px] text-slate-500">{item.unit || 'No.'}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">{Number(item.unit_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="py-2.5 px-3 text-right pr-4 font-black text-purple-700 dark:text-purple-300 whitespace-nowrap">
                              {Number(item.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[9px] text-slate-400">EGP</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-purple-50/80 dark:bg-purple-950/60 border-t-2 border-purple-200 dark:border-purple-800 text-xs font-mono font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 font-sans text-purple-950 dark:text-purple-200">
                        Accommodations & Logistics Total ({accomItems.length} items)
                      </td>
                      <td colSpan={4} className="py-3 px-3 text-right text-purple-700 dark:text-purple-400">
                        Logistics Subtotal:
                      </td>
                      <td colSpan={2} className="py-3 px-4 text-right pr-4 font-black text-purple-700 dark:text-purple-300 text-sm">
                        {subTab7AccomCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>
        );
      })()}

      </div>
    </div>
  );
}