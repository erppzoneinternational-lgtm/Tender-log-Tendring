import React, { useState, useEffect, useMemo } from 'react';
import { 
  Waves, 
  Cpu, 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Table as TableIcon,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  buildErpAuditFields,
  getActiveErpTenderContext,
  recordErpAuditAndNotification,
  syncAllErpTendersAndCostsToTenderLog,
} from '../lib/erpBridge';
import WaterFeatureForm from './WaterFeatureForm';
import PumpRoomForm from './PumpRoomForm';
import WaterFeatureStructuralForm from './WaterFeatureStructuralForm';
import { HardHat } from 'lucide-react';

export default function WaterFeaturePortal({ onOpenDatabaseTable }) {
  const [activeTab, setActiveTab] = useState('water_feature'); // 'water_feature' | 'pump_room'
  
  // Lookups data
  const [proposals, setProposals] = useState([]);
  const [phases, setPhases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featureTypes, setFeatureTypes] = useState([]);
  const [finishesCategoryList, setFinishesCategoryList] = useState([]);
  
  // Table Data State
  const [wfRecords, setWfRecords] = useState([]);
  const [prRecords, setPrRecords] = useState([]);
  const [searchTableQuery, setSearchTableQuery] = useState('');
  
  // Modal / Drawer State for Form
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Default states
      const defaultWfData = {
    id: null,
    tender_log_id: '',
    phase_id: '',
    water_feature_category: '',
    water_feature_type: '',
    swimming_pool_shape: '',
    swimming_pool_finishes_type: '',
    pool_length_m: '',
    pool_width_m: '',
    water_shallow_height_m: '',
    water_deep_height_m: '',
    avg_height_m: '',
    water_feature_area_m2: '',
    water_feature_perimeter_m: '',
    walls_ground_base_width_m: '',
    water_feature_volume_m3: '',
    water_feature_usage: '',
    hours_of_water_filtration_h: '',
    accommodations_required: 'No',
    beach_included: 'No',
    beach_length_m: '',
    beach_width_m: '',
    beach_area_m2: '',
    internal_external_walls_deep_part: 'No',
    outer_walls_height_deep_part_m: '',
    external_walls_length_deep_part_m: '',
    internal_walls_height_deep_part_m: '',
    internal_walls_length_deep_part_m: '',
    total_wall_length_deep_part_m: '',
    chaise_lounges_included: 'No',
    length_of_chaise_lounges_m: '',
    width_of_chaise_lounges_m: '',
    chaise_lounges_area_m2: '',
    love_seats_included: 'No',
    length_of_love_seats_m: '',
    width_of_love_seats_m: '',
    love_seats_area_m2: '',
    island_included: 'No',
    island_01_perimeter_m: '',
    island_01_area_m2: '',
    island_01_height_m: '',
    island_02_perimeter_m: '',
    island_02_area_m2: '',
    island_02_height_m: '',
    island_03_perimeter_m: '',
    island_03_area_m2: '',
    island_03_height_m: '',
    concrete_stair_steps_included: 'No',
    type_of_concrete_stairs: '',
    lengths_of_concrete_stairs: '',
    height_of_concrete_stairs_m: ''
  };

  const defaultPrData = {
    id: null,
    tender_log_id: '',
    linked_phase: '',
    pump_room_length_m: '',
    pump_room_width_m: '',
    pump_room_height_m: '',
    pump_room_area_m2: '',
    pump_room_perimeter_m: '',
    sumpit_area_m2: '',
    sumpit_perimeter_m: '',
    sumpit_height_m: '',
    balance_tank_length_m: '',
    balance_tank_width_m: '',
    balance_tank_height_m: '',
    balance_tank_area_m2: '',
    balance_tank_perimeter_m: '',
    balance_tank_volume_m3: '',
    accommodations_required: 'No'
  };

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
    excavation_footing_m: '',
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
    concrete_forming_type: 'Wood Shuttering',
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
  const [wfStructRecords, setWfStructRecords] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [regionsList, setRegionsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [wfData, setWfData] = useState(defaultWfData);
  const [prData, setPrData] = useState(defaultPrData);

  // Load All Data from Supabase
  const loadAllData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [
        { data: props },
        { data: phs },
        { data: cats },
        { data: typs },
        { data: fin },
        { data: wfList },
        { data: prList },
        { data: structList },
        { data: clList },
        { data: regList },
        { data: brList },
        { data: matList }
      ] = await Promise.all([
        supabase.from('tender_log').select('id, proposal_number, proposal_title, proposal_full_title').order('created_at', { ascending: false }),
        supabase.from('phases').select('id, tender_log_id, phase_title, phase_full_title, component_type'),
        supabase.from('water_feature_categories').select('id, name'),
        supabase.from('water_feature_types').select('id, name, category_id'),
        supabase.from('finishes_category').select('id, category_name'),
        supabase.from('proposal_data_entry').select('*').order('created_at', { ascending: false }),
        supabase.from('pump_room_data_entry').select('*').order('created_at', { ascending: false }),
        supabase.from('water_feature_structural_works').select('*').order('created_at', { ascending: false }),
        supabase.from('clients').select('id, title'),
        supabase.from('regions').select('id, title'),
        supabase.from('brands').select('id, title'),
        supabase.from('civil_material_types').select('*')
      ]);

      setProposals(props || []);
      setPhases(phs || []);
      setCategories(cats || []);
      setFeatureTypes(typs || []);
      setFinishesCategoryList(fin || []);
      setWfRecords(wfList || []);
      setPrRecords(prList || []);
      setWfStructRecords(structList || []);
      setClientsList(clList || []);
      setRegionsList(regList || []);
      setBrandsList(brList || []);
      setMaterialsList(matList || []);

      // If an active tender was selected from PZ.Tender Log, pre-select it in Water Feature & Pump Room forms
      const activeCtx = getActiveErpTenderContext();
      if (activeCtx && props && props.length > 0) {
        const matchedProp = props.find(
          p =>
            String(p.id) === String(activeCtx.erpTenderId) ||
            String(p.proposal_number || '').toLowerCase() === String(activeCtx.proposalCode || '').toLowerCase()
        );
        if (matchedProp) {
          const propPhases = (phs || []).filter(ph => String(ph.tender_log_id) === String(matchedProp.id));
          const wfPh = propPhases.find(ph => !String(ph.phase_title || '').toLowerCase().includes('pump')) || propPhases[0];
          const prPh = propPhases.find(ph => String(ph.phase_title || '').toLowerCase().includes('pump')) || propPhases[0];
          setWfData(prev => ({
            ...prev,
            tender_log_id: prev.tender_log_id || matchedProp.id,
            phase_id: prev.phase_id || (wfPh ? wfPh.id : '')
          }));
          setPrData(prev => ({
            ...prev,
            tender_log_id: prev.tender_log_id || matchedProp.id,
            linked_phase: prev.linked_phase || (prPh ? prPh.id : '')
          }));
        }
      }
    } catch (e) {
      console.error('Error loading data:', e);
      setErrorMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter child phases
  const waterFeaturePhases = useMemo(() => {
    if (!wfData.tender_log_id) return [];
    const filtered = phases.filter(p => 
      p.tender_log_id === wfData.tender_log_id && 
      (p.component_type === 'Water Feature' || p.component_type === 'Swimming Pool' || !p.component_type || (p.phase_title && (p.phase_title.toLowerCase().includes('pool') || p.phase_title.toLowerCase().includes('water') || p.phase_title.toLowerCase().includes('lagoon'))))
    );
    // If no specific water feature phase found, return all phases for that proposal
    return filtered.length > 0 ? filtered : phases.filter(p => p.tender_log_id === wfData.tender_log_id);
  }, [phases, wfData.tender_log_id]);

  const pumpRoomPhases = useMemo(() => {
    if (!prData.tender_log_id) return [];
    const filtered = phases.filter(p => 
      p.tender_log_id === prData.tender_log_id && 
      (p.component_type === 'Pump Room' || !p.component_type || (p.phase_title && p.phase_title.toLowerCase().includes('pump')))
    );
    return filtered.length > 0 ? filtered : phases.filter(p => p.tender_log_id === prData.tender_log_id);
  }, [phases, prData.tender_log_id]);


  // Helper resolvers for UUID -> Clean Name
  const getCategoryName = (val) => {
    if (!val) return 'Swimming Pool';
    const found = categories.find(c => c.id === val || c.name.toLowerCase() === String(val).toLowerCase());
    return found ? found.name : val;
  };

  const getTypeName = (val) => {
    if (!val) return 'Overflow';
    const found = featureTypes.find(t => t.id === val || t.name.toLowerCase() === String(val).toLowerCase());
    return found ? found.name : val;
  };

  // Client search filter on table
  const filteredWfRecords = useMemo(() => {
    if (!searchTableQuery) return wfRecords;
    const q = searchTableQuery.toLowerCase();
    return wfRecords.filter(r => {
      const prop = proposals.find(p => p.id === r.tender_log_id);
      const ph = phases.find(p => p.id === r.phase_id);
      return (
        (prop?.proposal_title || '').toLowerCase().includes(q) ||
        (prop?.proposal_number || '').toLowerCase().includes(q) ||
        (ph?.phase_title || '').toLowerCase().includes(q) ||
        (r.water_feature_category || '').toLowerCase().includes(q) ||
        (r.water_feature_type || '').toLowerCase().includes(q)
      );
    });
  }, [wfRecords, searchTableQuery, proposals, phases]);

  const filteredPrRecords = useMemo(() => {
    if (!searchTableQuery) return prRecords;
    const q = searchTableQuery.toLowerCase();
    return prRecords.filter(r => {
      const prop = proposals.find(p => p.id === r.tender_log_id);
      const ph = phases.find(p => p.id === r.linked_phase);
      return (
        (prop?.proposal_title || '').toLowerCase().includes(q) ||
        (prop?.proposal_number || '').toLowerCase().includes(q) ||
        (ph?.phase_title || '').toLowerCase().includes(q)
      );
    });
  }, [prRecords, searchTableQuery, proposals, phases]);

  // Open modal to add new record
  const handleAddNew = () => {
    if (activeTab === 'water_feature') {
      setWfData({ ...defaultWfData });
    } else if (activeTab === 'pump_room') {
      setPrData({ ...defaultPrData });
    } else {
      setWfStructData({ ...defaultWfStructData });
    }
    setIsFormModalOpen(true);
  };

  // Open modal to edit existing record
  const handleEditWfRecord = (record) => {
    // Normalize UUID category/type into human names so form controls bind properly
    const normalizedCat = getCategoryName(record.water_feature_category);
    const normalizedTyp = getTypeName(record.water_feature_type);

    setWfData({
      ...defaultWfData,
      ...record,
      water_feature_category: normalizedCat,
      water_feature_type: normalizedTyp
    });
    setIsFormModalOpen(true);
  };

  const handleEditPrRecord = (record) => {
    setPrData({
      ...defaultPrData,
      ...record
    });
    setIsFormModalOpen(true);
  };

  const handleEditWfStructRecord = (record) => {
    setWfStructData({
      ...defaultWfStructData,
      ...record
    });
    setIsFormModalOpen(true);
  };

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    type: '', // 'wf' | 'pr'
    title: '',
    subtitle: '',
    isDeleting: false
  });

  const promptDeleteWf = (record, e) => {
    if (e) e.stopPropagation();
    const ph = phases.find(p => p.id === record.phase_id);
    setDeleteModal({
      isOpen: true,
      id: record.id,
      type: 'wf',
      title: `Delete Water Feature Record?`,
      subtitle: `Are you sure you want to delete the technical data entry record for "${ph?.phase_title || 'this water feature'}"?`,
      isDeleting: false
    });
  };

  const promptDeletePr = (record, e) => {
    if (e) e.stopPropagation();
    const ph = phases.find(p => p.id === record.linked_phase || p.id === record.phase_id);
    setDeleteModal({
      isOpen: true,
      id: record.id,
      type: 'pr',
      title: `Delete Pump Room Record?`,
      subtitle: `Are you sure you want to delete the technical data entry record for "${ph?.phase_title || 'this pump room'}"?`,
      isDeleting: false
    });
  };

  const handleConfirmDeleteModal = async () => {
    if (!deleteModal.id || !deleteModal.type) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      if (deleteModal.type === 'wf') {
        const oldRec = wfRecords.find(r => r.id === deleteModal.id);
        const { error } = await supabase.from('proposal_data_entry').delete().eq('id', deleteModal.id);
        if (error) throw error;
        setWfRecords(prev => prev.filter(r => r.id !== deleteModal.id));
        recordErpAuditAndNotification({
          table_name: 'proposal_data_entry',
          record_id: String(deleteModal.id),
          erp_tender_id: oldRec?.tender_log_id || null,
          action: 'DELETE',
          old_data: oldRec || { id: deleteModal.id },
        });
        void syncAllErpTendersAndCostsToTenderLog();
        setSaveMessage('Water feature record deleted successfully.');
      } else if (deleteModal.type === 'pr') {
        const oldRec = prRecords.find(r => r.id === deleteModal.id);
        const { error } = await supabase.from('pump_room_data_entry').delete().eq('id', deleteModal.id);
        if (error) throw error;
        setPrRecords(prev => prev.filter(r => r.id !== deleteModal.id));
        recordErpAuditAndNotification({
          table_name: 'pump_room_data_entry',
          record_id: String(deleteModal.id),
          erp_tender_id: oldRec?.tender_log_id || null,
          action: 'DELETE',
          old_data: oldRec || { id: deleteModal.id },
        });
        void syncAllErpTendersAndCostsToTenderLog();
        setSaveMessage('Pump room record deleted successfully.');
      }
      setTimeout(() => setSaveMessage(null), 3000);
      setDeleteModal({ isOpen: false, id: null, type: '', title: '', subtitle: '', isDeleting: false });
    } catch (err) {
      setErrorMessage('Failed to delete: ' + err.message);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // Save to Supabase
    // UUID Mapping Maps for foreign key compliance
  const categoryUuidMap = {
    'Swimming Pool': '2af5028b-4bec-403e-8825-75984bcbda28',
    'Lagoon': 'b040678e-1343-4def-8fc8-2d6b5850fcbf'
  };

  const typeUuidMap = {
    'Overflow': 'a8133ec0-271f-44e1-a693-c3c19efe19dc',
    'Skimmer': '33e2d774-7e31-49bc-8b01-4547719e233d',
    'Skimfilter': 'e076f96a-8aa7-4515-a917-3e95039f2133',
    'Olympic Pool': '77f528c6-88d7-4f54-a964-285666c3ac99',
    'Concrete Base Lagoon': '1657a003-b0c6-4fdc-9614-14861279dbed',
    'Sand Base Lagoon': 'bcdbf836-1657-407a-a46c-1dab51790d02'
  };


  const finishUuidMap = {
    'Mosaic': '7a6d93d2-e82a-4c25-98ee-aeb686cc15f0',
    'Liner': 'e68a9618-f808-49b8-bb84-08361ad96eda',
    'Ceramic': '0f870c8e-c26f-4dd2-94d8-2d65806eecfe'
  };

  const WF_PDE_COLUMNS = new Set([
    ...Object.keys(defaultWfData),
    'method_of_water_filtration',
    'created_by',
    'created_at',
    'updated_by',
    'updated_at'
  ]);

  const PR_PDE_COLUMNS = new Set([
    ...Object.keys(defaultPrData),
    'phase_id',
    'created_by',
    'created_at',
    'updated_by',
    'updated_at'
  ]);

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
    'item', 'work_main_category'
  ]);

  const resolveMaterialItemId = (val) => {
    if (!val) return null;
    const strVal = String(val).trim();
    const matched = materialsList.find(m => String(m.id) === strVal || String(m.item_id) === strVal);
    if (matched && matched.item_id) return matched.item_id;

    const num = Number(strVal);
    if (!isNaN(num) && num > 0) {
      const byRate = materialsList.find(m => Number(m.specification_rate) === num);
      if (byRate && byRate.item_id) return byRate.item_id;
    }

    return UUID_REGEX.test(strVal) ? strVal : null;
  };

  const resolveBrandId = (val) => {
    if (!val) return null;
    const strVal = String(val).trim();
    const direct = brandsList.find(b => String(b.id) === strVal);
    if (direct) return direct.id;

    const byTitle = brandsList.find(b => (b.title || b.name || '').toLowerCase() === strVal.toLowerCase());
    if (byTitle) return byTitle.id;

    if (strVal === 'cc67f864-bdf0-4091-b3f4-7db297fc35ab') {
      const shouman = brandsList.find(b => (b.title || '').toLowerCase() === 'shouman');
      if (shouman) return shouman.id;
    }
    if (strVal === '8c665915-e095-4da7-9d9d-e8477e1295ec') {
      const armada = brandsList.find(b => (b.title || '').toLowerCase() === 'armada');
      if (armada) return armada.id;
    }

    const cmtRow = materialsList.find(c => String(c.item_id) === strVal || String(c.id) === strVal);
    if (cmtRow && cmtRow.brand_id) return cmtRow.brand_id;

    return UUID_REGEX.test(strVal) ? strVal : null;
  };

  const sanitizePayload = (obj, allowedColumns = null) => {
    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
      if (allowedColumns && !allowedColumns.has(key)) {
        continue;
      }
      if (val === '' || val === undefined || val === null) {
        clean[key] = null;
      } else if (UUID_COLUMNS.has(key)) {
        if (key === 'concrete_forming_type' && (val === 'Coffor Panels' || val === 'coffor_panels' || val === '4d92c883-177a-48de-8090-40e9f7e7a68a')) {
          clean[key] = 'dcf713e9-afca-44fe-a577-2cab176f1d2d';
        } else if (['pc_grade', 'rc_grade', 'rebar_diameter_mm', 'wp_bituminous_material', 'wp_membrane_material', 'wp_cementitious_material', 'epoxy_paintings_material', 'pr_adhesive_material', 'pr_grout_material', 'bt_adhesive_material', 'bt_grout_material', 'wf_adhesive_material', 'wf_grout_material'].includes(key)) {
          clean[key] = resolveMaterialItemId(val);
        } else if (['polyethylene_brand', 'wp_bituminous_brand', 'wp_membrane_brand', 'wp_cementitious_brand', 'epoxy_paintings_brand', 'pr_adhesive_brand', 'pr_grout_brand', 'bt_adhesive_brand', 'bt_grout_brand', 'wf_adhesive_brand', 'wf_grout_brand', 'resilient_sheet_brand'].includes(key)) {
          clean[key] = resolveBrandId(val);
        } else if (typeof val === 'string' && UUID_REGEX.test(val)) {
          clean[key] = val;
        } else {
          clean[key] = null;
        }
      } else if (typeof val === 'number') {
        clean[key] = isNaN(val) ? null : val;
      } else {
        clean[key] = val;
      }
    }
    return clean;
  };

  // Save to Supabase
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      if (activeTab === 'water_feature') {
        if (!wfData.tender_log_id || !wfData.phase_id) {
          throw new Error('Please select both a Tender Proposal and a Water Feature Phase.');
        }

        const rawCat = wfData.water_feature_category;
        const rawTyp = wfData.water_feature_type;
        const rawFin = wfData.swimming_pool_finishes_type;

        // Map to UUID if human readable name is used
        const catUuid = categoryUuidMap[rawCat] || rawCat || null;
        const typUuid = typeUuidMap[rawTyp] || rawTyp || null;
        const finUuid = finishUuidMap[rawFin] || rawFin || null;

        const payload = sanitizePayload({
          ...wfData,
          water_feature_category: catUuid,
          water_feature_type: typUuid,
          swimming_pool_finishes_type: finUuid,
          ...buildErpAuditFields(Boolean(wfData.id))
        }, WF_PDE_COLUMNS);

        // Ensure Area, Perimeter, and Volume are calculated if dimensions are present
        const pLen = Number(payload.pool_length_m) || 0;
        const pWid = Number(payload.pool_width_m) || 0;
        if ((!payload.water_feature_area_m2 || Number(payload.water_feature_area_m2) <= 0) && pLen > 0 && pWid > 0) {
          payload.water_feature_area_m2 = Number((pLen * pWid).toFixed(2));
          payload.water_feature_perimeter_m = Number((2 * (pLen + pWid)).toFixed(2));
        }
        if ((!payload.water_feature_volume_m3 || Number(payload.water_feature_volume_m3) <= 0) && Number(payload.water_feature_area_m2) > 0) {
          const depth = Number(payload.avg_height_m || payload.water_deep_height_m || 1.4);
          payload.water_feature_volume_m3 = Number((Number(payload.water_feature_area_m2) * depth).toFixed(2));
        }

        const matchedProp = proposals.find(p => String(p.id) === String(wfData.tender_log_id));
        const matchedPh = phases.find(p => String(p.id) === String(wfData.phase_id));
        const isUpdate = Boolean(wfData.id);
        const oldRec = isUpdate ? wfRecords.find(r => r.id === wfData.id) : null;

        if (wfData.id) {
          const recordId = wfData.id;
          delete payload.id;
          const { error } = await supabase
            .from('proposal_data_entry')
            .update(payload)
            .eq('id', recordId);
          if (error) throw error;
        } else {
          delete payload.id;
          const { error } = await supabase
            .from('proposal_data_entry')
            .insert([payload]);
          if (error) throw error;
        }

        recordErpAuditAndNotification({
          table_name: 'proposal_data_entry',
          record_id: String(wfData.id || wfData.phase_id || 'wf_geometry'),
          erp_tender_id: String(wfData.tender_log_id),
          proposal_code: matchedProp?.proposal_number || null,
          action: isUpdate ? 'UPDATE' : 'INSERT',
          old_data: oldRec
            ? {
                area_m2: oldRec.water_feature_area_m2,
                volume_m3: oldRec.water_feature_volume_m3,
                perimeter_m: oldRec.water_feature_perimeter_m,
              }
            : null,
          new_data: {
            phase: matchedPh?.phase_title || wfData.phase_id,
            area_m2: payload.water_feature_area_m2,
            volume_m3: payload.water_feature_volume_m3,
            perimeter_m: payload.water_feature_perimeter_m,
          },
          notification: {
            type: 'erp_geometry_ready',
            includeAssignedEngineers: true,
            title_en: `Water Feature Geometry Saved (${matchedPh?.phase_title || 'Phase'})`,
            title_ar: `تم حفظ أبعاد المسطح المائي (${matchedPh?.phase_title || 'المرحلة'})`,
            message_en: `Area ${payload.water_feature_area_m2 || 0} m² • Volume ${payload.water_feature_volume_m3 || 0} m³ — Ready for Civil & MEP BOQ calculation.`,
            message_ar: `المساحة ${payload.water_feature_area_m2 || 0} م² • الحجم ${payload.water_feature_volume_m3 || 0} م³ — جاهز لحساب مقايسات المدني والكهروميكانيك.`,
          },
        });
        void syncAllErpTendersAndCostsToTenderLog();

        setSaveMessage('Water Feature specifications successfully saved!');
        await loadAllData();
        setIsFormModalOpen(false);
      } else if (activeTab === 'wf_structural') {
        if (!wfStructData.linked_phase) {
          throw new Error('Please select a Water Feature Phase.');
        }

        const matchedPhase = phases.find(p => String(p.id) === String(wfStructData.linked_phase));
        const resolvedTenderLogId = matchedPhase?.tender_log_id || wfStructData.linked_proposal || wfStructData.tender_log_id;

        let resolvedPde = wfDataEntries.find(w => String(w.phase_id) === String(wfStructData.linked_phase) || String(w.id) === String(wfStructData.linked_phase));
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
                pool_length_m: 10,
                pool_width_m: 5,
                avg_height_m: 1.4,
                water_shallow_height_m: 1.2,
                water_deep_height_m: 1.6,
                water_feature_area_m2: 50,
                water_feature_volume_m3: 70,
                water_feature_perimeter_m: 30,
                ...buildErpAuditFields(false)
              }])
              .select('*')
              .single();
            if (pdeErr) throw new Error('Could not initialize Water Feature technical data: ' + pdeErr.message);
            resolvedPde = newPde;
          }
        }

        let existingRecordId = wfStructData.id;
        if (!existingRecordId && resolvedPde?.id) {
          const { data: found } = await supabase
            .from('water_feature_structural_works')
            .select('id')
            .eq('phase_id', resolvedPde.id)
            .maybeSingle();
          if (found?.id) existingRecordId = found.id;
        }

        const payload = sanitizePayload({
          ...wfStructData,
          tender_log_id: resolvedTenderLogId,
          linked_proposal: resolvedTenderLogId,
          phase_id: resolvedPde ? resolvedPde.id : wfStructData.linked_phase,
          ...buildErpAuditFields(Boolean(existingRecordId))
        }, WF_STRUCT_COLUMNS);

        delete payload.id;
        if (existingRecordId) {
          const { error } = await supabase
            .from('water_feature_structural_works')
            .update(payload)
            .eq('id', existingRecordId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('water_feature_structural_works')
            .insert([payload]);
          if (error) throw error;
        }

        setSaveMessage('Water Feature Structural works successfully saved!');
        await loadAllData();
        setIsFormModalOpen(false);
      } else {
        if (!prData.tender_log_id || !prData.linked_phase) {
          throw new Error('Please select both a Tender Proposal and a Pump Room Phase.');
        }

        const payload = sanitizePayload({
          ...prData,
          ...buildErpAuditFields(Boolean(prData.id))
        }, PR_PDE_COLUMNS);

        const matchedPropPr = proposals.find(p => String(p.id) === String(prData.tender_log_id));
        const matchedPhPr = phases.find(p => String(p.id) === String(prData.linked_phase));
        const isUpdatePr = Boolean(prData.id);
        const oldRecPr = isUpdatePr ? prRecords.find(r => r.id === prData.id) : null;

        if (prData.id) {
          const recordId = prData.id;
          delete payload.id;
          const { error } = await supabase
            .from('pump_room_data_entry')
            .update(payload)
            .eq('id', recordId);
          if (error) throw error;
        } else {
          delete payload.id;
          const { error } = await supabase
            .from('pump_room_data_entry')
            .insert([payload]);
          if (error) throw error;
        }

        recordErpAuditAndNotification({
          table_name: 'pump_room_data_entry',
          record_id: String(prData.id || prData.linked_phase || 'pr_geometry'),
          erp_tender_id: String(prData.tender_log_id),
          proposal_code: matchedPropPr?.proposal_number || null,
          action: isUpdatePr ? 'UPDATE' : 'INSERT',
          old_data: oldRecPr
            ? {
                length_m: oldRecPr.pump_room_length_m,
                width_m: oldRecPr.pump_room_width_m,
                height_m: oldRecPr.pump_room_height_m,
              }
            : null,
          new_data: {
            phase: matchedPhPr?.phase_title || prData.linked_phase,
            length_m: payload.pump_room_length_m,
            width_m: payload.pump_room_width_m,
            height_m: payload.pump_room_height_m,
          },
          notification: {
            type: 'erp_geometry_ready',
            includeAssignedEngineers: true,
            title_en: `Pump Room Dimensions Saved (${matchedPhPr?.phase_title || 'Pump Room'})`,
            title_ar: `تم حفظ أبعاد غرفة الطلمبات (${matchedPhPr?.phase_title || 'غرفة الطلمبات'})`,
            message_en: `Pump Room dimensions (${payload.pump_room_length_m || 0}m × ${payload.pump_room_width_m || 0}m × ${payload.pump_room_height_m || 0}m) ready for Structural & MEP sizing.`,
            message_ar: `تم اعتماد أبعاد غرفة الطلمبات (${payload.pump_room_length_m || 0}م × ${payload.pump_room_width_m || 0}م × ${payload.pump_room_height_m || 0}م).`,
          },
        });
        void syncAllErpTendersAndCostsToTenderLog();

        setSaveMessage('Pump Room dimensions successfully saved!');
        await loadAllData();
        setIsFormModalOpen(false);
      }

      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      console.error('Save error:', err);
      setErrorMessage(err.message || 'Failed to save data entry record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Top Banner - 100% Full Width */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800 px-3 py-0.5 rounded-full">
              Technical Specifications Suite
            </span>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Waves className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Water Features & Pump Rooms Data Hub</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Browse entered scopes in tabular views, or click "+ Add New Entry" to input physical dimensions, SHOW_IF geometry & equipment sizing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            onClick={loadAllData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:text-cyan-600 transition cursor-pointer"
            title="Refresh Data & Tables"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
          </button>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-cyan-900/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New {activeTab === 'water_feature' ? 'Water Feature' : 'Pump Room'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-xs font-bold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center gap-3 text-rose-900 dark:text-rose-200 text-xs font-bold shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2 PRIMARY TABS */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg">
        
        {/* Tab 1: Water Features */}
        <button
          onClick={() => {
            setActiveTab('water_feature');
            setSearchTableQuery('');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'water_feature'
              ? 'bg-white dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 shadow-sm border border-slate-200 dark:border-cyan-500/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Waves className="w-4 h-4 text-cyan-600" />
          <span>1. Water Features</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-300 border border-cyan-200">
            {wfRecords.length}
          </span>
        </button>

        {/* Tab 2: Pump Rooms */}
        <button
          onClick={() => {
            setActiveTab('pump_room');
            setSearchTableQuery('');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'pump_room'
              ? 'bg-white dark:bg-teal-500/20 text-teal-900 dark:text-teal-300 shadow-sm border border-slate-200 dark:border-teal-500/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4 text-teal-600" />
          <span>2. Pump Rooms</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300 border border-teal-200">
            {prRecords.length}
          </span>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 100% FULL-WIDTH DATA TABLE VIEW */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 w-full">
        
        {/* Table Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 w-full">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {activeTab === 'water_feature' ? 'Water Feature Specifications Table (proposal_data_entry)' : 'Pump Room Specifications Table (pump_room_data_entry)'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Click any row or the edit icon to open and modify specifications in the data entry modal.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by proposal code, title, phase..."
              value={searchTableQuery}
              onChange={(e) => setSearchTableQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Table 1: Water Features Table */}
        {activeTab === 'water_feature' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 w-full">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-100 dark:bg-slate-950 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase font-mono text-[11px]">
                <tr>
                  <th className="p-3.5 w-12 text-center text-slate-400">#</th>
                  <th className="p-3.5 font-bold">Proposal Code & Title</th>
                  <th className="p-3.5 font-bold">Phase Scope</th>
                  <th className="p-3.5 font-bold">Category & Type</th>
                  <th className="p-3.5 font-bold">Shape</th>
                  <th className="p-3.5 font-bold text-center">Dimensions (L × W)</th>
                  <th className="p-3.5 font-bold text-center">Depths (Shallow / Deep)</th>
                  <th className="p-3.5 font-bold text-center">Area (m²)</th>
                  <th className="p-3.5 font-bold text-center">Volume (m³)</th>
                  <th className="p-3.5 font-bold">Usage & Turnover</th>
                  <th className="p-3.5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredWfRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-slate-500">
                      No water feature records found. Click <strong>"+ Add New Water Feature"</strong> to create the first specification.
                    </td>
                  </tr>
                ) : (
                  filteredWfRecords.map((r, idx) => {
                    const prop = proposals.find(p => p.id === r.tender_log_id);
                    const ph = phases.find(p => p.id === r.phase_id);

                    return (
                      <tr
                        key={r.id || idx}
                        onClick={() => handleEditWfRecord(r)}
                        className="hover:bg-cyan-50/60 dark:hover:bg-cyan-950/30 transition cursor-pointer group"
                      >
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 max-w-[220px] truncate">
                          <span className="text-cyan-800 dark:text-cyan-300 font-mono mr-1.5 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded border border-cyan-200">
                            {prop?.proposal_number || 'SP.2026'}:
                          </span>
                          <span>{prop?.proposal_title || prop?.proposal_full_title || 'Untitled'}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                          {ph?.phase_title || 'Phase Scope'}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-900 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                            {getCategoryName(r.water_feature_category)} • {getTypeName(r.water_feature_type)}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-400 font-medium">
                          {r.swimming_pool_shape || 'Rectangle'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.pool_length_m || '-'} × {r.pool_width_m || '-'} m
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                          {r.water_shallow_height_m}m / {r.water_deep_height_m}m (avg {r.avg_height_m}m)
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-cyan-900 dark:text-cyan-300">
                          {r.water_feature_area_m2} m²
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-teal-700 dark:text-teal-400">
                          {r.water_feature_volume_m3} m³
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.water_feature_usage === 'Swimmable' 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-200'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200'
                          }`}>
                            {r.water_feature_usage || 'Swimmable'} ({r.hours_of_water_filtration_h || 6}h)
                          </span>
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditWfRecord(r)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-cyan-100 text-slate-600 dark:text-slate-300 hover:text-cyan-900 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => promptDeleteWf(r, e)}
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
        )}

        {/* Table 2: Pump Rooms Table */}
        {activeTab === 'pump_room' && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 w-full">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-100 dark:bg-slate-950 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase font-mono text-[11px]">
                <tr>
                  <th className="p-3.5 w-12 text-center text-slate-400">#</th>
                  <th className="p-3.5 font-bold">Proposal Code & Title</th>
                  <th className="p-3.5 font-bold">Linked Pump Phase</th>
                  <th className="p-3.5 font-bold text-center">Room Dim (L × W × H)</th>
                  <th className="p-3.5 font-bold text-center">Room Area (m²)</th>
                  <th className="p-3.5 font-bold text-center">Sump Pit Footprint</th>
                  <th className="p-3.5 font-bold text-center">Surge Balance Tank (L × W × H)</th>
                  <th className="p-3.5 font-bold text-center">Surge Vol (m³)</th>
                  <th className="p-3.5 font-bold">Accommodations</th>
                  <th className="p-3.5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                {filteredPrRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500">
                      No pump room records found. Click <strong>"+ Add New Pump Room"</strong> to create the first specification.
                    </td>
                  </tr>
                ) : (
                  filteredPrRecords.map((r, idx) => {
                    const prop = proposals.find(p => p.id === r.tender_log_id);
                    const ph = phases.find(p => p.id === r.linked_phase);

                    return (
                      <tr
                        key={r.id || idx}
                        onClick={() => handleEditPrRecord(r)}
                        className="hover:bg-teal-50/60 dark:hover:bg-teal-950/30 transition cursor-pointer group"
                      >
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 max-w-[220px] truncate">
                          <span className="text-teal-800 dark:text-teal-300 font-mono mr-1.5 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200">
                            {prop?.proposal_number || 'SP.2026'}:
                          </span>
                          <span>{prop?.proposal_title || prop?.proposal_full_title || 'Untitled'}</span>
                        </td>
                        <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                          {ph?.phase_title || 'Pump Room Scope'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.pump_room_length_m} × {r.pump_room_width_m} × {r.pump_room_height_m} m
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-teal-900 dark:text-teal-300">
                          {r.pump_room_area_m2} m²
                        </td>
                        <td className="p-3.5 text-center font-mono text-slate-700 dark:text-slate-300">
                          {r.sumpit_area_m2 ? `${r.sumpit_area_m2} m² (${r.sumpit_height_m || 1}m deep)` : '—'}
                        </td>
                        <td className="p-3.5 text-center font-mono text-purple-800 dark:text-purple-300 font-medium">
                          {r.balance_tank_length_m} × {r.balance_tank_width_m} × {r.balance_tank_height_m} m
                        </td>
                        <td className="p-3.5 text-center font-mono font-black text-purple-950 dark:text-purple-300">
                          {r.balance_tank_volume_m3} m³
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                            {r.accommodations_required || 'No'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleEditPrRecord(r)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-100 text-slate-600 dark:text-slate-300 hover:text-teal-900 transition cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => promptDeletePr(r, e)}
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
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL / DRAWER FOR DATA ENTRY FORM */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl border ${
                  activeTab === 'water_feature' 
                    ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 text-cyan-600' 
                    : 'bg-teal-50 dark:bg-teal-500/10 border-teal-200 text-teal-600'
                }`}>
                  {activeTab === 'water_feature' ? <Waves className="w-5 h-5" /> : <Cpu className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {activeTab === 'water_feature' 
                      ? (wfData.id ? 'Edit Water Feature Specification' : 'New Water Feature Specification') 
                      : (prData.id ? 'Edit Pump Room Specification' : 'New Pump Room Specification')}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {activeTab === 'water_feature' ? 'proposal_data_entry (Pools & Lagoons)' : 'pump_room_data_entry (Enclosures & Balance Tanks)'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>

                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'water_feature' ? (
                <WaterFeatureForm
                  formData={wfData}
                  onChange={setWfData}
                  proposals={proposals}
                  phases={phases}
                  waterFeaturePhases={waterFeaturePhases}
                  categories={categories}
                  featureTypes={featureTypes}
                  finishesCategoryList={finishesCategoryList}
                />
              ) : (
                <PumpRoomForm
                  formData={prData}
                  onChange={setPrData}
                  proposals={proposals}
                  phases={phases}
                  pumpRoomPhases={pumpRoomPhases}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                P.ZONE Engineering Engine • Auto-Formulas & SHOW_IF Active
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save</span>
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
