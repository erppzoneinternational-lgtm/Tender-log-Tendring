import React, { useState, useEffect, useMemo } from 'react';
import { 
  HardHat, 
  Layers, 
  Ruler, 
  ShieldCheck, 
  Truck, 
  Calculator, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  Database,
  Building2,
  Hammer,
  AlertCircle,
  FileSpreadsheet,
  Coins,
  Clock,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  buildErpAuditFields,
  recordErpAuditAndNotification,
  syncAllErpTendersAndCostsToTenderLog,
} from '../lib/erpBridge';
import WaterFeatureStructuralForm from './WaterFeatureStructuralForm';
import PumpRoomStructuralForm from './PumpRoomStructuralForm';
import WaterFeatureFinishesForm from './WaterFeatureFinishesForm';
import PumpRoomFinishesForm from './PumpRoomFinishesForm';
import CivilBoqTableTab from './CivilBoqTableTab';
import { buildWaterFeatureStructuralBoq, FALLBACK_ITEM_ID_MAP } from '../utils/engine/modules/waterFeatureStructuralBoqBuilder';
import { buildPumpRoomStructuralBoq } from '../utils/engine/modules/pumpRoomStructuralBoqBuilder';
import { calculateWaterFeatureFinishes } from '../utils/engine/modules/waterFeatureFinishesCalc';
import { buildWaterFeatureFinishesBoq } from '../utils/engine/modules/waterFeatureFinishesBoqBuilder';
import { calculatePumpRoomFinishes } from '../utils/engine/modules/pumpRoomFinishesCalc';
import { buildPumpRoomFinishesBoq } from '../utils/engine/modules/pumpRoomFinishesBoqBuilder';
import { Palette, Paintbrush } from 'lucide-react';

export default function StructuralPortal({ onOpenDatabaseTable }) {
  const [activeTab, setActiveTab] = useState('wf_structural'); // 'wf_structural' | 'pr_structural' | 'wf_finishes' | 'pr_finishes' | 'civil_boq'
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [searchTableQuery, setSearchTableQuery] = useState('');

  // Dropdown Lookups & Lists
  const [proposals, setProposals] = useState([]);
  const [phases, setPhases] = useState([]);
  const [wfRecords, setWfRecords] = useState([]);
  const [wfStructRecords, setWfStructRecords] = useState([]);
  const [prRecords, setPrRecords] = useState([]);
  const [prStructRecords, setPrStructRecords] = useState([]);
  const [wfFinishesRecords, setWfFinishesRecords] = useState([]);
  const [prFinishesRecords, setPrFinishesRecords] = useState([]);
  const [civilBoqRecords, setCivilBoqRecords] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [regionsList, setRegionsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [featureTypesList, setFeatureTypesList] = useState([]);
  const [boqWorkTypesList, setBoqWorkTypesList] = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [itemCategoriesList, setItemCategoriesList] = useState([]);
  const [finishesTypeList, setFinishesTypeList] = useState([]);
  const [finishesCategoryList, setFinishesCategoryList] = useState([]);

  // Form State for PR Structural Works
  const defaultPrStructData = {
    id: null,
    linked_phase: '',
    phase_id: '',
    tender_log_id: '',
    linked_proposal: '',
    project_owner: '',
    main_contractor: '',
    civil_consultant: '',
    region: '',
    accommodations_required: 'No',
    excavation_in_scope: 'No',
    excavation_method: '',
    excavation_footing_m: 0.70,
    pc_grade: '',
    polyethylene_brand: '',
    pc_thickness_ground_m: 0.10,
    pc_footing_ground_m: 0.10,
    concrete_forming_type: 'dcf713e9-afca-44fe-a577-2cab176f1d2d',
    coffor_boq_title: '',
    rc_grade: '',
    rebar_diameter_mm: '',
    rebar_density_kg_m3: 85,
    rc_thickness_ground_m: 0.25,
    rc_thickness_wall_m: 0.25,
    rc_thickness_ceiling_m: 0.20,
    wp_bituminous_brand: '',
    wp_bituminous_material: '',
    wp_bitumen_layers: 2,
    wp_membrane_brand: '',
    wp_membrane_material: '',
    wp_cementitious_brand: '',
    wp_cementitious_material: '',
    backfilling_included: 'No',
    backfilling_method: '',
    soil_components: '',
    qty_excavation_m3_erp: '',
    qty_excavation_m3_user: '',
    qty_pc_m3_erp: '',
    qty_pc_m3_user: '',
    qty_polyethylene_kg: '',
    qty_rc_ground_m3: '',
    qty_rc_ground_user_m3: '',
    qty_rc_walls_m3: '',
    qty_rc_walls_user_m3: '',
    qty_rc_ceiling_m3: '',
    qty_rc_ceiling_user_m3: '',
    qty_rc_m3_erp: '',
    total_rc_qty_user: '',
    coffor_qty_m2_erp: '',
    coffor_qty_m2_user: '',
    bituminous_wp_qty_m2_erp: '',
    bituminous_wp_qty_m2_user: '',
    cementitious_wp_qty_m2_erp: '',
    cementitious_wp_qty_m2_user: '',
    qty_plaster_int_area_m2: '',
    qty_plaster_int_vol_m3: '',
    qty_cement_int_tons: '',
    qty_sand_int_m3: '',
    qty_adipond_int_ltr: ''
  };

  const [prStructData, setPrStructData] = useState(defaultPrStructData);

  // Form State for WF Structural Works
  const defaultWfStructData = {
    id: null,
    linked_phase: '',
    phase_id: '',
    tender_log_id: '',
    linked_proposal: '',
    project_owner: '',
    main_contractor: '',
    civil_consultant: '',
    region: '',
    excavation_in_scope: 'No',
    excavation_type_beach: '',
    excavation_method: '',
    excavation_footing_m: 0.70,
    excavation_length_m: '',
    excavation_width_m: '',
    excavation_height_m: '',
    excavation_area_m2: '',
    excavation_vol_inc_pct: '',
    pc_grade: '',
    polyethylene_brand: '',
    pc_thickness_ground_m: 0.10,
    pc_footing_ground_m: 0.10,
    pc_waterproofing_thickness_m: 0.02,
    pc_length_m: '',
    pc_width_m: '',
    pc_footing_vol_inc_pct: '',
    concrete_forming_type: 'dcf713e9-afca-44fe-a577-2cab176f1d2d',
    coffor_boq_title: '',
    rc_grade: '',
    rebar_diameter_mm: '',
    rebar_density_kg_m3: 85,
    rc_thickness_ground_m: 0.25,
    rc_thickness_wall_m: 0.25,
    rc_thickness_wall_base_m: '',
    rc_thickness_beach_m: '',
    rc_length_m: '',
    rc_width_m: '',
    rc_avg_wall_height_m: '',
    rc_wall_height_deep_m: '',
    rc_avg_overflow_perimeter_m: '',
    rc_outer_overflow_perimeter_m: '',
    rc_ground_vol_inc_pct: '',
    rc_wall_vol_inc_pct: '',
    rc_long_axis_m: '',
    rc_transverse_axis_m: '',
    expansion_joint_length_m: '',
    control_joint_length_m: '',
    wp_bituminous_brand: '',
    wp_bituminous_material: '',
    wp_bitumen_layers: 2,
    wp_membrane_brand: '',
    wp_membrane_material: '',
    wp_cementitious_brand: '',
    wp_cementitious_material: '',
    backfilling_included: 'No',
    backfilling_method: '',
    soil_components: '',
    qty_excavation_m3_erp: '',
    qty_excavation_m3_user: '',
    qty_pc_m3_erp: '',
    qty_pc_m3_user: '',
    qty_polyethylene_kg: '',
    qty_rc_ground_m3: '',
    qty_rc_ground_user_m3: '',
    qty_rc_walls_m3: '',
    qty_rc_walls_user_m3: '',
    qty_rc_island_ground_m3: '',
    qty_rc_island_ground_user_m3: '',
    qty_rc_island_walls_m3: '',
    qty_rc_island_walls_user_m3: '',
    qty_rc_stairs_m3: '',
    qty_rc_stairs_user_m3: '',
    qty_rc_lounges_m3: '',
    qty_rc_lounges_user_m3: '',
    qty_rc_love_seats_m3: '',
    qty_rc_love_seats_user_m3: '',
    qty_rc_m3_erp: '',
    total_rc_qty_user: '',
    coffor_qty_m2_erp: '',
    coffor_qty_m2_user: '',
    bituminous_wp_qty_m2_erp: '',
    bituminous_wp_qty_m2_user: '',
    cementitious_wp_qty_m2_erp: '',
    cementitious_wp_qty_m2_user: '',
    qty_plaster_int_area_m2: '',
    qty_plaster_int_vol_m3: '',
    qty_cement_int_tons: '',
    qty_sand_int_m3: '',
    qty_water_int_ltr: '',
    qty_adipond_int_ltr: ''
  };

  const [wfStructData, setWfStructData] = useState(defaultWfStructData);

  // Form State for WF Finishes Works
  const defaultWfFinishesData = {
    id: null,
    linked_phase: '',
    phase_id: '',
    tender_log_id: '',
    linked_proposal: '',
    project_owner: '',
    main_contractor: '',
    civil_consultant: '',
    region: '',
    accommodations_required: 'No',
    ladder_2_steps_no: 0,
    ladder_3_steps_no: 0,
    ladder_4_steps_no: 0,
    ladder_5_steps_no: 0,
    qty_ladder_no_erp: 0,
    qty_ladder_no_user: 0,
    qty_stucco_m2_user: '',
    qty_stucco_m2_erp: 0,
    add_fiberglass: 'No',
    improving_material: 'None',
    qty_stucco_vol_ton: 0,
    qty_cement_stucco_tons: 0,
    qty_sand_stucco_m3: 0,
    qty_water_stucco_ltr: 0,
    qty_addibond_stucco_ltr: 0,
    qty_resilient_sheet_m2_user: '',
    qty_resilient_sheet_m2_erp: 0,
    qty_slip_resistant_vinyl_m2_user: '',
    qty_slip_resistant_vinyl_m2_erp: 0,
    resilient_sheet_brand_id: 'a336ab8d-488e-48dc-bd82-9dd01c9ac39a',
    resilient_sheet_brand: 'a336ab8d-488e-48dc-bd82-9dd01c9ac39a',
    resilient_sheet_type_id: 'd2c1df2b-363e-4813-a09d-2dd00893d07d',
    wf_resilient_sheet_type: 'd2c1df2b-363e-4813-a09d-2dd00893d07d',
    resilient_sheet_stairs_type_id: 'b6cb2aff-8a50-4172-9f82-51b77bab90ad',
    resilient_sheet_type_stairs: 'b6cb2aff-8a50-4172-9f82-51b77bab90ad',
    resilient_sheet_color_id: 'White',
    resilient_sheet_color: 'White',
    qty_linerlock_m_user: '',
    qty_linerlock_m_erp: 0,
    qty_rivet_nails_no_user: '',
    qty_rivet_nails_no_erp: 0,
    qty_wood_screw_no_erp: 0,
    tiles_type: 'mosaic glass',
    water_feature_tiling_type_id: '',
    water_feature_mosaic_type_id: '',
    qty_tiling_m2_user: '',
    qty_tiling_m2_erp: 0,
    wf_adhesive_brand: '',
    wf_adhesive_brand_id: '',
    adhesive_brand_id: '',
    wf_adhesive_material: '',
    adhesive_material_id: '',
    wf_grout_brand: '',
    wf_grout_brand_id: '',
    grout_brand_id: '',
    wf_grout_material: '',
    grout_material_id: '',
    coping_stone_type: 'marble',
    floor_tile_type_id: '',
    qty_stone_floor_m_user: '',
    qty_stone_floor_m_erp: 0,
    total_cost_ladder: 0,
    total_cost_stucco: 0,
    total_cost_liner: 0,
    total_cost_tiling: 0,
    total_cost_stone_floor: 0,
    days_to_complete_ladder: 0,
    days_to_complete_stucco: 0,
    days_to_complete_liner: 0,
    days_to_complete_tiling: 0,
    days_to_complete_stone_floor: 0,
    no_of_laborers_ladder: 0,
    no_of_laborers_stucco: 0,
    no_of_laborers_liner: 0,
    no_of_laborers_tiling: 0,
    no_of_laborers_stone_floor: 0,
    proposal_breakdown_items: []
  };

  const [wfFinishesData, setWfFinishesData] = useState(defaultWfFinishesData);

  // Form State for PR Finishes Works
  const defaultPrFinishesData = {
    id: null,
    linked_phase: '',
    phase_id: '',
    tender_log_id: '',
    linked_proposal: '',
    project_owner: '',
    main_contractor: '',
    civil_consultant: '',
    region: '',
    accommodations_required: 'No',
    qty_stucco_m3_user: '',
    qty_stucco_m3_erp: 0,
    improving_material: 'None',
    add_fiberglass: 'No',
    epoxy_brand_id: '',
    epoxy_material_id: '',
    qty_epoxy_m2_user: '',
    qty_epoxy_m2_erp: 0,
    pr_ceramic_material: '86acaacf-f943-4845-aaeb-bd836ac641a8',
    bt_ceramic_material: '86acaacf-f943-4845-aaeb-bd836ac641a8',
    ceramic_material_id: '86acaacf-f943-4845-aaeb-bd836ac641a8',
    pr_adhesive_brand: '',
    pr_adhesive_material: '',
    pr_grout_brand: '',
    pr_grout_material: '',
    qty_tiling_m2_user: '',
    qty_tiling_m2_erp: 0,
    bt_adhesive_brand: '',
    bt_adhesive_material: '',
    bt_grout_brand: '',
    bt_grout_material: '',
    qty_balance_tank_tiling_m2_user: '',
    qty_balance_tank_tiling_m2_erp: 0,
    qty_total_tiling_m2_erp: 0,
    total_cost_stucco: 0,
    total_cost_epoxy: 0,
    total_cost_tiling: 0,
    days_to_complete_stucco: 0,
    days_to_complete_epoxy: 0,
    days_to_complete_tiling: 0,
    no_of_laborers_stucco: 0,
    no_of_laborers_epoxy: 0,
    no_of_laborers_tiling: 0,
    proposal_breakdown_items: []
  };

  const [prFinishesData, setPrFinishesData] = useState(defaultPrFinishesData);

  // Helper to fetch all items beyond default 1000 limit
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

  // Helper to fetch all proposal_breakdown_items beyond default 1000 limit
  const fetchAllBoqBreakdownItems = async () => {
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

  // Load all relevant data from Supabase
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [
        { data: propList },
        { data: phaseList },
        { data: wfList },
        { data: wfStructList },
        { data: prList },
        { data: prStructList },
        { data: wfFinList },
        { data: prFinList },
        { data: clList },
        { data: regList },
        { data: brList },
        { data: matList },
        { data: catList },
        { data: typeList },
        itmList,
        { data: itmCatList },
        boqBreakdownList,
        { data: boqTypeList },
        { data: finTypeList },
        { data: finCatList }
      ] = await Promise.all([
        supabase.from('tender_log').select('id, proposal_number, proposal_title, proposal_full_title, client_id, main_contractor, civil_consultant, region').order('created_at', { ascending: false }),
        supabase.from('phases').select('id, phase_title, component_type, tender_log_id').order('created_at', { ascending: false }),
        supabase.from('proposal_data_entry').select('*').order('created_at', { ascending: false }),
        supabase.from('water_feature_structural_works').select('*').order('created_at', { ascending: false }),
        supabase.from('pump_room_data_entry').select('*').order('created_at', { ascending: false }),
        supabase.from('pump_room_structural_works').select('*').order('created_at', { ascending: false }),
        supabase.from('proposal_finishes_water_feature').select('*').order('created_at', { ascending: false }),
        supabase.from('proposal_finishes_pump_room').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, title'),
        supabase.from('regions').select('id, title'),
        supabase.from('brands').select('id, title'),
        supabase.from('civil_material_types').select('*'),
        supabase.from('water_feature_categories').select('id, name'),
        supabase.from('water_feature_types').select('id, name, category_id'),
        fetchAllItems(),
        supabase.from('item_categories').select('id, category_name'),
        fetchAllBoqBreakdownItems(),
        supabase.from('boq_work_type').select('id, work_type'),
        supabase.from('finishes_type').select('*'),
        supabase.from('finishes_category').select('*')
      ]);

      setProposals(propList || []);
      setPhases(phaseList || []);
      setWfRecords(wfList || []);
      setWfStructRecords(wfStructList || []);
      setPrRecords(prList || []);
      setPrStructRecords(prStructList || []);
      setWfFinishesRecords(wfFinList || []);
      setPrFinishesRecords(prFinList || []);
      setClientsList(clList || []);
      setRegionsList(regList || []);
      setBrandsList(brList || []);
      setMaterialsList(matList || []);
      setCategoriesList(catList || []);
      setFeatureTypesList(typeList || []);
      setBoqWorkTypesList(boqTypeList || []);
      setItemsList(itmList || []);
      setItemCategoriesList(itmCatList || []);
      setFinishesTypeList(finTypeList || []);
      setFinishesCategoryList(finCatList || []);

      // Filter for civil breakdown items strictly (exclude mechanical and electrical)
      const civilBreakdown = (boqBreakdownList || []).filter(item => {
        const wt = (item.work_type || '').toLowerCase().trim();
        if (wt === 'mechanical' || wt === 'electrical') return false;
        const comp = (item.phase_component || '').toLowerCase();
        return (
          wt === 'civil' ||
          wt === 'finishing works' ||
          wt === 'finishes' ||
          comp.includes('finish') ||
          comp.includes('pool') ||
          comp.includes('lagoon') ||
          comp.includes('water') ||
          comp.includes('pump') ||
          !item.work_type
        );
      });
      setCivilBoqRecords(civilBreakdown);
    } catch (err) {
      console.error('Error loading structural portal data:', err);
      setErrorMessage(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter Water Feature Phases
  const waterFeaturePhases = useMemo(() => {
    return phases.filter(p => {
      const comp = String(p.component_type || '').toLowerCase();
      return comp.includes('water') || comp.includes('feature') || comp.includes('pool') || comp.includes('lagoon') || comp.includes('fountain');
    });
  }, [phases]);

  // Filter Pump Room Phases
  const pumpRoomPhases = useMemo(() => {
    return phases.filter(p => {
      const comp = String(p.component_type || '').toLowerCase();
      return comp.includes('pump') || comp.includes('room');
    });
  }, [phases]);

  const WF_STRUCT_COLUMNS = new Set([
    "id", "tender_log_id", "phase_id", "project_owner", "main_contractor", "civil_consultant", "region",
    "excavation_in_scope", "excavation_type_beach", "excavation_method", "excavation_footing_m", "excavation_length_m",
    "excavation_width_m", "excavation_vol_inc_pct", "excavation_height_m", "excavation_area_m2", "pc_grade",
    "polyethylene_brand", "pc_thickness_ground_m", "pc_footing_ground_m", "pc_waterproofing_thickness_m", "pc_length_m",
    "pc_width_m", "pc_footing_vol_inc_pct", "concrete_forming_type", "rc_wall_height_deep_m", "rc_grade", "rebar_diameter_mm",
    "rc_thickness_ground_m", "rc_thickness_wall_m", "rc_thickness_wall_base_m", "rc_thickness_beach_m", "rc_long_axis_m",
    "rc_transverse_axis_m", "expansion_joint_length_m", "control_joint_length_m", "rc_length_m", "rc_width_m",
    "rc_avg_wall_height_m", "rc_avg_overflow_perimeter_m", "rc_outer_overflow_perimeter_m", "rc_ground_vol_inc_pct",
    "rc_wall_vol_inc_pct", "rebar_density_kg_m3", "wp_bituminous_brand", "wp_bituminous_material", "wp_bitumen_layers",
    "wp_membrane_brand", "wp_membrane_material", "wp_cementitious_brand", "wp_cementitious_material", "backfilling_included",
    "backfilling_method", "soil_components", "qty_excavation_m3", "qty_pc_m3", "qty_polyethylene_kg", "qty_rc_ground_m3",
    "qty_rc_walls_m3", "qty_rc_island_ground_m3", "qty_rc_island_walls_m3", "qty_rc_stairs_m3", "qty_rc_lounges_m3",
    "qty_rc_love_seats_m3", "qty_rc_total_m3", "qty_coffor_m2", "coffor_qty_m2_erp", "qty_wp_bituminous_m2",
    "qty_plaster_ext_protect_vol_m3", "qty_cement_ext_protect_tons", "qty_sand_ext_protect_m3", "qty_water_ext_protect_ltr",
    "qty_grout_ext_repair_m3", "qty_plaster_ext_vol_m3", "qty_cement_ext_tons", "qty_sand_ext_m3", "qty_adipond_ext_ltr",
    "qty_water_ext_ltr", "qty_wp_cementitious_m2", "qty_plaster_int_area_m2", "qty_plaster_int_vol_m3", "qty_cement_int_tons",
    "qty_sand_int_m3", "qty_adipond_int_ltr", "qty_water_int_ltr", "qty_grout_int_repair_m3", "qty_geotextiles_m2",
    "qty_geomembranes_m2", "qty_geonets_m2", "qty_backfilling_m2", "created_by", "created_at", "updated_by", "updated_at",
    "linked_proposal", "boq_title_pc", "rc_boq_title", "coffor_boq_title", "bituminous_wp_boq_title", "cementitious_wp_boq_title",
    "membrane_wp_boq_title", "qty_excavation_m3_erp", "qty_excavation_m3_user", "qty_pc_m3_erp", "qty_pc_m3_user",
    "qty_pc_total_m3", "unit_cost_pc", "total_cost_pc", "days_to_complete_pc", "plain_concrete_no_of_laborers",
    "qty_rc_m3_erp", "total_rc_qty_user", "qty_rc_ground_user_m3", "qty_rc_walls_user_m3", "qty_rc_island_ground_user_m3",
    "qty_rc_island_walls_user_m3", "qty_rc_stairs_user_m3", "qty_rc_lounges_user_m3", "qty_rc_love_seats_user_m3",
    "qty_rc_ceiling_user_m3", "rc_unit_cost", "rc_total_cost", "rc_no_of_days_to_complete_installation", "rc_no_of_laborers",
    "coffor_qty_m2_user", "coffor_unit_cost", "coffor_total_cost", "coffor_no_of_days_to_complete_installation",
    "coffor_no_of_laborers", "bituminous_wp_qty_m2_erp", "bituminous_wp_qty_m2_user", "bituminous_wp_unit_cost",
    "bituminous_wp_total_cost", "bituminous_wp_no_of_days_to_complete_installation", "bituminous_wp_no_of_laborers",
    "cementitious_wp_qty_m2_erp", "cementitious_wp_qty_m2_user", "qty_cementitious_waterproofing_m2",
    "cementitious_wp_unit_cost", "cementitious_wp_total_cost", "cementitious_wp_no_of_days_to_complete_installation",
    "cementitious_wp_no_of_laborers", "membrane_wp_qty_m2_erp", "membrane_wp_qty_m2_user", "membrane_wp_unit_cost",
    "membrane_wp_total_cost", "membrane_wp_no_of_days_to_complete_installation", "membrane_wp_no_of_laborers"
  ]);

  const PR_STRUCT_COLUMNS = new Set([
    "id", "tender_log_id", "phase_id", "project_owner", "main_contractor", "civil_consultant", "region",
    "laborers_per_group", "productivity_rate_per_day", "days_to_complete", "planned_amount_per_day", "groups_required",
    "total_laborers_per_day", "plain_concrete_no_of_laborers", "total_rc_qty_user", "qty_rc_island_ground_user_m3",
    "qty_rc_stairs_user_m3", "qty_rc_lounges_user_m3", "qty_rc_love_seats_user_m3", "qty_rc_island_walls_user_m3",
    "qty_rc_ground_user_m3", "qty_rc_walls_user_m3", "rc_total_cost", "rc_no_of_days_to_complete_installation",
    "rc_boq_title", "rc_no_of_laborers", "rc_unit_cost", "created_by", "created_at", "updated_by", "updated_at",
    "excavation_in_scope", "excavation_footing_m", "excavation_length_m", "excavation_width_m", "excavation_height_m",
    "pc_thickness_ground_m", "pc_footing_ground_m", "pc_length_m", "pc_width_m", "concrete_forming_type",
    "concrete_forming_height_m", "rc_grade", "rebar_diameter_mm", "rc_thickness_ground_m", "rc_thickness_wall_m",
    "rc_thickness_ceiling_m", "rc_length_m", "rc_width_m", "rebar_density_kg_m3", "wp_bituminous_brand",
    "wp_bituminous_material", "wp_bitumen_layers", "wp_membrane_brand", "wp_membrane_material",
    "wp_cementitious_coatings", "wp_cementitious_brand", "wp_cementitious_material", "backfilling_included",
    "backfilling_method", "soil_components", "avg_backfilling_length_m", "avg_backfilling_width_m",
    "backfilling_perimeter_m", "over_backfilling_m", "qty_excavation_m3", "qty_pc_m3", "qty_rc_ground_m3",
    "qty_rc_walls_m3", "qty_rc_ceiling_m3", "qty_rc_total_m3", "qty_coffor_m2", "qty_wp_m2",
    "qty_plaster_ext_protect_vol_m3", "qty_cement_ext_protect_tons", "qty_sand_ext_protect_m3",
    "qty_water_ext_protect_ltr", "qty_grout_ext_repair_m3", "qty_plaster_ext_vol_m3", "qty_cement_ext_tons",
    "qty_sand_ext_m3", "qty_adipond_ext_ltr", "qty_water_ext_ltr", "qty_wp_cementitious_m2", "qty_plaster_int_area_m2",
    "qty_plaster_int_vol_m3", "qty_cement_int_tons", "qty_sand_int_m3", "qty_adipond_int_ltr", "qty_water_int_ltr",
    "qty_grout_int_repair_m3", "qty_backfilling_m2", "linked_proposal", "qty_pc_m3_erp", "qty_pc_m3_user",
    "boq_title_pc", "unit_cost_pc", "total_cost_pc", "days_to_complete_pc", "coffor_qty_m2_erp", "coffor_qty_m2_user",
    "coffor_boq_title", "coffor_unit_cost", "coffor_total_cost", "coffor_no_of_days_to_complete_installation",
    "coffor_no_of_laborers", "bituminous_wp_qty_m2_erp", "bituminous_wp_qty_m2_user", "bituminous_wp_boq_title",
    "bituminous_wp_unit_cost", "bituminous_wp_total_cost", "bituminous_wp_no_of_days_to_complete_installation",
    "bituminous_wp_no_of_laborers", "cementitious_wp_qty_m2_erp", "cementitious_wp_qty_m2_user", "cementitious_wp_boq_title",
    "cementitious_wp_unit_cost", "cementitious_wp_total_cost", "cementitious_wp_no_of_days_to_complete_installation",
    "cementitious_wp_no_of_laborers", "qty_rc_ceiling_user_m3", "pc_grade", "polyethylene_brand", "qty_polyethylene_kg"
  ]);

  const WF_FINISHES_COLUMNS = new Set([
    "id", "linked_proposal", "linked_phase", "project_owner", "main_contractor", "civil_consultant", "region",
    "ss_ladder_2_steps_no", "ss_ladder_3_steps_no", "ss_ladder_4_steps_no", "ss_ladder_5_steps_no",
    "add_fiberglass_stucco", "improving_material_cement_mortar", "floor_tile_type", "wf_resilient_sheet_type",
    "resilient_sheet_type_stairs", "resilient_sheet_brand", "resilient_sheet_color", "slip_resistant_vinyl_sheet_color",
    "wf_tiling_type", "wf_mosaic_type", "wf_adhesive_brand", "wf_adhesive_material", "wf_grout_brand", "wf_grout_material",
    "qty_ladder_no_erp", "qty_stucco_m2_erp", "qty_cement_stucco_vol_ton", "qty_cement_for_stucco", "qty_sand_for_stucco_m3",
    "qty_addibond_for_stucco_ltr", "qty_water_for_stucco_ltr", "qty_resilient_sheet_m2_erp", "qty_slip_resistant_vinyl_m2_erp",
    "qty_rivet_nails_no_erp", "qty_linerlock_m_erp", "qty_wood_screw_no_erp", "qty_tiling_m2_erp", "qty_stone_floor_m_erp",
    "created_by", "created_at", "updated_by", "updated_at", "qty_ladder_no_user", "qty_stucco_m2_user",
    "qty_resilient_sheet_m2_user", "qty_slip_resistant_vinyl_m2_user", "qty_rivet_nails_no_user", "qty_linerlock_m_user",
    "qty_wood_screw_no_user", "qty_tiling_m2_user", "qty_stone_floor_m_user", "qty_total_liner_m2_erp", "boq_title_total_liner",
    "unit_cost_total_liner", "total_cost_total_liner", "days_to_complete_total_liner", "no_of_laborers_total_liner",
    "boq_title_ladder", "unit_cost_ladder", "total_cost_ladder", "days_to_complete_ladder", "no_of_laborers_ladder",
    "boq_title_stucco", "unit_cost_stucco", "total_cost_stucco", "days_to_complete_stucco", "no_of_laborers_stucco",
    "boq_title_tiling", "unit_cost_tiling", "total_cost_tiling", "days_to_complete_tiling", "no_of_laborers_tiling",
    "boq_title_stone_floor", "unit_cost_stone_floor", "total_cost_stone_floor", "days_to_complete_stone_floor", "no_of_laborers_stone_floor"
  ]);

  const PR_FINISHES_COLUMNS = new Set([
    "id", "linked_proposal", "linked_phase", "project_owner", "main_contractor", "civil_consultant", "region",
    "add_fiberglass_stucco", "improving_material_cement_mortar", "epoxy_paintings_brand", "epoxy_paintings_material",
    "pr_adhesive_brand", "pr_adhesive_material", "pr_grout_brand", "pr_grout_material", "bt_adhesive_brand",
    "bt_adhesive_material", "bt_grout_brand", "bt_grout_material", "qty_cement_stucco_m3", "qty_cement_stucco_vol_m3",
    "qty_cement_for_stucco_ton", "qty_sand_for_stucco_m3", "qty_addibond_for_stucco_ltr", "qty_water_for_stucco_ltr",
    "qty_epoxy_paintings_m2", "qty_pr_tiling_m2", "qty_bt_tiling_m2", "created_by", "created_at", "updated_by", "updated_at"
  ]);

  const BOQ_BREAKDOWN_COLUMNS = new Set([
    "id", "tender_log_id", "phase_id", "phase_component", "main_category", "work_type", "work_main_category",
    "activity_responsibility", "activity_type", "item", "unit", "quantity", "extra_amount_percentage", "final_quantity",
    "unit_cost", "total_cost", "_isautogenerated", "_spawnerid", "laborers_per_group", "productivity_rate_per_day",
    "days_to_complete", "planned_amount_per_day", "groups_required", "total_laborers_per_day", "created_by", "created_at",
    "updated_by", "updated_at", "material_transportation", "engineering", "mobilization", "temp_water", "temp_power",
    "site_office", "stationary", "safety_facilities", "company_accommodation", "salaries_site_staff", "technical_services",
    "head_office", "contingency_reserves", "management_reserves", "guaranty_1_year", "profit_margin",
    "sales_marketing_commission", "payment_guarantee_discount", "final_guarantee_discount", "financing_interest",
    "social_insurance", "corporate_taxes", "bid_unit_cost", "bid_total_cost"
  ]);

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const UUID_COLUMNS = new Set([
    'id', 'phase_id', 'tender_log_id', 'linked_proposal', 'linked_phase',
    'project_owner', 'main_contractor', 'civil_consultant', 'region',
    'pc_grade', 'polyethylene_brand', 'concrete_forming_type',
    'rc_grade', 'rebar_diameter_mm',
    'wp_bituminous_brand', 'wp_bituminous_material',
    'wp_membrane_brand', 'wp_membrane_material',
    'wp_cementitious_brand', 'wp_cementitious_material',
    'plastering_brand', 'plastering_material', 'liner_brand', 'liner_material',
    'tile_brand', 'tile_material', 'coping_brand', 'coping_material',
    'stucco_brand', 'stucco_material', 'epoxy_brand', 'epoxy_material',
    'epoxy_paintings_brand', 'epoxy_paintings_material',
    'pr_adhesive_brand', 'pr_adhesive_material', 'pr_grout_brand', 'pr_grout_material',
    'bt_adhesive_brand', 'bt_adhesive_material', 'bt_grout_brand', 'bt_grout_material',
    'wf_adhesive_brand', 'wf_adhesive_material', 'wf_grout_brand', 'wf_grout_material',
    'resilient_sheet_brand', 'floor_tile_type', 'wf_resilient_sheet_type', 'resilient_sheet_type_stairs',
    'item', 'work_main_category',
    'wf_mosaic_type', 'wf_tiling_type', 'resilient_sheet_color', 'slip_resistant_vinyl_sheet_color'
  ]);

  const resolveMaterialItemId = (val) => {
    if (!val) return null;
    const strVal = String(val).trim();
    // 1. Match by id or item_id in materialsList
    const matched = materialsList.find(m => String(m.id) === strVal || String(m.item_id) === strVal);
    if (matched && matched.item_id) return matched.item_id;

    // 2. Match by numeric specification_rate (e.g. 12, 10, 14, 16 mm diameter)
    const num = Number(strVal);
    if (!isNaN(num) && num > 0) {
      const byRate = materialsList.find(m => Number(m.specification_rate) === num);
      if (byRate && byRate.item_id) return byRate.item_id;
    }

    return UUID_REGEX.test(strVal) ? strVal : null;
  };

  const resolveFinishesTypeItemId = (val) => {
    if (!val) return null;
    const strVal = String(val).trim();
    // 1. Match by id or item_id in finishesTypeList
    const matched = finishesTypeList.find(f => String(f.id) === strVal || String(f.item_id) === strVal);
    if (matched && matched.item_id) return matched.item_id;

    // 2. Known static coping / liner item UUID mappings
    const staticMap = {
      'marble': 'fd96d019-73d4-4f3e-9899-95c40b62a0a1',
      'granite': '94efac3b-5706-4118-ae10-1a51c9a970d8',
      'artificial stone': '0786cbc5-ecf9-4f77-b83d-00fc20034c09',
      'anti-slip': '0031ff5b-9aea-4973-bc02-6b37b5ca0b35',
      'smooth': 'cf6ab0b7-8020-4f9a-aadd-954043d8172b'
    };
    if (staticMap[strVal.toLowerCase()]) return staticMap[strVal.toLowerCase()];

    return UUID_REGEX.test(strVal) ? strVal : null;
  };

  const resolveBrandId = (val) => {
    if (!val) return null;
    const strVal = String(val).trim();
    // 1. Direct match in brands table
    const direct = brandsList.find(b => String(b.id) === strVal);
    if (direct) return direct.id;

    // 2. Check by brand title / name
    const byTitle = brandsList.find(b => (b.title || b.name || '').toLowerCase() === strVal.toLowerCase());
    if (byTitle) return byTitle.id;

    // 3. Known item ID / material mappings
    if (strVal === 'cc67f864-bdf0-4091-b3f4-7db297fc35ab') {
      const shouman = brandsList.find(b => (b.title || '').toLowerCase() === 'shouman');
      if (shouman) return shouman.id;
    }
    if (strVal === '8c665915-e095-4da7-9d9d-e8477e1295ec') {
      const armada = brandsList.find(b => (b.title || '').toLowerCase() === 'armada');
      if (armada) return armada.id;
    }

    // 4. If it's a civil_material_types row with a brand_id
    const cmtRow = materialsList.find(c => String(c.item_id) === strVal || String(c.id) === strVal);
    if (cmtRow && cmtRow.brand_id) return cmtRow.brand_id;

    return UUID_REGEX.test(strVal) ? strVal : null;
  };

  // Clean empty strings to null, validate UUID fields, and filter by allowed columns
  const sanitizePayload = (obj, allowedColumns = null) => {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (allowedColumns && !allowedColumns.has(key)) {
        continue;
      }
      if (value === '' || value === undefined || value === null) {
        sanitized[key] = null;
      } else if (UUID_COLUMNS.has(key)) {
        if (key === 'concrete_forming_type' && (value === 'Coffor Panels' || value === 'coffor_panels' || value === '4d92c883-177a-48de-8090-40e9f7e7a68a')) {
          sanitized[key] = 'dcf713e9-afca-44fe-a577-2cab176f1d2d';
        } else if (['pc_grade', 'rc_grade', 'rebar_diameter_mm', 'wp_bituminous_material', 'wp_membrane_material', 'wp_cementitious_material', 'epoxy_paintings_material', 'pr_adhesive_material', 'pr_grout_material', 'bt_adhesive_material', 'bt_grout_material', 'wf_adhesive_material', 'wf_grout_material'].includes(key)) {
          sanitized[key] = resolveMaterialItemId(value);
        } else if (['polyethylene_brand', 'wp_bituminous_brand', 'wp_membrane_brand', 'wp_cementitious_brand', 'epoxy_paintings_brand', 'pr_adhesive_brand', 'pr_grout_brand', 'bt_adhesive_brand', 'bt_grout_brand', 'wf_adhesive_brand', 'wf_grout_brand', 'resilient_sheet_brand'].includes(key)) {
          sanitized[key] = resolveBrandId(value);
        } else if (['floor_tile_type', 'wf_resilient_sheet_type', 'resilient_sheet_type_stairs'].includes(key)) {
          sanitized[key] = resolveFinishesTypeItemId(value);
        } else if (key === 'wf_mosaic_type') {
          // Foreign key in proposal_finishes_water_feature references finishes_category(id)
          const str = String(value || '').toLowerCase();
          if (str.includes('2e230add') || str.includes('a2ce01aa') || str.includes('7a6d93d2') || str.includes('mosaic')) {
            sanitized[key] = '7a6d93d2-e82a-4c25-98ee-aeb686cc15f0'; // Mosaic category
          } else {
            sanitized[key] = null;
          }
        } else if (key === 'wf_tiling_type') {
          // Foreign key in proposal_finishes_water_feature references finishes_category(id)
          const str = String(value || '').toLowerCase();
          if (str.includes('2e230add') || str.includes('a2ce01aa') || str.includes('7a6d93d2') || str.includes('mosaic')) {
            sanitized[key] = '7a6d93d2-e82a-4c25-98ee-aeb686cc15f0'; // Mosaic category
          } else if (str.includes('86acaacf') || str.includes('0f870c8e') || str.includes('ceramic')) {
            sanitized[key] = '0f870c8e-c26f-4dd2-94d8-2d65806eecfe'; // Ceramic category
          } else {
            sanitized[key] = null;
          }
        } else if (['resilient_sheet_color', 'slip_resistant_vinyl_sheet_color'].includes(key)) {
          // In database these columns reference finishes_category(id); color names cannot be stored as UUID
          sanitized[key] = null;
        } else if (typeof value === 'string' && UUID_REGEX.test(value)) {
          sanitized[key] = value;
        } else {
          sanitized[key] = null;
        }
      } else if (typeof value === 'number') {
        sanitized[key] = isNaN(value) ? null : value;
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  const FINISHES_SPAWNER_IDS = useMemo(() => new Set([
    // WF Finishes spawners
    '_isLadder2Auto', '_isLadder3Auto', '_isLadder4Auto', '_isLadder5Auto', '_isLadderInstallAuto',
    '_isWaterPlasteringAuto', '_isSandPlasteringAuto', '_isCementPlasteringAuto', '_isAddibondPlasteringAuto',
    '_isPlasteringSubAuto', '_isPlasterAptAuto', '_isPlasterMicrobusAuto',
    '_isSmoothLinerAuto', '_isAntiSlipLinerAuto', '_isRivetScrewLinerAuto', '_isLinerlockAuto',
    '_isLinerSubcontractorAuto', '_isLinerAptAuto', '_isLinerMicrobusAuto',
    '_isSupplyTilesAuto', '_isTileAdhesiveAuto', '_isTileGroutAuto', '_isTilingSubcontractorAuto',
    '_isTilingAptAuto', '_isTilingMicrobusAuto',
    '_isSupplyCopingTilesAuto', '_isCopingSubcontractorAuto', '_isCopingSikaLasqaAuto',
    '_isCopingAptAuto', '_isCopingMicrobusAuto',
    // PR Finishes spawners
    '_isWaterStuccoAuto', '_isSandStuccoAuto', '_isCementStuccoAuto', '_isAddibondStuccoAuto',
    '_isStuccoSubAuto', '_isStuccoAptAuto', '_isStuccoMicrobusAuto', '_isFiberglassStuccoAuto',
    '_isEpoxyMaterialAuto', '_isEpoxySubAuto', '_isEpoxyAptAuto', '_isEpoxyMicrobusAuto',
    '_isPrCeramicAuto', '_isBtCeramicAuto', '_isPrTileAdhesiveAuto', '_isPrTileGroutAuto',
    '_isBtTileAdhesiveAuto', '_isBtTileGroutAuto'
  ]), []);

  const isFinishesBoqItem = (b) => {
    if (!b) return false;
    if (b._spawnerid && FINISHES_SPAWNER_IDS.has(b._spawnerid)) return true;
    const comp = String(b.phase_component || '').toLowerCase();
    const wt = String(b.work_type || '').toLowerCase();
    if (comp.includes('finish') || wt.includes('finish')) return true;
    return false;
  };

  // Helper to format generated BOQ line items with resolved UUID foreign keys for proposal_breakdown_items
  const formatBoqRowForUpsert = (row, defaultTenderLogId, defaultPhaseId, defaultPhaseComp, defaultWorkType) => {
    const validItemIds = new Set(itemsList.map(i => String(i.id).toLowerCase()));

    const resolveValidItemId = (candidate) => {
      if (!candidate) return null;
      const str = String(candidate).trim().toLowerCase();
      if (!UUID_REGEX.test(str)) return null;
      if (validItemIds.has(str)) return str;

      // Check fallback map
      if (FALLBACK_ITEM_ID_MAP[str] && validItemIds.has(FALLBACK_ITEM_ID_MAP[str].toLowerCase())) {
        return FALLBACK_ITEM_ID_MAP[str].toLowerCase();
      }

      // Check civil_material_types wrapper
      const matMatch = materialsList.find(m => String(m.id || '').toLowerCase() === str);
      if (matMatch?.item_id && validItemIds.has(String(matMatch.item_id).toLowerCase())) {
        return String(matMatch.item_id).toLowerCase();
      }

      // Check finishes_type wrapper
      const finMatch = finishesTypeList.find(f => String(f.id || '').toLowerCase() === str);
      if (finMatch?.item_id && validItemIds.has(String(finMatch.item_id).toLowerCase())) {
        return String(finMatch.item_id).toLowerCase();
      }

      return null;
    };

    // 1. Resolve Item UUID (must strictly reference items.id)
    let resolvedItemUuid = resolveValidItemId(row.item_uuid) || resolveValidItemId(row.item);

    if (!resolvedItemUuid) {
      const searchName = String(row.item_name || row.item || row.fallbackName || '').toLowerCase().trim();
      if (searchName) {
        const matchedItem = itemsList.find(i => 
          String(i.item_name || '').toLowerCase().trim() === searchName ||
          String(i.i_axiom_description || '').toLowerCase().trim() === searchName
        );
        if (matchedItem?.id && UUID_REGEX.test(matchedItem.id)) {
          resolvedItemUuid = matchedItem.id;
        } else {
          const matchedMat = materialsList.find(m => 
            String(m.name || m.label || '').toLowerCase().trim() === searchName
          );
          if (matchedMat?.item_id && validItemIds.has(String(matchedMat.item_id).toLowerCase())) {
            resolvedItemUuid = matchedMat.item_id;
          }
        }
      }
    }

    // 2. Resolve Work Main Category UUID (must reference boq_work_type.id)
    let resolvedWorkMainCategory = null;
    if (row.work_main_category && UUID_REGEX.test(row.work_main_category)) {
      resolvedWorkMainCategory = row.work_main_category;
    } else {
      const searchCat = String(row.work_main_category || row.main_category || '').toLowerCase().trim();
      if (searchCat) {
        const matchedBwt = boqWorkTypesList.find(b => 
          String(b.work_type || '').toLowerCase().trim() === searchCat ||
          searchCat.includes(String(b.work_type || '').toLowerCase().trim()) ||
          String(b.work_type || '').toLowerCase().trim().includes(searchCat)
        );
        if (matchedBwt?.id && UUID_REGEX.test(matchedBwt.id)) {
          resolvedWorkMainCategory = matchedBwt.id;
        }
      }
    }

    return sanitizePayload({
      id: (row.id && UUID_REGEX.test(row.id)) ? row.id : (row.ID && UUID_REGEX.test(row.ID)) ? row.ID : undefined,
      tender_log_id: (row.tender_log_id && UUID_REGEX.test(row.tender_log_id)) ? row.tender_log_id : defaultTenderLogId,
      phase_id: (row.phase_id && UUID_REGEX.test(row.phase_id)) ? row.phase_id : defaultPhaseId,
      phase_component: row.phase_component || defaultPhaseComp || 'Water Feature',
      main_category: row.main_category || 'Construction',
      work_type: row.work_type || defaultWorkType || 'Civil',
      work_main_category: resolvedWorkMainCategory,
      activity_responsibility: row.activity_responsibility || 'P.Zone',
      activity_type: row.activity_type || 'Procurement',
      item: resolvedItemUuid,
      unit: row.unit || 'm³',
      quantity: row.quantity !== undefined && row.quantity !== null ? Number(row.quantity) : 0,
      extra_amount_percentage: row.extra_amount_percentage !== undefined && row.extra_amount_percentage !== null ? Number(row.extra_amount_percentage) : 0,
      final_quantity: row.final_quantity !== undefined && row.final_quantity !== null ? Number(row.final_quantity) : 0,
      unit_cost: row.unit_cost !== undefined && row.unit_cost !== null ? Number(row.unit_cost) : 0,
      total_cost: row.total_cost !== undefined && row.total_cost !== null ? Number(row.total_cost) : 0,
      _isautogenerated: true,
      _spawnerid: row._spawnerid || null,
      laborers_per_group: row.laborers_per_group !== undefined && row.laborers_per_group !== null ? Number(row.laborers_per_group) : 0,
      productivity_rate_per_day: row.productivity_rate_per_day !== undefined && row.productivity_rate_per_day !== null ? Number(row.productivity_rate_per_day) : 0,
      days_to_complete: row.days_to_complete !== undefined && row.days_to_complete !== null ? Number(row.days_to_complete) : 0,
      planned_amount_per_day: row.planned_amount_per_day !== undefined && row.planned_amount_per_day !== null ? Number(row.planned_amount_per_day) : 0,
      groups_required: row.groups_required !== undefined && row.groups_required !== null ? Number(row.groups_required) : 0,
      total_laborers_per_day: row.total_laborers_per_day !== undefined && row.total_laborers_per_day !== null ? Number(row.total_laborers_per_day) : 0,
      ...buildErpAuditFields(Boolean(row.id && row.created_by))
    }, BOQ_BREAKDOWN_COLUMNS);
  };

  // Robust Phase and Proposal Resolvers
  const resolvePhaseForRecord = (r, isPumpRoom = false) => {
    if (!r) return null;
    const rawPhaseId = r.linked_phase || r.phase_id;

    // 1. Direct phase match
    if (rawPhaseId) {
      let matchedPhase = phases.find(p => p.id === rawPhaseId);
      if (matchedPhase) return matchedPhase;
    }

    // 2. Lookup via proposal_data_entry (water feature)
    if (rawPhaseId) {
      const pdeMatch = wfRecords.find(w => w.id === rawPhaseId || w.phase_id === rawPhaseId);
      if (pdeMatch && pdeMatch.phase_id) {
        const matchedPhase = phases.find(p => p.id === pdeMatch.phase_id);
        if (matchedPhase) return matchedPhase;
      }
    }

    // 3. Lookup via pump_room_data_entry (pump room)
    if (rawPhaseId) {
      const prdeMatch = prRecords.find(p => p.id === rawPhaseId || p.linked_phase === rawPhaseId || p.phase_id === rawPhaseId);
      if (prdeMatch && (prdeMatch.linked_phase || prdeMatch.phase_id)) {
        const target = prdeMatch.linked_phase || prdeMatch.phase_id;
        const matchedPhase = phases.find(p => p.id === target);
        if (matchedPhase) return matchedPhase;
      }
    }

    // 4. Lookup by tender_log_id / component type
    const tenderId = r.linked_proposal || r.tender_log_id;
    if (tenderId) {
      const candidate = phases.find(p => p.tender_log_id === tenderId && (isPumpRoom ? p.component_type === 'Pump Room' : p.component_type === 'Water Feature'));
      if (candidate) return candidate;
    }

    return null;
  };

  const resolveProposalForRecord = (r, phaseObj) => {
    if (!r && !phaseObj) return null;
    if (phaseObj && phaseObj.tender_log_id) {
      const prop = proposals.find(p => p.id === phaseObj.tender_log_id);
      if (prop) return prop;
    }
    const propId = r?.linked_proposal || r?.proposal_id || r?.tender_log_id;
    if (propId) {
      const prop = proposals.find(p => p.id === propId);
      if (prop) return prop;
    }
    return null;
  };

  // Open Form for Adding New Record
  const handleAddNew = () => {
    if (activeTab === 'pr_structural') {
      setPrStructData({ ...defaultPrStructData });
    } else if (activeTab === 'wf_finishes') {
      setWfFinishesData({ ...defaultWfFinishesData });
    } else if (activeTab === 'pr_finishes') {
      setPrFinishesData({ ...defaultPrFinishesData });
    } else {
      setWfStructData({ ...defaultWfStructData });
    }
    setErrorMessage(null);
    setSaveMessage(null);
    setIsFormModalOpen(true);
  };

  // Open Form for Editing Existing Record
  const handleEditWfStructRecord = (record) => {
    setActiveTab('wf_structural');
    const ph = resolvePhaseForRecord(record, false);
    const prop = resolveProposalForRecord(record, ph);
    const canonicalPhaseId = ph?.id || record.linked_phase || record.phase_id || '';
    const canonicalProposalId = prop?.id || ph?.tender_log_id || record.linked_proposal || record.tender_log_id || '';

    const upstreamEntry = wfRecords.find(w => 
      w.id === (record.linked_phase || record.phase_id) || 
      w.phase_id === canonicalPhaseId || 
      w.id === canonicalPhaseId
    );

    const existingItems = civilBoqRecords.filter(item => 
      (String(item.phase_id) === String(canonicalPhaseId) || 
      (record.phase_id && String(item.phase_id) === String(record.phase_id))) &&
      !isFinishesBoqItem(item) &&
      !String(item.phase_component || '').toLowerCase().includes('pump')
    );

    setWfStructData({
      ...defaultWfStructData,
      ...record,
      linked_phase: canonicalPhaseId,
      phase_id: canonicalPhaseId,
      linked_proposal: canonicalProposalId,
      tender_log_id: canonicalProposalId,
      project_owner: record.project_owner || prop?.client_id || '',
      main_contractor: record.main_contractor || prop?.main_contractor || '',
      civil_consultant: record.civil_consultant || prop?.civil_consultant || '',
      region: record.region || prop?.region || '',
      accommodations_required: record.accommodations_required || upstreamEntry?.accommodations_required || 'No',
      proposal_breakdown_items: existingItems
    });
    setErrorMessage(null);
    setSaveMessage(null);
    setIsFormModalOpen(true);
  };

  const handleEditPrStructRecord = (record) => {
    setActiveTab('pr_structural');
    const ph = resolvePhaseForRecord(record, true);
    const prop = resolveProposalForRecord(record, ph);
    const canonicalPhaseId = ph?.id || record.linked_phase || record.phase_id || '';
    const canonicalProposalId = prop?.id || ph?.tender_log_id || record.linked_proposal || record.tender_log_id || '';

    const upstreamEntry = prRecords.find(p => 
      p.id === (record.linked_phase || record.phase_id) || 
      p.linked_phase === canonicalPhaseId || 
      p.id === canonicalPhaseId
    );

    const existingItems = civilBoqRecords.filter(item => 
      (String(item.phase_id) === String(canonicalPhaseId) || 
      (record.phase_id && String(item.phase_id) === String(record.phase_id))) &&
      !isFinishesBoqItem(item) &&
      String(item.phase_component || '').toLowerCase().includes('pump')
    );

    setPrStructData({
      ...defaultPrStructData,
      ...record,
      linked_phase: canonicalPhaseId,
      phase_id: canonicalPhaseId,
      linked_proposal: canonicalProposalId,
      tender_log_id: canonicalProposalId,
      project_owner: record.project_owner || prop?.client_id || '',
      main_contractor: record.main_contractor || prop?.main_contractor || '',
      civil_consultant: record.civil_consultant || prop?.civil_consultant || '',
      region: record.region || prop?.region || '',
      proposal_breakdown_items: existingItems
    });
    setErrorMessage(null);
    setSaveMessage(null);
    setIsFormModalOpen(true);
  };

  const handleEditWfFinishesRecord = (record) => {
    setActiveTab('wf_finishes');
    const ph = resolvePhaseForRecord(record, false);
    const prop = resolveProposalForRecord(record, ph);
    const canonicalPhaseId = ph?.id || record.linked_phase || record.phase_id || '';
    const canonicalProposalId = prop?.id || ph?.tender_log_id || record.linked_proposal || record.tender_log_id || '';

    const upstreamEntry = wfRecords.find(w => 
      w.id === (record.linked_phase || record.phase_id) || 
      w.phase_id === canonicalPhaseId || 
      w.id === canonicalPhaseId
    );

    const existingItems = civilBoqRecords.filter(item => 
      (String(item.phase_id) === String(canonicalPhaseId) || 
      (record.phase_id && String(item.phase_id) === String(record.phase_id)) ||
      (record.linked_phase && String(item.phase_id) === String(record.linked_phase))) &&
      isFinishesBoqItem(item) &&
      !String(item.phase_component || '').toLowerCase().includes('pump')
    );

    // 1. Resolve Coping Stone Type
    let inferredCopingStone = record.coping_stone_type || 'marble';
    if (record.floor_tile_type === '94efac3b-5706-4118-ae10-1a51c9a970d8') {
      inferredCopingStone = 'granite';
    } else if (record.floor_tile_type === '0786cbc5-ecf9-4f77-b83d-00fc20034c09') {
      inferredCopingStone = 'artificial stone';
    } else if (record.floor_tile_type === 'fd96d019-73d4-4f3e-9899-95c40b62a0a1') {
      inferredCopingStone = 'marble';
    } else {
      const copingBoq = existingItems.find(i => 
        String(i.work_main_category || '').toLowerCase().includes('coping') ||
        String(i.item || '').includes('fd96d019') ||
        String(i.item || '').includes('94efac3b') ||
        String(i.item || '').includes('0786cbc5')
      );
      if (copingBoq?.item === '94efac3b-5706-4118-ae10-1a51c9a970d8') inferredCopingStone = 'granite';
      else if (copingBoq?.item === '0786cbc5-ecf9-4f77-b83d-00fc20034c09') inferredCopingStone = 'artificial stone';
    }

    // 2. Resolve Tiling / Mosaic Type
    let inferredTilesType = record.tiles_type || 'mosaic glass';
    if (record.wf_tiling_type === '0f870c8e-c26f-4dd2-94d8-2d65806eecfe') {
      inferredTilesType = 'ceramic tiles';
    } else if (Number(record.qty_total_liner_m2_erp || 0) > 0 || Number(record.qty_resilient_sheet_m2_erp || 0) > 0) {
      inferredTilesType = 'liner';
    } else if (Number(record.qty_tiling_m2_erp || 0) === 0 && Number(record.qty_stucco_m2_erp || 0) > 0) {
      inferredTilesType = 'plastering';
    }

    // 3. Resolve specific Mosaic Mounting Type from breakdown items if available
    let inferredMosaicId = record.water_feature_mosaic_type_id || '2e230add-9db2-413b-a970-74f4ec111524';
    const tileBoq = existingItems.find(i => 
      String(i.item || '').includes('a2ce01aa') || 
      String(i.item || '').includes('2e230add') ||
      String(i.item_name || '').toLowerCase().includes('mosaic')
    );
    if (tileBoq?.item && (tileBoq.item === 'a2ce01aa-a7ed-4b8c-89e6-1f163cc15a5a' || tileBoq.item === '2e230add-9db2-413b-a970-74f4ec111524')) {
      inferredMosaicId = tileBoq.item;
    }

    // 4. Resolve Adhesive and Grout materials & brands
    const adhesiveMat = materialsList.find(m => String(m.item_id) === String(record.wf_adhesive_material) || String(m.id) === String(record.wf_adhesive_material));
    const resolvedAdhesiveId = adhesiveMat?.id || record.wf_adhesive_material || '';
    const resolvedAdhesiveBrand = record.wf_adhesive_brand || adhesiveMat?.brand_id || '25b1498a-9c86-46a2-943b-9b889001a650';

    const groutMat = materialsList.find(m => String(m.item_id) === String(record.wf_grout_material) || String(m.id) === String(record.wf_grout_material));
    const resolvedGroutId = groutMat?.id || record.wf_grout_material || '';
    const resolvedGroutBrand = record.wf_grout_brand || groutMat?.brand_id || '25b1498a-9c86-46a2-943b-9b889001a650';

    // 5. Resolve Liner Brand, Color, Smooth Type, and Stairs Type from finishesTypeList
    const linerSmoothMatch = finishesTypeList.find(f => 
      String(f.item_id) === String(record.wf_resilient_sheet_type) || 
      String(f.id) === String(record.wf_resilient_sheet_type)
    );
    const linerStairsMatch = finishesTypeList.find(f => 
      String(f.item_id) === String(record.resilient_sheet_type_stairs) || 
      String(f.id) === String(record.resilient_sheet_type_stairs)
    );
    const resolvedLinerBrand = record.resilient_sheet_brand || linerSmoothMatch?.brand_id || linerStairsMatch?.brand_id || 'a336ab8d-488e-48dc-bd82-9dd01c9ac39a';
    const resolvedLinerColor = linerSmoothMatch?.color || linerStairsMatch?.color || 'White';
    const resolvedLinerTypeId = linerSmoothMatch?.id || record.wf_resilient_sheet_type || 'd2c1df2b-363e-4813-a09d-2dd00893d07d';
    const resolvedLinerStairsId = linerStairsMatch?.id || record.resilient_sheet_type_stairs || 'b6cb2aff-8a50-4172-9f82-51b77bab90ad';

    setWfFinishesData({
      ...defaultWfFinishesData,
      ...record,
      linked_phase: canonicalPhaseId,
      phase_id: canonicalPhaseId,
      linked_proposal: canonicalProposalId,
      tender_log_id: canonicalProposalId,
      project_owner: record.project_owner || prop?.client_id || '',
      main_contractor: record.main_contractor || prop?.main_contractor || '',
      civil_consultant: record.civil_consultant || prop?.civil_consultant || '',
      region: record.region || prop?.region || '',
      accommodations_required: record.accommodations_required || upstreamEntry?.accommodations_required || 'No',
      coping_stone_type: inferredCopingStone,
      floor_tile_type_id: record.floor_tile_type || '',
      tiles_type: inferredTilesType,
      water_feature_mosaic_type_id: inferredMosaicId,
      wf_mosaic_type: inferredMosaicId,
      water_feature_tiling_type_id: inferredTilesType === 'ceramic tiles' ? '86acaacf-f943-4845-aaeb-bd836ac641a8' : '',
      wf_adhesive_brand_id: resolvedAdhesiveBrand,
      adhesive_brand_id: resolvedAdhesiveBrand,
      wf_adhesive_brand: resolvedAdhesiveBrand,
      wf_adhesive_material: resolvedAdhesiveId,
      adhesive_material_id: resolvedAdhesiveId,
      wf_grout_brand_id: resolvedGroutBrand,
      grout_brand_id: resolvedGroutBrand,
      wf_grout_brand: resolvedGroutBrand,
      wf_grout_material: resolvedGroutId,
      grout_material_id: resolvedGroutId,
      resilient_sheet_brand_id: resolvedLinerBrand,
      resilient_sheet_brand: resolvedLinerBrand,
      resilient_sheet_color_id: resolvedLinerColor,
      resilient_sheet_color: resolvedLinerColor,
      resilient_sheet_type_id: resolvedLinerTypeId,
      wf_resilient_sheet_type: resolvedLinerTypeId,
      resilient_sheet_stairs_type_id: resolvedLinerStairsId,
      resilient_sheet_type_stairs: resolvedLinerStairsId,
      proposal_breakdown_items: existingItems
    });
    setErrorMessage(null);
    setSaveMessage(null);
    setIsFormModalOpen(true);
  };

  const handleEditPrFinishesRecord = (record) => {
    setActiveTab('pr_finishes');
    const ph = resolvePhaseForRecord(record, true);
    const prop = resolveProposalForRecord(record, ph);
    const canonicalPhaseId = ph?.id || record.linked_phase || record.phase_id || '';
    const canonicalProposalId = prop?.id || ph?.tender_log_id || record.linked_proposal || record.tender_log_id || '';

    const upstreamEntry = prRecords.find(p => 
      p.id === (record.linked_phase || record.phase_id) || 
      p.linked_phase === canonicalPhaseId || 
      p.id === canonicalPhaseId
    );

    const existingItems = civilBoqRecords.filter(item => 
      (String(item.phase_id) === String(canonicalPhaseId) || 
      (record.phase_id && String(item.phase_id) === String(record.phase_id)) ||
      (record.linked_phase && String(item.phase_id) === String(record.linked_phase))) &&
      isFinishesBoqItem(item) &&
      String(item.phase_component || '').toLowerCase().includes('pump')
    );

    const prAdhMat = materialsList.find(m => String(m.item_id) === String(record.pr_adhesive_material) || String(m.id) === String(record.pr_adhesive_material));
    const prGrtMat = materialsList.find(m => String(m.item_id) === String(record.pr_grout_material) || String(m.id) === String(record.pr_grout_material));
    const btAdhMat = materialsList.find(m => String(m.item_id) === String(record.bt_adhesive_material) || String(m.id) === String(record.bt_adhesive_material));
    const btGrtMat = materialsList.find(m => String(m.item_id) === String(record.bt_grout_material) || String(m.id) === String(record.bt_grout_material));
    const epoxyMat = materialsList.find(m => String(m.item_id) === String(record.epoxy_paintings_material) || String(m.id) === String(record.epoxy_paintings_material));

    setPrFinishesData({
      ...defaultPrFinishesData,
      ...record,
      linked_phase: canonicalPhaseId,
      phase_id: canonicalPhaseId,
      linked_proposal: canonicalProposalId,
      tender_log_id: canonicalProposalId,
      project_owner: record.project_owner || prop?.client_id || '',
      main_contractor: record.main_contractor || prop?.main_contractor || '',
      civil_consultant: record.civil_consultant || prop?.civil_consultant || '',
      region: record.region || prop?.region || '',
      epoxy_brand_id: record.epoxy_paintings_brand || epoxyMat?.brand_id || '',
      epoxy_material_id: epoxyMat?.id || record.epoxy_paintings_material || '',
      pr_adhesive_brand: record.pr_adhesive_brand || prAdhMat?.brand_id || '',
      pr_adhesive_material: prAdhMat?.id || record.pr_adhesive_material || '',
      pr_grout_brand: record.pr_grout_brand || prGrtMat?.brand_id || '',
      pr_grout_material: prGrtMat?.id || record.pr_grout_material || '',
      bt_adhesive_brand: record.bt_adhesive_brand || btAdhMat?.brand_id || '',
      bt_adhesive_material: btAdhMat?.id || record.bt_adhesive_material || '',
      bt_grout_brand: record.bt_grout_brand || btGrtMat?.brand_id || '',
      bt_grout_material: btGrtMat?.id || record.bt_grout_material || '',
      proposal_breakdown_items: existingItems
    });
    setErrorMessage(null);
    setSaveMessage(null);
    setIsFormModalOpen(true);
  };

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    type: '',
    title: '',
    subtitle: '',
    isDeleting: false
  });

  const promptDeleteRecord = (type, record, e) => {
    if (e) e.stopPropagation();
    let title = 'Delete Record?';
    let subtitle = 'This action will permanently delete this record and its associated BOQ breakdown items.';
    
    if (type === 'wf_struct') {
      const ph = resolvePhaseForRecord(record, false);
      title = `Delete WF Structural Record?`;
      subtitle = `Are you sure you want to delete the structural works record for "${ph?.phase_title || 'this phase'}" and all its BOQ breakdown items?`;
    } else if (type === 'pr_struct') {
      const ph = resolvePhaseForRecord(record, true);
      title = `Delete PR Structural Record?`;
      subtitle = `Are you sure you want to delete the pump room structural works record for "${ph?.phase_title || 'this phase'}" and all its BOQ breakdown items?`;
    } else if (type === 'wf_finishes') {
      const ph = resolvePhaseForRecord(record, false);
      title = `Delete WF Finishes Record?`;
      subtitle = `Are you sure you want to delete the water feature finishes works record for "${ph?.phase_title || 'this phase'}" and all its BOQ breakdown items?`;
    } else if (type === 'pr_finishes') {
      const ph = resolvePhaseForRecord(record, true);
      title = `Delete PR Finishes Record?`;
      subtitle = `Are you sure you want to delete the pump room finishes works record for "${ph?.phase_title || 'this phase'}" and all its BOQ breakdown items?`;
    }

    setDeleteModal({
      isOpen: true,
      id: record.id,
      type,
      title,
      subtitle,
      isDeleting: false
    });
  };

  const handleConfirmDeleteModal = async () => {
    if (!deleteModal.id || !deleteModal.type) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      const { id, type } = deleteModal;
      if (type === 'wf_finishes') {
        const record = wfFinishesRecords.find(r => r.id === id);
        const phaseId = record?.linked_phase || record?.phase_id;
        const tenderId = record?.tender_log_id || record?.linked_proposal;
        if (phaseId) {
          let q = supabase.from('proposal_breakdown_items').delete().eq('phase_id', phaseId).eq('phase_component', 'Water Feature');
          if (tenderId) q = q.eq('tender_log_id', tenderId);
          await q;
        }
        const { error } = await supabase.from('proposal_finishes_water_feature').delete().eq('id', id);
        if (error) console.warn('Delete warning:', error);
        setWfFinishesRecords(prev => prev.filter(r => r.id !== id));
        setSaveMessage('Finishes works and breakdown items deleted successfully.');
      } else if (type === 'pr_finishes') {
        const record = prFinishesRecords.find(r => r.id === id);
        const phaseId = record?.linked_phase || record?.phase_id;
        const tenderId = record?.tender_log_id || record?.linked_proposal;
        if (phaseId) {
          let q = supabase.from('proposal_breakdown_items').delete().eq('phase_id', phaseId).eq('phase_component', 'Pump Room');
          if (tenderId) q = q.eq('tender_log_id', tenderId);
          await q;
        }
        const { error } = await supabase.from('proposal_finishes_pump_room').delete().eq('id', id);
        if (error) console.warn('Delete warning:', error);
        setPrFinishesRecords(prev => prev.filter(r => r.id !== id));
        setSaveMessage('Pump room finishes works and breakdown items deleted successfully.');
      } else if (type === 'wf_struct') {
        const record = wfStructRecords.find(r => r.id === id);
        const phaseId = record?.phase_id;
        const tenderId = record?.tender_log_id || record?.linked_proposal;
        if (phaseId) {
          let q = supabase.from('proposal_breakdown_items').delete().eq('phase_id', phaseId).eq('phase_component', 'Water Feature').eq('work_type', 'Civil');
          if (tenderId) q = q.eq('tender_log_id', tenderId);
          await q;
        }
        const { error } = await supabase.from('water_feature_structural_works').delete().eq('id', id);
        if (error) throw error;
        setWfStructRecords(prev => prev.filter(r => r.id !== id));
        setSaveMessage('Structural works and breakdown items deleted successfully.');
      } else if (type === 'pr_struct') {
        const record = prStructRecords.find(r => r.id === id);
        const phaseId = record?.phase_id;
        const tenderId = record?.tender_log_id || record?.linked_proposal;
        if (phaseId) {
          let q = supabase.from('proposal_breakdown_items').delete().eq('phase_id', phaseId).eq('phase_component', 'Pump Room').eq('work_type', 'Civil');
          if (tenderId) q = q.eq('tender_log_id', tenderId);
          await q;
        }
        const { error } = await supabase.from('pump_room_structural_works').delete().eq('id', id);
        if (error) throw error;
        setPrStructRecords(prev => prev.filter(r => r.id !== id));
        setSaveMessage('Pump room structural works and breakdown items deleted successfully.');
      }
      const deletedTableMap = {
        wf_struct: 'water_feature_structural_works',
        pr_struct: 'pump_room_structural_works',
        wf_finishes: 'proposal_finishes_water_feature',
        pr_finishes: 'proposal_finishes_pump_room',
      };
      recordErpAuditAndNotification({
        table_name: deletedTableMap[type] || 'water_feature_structural_works',
        record_id: String(id),
        action: 'DELETE',
        old_data: { id, scope: type },
      });
      void syncAllErpTendersAndCostsToTenderLog();
      setTimeout(() => setSaveMessage(null), 3000);
      setDeleteModal({ isOpen: false, id: null, type: '', title: '', subtitle: '', isDeleting: false });
    } catch (err) {
      setErrorMessage('Failed to delete: ' + err.message);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Save Record
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveMessage(null);

    try {
      if (activeTab === 'wf_structural') {
        if (!wfStructData.linked_phase) {
          throw new Error('Please select a Water Feature Phase in Section 1.');
        }

        // Find linked phase and tender_log_id
        const matchedPhase = phases.find(p => String(p.id) === String(wfStructData.linked_phase));
        const resolvedTenderLogId = matchedPhase?.tender_log_id || wfStructData.linked_proposal || wfStructData.tender_log_id;

        // Resolve or ensure proposal_data_entry record for this phase (because water_feature_structural_works.phase_id is an FK to proposal_data_entry.id)
        let resolvedPde = wfRecords.find(w => String(w.phase_id) === String(wfStructData.linked_phase) || String(w.id) === String(wfStructData.linked_phase));
        
        if (!resolvedPde) {
          const { data: existingPde } = await supabase
            .from('proposal_data_entry')
            .select('*')
            .eq('phase_id', wfStructData.linked_phase)
            .maybeSingle();

          if (existingPde) {
            resolvedPde = existingPde;
          } else {
            const { data: newPde, error: pdeErr } = await supabase
              .from('proposal_data_entry')
              .insert([{
                tender_log_id: resolvedTenderLogId,
                phase_id: wfStructData.linked_phase,
                water_feature_category: '2af5028b-4bec-403e-8825-75984bcbda28',
                swimming_pool_shape: 'Rectangle',
                ...buildErpAuditFields(false)
              }])
              .select('*')
              .single();
            if (pdeErr) throw new Error('Could not initialize Water Feature technical data: ' + pdeErr.message);
            resolvedPde = newPde;
          }
        }

        // Fetch existing BOQ breakdown items for this phase (scoped to WF Structural items)
        const { data: rawBoqItems, error: fetchBoqErr } = await supabase
          .from('proposal_breakdown_items')
          .select('*')
          .eq('phase_id', wfStructData.linked_phase);

        if (fetchBoqErr) {
          console.warn('Could not fetch existing BOQ items:', fetchBoqErr);
        }

        const existingBoqItems = (rawBoqItems || []).filter(i => {
          const wt = String(i.work_type || '').toLowerCase().trim();
          if (wt === 'mechanical' || wt === 'electrical') return false;
          if (isFinishesBoqItem(i)) return false;
          return !String(i.phase_component || '').toLowerCase().includes('pump');
        });

        // Run BOQ Builder
        const dropdownOptions = {
          items: itemsList,
          items_database: itemsList,
          civil_material_types: materialsList,
          phases,
          proposal_data_entry: wfRecords,
          water_feature_categories: categoriesList,
          brands: brandsList
        };

        const formWithContext = {
          ...wfStructData,
          phase_id: wfStructData.linked_phase,
          linked_phase: wfStructData.linked_phase,
          tender_log_id: resolvedTenderLogId,
          linked_proposal: resolvedTenderLogId,
          proposal_id: resolvedTenderLogId
        };

        const calculatedForm = buildWaterFeatureStructuralBoq(
          formWithContext,
          existingBoqItems,
          dropdownOptions
        );

        // Check if a record already exists for this phase_id
        let existingRecordId = wfStructData.id;
        if (!existingRecordId) {
          const phaseTarget = resolvedPde?.id || wfStructData.linked_phase;
          if (phaseTarget) {
            const { data: foundList } = await supabase
              .from('water_feature_structural_works')
              .select('id')
              .eq('phase_id', phaseTarget)
              .limit(1);
            if (foundList && foundList.length > 0) existingRecordId = foundList[0].id;
          }
        }

        // Sanitize and save/update water_feature_structural_works
        const payload = sanitizePayload({
          ...calculatedForm,
          tender_log_id: resolvedTenderLogId,
          linked_proposal: resolvedTenderLogId,
          phase_id: resolvedPde.id,
          ...buildErpAuditFields(Boolean(existingRecordId))
        }, WF_STRUCT_COLUMNS);
        delete payload.proposal_breakdown_items; // helper array not stored directly on water_feature_structural_works

        delete payload.id;
        let savedRecordId = existingRecordId;

        if (existingRecordId) {
          const { error } = await supabase
            .from('water_feature_structural_works')
            .update(payload)
            .eq('id', existingRecordId);
          if (error) throw error;
        } else {
          const { data: inserted, error } = await supabase
            .from('water_feature_structural_works')
            .insert([payload])
            .select('id')
            .single();
          if (error) throw error;
          if (inserted?.id) savedRecordId = inserted.id;
        }

        // Synchronize auto-generated BOQ rows to proposal_breakdown_items
        if (Array.isArray(calculatedForm.proposal_breakdown_items)) {
          const generatedRows = calculatedForm.proposal_breakdown_items;
          const currentSpawners = new Set(
            generatedRows
              .filter(i => (i._isautogenerated || i._isAutoGenerated) && i._spawnerid)
              .map(i => i._spawnerid)
          );

          // Clean up auto-generated rows that were deleted (e.g. qty set to 0)
          const rowsToDelete = (existingBoqItems || [])
            .filter(i => (i._isautogenerated || i._isAutoGenerated) && i._spawnerid && !currentSpawners.has(i._spawnerid))
            .map(i => i.id);

          if (rowsToDelete.length > 0) {
            const { error: delErr } = await supabase
              .from('proposal_breakdown_items')
              .delete()
              .in('id', rowsToDelete);
            if (delErr) console.warn('Error cleaning up pruned BOQ rows:', delErr);
          }

          // Format rows for upsert into proposal_breakdown_items
          const rowsToUpsert = generatedRows.map(row => {
            return formatBoqRowForUpsert(
              row,
              resolvedTenderLogId,
              wfStructData.linked_phase,
              'Water Feature',
              'Civil'
            );
          });

          if (rowsToUpsert.length > 0) {
            const { error: upsertErr } = await supabase
              .from('proposal_breakdown_items')
              .upsert(rowsToUpsert, { onConflict: 'id' });
            if (upsertErr) {
              console.error('Error saving BOQ breakdown items:', upsertErr);
              throw new Error('Civil Works saved, but failed to sync BOQ Breakdown: ' + upsertErr.message);
            }
          }
        }

        const wfStructTotalCost = (calculatedForm.proposal_breakdown_items || []).reduce(
          (sum, r) => sum + (r?.activity_responsibility === 'Client' ? 0 : Number(r?.total_cost || 0)),
          0
        );
        const matchedPropWfS = proposals.find(p => String(p.id) === String(resolvedTenderLogId));
        recordErpAuditAndNotification({
          table_name: 'water_feature_structural_works',
          record_id: String(savedRecordId || wfStructData.linked_phase),
          erp_tender_id: resolvedTenderLogId ? String(resolvedTenderLogId) : null,
          proposal_code: matchedPropWfS?.proposal_number || null,
          action: existingRecordId ? 'UPDATE' : 'INSERT',
          new_data: {
            phase: matchedPhase?.phase_title || wfStructData.linked_phase,
            boq_items_count: calculatedForm.proposal_breakdown_items?.length || 0,
            civil_direct_cost_egp: Math.round(wfStructTotalCost),
          },
          notification: {
            type: 'erp_civil_boq_synced',
            targetRoles: ['app_admin', 'tender_manager', 'civil_tender_engineer'],
            includeAssignedEngineers: true,
            title_en: `WF Structural BOQ Synced (${matchedPhase?.phase_title || 'Phase'})`,
            title_ar: `مزامنة مقايسة خرسانات المسطح المائي (${matchedPhase?.phase_title || 'المرحلة'})`,
            message_en: `${calculatedForm.proposal_breakdown_items?.length || 0} Civil BOQ items (${Math.round(wfStructTotalCost).toLocaleString()} EGP direct cost) synchronized to Tender Log.`,
            message_ar: `تمت مزامنة ${calculatedForm.proposal_breakdown_items?.length || 0} بند خرسانات (${Math.round(wfStructTotalCost).toLocaleString()} ج.م تكلفة مباشرة) مع سجل المناقصات.`,
          },
        });
        void syncAllErpTendersAndCostsToTenderLog();

        setSaveMessage(`Water Feature Structural Works & ${calculatedForm.proposal_breakdown_items?.length || 0} BOQ Breakdown Items successfully saved & synchronized!`);
        await loadAllData();
        setTimeout(() => {
          setIsFormModalOpen(false);
        }, 1000);
      } else if (activeTab === 'pr_structural') {
        if (!prStructData.linked_phase) {
          throw new Error('Please select a Pump Room Phase in Section 1.');
        }

        // Find linked phase and tender_log_id
        const matchedPhase = phases.find(p => String(p.id) === String(prStructData.linked_phase));
        const resolvedTenderLogId = matchedPhase?.tender_log_id || prStructData.linked_proposal || prStructData.tender_log_id;

        // Fetch existing BOQ breakdown items for this phase (scoped to PR Structural items)
        const { data: rawBoqItems, error: fetchBoqErr } = await supabase
          .from('proposal_breakdown_items')
          .select('*')
          .eq('phase_id', prStructData.linked_phase);

        if (fetchBoqErr) {
          console.warn('Could not fetch existing BOQ items:', fetchBoqErr);
        }

        const existingBoqItems = (rawBoqItems || []).filter(i => {
          const wt = String(i.work_type || '').toLowerCase().trim();
          if (wt === 'mechanical' || wt === 'electrical') return false;
          if (isFinishesBoqItem(i)) return false;
          return String(i.phase_component || '').toLowerCase().includes('pump');
        });

        // Run Pump Room BOQ Builder
        const dropdownOptions = {
          items: itemsList,
          items_database: itemsList,
          civil_material_types: materialsList,
          phases,
          pump_room_data_entry: prRecords,
          brands: brandsList
        };

        const formWithContext = {
          ...prStructData,
          phase_id: prStructData.linked_phase,
          linked_phase: prStructData.linked_phase,
          tender_log_id: resolvedTenderLogId,
          linked_proposal: resolvedTenderLogId,
          proposal_id: resolvedTenderLogId
        };

        const calculatedForm = buildPumpRoomStructuralBoq(
          formWithContext,
          existingBoqItems,
          dropdownOptions
        );

        // Check if a record already exists for this phase_id
        let existingRecordId = prStructData.id;
        if (!existingRecordId && prStructData.linked_phase) {
          const { data: foundList } = await supabase
            .from('pump_room_structural_works')
            .select('id')
            .eq('phase_id', prStructData.linked_phase)
            .limit(1);
          if (foundList && foundList.length > 0) existingRecordId = foundList[0].id;
        }

        // Sanitize and save/update pump_room_structural_works
        const payload = sanitizePayload({
          ...calculatedForm,
          tender_log_id: resolvedTenderLogId,
          linked_proposal: resolvedTenderLogId,
          phase_id: prStructData.linked_phase,
          ...buildErpAuditFields(Boolean(existingRecordId))
        }, PR_STRUCT_COLUMNS);
        delete payload.proposal_breakdown_items;
        delete payload.items;

        delete payload.id;
        let savedRecordId = existingRecordId;

        if (existingRecordId) {
          const { error } = await supabase
            .from('pump_room_structural_works')
            .update(payload)
            .eq('id', existingRecordId);
          if (error) throw error;
        } else {
          const { data: inserted, error } = await supabase
            .from('pump_room_structural_works')
            .insert([payload])
            .select('id')
            .single();
          if (error) throw error;
          if (inserted?.id) savedRecordId = inserted.id;
        }

        // Synchronize auto-generated BOQ rows to proposal_breakdown_items (Pump Room)
        if (Array.isArray(calculatedForm.proposal_breakdown_items)) {
          const generatedRows = calculatedForm.proposal_breakdown_items;
          const currentSpawners = new Set(
            generatedRows
              .filter(i => (i._isautogenerated || i._isAutoGenerated) && i._spawnerid)
              .map(i => i._spawnerid)
          );

          // Clean up auto-generated rows that were deleted (e.g. qty set to 0)
          const rowsToDelete = (existingBoqItems || [])
            .filter(i => (i._isautogenerated || i._isAutoGenerated) && i._spawnerid && !currentSpawners.has(i._spawnerid))
            .map(i => i.id);

          if (rowsToDelete.length > 0) {
            const { error: delErr } = await supabase
              .from('proposal_breakdown_items')
              .delete()
              .in('id', rowsToDelete);
            if (delErr) console.warn('Error cleaning up pruned BOQ rows:', delErr);
          }

          // Format rows for upsert into proposal_breakdown_items
          const rowsToUpsert = generatedRows.map(row => {
            return formatBoqRowForUpsert(
              row,
              resolvedTenderLogId,
              prStructData.linked_phase,
              'Pump Room',
              'Civil'
            );
          });

          if (rowsToUpsert.length > 0) {
            const { error: upsertErr } = await supabase
              .from('proposal_breakdown_items')
              .upsert(rowsToUpsert, { onConflict: 'id' });
            if (upsertErr) {
              console.error('Error saving PR BOQ breakdown items:', upsertErr);
              throw new Error('Pump Room Civil Works saved, but failed to sync BOQ Breakdown: ' + upsertErr.message);
            }
          }
        }

        const prStructTotalCost = (calculatedForm.proposal_breakdown_items || []).reduce(
          (sum, r) => sum + (r?.activity_responsibility === 'Client' ? 0 : Number(r?.total_cost || 0)),
          0
        );
        const matchedPropPrS = proposals.find(p => String(p.id) === String(resolvedTenderLogId));
        recordErpAuditAndNotification({
          table_name: 'pump_room_structural_works',
          record_id: String(savedRecordId || prStructData.linked_phase),
          erp_tender_id: resolvedTenderLogId ? String(resolvedTenderLogId) : null,
          proposal_code: matchedPropPrS?.proposal_number || null,
          action: existingRecordId ? 'UPDATE' : 'INSERT',
          new_data: {
            phase: matchedPhase?.phase_title || prStructData.linked_phase,
            boq_items_count: calculatedForm.proposal_breakdown_items?.length || 0,
            civil_direct_cost_egp: Math.round(prStructTotalCost),
          },
          notification: {
            type: 'erp_civil_boq_synced',
            targetRoles: ['app_admin', 'tender_manager', 'civil_tender_engineer'],
            includeAssignedEngineers: true,
            title_en: `Pump Room Structural BOQ Synced (${matchedPhase?.phase_title || 'Pump Room'})`,
            title_ar: `مزامنة مقايسة خرسانات غرفة الطلمبات (${matchedPhase?.phase_title || 'غرفة الطلمبات'})`,
            message_en: `${calculatedForm.proposal_breakdown_items?.length || 0} Civil BOQ items (${Math.round(prStructTotalCost).toLocaleString()} EGP direct cost) synchronized to Tender Log.`,
            message_ar: `تمت مزامنة ${calculatedForm.proposal_breakdown_items?.length || 0} بند خرسانات (${Math.round(prStructTotalCost).toLocaleString()} ج.م تكلفة مباشرة) مع سجل المناقصات.`,
          },
        });
        void syncAllErpTendersAndCostsToTenderLog();

        setSaveMessage(`Pump Room Structural Works & ${calculatedForm.proposal_breakdown_items?.length || 0} BOQ Breakdown Items successfully saved & synchronized!`);
        await loadAllData();
        setTimeout(() => {
          setIsFormModalOpen(false);
        }, 1000);
      } else if (activeTab === 'wf_finishes') {
        if (!wfFinishesData.linked_phase) {
          throw new Error('Please select a Water Feature Phase in Section 1.');
        }

        const matchedPhase = phases.find(p => String(p.id) === String(wfFinishesData.linked_phase));
        const resolvedTenderLogId = matchedPhase?.tender_log_id || wfFinishesData.linked_proposal || wfFinishesData.tender_log_id;
        const upstreamWf = wfRecords.find(p => String(p.id) === String(wfFinishesData.linked_phase) || String(p.linked_phase) === String(wfFinishesData.linked_phase) || String(p.phase_id) === String(wfFinishesData.linked_phase));

        let resolvedPde = wfRecords.find(w => String(w.phase_id) === String(wfFinishesData.linked_phase) || String(w.id) === String(wfFinishesData.linked_phase));
        if (!resolvedPde) {
          const { data: existingPde } = await supabase
            .from('proposal_data_entry')
            .select('*')
            .eq('phase_id', wfFinishesData.linked_phase)
            .maybeSingle();
          if (existingPde) {
            resolvedPde = existingPde;
          } else {
            const { data: newPde, error: pdeErr } = await supabase
              .from('proposal_data_entry')
              .insert([{
                tender_log_id: resolvedTenderLogId,
                phase_id: wfFinishesData.linked_phase,
                water_feature_category: '2af5028b-4bec-403e-8825-75984bcbda28',
                swimming_pool_shape: 'Rectangle',
                ...buildErpAuditFields(false)
              }])
              .select('*')
              .single();
            if (pdeErr) throw new Error('Could not initialize Water Feature technical data: ' + pdeErr.message);
            resolvedPde = newPde;
          }
        }

        // Fetch existing BOQ breakdown items for this phase (scoped to WF Finishes items)
        const { data: rawBoqItems, error: fetchBoqErr } = await supabase
          .from('proposal_breakdown_items')
          .select('*')
          .eq('phase_id', wfFinishesData.linked_phase);

        if (fetchBoqErr) {
          console.warn('Could not fetch existing BOQ items:', fetchBoqErr);
        }

        const existingBoqItems = (rawBoqItems || []).filter(i =>
          isFinishesBoqItem(i) && !String(i.phase_component || '').toLowerCase().includes('pump')
        );

        const dropdownOptions = {
          items: itemsList,
          items_database: itemsList,
          civil_material_types: materialsList,
          finishes_type: finishesTypeList,
          finishes_types: finishesTypeList,
          finishes_category: finishesCategoryList,
          finishes_categories: finishesCategoryList,
          phases,
          proposal_data_entry: wfRecords,
          water_feature_categories: categoriesList,
          brands: brandsList
        };

        const formWithContext = calculateWaterFeatureFinishes({
          ...wfFinishesData,
          phase_id: wfFinishesData.linked_phase,
          linked_phase: wfFinishesData.linked_phase,
          tender_log_id: resolvedTenderLogId,
          linked_proposal: resolvedTenderLogId,
          proposal_id: resolvedTenderLogId
        }, upstreamWf);

        const calculatedForm = buildWaterFeatureFinishesBoq(
          formWithContext,
          existingBoqItems,
          dropdownOptions,
          upstreamWf
        );

        // Check if a record already exists for this linked_phase
        let existingRecordId = wfFinishesData.id;
        if (!existingRecordId) {
          const phaseTarget = resolvedPde?.id || wfFinishesData.linked_phase;
          if (phaseTarget) {
            const { data: foundList } = await supabase
              .from('proposal_finishes_water_feature')
              .select('id')
              .eq('linked_phase', phaseTarget)
              .limit(1);
            if (foundList && foundList.length > 0) existingRecordId = foundList[0].id;
          }
        }

        // Sanitize and save/update proposal_finishes_water_feature
        const payload = sanitizePayload({
          ...calculatedForm,
          linked_proposal: resolvedTenderLogId,
          linked_phase: resolvedPde ? resolvedPde.id : null,
          ...buildErpAuditFields(Boolean(existingRecordId))
        }, WF_FINISHES_COLUMNS);
        delete payload.proposal_breakdown_items;
        delete payload.items;

        delete payload.id;
        let savedRecordId = existingRecordId;

        if (existingRecordId) {
          const { error } = await supabase
            .from('proposal_finishes_water_feature')
            .update(payload)
            .eq('id', existingRecordId);
          if (error) throw error;
        } else {
          const { data: inserted, error } = await supabase
            .from('proposal_finishes_water_feature')
            .insert([payload])
            .select('id')
            .single();
          if (error) throw error;
          if (inserted?.id) savedRecordId = inserted.id;
        }

        // Synchronize auto-generated BOQ rows to proposal_breakdown_items (Finishes)
        if (Array.isArray(calculatedForm.proposal_breakdown_items)) {
          const generatedRows = calculatedForm.proposal_breakdown_items;
          const currentSpawners = new Set(
            generatedRows
              .filter(i => (i._isautogenerated || i._isAutoGenerated) && i._spawnerid)
              .map(i => i._spawnerid)
          );

          // Clean up auto-generated rows that were deleted (only finishes spawners)
          const rowsToDelete = (existingBoqItems || [])
            .filter(i => isFinishesBoqItem(i) && (i._isautogenerated || i._isAutoGenerated) && i._spawnerid && !currentSpawners.has(i._spawnerid))
            .map(i => i.id);

          if (rowsToDelete.length > 0) {
            const { error: delErr } = await supabase
              .from('proposal_breakdown_items')
              .delete()
              .in('id', rowsToDelete);
            if (delErr) console.warn('Error cleaning up pruned BOQ rows:', delErr);
          }

          // Format rows for upsert into proposal_breakdown_items
          const rowsToUpsert = generatedRows.map(row => {
            return formatBoqRowForUpsert(
              row,
              resolvedTenderLogId,
              wfFinishesData.linked_phase,
              'Water Feature Finishes',
              'Civil'
            );
          });

          if (rowsToUpsert.length > 0) {
            const { error: upsertErr } = await supabase
              .from('proposal_breakdown_items')
              .upsert(rowsToUpsert, { onConflict: 'id' });
            if (upsertErr) {
              console.error('Error saving WF Finishes BOQ breakdown items:', upsertErr);
              throw new Error('Water Feature Finishes saved, but failed to sync BOQ Breakdown: ' + upsertErr.message);
            }
          }
        }

        const wfFinTotalCost = (calculatedForm.proposal_breakdown_items || []).reduce(
          (sum, r) => sum + (r?.activity_responsibility === 'Client' ? 0 : Number(r?.total_cost || 0)),
          0
        );
        const matchedPropWfF = proposals.find(p => String(p.id) === String(resolvedTenderLogId));
        recordErpAuditAndNotification({
          table_name: 'proposal_finishes_water_feature',
          record_id: String(savedRecordId || wfFinishesData.linked_phase),
          erp_tender_id: resolvedTenderLogId ? String(resolvedTenderLogId) : null,
          proposal_code: matchedPropWfF?.proposal_number || null,
          action: existingRecordId ? 'UPDATE' : 'INSERT',
          new_data: {
            phase: matchedPhase?.phase_title || wfFinishesData.linked_phase,
            boq_items_count: calculatedForm.proposal_breakdown_items?.length || 0,
            finishes_direct_cost_egp: Math.round(wfFinTotalCost),
          },
          notification: {
            type: 'erp_civil_boq_synced',
            targetRoles: ['app_admin', 'tender_manager', 'civil_tender_engineer'],
            includeAssignedEngineers: true,
            title_en: `WF Finishes BOQ Synced (${matchedPhase?.phase_title || 'Phase'})`,
            title_ar: `مزامنة مقايسة تشطيبات المسطح المائي (${matchedPhase?.phase_title || 'المرحلة'})`,
            message_en: `${calculatedForm.proposal_breakdown_items?.length || 0} Finishes BOQ items (${Math.round(wfFinTotalCost).toLocaleString()} EGP direct cost) synchronized to Tender Log.`,
            message_ar: `تمت مزامنة ${calculatedForm.proposal_breakdown_items?.length || 0} بند تشطيبات (${Math.round(wfFinTotalCost).toLocaleString()} ج.م تكلفة مباشرة) مع سجل المناقصات.`,
          },
        });
        void syncAllErpTendersAndCostsToTenderLog();

        setSaveMessage(`Water Feature Finishes Works & ${calculatedForm.proposal_breakdown_items?.length || 0} BOQ Breakdown Items successfully saved & synchronized!`);
        await loadAllData();
        setTimeout(() => {
          setIsFormModalOpen(false);
        }, 1000);
      } else if (activeTab === 'pr_finishes') {
        if (!prFinishesData.linked_phase) {
          throw new Error('Please select a Pump Room Phase in Section 1.');
        }

        const matchedPhase = phases.find(p => String(p.id) === String(prFinishesData.linked_phase));
        const resolvedTenderLogId = matchedPhase?.tender_log_id || prFinishesData.linked_proposal || prFinishesData.tender_log_id;
        const upstreamPr = prRecords.find(p => String(p.id) === String(prFinishesData.linked_phase) || String(p.linked_phase) === String(prFinishesData.linked_phase) || String(p.phase_id) === String(prFinishesData.linked_phase));

        let resolvedPrde = prRecords.find(w => String(w.linked_phase) === String(prFinishesData.linked_phase) || String(w.id) === String(prFinishesData.linked_phase));
        if (!resolvedPrde) {
          const { data: existingPrde } = await supabase
            .from('pump_room_data_entry')
            .select('*')
            .eq('linked_phase', prFinishesData.linked_phase)
            .maybeSingle();
          if (existingPrde) {
            resolvedPrde = existingPrde;
          } else {
            const { data: newPrde, error: prdeErr } = await supabase
              .from('pump_room_data_entry')
              .insert([{
                tender_log_id: resolvedTenderLogId,
                linked_phase: prFinishesData.linked_phase,
                ...buildErpAuditFields(false)
              }])
              .select('*')
              .single();
            if (prdeErr) throw new Error('Could not initialize Pump Room technical data: ' + prdeErr.message);
            resolvedPrde = newPrde;
          }
        }

        // Fetch existing BOQ breakdown items for this phase (scoped to PR Finishes items)
        const { data: rawBoqItems, error: fetchBoqErr } = await supabase
          .from('proposal_breakdown_items')
          .select('*')
          .eq('phase_id', prFinishesData.linked_phase);

        if (fetchBoqErr) {
          console.warn('Could not fetch existing BOQ items:', fetchBoqErr);
        }

        const existingBoqItems = (rawBoqItems || []).filter(i =>
          isFinishesBoqItem(i) && String(i.phase_component || '').toLowerCase().includes('pump')
        );

        const dropdownOptions = {
          items: itemsList,
          items_database: itemsList,
          civil_material_types: materialsList,
          phases,
          pump_room_data_entry: prRecords,
          proposal_data_entry: wfRecords,
          brands: brandsList
        };

        const formWithContext = calculatePumpRoomFinishes({
          ...prFinishesData,
          phase_id: prFinishesData.linked_phase,
          linked_phase: prFinishesData.linked_phase,
          tender_log_id: resolvedTenderLogId,
          linked_proposal: resolvedTenderLogId,
          proposal_id: resolvedTenderLogId
        }, upstreamPr || resolvedPrde, {
          proposal_data_entry: wfRecords,
          proposals
        });

        const calculatedForm = buildPumpRoomFinishesBoq(
          formWithContext,
          existingBoqItems,
          dropdownOptions,
          upstreamPr || resolvedPrde
        );

        // Check if a record already exists for this linked_phase
        let existingRecordId = prFinishesData.id;
        if (!existingRecordId) {
          const phaseTarget = resolvedPrde?.id || prFinishesData.linked_phase;
          if (phaseTarget) {
            const { data: foundList } = await supabase
              .from('proposal_finishes_pump_room')
              .select('id')
              .eq('linked_phase', phaseTarget)
              .limit(1);
            if (foundList && foundList.length > 0) existingRecordId = foundList[0].id;
          }
        }

        // Sanitize and save/update proposal_finishes_pump_room
        const payload = sanitizePayload({
          ...calculatedForm,
          linked_proposal: resolvedTenderLogId,
          linked_phase: resolvedPrde ? resolvedPrde.id : null,
          ...buildErpAuditFields(Boolean(existingRecordId))
        }, PR_FINISHES_COLUMNS);
        delete payload.proposal_breakdown_items;
        delete payload.items;

        delete payload.id;
        let savedRecordId = existingRecordId;

        if (existingRecordId) {
          const { error } = await supabase
            .from('proposal_finishes_pump_room')
            .update(payload)
            .eq('id', existingRecordId);
          if (error) throw error;
        } else {
          const { data: inserted, error } = await supabase
            .from('proposal_finishes_pump_room')
            .insert([payload])
            .select('id')
            .single();
          if (error) throw error;
          if (inserted?.id) savedRecordId = inserted.id;
        }

        // Synchronize auto-generated BOQ rows to proposal_breakdown_items (PR Finishes)
        if (Array.isArray(calculatedForm.proposal_breakdown_items)) {
          const generatedRows = calculatedForm.proposal_breakdown_items;
          const currentSpawners = new Set(
            generatedRows
              .filter(i => (i._isautogenerated || i._isAutoGenerated) && i._spawnerid)
              .map(i => i._spawnerid)
          );

          // Clean up auto-generated rows that were deleted (only finishes spawners)
          const rowsToDelete = (existingBoqItems || [])
            .filter(i => isFinishesBoqItem(i) && (i._isautogenerated || i._isAutoGenerated) && i._spawnerid && !currentSpawners.has(i._spawnerid))
            .map(i => i.id);

          if (rowsToDelete.length > 0) {
            const { error: delErr } = await supabase
              .from('proposal_breakdown_items')
              .delete()
              .in('id', rowsToDelete);
            if (delErr) console.warn('Error cleaning up pruned BOQ rows:', delErr);
          }

          // Format rows for upsert into proposal_breakdown_items
          const rowsToUpsert = generatedRows.map(row => {
            return formatBoqRowForUpsert(
              row,
              resolvedTenderLogId,
              prFinishesData.linked_phase,
              'Pump Room - Finishes',
              'Civil'
            );
          });

          if (rowsToUpsert.length > 0) {
            const { error: upsertErr } = await supabase
              .from('proposal_breakdown_items')
              .upsert(rowsToUpsert, { onConflict: 'id' });
            if (upsertErr) {
              console.error('Error saving PR Finishes BOQ breakdown items:', upsertErr);
              throw new Error('Pump Room Finishes saved, but failed to sync BOQ Breakdown: ' + upsertErr.message);
            }
          }
        }

        const prFinTotalCost = (calculatedForm.proposal_breakdown_items || []).reduce(
          (sum, r) => sum + (r?.activity_responsibility === 'Client' ? 0 : Number(r?.total_cost || 0)),
          0
        );
        const matchedPropPrF = proposals.find(p => String(p.id) === String(resolvedTenderLogId));
        recordErpAuditAndNotification({
          table_name: 'proposal_finishes_pump_room',
          record_id: String(savedRecordId || prFinishesData.linked_phase),
          erp_tender_id: resolvedTenderLogId ? String(resolvedTenderLogId) : null,
          proposal_code: matchedPropPrF?.proposal_number || null,
          action: existingRecordId ? 'UPDATE' : 'INSERT',
          new_data: {
            phase: matchedPhase?.phase_title || prFinishesData.linked_phase,
            boq_items_count: calculatedForm.proposal_breakdown_items?.length || 0,
            finishes_direct_cost_egp: Math.round(prFinTotalCost),
          },
          notification: {
            type: 'erp_civil_boq_synced',
            targetRoles: ['app_admin', 'tender_manager', 'civil_tender_engineer'],
            includeAssignedEngineers: true,
            title_en: `Pump Room Finishes BOQ Synced (${matchedPhase?.phase_title || 'Pump Room'})`,
            title_ar: `مزامنة مقايسة تشطيبات غرفة الطلمبات (${matchedPhase?.phase_title || 'غرفة الطلمبات'})`,
            message_en: `${calculatedForm.proposal_breakdown_items?.length || 0} Finishes BOQ items (${Math.round(prFinTotalCost).toLocaleString()} EGP direct cost) synchronized to Tender Log.`,
            message_ar: `تمت مزامنة ${calculatedForm.proposal_breakdown_items?.length || 0} بند تشطيبات (${Math.round(prFinTotalCost).toLocaleString()} ج.م تكلفة مباشرة) مع سجل المناقصات.`,
          },
        });
        void syncAllErpTendersAndCostsToTenderLog();

        setSaveMessage(`Pump Room Finishes Works & ${calculatedForm.proposal_breakdown_items?.length || 0} BOQ Breakdown Items successfully saved & synchronized!`);
        await loadAllData();
        setTimeout(() => {
          setIsFormModalOpen(false);
        }, 1000);
      }
    } catch (err) {
      console.error('Save error:', err);
      const detailedMsg = [err.message, err.details, err.hint].filter(Boolean).join(' | ');
      setErrorMessage(detailedMsg || 'Failed to save record.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Table Records
  const filteredWfStructRecords = useMemo(() => {
    if (!searchTableQuery.trim()) return wfStructRecords;
    const q = searchTableQuery.toLowerCase();
    return wfStructRecords.filter(r => {
      const ph = resolvePhaseForRecord(r, false);
      const prop = resolveProposalForRecord(r, ph);
      const titleStr = prop ? `${prop.proposal_number} ${prop.proposal_title}`.toLowerCase() : '';
      const phaseStr = ph ? ph.phase_title.toLowerCase() : '';
      return titleStr.includes(q) || phaseStr.includes(q);
    });
  }, [wfStructRecords, searchTableQuery, phases, proposals, wfRecords, prRecords]);

  const filteredPrFinishesRecords = useMemo(() => {
    if (!searchTableQuery.trim()) return prFinishesRecords;
    const q = searchTableQuery.toLowerCase();
    return prFinishesRecords.filter(r => {
      const ph = resolvePhaseForRecord(r, true);
      const prop = resolveProposalForRecord(r, ph);
      const titleStr = prop ? `${prop.proposal_number} ${prop.proposal_title}`.toLowerCase() : '';
      const phaseStr = ph ? ph.phase_title.toLowerCase() : '';
      return titleStr.includes(q) || phaseStr.includes(q);
    });
  }, [prFinishesRecords, searchTableQuery, phases, proposals, wfRecords, prRecords]);

  const filteredPrStructRecords = useMemo(() => {
    if (!searchTableQuery.trim()) return prStructRecords;
    const q = searchTableQuery.toLowerCase();
    return prStructRecords.filter(r => {
      const ph = resolvePhaseForRecord(r, true);
      const prop = resolveProposalForRecord(r, ph);
      const titleStr = prop ? `${prop.proposal_number} ${prop.proposal_title}`.toLowerCase() : '';
      const phaseStr = ph ? ph.phase_title.toLowerCase() : '';
      return titleStr.includes(q) || phaseStr.includes(q);
    });
  }, [prStructRecords, searchTableQuery, phases, proposals, wfRecords, prRecords]);

  const filteredWfFinishesRecords = useMemo(() => {
    if (!searchTableQuery.trim()) return wfFinishesRecords;
    const q = searchTableQuery.toLowerCase();
    return wfFinishesRecords.filter(r => {
      const ph = resolvePhaseForRecord(r, false);
      const prop = resolveProposalForRecord(r, ph);
      const titleStr = prop ? `${prop.proposal_number} ${prop.proposal_title}`.toLowerCase() : '';
      const phaseStr = ph ? ph.phase_title.toLowerCase() : '';
      return titleStr.includes(q) || phaseStr.includes(q);
    });
  }, [wfFinishesRecords, searchTableQuery, phases, proposals, wfRecords, prRecords]);

  const getRecordBoqMetrics = (r, phaseComponent, tabType = activeTab) => {
    if (!r) return { totalCost: 0, totalDays: 0, totalLaborers: 0 };
    
    const isPumpRoomTab = tabType === 'pr_structural' || tabType === 'pr_finishes';
    const isFinishesTab = tabType === 'wf_finishes' || tabType === 'pr_finishes';

    // Resolve canonical phase and proposal identifiers
    const rawPhaseId = r.linked_phase || r.phase_id;
    const resolvedPhaseObj = resolvePhaseForRecord(r, isPumpRoomTab);
    const resolvedPhaseId = resolvedPhaseObj?.id || rawPhaseId;
    const resolvedProposalObj = resolveProposalForRecord(r, resolvedPhaseObj);
    const tenderLogId = resolvedProposalObj?.id || r.linked_proposal || r.tender_log_id;

    // 1. Stored fields calculation
    let storedCost = 0;
    let storedDays = 0;
    let storedLaborers = 0;

    if (tabType === 'wf_structural') {
      storedCost = (Number(r.total_cost_pc) || 0) + (Number(r.rc_total_cost) || 0) + (Number(r.coffor_total_cost) || 0) + (Number(r.bituminous_wp_total_cost) || 0) + (Number(r.cementitious_wp_total_cost) || 0) + (Number(r.membrane_wp_total_cost) || 0);
      storedDays = (Number(r.days_to_complete_pc) || 0) + (Number(r.rc_no_of_days_to_complete_installation) || 0) + (Number(r.coffor_no_of_days_to_complete_installation) || 0) + (Number(r.bituminous_wp_no_of_days_to_complete_installation) || 0) + (Number(r.cementitious_wp_no_of_days_to_complete_installation) || 0) + (Number(r.membrane_wp_no_of_days_to_complete_installation) || 0);
      storedLaborers = (Number(r.plain_concrete_no_of_laborers) || 0) + (Number(r.rc_no_of_laborers) || 0) + (Number(r.coffor_no_of_laborers) || 0) + (Number(r.bituminous_wp_no_of_laborers) || 0) + (Number(r.cementitious_wp_no_of_laborers) || 0) + (Number(r.membrane_wp_no_of_laborers) || 0);
    } else if (tabType === 'pr_structural') {
      storedCost = (Number(r.total_cost_pc) || 0) + (Number(r.rc_total_cost) || 0) + (Number(r.coffor_total_cost) || 0) + (Number(r.bituminous_wp_total_cost) || 0) + (Number(r.cementitious_wp_total_cost) || 0);
      storedDays = (Number(r.days_to_complete_pc) || 0) + (Number(r.rc_no_of_days_to_complete_installation) || 0) + (Number(r.coffor_no_of_days_to_complete_installation) || 0) + (Number(r.bituminous_wp_no_of_days_to_complete_installation) || 0) + (Number(r.cementitious_wp_no_of_days_to_complete_installation) || 0);
      storedLaborers = (Number(r.plain_concrete_no_of_laborers) || 0) + (Number(r.rc_no_of_laborers) || 0) + (Number(r.coffor_no_of_laborers) || 0) + (Number(r.bituminous_wp_no_of_laborers) || 0) + (Number(r.cementitious_wp_no_of_laborers) || 0);
    } else if (tabType === 'wf_finishes') {
      storedCost = (Number(r.total_cost_ladder) || 0) + (Number(r.total_cost_stucco) || 0) + (Number(r.total_cost_total_liner) || Number(r.total_cost_liner) || 0) + (Number(r.total_cost_tiling) || 0) + (Number(r.total_cost_stone_floor) || 0);
      storedDays = (Number(r.days_to_complete_ladder) || 0) + (Number(r.days_to_complete_stucco) || 0) + (Number(r.days_to_complete_total_liner) || Number(r.days_to_complete_liner) || 0) + (Number(r.days_to_complete_tiling) || 0) + (Number(r.days_to_complete_stone_floor) || 0);
      storedLaborers = (Number(r.no_of_laborers_ladder) || 0) + (Number(r.no_of_laborers_stucco) || 0) + (Number(r.no_of_laborers_total_liner) || Number(r.no_of_laborers_liner) || 0) + (Number(r.no_of_laborers_tiling) || 0) + (Number(r.no_of_laborers_stone_floor) || 0);
    } else if (tabType === 'pr_finishes') {
      storedCost = (Number(r.total_cost_stucco) || 0) + (Number(r.total_cost_epoxy) || 0) + (Number(r.total_cost_tiling) || 0);
      storedDays = (Number(r.days_to_complete_stucco) || 0) + (Number(r.days_to_complete_epoxy) || 0) + (Number(r.days_to_complete_tiling) || 0);
      storedLaborers = (Number(r.no_of_laborers_stucco) || 0) + (Number(r.no_of_laborers_epoxy) || 0) + (Number(r.no_of_laborers_tiling) || 0);
    }

    // 2. Cross-reference with synchronized proposal_breakdown_items scoped to this exact tab
    if (civilBoqRecords && civilBoqRecords.length > 0) {
      const linked = civilBoqRecords.filter(b => {
        const matchPhase = String(b.phase_id) === String(resolvedPhaseId) || String(b.phase_id) === String(rawPhaseId);
        if (!matchPhase) return false;
        const matchTender = !tenderLogId || !b.tender_log_id || String(b.tender_log_id) === String(tenderLogId);
        if (!matchTender) return false;

        const bIsPump = String(b.phase_component || '').toLowerCase().includes('pump');
        const bIsFinishes = isFinishesBoqItem(b);

        if (isPumpRoomTab !== bIsPump) return false;
        if (isFinishesTab !== bIsFinishes) return false;
        return true;
      });

      if (linked.length > 0) {
        const boqCost = linked
          .filter(b => b.activity_responsibility !== 'Client')
          .reduce((sum, b) => sum + (Number(b.total_cost) || 0), 0);
        const boqDays = linked.reduce((max, b) => Math.max(max, Number(b.days_to_complete) || 0), 0);
        const boqLaborers = linked.reduce((sum, b) => sum + (Number(b.total_laborers_per_day) || Number(b.laborers_per_group) || 0), 0);

        return {
          totalCost: boqCost > 0 ? boqCost : storedCost,
          totalDays: storedDays > 0 ? storedDays : (boqDays > 0 ? boqDays : 1),
          totalLaborers: storedLaborers > 0 ? storedLaborers : (boqLaborers > 0 ? boqLaborers : 2)
        };
      }
    }

    return {
      totalCost: storedCost,
      totalDays: storedDays,
      totalLaborers: storedLaborers
    };
  };

  const activeTabKpis = useMemo(() => {
    let records = [];
    let phaseComponent = '';
    if (activeTab === 'wf_structural') {
      records = filteredWfStructRecords;
      phaseComponent = 'Water Feature';
    } else if (activeTab === 'pr_structural') {
      records = filteredPrStructRecords;
      phaseComponent = 'Pump Room';
    } else if (activeTab === 'wf_finishes') {
      records = filteredWfFinishesRecords;
      phaseComponent = 'Water Feature';
    } else if (activeTab === 'pr_finishes') {
      records = filteredPrFinishesRecords;
      phaseComponent = 'Pump Room';
    } else if (activeTab === 'civil_boq') {
      const totalCost = civilBoqRecords
        .filter(b => b.activity_responsibility !== 'Client')
        .reduce((sum, b) => sum + (Number(b.total_cost) || 0), 0);
      const totalDays = civilBoqRecords.reduce((max, b) => Math.max(max, Number(b.days_to_complete) || 0), 0);
      const totalLaborers = civilBoqRecords.reduce((sum, b) => sum + (Number(b.total_laborers_per_day) || Number(b.laborers_per_group) || 0), 0);
      return { totalCost, totalDays, totalLaborers, count: civilBoqRecords.length };
    }

    let totalCost = 0;
    let totalDays = 0;
    let totalLaborers = 0;

    for (const r of records) {
      const metrics = getRecordBoqMetrics(r, phaseComponent, activeTab);
      totalCost += metrics.totalCost;
      totalDays = Math.max(totalDays, metrics.totalDays);
      totalLaborers += metrics.totalLaborers;
    }

    return { totalCost, totalDays, totalLaborers, count: records.length };
  }, [activeTab, filteredWfStructRecords, filteredPrStructRecords, filteredWfFinishesRecords, filteredPrFinishesRecords, civilBoqRecords]);

  return (
    <div className="space-y-6 w-full">
      
      {/* ========================================================================= */}
      {/* HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
              <HardHat className="w-3.5 h-3.5" />
              <span>Civil Engineering Suite • Portal 3</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Civil Structural and Finishes Works
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed font-medium">
              Excavation, plain concrete (PC), reinforced concrete (RC), coffor formwork, bitumen & cementitious waterproofing, plastering, tiles, and finishes engineering suite.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenDatabaseTable(
                activeTab === 'civil_boq'
                  ? 'proposal_breakdown_items'
                  : activeTab === 'pr_finishes'
                  ? 'pump_room_finishes_works'
                  : activeTab === 'wf_finishes'
                  ? 'water_feature_finishes_works'
                  : activeTab === 'pr_structural'
                  ? 'pump_room_structural_works'
                  : 'water_feature_structural_works'
              )}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition cursor-pointer backdrop-blur-sm"
            >
              <Database className="w-3.5 h-3.5 text-amber-300" />
              <span>Inspect Supabase</span>
            </button>

            {activeTab !== 'civil_boq' && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>+ Add New Record</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVIGATION TABS (4 CIVIL & FINISHES MODULES) */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1.5 w-full">
        <button
          onClick={() => setActiveTab('wf_structural')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'wf_structural'
              ? 'bg-white dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 shadow-sm border border-slate-200 dark:border-amber-500/40 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <HardHat className="w-4 h-4 text-amber-600" />
          <span>1. WF Structural</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200">
            {isLoading ? '...' : wfStructRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pr_structural')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'pr_structural'
              ? 'bg-white dark:bg-teal-500/20 text-teal-900 dark:text-teal-300 shadow-sm border border-slate-200 dark:border-teal-500/40 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-teal-600" />
          <span>2. PR Structural</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {isLoading ? '...' : prStructRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wf_finishes')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'wf_finishes'
              ? 'bg-white dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-cyan-500/40 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Palette className="w-4 h-4 text-cyan-600" />
          <span>3. WF Finishes</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-300 border border-cyan-200">
            {isLoading ? '...' : wfFinishesRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pr_finishes')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'pr_finishes'
              ? 'bg-white dark:bg-indigo-500/20 text-indigo-900 dark:text-indigo-300 shadow-sm border border-slate-200 dark:border-indigo-500/40 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>4. PR Finishes</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 border border-indigo-200">
            {isLoading ? '...' : prFinishesRecords.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('civil_boq')}
          className={`flex-1 min-w-[170px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'civil_boq'
              ? 'bg-white dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-emerald-500/40 font-black'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>5. Civil Master BOQ</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-200">
            {isLoading ? '...' : civilBoqRecords.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUMMARY KPI RIBBON */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total {activeTab === 'pr_finishes' ? 'PR Finishes' : activeTab === 'wf_finishes' ? 'WF Finishes' : activeTab === 'pr_structural' ? 'PR Structural' : activeTab === 'civil_boq' ? 'Civil BOQ' : 'WF Structural'} Cost
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
              {Number(activeTabKpis.totalCost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600">
            <Coins className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Execution Days
            </span>
            <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1 block">
              {Number(activeTabKpis.totalDays || 0)} Days
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Labor Crew Force
            </span>
            <span className="text-xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1 block">
              {Number(activeTabKpis.totalLaborers || 0)} Laborers
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEARCH BAR & RECORD COUNT RIBBON */}
      {/* ========================================================================= */}
      {activeTab !== 'civil_boq' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search proposals or phases..."
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span>Showing <strong>{isLoading ? '...' : (activeTab === 'pr_structural' ? filteredPrStructRecords.length : activeTab === 'wf_finishes' ? filteredWfFinishesRecords.length : activeTab === 'pr_finishes' ? filteredPrFinishesRecords.length : filteredWfStructRecords.length)}</strong> configured scopes</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: WATER FEATURE STRUCTURAL TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'wf_structural' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden w-full">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>Water Feature Structural Works Table (water_feature_structural_works)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Excavation, plain concrete (PC), reinforced concrete (RC), formwork & waterproofing master quantities.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800 font-mono">
              {isLoading ? 'Loading...' : `${wfStructRecords.length} Records`}
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
                  <th className="p-3.5 font-bold text-center">Execution Duration</th>
                  <th className="p-3.5 font-bold text-center">Labor Crew Force</th>
                  <th className="p-3.5 font-bold text-right pr-6">Total Cost</th>
                  <th className="p-3.5 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={n} className="animate-pulse border-b border-slate-100 dark:border-slate-800/40">
                      <td className="p-3.5 text-center">
                        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-16 bg-amber-200/80 dark:bg-amber-900/40 rounded" />
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-20 bg-cyan-100/80 dark:bg-cyan-950/60 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-right pr-6">
                        <div className="h-5 w-24 bg-emerald-100/80 dark:bg-emerald-950/60 rounded ml-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredWfStructRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      No structural works records found. Click <strong>"+ Add New Record"</strong> to configure civil structural & finishes works.
                    </td>
                  </tr>
                ) : (
                  filteredWfStructRecords.map((r, idx) => {
                    const ph = resolvePhaseForRecord(r, false);
                    const prop = resolveProposalForRecord(r, ph);
                    
                    // Upstream water feature data entry
                    const upstreamEntry = wfRecords.find(w => w.id === (r.linked_phase || r.phase_id) || w.phase_id === ph?.id || w.id === ph?.id);
                    const matchedType = featureTypesList.find(t => t.id === upstreamEntry?.water_feature_type);
                    const wfTypeLabel = matchedType?.title || matchedType?.name || (upstreamEntry?.water_feature_type && !upstreamEntry.water_feature_type.includes('-') ? upstreamEntry.water_feature_type : 'Overflow');

                    const metrics = getRecordBoqMetrics(r, 'Water Feature', 'wf_structural');

                    return (
                      <tr
                        key={r.id || idx}
                        onClick={() => handleEditWfStructRecord(r)}
                        className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition cursor-pointer group"
                      >
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          <span className="text-amber-800 dark:text-amber-300 font-mono mr-1.5 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200">
                            {prop?.proposal_number || 'SP.2026'}:
                          </span>
                          <span>{prop?.proposal_title || prop?.proposal_full_title || 'Untitled'}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {ph?.phase_title || 'Phase Scope'}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-bold text-[11px]">
                            {wfTypeLabel}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 font-mono font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs">
                            {metrics.totalDays > 0 ? `${metrics.totalDays} Days` : '2 Days'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 font-mono font-bold text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs">
                            {metrics.totalLaborers > 0 ? `${metrics.totalLaborers} Laborers` : '3 Laborers'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-6 font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm whitespace-nowrap">
                          {metrics.totalCost > 0 
                            ? Number(metrics.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EGP'
                            : '0.00 EGP'}
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditWfStructRecord(r)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-600 dark:text-slate-300 hover:text-amber-900 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => promptDeleteRecord('wf_struct', r, e)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PUMP ROOM STRUCTURAL TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'pr_structural' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden w-full">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Pump Room Structural Works Table (pump_room_structural_works)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Excavation, PC footing, RC slabs & walls, coffor formwork, bitumen & cementitious waterproofing for pump rooms & balance tanks.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/80 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-800 font-mono">
                {isLoading ? 'Loading...' : `${prStructRecords.length} Records`}
              </span>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
              <button
                onClick={() => onOpenDatabaseTable('pump_room_structural_works')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-teal-600" />
                <span>Inspect Database</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 w-10 text-center text-slate-400">#</th>
                  <th className="p-3.5 font-bold">Proposal Code & Title</th>
                  <th className="p-3.5 font-bold">Phase Scope</th>
                  <th className="p-3.5 font-bold text-center">Pump Room Scope</th>
                  <th className="p-3.5 font-bold text-center">Execution Duration</th>
                  <th className="p-3.5 font-bold text-center">Labor Crew Force</th>
                  <th className="p-3.5 font-bold text-right pr-6">Total Cost</th>
                  <th className="p-3.5 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={n} className="animate-pulse border-b border-slate-100 dark:border-slate-800/40">
                      <td className="p-3.5 text-center">
                        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-16 bg-teal-200/80 dark:bg-teal-900/40 rounded" />
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-24 bg-teal-100/80 dark:bg-teal-950/60 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-right pr-6">
                        <div className="h-5 w-24 bg-emerald-100/80 dark:bg-emerald-950/60 rounded ml-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredPrStructRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      No pump room structural records found. Click <strong>"+ Add Record"</strong> to configure civil structural & finishes works.
                    </td>
                  </tr>
                ) : (
                  filteredPrStructRecords.map((r, idx) => {
                    const matchedPhase = resolvePhaseForRecord(r, true);
                    const matchedProp = resolveProposalForRecord(r, matchedPhase);
                    const matchedPrEntry = prRecords.find(p => p.id === (r.linked_phase || r.phase_id) || p.linked_phase === matchedPhase?.id || p.id === matchedPhase?.id);

                    const prLen = matchedPrEntry?.pump_room_length_m || 10;
                    const prWid = matchedPrEntry?.pump_room_width_m || 5;
                    const prHgt = matchedPrEntry?.pump_room_height_m || 3;

                    const metrics = getRecordBoqMetrics(r, 'Pump Room', 'pr_structural');

                    return (
                      <tr 
                        key={r.id || idx}
                        onClick={() => handleEditPrStructRecord(r)}
                        className="hover:bg-teal-50/50 dark:hover:bg-teal-950/20 transition cursor-pointer group"
                      >
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          <span className="text-teal-800 dark:text-teal-300 font-mono mr-1.5 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200">
                            {matchedProp?.proposal_number || 'SP.2026'}:
                          </span>
                          <span>{matchedProp?.proposal_title || matchedProp?.proposal_full_title || 'Untitled Proposal'}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {matchedPhase?.phase_title || 'Pump Room Phase'}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-bold text-[11px]">
                            PR: {prLen} × {prWid} × {prHgt} m
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 font-mono font-bold text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs">
                            {metrics.totalDays > 0 ? `${metrics.totalDays} Days` : '2 Days'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 font-mono font-bold text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs">
                            {metrics.totalLaborers > 0 ? `${metrics.totalLaborers} Laborers` : '3 Laborers'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-6 font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm whitespace-nowrap">
                          {metrics.totalCost > 0 
                            ? Number(metrics.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EGP'
                            : '0.00 EGP'
                          }
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditPrStructRecord(r)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 text-slate-600 dark:text-slate-300 hover:text-teal-900 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => promptDeleteRecord('pr_struct', r, e)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WATER FEATURE FINISHES TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'wf_finishes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden w-full">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-600" />
                <span>Water Feature Finishes Works Table (water_feature_finishes_works)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Glass mosaic, ceramic pool tiles, smooth/anti-slip liners, coping stone, plastering stucco & stainless steel ladders.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-cyan-600 bg-cyan-50 dark:bg-cyan-950/80 px-3 py-1 rounded-xl border border-cyan-200 dark:border-cyan-800 font-mono">
                {isLoading ? 'Loading...' : `${wfFinishesRecords.length} Records`}
              </span>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 w-10 text-center text-slate-400">#</th>
                  <th className="p-3.5 font-bold">Proposal Code & Title</th>
                  <th className="p-3.5 font-bold">Phase Scope</th>
                  <th className="p-3.5 font-bold text-center">Finishes Scope</th>
                  <th className="p-3.5 font-bold text-center">Execution Duration</th>
                  <th className="p-3.5 font-bold text-center">Labor Crew Force</th>
                  <th className="p-3.5 font-bold text-right pr-6">Total Cost</th>
                  <th className="p-3.5 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={n} className="animate-pulse border-b border-slate-100 dark:border-slate-800/40">
                      <td className="p-3.5 text-center">
                        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-16 bg-cyan-200/80 dark:bg-cyan-900/40 rounded" />
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-24 bg-cyan-100/80 dark:bg-cyan-950/60 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-right pr-6">
                        <div className="h-5 w-24 bg-emerald-100/80 dark:bg-emerald-950/60 rounded ml-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredWfFinishesRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      No water feature finishes records configured yet. Click <strong>"+ Add Record"</strong> to create your first scope!
                    </td>
                  </tr>
                ) : (
                  filteredWfFinishesRecords.map((r, idx) => {
                    const phase = resolvePhaseForRecord(r, false);
                    const prop = resolveProposalForRecord(r, phase);
                    const upstream = wfRecords.find(w => w.id === (r.linked_phase || r.phase_id) || w.phase_id === phase?.id || w.id === phase?.id);
                    
                    const metrics = getRecordBoqMetrics(r, 'Water Feature', 'wf_finishes');

                    return (
                      <tr 
                        key={r.id || idx} 
                        onClick={() => handleEditWfFinishesRecord(r)}
                        className="hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition cursor-pointer group"
                      >
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          <span className="text-cyan-800 dark:text-cyan-300 font-mono mr-1.5 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-200">
                            {prop?.proposal_number || 'SP.2026'}:
                          </span>
                          <span>{prop?.proposal_title || prop?.proposal_full_title || 'Untitled Proposal'}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {phase?.phase_title || 'Finishes Scope'}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-bold text-[11px]">
                            Area: {Number(upstream?.water_feature_area_m2 || 0).toFixed(1)} m²
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 font-mono font-bold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs">
                            {metrics.totalDays > 0 ? `${metrics.totalDays} Days` : '3 Days'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 font-mono font-bold text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs">
                            {metrics.totalLaborers > 0 ? `${metrics.totalLaborers} Laborers` : '4 Laborers'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-6 font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm whitespace-nowrap">
                          {metrics.totalCost > 0 
                            ? Number(metrics.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EGP'
                            : '0.00 EGP'
                          }
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditWfFinishesRecord(r)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-100 text-slate-600 dark:text-slate-300 hover:text-cyan-900 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => promptDeleteRecord('wf_finishes', r, e)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PUMP ROOM FINISHES TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'pr_finishes' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden w-full">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-indigo-600" />
                <span>Pump Room Finishes Works Table (pump_room_finishes_works)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Internal 3cm stucco plastering, protective epoxy paintings, and pump room & balance tank tiling.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800 font-mono">
                {isLoading ? 'Loading...' : `${prFinishesRecords.length} Records`}
              </span>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 w-10 text-center text-slate-400">#</th>
                  <th className="p-3.5 font-bold">Proposal Code & Title</th>
                  <th className="p-3.5 font-bold">Phase Scope</th>
                  <th className="p-3.5 font-bold text-center">Pump Room Finishes</th>
                  <th className="p-3.5 font-bold text-center">Execution Duration</th>
                  <th className="p-3.5 font-bold text-center">Labor Crew Force</th>
                  <th className="p-3.5 font-bold text-right pr-6">Total Cost</th>
                  <th className="p-3.5 font-bold text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {isLoading ? (
                  [1, 2, 3].map((n) => (
                    <tr key={n} className="animate-pulse border-b border-slate-100 dark:border-slate-800/40">
                      <td className="p-3.5 text-center">
                        <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-16 bg-indigo-200/80 dark:bg-indigo-900/40 rounded" />
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-24 bg-indigo-100/80 dark:bg-indigo-950/60 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                      </td>
                      <td className="p-3.5 text-right pr-6">
                        <div className="h-5 w-24 bg-emerald-100/80 dark:bg-emerald-950/60 rounded ml-auto" />
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredPrFinishesRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      No pump room finishes records configured yet. Click <strong>"+ Add Record"</strong> to create your first scope!
                    </td>
                  </tr>
                ) : (
                  filteredPrFinishesRecords.map((r, idx) => {
                    const phase = resolvePhaseForRecord(r, true);
                    const prop = resolveProposalForRecord(r, phase);
                    const upstream = prRecords.find(w => w.id === (r.linked_phase || r.phase_id) || w.linked_phase === phase?.id || w.id === phase?.id);
                    
                    const metrics = getRecordBoqMetrics(r, 'Pump Room', 'pr_finishes');

                    return (
                      <tr 
                        key={r.id || idx} 
                        onClick={() => handleEditPrFinishesRecord(r)}
                        className="hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition cursor-pointer group"
                      >
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                          <span className="text-indigo-800 dark:text-indigo-300 font-mono mr-1.5 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200">
                            {prop?.proposal_number || 'SP.2026'}:
                          </span>
                          <span>{prop?.proposal_title || prop?.proposal_full_title || 'Untitled Proposal'}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {phase?.phase_title || 'Pump Room Finishes Scope'}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-[11px]">
                            PR: {Number(upstream?.pump_room_area_m2 || 50).toFixed(1)} m² • BT: {Number(upstream?.balance_tank_area_m2 || 15).toFixed(1)} m²
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 font-mono font-bold text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs">
                            {metrics.totalDays > 0 ? `${metrics.totalDays} Days` : '3 Days'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 font-mono font-bold text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 text-xs">
                            {metrics.totalLaborers > 0 ? `${metrics.totalLaborers} Laborers` : '4 Laborers'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right pr-6 font-mono font-black text-emerald-800 dark:text-emerald-300 text-sm whitespace-nowrap">
                          {metrics.totalCost > 0 
                            ? Number(metrics.totalCost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EGP'
                            : '0.00 EGP'
                          }
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditPrFinishesRecord(r)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 text-slate-600 dark:text-slate-300 hover:text-indigo-900 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => promptDeleteRecord('pr_finishes', r, e)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CIVIL MASTER BOQ TABLE */}
      {/* ========================================================================= */}
      {activeTab === 'civil_boq' && (
        <CivilBoqTableTab
          boqRecords={civilBoqRecords}
          proposals={proposals}
          phases={phases}
          itemsList={itemsList}
          isLoading={isLoading}
          onRefresh={loadAllData}
        />
      )}

      {/* ========================================================================= */}
      {/* EDIT / CREATE MODAL DIALOG */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-100 dark:bg-slate-950 w-full max-w-[96vw] 2xl:max-w-7xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh] my-auto">
            
            {/* Modal Header */}
            <div className={`p-5 text-white flex items-center justify-between border-b flex-shrink-0 ${
              activeTab === 'pr_finishes'
                ? 'bg-gradient-to-r from-indigo-950 via-indigo-900 to-slate-900 border-indigo-800'
                : activeTab === 'wf_finishes'
                ? 'bg-gradient-to-r from-cyan-950 via-cyan-900 to-slate-900 border-cyan-800'
                : activeTab === 'pr_structural'
                ? 'bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 border-teal-800'
                : 'bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 border-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  activeTab === 'pr_finishes'
                    ? 'bg-indigo-500/20 border-indigo-400/30 text-indigo-300'
                    : activeTab === 'wf_finishes'
                    ? 'bg-cyan-500/20 border-cyan-400/30 text-cyan-300'
                    : activeTab === 'pr_structural'
                    ? 'bg-teal-500/20 border-teal-400/30 text-teal-300'
                    : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
                }`}>
                  {activeTab === 'pr_finishes' ? <Paintbrush className="w-5 h-5" /> : activeTab === 'wf_finishes' ? <Palette className="w-5 h-5" /> : activeTab === 'pr_structural' ? <Layers className="w-5 h-5" /> : <HardHat className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight">
                    {activeTab === 'pr_finishes'
                      ? (prFinishesData.id ? 'Edit Pump Room Finishes Works' : 'New Pump Room Finishes Works Entry')
                      : activeTab === 'wf_finishes'
                      ? (wfFinishesData.id ? 'Edit Water Feature Finishes Works' : 'New Water Feature Finishes Works Entry')
                      : activeTab === 'pr_structural'
                      ? (prStructData.id ? 'Edit Pump Room Structural Works' : 'New Pump Room Structural Works Entry')
                      : (wfStructData.id ? 'Edit Water Feature Structural Works' : 'New Water Feature Structural Works Entry')}
                  </h2>
                  <p className="text-[11px] text-amber-200/80 font-medium">
                    {activeTab === 'pr_finishes'
                      ? 'Table: pump_room_finishes_works • 3cm stucco plastering, epoxy coatings, PR & BT tiling'
                      : activeTab === 'wf_finishes'
                      ? 'Table: water_feature_finishes_works • Tiles, mosaic, smooth/anti-slip liners, coping stone & stucco'
                      : activeTab === 'pr_structural'
                      ? 'Table: pump_room_structural_works • Inherits room geometry from pump_room_data_entry'
                      : 'Table: water_feature_structural_works • Inherits basin geometry from proposal_data_entry'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
              {errorMessage && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300 font-bold">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {saveMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {activeTab === 'pr_finishes' ? (
                <PumpRoomFinishesForm
                  formData={prFinishesData}
                  onChange={setPrFinishesData}
                  proposals={proposals}
                  phases={phases}
                  pumpRoomPhases={pumpRoomPhases}
                  pumpRoomEntries={prRecords}
                  proposalEntries={wfRecords}
                  clients={clientsList}
                  regions={regionsList}
                  dropdownContext={{
                    items: itemsList,
                    items_database: itemsList,
                    civil_material_types: materialsList,
                    phases,
                    brands: brandsList
                  }}
                  existingBoqItems={[]}
                />
              ) : activeTab === 'wf_finishes' ? (
                <WaterFeatureFinishesForm
                  formData={wfFinishesData}
                  onChange={setWfFinishesData}
                  proposals={proposals}
                  phases={phases}
                  wfDataEntries={wfRecords}
                  categories={categoriesList}
                  featureTypes={featureTypesList}
                  materials={materialsList}
                  brands={brandsList}
                  clients={clientsList}
                  regions={regionsList}
                  items={itemsList}
                  itemCategories={itemCategoriesList}
                  finishesTypes={finishesTypeList}
                  finishesCategories={finishesCategoryList}
                />
              ) : activeTab === 'pr_structural' ? (
                <PumpRoomStructuralForm
                  formData={prStructData}
                  onChange={setPrStructData}
                  proposals={proposals}
                  phases={phases}
                  prDataEntries={prRecords}
                  categories={categoriesList}
                  featureTypes={featureTypesList}
                  materials={materialsList}
                  brands={brandsList}
                  clients={clientsList}
                  regions={regionsList}
                  items={itemsList}
                  itemCategories={itemCategoriesList}
                />
              ) : (
                <WaterFeatureStructuralForm
                  formData={wfStructData}
                  onChange={setWfStructData}
                  proposals={proposals}
                  phases={phases}
                  wfDataEntries={wfRecords}
                  categories={categoriesList}
                  featureTypes={featureTypesList}
                  materials={materialsList}
                  brands={brandsList}
                  clients={clientsList}
                  regions={regionsList}
                  items={itemsList}
                  itemCategories={itemCategoriesList}
                />
              )}

              {/* Modal Action Bar */}
              <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-6 py-2.5 font-black text-xs rounded-xl shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50 ${
                    activeTab === 'pr_finishes'
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-indigo-950/40'
                      : activeTab === 'wf_finishes'
                      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-slate-950 shadow-cyan-950/40'
                      : activeTab === 'pr_structural'
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-slate-950 shadow-teal-950/40'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-950/40'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSaving 
                      ? 'Saving to Database...' 
                      : (activeTab === 'pr_finishes' ? 'Save Pump Room Finishes Works' : activeTab === 'wf_finishes' ? 'Save Water Feature Finishes Works' : activeTab === 'pr_structural' ? 'Save Pump Room Structural Works' : 'Save Water Feature Structural Works')}
                  </span>
                </button>
              </div>
            </form>

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
                onClick={() => setDeleteModal({ isOpen: false, id: null, type: '', title: '', subtitle: '', isDeleting: false })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteModal}
                disabled={deleteModal.isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteModal.isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


