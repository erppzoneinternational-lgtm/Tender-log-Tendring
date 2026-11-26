// Standard 9 Mobilization & Site Setup Items with AppSheet Database UUIDs & Formulas
const MOBILIZATION_ITEMS_TEMPLATE = [
  {
    id: '42ff9558-d0cc-4f42-9a09-76fd98b7ab41',
    code: 'MOB-01',
    name: 'Caravans for P.M',
    category: 'Mobilization',
    unit: 'No.',
    defaultRate: 70000,
    formulaType: 'pm_caravan',
    description: '1 Dedicated Caravan for Project Manager'
  },
  {
    id: '931132b7-4753-48f9-8512-d234925df0cf',
    code: 'MOB-02',
    name: 'Caravans for Site Staff',
    category: 'Mobilization',
    unit: 'No.',
    defaultRate: 150000,
    formulaType: 'staff_caravans',
    description: 'ceil((Site Staff - 1) / 5) - 1 Caravan per 5 Staff'
  },
  {
    id: 'd23a084d-3580-4785-9c80-2a3167397906',
    code: 'MOB-03',
    name: 'Air Condition',
    category: 'Mobilization',
    unit: 'No.',
    defaultRate: 50000,
    formulaType: 'air_conditions',
    description: 'PM Caravans + Staff Caravans (1 AC per Caravan)'
  },
  {
    id: 'aa3c76b8-05e5-4b2a-b182-0ac741c9a228',
    code: 'MOB-04',
    name: 'PM Desk',
    category: 'Contractor Site Office',
    unit: 'No.',
    defaultRate: 5000,
    formulaType: 'pm_desk',
    description: '1 Desk for Project Manager'
  },
  {
    id: 'b5d536a8-dbf1-43f2-be3d-c965cd7ea7d4',
    code: 'MOB-05',
    name: 'PM Chair',
    category: 'Contractor Site Office',
    unit: 'No.',
    defaultRate: 3000,
    formulaType: 'pm_chair',
    description: '1 Chair for Project Manager'
  },
  {
    id: 'bff3120e-a11b-4327-94f2-3c8b1a25669d',
    code: 'MOB-06',
    name: 'Staff Desk',
    category: 'Contractor Site Office',
    unit: 'No.',
    defaultRate: 2500,
    formulaType: 'staff_desks',
    description: 'Total Site Staff - 1 PM (1 Desk per Staff)'
  },
  {
    id: '30a8976d-aa4f-4450-bd7c-4d0b24039e25',
    code: 'MOB-07',
    name: 'Meeting Table',
    category: 'Contractor Site Office',
    unit: 'No.',
    defaultRate: 15000,
    formulaType: 'meeting_table',
    description: '1 Main Conference Table'
  },
  {
    id: '3962bb24-ea6a-4191-8830-53a4b3b67a71',
    code: 'MOB-08',
    name: 'Meeting chairs',
    category: 'Contractor Site Office',
    unit: 'No.',
    defaultRate: 1500,
    formulaType: 'meeting_chairs',
    description: '12 Meeting Chairs for Site Conference'
  },
  {
    id: '3eae449c-f833-41ab-a4bb-737eee4dbb8c',
    code: 'MOB-09',
    name: 'Warehouses',
    category: 'Mobilization',
    unit: 'No.',
    defaultRate: 30000,
    formulaType: 'warehouses',
    description: '1 On-Site Secured Storage Warehouse'
  }
];
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Receipt, 
  Layers, 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Save, 
  Download, 
  RefreshCw, 
  FileSpreadsheet, 
  Sliders, 
  Calculator, 
  Sparkles, 
  PieChart as PieIcon, 
  ChevronRight, 
  ChevronDown,
  ArrowUpRight,
  HardHat,
  Cpu,
  Truck,
  FileText,
  Search,
  Filter,
  Check,
  Briefcase,
  Shield,
  HelpCircle,
  Clock,
  ArrowRight,
  Table as TableIcon,
  SlidersHorizontal,
  ExternalLink,
  Wrench,
  Zap,
  Hammer,
  ChevronUp,
  Calendar,
  Compass,
  Boxes,
  Waves,
  Gauge,
  Users,
  Home,
  UserCheck,
  Plus,
  Trash2,
  Lock,
  Building,
  Target,
  BadgePercent,
  Presentation
} from 'lucide-react';
import { STATIC_ITEMS_LOOKUP, resolveCategoryName } from '../lib/staticLookup';
import CommercialBoqPptxModal from './CommercialBoqPptxModal';
import { COMPANY_EMPLOYEES_DIRECTORY, DEFAULT_SELECTED_SITE_STAFF } from '../data/companyEmployees';
import {
  buildErpAuditFields,
  getActiveErpTenderContext,
  nowCairoIso,
  recordErpAuditAndNotification,
  resolveCurrentErpActor,
  syncAllErpTendersAndCostsToTenderLog,
  todayCairoIso,
} from '../lib/erpBridge';

// Default Global Financial Parameters (12 Indirects, 3 Reserves, 5 Adders, Taxes, Commission)
const getDefaultGlobalFinancialSettings = () => ({
  // 12 Indirect Items (%) and Manual Amounts matching company defaults
  materialTransportationPct: 2.00, // Material Transportation & Logistics (2.00%)
  engineeringPct: 1.56,            // Shop Drawings & Technical Engineering (1.56%)
  
  // Mobilization & Site Setup
  mobilizationMode: 'percentage', // 'percentage' | 'calculated' | 'fixed'
  mobilizationPct: 1.39,           // Site Mobilization & Demobilization (1.39%)
  mobilizationFixedAmt: 75000,
  portacabinMonthlyRentPerUnit: 8500,
  portacabinsCount: 2,
  officeSetupCost: 25000,
  mobTransportTrucksCost: 20000,

  tempWaterPct: 0.11,              // Temporary Water Supply (0.11%)
  tempPowerPct: 0.14,              // Temporary Power & Generators (0.14%)
  contractorSiteOfficePct: 0.31,   // Site Office Setup & Maintenance (0.31%)
  stationaryCopyingPct: 0.29,      // Printing, Documentations & Stationary (0.29%)
  
  // Safety Facilities & HSE
  safetyFacilitiesMode: 'percentage', // 'percentage' | 'calculated' | 'fixed'
  safetyFacilitiesPct: 0.23,       // HSE & Safety Equipment on Site (0.23%)
  safetyFacilitiesFixedAmt: 45000,
  safetyPpePerStaffMonthly: 1200,
  safetySignageAndFirstAid: 15000,

  // Company Living Accommodation
  companyAccommodationMode: 'percentage', // 'percentage' | 'calculated' | 'fixed'
  companyAccommodationPct: 0.44,   // Engineers & Site Staff Accommodation (0.44%)
  companyAccommodationFixedAmt: 60000,
  accommodationRentMonthlyPerStaff: 4500,
  dailySubsistenceAllowancePerStaff: 150,
  siteVehiclesMonthlyFuelAndMaintenance: 12000,
  siteVehiclesCount: 1,
  
  // Site Staff Salaries Mode
  salariesSiteStaffMode: 'percentage', // 'percentage' | 'staff_table' | 'fixed'
  salariesSiteStaffPct: 3.61,       // Site Supervision & Engineers Salaries (3.61%)
  salariesSiteStaffFixedAmt: 180000,
  staffExtraDaysPerMonth: 3,        // 3 buffer days added per month duration

  technicalServicesPct: 0.18,      // Testing, Commissioning & QA/QC Labs (0.18%)
  
  // Head Office (G&A) Overheads & Non-Direct Staff Days Calculation
  headOfficeCalculationMode: 'percentage',   // 'percentage' | 'days_pool'
  headOfficeDaysPerMonthBasis: 3,             // 3 days per 30 days (10% of monthly salary)
  headOfficeDurationHandling: 'exact_prorata', // 'exact_prorata' (e.g. 25d -> 2.5d, 60d -> 6d) | 'min_1_month_floor' (min 3d) | 'custom_days'
  headOfficeCustomDays: 0,
  headOfficePct: 9.00,
  deductSiteStaffFromHeadOffice: true,
  customProjectDurationDays: 0, // 0 = automatic from tender or boq, >0 overrides duration across overheads

  // 3 Reserves Items (%)
  contingencyReservesPct: 2.5,
  managementReservesPct: 1.5,
  guaranty1YearPct: 1.0,

  // 5 Commercial, Financial & Insurance Adders (%)
  salesCommissionMode: 'selling_price_divisor', // 'selling_price_divisor'
  salesCommissionPct: 1.50,  // Sales & marketing commission (1.50%)
  marketingAllowanceAmt: 0,
  
  paymentGuaranteePct: 0.96, // Payment guarantee discount commission (0.96%)
  finalGuaranteePct: 0.12,   // Final guarantee discount commission (0.12%)
  financingInterestPct: 1.22,// Financing interest (1.22%)
  socialInsurancePct: 2.70,  // Social insurance (2.70%)

  // Tax Analysis (%)
  corporateTaxesPct: 22.5
});

// Default Base Profit Margins for Core Disciplines
const DEFAULT_DISCIPLINE_MARGINS = {
  Civil: 15.0,
  Mechanical: 20.0,
  Electrical: 22.0,
  General: 18.0
};

// Default Pre-Configured Construction Staff Roster
const DEFAULT_SITE_STAFF = [
  { id: 's1', role: 'Project Manager', monthlySalary: 35000, activeOnProject: true, allocationPct: 100, notes: 'Full-time site execution leadership' },
  { id: 's2', role: 'Senior Site Civil Engineer', monthlySalary: 22000, activeOnProject: true, allocationPct: 100, notes: 'Concrete structure & civil supervision' },
  { id: 's3', role: 'Site Mechanical / MEP Engineer', monthlySalary: 20000, activeOnProject: true, allocationPct: 100, notes: 'Pumps, filtration & piping installation' },
  { id: 's4', role: 'Site Electrical Engineer', monthlySalary: 20000, activeOnProject: true, allocationPct: 100, notes: 'Control panels & underwater lighting' },
  { id: 's5', role: 'QA/QC Engineer', monthlySalary: 18000, activeOnProject: true, allocationPct: 50, notes: 'Testing & inspection quality assurance' },
  { id: 's6', role: 'HSE / Safety Officer', monthlySalary: 15000, activeOnProject: true, allocationPct: 100, notes: 'Site safety enforcement & risk prevention' },
  { id: 's7', role: 'Land Surveyor', monthlySalary: 16000, activeOnProject: true, allocationPct: 50, notes: 'Levels, coordinates & layout setting out' },
  { id: 's8', role: 'General Site Foreman', monthlySalary: 14000, activeOnProject: true, allocationPct: 100, notes: 'Labor crews supervision & site coordination' },
  { id: 's9', role: 'Site Storekeeper & Logistics', monthlySalary: 11000, activeOnProject: true, allocationPct: 100, notes: 'Material inventory receiving & safeguarding' },
  { id: 's10', role: 'Site Accountant & Timekeeper', monthlySalary: 12000, activeOnProject: false, allocationPct: 50, notes: 'Site petty cash & labor timesheets' }
];

export default function CommercialBidPricePortal({ onOpenDatabaseTable, onNavigate }) {
  // Database Reference States
  const [tendersList, setTendersList] = useState([]);
  const [phasesList, setPhasesList] = useState([]);
  const [breakdownItems, setBreakdownItems] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [boqWorkTypesList, setBoqWorkTypesList] = useState([]);
  const [catalogItemsList, setCatalogItemsList] = useState([]);
  const [isPptxModalOpen, setIsPptxModalOpen] = useState(false);
  
  // Active Main View Tab ('proposals_table' | 'bid_configurator')
  const [activeMainView, setActiveMainView] = useState('proposals_table');

  // Configurator Sub-Tabs:
  // 'master_summary' | 'profit_margins' | 'staff_salaries' | 'mobilization_logistics' | 'reserves_financials' | 'commission_bid'
  const [activeConfigTab, setActiveConfigTab] = useState('master_summary');
  
  // Tier 1 Breakdown Presentation Mode ('discipline_worktypes' | 'phases_breakdown')
  const [tier1BreakdownMode, setTier1BreakdownMode] = useState('discipline_worktypes');

  // Selection States
  const [selectedTenderId, setSelectedTenderId] = useState('');
  const [activeWorkTypeTab, setActiveWorkTypeTab] = useState('ALL'); // 'ALL' | 'Civil' | 'Mechanical' | 'Electrical'
  const [selectedSpecificCategoryFilter, setSelectedSpecificCategoryFilter] = useState('ALL');
  
  // Collapsible Scope Sections in Table
  const [collapsedScopes, setCollapsedScopes] = useState({});

  // Global Financial Parameters
  const [globalFinancialConfig, setGlobalFinancialConfig] = useState(getDefaultGlobalFinancialSettings());

  // Discipline Level Base Margins
  const [disciplineMargins, setDisciplineMargins] = useState(DEFAULT_DISCIPLINE_MARGINS);

  // Granular Work-Type Specific Margins (e.g. "Reinforced Concrete": 16.0, "Plain Concrete": 14.0)
  const [workTypeSpecificMargins, setWorkTypeSpecificMargins] = useState({});

  // Site Staff Roster State
  const [siteStaffRoster, setSiteStaffRoster] = useState(DEFAULT_SITE_STAFF);
  const [isEmployeeDirectoryModalOpen, setIsEmployeeDirectoryModalOpen] = useState(false);
  const [isHeadOfficeListModalOpen, setIsHeadOfficeListModalOpen] = useState(false);
  const [employeeDirectorySearchQuery, setEmployeeDirectorySearchQuery] = useState('');
  const [employeeDirectoryDeptFilter, setEmployeeDirectoryDeptFilter] = useState('ALL');

  // Commercial BOQ PPTX Presentation Options (persisted per tender in commercial_config)
  const [templateId, setTemplateId] = useState('executive_navy');
  const [tableMode, setTableMode] = useState('full_boq');
  const [pumpRoomSeparate, setPumpRoomSeparate] = useState(true);
  const [granularity, setGranularity] = useState('work_types');
  const [includeCoverSlide, setIncludeCoverSlide] = useState(true);
  const [includeSummarySlide, setIncludeSummarySlide] = useState(true);

  const hydratedTenderIdRef = useRef(null);

  // Table Filtering & Search States
  const [proposalsSearchQuery, setProposalsSearchQuery] = useState('');
  const [proposalsStatusFilter, setProposalsStatusFilter] = useState('ALL');
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const proposalDropdownRef = useRef(null);
  const configuratorRef = useRef(null);

  // UI & Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Load Database Data on Mount
  useEffect(() => {
    loadReferenceData();
  }, []);

  // Hydrate saved commercial_config inputs (or reset to defaults) when selected tender changes
  useEffect(() => {
    if (!selectedTenderId || tendersList.length === 0) return;
    if (hydratedTenderIdRef.current === String(selectedTenderId)) return;

    const targetRow = tendersList.find(
      (t) => String(t.id) === String(selectedTenderId)
    );
    if (!targetRow) return;

    hydratedTenderIdRef.current = String(selectedTenderId);

    const cfgObj =
      targetRow.commercial_config &&
      typeof targetRow.commercial_config === 'object' &&
      !Array.isArray(targetRow.commercial_config)
        ? targetRow.commercial_config
        : null;
    const inp =
      cfgObj?.inputs &&
      typeof cfgObj.inputs === 'object' &&
      !Array.isArray(cfgObj.inputs)
        ? cfgObj.inputs
        : null;

    if (!cfgObj || !inp) {
      setActiveWorkTypeTab('ALL');
      setGlobalFinancialConfig(getDefaultGlobalFinancialSettings());
      setDisciplineMargins({ ...DEFAULT_DISCIPLINE_MARGINS });
      setWorkTypeSpecificMargins({});
      setSiteStaffRoster(DEFAULT_SITE_STAFF.map((s) => ({ ...s })));
      setTemplateId('executive_navy');
      setTableMode('full_boq');
      setPumpRoomSeparate(true);
      setGranularity('work_types');
      setIncludeCoverSlide(true);
      setIncludeSummarySlide(true);
      return;
    }

    setActiveWorkTypeTab(
      typeof inp.activeWorkTypeTab === 'string' ? inp.activeWorkTypeTab : 'ALL'
    );
    setGlobalFinancialConfig(
      inp.globalFinancialConfig &&
        typeof inp.globalFinancialConfig === 'object' &&
        !Array.isArray(inp.globalFinancialConfig)
        ? {
            ...getDefaultGlobalFinancialSettings(),
            ...inp.globalFinancialConfig,
          }
        : getDefaultGlobalFinancialSettings()
    );
    setDisciplineMargins(
      inp.disciplineMargins &&
        typeof inp.disciplineMargins === 'object' &&
        !Array.isArray(inp.disciplineMargins)
        ? {
            ...DEFAULT_DISCIPLINE_MARGINS,
            ...inp.disciplineMargins,
          }
        : { ...DEFAULT_DISCIPLINE_MARGINS }
    );
    setWorkTypeSpecificMargins(
      inp.workTypeSpecificMargins &&
        typeof inp.workTypeSpecificMargins === 'object' &&
        !Array.isArray(inp.workTypeSpecificMargins)
        ? { ...inp.workTypeSpecificMargins }
        : {}
    );
    setSiteStaffRoster(
      Array.isArray(inp.siteStaffRoster)
        ? inp.siteStaffRoster.map((s) => ({ ...s }))
        : DEFAULT_SITE_STAFF.map((s) => ({ ...s }))
    );
    setTemplateId(
      typeof inp.templateId === 'string' ? inp.templateId : 'executive_navy'
    );
    setTableMode(
      typeof inp.tableMode === 'string' ? inp.tableMode : 'full_boq'
    );
    setPumpRoomSeparate(
      typeof inp.pumpRoomSeparate === 'boolean' ? inp.pumpRoomSeparate : true
    );
    setGranularity(
      typeof inp.granularity === 'string' ? inp.granularity : 'work_types'
    );
    setIncludeCoverSlide(
      typeof inp.includeCoverSlide === 'boolean' ? inp.includeCoverSlide : true
    );
    setIncludeSummarySlide(
      typeof inp.includeSummarySlide === 'boolean'
        ? inp.includeSummarySlide
        : true
    );
  }, [selectedTenderId, tendersList]);

  const fetchAllBreakdownItems = async () => {
    let allItems = [];
    let from = 0;
    const step = 1000;
    while (true) {
      const { data, error } = await supabase
        .from('proposal_breakdown_items')
        .select('*')
        .range(from, from + step - 1);
      if (error || !data || data.length === 0) break;
      allItems = allItems.concat(data);
      if (data.length < step) break;
      from += step;
    }
    return allItems;
  };

  const loadReferenceData = async () => {
    setIsLoading(true);
    try {
      const [
        { data: tenders },
        { data: phases },
        { data: clients },
        boq,
        { data: wfEntries },
        { data: prEntries },
        { data: wfFinEntries },
        { data: prFinEntries },
        { data: boqWorkTypes },
        { data: catItems }
      ] = await Promise.all([
        supabase.from('tender_log').select('*').order('created_at', { ascending: false }),
        supabase.from('phases').select('*'),
        supabase.from('clients').select('*'),
        fetchAllBreakdownItems(),
        supabase.from('proposal_data_entry').select('id, phase_id, linked_phase, project_title, proposal_id'),
        supabase.from('pump_room_data_entry').select('id, phase_id, linked_phase, project_title, proposal_id'),
        supabase.from('proposal_finishes_water_feature').select('id, phase_id, linked_phase, project_title, proposal_id'),
        supabase.from('proposal_finishes_pump_room').select('id, phase_id, linked_phase, project_title, proposal_id'),
        supabase.from('boq_work_type').select('*').then(r => r.error ? { data: [] } : r),
        supabase.from('items').select('id, item_name, unit').then(r => r.error ? { data: [] } : r)
      ]);

      const phasesArr = phases || [];
      const phaseIdsSet = new Set(phasesArr.map(p => String(p.id)));
      const phaseToProposalMap = new Map();
      phasesArr.forEach(p => {
        const propId = p.tender_log_id || p.linked_proposal || p.proposal_id;
        if (p.id && propId) phaseToProposalMap.set(String(p.id), String(propId));
      });

      // Map any child record ID (WF/PR structural or finishes) to its canonical phases.id and proposal_id
      const recordToPhaseMap = new Map();
      const recordToProposalMap = new Map();
      [...(wfEntries || []), ...(prEntries || []), ...(wfFinEntries || []), ...(prFinEntries || [])].forEach(rec => {
        if (!rec?.id) return;
        const pId = rec.phase_id || rec.linked_phase;
        const propId = rec.project_title || rec.proposal_id || (pId && phaseToProposalMap.get(String(pId)));
        if (pId) recordToPhaseMap.set(String(rec.id), String(pId));
        if (propId) recordToProposalMap.set(String(rec.id), String(propId));
      });

      const normalizedBoq = (boq || []).map(item => {
        let resolvedPhaseId = item.phase_id ? String(item.phase_id) : '';
        let resolvedProposalId = item.proposal_id || item.tender_log_id || '';

        if (resolvedPhaseId && !phaseIdsSet.has(resolvedPhaseId)) {
          const mappedPhase = recordToPhaseMap.get(resolvedPhaseId);
          if (mappedPhase) {
            if (!resolvedProposalId) {
              resolvedProposalId = recordToProposalMap.get(resolvedPhaseId) || phaseToProposalMap.get(mappedPhase) || '';
            }
            resolvedPhaseId = mappedPhase;
          }
        }

        if (!resolvedProposalId && resolvedPhaseId && phaseToProposalMap.has(resolvedPhaseId)) {
          resolvedProposalId = phaseToProposalMap.get(resolvedPhaseId);
        }

        // If phase_id is still not in phasesIdsSet, try matching a phase under the same proposal_id
        if ((!resolvedPhaseId || !phaseIdsSet.has(resolvedPhaseId)) && resolvedProposalId) {
          const propPhases = phasesArr.filter(p => String(p.tender_log_id || p.linked_proposal || p.proposal_id) === String(resolvedProposalId));
          if (propPhases.length === 1) {
            resolvedPhaseId = String(propPhases[0].id);
          } else if (propPhases.length > 1) {
            const comp = String(item.phase_component || '').toLowerCase();
            const matched = propPhases.find(p => {
              const title = String(p.phase_title || p.phase_full_title || p.scope_of_work || '').toLowerCase();
              if (comp.includes('pump room')) return title.includes('pump');
              return !title.includes('pump');
            }) || propPhases[0];
            if (matched) resolvedPhaseId = String(matched.id);
          }
        }

        return {
          ...item,
          _raw_phase_id: item.phase_id,
          phase_id: resolvedPhaseId || item.phase_id,
          proposal_id: resolvedProposalId || item.proposal_id
        };
      });

      setTendersList(tenders || []);
      setPhasesList(phasesArr);
      setClientsList(clients || []);
      setBreakdownItems(normalizedBoq);
      setBoqWorkTypesList(boqWorkTypes || []);
      setCatalogItemsList(catItems || []);

      if (tenders && tenders.length > 0) {
        const activeCtx = getActiveErpTenderContext();
        const matched = activeCtx
          ? tenders.find(
              t =>
                String(t.id) === String(activeCtx.erpTenderId) ||
                String(t.proposal_number || '').toLowerCase() === String(activeCtx.proposalCode || '').toLowerCase()
            )
          : null;
        const targetTender = matched || tenders[0];
        setSelectedTenderId(targetTender.id);
        if (matched) {
          setActiveMainView('bid_configurator');
        }
      }
    } catch (err) {
      console.error('Error loading commercial bid data:', err);
      setNotification({ type: 'error', message: 'Failed to load proposals or items from Supabase.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to reliably compute an item's dry / direct cost without falling into false 0 || fallback traps
  const getItemDirectCost = (item) => {
    if (item?.activity_responsibility === 'Client') return 0;
    if (item?.total_cost !== undefined && item?.total_cost !== null && !isNaN(Number(item?.total_cost))) {
      return Number(item.total_cost);
    }
    const qty = Number(item?.final_quantity ?? item?.quantity ?? 0);
    const unitCost = Number(item?.unit_cost ?? 0);
    return Number((qty * unitCost).toFixed(2));
  };

  // Helper to normalize any item's discipline strictly based on the 44 official BOQ Work Types
  const getItemDiscipline = (item) => {
    // 0. Primary Truth: If item has an explicit work_type from DB/BOQ builder, respect it!
    const directWt = (item?.work_type || '').toLowerCase().trim();
    if (directWt === 'electrical') return 'Electrical';
    if (directWt === 'mechanical') return 'Mechanical';
    if (directWt === 'civil' || directWt === 'finishing works' || directWt === 'finishes') return 'Civil';

    const resolvedName = resolveCategoryName(item);

    // 1. Official Electrical Work Types (7)
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

    // 2. Official Mechanical Work Types (22)
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
      resolvedName === 'Mechanical'
    ) {
      return 'Mechanical';
    }

    // 3. Official Civil Work Types (15)
    return 'Civil';
  };

  // Helper to resolve the granular work type name (e.g. "Reinforced Concrete", "Plain Concrete", "Water Filter")
  const getItemWorkTypeName = (item) => {
    return resolveCategoryName(item);
  };

  // Summarize Proposals with Direct Costs, Phases & Item Counts
  const proposalsSummaryList = useMemo(() => {
    return tendersList.map(t => {
      const pId = String(t.id);
      const phases = phasesList.filter(p => String(p.tender_log_id || p.linked_proposal || p.proposal_id) === pId);
      const phaseIds = new Set(phases.map(p => String(p.id)));
      
      const items = breakdownItems.filter(item => {
        const matchTender = String(item.tender_log_id || item.proposal_id) === pId;
        const matchPhase = item.phase_id && phaseIds.has(String(item.phase_id));
        return matchTender || matchPhase;
      });

      let civilCost = 0;
      let mechCost = 0;
      let elecCost = 0;

      items.forEach(item => {
        const cost = getItemDirectCost(item);
        const disc = getItemDiscipline(item);
        
        if (disc === 'Civil') civilCost += cost;
        else if (disc === 'Mechanical') mechCost += cost;
        else if (disc === 'Electrical') elecCost += cost;
      });

      const clientObj = clientsList.find(c => String(c.id) === String(t.client_id));
      const clientName = clientObj?.title || clientObj?.name || t.owner || 'Direct Client';

      return {
        ...t,
        clientName,
        phasesCount: phases.length,
        itemsCount: items.length,
        civilCost,
        mechCost,
        elecCost,
        totalDirectCost: civilCost + mechCost + elecCost
      };
    });
  }, [tendersList, phasesList, clientsList, breakdownItems]);

  // Filtered Proposals for Master Table
  const filteredProposalsSummary = useMemo(() => {
    return proposalsSummaryList.filter(p => {
      if (proposalsStatusFilter !== 'ALL' && p.proposal_status !== proposalsStatusFilter) {
        return false;
      }
      if (proposalsSearchQuery.trim()) {
        const q = proposalsSearchQuery.toLowerCase();
        const num = String(p.proposal_number || '').toLowerCase();
        const title = String(p.proposal_title || p.proposal_full_title || '').toLowerCase();
        const client = String(p.clientName || '').toLowerCase();
        if (!num.includes(q) && !title.includes(q) && !client.includes(q)) return false;
      }
      return true;
    });
  }, [proposalsSummaryList, proposalsStatusFilter, proposalsSearchQuery]);

  // Active Selected Tender Record
  const activeTender = useMemo(() => {
    return proposalsSummaryList.find(t => String(t.id) === String(selectedTenderId)) || null;
  }, [proposalsSummaryList, selectedTenderId]);

  // Phases of Selected Tender
  const tenderPhases = useMemo(() => {
    if (!selectedTenderId) return [];
    return phasesList.filter(p => String(p.tender_log_id || p.linked_proposal || p.proposal_id) === String(selectedTenderId));
  }, [phasesList, selectedTenderId]);

  // Active Tender BOQ Items
  const activeTenderBoq = useMemo(() => {
    if (!selectedTenderId) return [];
    const phaseIds = new Set(tenderPhases.map(p => String(p.id)));
    return breakdownItems.filter(item => {
      const matchTender = String(item.tender_log_id || item.proposal_id) === String(selectedTenderId);
      const matchPhase = item.phase_id && phaseIds.has(String(item.phase_id));
      return matchTender || matchPhase;
    });
  }, [breakdownItems, selectedTenderId, tenderPhases]);

  // Comprehensive Hierarchical Structure of Disciplines and Nested BOQ Work Types
  const disciplinesTree = useMemo(() => {
    const map = {
      Civil: { name: 'Civil', directCost: 0, itemsCount: 0, workTypesMap: {} },
      Mechanical: { name: 'Mechanical', directCost: 0, itemsCount: 0, workTypesMap: {} },
      Electrical: { name: 'Electrical', directCost: 0, itemsCount: 0, workTypesMap: {} }
    };

    activeTenderBoq.forEach(item => {
      const disc = getItemDiscipline(item);
      const wtName = getItemWorkTypeName(item);
      const cost = getItemDirectCost(item);

      if (!map[disc]) {
        map[disc] = { name: disc, directCost: 0, itemsCount: 0, workTypesMap: {} };
      }

      map[disc].directCost += cost;
      map[disc].itemsCount += 1;

      if (!map[disc].workTypesMap[wtName]) {
        map[disc].workTypesMap[wtName] = { name: wtName, discipline: disc, directCost: 0, itemsCount: 0 };
      }
      map[disc].workTypesMap[wtName].directCost += cost;
      map[disc].workTypesMap[wtName].itemsCount += 1;
    });

    const totalDirect = Object.values(map).reduce((sum, d) => sum + d.directCost, 0);

    return Object.values(map).map(d => {
      const workTypesList = Object.values(d.workTypesMap).sort((a, b) => b.directCost - a.directCost).map(wt => ({
        ...wt,
        shareOfDisciplinePct: d.directCost > 0 ? Number(((wt.directCost / d.directCost) * 100).toFixed(2)) : 0,
        shareOfTotalDirectPct: totalDirect > 0 ? Number(((wt.directCost / totalDirect) * 100).toFixed(2)) : 0
      }));

      return {
        ...d,
        sharePct: totalDirect > 0 ? Number(((d.directCost / totalDirect) * 100).toFixed(2)) : 0,
        workTypes: workTypesList
      };
    });
  }, [activeTenderBoq]);

  const totalDirectCost = useMemo(() => {
    return disciplinesTree.reduce((sum, d) => sum + d.directCost, 0);
  }, [disciplinesTree]);

  // Project Total Duration Calculation (derived strictly from proposal duration, BOQ days_to_complete, or manual override)
  const wholeProjectDuration = useMemo(() => {
    if (!activeTender) {
      return { days: 0, months: 0, maxDays: 0, sumDays: 0 };
    }
    let maxDays = 0;
    let sumDays = 0;
    activeTenderBoq.forEach(item => {
      const d = Number(item.days_to_complete || item.days || 0);
      if (d > maxDays) maxDays = d;
      sumDays += d;
    });
    const effectiveDays = Number(globalFinancialConfig.customProjectDurationDays) > 0
      ? Number(globalFinancialConfig.customProjectDurationDays)
      : (Number(activeTender?.proposal_duration) > 0 ? Number(activeTender.proposal_duration) : maxDays);
    const months = effectiveDays > 0 ? Number((effectiveDays / 30).toFixed(2)) : 0;
    return {
      days: effectiveDays,
      months,
      maxDays,
      sumDays
    };
  }, [activeTenderBoq, activeTender, globalFinancialConfig.customProjectDurationDays]);

  // Dynamic Site Staff Salary Calculation Engine: Daily Salary × Project Days × Allocation %
  const staffCalculationSummary = useMemo(() => {
    const defaultProjectDays = wholeProjectDuration.days ?? 0;

    let activeStaffCount = 0;
    let totalDailyRateSum = 0;
    let totalProjectStaffCost = 0;

    const detailedStaff = siteStaffRoster.map(s => {
      const monthly = Number(s.monthlySalary) || 0;
      // Salary per day from company record or calculated from 25 monthly working days
      const daily = Number(s.dailySalary) > 0 
        ? Number(s.dailySalary) 
        : Number((monthly / 25).toFixed(2));
      
      // Number of days on project (defaults to tender project duration)
      const projectDays = Number(s.customDays) > 0 ? Number(s.customDays) : defaultProjectDays;
      const alloc = Number(s.allocationPct ?? 100) / 100;
      
      // Total Salary of Person = Daily Salary × Days of Project Duration × (Allocation % / 100)
      const totalStaffCost = s.activeOnProject 
        ? Number((daily * projectDays * alloc).toFixed(2))
        : 0;

      if (s.activeOnProject) {
        activeStaffCount += 1;
        totalDailyRateSum += (daily * alloc);
        totalProjectStaffCost += totalStaffCost;
      }

      return {
        ...s,
        daily,
        projectDays,
        totalStaffCost
      };
    });

    return {
      activeStaffCount,
      totalDailyRateSum: Number(totalDailyRateSum.toFixed(2)),
      totalProjectStaffCost: Number(totalProjectStaffCost.toFixed(2)),
      detailedStaff
    };
  }, [siteStaffRoster, wholeProjectDuration]);

  // Head Office (Non-Site Staff) Pool Calculation Engine
  // Calculates exact days based on project duration (e.g. 60 days -> 6 days, 25 days -> 2.5 days)
  // Strictly excludes all selected direct site staff members to prevent double counting
  const headOfficeStaffPoolSummary = useMemo(() => {
    const projectDays = wholeProjectDuration.days ?? 0;
    const daysBasis = globalFinancialConfig.headOfficeDaysPerMonthBasis ?? 3;
    const handling = globalFinancialConfig.headOfficeDurationHandling || 'exact_prorata';
    
    // Set of IDs / codes of employees assigned direct to the site
    const activeSiteStaffIds = new Set(
      siteStaffRoster.filter(s => s.activeOnProject).map(s => String(s.code || s.id))
    );

    let totalCompanyStaffCount = COMPANY_EMPLOYEES_DIRECTORY.length;
    let headOfficeStaffCount = 0;
    let headOfficeTotalMonthlyPayroll = 0;
    let headOfficeTotalDailyPayroll = 0;

    COMPANY_EMPLOYEES_DIRECTORY.forEach(emp => {
      const isSiteStaff = activeSiteStaffIds.has(String(emp.code)) || activeSiteStaffIds.has(String(emp.id));
      if (!isSiteStaff) {
        headOfficeStaffCount += 1;
        const monthly = Number(emp.monthlySalary) || 0;
        const daily = Number(emp.dailySalary) > 0 ? Number(emp.dailySalary) : Number((monthly / 25).toFixed(2));
        headOfficeTotalMonthlyPayroll += monthly;
        headOfficeTotalDailyPayroll += daily;
      }
    });

    // Calculate Total Applied Days for Head Office Staff
    // Rule: 3 days per 30 days of project (10% of project duration)
    // e.g. 60 days -> 6 days; 25 days -> 2.5 days
    let totalHoDaysApplied = projectDays > 0 ? Number(((projectDays / 30) * daysBasis).toFixed(2)) : 0;
    
    if (projectDays > 0 && handling === 'min_1_month_floor') {
      totalHoDaysApplied = Math.max(daysBasis, totalHoDaysApplied);
    } else if (projectDays > 0 && handling === 'custom_days' && Number(globalFinancialConfig.headOfficeCustomDays) > 0) {
      totalHoDaysApplied = Number(globalFinancialConfig.headOfficeCustomDays);
    }

    const headOfficeTotalProjectCost = Number((headOfficeTotalDailyPayroll * totalHoDaysApplied).toFixed(2));

    return {
      totalCompanyStaffCount,
      excludedSiteStaffCount: activeSiteStaffIds.size,
      headOfficeStaffCount,
      headOfficeTotalMonthlyPayroll: Number(headOfficeTotalMonthlyPayroll.toFixed(2)),
      headOfficeTotalDailyPayroll: Number(headOfficeTotalDailyPayroll.toFixed(2)),
      daysBasis,
      totalHoDaysApplied,
      handling,
      headOfficeTotalProjectCost
    };
  }, [siteStaffRoster, wholeProjectDuration, globalFinancialConfig.headOfficeDaysPerMonthBasis, globalFinancialConfig.headOfficeDurationHandling, globalFinancialConfig.headOfficeCustomDays]);

  // Dynamic 9-Item Mobilization Calculation Engine
  const mobilizationCalculationSummary = useMemo(() => {
    const staffCount = staffCalculationSummary.activeStaffCount;
    const overrides = globalFinancialConfig.mobilizationCustomOverrides || {};

    const pmCaravanAuto = staffCount > 0 ? 1 : 0;
    const staffCaravansAuto = Math.max(0, Math.ceil((staffCount - 1) / 5));

    const pmOv = overrides['42ff9558-d0cc-4f42-9a09-76fd98b7ab41'] || {};
    const pmActive = pmOv.active !== undefined ? pmOv.active : true;
    const pmEffectiveQty = pmActive ? (pmOv.customQty !== undefined ? Number(pmOv.customQty) : pmCaravanAuto) : 0;

    const staffCaravanOv = overrides['931132b7-4753-48f9-8512-d234925df0cf'] || {};
    const staffCaravanActive = staffCaravanOv.active !== undefined ? staffCaravanOv.active : true;
    const staffCaravanEffectiveQty = staffCaravanActive ? (staffCaravanOv.customQty !== undefined ? Number(staffCaravanOv.customQty) : staffCaravansAuto) : 0;

    const acAuto = pmEffectiveQty + staffCaravanEffectiveQty;
    const pmDeskAuto = staffCount > 0 ? 1 : 0;
    const pmChairAuto = staffCount > 0 ? 1 : 0;
    const staffDesksAuto = Math.max(0, staffCount - 1);
    const meetingTableAuto = staffCount > 0 ? 1 : 0;
    const meetingChairsAuto = staffCount > 0 ? 12 : 0;
    const warehouseAuto = 1;

    let totalCalculatedCost = 0;
    let totalCaravansCount = 0;
    let actualAcCount = 0;

    const detailedItems = MOBILIZATION_ITEMS_TEMPLATE.map(item => {
      const ov = overrides[item.id] || {};
      const active = ov.active !== undefined ? ov.active : true;
      const unitRate = ov.customRate !== undefined ? Number(ov.customRate) : item.defaultRate;

      let autoQty = 0;
      switch (item.formulaType) {
        case 'pm_caravan':
          autoQty = pmCaravanAuto;
          break;
        case 'staff_caravans':
          autoQty = staffCaravansAuto;
          break;
        case 'air_conditions':
          autoQty = acAuto;
          break;
        case 'pm_desk':
          autoQty = pmDeskAuto;
          break;
        case 'pm_chair':
          autoQty = pmChairAuto;
          break;
        case 'staff_desks':
          autoQty = staffDesksAuto;
          break;
        case 'meeting_table':
          autoQty = meetingTableAuto;
          break;
        case 'meeting_chairs':
          autoQty = meetingChairsAuto;
          break;
        case 'warehouses':
          autoQty = warehouseAuto;
          break;
        default:
          autoQty = 1;
      }

      const quantity = ov.customQty !== undefined ? Number(ov.customQty) : autoQty;
      const lineTotal = active ? Number((quantity * unitRate).toFixed(2)) : 0;

      if (active) {
        totalCalculatedCost += lineTotal;
        if (item.formulaType === 'pm_caravan' || item.formulaType === 'staff_caravans') {
          totalCaravansCount += quantity;
        }
        if (item.formulaType === 'air_conditions') {
          actualAcCount += quantity;
        }
      }

      return {
        ...item,
        autoQty,
        quantity,
        unitRate,
        lineTotal,
        active,
        isCustomQty: ov.customQty !== undefined,
        isCustomRate: ov.customRate !== undefined
      };
    });

    return {
      staffCount,
      totalCaravansCount,
      acCount: actualAcCount,
      totalCalculatedCost: Number(totalCalculatedCost.toFixed(2)),
      detailedItems
    };
  }, [staffCalculationSummary.activeStaffCount, globalFinancialConfig.mobilizationCustomOverrides]);

  // Master Comprehensive Calculation Engine across All Disciplines, Preliminaries & Adders
  const calculatedFinancials = useMemo(() => {
    const cfg = globalFinancialConfig;
    const directTotal = totalDirectCost;
    const hasDirectScope = Boolean(activeTender && directTotal > 0);
    const durationMonths = wholeProjectDuration.months ?? 0;
    const projectDays = wholeProjectDuration.days ?? 0;
    const activeStaffCount = staffCalculationSummary.activeStaffCount;

    if (!hasDirectScope) {
      const zeroWorkTypeBreakdown = {};
      const zeroDisciplineBreakdown = {};
      disciplinesTree.forEach(disc => {
        zeroDisciplineBreakdown[disc.name] = {
          ...disc,
          discBaseCost: 0,
          discProfit: 0,
          discEffectiveMargin: 0,
          discWithProfit: 0,
          discBidPrice: 0,
          discMultiplier: 1.0
        };
        disc.workTypes.forEach(wt => {
          zeroWorkTypeBreakdown[wt.name] = {
            ...wt,
            wtBaseCost: 0,
            marginPct: Number(workTypeSpecificMargins[wt.name] ?? disciplineMargins[disc.name] ?? DEFAULT_DISCIPLINE_MARGINS[disc.name] ?? 18.0),
            profitAmt: 0,
            wtWithProfit: 0,
            wtBidPrice: 0,
            wtMultiplier: 1.0
          };
        });
      });

      const payGuarRate = Number(cfg.paymentGuaranteePct || 0) / 100;
      const finalGuarRate = Number(cfg.finalGuaranteePct || 0) / 100;
      const finInterestRate = Number(cfg.financingInterestPct || 0) / 100;
      const socialInsRate = Number(cfg.socialInsurancePct || 0) / 100;
      const salesCommRate = Number(cfg.salesCommissionPct || 0) / 100;
      const totalDivisorRate = payGuarRate + finalGuarRate + finInterestRate + socialInsRate + salesCommRate;

      return {
        totalIndirectPct: 0,
        escalationAmt: 0,
        equipMaintAmt: 0,
        totalReservesCost: 0,
        primaryLgIssuanceFee: 0,
        performanceLgIssuanceFee: 0,
        advanceLgIssuanceFee: 0,
        withholdingTaxAmt: 0,
        allRiskInsuranceAmt: 0,
        totalGuaranteesCost: 0,
        totalDivisorPct: Number((totalDivisorRate * 100).toFixed(2)),
        totalDivisorRate,
        directTotal: 0,
        matTransAmt: 0,
        engAmt: 0,
        mobAmt: 0,
        tempWaterAmt: 0,
        tempPowerAmt: 0,
        siteOfficeAmt: 0,
        stationaryAmt: 0,
        safetyAmt: 0,
        accommAmt: 0,
        salariesAmt: 0,
        rawHeadOffAmt: 0,
        headOffDeduction: 0,
        headOffAmt: 0,
        techServAmt: 0,
        totalIndirectCost: 0,
        totalDirectAndIndirect: 0,
        contingencyAmt: 0,
        managementAmt: 0,
        guarantyAmt: 0,
        totalReserves: 0,
        totalDirectIndirectAndReserves: 0,
        workTypeBreakdown: zeroWorkTypeBreakdown,
        disciplineBreakdown: zeroDisciplineBreakdown,
        totalProfitAmount: 0,
        weightedAvgMarginPct: 0,
        totalWithProfit: 0,
        subtotalBeforeCommission: 0,
        salesCommAmt: 0,
        payGuarAmt: 0,
        finalGuarAmt: 0,
        finInterestAmt: 0,
        socialInsAmt: 0,
        finalBidPrice: 0,
        grossProfit: 0,
        corporateTaxesAmt: 0,
        netProfit: 0,
        globalMarkupMultiplier: 1.0
      };
    }

    // 1. Compute 12 Indirect Items
    const matTransAmt = Number((directTotal * (cfg.materialTransportationPct / 100)).toFixed(2));
    const engAmt = Number((directTotal * (cfg.engineeringPct / 100)).toFixed(2));
    
    // Site Mobilization & Demobilization (Item 3)
    let mobAmt = 0;
    if (cfg.mobilizationMode === 'percentage') {
      mobAmt = Number((directTotal * (cfg.mobilizationPct / 100)).toFixed(2));
    } else if (cfg.mobilizationMode === 'fixed') {
      mobAmt = Number(cfg.mobilizationFixedAmt || 0);
    } else {
      // Default: Itemized 9-Item Mobilization & Site Office Roster
      mobAmt = mobilizationCalculationSummary.totalCalculatedCost;
    }

    const tempWaterAmt = Number((directTotal * (cfg.tempWaterPct / 100)).toFixed(2));
    const tempPowerAmt = Number((directTotal * (cfg.tempPowerPct / 100)).toFixed(2));
    const siteOfficeAmt = Number((directTotal * (cfg.contractorSiteOfficePct / 100)).toFixed(2));
    const stationaryAmt = Number((directTotal * (cfg.stationaryCopyingPct / 100)).toFixed(2));

    // Safety Facilities & HSE
    let safetyAmt = 0;
    if (cfg.safetyFacilitiesMode === 'calculated') {
      const ppeCost = activeStaffCount * cfg.safetyPpePerStaffMonthly * durationMonths;
      safetyAmt = Number((ppeCost + cfg.safetySignageAndFirstAid).toFixed(2));
    } else if (cfg.safetyFacilitiesMode === 'fixed') {
      safetyAmt = Number(cfg.safetyFacilitiesFixedAmt || 0);
    } else {
      safetyAmt = Number((directTotal * (cfg.safetyFacilitiesPct / 100)).toFixed(2));
    }

    // Company Accommodation & Living
    let accommAmt = 0;
    if (cfg.companyAccommodationMode === 'calculated') {
      const rentCost = activeStaffCount * cfg.accommodationRentMonthlyPerStaff * durationMonths;
      const foodCost = activeStaffCount * cfg.dailySubsistenceAllowancePerStaff * projectDays;
      const vehicleCost = cfg.siteVehiclesCount * cfg.siteVehiclesMonthlyFuelAndMaintenance * durationMonths;
      accommAmt = Number((rentCost + foodCost + vehicleCost).toFixed(2));
    } else if (cfg.companyAccommodationMode === 'fixed') {
      accommAmt = Number(cfg.companyAccommodationFixedAmt || 0);
    } else {
      accommAmt = Number((directTotal * (cfg.companyAccommodationPct / 100)).toFixed(2));
    }

    // Site Staff Salaries (From Staff Table vs Percentage vs Fixed)
    let salariesAmt = 0;
    if (cfg.salariesSiteStaffMode === 'staff_table') {
      salariesAmt = staffCalculationSummary.totalProjectStaffCost;
    } else if (cfg.salariesSiteStaffMode === 'fixed') {
      salariesAmt = Number(cfg.salariesSiteStaffFixedAmt || 0);
    } else {
      salariesAmt = Number((directTotal * (cfg.salariesSiteStaffPct / 100)).toFixed(2));
    }

    const techServAmt = Number((directTotal * (cfg.technicalServicesPct / 100)).toFixed(2));

    // Head Office G&A (Item 12)
    const rawHeadOffAmt = Number((directTotal * (cfg.headOfficePct / 100)).toFixed(2));
    let headOffAmt = 0;
    let headOffDeduction = 0;
    
    if (cfg.headOfficeCalculationMode === 'percentage') {
      headOffAmt = rawHeadOffAmt;
      headOffDeduction = 0;
    } else {
      // Days Pool Mode
      headOffAmt = headOfficeStaffPoolSummary.headOfficeTotalProjectCost;
      headOffDeduction = 0;
    }

    const totalIndirectCost = Number((matTransAmt + engAmt + mobAmt + tempWaterAmt + tempPowerAmt + siteOfficeAmt + stationaryAmt + safetyAmt + accommAmt + salariesAmt + techServAmt + headOffAmt).toFixed(2));
    const totalDirectAndIndirect = Number((directTotal + totalIndirectCost).toFixed(2));

    // 2. Compute 3 Reserves Items
    const contingencyAmt = Number((totalDirectAndIndirect * (cfg.contingencyReservesPct / 100)).toFixed(2));
    const managementAmt = Number((totalDirectAndIndirect * (cfg.managementReservesPct / 100)).toFixed(2));
    const guarantyAmt = Number((totalDirectAndIndirect * (cfg.guaranty1YearPct / 100)).toFixed(2));

    const escalationAmt = managementAmt;
    const equipMaintAmt = guarantyAmt;
    const totalReservesCost = Number((contingencyAmt + managementAmt + guarantyAmt).toFixed(2));
    const totalReserves = totalReservesCost;
    const totalDirectIndirectAndReserves = Number((totalDirectAndIndirect + totalReserves).toFixed(2));
    const totalIndirectPct = directTotal > 0 ? Number(((totalIndirectCost / directTotal) * 100).toFixed(2)) : 0;

    // 3. Compute Granular Work-Type Profit Margins and Multipliers
    const workTypeBreakdown = {};
    const disciplineBreakdown = {};
    let totalProfitAmount = 0;

    disciplinesTree.forEach(disc => {
      let discProfit = 0;
      let discBaseCost = 0;

      disc.workTypes.forEach(wt => {
        const wtShare = directTotal > 0 ? wt.directCost / directTotal : 0;
        const wtBaseCost = Number((wt.directCost + wtShare * (totalIndirectCost + totalReserves)).toFixed(2));
        
        const defaultDiscMargin = disciplineMargins[disc.name] ?? DEFAULT_DISCIPLINE_MARGINS[disc.name] ?? 18.0;
        const marginPct = Number(workTypeSpecificMargins[wt.name] ?? defaultDiscMargin);
        const profitAmt = Number((wtBaseCost * (marginPct / 100)).toFixed(2));
        const wtWithProfit = Number((wtBaseCost + profitAmt).toFixed(2));

        discProfit += profitAmt;
        discBaseCost += wtBaseCost;
        totalProfitAmount += profitAmt;

        workTypeBreakdown[wt.name] = {
          ...wt,
          wtBaseCost,
          marginPct,
          profitAmt,
          wtWithProfit
        };
      });

      const discWithProfit = Number((discBaseCost + discProfit).toFixed(2));
      const discEffectiveMargin = discBaseCost > 0 ? Number(((discProfit / discBaseCost) * 100).toFixed(2)) : 0;

      disciplineBreakdown[disc.name] = {
        ...disc,
        discBaseCost,
        discProfit,
        discEffectiveMargin,
        discWithProfit
      };
    });

    const totalWithProfit = Number((totalDirectIndirectAndReserves + totalProfitAmount).toFixed(2));
    const weightedAvgMarginPct = totalDirectIndirectAndReserves > 0 
      ? Number(((totalProfitAmount / totalDirectIndirectAndReserves) * 100).toFixed(2)) 
      : 0;

    // 4 & 5. Exact AppSheet Spreadsheet Formula Engine:
    // BH2 = Total with Profit = (Direct + Indirect + Reserves) + Profit Margin
    // Sum of Divisor Pct = BQ2(Social Ins) + BO2(Financing) + BM2(Final LG) + BK2(Payment LG) + BI2(Sales Comm)
    // BS2 = Final Bid Price = (BH2 + Marketing) / (1 - Sum of Divisor Pct)
    const payGuarRate = Number(cfg.paymentGuaranteePct || 0) / 100;
    const finalGuarRate = Number(cfg.finalGuaranteePct || 0) / 100;
    const finInterestRate = Number(cfg.financingInterestPct || 0) / 100;
    const socialInsRate = Number(cfg.socialInsurancePct || 0) / 100;
    const salesCommRate = Number(cfg.salesCommissionPct || 0) / 100;

    const totalDivisorRate = payGuarRate + finalGuarRate + finInterestRate + socialInsRate + salesCommRate;
    const totalDivisorPct = Number((totalDivisorRate * 100).toFixed(2));

    const totalWithProfitPlusMarketing = Number((totalWithProfit + (Number(cfg.marketingAllowanceAmt) || 0)).toFixed(2));

    let finalBidPrice = 0;
    let payGuarAmt = 0;
    let finalGuarAmt = 0;
    let finInterestAmt = 0;
    let socialInsAmt = 0;
    let salesCommAmt = 0;

    if (cfg.salesCommissionMode === 'selling_price_divisor') {
      // Exact Spreadsheet Formula: BS2 = BH2 / (1 - (BQ2 + BO2 + BM2 + BK2 + BI2))
      if (totalDivisorRate < 1) {
        finalBidPrice = Number((totalWithProfitPlusMarketing / (1 - totalDivisorRate)).toFixed(2));
      } else {
        finalBidPrice = totalWithProfitPlusMarketing;
      }
      payGuarAmt = Number((finalBidPrice * payGuarRate).toFixed(2));
      finalGuarAmt = Number((finalBidPrice * finalGuarRate).toFixed(2));
      finInterestAmt = Number((finalBidPrice * finInterestRate).toFixed(2));
      socialInsAmt = Number((finalBidPrice * socialInsRate).toFixed(2));
      salesCommAmt = Number((finalBidPrice * salesCommRate).toFixed(2));
    } else {
      // Cost Markup Mode Fallback
      payGuarAmt = Number((totalWithProfit * payGuarRate).toFixed(2));
      finalGuarAmt = Number((totalWithProfit * finalGuarRate).toFixed(2));
      finInterestAmt = Number((totalWithProfit * finInterestRate).toFixed(2));
      socialInsAmt = Number((directTotal * socialInsRate).toFixed(2));
      salesCommAmt = Number((totalWithProfit * salesCommRate).toFixed(2));
      finalBidPrice = Number((totalWithProfitPlusMarketing + payGuarAmt + finalGuarAmt + finInterestAmt + socialInsAmt + salesCommAmt).toFixed(2));
    }

    const subtotalBeforeCommission = Number((totalWithProfit + payGuarAmt + finalGuarAmt + finInterestAmt + socialInsAmt + (cfg.marketingAllowanceAmt || 0)).toFixed(2));

    // 6. Multipliers for individual work types & disciplines (allocated by post-profit share)
    const globalMarkupMultiplier = directTotal > 0 ? Number((finalBidPrice / directTotal).toFixed(4)) : 1.0;

    disciplinesTree.forEach(disc => {
      const discInfo = disciplineBreakdown[disc.name];
      const discShareOfWithProfit = totalWithProfit > 0 ? (discInfo.discWithProfit / totalWithProfit) : (directTotal > 0 ? disc.directCost / directTotal : 0);
      const discBidPrice = directTotal > 0 ? Number((finalBidPrice * discShareOfWithProfit).toFixed(2)) : 0;
      const discMultiplier = disc.directCost > 0 ? Number((discBidPrice / disc.directCost).toFixed(4)) : globalMarkupMultiplier;
      disciplineBreakdown[disc.name] = { ...discInfo, discBidPrice, discMultiplier };

      disc.workTypes.forEach(wt => {
        const wtInfo = workTypeBreakdown[wt.name];
        const wtShareOfWithProfit = totalWithProfit > 0 ? (wtInfo.wtWithProfit / totalWithProfit) : (directTotal > 0 ? wt.directCost / directTotal : 0);
        const wtBidPrice = directTotal > 0 ? Number((finalBidPrice * wtShareOfWithProfit).toFixed(2)) : 0;
        const wtMultiplier = wt.directCost > 0 ? Number((wtBidPrice / wt.directCost).toFixed(4)) : globalMarkupMultiplier;
        workTypeBreakdown[wt.name] = { ...wtInfo, wtBidPrice, wtMultiplier };
      });
    });

    // 7. Tier 6: Taxes & Net Profit
    const grossProfit = totalProfitAmount;
    const corporateTaxesAmt = Number((grossProfit * (cfg.corporateTaxesPct / 100)).toFixed(2));
    const netProfit = Number((grossProfit - corporateTaxesAmt).toFixed(2));

    const primaryLgIssuanceFee = Number(((finalBidPrice * ((cfg.primaryBidBondLgPct ?? 1.0) / 100)) * ((cfg.primaryBidBondLgIssuanceFeePctPerYear ?? 0.5) / 100) * ((durationMonths || 1) / 12)).toFixed(2));
    const performanceLgIssuanceFee = Number(((finalBidPrice * ((cfg.performanceLgPct ?? 5.0) / 100)) * ((cfg.performanceLgIssuanceFeePctPerYear ?? 0.75) / 100) * ((durationMonths || 1) / 12)).toFixed(2));
    const advanceLgIssuanceFee = Number(((finalBidPrice * ((cfg.advancePaymentLgPct ?? 10.0) / 100)) * ((cfg.advancePaymentLgIssuanceFeePctPerYear ?? 0.75) / 100) * ((durationMonths || 1) / 12)).toFixed(2));
    const withholdingTaxAmt = Number((finalBidPrice * ((cfg.withholdingTaxPct ?? 1.0) / 100)).toFixed(2));
    const allRiskInsuranceAmt = Number((finalBidPrice * ((cfg.allRiskInsurancePct ?? 0.5) / 100)).toFixed(2));
    const totalGuaranteesCost = Number((primaryLgIssuanceFee + performanceLgIssuanceFee + advanceLgIssuanceFee + withholdingTaxAmt + allRiskInsuranceAmt).toFixed(2));

    return {
      totalIndirectPct,
      escalationAmt,
      equipMaintAmt,
      totalReservesCost,
      primaryLgIssuanceFee,
      performanceLgIssuanceFee,
      advanceLgIssuanceFee,
      withholdingTaxAmt,
      allRiskInsuranceAmt,
      totalGuaranteesCost,
      totalDivisorPct,
      totalDivisorRate,
      directTotal,
      matTransAmt,
      engAmt,
      mobAmt,
      tempWaterAmt,
      tempPowerAmt,
      siteOfficeAmt,
      stationaryAmt,
      safetyAmt,
      accommAmt,
      salariesAmt,
      rawHeadOffAmt,
      headOffDeduction,
      headOffAmt,
      techServAmt,
      totalIndirectCost,
      totalDirectAndIndirect,
      contingencyAmt,
      managementAmt,
      guarantyAmt,
      totalReserves,
      totalDirectIndirectAndReserves,
      workTypeBreakdown,
      disciplineBreakdown,
      totalProfitAmount,
      weightedAvgMarginPct,
      totalWithProfit,
      subtotalBeforeCommission,
      salesCommAmt,
      payGuarAmt,
      finalGuarAmt,
      finInterestAmt,
      socialInsAmt,
      finalBidPrice,
      grossProfit,
      corporateTaxesAmt,
      netProfit,
      globalMarkupMultiplier
    };
  }, [activeTender, totalDirectCost, globalFinancialConfig, disciplineMargins, workTypeSpecificMargins, disciplinesTree, wholeProjectDuration, staffCalculationSummary, headOfficeStaffPoolSummary, mobilizationCalculationSummary]);

  // PHASES BREAKDOWN: Displays each Phase by name (e.g. Swimming Pool 01, Pump Room 01)
  const phasesBreakdown = useMemo(() => {
    if (!tenderPhases || tenderPhases.length === 0) return [];

    const totalTenderDirect = calculatedFinancials.directTotal || 1;

    return tenderPhases.map((phase, pIdx) => {
      const phaseItems = activeTenderBoq.filter(item => String(item.phase_id) === String(phase.id));
      
      let phaseCivilCost = 0;
      let phaseMechCost = 0;
      let phaseElecCost = 0;
      let phaseMaxDays = 0;
      let phaseRawBidPrice = 0;

      phaseItems.forEach(item => {
        const disc = getItemDiscipline(item);
        const wtName = getItemWorkTypeName(item);
        const cost = getItemDirectCost(item);
        const days = Number(item.days_to_complete || item.days || 0);

        if (days > phaseMaxDays) phaseMaxDays = days;

        if (disc === 'Civil') phaseCivilCost += cost;
        else if (disc === 'Mechanical') phaseMechCost += cost;
        else if (disc === 'Electrical') phaseElecCost += cost;

        const wtMult = calculatedFinancials.workTypeBreakdown[wtName]?.wtMultiplier
          || calculatedFinancials.disciplineBreakdown[disc]?.discMultiplier
          || calculatedFinancials.globalMarkupMultiplier;
        phaseRawBidPrice += cost * wtMult;
      });

      const phaseDirectCost = phaseCivilCost + phaseMechCost + phaseElecCost;
      const phaseBidPrice = Number(phaseRawBidPrice.toFixed(2));
      const phaseMultiplier = phaseDirectCost > 0 ? Number((phaseBidPrice / phaseDirectCost).toFixed(4)) : 1.0;
      const phaseShareOfTotalPct = totalTenderDirect > 0 ? Number(((phaseDirectCost / totalTenderDirect) * 100).toFixed(2)) : 0;
      const phaseDurationDays = phaseMaxDays;

      return {
        id: phase.id,
        phaseIndex: pIdx + 1,
        title: phase.phase_title || phase.phase_full_title || `Phase ${pIdx + 1}`,
        scopeOfWork: phase.scope_of_work,
        itemsCount: phaseItems.length,
        durationDays: phaseDurationDays,
        civilCost: phaseCivilCost,
        mechCost: phaseMechCost,
        elecCost: phaseElecCost,
        directCost: phaseDirectCost,
        phaseBidPrice,
        phaseMultiplier,
        phaseShareOfTotalPct
      };
    });
  }, [tenderPhases, activeTenderBoq, calculatedFinancials]);

  // Marked-Up Client BOQ Items with Work-Type Specific Multipliers
  const clientBoqItems = useMemo(() => {
    return activeTenderBoq.map(item => {
      const isClientSupplied = item?.activity_responsibility === 'Client';
      const rawQty = item.final_quantity ?? item.quantity;
      const qty = rawQty !== undefined && rawQty !== null && !isNaN(Number(rawQty)) ? Number(rawQty) : 1;
      const directTotalCost = getItemDirectCost(item);
      const rawUnitCost = Number(item.unit_cost || 0);
      const directUnitCost = isClientSupplied
        ? 0
        : (rawUnitCost > 0 ? rawUnitCost : (qty > 0 ? Number((directTotalCost / qty).toFixed(2)) : 0));
      
      const discipline = getItemDiscipline(item);
      const workTypeName = getItemWorkTypeName(item);

      const wtInfo = calculatedFinancials.workTypeBreakdown[workTypeName];
      const discInfo = calculatedFinancials.disciplineBreakdown[discipline];
      const multiplier = wtInfo?.wtMultiplier || discInfo?.discMultiplier || calculatedFinancials.globalMarkupMultiplier;

      const clientUnitRate = isClientSupplied ? 0 : Number((directUnitCost * multiplier).toFixed(2));
      const clientTotalAmount = isClientSupplied ? 0 : Number((clientUnitRate * qty).toFixed(2));
      const profitContribution = Number((clientTotalAmount - directTotalCost).toFixed(2));
      const marginPct = clientTotalAmount > 0 ? Number(((profitContribution / clientTotalAmount) * 100).toFixed(1)) : 0;

      return {
        ...item,
        discipline,
        workTypeName,
        directUnitCost,
        directTotalCost,
        multiplier,
        clientUnitRate,
        clientTotalAmount,
        profitContribution,
        marginPct
      };
    });
  }, [activeTenderBoq, calculatedFinancials]);

  // Filtered BOQ items for display in rate sheet
  const filteredClientBoqItems = useMemo(() => {
    return clientBoqItems.filter(item => {
      if (activeWorkTypeTab !== 'ALL' && item.discipline !== activeWorkTypeTab) {
        return false;
      }
      if (selectedSpecificCategoryFilter !== 'ALL' && item.workTypeName !== selectedSpecificCategoryFilter) {
        return false;
      }
      if (selectedPhaseFilter !== 'ALL' && String(item.phase_id) !== String(selectedPhaseFilter)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = String(STATIC_ITEMS_LOOKUP[item.item] || item.item_name || item.fallbackName || item.item || '').toLowerCase();
        const cat = String(item.workTypeName || '').toLowerCase();
        if (!name.includes(q) && !cat.includes(q)) return false;
      }
      return true;
    });
  }, [clientBoqItems, activeWorkTypeTab, selectedSpecificCategoryFilter, selectedPhaseFilter, searchQuery]);

  // Toggle Collapse on Scope in Table
  const toggleScopeCollapse = (scopeName) => {
    setCollapsedScopes(prev => ({
      ...prev,
      [scopeName]: !prev[scopeName]
    }));
  };

  // Update a field in global financial parameters
  const handleGlobalFieldChange = (field, value) => {
    setGlobalFinancialConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update discipline level margin %
  const handleDisciplineMarginChange = (discName, value) => {
    setDisciplineMargins(prev => ({
      ...prev,
      [discName]: value
    }));
  };

  // Update granular work type margin %
  const handleWorkTypeMarginChange = (wtName, value) => {
    setWorkTypeSpecificMargins(prev => ({
      ...prev,
      [wtName]: value
    }));
  };

  // Update Staff Member in Roster
  const handleUpdateStaffMember = (id, field, value) => {
    setSiteStaffRoster(prev => prev.map(staff => {
      if (staff.id === id) {
        return { ...staff, [field]: value };
      }
      return staff;
    }));
  };

  // Add Employee from Company Directory
  const handleAddEmployeeFromDirectory = (emp) => {
    const exists = siteStaffRoster.find(s => s.code === emp.code || s.id === emp.id);
    if (exists) {
      // If already exists, activate them
      setSiteStaffRoster(prev => prev.map(s => (s.id === exists.id ? { ...s, activeOnProject: true } : s)));
      setNotification({
        type: 'info',
        message: `${emp.name} is already in the roster and has been marked active on this project.`
      });
    } else {
      const newStaff = {
        id: emp.id,
        code: emp.code,
        name: emp.name,
        jobTitle: emp.jobTitle,
        department: emp.department,
        monthlySalary: emp.monthlySalary,
        dailySalary: emp.dailySalary,
        activeOnProject: true,
        allocationPct: 100,
        notes: `Assigned from ${emp.department} Dept`
      };
      setSiteStaffRoster(prev => [...prev, newStaff]);
      setNotification({
        type: 'success',
        message: `Added ${emp.name} (${emp.jobTitle}) to project direct site staff.`
      });
    }
    setTimeout(() => setNotification(null), 3000);
  };

  // Add New Custom Staff Member
  const handleAddCustomStaff = () => {
    const newStaff = {
      id: `custom_${Date.now()}`,
      code: 'NEW',
      name: 'Custom Site Position',
      jobTitle: 'Site Engineer / Supervisor',
      department: 'Construction',
      monthlySalary: 25000,
      dailySalary: 1000,
      activeOnProject: true,
      allocationPct: 100,
      notes: 'Custom project position'
    };
    setSiteStaffRoster(prev => [...prev, newStaff]);
  };

  // Remove Staff Member
  const handleRemoveStaff = (id) => {
    setSiteStaffRoster(prev => prev.filter(s => s.id !== id));
  };

  // Action: Apply discipline margin to all its sub work-types
  const handleApplyDisciplineMarginToAllWorkTypes = (discName, marginValue) => {
    const discObj = disciplinesTree.find(d => d.name === discName);
    if (!discObj) return;

    setDisciplineMargins(prev => ({ ...prev, [discName]: marginValue }));
    setWorkTypeSpecificMargins(prev => {
      const updated = { ...prev };
      discObj.workTypes.forEach(wt => {
        updated[wt.name] = marginValue;
      });
      return updated;
    });

    setNotification({
      type: 'success',
      message: `Applied ${marginValue}% profit margin to all work types in ${discName} scope.`
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Action: Select a proposal from table and jump to configurator
  const handleSelectProposalToCreateBid = (proposalId) => {
    setSelectedTenderId(proposalId);
    setActiveMainView('bid_configurator');
    const selected = tendersList.find(t => String(t.id) === String(proposalId));
    setNotification({
      type: 'success',
      message: `Loaded proposal "${selected?.proposal_number || 'TND'} - ${selected?.proposal_title || ''}". Ready to configure work-type profit margins & overheads.`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Save Settings to Supabase Tender Record
  const handleSaveCommercialSettings = async () => {
    if (!selectedTenderId) return;
    setIsSaving(true);
    try {
      const summaryNotes = `[Commercial Overheads: Weighted Margin ${calculatedFinancials.weightedAvgMarginPct}%, Duration ${wholeProjectDuration.days}d, Total Bid: ${calculatedFinancials.finalBidPrice.toLocaleString()} EGP]`;
      const cleanedNotes = String(activeTender?.notes || '').replace(/\[Commercial Overheads:.*?\]/g, '').trim();
      const nextOverheads = Number(calculatedFinancials.weightedAvgMarginPct || 18);
      const nextNotes = `${cleanedNotes} ${summaryNotes}`.trim();

      const civilBid = Number(calculatedFinancials.disciplineBreakdown?.Civil?.discBidPrice || 0);
      const mechBid = Number(calculatedFinancials.disciplineBreakdown?.Mechanical?.discBidPrice || 0);
      const elecBid = Number(calculatedFinancials.disciplineBreakdown?.Electrical?.discBidPrice || 0);
      const savedAt = nowCairoIso();
      const actor = resolveCurrentErpActor();

      const snapshot = {
        directTotal: Number(calculatedFinancials.directTotal || 0),
        civilBidPrice: civilBid,
        mechBidPrice: mechBid,
        elecBidPrice: elecBid,
        finalBidPrice: Number(calculatedFinancials.finalBidPrice || 0),
        weightedAvgMarginPct: Number(calculatedFinancials.weightedAvgMarginPct || 0),
        updatedAt: savedAt,
      };

      const commercialConfig = {
        version: 1,
        inputs: {
          activeWorkTypeTab,
          globalFinancialConfig,
          disciplineMargins,
          workTypeSpecificMargins,
          siteStaffRoster,
          templateId,
          tableMode,
          pumpRoomSeparate,
          granularity,
          includeCoverSlide,
          includeSummarySlide,
        },
        snapshot,
        saved_at: savedAt,
        saved_by: {
          id: actor.id,
          full_name: actor.full_name,
        },
      };

      const auditFields = buildErpAuditFields(true);
      const { error } = await supabase
        .from('tender_log')
        .update({
          commercial_overheads: nextOverheads,
          notes: nextNotes,
          commercial_config: commercialConfig,
          ...auditFields,
        })
        .eq('id', selectedTenderId);

      if (error) throw error;

      setTendersList(prev =>
        prev.map(t =>
          String(t.id) === String(selectedTenderId)
            ? {
                ...t,
                commercial_overheads: nextOverheads,
                notes: nextNotes,
                commercial_config: commercialConfig,
                ...auditFields,
              }
            : t
        )
      );

      // Push calculated Civil, Mechanical, Electrical & Final Bid Price back to PZ.Tender Log
      await syncAllErpTendersAndCostsToTenderLog();

      recordErpAuditAndNotification({
        table_name: 'commercial_bid_overheads',
        record_id: String(selectedTenderId),
        erp_tender_id: String(selectedTenderId),
        proposal_code: activeTender?.proposal_number || null,
        action: 'UPDATE',
        new_data: {
          proposal_number: activeTender?.proposal_number || '',
          direct_cost_egp: Math.round(calculatedFinancials.directTotal || 0),
          indirect_and_reserves_egp: Math.round(
            (calculatedFinancials.totalIndirectCost || 0) + (calculatedFinancials.totalReserves || 0)
          ),
          weighted_margin_pct: calculatedFinancials.weightedAvgMarginPct,
          civil_bid_egp: Math.round(civilBid),
          mechanical_bid_egp: Math.round(mechBid),
          electrical_bid_egp: Math.round(elecBid),
          final_bid_price_egp: Math.round(calculatedFinancials.finalBidPrice || 0),
          project_duration_days: wholeProjectDuration.days,
        },
        notification: {
          type: 'erp_commercial_bid_set',
          targetRoles: ['app_admin', 'tender_manager', 'document_control'],
          title_en: `Final Commercial Bid Price Locked: ${Math.round(calculatedFinancials.finalBidPrice || 0).toLocaleString()} EGP`,
          title_ar: `اعتماد السعر التجاري النهائي للعطاء: ${Math.round(calculatedFinancials.finalBidPrice || 0).toLocaleString()} ج.م`,
          message_en: `Weighted Margin ${calculatedFinancials.weightedAvgMarginPct}% • Duration ${wholeProjectDuration.days} days — Proposal ready for client submittal.`,
          message_ar: `هامش الربح المرجح ${calculatedFinancials.weightedAvgMarginPct}% • مدة التنفيذ ${wholeProjectDuration.days} يوم — العرض جاهز للإرسال للعميل.`,
        },
      });

      setNotification({
        type: 'success',
        message: `Commercial Overheads & Final Bid Price (${calculatedFinancials.finalBidPrice.toLocaleString()} EGP) synchronized with PZ.Tender Log.`
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Error saving commercial settings:', err);
      setNotification({
        type: 'error',
        message: 'Failed to save commercial bid settings to Supabase.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export Full Commercial Sheet to CSV
  const handleExportFullCsv = () => {
    const cfg = globalFinancialConfig;
    const m = calculatedFinancials;

    const summaryRows = [
      ['COMMERCIAL OVERHEADS & BID PRICE BREAKDOWN SHEET'],
      ['Proposal Number', activeTender?.proposal_number || ''],
      ['Proposal Title', activeTender?.proposal_title || ''],
      ['Project Duration', `${wholeProjectDuration.days} Working Days (~ ${wholeProjectDuration.months} Months)`],
      ['Total Phases', `${phasesBreakdown.length} Phases`],
      ['Active Filter Scope', activeWorkTypeTab],
      ['Date (Cairo)', todayCairoIso()],
      [''],
      ['LINE ITEM / PARAMETER', 'PERCENTAGE (%)', 'AMOUNT (EGP)', 'NOTES'],
      ['Total Direct Cost Base', '100.00%', m.directTotal, 'Base direct cost from BOQ items'],
      ...phasesBreakdown.map(p => [
        `[PHASE] ${p.title}`,
        `${p.phaseShareOfTotalPct}%`,
        p.directCost,
        `Duration: ${p.durationDays} Days | Civil: ${p.civilCost} | Mech: ${p.mechCost} | Elec: ${p.elecCost} | Bid Price: ${p.phaseBidPrice} EGP`
      ]),
      ['Material Transportation', `${cfg.materialTransportationPct}%`, m.matTransAmt, ''],
      ['Engineering', `${cfg.engineeringPct}%`, m.engAmt, ''],
      ['Mobilization & Site Setup', cfg.mobilizationMode, m.mobAmt, ''],
      ['Temporary Water Facilities', `${cfg.tempWaterPct}%`, m.tempWaterAmt, ''],
      ['Temporary Power Facility', `${cfg.tempPowerPct}%`, m.tempPowerAmt, ''],
      ['Contractor Site Office', `${cfg.contractorSiteOfficePct}%`, m.siteOfficeAmt, ''],
      ['Contractor Stationary & Photocopying', `${cfg.stationaryCopyingPct}%`, m.stationaryAmt, ''],
      ['Safety Facilities & HSE', cfg.safetyFacilitiesMode, m.safetyAmt, ''],
      ['Company Accommodation & Living', cfg.companyAccommodationMode, m.accommAmt, ''],
      ['Salaries Site Staff', `${staffCalculationSummary.activeStaffCount} staff with +3 buffer days/mo`, m.salariesAmt, ''],
      ['Technical Services & Testing', `${cfg.technicalServicesPct}%`, m.techServAmt, ''],
      ['Head Office Overheads (G&A)', `${cfg.headOfficePct}% - Staff Deduction`, m.headOffAmt, `Gross: ${m.rawHeadOffAmt}, Deducted: ${m.headOffDeduction}`],
      ['TOTAL INDIRECT COST', '', m.totalIndirectCost, 'Sum of indirects 1-12'],
      ['TOTAL DIRECT & INDIRECT COST', '', m.totalDirectAndIndirect, 'Direct + Indirect'],
      ['Contingency Reserves', `${cfg.contingencyReservesPct}%`, m.contingencyAmt, ''],
      ['Management Reserves', `${cfg.managementReservesPct}%`, m.managementAmt, ''],
      ['Guaranty 1 Year', `${cfg.guaranty1YearPct}%`, m.guarantyAmt, ''],
      ['TOTAL RESERVES', '', m.totalReserves, 'Sum of reserves 13-15'],
      ['TOTAL DIRECT, INDIRECT & RESERVES', '', m.totalDirectIndirectAndReserves, ''],
      ...disciplinesTree.flatMap(d => [
        [`[PROFIT] ${d.name} Discipline Effective Margin`, `${m.disciplineBreakdown[d.name]?.discEffectiveMargin}%`, m.disciplineBreakdown[d.name]?.discProfit, `Multiplier: ${m.disciplineBreakdown[d.name]?.discMultiplier}x`],
        ...d.workTypes.map(wt => {
          const wtb = m.workTypeBreakdown[wt.name];
          return [
            `  - ${wt.name} Profit Margin`,
            `${wtb?.marginPct}%`,
            wtb?.profitAmt,
            `Multiplier: ${wtb?.wtMultiplier}x`
          ];
        })
      ]),
      ['TOTAL PROFIT MARGIN (WEIGHTED)', `${m.weightedAvgMarginPct}%`, m.totalProfitAmount, 'Total Work-Type Profit Contribution'],
      ['TOTAL WITH PROFIT MARGIN', '', m.totalWithProfit, ''],
      ['Payment Guarantee Discount Commission', `${cfg.paymentGuaranteePct}%`, m.payGuarAmt, ''],
      ['Final Guarantee Discount Commission', `${cfg.finalGuaranteePct}%`, m.finalGuarAmt, ''],
      ['Financing Interest', `${cfg.financingInterestPct}%`, m.finInterestAmt, ''],
      ['Social Insurance', `${cfg.socialInsurancePct}%`, m.socialInsAmt, ''],
      ['Marketing Allowance', 'Fixed', cfg.marketingAllowanceAmt || 0, ''],
      ['Sales & Marketing Commission', `${cfg.salesCommissionPct}% (${cfg.salesCommissionMode})`, m.salesCommAmt, ''],
      ['FINAL BID PRICE', '', m.finalBidPrice, 'Total Tender Offer to Client'],
      ['Gross Profit', '', m.grossProfit, ''],
      ['Corporate Taxes', `${cfg.corporateTaxesPct}%`, m.corporateTaxesAmt, ''],
      ['NET PROFIT', '', m.netProfit, 'Gross Profit - Corporate Taxes']
    ];

    const escapeCsvCell = (val) => {
      if (typeof val === 'number') return String(val);
      const str = String(val ?? '');
      const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const csvBody = '\uFEFF' + summaryRows.map(e => e.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', blobUrl);
    link.setAttribute('download', `Commercial_Overheads_${activeTender?.proposal_number || 'Tender'}_${todayCairoIso()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  const m = calculatedFinancials;
  const cfg = globalFinancialConfig;

  // List of all distinct work types for active discipline filter
  const activeDisciplineWorkTypes = useMemo(() => {
    if (activeWorkTypeTab === 'ALL') {
      return disciplinesTree.flatMap(d => d.workTypes);
    }
    const found = disciplinesTree.find(d => d.name === activeWorkTypeTab);
    return found ? found.workTypes : [];
  }, [disciplinesTree, activeWorkTypeTab]);

  return (
    <div className="space-y-6 animate-fadeIn pb-28 w-full mx-auto">
      
      {/* 1. TOP GLOBAL HERO HEADER */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 text-white shadow-2xl z-30">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shadow-inner">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Modular Multi-Tab Commercial Bid Price & Overheads Hub
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Commercial Bid Price & Overheads Hub
                </h1>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-3xl leading-relaxed">
              Configure profit margins per BOQ work type, site staff rosters with duration-based salaries and head-office deductions, mobilization and accommodation scaling, financial guarantees, and professional commission formulas.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsPptxModalOpen(true)}
              disabled={!selectedTenderId}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/40 text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Presentation className="w-4 h-4 text-teal-300" />
              <span>BOQ Presentation (.PPTX)</span>
            </button>
            <button
              onClick={handleExportFullCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Overheads CSV</span>
            </button>
            <button
              onClick={handleSaveCommercialSettings}
              disabled={isSaving || !selectedTenderId}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition shadow-lg shadow-emerald-900/40 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save & Sync Bid Price</span>
            </button>
          </div>
        </div>

        {/* PRIMARY VIEW NAVIGATION TABS & PROJECT TIMELINE PILLS */}
        <div className="mt-6 pt-5 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-slate-950/80 rounded-2xl border border-emerald-500/30">
            
            <button
              type="button"
              onClick={() => setActiveMainView('proposals_table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeMainView === 'proposals_table'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>1. Saved Proposals Directory ({proposalsSummaryList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainView('bid_configurator')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                activeMainView === 'bid_configurator'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>2. Overheads & Bid Configurator</span>
            </button>

          </div>

          {/* Project Duration & Active Proposal Live Status Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Duration Pill */}
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-teal-500/40 flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Duration:</span>
              <strong className="font-mono text-teal-300 font-black">
                {wholeProjectDuration.days} Working Days
              </strong>
              <span className="text-teal-400 font-bold font-mono">
                (~{wholeProjectDuration.months} Months)
              </span>
            </div>

            {/* Active Proposal Badge */}
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center gap-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Proposal:</span>
              <strong className="font-mono text-emerald-300 font-black">
                {activeTender?.proposal_number || 'None Selected'}
              </strong>
              <span className="text-slate-400 truncate max-w-[140px] sm:max-w-[200px]">
                {activeTender?.proposal_title || ''}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-lg animate-fadeIn ${
          notification.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-200'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {notification.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-black px-2 py-1 rounded-lg hover:bg-black/5">Dismiss</button>
        </div>
      )}

      {/* VIEW 1: MASTER SAVED PROPOSALS DIRECTORY TABLE */}
      {activeMainView === 'proposals_table' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 animate-fadeIn">
          
          {/* Table Header & Search Toolbar */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Saved Proposals & Direct Cost Registry</span>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                  {filteredProposalsSummary.length} Proposals
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Click <strong className="text-emerald-600 dark:text-emerald-400">"Set Bid Price"</strong> on any proposal to configure trade profit margins and calculate final selling rates.
              </p>
            </div>

            {/* Toolbar Filters */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={proposalsSearchQuery}
                  onChange={(e) => setProposalsSearchQuery(e.target.value)}
                  placeholder="Search code, title, client..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <select
                value={proposalsStatusFilter}
                onChange={(e) => setProposalsStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="In Progress">In Progress</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Proposals Directory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-500">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Proposal Code & Title</th>
                  <th className="py-3 px-4">Client / Stakeholder</th>
                  <th className="py-3 px-3 text-center">Phases</th>
                  <th className="py-3 px-3 text-center">BOQ Items</th>
                  <th className="py-3 px-4 text-right text-amber-700 dark:text-amber-400 font-bold">Civil Cost</th>
                  <th className="py-3 px-4 text-right text-teal-700 dark:text-teal-400 font-bold">Mechanical</th>
                  <th className="py-3 px-4 text-right text-indigo-700 dark:text-indigo-400 font-bold">Electrical</th>
                  <th className="py-3 px-4 text-right text-slate-900 dark:text-slate-100 font-black">Total Direct Cost</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredProposalsSummary.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 font-medium">
                      No proposals found matching the search filters.
                    </td>
                  </tr>
                ) : (
                  filteredProposalsSummary.map((p, idx) => {
                    const isSelected = String(p.id) === String(selectedTenderId);
                    return (
                      <tr 
                        key={p.id} 
                        className={`transition ${
                          isSelected 
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-semibold' 
                            : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-center text-slate-400">{idx + 1}</td>
                        
                        {/* Proposal Title & Code */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                              {p.proposal_number || 'SP.XXXX'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {p.proposal_title || p.proposal_full_title || 'Untitled Proposal'}
                            </span>
                          </div>
                          {p.proposal_submittal_date && (
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              Due: {p.proposal_submittal_date}
                            </span>
                          )}
                        </td>

                        {/* Client */}
                        <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                          {p.clientName}
                        </td>

                        {/* Phases Count */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                          {p.phasesCount}
                        </td>

                        {/* BOQ Items Count */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                          {p.itemsCount}
                        </td>

                        {/* Civil Cost */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                          {p.civilCost > 0 ? `${p.civilCost.toLocaleString()} EGP` : '—'}
                        </td>

                        {/* Mech Cost */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-teal-700 dark:text-teal-400">
                          {p.mechCost > 0 ? `${p.mechCost.toLocaleString()} EGP` : '—'}
                        </td>

                        {/* Elec Cost */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                          {p.elecCost > 0 ? `${p.elecCost.toLocaleString()} EGP` : '—'}
                        </td>

                        {/* Total Direct Cost */}
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                          {p.totalDirectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            p.proposal_status === 'Approved'
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : p.proposal_status === 'Submitted'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}>
                            {p.proposal_status || 'Draft'}
                          </span>
                        </td>

                        {/* Select Action Button */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectProposalToCreateBid(p.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                                  : 'bg-slate-900 text-white hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600'
                              }`}
                            >
                              <span>{isSelected ? 'Active Bid' : 'Set Bid Price'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTenderId(p.id);
                                setIsPptxModalOpen(true);
                              }}
                              title="Open Commercial BOQ Presentation (.PPTX) Studio"
                              className="px-2.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-600 text-teal-700 dark:text-teal-300 hover:text-white border border-teal-500/30 text-xs font-black transition cursor-pointer flex items-center gap-1"
                            >
                              <Presentation className="w-3.5 h-3.5" />
                              <span>PPTX</span>
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

      {/* VIEW 2: ACTIVE PROPOSAL OVERHEADS & BID PRICE CONFIGURATOR */}
      {activeMainView === 'bid_configurator' && (
        <div className="space-y-6 animate-fadeIn" ref={configuratorRef}>
          
          {/* Active Proposal Context Bar */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  Configuring Bid Price for Proposal
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                  <span>
                    {activeTender
                      ? `${activeTender.proposal_number} • ${activeTender.proposal_title || activeTender.proposal_full_title}`
                      : 'No Active Proposal Selected'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40">
                    {phasesBreakdown.length} Project Phases • {wholeProjectDuration.days} Working Days
                  </span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveMainView('proposals_table')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Switch Proposal</span>
            </button>
          </div>

          {/* 2. EXECUTIVE FINANCIAL KPI DASHBOARD */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            
            {/* KPI 1: Direct Cost Base */}
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">1. Total Direct Cost</span>
              <div className="text-base sm:text-lg font-mono font-black text-slate-900 dark:text-slate-100 truncate">
                {m.directTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{activeTenderBoq.length} BOQ Line Items (EGP)</span>
            </div>

            {/* KPI 2: Total Indirect Cost */}
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-black text-amber-800 dark:text-amber-300 block">2. Total Indirect Cost</span>
              <div className="text-base sm:text-lg font-mono font-black text-amber-900 dark:text-amber-200 truncate">
                {m.totalIndirectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400 font-mono">12 Preliminaries (EGP)</span>
            </div>

            {/* KPI 3: Total Reserves */}
            <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800/50 shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-black text-blue-800 dark:text-blue-300 block">3. Total Reserves</span>
              <div className="text-base sm:text-lg font-mono font-black text-blue-900 dark:text-blue-200 truncate">
                {m.totalReserves.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-blue-700/80 dark:text-blue-400 font-mono">Contingency + Warranty</span>
            </div>

            {/* KPI 4: Profit Margin */}
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-black text-emerald-800 dark:text-emerald-300">4. Total Profit</span>
                <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
                  +{m.weightedAvgMarginPct}%
                </span>
              </div>
              <div className="text-base sm:text-lg font-mono font-black text-emerald-900 dark:text-emerald-200 truncate">
                {m.totalProfitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400 font-mono">Weighted Margin (EGP)</span>
            </div>

            {/* KPI 5: Net Profit After Tax */}
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 shadow-xs space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-black text-indigo-800 dark:text-indigo-300 block">5. Net Profit</span>
              <div className="text-base sm:text-lg font-mono font-black text-indigo-900 dark:text-indigo-200 truncate">
                {m.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400 font-mono">After {cfg.corporateTaxesPct}% Tax</span>
            </div>

            {/* KPI 6: Final Bid Price */}
            <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl border border-emerald-500 shadow-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-black text-emerald-100">6. Final Bid Price</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/20 text-white">
                  {m.globalMarkupMultiplier}x
                </span>
              </div>
              <div className="text-base sm:text-lg font-mono font-black text-white truncate">
                {m.finalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[10px] text-emerald-200 font-mono block">Offer to Client (EGP)</span>
            </div>

          </div>

                    {/* 3. MODULAR CONFIGURATION TABS NAVIGATION */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              
              {/* Tab 1: Clean Master Summary */}
              <button
                type="button"
                onClick={() => setActiveConfigTab('master_summary')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  activeConfigTab === 'master_summary'
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <TableIcon className="w-4 h-4 text-emerald-400" />
                <span>1. Master Summary & Client BOQ</span>
              </button>

              {/* Tab 2: Site Preliminaries & Reserves */}
              <button
                type="button"
                onClick={() => setActiveConfigTab('site_preliminaries')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  activeConfigTab === 'site_preliminaries'
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>2. Site Preliminaries & Reserves (%)</span>
              </button>

              {/* Tab 3: Site Staff Salaries & Head Office */}
              <button
                type="button"
                onClick={() => setActiveConfigTab('staff_salaries')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  activeConfigTab === 'staff_salaries'
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4 text-amber-400" />
                <span>3. Staff Salaries ({cfg.salariesSiteStaffPct.toFixed(2)}%) & Head Office ({cfg.headOfficePct.toFixed(2)}%)</span>
              </button>

              {/* Tab 4: Mobilization & Site Office */}
              <button
                type="button"
                onClick={() => setActiveConfigTab('mobilization_logistics')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  activeConfigTab === 'mobilization_logistics'
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Truck className="w-4 h-4 text-teal-400" />
                <span>4. Mobilization & Site Office (9 Items)</span>
              </button>

              {/* Tab 5: Work-Type Profit Margins */}
              <button
                type="button"
                onClick={() => setActiveConfigTab('profit_margins')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  activeConfigTab === 'profit_margins'
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Percent className="w-4 h-4 text-emerald-400" />
                <span>5. Work-Type Profit Margins</span>
              </button>

              {/* Tab 6: Guarantees, Insurance & Final Bid */}
              <button
                type="button"
                onClick={() => setActiveConfigTab('commission_bid')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
                  activeConfigTab === 'commission_bid'
                    ? 'bg-slate-900 text-white dark:bg-purple-500 dark:text-slate-950 shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>6. Guarantees, Insurance & Final Bid (Items 17-21)</span>
              </button>

            </div>
          </div>

          {/* TAB CONTENT 1: MASTER SUMMARY & BOQ RATE SHEET */}
          {activeConfigTab === 'master_summary' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Project Phases Matrix Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Waves className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>Project Phases Direct Cost & Bid Allocation Matrix</span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200">
                          {phasesBreakdown.length} Phases
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Direct cost breakdown and commercial bid offer computed for each tender phase.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 px-3.5 py-1.5 rounded-xl font-mono text-xs">
                    <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span className="text-[10px] text-teal-700 dark:text-teal-300 font-bold uppercase">Project Duration:</span>
                    <strong className="text-teal-900 dark:text-teal-100 font-black">{wholeProjectDuration.days} Days (~{wholeProjectDuration.months} Mos)</strong>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4">Phase Name</th>
                        <th className="py-3 px-3 text-center">Duration</th>
                        <th className="py-3 px-3 text-center">BOQ Items</th>
                        <th className="py-3 px-4 text-right text-amber-700 dark:text-amber-400 font-bold">Civil Cost</th>
                        <th className="py-3 px-4 text-right text-teal-700 dark:text-teal-400 font-bold">Mechanical</th>
                        <th className="py-3 px-4 text-right text-indigo-700 dark:text-indigo-400 font-bold">Electrical</th>
                        <th className="py-3 px-4 text-right text-slate-900 dark:text-slate-100 font-black">Direct Total</th>
                        <th className="py-3 px-3 text-center font-mono">Multiplier</th>
                        <th className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-300 font-black bg-emerald-50/60 dark:bg-emerald-950/30">Phase Bid Offer</th>
                        <th className="py-3 px-3 text-center font-mono font-bold">Share %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {phasesBreakdown.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <Waves className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                              <span className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide text-xs">
                                {p.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-teal-700 dark:text-teal-300">
                            {p.durationDays} Days
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono text-slate-500">
                            {p.itemsCount} Items
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                            {p.civilCost > 0 ? `${p.civilCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-700 dark:text-teal-400">
                            {p.mechCost > 0 ? `${p.mechCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-700 dark:text-indigo-400">
                            {p.elecCost > 0 ? `${p.elecCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-xs">
                            {p.directCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {p.phaseMultiplier}x
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 text-sm">
                            {p.phaseBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                          </td>
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-600 dark:text-slate-400">
                            {p.phaseShareOfTotalPct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-black text-xs">
                        <td className="py-3 px-4 uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Total Project Bid Price:
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-teal-700 dark:text-teal-300">
                          {wholeProjectDuration.days} Days
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {activeTenderBoq.length} Items
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-amber-700 dark:text-amber-400">
                          {phasesBreakdown.reduce((s, p) => s + p.civilCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-teal-700 dark:text-teal-400">
                          {phasesBreakdown.reduce((s, p) => s + p.mechCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-indigo-700 dark:text-indigo-400">
                          {phasesBreakdown.reduce((s, p) => s + p.elecCost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100 text-xs">
                          {m.directTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400">
                          {m.globalMarkupMultiplier}x
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/40 text-sm">
                          {m.finalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                          100.00%
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Master Commercial Breakdown Table (24 Lines) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Executive 24-Line Commercial Breakdown
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Executive financial summary. To adjust any parameter, click the category tab above.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-500">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Financial Category / Cost Head</th>
                        <th className="py-3 px-4 text-center">Basis / Mode</th>
                        <th className="py-3 px-4 text-center w-36">Rate / Pct</th>
                        <th className="py-3 px-4 text-right w-48 font-black text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/50">Amount (EGP)</th>
                        <th className="py-3 px-4 text-slate-400">Calculation Formula & Base</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      
                      {/* TIER 1 SECTION HEADER: TOTAL DIRECT COSTS BY PHASES */}
                      <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-700">
                        <td colSpan={6} className="py-2.5 px-4">
                          <div className="flex items-center justify-between">
                            <span>TIER 1: TOTAL DIRECT COSTS BY PHASES ({phasesBreakdown.length} PHASES • {activeTenderBoq.length} BOQ ITEMS)</span>
                            <span className="font-mono text-[10px] text-teal-700 dark:text-teal-300 font-black">Total Project Duration: {wholeProjectDuration.days} Days (~{wholeProjectDuration.months} Months)</span>
                          </div>
                        </td>
                      </tr>

                      {/* Render Each Phase Direct Cost Row */}
                      {phasesBreakdown.map((p, idx) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition text-xs">
                          <td className="py-2.5 px-4 text-center font-mono text-teal-600 dark:text-teal-400 font-black">
                            0.{idx + 1}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-2">
                              <Waves className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                              <strong className="text-slate-900 dark:text-slate-100 font-black uppercase text-xs">
                                {p.title}
                              </strong>
                              <span className="text-[10px] font-mono text-slate-400">
                                ({p.itemsCount} Items • {p.durationDays} Days)
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-400">
                            Phase Direct
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-black text-teal-700 dark:text-teal-300">
                            {p.phaseShareOfTotalPct}%
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50/40 dark:bg-slate-800/20">
                            {p.directCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                            Civil: {p.civilCost.toLocaleString()} | Mech: {p.mechCost.toLocaleString()} | Elec: {p.elecCost.toLocaleString()} EGP
                          </td>
                        </tr>
                      ))}

                      {/* Tier 1 Direct Cost Base Combined Total */}
                      <tr className="bg-slate-100/90 dark:bg-slate-800/80 font-black border-t-2 border-slate-300 dark:border-slate-700">
                        <td className="py-3 px-4 text-center font-mono text-slate-900 dark:text-white">0</td>
                        <td className="py-3 px-4 uppercase text-slate-950 dark:text-white">
                          Total Direct Cost Base (All Phases)
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-500">Direct BOQ</td>
                        <td className="py-3 px-4 text-center font-mono font-black text-slate-900 dark:text-white">100.00%</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm text-slate-950 dark:text-white bg-slate-200/70 dark:bg-slate-700/70">
                          {m.directTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                          Combined Direct Base of {phasesBreakdown.length} Phases ({activeTenderBoq.length} BOQ Items)
                        </td>
                      </tr>

                      {/* TIER 2 SECTION HEADER: PROJECT PRELIMINARIES */}
                      <tr className="bg-amber-100/60 dark:bg-amber-950/40 text-[10px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 border-y border-amber-200 dark:border-amber-800/60">
                        <td colSpan={6} className="py-2 px-4">
                          TIER 2: PROJECT PRELIMINARIES & SITE INDIRECTS (12 ITEMS)
                        </td>
                      </tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">1</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Material Transportation & Logistics</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Direct Base</td><td className="py-2.5 px-4 text-center font-mono font-black text-amber-700 dark:text-amber-400">{cfg.materialTransportationPct.toFixed(2)}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.matTransAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.materialTransportationPct}% × {m.directTotal.toLocaleString()} Direct</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">2</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Shop Drawings & Technical Engineering</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Direct Base</td><td className="py-2.5 px-4 text-center font-mono font-black text-amber-700 dark:text-amber-400">{cfg.engineeringPct.toFixed(2)}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.engAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.engineeringPct}% × {m.directTotal.toLocaleString()} Direct</td></tr>
                      <tr>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">3</td>
                        <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Site Mobilization & Demobilization</td>
                        <td className="py-2.5 px-4 text-center font-mono text-teal-600 font-bold">
                          {cfg.mobilizationMode === 'percentage' ? '% Direct Base' : 'Itemized (9 Items)'}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-teal-700 dark:text-teal-300">
                          {cfg.mobilizationMode === 'percentage' ? `${cfg.mobilizationPct.toFixed(2)}%` : `${mobilizationCalculationSummary.totalCaravansCount} Caravans • ${mobilizationCalculationSummary.acCount} ACs`}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">
                          {m.mobAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                          {cfg.mobilizationMode === 'percentage' ? `${cfg.mobilizationPct}% of Direct Base` : `Configured in Tab 4 (${staffCalculationSummary.activeStaffCount} Site Staff)`}
                        </td>
                      </tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">4</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Temporary Water Supply</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Direct Base</td><td className="py-2.5 px-4 text-center font-mono font-black text-amber-700 dark:text-amber-400">{cfg.tempWaterPct.toFixed(2)}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.tempWaterAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.tempWaterPct}% × {m.directTotal.toLocaleString()} Direct</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">5</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Temporary Power & Generators</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Direct Base</td><td className="py-2.5 px-4 text-center font-mono font-black text-amber-700 dark:text-amber-400">{cfg.tempPowerPct.toFixed(2)}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.tempPowerAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.tempPowerPct}% × {m.directTotal.toLocaleString()} Direct</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">6</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Site Office Setup & Maintenance</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Direct Base</td><td className="py-2.5 px-4 text-center font-mono font-black text-amber-700 dark:text-amber-400">{cfg.contractorSiteOfficePct.toFixed(2)}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.siteOfficeAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.contractorSiteOfficePct}% × {m.directTotal.toLocaleString()} Direct</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">7</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Printing, Documentations & Stationary</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Direct Base</td><td className="py-2.5 px-4 text-center font-mono font-black text-amber-700 dark:text-amber-400">{cfg.stationaryCopyingPct.toFixed(2)}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.stationaryAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.stationaryCopyingPct}% × {m.directTotal.toLocaleString()} Direct</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">8</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">HSE & Safety Equipment on Site</td><td className="py-2.5 px-4 text-center font-mono text-teal-600 font-bold">{cfg.safetyFacilitiesMode}</td><td className="py-2.5 px-4 text-center font-mono font-bold text-teal-700 dark:text-teal-300">{cfg.safetyFacilitiesMode === 'percentage' ? `${cfg.safetyFacilitiesPct.toFixed(2)}%` : `${staffCalculationSummary.activeStaffCount} Staff PPE`}</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.safetyAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.safetyFacilitiesMode === 'percentage' ? `${cfg.safetyFacilitiesPct}% of Direct Base` : 'Configured in Tab 4'}</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">9</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Engineers & Site Staff Accommodation</td><td className="py-2.5 px-4 text-center font-mono text-teal-600 font-bold">{cfg.companyAccommodationMode}</td><td className="py-2.5 px-4 text-center font-mono font-bold text-teal-700 dark:text-teal-300">{cfg.companyAccommodationMode === 'percentage' ? `${cfg.companyAccommodationPct.toFixed(2)}%` : 'Rent + Daily Food + Fuel'}</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.accommAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.companyAccommodationMode === 'percentage' ? `${cfg.companyAccommodationPct}% of Direct Base` : 'Configured in Tab 4'}</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">10</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Site Supervision & Engineers Salaries</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Direct Base</td><td className="py-2.5 px-4 text-center font-mono font-black text-amber-700 dark:text-amber-400">{cfg.salariesSiteStaffPct.toFixed(2)}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.salariesAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.salariesSiteStaffPct}% × {m.directTotal.toLocaleString()} Direct</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">11</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Testing, Commissioning & QA/QC Labs</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Direct Base</td><td className="py-2.5 px-4 text-center font-mono font-black text-amber-700 dark:text-amber-400">{cfg.technicalServicesPct.toFixed(2)}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">{m.techServAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.technicalServicesPct}% × {m.directTotal.toLocaleString()} Direct</td></tr>
                      <tr>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">12</td>
                        <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Head Office Support & G&A</td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Direct Base</td>
                        <td className="py-2.5 px-4 text-center font-mono font-black text-amber-700 dark:text-amber-400">
                          {cfg.headOfficePct.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-50/20 dark:bg-amber-950/10">
                          {m.headOffAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                          {cfg.headOfficePct}% × {m.directTotal.toLocaleString()} Direct
                        </td>
                      </tr>

                      {/* Total Indirect Subtotal */}
                      <tr className="bg-amber-100/70 dark:bg-amber-950/60 font-black border-y border-amber-300 dark:border-amber-700">
                        <td className="py-3 px-4 text-center font-mono text-amber-800 dark:text-amber-300">Σ</td>
                        <td className="py-3 px-4 text-amber-950 dark:text-amber-100 uppercase">Total Indirect Cost (12 Items)</td>
                        <td className="py-3 px-4 text-center font-mono text-amber-800 dark:text-amber-300">Subtotal</td>
                        <td className="py-3 px-4 text-center font-mono text-amber-800 dark:text-amber-300">—</td>
                        <td className="py-3 px-4 text-right font-mono text-amber-950 dark:text-amber-100 text-sm bg-amber-200/50 dark:bg-amber-900/50">
                          {m.totalIndirectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-amber-800 dark:text-amber-300 font-medium">Sum of All 12 Site Preliminaries & Indirects</td>
                      </tr>

                      {/* TIER 3 SECTION HEADER: RISK & WARRANTY RESERVES */}
                      <tr className="bg-blue-100/60 dark:bg-blue-950/40 text-[10px] font-black uppercase tracking-wider text-blue-900 dark:text-blue-200 border-y border-blue-200 dark:border-blue-800/60">
                        <td colSpan={6} className="py-2 px-4">
                          TIER 3: RISK, CONTINGENCY & WARRANTY RESERVES (3 ITEMS)
                        </td>
                      </tr>
                      {/* Tier 3 Reserves 13-15 */}
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">13</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Contingency Reserves</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% Direct + Indirect</td><td className="py-2.5 px-4 text-center font-mono font-black text-blue-700 dark:text-blue-400">{cfg.contingencyReservesPct}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/10">{m.contingencyAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.contingencyReservesPct}% × {m.totalDirectAndIndirect.toLocaleString()} (Direct + Indirect)</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">14</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Management Reserves</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% Direct + Indirect</td><td className="py-2.5 px-4 text-center font-mono font-black text-blue-700 dark:text-blue-400">{cfg.managementReservesPct}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/10">{m.managementAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.managementReservesPct}% × {m.totalDirectAndIndirect.toLocaleString()} (Direct + Indirect)</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">15</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Guaranty 1 Year (Warranty Reserve)</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% Direct + Indirect</td><td className="py-2.5 px-4 text-center font-mono font-black text-blue-700 dark:text-blue-400">{cfg.guaranty1YearPct}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/10">{m.guarantyAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.guaranty1YearPct}% × {m.totalDirectAndIndirect.toLocaleString()} (Direct + Indirect)</td></tr>

                      {/* TIER 4 SECTION HEADER: PROFIT MARGINS */}
                      <tr className="bg-emerald-100/60 dark:bg-emerald-950/40 text-[10px] font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200 border-y border-emerald-200 dark:border-emerald-800/60">
                        <td colSpan={6} className="py-2 px-4">
                          TIER 4: TRADE & BOQ WORK-TYPE PROFIT MARGINS (ITEM 16)
                        </td>
                      </tr>
                      {/* Tier 4 Profit Margin */}
                      <tr className="bg-emerald-100/70 dark:bg-emerald-950/50 font-black border-y border-emerald-300 dark:border-emerald-800">
                        <td className="py-3 px-4 text-center font-mono text-emerald-800">16</td>
                        <td className="py-3 px-4 text-emerald-950 dark:text-emerald-100 uppercase">Total Profit Margin (Weighted Average)</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-800">Work-Types</td>
                        <td className="py-3 px-4 text-center font-mono font-black text-emerald-800 dark:text-emerald-300">+{m.weightedAvgMarginPct}%</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-950 dark:text-emerald-100 text-sm bg-emerald-200/50 dark:bg-emerald-900/50">
                          {m.totalProfitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-emerald-800 dark:text-emerald-300 font-medium">
                          Configured in Tab 6 per BOQ Work-Type (Civil, Mech, Elec)
                        </td>
                      </tr>

                      {/* TIER 5 SECTION HEADER: SALES COMMISSIONS, GUARANTEES & INSURANCE */}
                      <tr className="bg-purple-100/60 dark:bg-purple-950/40 text-[10px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-200 border-y border-purple-200 dark:border-purple-800/60">
                        <td colSpan={6} className="py-2 px-4">
                          TIER 5: SALES COMMISSIONS, FINANCIAL GUARANTEES & SOCIAL INSURANCE (5 ITEMS)
                        </td>
                      </tr>
                      {/* Tier 5 Adders 17-21 */}
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">17</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Payment Guarantee discount commission</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% Final Price</td><td className="py-2.5 px-4 text-center font-mono font-black text-purple-700 dark:text-purple-400">{cfg.paymentGuaranteePct}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50/20 dark:bg-purple-950/10">{m.payGuarAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.paymentGuaranteePct}% × {m.finalBidPrice.toLocaleString()} (Final Bid Price)</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">18</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Final guarantee discount commission</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% Final Price</td><td className="py-2.5 px-4 text-center font-mono font-black text-purple-700 dark:text-purple-400">{cfg.finalGuaranteePct}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50/20 dark:bg-purple-950/10">{m.finalGuarAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.finalGuaranteePct}% × {m.finalBidPrice.toLocaleString()} (Final Bid Price)</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">19</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Financing interest</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% Final Price</td><td className="py-2.5 px-4 text-center font-mono font-black text-purple-700 dark:text-purple-400">{cfg.financingInterestPct}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50/20 dark:bg-purple-950/10">{m.finInterestAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.financingInterestPct}% × {m.finalBidPrice.toLocaleString()} (Final Bid Price)</td></tr>
                      <tr><td className="py-2.5 px-4 text-center font-mono text-slate-400">20</td><td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Social Insurance</td><td className="py-2.5 px-4 text-center font-mono text-slate-400">% Final Price</td><td className="py-2.5 px-4 text-center font-mono font-black text-purple-700 dark:text-purple-400">{cfg.socialInsurancePct}%</td><td className="py-2.5 px-4 text-right font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50/20 dark:bg-purple-950/10">{m.socialInsAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{cfg.socialInsurancePct}% × {m.finalBidPrice.toLocaleString()} (Final Bid Price)</td></tr>
                      <tr className="bg-purple-50/40 dark:bg-purple-950/20"><td className="py-2.5 px-4 text-center font-mono text-slate-400 font-bold">21</td><td className="py-2.5 px-4 font-black text-purple-950 dark:text-purple-100">Sales & Marketing Commission</td><td className="py-2.5 px-4 text-center font-mono text-purple-700 font-bold">% Final Price</td><td className="py-2.5 px-4 text-center font-mono font-black text-purple-800 dark:text-purple-300">{cfg.salesCommissionPct}%</td><td className="py-2.5 px-4 text-right font-mono font-black text-purple-900 dark:text-purple-200 bg-purple-100/40 dark:bg-purple-900/30">{m.salesCommAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{cfg.salesCommissionPct}% × {m.finalBidPrice.toLocaleString()} (Final Bid Price)</td></tr>

                      {/* Tier 6 Final Bid Price */}
                      <tr className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-sm">
                        <td className="py-3.5 px-4 text-center font-mono text-emerald-200">★</td>
                        <td className="py-3.5 px-4 uppercase text-white">Final Bid Price (Client Tender Offer)</td>
                        <td className="py-3.5 px-4 text-center font-mono text-emerald-100 font-bold">{m.globalMarkupMultiplier}x Avg Multiplier</td>
                        <td className="py-3.5 px-4 text-center font-mono text-emerald-100">—</td>
                        <td className="py-3.5 px-4 text-right font-mono text-white text-base bg-emerald-800/40">
                          {m.finalBidPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-100 font-normal">Final Commercial Proposal Offer to Client</td>
                      </tr>

                      {/* TIER 6 SECTION HEADER: TAXES & NET PROFIT */}
                      <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-700">
                        <td colSpan={6} className="py-2 px-4">
                          TIER 6: TAXES & FINAL NET PROFIT RETURN
                        </td>
                      </tr>
                      {/* 22. Gross Profit */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">22</td>
                        <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Gross Profit (Margin Return)</td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">Profit Return</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-600">+{m.weightedAvgMarginPct}%</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {m.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">Total Profit Contribution</td>
                      </tr>

                      {/* 23. Corporate Taxes */}
                      <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">23</td>
                        <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">Corporate Taxes (Egyptian Income Tax)</td>
                        <td className="py-2.5 px-4 text-center font-mono text-slate-400">% of Gross Profit</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-rose-600">-{cfg.corporateTaxesPct}%</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50/20 dark:bg-rose-950/10">
                          -{m.corporateTaxesAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                          {cfg.corporateTaxesPct}% × {m.grossProfit.toLocaleString()} Gross Profit
                        </td>
                      </tr>

                      {/* 24. Net Profit */}
                      <tr className="bg-emerald-500/10 dark:bg-emerald-500/20 font-black">
                        <td className="py-3 px-4 text-center font-mono text-emerald-600">24</td>
                        <td className="py-3 px-4 uppercase text-emerald-950 dark:text-emerald-200">Net Profit (Final Earnings)</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-700 font-bold">Net Return</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-700">—</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-300 text-sm bg-emerald-500/20">
                          {m.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-medium">Gross Profit - Corporate Taxes</td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>

              {/* Client BOQ Rate Sheet Table */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      <span>Marked-Up Client Bill of Quantities (BOQ Rate Sheet)</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200">
                        {filteredClientBoqItems.length} Displayed Items
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Unit rates computed using work-type specific markup multipliers.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsPptxModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-xs transition cursor-pointer"
                    >
                      <Presentation className="w-3.5 h-3.5" />
                      <span>Generate BOQ Slides (.PPTX)</span>
                    </button>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items or specifications..."
                        className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-40 sm:w-48"
                      />
                    </div>

                    <select
                      value={selectedSpecificCategoryFilter}
                      onChange={(e) => setSelectedSpecificCategoryFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-[180px] truncate"
                    >
                      <option value="ALL">All Work Types ({activeDisciplineWorkTypes.length})</option>
                      {activeDisciplineWorkTypes.map(wt => (
                        <option key={wt.name} value={wt.name}>{wt.name}</option>
                      ))}
                    </select>

                    <select
                      value={selectedPhaseFilter}
                      onChange={(e) => setSelectedPhaseFilter(e.target.value)}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                      <option value="ALL">All Phases ({tenderPhases.length})</option>
                      {tenderPhases.map(p => (
                        <option key={p.id} value={p.id}>{p.phase_title || p.phase_full_title || p.id}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-500">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Item & Technical Specification</th>
                        <th className="py-3 px-3">Discipline</th>
                        <th className="py-3 px-3">BOQ Work Type</th>
                        <th className="py-3 px-3 text-center">Unit</th>
                        <th className="py-3 px-3 text-right">Qty</th>
                        <th className="py-3 px-3 text-right text-slate-400">Direct Cost</th>
                        <th className="py-3 px-3 text-center font-mono">Multiplier</th>
                        <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 font-black">Client Unit Rate</th>
                        <th className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 font-black">Total Client Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredClientBoqItems.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                            No BOQ line items found matching the selected proposal or filters.
                          </td>
                        </tr>
                      ) : (
                        filteredClientBoqItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                            <td className="py-2.5 px-4 font-mono text-[11px] text-center text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                {STATIC_ITEMS_LOOKUP[item.item] || item.item_name || item.fallbackName || item.item}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {item.activity_type || 'Procurement & Installation'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                item.discipline === 'Electrical'
                                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                  : item.discipline === 'Mechanical'
                                  ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              }`}>
                                {item.discipline}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {item.workTypeName}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-500">{item.unit || 'No.'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {Number(item.final_quantity ?? item.quantity ?? 1).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                              {item.directUnitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              {item.multiplier}x
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                              {item.clientUnitRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40">
                              {item.clientTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

          {/* TAB CONTENT 2: SITE PRELIMINARIES & RESERVES (%) */}
          {activeConfigTab === 'site_preliminaries' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-8 animate-fadeIn">
              
              {/* SECTION 1: TIER 2 PRELIMINARIES (%) */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200 dark:border-amber-800/60 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Tier 2: Site Preliminaries & Indirects Setup
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-black border border-amber-500/20">
                          {(m.totalIndirectPct ?? 0).toFixed(2)}% Total ({m.totalIndirectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP)
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Configured as percentage rates calculated directly from Total Direct Cost Base ({m.directTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP).
                      </p>
                    </div>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-mono text-xs font-black">
                    Total Direct Base: {m.directTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                  </div>
                </div>

                {/* Grid of 9 Preliminary Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* 1. Material Transportation & Logistics */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">1. Material Transportation & Logistics</span>
                      <span className="text-[10px] font-mono text-slate-400">% Direct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.materialTransportationPct}
                        onChange={(e) => handleGlobalFieldChange('materialTransportationPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-black text-amber-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.matTransAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 2. Shop Drawings & Technical Engineering */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">2. Shop Drawings & Technical Engineering</span>
                      <span className="text-[10px] font-mono text-slate-400">% Direct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.engineeringPct}
                        onChange={(e) => handleGlobalFieldChange('engineeringPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-black text-amber-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.engAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 3. Site Mobilization & Demobilization */}
                  <div className="p-4 rounded-2xl border border-teal-300 dark:border-teal-800 bg-teal-50/40 dark:bg-teal-950/20 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-black text-teal-950 dark:text-teal-100">3. Site Mobilization & Demobilization</span>
                      <select
                        value={cfg.mobilizationMode === 'items_roster' ? 'calculated' : cfg.mobilizationMode}
                        onChange={(e) => handleGlobalFieldChange('mobilizationMode', e.target.value)}
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-teal-400 text-teal-700 dark:text-teal-300 cursor-pointer"
                      >
                        <option value="calculated">9-Item Roster</option>
                        <option value="percentage">% Direct</option>
                        <option value="fixed">Fixed Lump</option>
                      </select>
                    </div>
                    {cfg.mobilizationMode === 'percentage' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={cfg.mobilizationPct}
                          onChange={(e) => handleGlobalFieldChange('mobilizationPct', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-teal-500 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="font-black text-teal-600">%</span>
                      </div>
                    ) : cfg.mobilizationMode === 'fixed' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={cfg.mobilizationFixedAmt}
                          onChange={(e) => handleGlobalFieldChange('mobilizationFixedAmt', parseFloat(e.target.value) || 0)}
                          className="w-32 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-teal-500 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="font-black text-teal-600 text-xs">EGP</span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-teal-700 dark:text-teal-300 py-1">
                        {mobilizationCalculationSummary.totalCaravansCount} Caravans • {mobilizationCalculationSummary.acCount} ACs (Tab 4)
                      </div>
                    )}
                    <div className="pt-2 border-t border-teal-200 dark:border-teal-800 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-teal-700 dark:text-teal-300">{m.mobAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 4. Temporary Water Supply */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">4. Temporary Water Supply</span>
                      <span className="text-[10px] font-mono text-slate-400">% Direct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.tempWaterPct}
                        onChange={(e) => handleGlobalFieldChange('tempWaterPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-black text-amber-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.tempWaterAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 5. Temporary Power & Generators */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">5. Temporary Power & Generators</span>
                      <span className="text-[10px] font-mono text-slate-400">% Direct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.tempPowerPct}
                        onChange={(e) => handleGlobalFieldChange('tempPowerPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-black text-amber-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.tempPowerAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 6. Site Office Setup & Maintenance */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">6. Site Office Setup & Maintenance</span>
                      <span className="text-[10px] font-mono text-slate-400">% Direct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.contractorSiteOfficePct}
                        onChange={(e) => handleGlobalFieldChange('contractorSiteOfficePct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-black text-amber-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.siteOfficeAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 7. Printing, Documentations & Stationary */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">7. Printing, Docs & Stationary</span>
                      <span className="text-[10px] font-mono text-slate-400">% Direct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.stationaryCopyingPct}
                        onChange={(e) => handleGlobalFieldChange('stationaryCopyingPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-black text-amber-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.stationaryAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 8. HSE & Safety Equipment on Site */}
                  <div className="p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-black text-emerald-950 dark:text-emerald-100">8. HSE & Safety Equipment on Site</span>
                      <select
                        value={cfg.safetyFacilitiesMode}
                        onChange={(e) => handleGlobalFieldChange('safetyFacilitiesMode', e.target.value)}
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-emerald-400 text-emerald-700 dark:text-emerald-300 cursor-pointer"
                      >
                        <option value="percentage">% Direct</option>
                        <option value="calculated">Staff PPE Calc</option>
                        <option value="fixed">Fixed Lump</option>
                      </select>
                    </div>
                    {cfg.safetyFacilitiesMode === 'percentage' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={cfg.safetyFacilitiesPct}
                          onChange={(e) => handleGlobalFieldChange('safetyFacilitiesPct', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="font-black text-emerald-600">%</span>
                      </div>
                    ) : cfg.safetyFacilitiesMode === 'fixed' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={cfg.safetyFacilitiesFixedAmt}
                          onChange={(e) => handleGlobalFieldChange('safetyFacilitiesFixedAmt', parseFloat(e.target.value) || 0)}
                          className="w-32 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="font-black text-emerald-600 text-xs">EGP</span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 py-1">
                        {staffCalculationSummary.activeStaffCount} Staff × {cfg.safetyPpePerStaffMonthly} EGP/mo + {cfg.safetySignageAndFirstAid.toLocaleString()} Signage
                      </div>
                    )}
                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-emerald-700 dark:text-emerald-300">{m.safetyAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 9. Engineers & Site Staff Accommodation */}
                  <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-black text-amber-950 dark:text-amber-100">9. Engineers & Site Staff Accommodation</span>
                      <select
                        value={cfg.companyAccommodationMode}
                        onChange={(e) => handleGlobalFieldChange('companyAccommodationMode', e.target.value)}
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-amber-400 text-amber-700 dark:text-amber-300 cursor-pointer"
                      >
                        <option value="percentage">% Direct</option>
                        <option value="calculated">Staff Rent/Food</option>
                        <option value="fixed">Fixed Lump</option>
                      </select>
                    </div>
                    {cfg.companyAccommodationMode === 'percentage' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={cfg.companyAccommodationPct}
                          onChange={(e) => handleGlobalFieldChange('companyAccommodationPct', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="font-black text-amber-600">%</span>
                      </div>
                    ) : cfg.companyAccommodationMode === 'fixed' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={cfg.companyAccommodationFixedAmt}
                          onChange={(e) => handleGlobalFieldChange('companyAccommodationFixedAmt', parseFloat(e.target.value) || 0)}
                          className="w-32 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="font-black text-amber-600 text-xs">EGP</span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-amber-700 dark:text-amber-300 py-1">
                        {staffCalculationSummary.activeStaffCount} Staff Rent & Subsistence + {cfg.siteVehiclesCount} Vehicle
                      </div>
                    )}
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-800 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.accommAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 10. Site Supervision & Engineers Salaries */}
                  <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-amber-950 dark:text-amber-100">10. Site Supervision & Engineers Salaries</span>
                      <span className="text-[10px] font-mono text-amber-600 font-bold">% Direct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.salariesSiteStaffPct}
                        onChange={(e) => handleGlobalFieldChange('salariesSiteStaffPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-black text-amber-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-800 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.salariesAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 11. Testing, Commissioning & QA/QC Labs */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">11. Testing, Commissioning & QA/QC Labs</span>
                      <span className="text-[10px] font-mono text-slate-400">% Direct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.technicalServicesPct}
                        onChange={(e) => handleGlobalFieldChange('technicalServicesPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-black text-amber-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.techServAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 12. Head Office Overheads (G&A) */}
                  <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-amber-950 dark:text-amber-100">12. Head Office Overheads (G&A)</span>
                      <span className="text-[10px] font-mono text-amber-600 font-bold">% Direct</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.headOfficePct}
                        onChange={(e) => handleGlobalFieldChange('headOfficePct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="font-black text-amber-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-800 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-amber-700 dark:text-amber-300">{m.headOffAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 2: TIER 3 RISK & WARRANTY RESERVES */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Tier 3: Risk, Contingency & Warranty Reserves
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-800 dark:text-blue-300 font-mono text-[10px] font-black border border-blue-500/20">
                        {m.totalReserves.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP Total
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Calculated on Total Direct + Indirect Cost Base ({m.totalDirectAndIndirect.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* 13. Contingency Reserves */}
                  <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-blue-950 dark:text-blue-100">13. Contingency Reserves</span>
                      <span className="text-[10px] font-mono text-blue-500 font-bold">% Base</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={cfg.contingencyReservesPct}
                        onChange={(e) => handleGlobalFieldChange('contingencyReservesPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="font-black text-blue-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-blue-700 dark:text-blue-300">{m.contingencyAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 14. Management Reserves */}
                  <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-blue-950 dark:text-blue-100">14. Management Reserves</span>
                      <span className="text-[10px] font-mono text-blue-500 font-bold">% Base</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={cfg.managementReservesPct}
                        onChange={(e) => handleGlobalFieldChange('managementReservesPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="font-black text-blue-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-blue-700 dark:text-blue-300">{m.managementAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                  {/* 15. Guaranty 1 Year (Warranty Reserve) */}
                  <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2 shadow-2xs">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-blue-950 dark:text-blue-100">15. Guaranty 1 Year</span>
                      <span className="text-[10px] font-mono text-blue-500 font-bold">% Base</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={cfg.guaranty1YearPct}
                        onChange={(e) => handleGlobalFieldChange('guaranty1YearPct', parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="font-black text-blue-600">%</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800 font-mono text-xs flex justify-between">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-blue-700 dark:text-blue-300">{m.guarantyAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}

                    {/* TAB CONTENT 3: SITE STAFF SALARIES & HEAD OFFICE ALLOCATION */}
          {activeConfigTab === 'staff_salaries' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6 animate-fadeIn">
              
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Site Staff Salaries (Item 10) & Head Office Overheads (Item 12)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure percentage rates of Total Direct Cost Base ({m.directTotal.toLocaleString()} EGP).
                    </p>
                  </div>
                </div>
              </div>

              {/* 2 Big Interactive Percentage Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Card 1: 10. Site Supervision & Engineers Salaries */}
                <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/60 space-y-4 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono text-[10px] font-black uppercase">
                        Indirect Item 10
                      </span>
                      <h4 className="text-base font-black text-amber-950 dark:text-amber-100">
                        Site Supervision & Engineers Salaries
                      </h4>
                      <p className="text-xs text-slate-500">
                        Choose between Direct Cost % or the Assigned Site Staff Roster below.
                      </p>
                    </div>
                    <select
                      value={cfg.salariesSiteStaffMode}
                      onChange={(e) => handleGlobalFieldChange('salariesSiteStaffMode', e.target.value)}
                      className="text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-400 text-amber-800 dark:text-amber-300 cursor-pointer"
                    >
                      <option value="percentage">% of Direct Base</option>
                      <option value="staff_table">Site Staff Roster Table</option>
                      <option value="fixed">Fixed Lump Sum</option>
                    </select>
                  </div>

                  {cfg.salariesSiteStaffMode === 'percentage' ? (
                    <div className="flex items-center gap-3 pt-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Salary Percentage (%):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={cfg.salariesSiteStaffPct}
                          onChange={(e) => handleGlobalFieldChange('salariesSiteStaffPct', parseFloat(e.target.value) || 0)}
                          className="w-28 px-3 py-2 font-mono font-black text-base bg-white dark:bg-slate-800 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                        />
                        <span className="font-black text-amber-600 text-lg">%</span>
                      </div>
                    </div>
                  ) : cfg.salariesSiteStaffMode === 'fixed' ? (
                    <div className="flex items-center gap-3 pt-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Fixed Salary Amount (EGP):
                      </label>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={cfg.salariesSiteStaffFixedAmt}
                        onChange={(e) => handleGlobalFieldChange('salariesSiteStaffFixedAmt', parseFloat(e.target.value) || 0)}
                        className="w-36 px-3 py-2 font-mono font-black text-base bg-white dark:bg-slate-800 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-amber-800 dark:text-amber-300 pt-2">
                      Active Site Team: <strong>{staffCalculationSummary.activeStaffCount} Staff</strong> × <strong>{wholeProjectDuration.days} Working Days</strong>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 flex justify-between items-center font-mono">
                    <span className="text-xs text-slate-500">Calculated Salary Cost:</span>
                    <strong className="text-lg font-black text-amber-700 dark:text-amber-300">
                      {m.salariesAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                    </strong>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {cfg.salariesSiteStaffMode === 'staff_table'
                      ? `Formula: Sum of ${staffCalculationSummary.activeStaffCount} Active Site Staff Salaries`
                      : cfg.salariesSiteStaffMode === 'fixed'
                      ? 'Formula: Fixed Lump Sum Override'
                      : `Formula: ${cfg.salariesSiteStaffPct}% × ${m.directTotal.toLocaleString()} EGP Direct Base`}
                  </div>
                </div>

                {/* Card 2: 12. Head Office Overheads (G&A) */}
                <div className="p-6 rounded-3xl bg-amber-50/50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/60 space-y-4 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-mono text-[10px] font-black uppercase">
                        Indirect Item 12
                      </span>
                      <h4 className="text-base font-black text-amber-950 dark:text-amber-100">
                        Head Office Support & G&A
                      </h4>
                      <p className="text-xs text-slate-500">
                        Choose between Direct Cost % or Non-Direct Staff Days Pool.
                      </p>
                    </div>
                    <select
                      value={cfg.headOfficeCalculationMode}
                      onChange={(e) => handleGlobalFieldChange('headOfficeCalculationMode', e.target.value)}
                      className="text-xs font-mono font-bold px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-400 text-amber-800 dark:text-amber-300 cursor-pointer"
                    >
                      <option value="percentage">% of Direct Base</option>
                      <option value="days_pool">Non-Direct Days Pool</option>
                    </select>
                  </div>

                  {cfg.headOfficeCalculationMode === 'percentage' ? (
                    <div className="flex items-center gap-3 pt-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Head Office Percentage (%):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={cfg.headOfficePct}
                          onChange={(e) => handleGlobalFieldChange('headOfficePct', parseFloat(e.target.value) || 0)}
                          className="w-28 px-3 py-2 font-mono font-black text-base bg-white dark:bg-slate-800 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                        />
                        <span className="font-black text-amber-600 text-lg">%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-amber-800 dark:text-amber-300 pt-2">
                      Non-Direct Pool: <strong>{headOfficeStaffPoolSummary.headOfficeStaffCount} Staff</strong> × <strong>{headOfficeStaffPoolSummary.totalHoDaysApplied} Days</strong>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 flex justify-between items-center font-mono">
                    <span className="text-xs text-slate-500">Calculated Head Office Cost:</span>
                    <strong className="text-lg font-black text-amber-700 dark:text-amber-300">
                      {m.headOffAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                    </strong>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {cfg.headOfficeCalculationMode === 'days_pool'
                      ? `Formula: ${headOfficeStaffPoolSummary.headOfficeTotalDailyPayroll.toLocaleString()} EGP/day × ${headOfficeStaffPoolSummary.totalHoDaysApplied} Days`
                      : `Formula: ${cfg.headOfficePct}% × ${m.directTotal.toLocaleString()} EGP Direct Base`}
                  </div>
                </div>

              </div>

              {/* Top Key Metrics & Head Office Protection Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl text-xs">
                
                {/* 1. Project Duration Days */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="font-black text-amber-950 dark:text-amber-100">
                      Project Duration (Days):
                    </span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={cfg.customProjectDurationDays || wholeProjectDuration.days}
                      onChange={(e) => handleGlobalFieldChange('customProjectDurationDays', parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-1 font-mono font-black text-lg bg-amber-50/50 dark:bg-slate-900 border border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 text-amber-700 dark:text-amber-300"
                    />
                    <span className="text-xs font-bold text-slate-500">Working Days</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                    <span>~<strong>{wholeProjectDuration.months} Months</strong></span>
                    <span className="text-[10px] text-slate-400 font-sans" title="Max Single Task vs Sequential Task Sum">
                      Max: {wholeProjectDuration.maxDays}d | Sum: {wholeProjectDuration.sumDays}d
                    </span>
                  </div>
                </div>

                {/* 2. Active Direct Site Staff */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 space-y-1.5 shadow-2xs">
                  <span className="font-black text-amber-950 dark:text-amber-100 block">
                    Active Direct Site Team:
                  </span>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-slate-100">
                    {staffCalculationSummary.activeStaffCount} <span className="text-xs font-bold text-slate-500">Persons</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                    Combined Daily Rate: <strong className="text-slate-800 dark:text-slate-200">{staffCalculationSummary.totalDailyRateSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP/day</strong>
                  </div>
                </div>

                {/* 3. Total Project Staff Cost (Item 10) */}
                <div className="p-3.5 rounded-xl bg-amber-500 text-slate-950 font-mono space-y-1 shadow-md">
                  <span className="font-black text-xs uppercase tracking-wider block text-slate-950/80">
                    10. Total Site Salaries (Days × Rate):
                  </span>
                  <div className="text-2xl font-black">
                    {staffCalculationSummary.totalProjectStaffCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-bold">EGP</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-950/70 pt-0.5 border-t border-slate-950/20">
                    Formula: Salary/Day × {wholeProjectDuration.days} Days × Allocation %
                  </div>
                </div>

                {/* 4. Head Office Overheads (Non-Direct Staff Days Pool) */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="font-black text-amber-950 dark:text-amber-100">
                      12. Head Office ({headOfficeStaffPoolSummary.totalHoDaysApplied} Days Pool):
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsHeadOfficeListModalOpen(true)}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                    >
                      View Staff ({headOfficeStaffPoolSummary.headOfficeStaffCount})
                    </button>
                  </div>
                  <div className="text-2xl font-mono font-black text-amber-900 dark:text-amber-200">
                    {m.headOffAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-bold text-slate-500">EGP</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                    <span>{headOfficeStaffPoolSummary.headOfficeStaffCount} Non-Direct × {headOfficeStaffPoolSummary.totalHoDaysApplied} Days</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">Site Staff 100% Excluded</strong>
                  </div>
                </div>

              </div>

              {/* Dedicated Non-Direct Head Office Staff Control Indicator */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 dark:to-slate-900 border border-amber-300 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 shadow-sm">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Head Office Staff Pool ({headOfficeStaffPoolSummary.headOfficeStaffCount} Non-Direct Employees)
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-mono text-[10px] font-bold">
                        {headOfficeStaffPoolSummary.excludedSiteStaffCount} Site Staff Excluded
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Rule: {headOfficeStaffPoolSummary.daysBasis} Days / Month. For {wholeProjectDuration.days} Project Days → Applies exactly <strong>{headOfficeStaffPoolSummary.totalHoDaysApplied} Days</strong> of daily salary for each non-direct employee.
                    </p>
                  </div>
                </div>

                {/* Interactive Indicator & Input Controls */}
                <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                  
                  {/* Days per Month Basis */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-amber-400 dark:border-amber-700 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Rate Basis:</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      step="0.5"
                      value={cfg.headOfficeDaysPerMonthBasis ?? 3}
                      onChange={(e) => handleGlobalFieldChange('headOfficeDaysPerMonthBasis', parseFloat(e.target.value) || 0)}
                      className="w-14 px-1.5 py-0.5 text-center font-mono font-black text-xs bg-amber-50 dark:bg-slate-900 border border-amber-500 rounded-md focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="font-bold text-amber-600 text-xs">d/mo</span>
                  </div>

                  {/* Duration Handling Selector */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Days Rule:</span>
                    <select
                      value={cfg.headOfficeDurationHandling || 'exact_prorata'}
                      onChange={(e) => handleGlobalFieldChange('headOfficeDurationHandling', e.target.value)}
                      className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5"
                    >
                      <option value="exact_prorata">Pro-Rata Exact ({headOfficeStaffPoolSummary.totalHoDaysApplied} Days)</option>
                      <option value="min_1_month_floor">Min 1 Month Floor (Min {cfg.headOfficeDaysPerMonthBasis ?? 3} Days)</option>
                      <option value="custom_days">Custom Applied Days</option>
                    </select>
                  </div>

                  {cfg.headOfficeDurationHandling === 'custom_days' && (
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-amber-500 shadow-2xs">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Custom Days:</span>
                      <input
                        type="number"
                        min="0.5"
                        max="365"
                        step="0.5"
                        value={cfg.headOfficeCustomDays || headOfficeStaffPoolSummary.totalHoDaysApplied}
                        onChange={(e) => handleGlobalFieldChange('headOfficeCustomDays', parseFloat(e.target.value) || 0)}
                        className="w-16 px-1.5 py-0.5 text-center font-mono font-black text-xs bg-amber-50 dark:bg-slate-900 border border-amber-500 rounded-md"
                      />
                      <span className="font-bold text-amber-600">Days</span>
                    </div>
                  )}

                  {/* Live Cost Output Indicator */}
                  <div className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-sm flex items-center gap-2">
                    <span className="text-[10px] uppercase">HO Cost ({headOfficeStaffPoolSummary.totalHoDaysApplied}d):</span>
                    <span className="text-sm">{headOfficeStaffPoolSummary.headOfficeTotalProjectCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</span>
                  </div>

                  {/* View Head Office Employees List Button */}
                  <button
                    type="button"
                    onClick={() => setIsHeadOfficeListModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-amber-400 hover:text-slate-950 text-xs font-black transition cursor-pointer"
                  >
                    View Non-Direct Staff
                  </button>
                </div>
              </div>

              {/* Quick Search & Add Bar */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                  <span>Assigned Direct Site Team ({siteStaffRoster.length} Total • {staffCalculationSummary.activeStaffCount} Active On Project)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSiteStaffRoster(prev => prev.map(s => ({ ...s, activeOnProject: true })));
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-amber-600 px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Select All Active
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSiteStaffRoster(prev => prev.map(s => ({ ...s, activeOnProject: false })));
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-rose-600 px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Selected Staff Roster Table */}
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-3 text-center">Direct Site</th>
                      <th className="py-3 px-3 text-center font-mono">Code</th>
                      <th className="py-3 px-4">Employee Full Name & Position</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3 text-right font-black text-amber-700 dark:text-amber-400">Salary Per Day (EGP)</th>
                      <th className="py-3 px-3 text-center font-black text-slate-700 dark:text-slate-300">Project Days</th>
                      <th className="py-3 px-3 text-center font-black text-slate-700 dark:text-slate-300">Allocation %</th>
                      <th className="py-3 px-4 text-right font-black text-amber-900 dark:text-amber-200 bg-amber-50/60 dark:bg-amber-950/30">Total Person Salary</th>
                      <th className="py-3 px-3 text-right text-slate-400 font-mono">Monthly Ref</th>
                      <th className="py-3 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {siteStaffRoster.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 px-4 text-center">
                          <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 dark:border-amber-800 shadow-2xs">
                              <Users className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <div className="font-black text-sm text-slate-800 dark:text-slate-200">
                                No Site Staff Assigned Yet
                              </div>
                              <p className="text-xs text-slate-500 max-w-md">
                                Click the button below to search and select direct employees from the company roster ({COMPANY_EMPLOYEES_DIRECTORY.length} available) for this project.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsEmployeeDirectoryModalOpen(true)}
                              className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-black transition cursor-pointer shadow-md"
                            >
                              <Users className="w-4 h-4" />
                              <span>Select From Company Directory ({COMPANY_EMPLOYEES_DIRECTORY.length})</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      staffCalculationSummary.detailedStaff.map(staff => (
                      <tr 
                        key={staff.id} 
                        className={`transition ${
                          staff.activeOnProject ? 'bg-amber-50/20 dark:bg-amber-950/10' : 'opacity-50 hover:opacity-90 bg-slate-50/30'
                        }`}
                      >
                        {/* Direct on Project Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={staff.activeOnProject}
                            onChange={(e) => handleUpdateStaffMember(staff.id, 'activeOnProject', e.target.checked)}
                            className="w-4.5 h-4.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>

                        {/* Employee Code */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-500 text-[11px]">
                          #{staff.code || '—'}
                        </td>

                        {/* Name & Position */}
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-900 dark:text-slate-100 text-xs">
                            {staff.name || staff.role}
                          </div>
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                            {staff.jobTitle || staff.role}
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3 text-slate-500 text-[11px] font-medium">
                          {staff.department || 'Construction'}
                        </td>

                        {/* Salary Per Day */}
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              step="50"
                              min="0"
                              value={staff.daily}
                              onChange={(e) => handleUpdateStaffMember(staff.id, 'dailySalary', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-1 text-right font-mono font-bold bg-white dark:bg-slate-800 border border-amber-400/80 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
                            />
                            <span className="text-[10px] font-mono text-slate-400">/d</span>
                          </div>
                        </td>

                        {/* Project Duration Days */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="1"
                              max="3650"
                              value={staff.projectDays}
                              onChange={(e) => handleUpdateStaffMember(staff.id, 'customDays', parseInt(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 text-center font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            />
                            <span className="text-[10px] font-mono text-slate-400">d</span>
                          </div>
                        </td>

                        {/* Allocation % */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="10"
                              value={staff.allocationPct ?? 100}
                              onChange={(e) => handleUpdateStaffMember(staff.id, 'allocationPct', parseInt(e.target.value) || 0)}
                              className="w-14 px-1.5 py-1 text-center font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            />
                            <span className="text-slate-400 font-bold">%</span>
                          </div>
                        </td>

                        {/* Total Person Salary (Daily × Days × Alloc%) */}
                        <td className="py-3 px-4 text-right font-mono font-black text-amber-950 dark:text-amber-100 bg-amber-50/60 dark:bg-amber-950/30 text-xs">
                          {staff.activeOnProject ? `${staff.totalStaffCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP` : '—'}
                        </td>

                        {/* Monthly Salary Reference */}
                        <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                          {(staff.monthlySalary || (staff.daily * 25)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveStaff(staff.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Remove from project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-amber-100/70 dark:bg-amber-950/50 font-black text-xs border-t-2 border-amber-300 dark:border-amber-700">
                      <td colSpan={4} className="py-3 px-4 text-amber-950 dark:text-amber-100 uppercase">
                        Total Direct Site Salaries ({staffCalculationSummary.activeStaffCount} Active Staff):
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-900 dark:text-amber-200">
                        {staffCalculationSummary.totalDailyRateSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /day
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-center text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        Project Duration: {wholeProjectDuration.days} Days (~{wholeProjectDuration.months} Mos)
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-950 dark:text-white text-sm bg-amber-200/50 dark:bg-amber-900/50">
                        {staffCalculationSummary.totalProjectStaffCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* EMPLOYEE DIRECTORY BROWSER MODAL (233 EMPLOYEES) */}
              {isEmployeeDirectoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                    
                    {/* Modal Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                            Company Employee Directory ({COMPANY_EMPLOYEES_DIRECTORY.length} Staff Members)
                          </h3>
                          <p className="text-xs text-slate-500">
                            Search and select company employees to assign direct to this project.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEmployeeDirectoryModalOpen(false)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Search & Filter Controls */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search by Employee Name, Code (e.g. 84, 91, 79), Job Title, or Experience..."
                            value={employeeDirectorySearchQuery}
                            onChange={(e) => setEmployeeDirectorySearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
                          />
                        </div>
                      </div>

                      {/* Department Filter Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {['ALL', 'Construction', 'Technical Office', 'Financial', 'Procurement', 'General Management', 'Human Resource', 'Service Department', 'Administration', 'ERP'].map(dept => {
                          const isSel = employeeDirectoryDeptFilter === dept;
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => setEmployeeDirectoryDeptFilter(dept)}
                              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                                isSel
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {dept === 'ALL' ? 'All Departments' : dept}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Employees Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800">
                      {COMPANY_EMPLOYEES_DIRECTORY
                        .filter(emp => {
                          const matchesDept = employeeDirectoryDeptFilter === 'ALL' || emp.department.toLowerCase() === employeeDirectoryDeptFilter.toLowerCase();
                          const q = employeeDirectorySearchQuery.toLowerCase().trim();
                          const matchesQuery = !q || 
                            emp.name.toLowerCase().includes(q) ||
                            emp.code.toLowerCase().includes(q) ||
                            emp.jobTitle.toLowerCase().includes(q) ||
                            emp.department.toLowerCase().includes(q) ||
                            emp.experience.toLowerCase().includes(q);
                          return matchesDept && matchesQuery;
                        })
                        .map(emp => {
                          const alreadyAdded = siteStaffRoster.some(s => s.code === emp.code || s.id === emp.id);
                          return (
                            <div key={emp.id} className="py-3 px-2 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition">
                              <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 min-w-10 text-center">
                                  #{emp.code}
                                </span>
                                <div>
                                  <div className="font-black text-xs text-slate-900 dark:text-slate-100">
                                    {emp.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                    <span className="font-bold text-amber-600 dark:text-amber-400">{emp.jobTitle}</span>
                                    <span>•</span>
                                    <span>{emp.department}</span>
                                    {emp.experience && (
                                      <>
                                        <span>•</span>
                                        <span className="text-[10px] text-slate-400">{emp.experience}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right font-mono text-xs">
                                  <div className="font-black text-slate-900 dark:text-slate-100">
                                    {emp.monthlySalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP/mo
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {emp.dailySalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /day
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddEmployeeFromDirectory(emp)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                                    alreadyAdded 
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                                      : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-2xs'
                                  }`}
                                >
                                  {alreadyAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Assigned</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Assign to Site</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500">
                        Assigned {siteStaffRoster.length} employees to project roster
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEmployeeDirectoryModalOpen(false)}
                        className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-black text-xs transition cursor-pointer"
                      >
                        Done & Close
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* NON-DIRECT HEAD OFFICE STAFF POOL MODAL */}
              {isHeadOfficeListModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
                    
                    {/* Modal Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-amber-500 text-slate-950">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                            Non-Direct Head Office Staff Pool ({headOfficeStaffPoolSummary.headOfficeStaffCount} Staff)
                          </h3>
                          <p className="text-xs text-slate-500">
                            Listing all company employees who are NOT assigned to site. Applies {headOfficeStaffPoolSummary.daysBasis} days/month ({headOfficeStaffPoolSummary.totalHoDaysApplied} total days across {wholeProjectDuration.months} month(s)).
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsHeadOfficeListModalOpen(false)}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Summary Bar */}
                    <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800/40 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Head Office Staff:</span>
                        <strong className="text-slate-900 dark:text-slate-100">{headOfficeStaffPoolSummary.headOfficeStaffCount} Persons ({headOfficeStaffPoolSummary.excludedSiteStaffCount} Site Excluded)</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Combined Daily Payroll:</span>
                        <strong className="text-slate-900 dark:text-slate-100">{headOfficeStaffPoolSummary.headOfficeTotalDailyPayroll.toLocaleString()} EGP/day</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">{headOfficeStaffPoolSummary.totalHoDaysApplied}-Day Pool Cost ({wholeProjectDuration.months}m):</span>
                        <strong className="text-amber-700 dark:text-amber-300 text-sm">{headOfficeStaffPoolSummary.headOfficeTotalProjectCost.toLocaleString()} EGP</strong>
                      </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {COMPANY_EMPLOYEES_DIRECTORY
                        .filter(emp => {
                          const isSite = siteStaffRoster.some(s => (s.code === emp.code || s.id === emp.id) && s.activeOnProject);
                          return !isSite;
                        })
                        .map(emp => {
                          const daily = Number(emp.dailySalary) > 0 ? Number(emp.dailySalary) : Number(((emp.monthlySalary || 0) / 25).toFixed(2));
                          const appliedDays = headOfficeStaffPoolSummary.totalHoDaysApplied;
                          const costForDays = Number((daily * appliedDays).toFixed(2));
                          return (
                            <div key={emp.id} className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl transition">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-[11px] font-bold text-slate-400 w-10">#{emp.code}</span>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-slate-100">{emp.name}</div>
                                  <div className="text-[11px] text-slate-500">{emp.jobTitle} • {emp.department}</div>
                                </div>
                              </div>
                              <div className="text-right font-mono">
                                <div className="font-bold text-slate-800 dark:text-slate-200">{daily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} /day</div>
                                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-black">+{costForDays.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP ({appliedDays} Days)</div>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-500">
                        Total Head Office Cost: {headOfficeStaffPoolSummary.headOfficeTotalProjectCost.toLocaleString()} EGP
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsHeadOfficeListModalOpen(false)}
                        className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-black text-xs transition cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB CONTENT 4: MOBILIZATION & SITE OFFICE (9 DATABASE ITEMS) */}
          {activeConfigTab === 'mobilization_logistics' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6 animate-fadeIn">
              
              {/* Header Banner */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Mobilization & Site Office Setup Hub (Item 3)
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 font-mono text-[10px] font-black border border-teal-500/20">
                        {staffCalculationSummary.activeStaffCount} Direct Site Staff Driven
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Auto-calculates Caravans, Air Conditioning, PM & Staff Desks, Chairs, and Meeting Facilities directly from database formulas.
                    </p>
                  </div>
                </div>

                {/* Calculation Mode & Quick Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                    <span className="text-slate-500 text-[11px]">Mode:</span>
                    <select
                      value={cfg.mobilizationMode === 'items_roster' ? 'calculated' : cfg.mobilizationMode}
                      onChange={(e) => handleGlobalFieldChange('mobilizationMode', e.target.value)}
                      className="bg-transparent font-black text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-none"
                    >
                      <option value="calculated">Dynamic 9-Item Database Roster</option>
                      <option value="percentage">Percentage Base ({cfg.mobilizationPct}% Direct)</option>
                      <option value="fixed">Fixed Lump Sum</option>
                    </select>
                  </div>

                  {cfg.mobilizationMode === 'percentage' && (
                    <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-teal-400 text-xs font-mono">
                      <span className="text-slate-600 dark:text-slate-300 font-bold">Rate:</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={cfg.mobilizationPct}
                        onChange={(e) => handleGlobalFieldChange('mobilizationPct', parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-0.5 font-black bg-white dark:bg-slate-900 border border-teal-500 rounded-lg text-center"
                      />
                      <span className="font-black text-teal-600">%</span>
                    </div>
                  )}

                  {cfg.mobilizationMode === 'fixed' && (
                    <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-slate-800 px-3 py-1 rounded-xl border border-teal-400 text-xs font-mono">
                      <span className="text-slate-600 dark:text-slate-300 font-bold">Lump Sum:</span>
                      <input
                        type="number"
                        step="1000"
                        min="0"
                        value={cfg.mobilizationFixedAmt}
                        onChange={(e) => handleGlobalFieldChange('mobilizationFixedAmt', parseFloat(e.target.value) || 0)}
                        className="w-28 px-2 py-0.5 font-black bg-white dark:bg-slate-900 border border-teal-500 rounded-lg text-right"
                      />
                      <span className="font-black text-teal-600">EGP</span>
                    </div>
                  )}

                  {Object.keys(cfg.mobilizationCustomOverrides || {}).length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleGlobalFieldChange('mobilizationCustomOverrides', {})}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    >
                      Reset All to Formula Defaults
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Summary Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-teal-50/40 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 rounded-2xl text-xs">
                
                {/* 1. Direct Site Staff */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800/60 space-y-1 shadow-2xs">
                  <span className="font-black text-teal-950 dark:text-teal-100 block">
                    Direct Site Staff Base:
                  </span>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-slate-100">
                    {staffCalculationSummary.activeStaffCount} <span className="text-xs font-bold text-slate-500">Persons</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                    1 PM + {Math.max(0, staffCalculationSummary.activeStaffCount - 1)} Site Engineers
                  </div>
                </div>

                {/* 2. Total Caravans */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800/60 space-y-1 shadow-2xs">
                  <span className="font-black text-teal-950 dark:text-teal-100 block">
                    Site Caravans Required:
                  </span>
                  <div className="text-2xl font-mono font-black text-teal-700 dark:text-teal-300">
                    {mobilizationCalculationSummary.totalCaravansCount} <span className="text-xs font-bold text-slate-500">Units</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                    1 PM + {Math.max(0, Math.ceil((staffCalculationSummary.activeStaffCount - 1) / 5))} Staff Cabins (1/5 staff)
                  </div>
                </div>

                {/* 3. Total Air Conditioners */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800/60 space-y-1 shadow-2xs">
                  <span className="font-black text-teal-950 dark:text-teal-100 block">
                    Air Condition Units:
                  </span>
                  <div className="text-2xl font-mono font-black text-slate-900 dark:text-slate-100">
                    {mobilizationCalculationSummary.acCount} <span className="text-xs font-bold text-slate-500">ACs</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700">
                    1 AC for every active Caravan
                  </div>
                </div>

                {/* 4. Total Mobilization Item 3 Cost */}
                <div className="p-3.5 rounded-xl bg-teal-600 text-white font-mono space-y-1 shadow-md">
                  <span className="font-black text-xs uppercase tracking-wider block text-teal-100">
                    3. Total Mobilization Cost:
                  </span>
                  <div className="text-2xl font-black">
                    {m.mobAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-bold">EGP</span>
                  </div>
                  <div className="text-[10px] font-bold text-teal-100/80 pt-0.5 border-t border-teal-500/40">
                    Synchronized to Master Preliminary Item 3
                  </div>
                </div>

              </div>

              {/* Mobilization Items Detailed Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-3 text-center w-12">Active</th>
                      <th className="py-3 px-3 text-center font-mono w-16">Code</th>
                      <th className="py-3 px-4">Item Name & Specification</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-center w-16">Unit</th>
                      <th className="py-3 px-3 text-center font-black text-slate-700 dark:text-slate-300 w-28">Quantity</th>
                      <th className="py-3 px-3 text-right font-black text-teal-700 dark:text-teal-400 w-32">Unit Rate (EGP)</th>
                      <th className="py-3 px-4 text-right font-black text-teal-950 dark:text-teal-200 bg-teal-50/60 dark:bg-teal-950/30 w-36">Total Cost (EGP)</th>
                      <th className="py-3 px-4 text-slate-400">Database Calculation Logic</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {mobilizationCalculationSummary.detailedItems.map((item) => (
                      <tr 
                        key={item.id}
                        className={`transition ${
                          item.active ? 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30' : 'opacity-40 bg-slate-50/20'
                        }`}
                      >
                        {/* Active Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.active}
                            onChange={(e) => {
                              const cur = cfg.mobilizationCustomOverrides || {};
                              const itemOv = cur[item.id] || {};
                              handleGlobalFieldChange('mobilizationCustomOverrides', {
                                ...cur,
                                [item.id]: { ...itemOv, active: e.target.checked }
                              });
                            }}
                            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </td>

                        {/* Code */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-400 text-[11px]">
                          {item.code}
                        </td>

                        {/* Name & Specification */}
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-900 dark:text-slate-100 text-xs">
                            {item.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-xs">
                            UUID: {item.id}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px]">
                            {item.category}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {item.unit}
                        </td>

                        {/* Quantity (Auto / Editable) */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => {
                                const cur = cfg.mobilizationCustomOverrides || {};
                                const itemOv = cur[item.id] || {};
                                handleGlobalFieldChange('mobilizationCustomOverrides', {
                                  ...cur,
                                  [item.id]: { ...itemOv, customQty: parseInt(e.target.value) || 0 }
                                });
                              }}
                              className="w-16 px-1.5 py-1 text-center font-mono font-bold bg-white dark:bg-slate-800 border border-teal-400/80 rounded-lg text-xs focus:ring-2 focus:ring-teal-500"
                            />
                            {item.isCustomQty && (
                              <button
                                type="button"
                                onClick={() => {
                                  const cur = { ...(cfg.mobilizationCustomOverrides || {}) };
                                  if (cur[item.id]) {
                                    delete cur[item.id].customQty;
                                  }
                                  handleGlobalFieldChange('mobilizationCustomOverrides', cur);
                                }}
                                className="text-[10px] text-teal-600 hover:underline cursor-pointer"
                                title="Reset to auto formula"
                              >
                                ↺
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Unit Rate */}
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              step="500"
                              min="0"
                              value={item.unitRate}
                              onChange={(e) => {
                                const cur = cfg.mobilizationCustomOverrides || {};
                                const itemOv = cur[item.id] || {};
                                handleGlobalFieldChange('mobilizationCustomOverrides', {
                                  ...cur,
                                  [item.id]: { ...itemOv, customRate: parseFloat(e.target.value) || 0 }
                                });
                              }}
                              className="w-24 px-2 py-1 text-right font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                            />
                          </div>
                        </td>

                        {/* Total Cost */}
                        <td className="py-3 px-4 text-right font-mono font-black text-teal-950 dark:text-teal-100 bg-teal-50/60 dark:bg-teal-950/30 text-xs">
                          {item.active ? `${item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP` : '—'}
                        </td>

                        {/* Description / Formula Rule */}
                        <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                          {item.description}
                        </td>

                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr className="bg-teal-100/70 dark:bg-teal-950/50 font-black text-xs border-t-2 border-teal-300 dark:border-teal-700">
                      <td colSpan={5} className="py-3 px-4 text-teal-950 dark:text-teal-100 uppercase">
                        Total Mobilization Roster (9 Database Items):
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-teal-900 dark:text-teal-200">
                        {mobilizationCalculationSummary.detailedItems.reduce((s, i) => s + (i.active ? i.quantity : 0), 0)} Items
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        Total Sum:
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-teal-950 dark:text-white text-sm bg-teal-200/50 dark:bg-teal-900/50">
                        {mobilizationCalculationSummary.totalCalculatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                      </td>
                      <td className="py-3 px-4 text-teal-800 dark:text-teal-300 font-medium">
                        Rolls directly into Item 3 Mobilization
                      </td>
                    </tr>
                  </tfoot>

                </table>
              </div>

            </div>
          )}

{/* TAB CONTENT 5: TRADE & WORK-TYPE PROFIT MARGINS */}
          {activeConfigTab === 'profit_margins' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6 animate-fadeIn">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Percent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Trade & Work-Type Profit Margins (Item 16)
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-black border border-emerald-500/20">
                        +{m.weightedAvgMarginPct}% Weighted Average ({m.totalProfitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP Profit)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure baseline trade markups (Civil, Mechanical, Electrical) or drill down to granular BOQ work-types.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDisciplineMargins({ ...DEFAULT_DISCIPLINE_MARGINS });
                      setWorkTypeSpecificMargins({});
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  >
                    Reset Margins to Defaults
                  </button>
                </div>
              </div>

              {/* Discipline-Level Default Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {disciplinesTree.map(disc => {
                  const discInfo = m.disciplineBreakdown[disc.name] || {};
                  const currentMargin = disciplineMargins[disc.name] ?? DEFAULT_DISCIPLINE_MARGINS[disc.name] ?? 18.0;

                  return (
                    <div 
                      key={disc.name}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 shadow-2xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">{disc.name} Trade Base</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Base: {(discInfo.discBaseCost || 0).toLocaleString()} EGP
                          </span>
                        </div>
                        <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                          {currentMargin}%
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="0.5"
                          value={currentMargin}
                          onChange={(e) => handleDisciplineMarginChange(disc.name, parseFloat(e.target.value) || 0)}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={currentMargin}
                          onChange={(e) => handleDisciplineMarginChange(disc.name, parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 text-center font-mono font-bold text-xs bg-white dark:bg-slate-800 border rounded-lg"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 font-mono text-xs flex justify-between">
                        <span className="text-slate-500">Profit Generated:</span>
                        <strong className="text-emerald-700 dark:text-emerald-300">
                          {(discInfo.discProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Granular BOQ Work-Types Margin Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Granular BOQ Work-Type Profit Margins & Selling Multipliers</span>
                </h4>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-black tracking-wider text-slate-500 border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4">BOQ Work-Type</th>
                        <th className="py-3 px-3">Discipline</th>
                        <th className="py-3 px-3 text-right">Direct Cost (EGP)</th>
                        <th className="py-3 px-3 text-right">Base Cost (Inc. Prelims)</th>
                        <th className="py-3 px-4 text-center w-36">Profit Margin %</th>
                        <th className="py-3 px-4 text-right font-black text-emerald-600">Profit (EGP)</th>
                        <th className="py-3 px-4 text-right font-black text-emerald-950 dark:text-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20">Selling Total</th>
                        <th className="py-3 px-3 text-center font-mono">Multiplier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {disciplinesTree.flatMap(disc => 
                        disc.workTypes.map(wt => {
                          const wtInfo = m.workTypeBreakdown[wt.name] || {};
                          const defaultDiscMargin = disciplineMargins[disc.name] ?? DEFAULT_DISCIPLINE_MARGINS[disc.name] ?? 18.0;
                          const currentMargin = workTypeSpecificMargins[wt.name] ?? defaultDiscMargin;
                          const isOverridden = workTypeSpecificMargins[wt.name] !== undefined;

                          return (
                            <tr key={wt.name} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                                {wt.name}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  disc.name === 'Electrical'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                    : disc.name === 'Mechanical'
                                    ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}>
                                  {disc.name}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-500">
                                {wt.directCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                {(wtInfo.wtBaseCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 justify-center">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="100"
                                    value={currentMargin}
                                    onChange={(e) => handleWorkTypeMarginChange(wt.name, parseFloat(e.target.value) || 0)}
                                    className={`w-18 px-2 py-1 text-center font-mono font-bold text-xs rounded-lg border ${
                                      isOverridden 
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500' 
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                                    }`}
                                  />
                                  <span className="font-bold text-slate-400">%</span>
                                  {isOverridden && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setWorkTypeSpecificMargins(prev => {
                                          const copy = { ...prev };
                                          delete copy[wt.name];
                                          return copy;
                                        });
                                      }}
                                      className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                                      title="Reset to discipline default"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {(wtInfo.profitAmt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-emerald-950 dark:text-emerald-100 bg-emerald-50/40 dark:bg-emerald-950/20">
                                {(wtInfo.wtWithProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                              </td>
                              <td className="py-3 px-3 text-center font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {wtInfo.wtMultiplier || m.globalMarkupMultiplier}x
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-100/70 dark:bg-emerald-950/60 font-black text-xs border-t-2 border-emerald-300 dark:border-emerald-700">
                        <td colSpan={2} className="py-3 px-4 uppercase text-emerald-950 dark:text-emerald-100">
                          Total Trade Profit Margin:
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-900 dark:text-emerald-200">
                          {m.directTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-900 dark:text-emerald-200">
                          {m.totalDirectIndirectAndReserves.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-950 dark:text-emerald-100">
                          +{m.weightedAvgMarginPct}% Avg
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-950 dark:text-emerald-100">
                          +{m.totalProfitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-950 dark:text-white text-sm bg-emerald-200/50 dark:bg-emerald-900/50">
                          {m.totalWithProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-emerald-900 dark:text-emerald-200">
                          —
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT 6: GUARANTEES, INSURANCE & SALES COMMISSION (ITEMS 17-21) */}
          {activeConfigTab === 'commission_bid' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-6 animate-fadeIn">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-200 dark:border-purple-800/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      Tier 5: Sales Commissions, Financial Guarantees & Social Insurance (5 Items)
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-800 dark:text-purple-300 font-mono text-[10px] font-black border border-purple-500/20">
                        {(m.payGuarAmt + m.finalGuarAmt + m.finInterestAmt + m.socialInsAmt + m.salesCommAmt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP Total
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Calculated on Final Selling Price using divisor formula: <code className="font-mono text-purple-700 dark:text-purple-300">BH2 / (1 - (BQ2 + BO2 + BM2 + BK2 + BI2))</code>.
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-mono text-xs font-black">
                  Total with Profit Base (BH2): {m.totalWithProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
                </div>
              </div>

              {/* 5 Input Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* 17. Payment Guarantee */}
                <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/30 dark:bg-purple-950/20 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-purple-950 dark:text-purple-100 block">17. Payment Guarantee</span>
                    <span className="text-[10px] font-mono text-purple-600 font-bold">% Final</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={cfg.paymentGuaranteePct}
                      onChange={(e) => handleGlobalFieldChange('paymentGuaranteePct', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-purple-500 rounded-xl text-center focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="font-black text-purple-600 text-xs">%</span>
                  </div>
                  <div className="text-xs font-mono text-purple-700 dark:text-purple-300 pt-2 border-t border-purple-200 dark:border-purple-800 flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <strong>{m.payGuarAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                  </div>
                </div>

                {/* 18. Final Guarantee Discount */}
                <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/30 dark:bg-purple-950/20 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-purple-950 dark:text-purple-100 block">18. Final Guarantee Discount</span>
                    <span className="text-[10px] font-mono text-purple-600 font-bold">% Final</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={cfg.finalGuaranteePct}
                      onChange={(e) => handleGlobalFieldChange('finalGuaranteePct', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-purple-500 rounded-xl text-center focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="font-black text-purple-600 text-xs">%</span>
                  </div>
                  <div className="text-xs font-mono text-purple-700 dark:text-purple-300 pt-2 border-t border-purple-200 dark:border-purple-800 flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <strong>{m.finalGuarAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                  </div>
                </div>

                {/* 19. Financing Interest */}
                <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/30 dark:bg-purple-950/20 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-purple-950 dark:text-purple-100 block">19. Financing Interest</span>
                    <span className="text-[10px] font-mono text-purple-600 font-bold">% Final</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={cfg.financingInterestPct}
                      onChange={(e) => handleGlobalFieldChange('financingInterestPct', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-purple-500 rounded-xl text-center focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="font-black text-purple-600 text-xs">%</span>
                  </div>
                  <div className="text-xs font-mono text-purple-700 dark:text-purple-300 pt-2 border-t border-purple-200 dark:border-purple-800 flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <strong>{m.finInterestAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                  </div>
                </div>

                {/* 20. Social Insurance */}
                <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/30 dark:bg-purple-950/20 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-purple-950 dark:text-purple-100 block">20. Social Insurance</span>
                    <span className="text-[10px] font-mono text-purple-600 font-bold">% Final</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cfg.socialInsurancePct}
                      onChange={(e) => handleGlobalFieldChange('socialInsurancePct', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-purple-500 rounded-xl text-center focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="font-black text-purple-600 text-xs">%</span>
                  </div>
                  <div className="text-xs font-mono text-purple-700 dark:text-purple-300 pt-2 border-t border-purple-200 dark:border-purple-800 flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <strong>{m.socialInsAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                  </div>
                </div>

                {/* 21. Sales Commission */}
                <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/30 dark:bg-purple-950/20 space-y-2 shadow-2xs">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-purple-950 dark:text-purple-100 block">21. Sales Commission</span>
                    <span className="text-[10px] font-mono text-purple-600 font-bold">% Final</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={cfg.salesCommissionPct}
                      onChange={(e) => handleGlobalFieldChange('salesCommissionPct', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 font-mono font-black text-sm bg-white dark:bg-slate-800 border border-purple-500 rounded-xl text-center focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="font-black text-purple-600 text-xs">%</span>
                  </div>
                  <div className="text-xs font-mono text-purple-700 dark:text-purple-300 pt-2 border-t border-purple-200 dark:border-purple-800 flex justify-between">
                    <span className="text-slate-500">Amount:</span>
                    <strong>{m.salesCommAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP</strong>
                  </div>
                </div>

              </div>

            </div>
          )}        </div>
      )}

      {/* COMMERCIAL BOQ PRESENTATION (.PPTX) STUDIO MODAL */}
      <CommercialBoqPptxModal
        isOpen={isPptxModalOpen}
        onClose={() => setIsPptxModalOpen(false)}
        tender={activeTender}
        phases={tenderPhases}
        breakdownItems={activeTenderBoq}
        calculatedFinancials={calculatedFinancials}
        boqWorkTypes={boqWorkTypesList}
        catalogItems={catalogItemsList}
        templateId={templateId}
        setTemplateId={setTemplateId}
        tableMode={tableMode}
        setTableMode={setTableMode}
        pumpRoomSeparate={pumpRoomSeparate}
        setPumpRoomSeparate={setPumpRoomSeparate}
        granularity={granularity}
        setGranularity={setGranularity}
        includeCoverSlide={includeCoverSlide}
        setIncludeCoverSlide={setIncludeCoverSlide}
        includeSummarySlide={includeSummarySlide}
        setIncludeSummarySlide={setIncludeSummarySlide}
      />

    </div>
  );
}
