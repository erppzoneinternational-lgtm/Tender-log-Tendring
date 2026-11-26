import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cpu, 
  Zap, 
  Droplets, 
  Activity, 
  FileSpreadsheet, 
  Search, 
  Plus, 
  RefreshCw, 
  Database, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  Filter, 
  Gauge, 
  Boxes, 
  X, 
  Save,
  Flame,
  ShieldCheck,
  Wrench,
  Sliders,
  Edit3,
  Trash2,
  Waves,
  HardHat,
  Table as TableIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  buildErpAuditFields,
  recordErpAuditAndNotification,
  syncAllErpTendersAndCostsToTenderLog,
} from '../lib/erpBridge';
import SearchableSelect from './SearchableSelect';
import WaterFeatureElectromechanicalSuite from './WaterFeatureElectromechanicalSuite';
import WfMepBoqTableTab from './WfMepBoqTableTab';
import { calculateWaterFeatureElectromechanical } from '../utils/engine/modules/waterFeatureElectromechanicalCalc';
import { buildWaterFeatureElectromechanicalBoq } from '../utils/engine/modules/waterFeatureElectromechanicalBoqBuilder';
import { resolveWaterFeatureType, resolveCategoryName } from '../lib/staticLookup';

export default function WaterFeatureElectromechanicalPortal({ onOpenDatabaseTable }) {
  const [activeMainTab, setActiveMainTab] = useState('mep_table'); // 'mep_table' | 'mep_boq'
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [searchTableQuery, setSearchTableQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [notification, setNotification] = useState(null);

  // Dropdown Lookups & Lists from Database
  const [proposals, setProposals] = useState([]);
  const [phases, setPhases] = useState([]);
  const [pdeData, setPdeData] = useState([]);
  const [prTechnicalData, setPrTechnicalData] = useState([]);
  const [mepBoqRecords, setMepBoqRecords] = useState([]);
  
  // MEP Equipment Catalog Lists
  const [filterPumpsList, setFilterPumpsList] = useState([]);
  const [mediaFiltersList, setMediaFiltersList] = useState([]);
  const [itemCategoriesList, setItemCategoriesList] = useState([]);
  const [lightingList, setLightingList] = useState([]);
  const [cablesList, setCablesList] = useState([]);
  const [transformersList, setTransformersList] = useState([]);
  const [junctionBoxesList, setJunctionBoxesList] = useState([]);
  const [accessoriesList, setAccessoriesList] = useState([]);
  const [mainDrainsList, setMainDrainsList] = useState([]);
  const [chlorinatorsList, setChlorinatorsList] = useState([]);
  const [heatersList, setHeatersList] = useState([]);
  const [disconnectSwitchesList, setDisconnectSwitchesList] = useState([]);
  const [conduitsList, setConduitsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [boqWorkTypesList, setBoqWorkTypesList] = useState([]);

  // Active MEP Form State
  const defaultMepFormData = {
    id: null,
    tender_log_id: '',
    phase_id: '',
    linked_proposal: '',
    linked_phase: '',
    related_pump_rooms: [],
    water_feature_area: '',
    water_feature_volume: '',
    water_feature_perimeter: '',
    hours_of_filtration: '6',
    water_filtration: '0.00',
    filtration_speed: '40',
    required_filtration_area_m2: '0.000',
    water_filter_brand: 'e052dc94-8b69-4042-b587-49a266f11a33',
    water_filter_diameter: '',
    water_filter_code: '',
    preferred_water_filter: '',
    no_of_water_filter: '1',
    vacuum_filter_brand: '',
    vacuum_filter_diameter: '',
    vacuum_filter_code: '',
    no_of_vacuum_filter: '0',
    drainage_chamber: 0,
    pump_category: '',
    pump_brand: 'fe7c3a44-3e9d-4a32-8831-d47a042826ee',
    water_filter_pump_code: '',
    preferred_water_filter_pump: '',
    no_of_water_filter_pump: '1',
    no_of_water_filter_pump_stand_by: '0',
    vacuum_pump_category: '',
    vacuum_pump_brand: '',
    vacuum_filter_pump_code: '',
    no_of_vacuum_filter_pump: '0',
    no_of_vacuum_filter_pump_stand_by: '0',
    submersible_pump_category: '',
    submersible_pump_brand: 'fe7c3a44-3e9d-4a32-8831-d47a042826ee',
    submersible_pump_code: '',
    no_of_submersible_pump: '1',
    submersible_pump_qty: '1',
    type_of_chlorinator_system: 'Chlorinator Tablet',
    chemical_feeder_code: '',
    chemical_feeder_qty: '2',
    tablet_chlorinator_type: '',
    tablet_chlorinator_quantity: '1',
    no_of_manual_cleaning_set: '1',
    no_of_skimmer: '0',
    no_of_floor_inlets: '0',
    no_of_wall_inlets: '0',
    no_of_vacuum_inlets: '0',
    no_of_main_drain: '2',
    no_of_gutter_drain: '0',
    no_of_selnoid_valve: '1',
    no_of_float_valve: '1',
    no_of_float_switch: '2',
    heater_brand: '',
    heater_type: '',
    recommended_heater_model: '',
    no_of_heaters: '1',
    heater_qty: '1',
    lighting_brand: '',
    underwater_light_type: '',
    water_feature_lighting_code: '',
    qty_lights: '1',
    water_feature_lighting_backbox: '',
    electric_cable_length_per_one_lighting: '5',
    transformer_brand: '',
    transformer_type: '',
    transformer_qty: '1',
    junction_box_type: '',
    junction_box_qty: '1',
    main_cable_tray_length_m: '0',
    splice_plate_quantity: '0',
    main_cable_tray_c_channel_quantity: '0',
    main_cable_tray_anchors_quantity: '0',
    main_cable_tray_vertical_elbow_90_quantity: '2',
    end_cap_qty_quantity: '2',
    no_of_earthing_rods_qty: '2',
    total_earthing_cable_length_m: '0',
    pump_room_lighting_quantity: '2',
    service_socket_qty: '2',
    no_of_fire_extinguisher: '1',
    disconnect_switch_type: '',
    accommodations_required: 'No',
    proposal_breakdown_items: []
  };

  const [formData, setFormData] = useState(defaultMepFormData);

  // Helper to fetch all items with pagination
  const fetchAllItems = async () => {
    let all = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .range(from, from + step - 1);
      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        all = all.concat(data);
        if (data.length < step) hasMore = false;
        else from += step;
      }
    }
    return all;
  };

  // Helper to fetch all proposal_breakdown_items with pagination (avoids 1,000-row limit)
  const fetchAllBreakdownItems = async () => {
    let all = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from('proposal_breakdown_items')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + step - 1);
      if (error || !data || data.length === 0) {
        hasMore = false;
      } else {
        all = all.concat(data);
        if (data.length < step) hasMore = false;
        else from += step;
      }
    }
    return all;
  };

  // Load All Required Master Data from Supabase with safe fallback wrappers
  const loadAllData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [
        { data: propList },
        { data: phaseList },
        { data: pdeList },
        { data: prList },
        mepBoqList,
        { data: pumpsList },
        { data: filtersList },
        { data: itemCatList },
        { data: lightsList },
        { data: cableList },
        { data: transList },
        { data: juncList },
        { data: accessList },
        { data: drainList },
        { data: chlorList },
        { data: heatList },
        { data: switchList },
        { data: condList },
        { data: brandList },
        { data: bwtList },
        allItems
      ] = await Promise.all([
        supabase.from('tender_log').select('id, proposal_number, proposal_title, proposal_full_title').order('created_at', { ascending: false }).then(res => res.error ? { data: [] } : res),
        supabase.from('phases').select('id, phase_title, phase_full_title, component_type, tender_log_id').order('created_at', { ascending: false }).then(res => res.error ? { data: [] } : res),
        supabase.from('proposal_data_entry').select('*').order('created_at', { ascending: false }).then(res => res.error ? { data: [] } : res),
        supabase.from('pump_room_data_entry').select('*').order('created_at', { ascending: false }).then(res => res.error ? { data: [] } : res),
        fetchAllBreakdownItems(),
        supabase.from('filter_pump_types').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('filter_types').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('item_categories').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('lighting_type').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('cable_types').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('transformer_type').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('junction_box').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('circulation_accessories').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('main_drain').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('tablet_chlorinator').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('heaters').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('disconnect_switch_types').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('cable_conduits').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('brands').select('*').then(res => res.error ? { data: [] } : res),
        supabase.from('boq_work_type').select('*').then(res => res.error ? { data: [] } : res),
        fetchAllItems()
      ]);

      const safeProps = propList || [];
      const safePhases = phaseList || [];
      const safePde = pdeList || [];
      const safePr = prList || [];
      const safeMepBoq = (mepBoqList || []).filter(r => 
        ['mechanical', 'electrical'].includes(String(r.work_type || '').toLowerCase().trim())
      );

      setProposals(safeProps);
      setPhases(safePhases);
      setPdeData(safePde);
      setPrTechnicalData(safePr);
      setMepBoqRecords(safeMepBoq);

      const safeFilters = filtersList || [];
      const safePumps = pumpsList || [];
      const safeItemCats = itemCatList || [];
      const safeLights = lightsList || [];
      const safeCables = cableList || [];
      const safeTrans = transList || [];
      const safeJunc = juncList || [];
      const safeAccess = accessList || [];
      const safeDrains = drainList || [];
      const safeChlor = chlorList || [];
      const safeHeat = heatList || [];
      const safeSwitch = switchList || [];
      const safeCond = condList || [];
      const safeBrands = brandList || [];
      const safeBwt = bwtList || [];

      setFilterPumpsList(safePumps);
      setMediaFiltersList(safeFilters);
      setItemCategoriesList(safeItemCats);
      setLightingList(safeLights);
      setCablesList(safeCables);
      setTransformersList(safeTrans);
      setJunctionBoxesList(safeJunc);
      setAccessoriesList(safeAccess);
      setMainDrainsList(safeDrains);
      setChlorinatorsList(safeChlor);
      setHeatersList(safeHeat);
      setDisconnectSwitchesList(safeSwitch);
      setConduitsList(safeCond);
      setBrandsList(safeBrands);
      setBoqWorkTypesList(safeBwt);
      setItemsList(allItems || []);

      // Initialize with blank MEP form
      setFormData({
        ...defaultMepFormData,
        id: null,
        tender_log_id: '',
        linked_proposal: '',
        phase_id: '',
        linked_phase: '',
        related_pump_rooms: [],
        proposal_breakdown_items: []
      });
    } catch (err) {
      console.error('Failed to load MEP data:', err);
      setErrorMessage(err.message || 'Failed to initialize Electromechanical data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const parseNum = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  // Recalculate and Synchronize BOQ whenever Form Data changes
  const handleFormUpdate = (newForm) => {
    try {
      const phaseId = newForm.phase_id || newForm.linked_phase;
      const candidates = pdeData.filter(w => String(w.phase_id || w.linked_phase || w.id) === String(phaseId));
      const pde = candidates.find(w => Number(w.water_feature_area_m2 || (Number(w.pool_length_m) * Number(w.pool_width_m))) > 0) || candidates[0];

      const pL = parseNum(newForm.pool_length_m || newForm.pool_length || pde?.pool_length_m);
      const pW = parseNum(newForm.pool_width_m || newForm.pool_width || pde?.pool_width_m);
      const calcArea = (pL > 0 && pW > 0) ? Number((pL * pW).toFixed(2)) : 0;
      const area = parseNum(newForm.water_feature_area_m2 || newForm.water_feature_area || newForm.pool_surface_area_m2 || pde?.water_feature_area_m2) || calcArea || 50;
      const depth = parseNum(newForm.pool_depth_m || newForm.pool_depth || newForm.average_depth_m || newForm.depth_m || pde?.avg_height_m || pde?.water_deep_height_m) || 1.4;
      const vol = parseNum(newForm.water_feature_volume_m3 || newForm.water_feature_volume || newForm.pool_volume_m3 || pde?.water_feature_volume_m3) || Number((area * depth).toFixed(2)) || 70;
      const perim = parseNum(newForm.water_feature_perimeter_m || newForm.water_feature_perimeter || newForm.pool_perimeter_m || pde?.water_feature_perimeter_m) || (pL > 0 && pW > 0 ? Number((2 * (pL + pW)).toFixed(2)) : 30);

      newForm.water_feature_area = String(area);
      newForm.water_feature_area_m2 = area;
      newForm.water_feature_volume = String(vol);
      newForm.water_feature_volume_m3 = vol;
      newForm.water_feature_perimeter = String(perim);
      newForm.water_feature_perimeter_m = perim;
      newForm.depth_m = depth;
      if (!newForm.accommodations_required) {
        newForm.accommodations_required = pde?.accommodations_required || 'No';
      }

      const parentRecord = {
        pool_length_m: pL,
        pool_width_m: pW,
        pool_depth_m: depth,
        water_feature_perimeter_m: perim,
        water_feature_volume_m3: vol,
        water_feature_area_m2: area,
        accommodations_required: newForm.accommodations_required || 'No'
      };

      const calculated = calculateWaterFeatureElectromechanical({ ...newForm }, parentRecord, {
        proposal_data_entry: pdeData || [],
        pump_room_data_entry: prTechnicalData || [],
        mediaFilters: mediaFiltersList || [],
        filter_types: mediaFiltersList || [],
        filterPumps: filterPumpsList || [],
        filter_pump_types: filterPumpsList || [],
        heaters: heatersList || [],
        lightingList: lightingList || []
      });

      const boqRes = buildWaterFeatureElectromechanicalBoq(calculated, calculated.proposal_breakdown_items || [], {
        items: itemsList || [],
        items_database: itemsList || [],
        phases: phases || [],
        water_feature_category: itemCategoriesList || [],
        filter_pump_types: filterPumpsList || [],
        filter_types: mediaFiltersList || [],
        mediaFilters: mediaFiltersList || [],
        filterPumps: filterPumpsList || [],
        lighting_type: lightingList || [],
        lightingList: lightingList || [],
        transformer_type: transformersList || [],
        cable_types: cablesList || [],
        cables: cablesList || [],
        junction_box: junctionBoxesList || [],
        circulation_accessories: accessoriesList || [],
        main_drain: mainDrainsList || [],
        tablet_chlorinator: chlorinatorsList || [],
        heaters: heatersList || [],
        disconnect_switch_types: disconnectSwitchesList || [],
        cable_conduits: conduitsList || []
      }, parentRecord);

      const boqList = Array.isArray(boqRes) ? boqRes : (boqRes?.proposal_breakdown_items || boqRes?.items || []);
      calculated.proposal_breakdown_items = boqList;
      setFormData(calculated);
    } catch (err) {
      console.warn('handleFormUpdate fallback:', err);
      setFormData(newForm);
    }
  };

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const formatBoqRowForUpsert = (row, tenderLogId, phaseId) => {
    let resolvedItemUuid = null;
    if (row.item_uuid && UUID_REGEX.test(row.item_uuid)) {
      resolvedItemUuid = row.item_uuid;
    } else if (row.item && UUID_REGEX.test(row.item)) {
      resolvedItemUuid = row.item;
    } else if (row.item_id && UUID_REGEX.test(row.item_id)) {
      resolvedItemUuid = row.item_id;
    } else {
      const searchName = String(row.item || row.item_name || row.fallbackName || '').toLowerCase().trim();
      if (searchName) {
        const matchedItem = itemsList.find(i => 
          String(i.item_name || '').toLowerCase().trim() === searchName ||
          String(i.i_axiom_description || '').toLowerCase().trim() === searchName
        );
        if (matchedItem?.id && UUID_REGEX.test(matchedItem.id)) {
          resolvedItemUuid = matchedItem.id;
        }
      }
    }

    let resolvedWorkMainCategory = null;
    if (row.work_main_category && UUID_REGEX.test(row.work_main_category)) {
      resolvedWorkMainCategory = row.work_main_category;
    } else {
      const searchCat = String(row.work_main_category || row.main_category || '').toLowerCase().trim();
      const resolvedLabel = resolveCategoryName(row, boqWorkTypesList).toLowerCase().trim();
      if (searchCat || resolvedLabel) {
        const matchedBwt = boqWorkTypesList.find(b => {
          const bwt = String(b.work_type || '').toLowerCase().trim();
          return bwt === searchCat || bwt === resolvedLabel;
        });
        if (matchedBwt?.id && UUID_REGEX.test(matchedBwt.id)) {
          resolvedWorkMainCategory = matchedBwt.id;
        }
      }
    }

    // Default fallback category if unmapped
    if (!resolvedWorkMainCategory) {
      const isElec = (row.work_type || '').toLowerCase().includes('elec');
      const defaultBwt = boqWorkTypesList.find(b => isElec 
        ? String(b.work_type || '').toLowerCase().trim() === 'electrical' || b.work_type?.toLowerCase().includes('elect')
        : String(b.work_type || '').toLowerCase().trim() === 'mechanical' || b.work_type?.toLowerCase().includes('mech')
      );
      if (defaultBwt) resolvedWorkMainCategory = defaultBwt.id;
    }

    return {
      tender_log_id: tenderLogId,
      phase_id: phaseId,
      phase_component: row.phase_component || 'Water Feature',
      main_category: 'Construction',
      work_type: row.work_type || 'Mechanical',
      work_main_category: resolvedWorkMainCategory,
      activity_responsibility: row.activity_responsibility || 'P.Zone',
      activity_type: row.activity_type || 'Procurement',
      item: resolvedItemUuid,
      unit: row.unit || 'No.',
      quantity: Number(row.quantity || row.final_quantity || 1),
      extra_amount_percentage: Number(row.extra_amount_percentage || 0),
      final_quantity: Number(row.final_quantity || row.quantity || 1),
      unit_cost: Number(row.unit_cost || 0),
      total_cost: Number(row.total_cost || 0),
      days_to_complete: Number(row.days_to_complete || 0),
      laborers_per_group: Number(row.laborers_per_group || 0),
      productivity_rate_per_day: Number(row.productivity_rate_per_day || 0),
      _isautogenerated: true,
      _spawnerid: row._spawnerid || row.rowIdFlag || '_isEmAuto',
      ...buildErpAuditFields(false)
    };
  };

  // Save MEP Configuration & BOQ Items to Supabase
  const handleSaveAll = async () => {
    const tenderLogId = formData.tender_log_id || formData.linked_proposal || formData.project_title || '';
    const phaseId = formData.phase_id || formData.linked_phase || '';

    if (!tenderLogId || !phaseId) {
      setNotification({
        type: 'error',
        message: 'Please select a Proposal and a Water Feature Phase before saving.'
      });
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      // 1. Calculate & Generate fresh BOQ Items from Current Form Data
      const parentRecord = {
        pool_length_m: parseNum(formData.pool_length_m || formData.pool_length),
        pool_width_m: parseNum(formData.pool_width_m || formData.pool_width),
        pool_depth_m: parseNum(formData.pool_depth_m || formData.pool_depth || formData.average_depth_m),
        water_feature_perimeter_m: parseNum(formData.water_feature_perimeter_m || formData.water_feature_perimeter || formData.pool_perimeter_m),
        water_feature_volume_m3: parseNum(formData.water_feature_volume_m3 || formData.water_feature_volume || formData.pool_volume_m3),
        water_feature_area_m2: parseNum(formData.water_feature_area_m2 || formData.water_feature_area || formData.pool_surface_area_m2),
        accommodations_required: formData.accommodations_required || 'No'
      };

      const calculated = calculateWaterFeatureElectromechanical({
        ...formData,
        tender_log_id: tenderLogId,
        phase_id: phaseId
      }, parentRecord, {
        proposal_data_entry: pdeData,
        pump_room_data_entry: prTechnicalData,
        mediaFilters: mediaFiltersList,
        filter_types: mediaFiltersList,
        filterPumps: filterPumpsList,
        filter_pump_types: filterPumpsList,
        heaters: heatersList,
        lightingList: lightingList
      });

      const boqRes = buildWaterFeatureElectromechanicalBoq(calculated, formData.proposal_breakdown_items || [], {
        items: itemsList,
        items_database: itemsList,
        phases,
        water_feature_category: itemCategoriesList,
        filter_pump_types: filterPumpsList,
        filter_types: mediaFiltersList,
        mediaFilters: mediaFiltersList,
        filterPumps: filterPumpsList,
        lighting_type: lightingList,
        lightingList: lightingList,
        transformer_type: transformersList,
        cable_types: cablesList,
        cables: cablesList,
        junction_box: junctionBoxesList,
        circulation_accessories: accessoriesList,
        main_drain: mainDrainsList,
        tablet_chlorinator: chlorinatorsList,
        heaters: heatersList,
        disconnect_switch_types: disconnectSwitchesList,
        cable_conduits: conduitsList
      }, parentRecord);

      const boqItems = Array.isArray(boqRes) ? boqRes : (boqRes?.proposal_breakdown_items || boqRes?.items || []);

      // 2. Synchronize proposal_data_entry if matched
      const pdeRecord = pdeData.find(w => String(w.phase_id || w.linked_phase || w.id) === String(phaseId));
      if (pdeRecord) {
        const pdeUpdates = {
          hours_of_water_filtration_h: Number(formData.hours_of_filtration) || 6,
          ...buildErpAuditFields(true)
        };
        if (formData.water_filtration_method) {
          pdeUpdates.method_of_water_filtration = formData.water_filtration_method;
        }
        if (formData.accommodations_required) {
          pdeUpdates.accommodations_required = formData.accommodations_required;
        }
        await supabase
          .from('proposal_data_entry')
          .update(pdeUpdates)
          .eq('id', pdeRecord.id);
      }

      // 3. Synchronize BOQ line items in proposal_breakdown_items
      const { error: delErr } = await supabase
        .from('proposal_breakdown_items')
        .delete()
        .eq('phase_id', phaseId)
        .in('work_type', ['Mechanical', 'Electrical', 'mechanical', 'electrical', 'MECHANICAL', 'ELECTRICAL']);

      if (delErr) {
        console.warn('Note deleting old MEP rows:', delErr);
      }

      if (boqItems.length > 0) {
        const boqPayload = boqItems.map(item => 
          formatBoqRowForUpsert(item, tenderLogId, phaseId)
        );

        const { error: insertErr } = await supabase
          .from('proposal_breakdown_items')
          .insert(boqPayload);

        if (insertErr) {
          console.error('Error inserting BOQ breakdown items:', insertErr);
          throw new Error('Failed to synchronize BOQ items: ' + insertErr.message);
        }
      }

      const savedMechTotal = boqItems
        .filter(i => String(i?.work_type || '').toLowerCase() === 'mechanical' && i?.activity_responsibility !== 'Client')
        .reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);
      const savedElecTotal = boqItems
        .filter(i => String(i?.work_type || '').toLowerCase() === 'electrical' && i?.activity_responsibility !== 'Client')
        .reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);
      const matchedPropMep = proposals.find(p => String(p.id) === String(tenderLogId));
      const matchedPhMep = phases.find(p => String(p.id) === String(phaseId));

      recordErpAuditAndNotification({
        table_name: 'proposal_breakdown_items',
        record_id: String(phaseId),
        erp_tender_id: tenderLogId ? String(tenderLogId) : null,
        proposal_code: matchedPropMep?.proposal_number || null,
        action: 'UPDATE',
        new_data: {
          phase: matchedPhMep?.phase_title || phaseId,
          mep_boq_items_count: boqItems.length,
          mechanical_direct_cost_egp: Math.round(savedMechTotal),
          electrical_direct_cost_egp: Math.round(savedElecTotal),
        },
        notification: {
          type: 'erp_mep_boq_synced',
          targetRoles: ['app_admin', 'tender_manager', 'mechanical_engineer', 'electrical_engineer'],
          includeAssignedEngineers: true,
          title_en: `Electromechanical (MEP) BOQ Synced (${matchedPhMep?.phase_title || 'Phase'})`,
          title_ar: `مزامنة مقايسة الكهروميكانيك (${matchedPhMep?.phase_title || 'المرحلة'})`,
          message_en: `${boqItems.length} MEP items synced — Mechanical: ${Math.round(savedMechTotal).toLocaleString()} EGP • Electrical: ${Math.round(savedElecTotal).toLocaleString()} EGP.`,
          message_ar: `تمت مزامنة ${boqItems.length} بند كهروميكانيك — ميكانيكا: ${Math.round(savedMechTotal).toLocaleString()} ج.م • كهرباء: ${Math.round(savedElecTotal).toLocaleString()} ج.م.`,
        },
      });
      void syncAllErpTendersAndCostsToTenderLog();

      setNotification({
        type: 'success',
        message: `Water Feature Electromechanical scope & ${boqItems.length} BOQ items synchronized successfully!`
      });
      setTimeout(() => setNotification(null), 4000);
      handleCloseModal();
      await loadAllData();
    } catch (err) {
      console.error('Error saving MEP scope:', err);
      setErrorMessage(err.message || 'Failed to save MEP configuration');
      setNotification({
        type: 'error',
        message: err.message || 'Failed to save MEP configuration'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Safe Cost Aggregations (with live calculation fallback)
  const allBoqItems = useMemo(() => {
    if (formData && Array.isArray(formData.proposal_breakdown_items) && formData.proposal_breakdown_items.length > 0) {
      return formData.proposal_breakdown_items;
    }
    if (formData && Array.isArray(formData.proposal_breakdown_items?.items) && formData.proposal_breakdown_items.items.length > 0) {
      return formData.proposal_breakdown_items.items;
    }
    try {
      const parentRecord = {
        pool_length_m: Number(formData?.pool_length_m || formData?.pool_length || 0),
        pool_width_m: Number(formData?.pool_width_m || formData?.pool_width || 0),
        pool_depth_m: Number(formData?.pool_depth_m || formData?.pool_depth || 0),
        water_feature_perimeter_m: Number(formData?.water_feature_perimeter_m || formData?.water_feature_perimeter || 0),
        water_feature_volume_m3: Number(formData?.water_feature_volume_m3 || formData?.water_feature_volume || 0),
        water_feature_area_m2: Number(formData?.water_feature_area_m2 || formData?.water_feature_area || 0)
      };
      const boqRes = buildWaterFeatureElectromechanicalBoq(formData || {}, [], {
        items: itemsList || [],
        items_database: itemsList || [],
        phases: phases || [],
        water_feature_category: itemCategoriesList || [],
        filter_pump_types: filterPumpsList || [],
        filter_types: mediaFiltersList || [],
        mediaFilters: mediaFiltersList || [],
        filterPumps: filterPumpsList || [],
        lighting_type: lightingList || [],
        lightingList: lightingList || [],
        transformer_type: transformersList || [],
        cable_types: cablesList || [],
        cables: cablesList || [],
        junction_box: junctionBoxesList || [],
        circulation_accessories: accessoriesList || [],
        main_drain: mainDrainsList || [],
        tablet_chlorinator: chlorinatorsList || [],
        heaters: heatersList || [],
        disconnect_switch_types: disconnectSwitchesList || [],
        cable_conduits: conduitsList || []
      }, parentRecord);
      const boqList = Array.isArray(boqRes) ? boqRes : (boqRes?.proposal_breakdown_items || boqRes?.items || []);
      return boqList;
    } catch (e) {
      console.warn('Dynamic live BOQ calculation in Portal:', e);
      return [];
    }
  }, [
    formData,
    itemsList,
    phases,
    itemCategoriesList,
    filterPumpsList,
    mediaFiltersList,
    lightingList,
    transformersList,
    cablesList,
    junctionBoxesList,
    accessoriesList,
    mainDrainsList,
    chlorinatorsList,
    heatersList,
    disconnectSwitchesList,
    conduitsList
  ]);

  const mechCost = useMemo(() => {
    return allBoqItems
      .filter(i => (i?.work_type || '').toLowerCase() === 'mechanical' && i?.activity_responsibility !== 'Client')
      .reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);
  }, [allBoqItems]);

  const elecCost = useMemo(() => {
    return allBoqItems
      .filter(i => (i?.work_type || '').toLowerCase() === 'electrical' && i?.activity_responsibility !== 'Client')
      .reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);
  }, [allBoqItems]);

  const totalMepCost = mechCost + elecCost;

  // Portal-wide MEP cost metrics across all synchronized DB records
  const portalMechCost = useMemo(() => {
    return mepBoqRecords
      .filter(i => (i?.work_type || '').toLowerCase() === 'mechanical' && i?.activity_responsibility !== 'Client')
      .reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);
  }, [mepBoqRecords]);

  const portalElecCost = useMemo(() => {
    return mepBoqRecords
      .filter(i => (i?.work_type || '').toLowerCase() === 'electrical' && i?.activity_responsibility !== 'Client')
      .reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);
  }, [mepBoqRecords]);

  const portalTotalMepCost = portalMechCost + portalElecCost;

  const [showOnlyConfigured, setShowOnlyConfigured] = useState(true);

  // All Water Feature Scopes
  const allMepScopes = useMemo(() => {
    const wfPhases = phases.filter(p => {
      const comp = String(p.component_type || '').toLowerCase();
      const title = String(p.phase_title || '').toLowerCase();
      return !comp.includes('pump') && !title.includes('pump room') && !title.includes('pump_room');
    });

    return wfPhases.map(ph => {
      const prop = proposals.find(p => String(p.id) === String(ph.tender_log_id));
      const pde = pdeData.find(w => String(w.phase_id || w.linked_phase || w.id) === String(ph.id));
      
      let phaseBoq = mepBoqRecords.filter(b => 
        (!b.tender_log_id || String(b.tender_log_id) === String(ph.tender_log_id) || String(b.tender_log_id) === String(prop?.id)) && 
        String(b.phase_id) === String(ph.id)
      );

      const mech = phaseBoq
        .filter(i => (i?.work_type || '').toLowerCase() === 'mechanical' && i?.activity_responsibility !== 'Client')
        .reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);

      const elec = phaseBoq
        .filter(i => (i?.work_type || '').toLowerCase() === 'electrical' && i?.activity_responsibility !== 'Client')
        .reduce((acc, i) => acc + (Number(i?.total_cost) || 0), 0);

      const total = mech + elec;
      const typeLabel = resolveWaterFeatureType(pde, pde ? 'Swimming Pool' : 'Pending Specification');

      return {
        id: ph.id,
        phase: ph,
        proposal: prop,
        pde: pde,
        wfTypeLabel: typeLabel,
        mechCost: mech,
        elecCost: elec,
        totalCost: total,
        boqItemsCount: phaseBoq.length,
        isConfigured: phaseBoq.length > 0 && total > 0
      };
    });
  }, [phases, proposals, pdeData, mepBoqRecords]);

  const configuredMepScopes = useMemo(() => {
    return showOnlyConfigured ? allMepScopes.filter(s => s.isConfigured) : allMepScopes;
  }, [allMepScopes, showOnlyConfigured]);

  const filteredMepScopes = useMemo(() => {
    if (!searchTableQuery.trim()) return configuredMepScopes;
    const q = searchTableQuery.toLowerCase();
    return configuredMepScopes.filter(s => {
      const propStr = `${s.proposal?.proposal_number || ''} ${s.proposal?.proposal_title || ''} ${s.proposal?.proposal_full_title || ''}`.toLowerCase();
      const phaseStr = `${s.phase?.phase_title || ''} ${s.phase?.phase_full_title || ''}`.toLowerCase();
      const typeStr = (s.wfTypeLabel || '').toLowerCase();
      return propStr.includes(q) || phaseStr.includes(q) || typeStr.includes(q);
    });
  }, [configuredMepScopes, searchTableQuery]);

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setFormData({
      ...defaultMepFormData,
      id: null,
      tender_log_id: '',
      linked_proposal: '',
      phase_id: '',
      linked_phase: '',
      related_pump_rooms: [],
      proposal_breakdown_items: []
    });
    setNotification(null);
    setErrorMessage(null);
  };

  const handleAddNew = () => {
    try {
      const nextData = {
        ...defaultMepFormData,
        id: null,
        tender_log_id: '',
        linked_proposal: '',
        phase_id: '',
        linked_phase: '',
        water_feature_type: '',
        water_feature_category: '2af5028b-4bec-403e-8825-75984bcbda28',
        water_filter_brand: 'e052dc94-8b69-4042-b587-49a266f11a33',
        pump_brand: 'fe7c3a44-3e9d-4a32-8831-d47a042826ee',
        submersible_pump_brand: 'fe7c3a44-3e9d-4a32-8831-d47a042826ee',
        water_filter_code: '',
        water_filter_pump_code: '',
        submersible_pump_code: '',
        water_feature_area: '',
        water_feature_area_m2: 0,
        water_feature_volume: '',
        water_feature_volume_m3: 0,
        water_feature_perimeter: '',
        water_feature_perimeter_m: 0,
        depth_m: 1.4,
        hours_of_filtration: '6',
        water_filtration: '0.00',
        accommodations_required: 'No',
        related_pump_rooms: [],
        proposal_breakdown_items: []
      };
      setFormData(nextData);
      setIsFormModalOpen(true);
    } catch (err) {
      console.error('Error in handleAddNew:', err);
      setFormData({ ...defaultMepFormData, accommodations_required: 'No', proposal_breakdown_items: [] });
      setIsFormModalOpen(true);
    }
  };

  const handleEditScope = (scope) => {
    const propId = scope.proposal?.id || scope.phase?.tender_log_id;
    const phaseId = scope.phase?.id;
    const propPhases = phases.filter(p => String(p.tender_log_id) === String(propId));
    const prs = propPhases.filter(p => p.component_type?.toLowerCase().includes('pump') || p.phase_title?.toLowerCase().includes('pump'));
    
    // Find PDE candidate prioritizing non-null dimensions
    const candidates = pdeData.filter(w => String(w.phase_id || w.linked_phase || w.id) === String(phaseId));
    const pde = scope.pde || candidates.find(w => Number(w.water_feature_area_m2 || (Number(w.pool_length_m) * Number(w.pool_width_m))) > 0) || candidates[0];
    const existingBoq = mepBoqRecords.filter(b => String(b.phase_id) === String(phaseId));

    const pL = Number(pde?.pool_length_m) || 0;
    const pW = Number(pde?.pool_width_m) || 0;
    const resolvedArea = Number(pde?.water_feature_area_m2 || pde?.water_feature_area) || 
      (pL > 0 && pW > 0 ? Number((pL * pW).toFixed(2)) : 0) || 
      Number(formData.water_feature_area_m2 || formData.water_feature_area) || 50;
    const resolvedDepth = Number(pde?.avg_height_m || pde?.water_deep_height_m || pde?.depth_m || formData.depth_m) || 1.4;
    const resolvedVol = Number(pde?.water_feature_volume_m3 || pde?.water_feature_volume) || 
      Number((resolvedArea * resolvedDepth).toFixed(2));
    const resolvedPerim = Number(pde?.water_feature_perimeter_m || pde?.water_feature_perimeter) || 
      (pL > 0 && pW > 0 ? Number((2 * (pL + pW)).toFixed(2)) : 30);
    const hrs = pde?.hours_of_water_filtration_h ? String(pde.hours_of_water_filtration_h) : (formData.hours_of_filtration || '6');
    const flow = Number((resolvedVol / (Number(hrs) || 6)).toFixed(2));

    let nextData = {
      ...defaultMepFormData,
      tender_log_id: propId,
      linked_proposal: propId,
      phase_id: phaseId,
      linked_phase: phaseId,
      water_feature_type: pde?.water_feature_type || '',
      water_feature_category: pde?.water_feature_category || '2af5028b-4bec-403e-8825-75984bcbda28',
      water_feature_area: String(resolvedArea),
      water_feature_area_m2: resolvedArea,
      water_feature_volume: String(resolvedVol),
      water_feature_volume_m3: resolvedVol,
      water_feature_perimeter: String(resolvedPerim),
      water_feature_perimeter_m: resolvedPerim,
      depth_m: resolvedDepth,
      pool_length_m: pde?.pool_length_m || '',
      pool_width_m: pde?.pool_width_m || '',
      hours_of_filtration: hrs,
      water_filtration: String(flow),
      accommodations_required: pde?.accommodations_required || scope.phase?.accommodations_required || 'No',
      related_pump_rooms: prs.map(p => p.id),
      proposal_breakdown_items: existingBoq.length > 0 ? existingBoq : []
    };

    handleFormUpdate(nextData);
    setIsFormModalOpen(true);
  };

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    scope: null,
    title: '',
    subtitle: '',
    isDeleting: false
  });

  const promptDeleteScope = (scope, e) => {
    if (e) e.stopPropagation();
    const propNum = scope.proposal?.proposal_number || 'this proposal';
    const phaseTitle = scope.phase?.phase_title || 'selected phase';
    setDeleteModal({
      isOpen: true,
      scope,
      title: `Remove Electromechanical BOQ Items?`,
      subtitle: `Are you sure you want to remove the electromechanical BOQ breakdown items for ${phaseTitle} (${propNum})?`,
      isDeleting: false
    });
  };

  const handleConfirmDeleteScope = async () => {
    if (!deleteModal.scope) return;
    const scope = deleteModal.scope;
    const phaseId = scope.phase?.id || scope.id;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      let query = supabase
        .from('proposal_breakdown_items')
        .delete()
        .eq('phase_id', phaseId)
        .in('work_type', ['Mechanical', 'Electrical', 'mechanical', 'electrical', 'MECHANICAL', 'ELECTRICAL']);

      const { error } = await query;
      if (error) throw error;

      // Optimistically remove from state so the UI reflects the deletion immediately in both Tab 1 and Tab 2
      setMepBoqRecords(prev => prev.filter(b => !(
        String(b.phase_id) === String(phaseId) &&
        ['mechanical', 'electrical'].includes(String(b.work_type || '').toLowerCase())
      )));

      // Reset formData if it was currently pointing to this phase
      if (String(formData.phase_id) === String(phaseId)) {
        setFormData({
          ...defaultMepFormData,
          id: null,
          tender_log_id: '',
          linked_proposal: '',
          phase_id: '',
          linked_phase: '',
          related_pump_rooms: [],
          proposal_breakdown_items: []
        });
      }

      recordErpAuditAndNotification({
        table_name: 'proposal_breakdown_items',
        record_id: String(phaseId),
        erp_tender_id: scope.proposal?.id ? String(scope.proposal.id) : null,
        proposal_code: scope.proposal?.proposal_number || null,
        action: 'DELETE',
        old_data: {
          phase: scope.phase?.phase_title || phaseId,
          removed_mep_items_count: scope.boqItemsCount || 0,
        },
      });
      void syncAllErpTendersAndCostsToTenderLog();

      setNotification({
        type: 'success',
        message: `Removed electromechanical items for ${scope.proposal?.proposal_number || 'selected phase'}.`
      });
      await loadAllData();
      setDeleteModal({ isOpen: false, scope: null, title: '', subtitle: '', isDeleting: false });
    } catch (err) {
      console.error('Failed to delete scope:', err);
      setNotification({ type: 'error', message: err.message || 'Failed to delete items' });
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400" />
        <p className="text-sm font-semibold text-slate-500">
          Loading Electromechanical Engineering Master Database & Equipment Catalogs...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                Water Feature Electromechanical Portal
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Suite 4.0
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Hydraulic turnover, sand filters, circulation pumps, dosing, heaters, LED lighting, transformers, containment & earthing.
              </p>
            </div>
          </div>
        </div>

        {/* METRICS & ADD NEW RECORD ACTION */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="px-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Total MEP Cost</span>
            <span className="text-sm font-black font-mono text-teal-400">
              {portalTotalMepCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-teal-950/40 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add New Electromechanical</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
          notification.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </div>
          <button type="button" onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP NAVIGATION TABS (MATCHING CIVIL & FINISHES PORTALS) */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainTab('mep_table')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer border ${
              activeMainTab === 'mep_table'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-500" />
            <span>1. WF Electromechanical</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeMainTab === 'mep_table'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
            }`}>
              {configuredMepScopes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('mep_boq')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer border ${
              activeMainTab === 'mep_boq'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>2. Master MEP BOQ Table</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeMainTab === 'mep_boq'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            }`}>
              {mepBoqRecords.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
            Mech: {portalMechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
          </span>
          <span>•</span>
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
            Elec: {portalElecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
          </span>
        </div>
      </div>

      {/* TAB 1: WATER FEATURE ELECTROMECHANICAL WORKS TABLE */}
      {activeMainTab === 'mep_table' && (
        <div className="space-y-4">
          {/* SEARCH & SCOPES COUNT BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search proposals or phases..."
                value={searchTableQuery}
                onChange={(e) => setSearchTableQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowOnlyConfigured(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  showOnlyConfigured
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Configured Scopes ({phases.filter(p => !String(p.component_type || '').toLowerCase().includes('pump') && mepBoqRecords.some(b => String(b.phase_id) === String(p.id))).length})
              </button>
              <button
                type="button"
                onClick={() => setShowOnlyConfigured(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  !showOnlyConfigured
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Water Feature Phases ({phases.filter(p => !String(p.component_type || '').toLowerCase().includes('pump')).length})
              </button>
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden w-full">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>Water Feature Electromechanical Works Table (water_feature_electromechanical)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Turnover cycle, sand filters, circulation pumps, dosing, heaters, underwater lighting, transformers, conduits & earthing.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800 font-mono">
                {configuredMepScopes.length} Records
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 w-10 text-center text-slate-400">#</th>
                    <th className="p-3.5 font-bold">Proposal Code & Title</th>
                    <th className="p-3.5 font-bold">Phase Scope</th>
                    <th className="p-3.5 font-bold text-center">Water Feature Type</th>
                    <th className="p-3.5 font-bold text-right">Total Mechanical Cost</th>
                    <th className="p-3.5 font-bold text-right">Total Electrical Cost</th>
                    <th className="p-3.5 font-bold text-right pr-6">Total Cost</th>
                    <th className="p-3.5 font-bold text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                  {filteredMepScopes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-500">
                        No electromechanical works records found. Click <strong>"+ Add New Electromechanical"</strong> to configure.
                      </td>
                    </tr>
                  ) : (
                    filteredMepScopes.map((scope, idx) => (
                      <tr
                        key={scope.id || idx}
                        onClick={() => handleEditScope(scope)}
                        className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition cursor-pointer group"
                      >
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          <span className="text-amber-800 dark:text-amber-300 font-mono mr-1.5 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200">
                            {scope.proposal?.proposal_number || 'SP.2026'}:
                          </span>
                          <span>{scope.proposal?.proposal_title || scope.proposal?.proposal_full_title || 'Untitled'}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {scope.phase?.phase_title || 'Phase Scope'}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-xl font-bold text-[11px] border ${
                            scope.wfTypeLabel === 'Pending Specification'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                          }`}>
                            {scope.wfTypeLabel}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                          {Number(scope.mechCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {Number(scope.elecCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="p-3.5 text-right pr-6 font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm whitespace-nowrap">
                          {Number(scope.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditScope(scope)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-600 dark:text-slate-300 hover:text-amber-900 transition cursor-pointer"
                              title="Edit / Configure Scope"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => promptDeleteScope(scope, e)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER MEP BOQ TABLE */}
      {activeMainTab === 'mep_boq' && (
        <WfMepBoqTableTab
          boqRecords={mepBoqRecords}
          proposals={proposals}
          phases={phases}
          itemsList={itemsList}
          itemCategories={itemCategoriesList}
          isLoading={isLoading}
          onRefresh={loadAllData}
        />
      )}

      {/* ========================================================================= */}
      {/* EDIT / CREATE ELECTROMECHANICAL MODAL DIALOG */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-100 dark:bg-slate-950 w-full max-w-[96vw] 2xl:max-w-7xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[94vh] my-auto">
            
            {/* Modal Header */}
            <div className="p-5 text-white flex items-center justify-between border-b flex-shrink-0 bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border-teal-800/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                    Water Feature Electromechanical Engineering Suite
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      8 Sub-Tabs Configurator
                    </span>
                  </h2>
                  <p className="text-[11px] text-teal-200/80 font-medium">
                    Configure turnover cycle, filters, pumps, chemical dosing, heaters, LED lighting, containment & earthing.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Synchronize BOQ</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  title="Close Dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden min-h-0 bg-slate-50 dark:bg-slate-950 flex flex-col">
              {notification && (
                <div className={`mx-6 mt-4 p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold shadow-lg animate-in fade-in duration-200 z-10 flex-shrink-0 ${
                  notification.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />}
                    <span>{notification.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotification(null)}
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <WaterFeatureElectromechanicalSuite
                formData={formData}
                onChange={handleFormUpdate}
                proposals={proposals}
                phases={phases}
                pdeData={pdeData}
                wfTechnicalData={pdeData}
                prTechnicalData={prTechnicalData}
                filterPumps={filterPumpsList}
                mediaFilters={mediaFiltersList}
                itemCategories={itemCategoriesList}
                accessories={accessoriesList}
                mainDrains={mainDrainsList}
                chlorinators={chlorinatorsList}
                heaters={heatersList}
                lightingList={lightingList}
                transformersList={transformersList}
                junctionBoxesList={junctionBoxesList}
                disconnectSwitchesList={disconnectSwitchesList}
                conduitsList={conduitsList}
                cablesList={cablesList}
                brandsList={brandsList}
                itemsList={itemsList}
                mechCost={mechCost}
                elecCost={elecCost}
                totalMepCost={totalMepCost}
                allBoqItems={allBoqItems}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  Mech: {mechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </span>
                <span>•</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  Elec: {elecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </span>
                <span>•</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">
                  Total: {totalMepCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save & Synchronize BOQ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {deleteModal.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              {deleteModal.subtitle}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, scope: null, title: '', subtitle: '', isDeleting: false })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteScope}
                disabled={deleteModal.isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteModal.isDeleting ? 'Deleting...' : 'Remove BOQ Items'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
