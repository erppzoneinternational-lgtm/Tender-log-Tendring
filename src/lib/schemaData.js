export const SCHEMA_CATEGORIES = [
  {
    id: 'tenders',
    name: 'Tenders & Scopes',
    description: 'Tender logs, project scope breakdown, client assignments and generated BOQs',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400',
    icon: 'FileSpreadsheet'
  },
  {
    id: 'catalog',
    name: 'Master Pricing & Items',
    description: 'Master items price list (1,150+ items), certified brands, item categories & BOQ units',
    color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400',
    icon: 'PackageSearch'
  },
  {
    id: 'mep',
    name: 'MEP Technical Specs',
    description: 'Filter pumps, media filters, electrical cables, conduits, glands, lighting & transformers',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400',
    icon: 'Cpu'
  },
  {
    id: 'civil',
    name: 'Civil, Finishes & Sizing',
    description: 'Structural works, finishes categories, mosaic & tile specifications, soil parameters',
    color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400',
    icon: 'Hammer'
  },
  {
    id: 'geography',
    name: 'Territories & Geography',
    description: 'Hierarchical geographical mapping: Countries -> Governorates -> Regions -> Districts',
    color: 'from-sky-500/20 to-indigo-500/20 border-sky-500/30 text-sky-400',
    icon: 'Globe'
  }
];

export const TABLES_CONFIG = [
  // --- TENDERS ---
  {
    id: 'tender_log',
    name: 'tender_log',
    displayName: 'Tender Logs (Proposals)',
    category: 'tenders',
    description: 'Master proposals registry containing client, project timeline, consultants, GPS, status & commercial overheads.',
    icon: 'FileText',
    primaryKey: 'id',
    displayField: 'proposal_full_title',
    relations: [
      { field: 'client_id', targetTable: 'clients', targetField: 'id', type: 'M:1', label: 'Client / Owner' },
      { field: 'country', targetTable: 'countries', targetField: 'id', type: 'M:1', label: 'Country' },
      { field: 'governorate', targetTable: 'governorates', targetField: 'id', type: 'M:1', label: 'Governorate' },
      { field: 'region', targetTable: 'regions', targetField: 'id', type: 'M:1', label: 'Region' },
      { field: 'district', targetTable: 'districts', targetField: 'id', type: 'M:1', label: 'District' },
      { field: 'id', targetTable: 'phases', targetField: 'tender_log_id', type: '1:M', label: 'Tender Phases' },
      { field: 'id', targetTable: 'proposal_data_entry', targetField: 'tender_log_id', type: '1:M', label: 'Water Feature Specs' },
      { field: 'id', targetTable: 'pump_room_data_entry', targetField: 'tender_log_id', type: '1:M', label: 'Pump Room Specs' }
    ]
  },
  {
    id: 'phases',
    name: 'phases',
    displayName: 'Project Phases & Scopes',
    category: 'tenders',
    description: 'Breakdown of scopes per tender (e.g. Main Pool, Jacuzzi, Water Feature, Pump Room).',
    icon: 'Layers',
    primaryKey: 'id',
    displayField: 'phase_full_title',
    relations: [
      { field: 'tender_log_id', targetTable: 'tender_log', targetField: 'id', type: 'M:1', label: 'Parent Tender' }
    ]
  },
  {
    id: 'boq_items',
    name: 'boq_items',
    displayName: 'BOQ Itemized Pricing',
    category: 'tenders',
    description: 'Generated Bill of Quantities breakdown per phase with unit rates and markup margins.',
    icon: 'Receipt',
    primaryKey: 'id',
    displayField: 'item_name',
    relations: [
      { field: 'phase_id', targetTable: 'phases', targetField: 'id', type: 'M:1', label: 'Phase Scope' },
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Master Item' }
    ]
  },
  {
    id: 'proposal_breakdown_items',
    name: 'proposal_breakdown_items',
    displayName: 'Proposal BOQ Breakdown Items',
    category: 'tenders',
    description: 'Synchronized Civil, Finishes, Mechanical & Electrical BOQ cost lines per proposal and phase.',
    icon: 'Receipt',
    primaryKey: 'id',
    displayField: 'item_description',
    relations: [
      { field: 'tender_log_id', targetTable: 'tender_log', targetField: 'id', type: 'M:1', label: 'Tender Proposal' },
      { field: 'phase_id', targetTable: 'phases', targetField: 'id', type: 'M:1', label: 'Phase Scope' },
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' }
    ]
  },
  {
    id: 'clients',
    name: 'clients',
    displayName: 'Clients & Stakeholders',
    category: 'tenders',
    description: 'Client directory with stakeholder classifications (Owner, Main Contractor, Consultants, Corporate).',
    icon: 'Users',
    primaryKey: 'id',
    displayField: 'title',
    relations: [
      { field: 'id', targetTable: 'tender_log', targetField: 'client_id', type: '1:M', label: 'Tenders' },
      { field: 'id', targetTable: 'districts', targetField: 'client_id', type: '1:M', label: 'Districts' }
    ]
  },

  // --- CATALOG ---
  {
    id: 'items',
    name: 'items',
    displayName: 'Master Items Catalog',
    category: 'catalog',
    description: 'Comprehensive price book (1,154+ records) with base unit prices, margins, I-Axiom codes & categories.',
    icon: 'Boxes',
    primaryKey: 'id',
    displayField: 'item_name',
    relations: [
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand / Manufacturer' },
      { field: 'item_category_id', targetTable: 'item_categories', targetField: 'id', type: 'M:1', label: 'Item Category' }
    ]
  },
  {
    id: 'brands',
    name: 'brands',
    displayName: 'Brands & Manufacturers',
    category: 'catalog',
    description: 'Approved manufacturers, equipment suppliers, and specification vendors.',
    icon: 'Award',
    primaryKey: 'id',
    displayField: 'title',
    relations: [
      { field: 'id', targetTable: 'items', targetField: 'brand_id', type: '1:M', label: 'Catalog Items' },
      { field: 'id', targetTable: 'cable_types', targetField: 'brand_id', type: '1:M', label: 'Cables' },
      { field: 'id', targetTable: 'filter_types', targetField: 'filter_brand', type: '1:M', label: 'Filters' },
      { field: 'id', targetTable: 'lighting_type', targetField: 'brand_id', type: '1:M', label: 'Lighting' }
    ]
  },
  {
    id: 'item_categories',
    name: 'item_categories',
    displayName: 'Item Categories',
    category: 'catalog',
    description: 'Classification taxonomy for 70+ MEP, civil, electrical, and structural materials.',
    icon: 'FolderTree',
    primaryKey: 'id',
    displayField: 'category_name',
    relations: [
      { field: 'id', targetTable: 'items', targetField: 'item_category_id', type: '1:M', label: 'Catalog Items' }
    ]
  },
  {
    id: 'boq_work_type',
    name: 'boq_work_type',
    displayName: 'BOQ Work Types & Units',
    category: 'catalog',
    description: 'Standard work classification activities and their corresponding tender measurement units.',
    icon: 'Briefcase',
    primaryKey: 'id',
    displayField: 'work_type',
    relations: []
  },

  // --- MEP EQUIPMENT ---
  {
    id: 'filter_pump_types',
    name: 'filter_pump_types',
    displayName: 'Filter Pump Specifications',
    category: 'mep',
    description: 'Centrifugal & circulation pool pumps with HP ratings, voltage, current draws & flow rate curves.',
    icon: 'Gauge',
    primaryKey: 'id',
    displayField: 'filter_pump_code',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' }
    ]
  },
  {
    id: 'filter_types',
    name: 'filter_types',
    displayName: 'Media Filter Specifications',
    category: 'mep',
    description: 'Sand/media filtration vessels with filtration velocities, surface areas, battery sizes & media volumes.',
    icon: 'Filter',
    primaryKey: 'id',
    displayField: 'filter_code',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' }
    ]
  },
  {
    id: 'cable_types',
    name: 'cable_types',
    displayName: 'Power Cables & Wiring',
    category: 'mep',
    description: 'Electrical power & subsea lighting cables, core counts, nominal cross sections & insulation.',
    icon: 'Zap',
    primaryKey: 'id',
    displayField: 'item_name',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand' }
    ]
  },
  {
    id: 'cable_glands',
    name: 'cable_glands',
    displayName: 'Cable Glands & Seals',
    category: 'mep',
    description: 'IP68 waterproof cable entry glands with min/max clamping diameters & thread sizes.',
    icon: 'Shield',
    primaryKey: 'id',
    displayField: 'code',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand' }
    ]
  },
  {
    id: 'cable_conduits',
    name: 'cable_conduits',
    displayName: 'Conduits & Raceways',
    category: 'mep',
    description: 'EMT, PVC & Liquid-tight conduits with inside/outside diameters, standard lengths & accessories.',
    icon: 'Maximize2',
    primaryKey: 'id',
    displayField: 'conduit_code',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand' }
    ]
  },
  {
    id: 'lighting_type',
    name: 'lighting_type',
    displayName: 'Underwater & Pool Lighting',
    category: 'mep',
    description: 'LED underwater fixtures, niche backboxes, lumens ratings and dedicated feeder cables.',
    icon: 'Lightbulb',
    primaryKey: 'id',
    displayField: 'item_code',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand' },
      { field: 'cable_type_id', targetTable: 'cable_types', targetField: 'id', type: 'M:1', label: 'Cable Spec' }
    ]
  },
  {
    id: 'transformer_type',
    name: 'transformer_type',
    displayName: 'Step-Down Transformers',
    category: 'mep',
    description: 'Safety isolating transformers (220V -> 12V/24V) with feeding, output cables & junction boxes.',
    icon: 'Activity',
    primaryKey: 'id',
    displayField: 'item_code',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'junction_box_id', targetTable: 'junction_box', targetField: 'id', type: 'M:1', label: 'Junction Box' },
      { field: 'feeding_cable_id', targetTable: 'cable_types', targetField: 'id', type: 'M:1', label: 'Feeding Cable' },
      { field: 'output_cable_id', targetTable: 'cable_types', targetField: 'id', type: 'M:1', label: 'Output Cable' }
    ]
  },
  {
    id: 'junction_box',
    name: 'junction_box',
    displayName: 'Junction & Connection Boxes',
    category: 'mep',
    description: 'Waterproof electrical junction boxes with dimensions, IP ratings & enclosure specifications.',
    icon: 'Square',
    primaryKey: 'id',
    displayField: 'code',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand' }
    ]
  },
  {
    id: 'heaters',
    name: 'heaters',
    displayName: 'Pool & Spa Heaters',
    category: 'mep',
    description: 'Heat pumps, gas heaters and electric calorifiers with thermal output (kW) calculations.',
    icon: 'Flame',
    primaryKey: 'id',
    displayField: 'heater_type',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand' }
    ]
  },
  {
    id: 'disconnect_switch_types',
    name: 'disconnect_switch_types',
    displayName: 'Disconnect Safety Switches',
    category: 'mep',
    description: 'Isolating switches, pole configurations, ampere ratings and weatherproof enclosures.',
    icon: 'ToggleRight',
    primaryKey: 'id',
    displayField: 'material',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand' }
    ]
  },
  {
    id: 'circulation_accessories',
    name: 'circulation_accessories',
    displayName: 'Inlets & Circulation Fittings',
    category: 'mep',
    description: 'Wall inlets, floor returns, and vacuum points with design flow rates.',
    icon: 'Compass',
    primaryKey: 'id',
    displayField: 'item_category',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' }
    ]
  },
  {
    id: 'main_drain',
    name: 'main_drain',
    displayName: 'Main Drains & Sumps',
    category: 'mep',
    description: 'Anti-vortex main drain grilles and sumps with rated max suction flow rates.',
    icon: 'CircleDot',
    primaryKey: 'id',
    displayField: 'flowrate',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand' }
    ]
  },
  {
    id: 'tablet_chlorinator',
    name: 'tablet_chlorinator',
    displayName: 'Chemical Feeders & Chlorinators',
    category: 'mep',
    description: 'Inline & offline tablet chlorination dispensers with chemical dosage capacities.',
    icon: 'Droplet',
    primaryKey: 'id',
    displayField: 'capacity',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' }
    ]
  },

  // --- CIVIL & FINISHES ---
  {
    id: 'civil_material_types',
    name: 'civil_material_types',
    displayName: 'Civil Construction Materials',
    category: 'civil',
    description: 'Mortars, stucco additives, waterproofing admixtures, and structural specification rates.',
    icon: 'Building',
    primaryKey: 'id',
    displayField: 'item_category',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'brand_id', targetTable: 'brands', targetField: 'id', type: 'M:1', label: 'Brand' }
    ]
  },
  {
    id: 'finishes_category',
    name: 'finishes_category',
    displayName: 'Finishes Categories',
    category: 'civil',
    description: 'High-level surface finishes categories (Glass Mosaic, Ceramic Tiles, Coping Stone, Epoxy Coatings).',
    icon: 'Grid',
    primaryKey: 'id',
    displayField: 'category_name',
    relations: [
      { field: 'id', targetTable: 'finishes_type', targetField: 'finishes_category_id', type: '1:M', label: 'Finishes Types' }
    ]
  },
  {
    id: 'finishes_type',
    name: 'finishes_type',
    displayName: 'Finishing Materials & Mosaic',
    category: 'civil',
    description: 'Surface finishing materials with color codes, tile dimensions, brands and pricing units.',
    icon: 'Paintbrush',
    primaryKey: 'id',
    displayField: 'item_type',
    relations: [
      { field: 'item_id', targetTable: 'items', targetField: 'id', type: 'M:1', label: 'Catalog Item' },
      { field: 'finishes_category_id', targetTable: 'finishes_category', targetField: 'id', type: 'M:1', label: 'Category' }
    ]
  },
  {
    id: 'water_feature_categories',
    name: 'water_feature_categories',
    displayName: 'Water Feature Categories',
    category: 'civil',
    description: 'Classification for water feature typologies (Architectural Fountain, Swimming Pool, Jacuzzi, Water Wall).',
    icon: 'Waves',
    primaryKey: 'id',
    displayField: 'name',
    relations: [
      { field: 'id', targetTable: 'water_feature_types', targetField: 'category_id', type: '1:M', label: 'Feature Types' }
    ]
  },
  {
    id: 'water_feature_types',
    name: 'water_feature_types',
    displayName: 'Water Feature Types',
    category: 'civil',
    description: 'Specific water feature engineering models linked to classification categories.',
    icon: 'Sparkles',
    primaryKey: 'id',
    displayField: 'name',
    relations: [
      { field: 'category_id', targetTable: 'water_feature_categories', targetField: 'id', type: 'M:1', label: 'Category' }
    ]
  },
  {
    id: 'lambda_factor',
    name: 'lambda_factor',
    displayName: 'Earthing Lambda Factors (?)',
    category: 'civil',
    description: 'Electrode array calculation coefficients for soil resistivity & earthing system design.',
    icon: 'Binary',
    primaryKey: 'id',
    displayField: 'lambda_factor_value',
    relations: []
  },
  {
    id: 'water_feature_structural_works',
    name: 'water_feature_structural_works',
    displayName: 'Water Feature Structural Works',
    category: 'civil',
    description: 'Excavation, PC footing, reinforced concrete walls & floors, coffor formwork, bitumen & cementitious waterproofing for water features.',
    icon: 'Hammer',
    primaryKey: 'id',
    displayField: 'id',
    relations: [
      { field: 'tender_log_id', targetTable: 'tender_log', targetField: 'id', type: 'M:1', label: 'Tender Proposal' },
      { field: 'linked_phase', targetTable: 'phases', targetField: 'id', type: 'M:1', label: 'Phase Scope' }
    ]
  },
  {
    id: 'pump_room_structural_works',
    name: 'pump_room_structural_works',
    displayName: 'Pump Room Structural Works',
    category: 'civil',
    description: 'Pump room excavation, PC footing, reinforced concrete sizing, coffor formwork, and waterproofing formulas.',
    icon: 'Box',
    primaryKey: 'id',
    displayField: 'id',
    relations: [
      { field: 'tender_log_id', targetTable: 'tender_log', targetField: 'id', type: 'M:1', label: 'Tender Proposal' },
      { field: 'linked_phase', targetTable: 'phases', targetField: 'id', type: 'M:1', label: 'Pump Room Phase' }
    ]
  },
  {
    id: 'proposal_finishes_water_feature',
    name: 'proposal_finishes_water_feature',
    displayName: 'Water Feature Finishes (proposal_finishes_water_feature)',
    category: 'civil',
    description: 'Tiling, glass mosaic, ceramic tiles, smooth & anti-slip liner, coping stones, and plastering stucco for water features.',
    icon: 'Palette',
    primaryKey: 'id',
    displayField: 'id',
    relations: [
      { field: 'linked_proposal', targetTable: 'tender_log', targetField: 'id', type: 'M:1', label: 'Tender Proposal' },
      { field: 'linked_phase', targetTable: 'proposal_data_entry', targetField: 'id', type: 'M:1', label: 'Water Feature Specs' }
    ]
  },
  {
    id: 'proposal_finishes_pump_room',
    name: 'proposal_finishes_pump_room',
    displayName: 'Pump Room Finishes (proposal_finishes_pump_room)',
    category: 'civil',
    description: 'Stucco plastering, epoxy coatings, and tiling for pump rooms and balance tanks.',
    icon: 'Paintbrush',
    primaryKey: 'id',
    displayField: 'id',
    relations: [
      { field: 'linked_proposal', targetTable: 'tender_log', targetField: 'id', type: 'M:1', label: 'Tender Proposal' },
      { field: 'linked_phase', targetTable: 'pump_room_data_entry', targetField: 'id', type: 'M:1', label: 'Pump Room Specs' }
    ]
  },

  // --- GEOGRAPHY ---
  {
    id: 'countries',
    name: 'countries',
    displayName: 'Countries',
    category: 'geography',
    description: 'Countries directory with ISO titles and national flag assets.',
    icon: 'Flag',
    primaryKey: 'id',
    displayField: 'title',
    relations: [
      { field: 'id', targetTable: 'governorates', targetField: 'country_id', type: '1:M', label: 'Governorates' },
      { field: 'id', targetTable: 'regions', targetField: 'country_id', type: '1:M', label: 'Regions' }
    ]
  },
  {
    id: 'governorates',
    name: 'governorates',
    displayName: 'Governorates / States',
    category: 'geography',
    description: 'Governorate / State administrative divisions within countries.',
    icon: 'Map',
    primaryKey: 'id',
    displayField: 'title',
    relations: [
      { field: 'country_id', targetTable: 'countries', targetField: 'id', type: 'M:1', label: 'Country' },
      { field: 'id', targetTable: 'regions', targetField: 'governorate_id', type: '1:M', label: 'Regions' }
    ]
  },
  {
    id: 'regions',
    name: 'regions',
    displayName: 'Operational Regions',
    category: 'geography',
    description: 'Operating operational territories linked to governorates and countries.',
    icon: 'MapPin',
    primaryKey: 'id',
    displayField: 'title',
    relations: [
      { field: 'country_id', targetTable: 'countries', targetField: 'id', type: 'M:1', label: 'Country' },
      { field: 'governorate_id', targetTable: 'governorates', targetField: 'id', type: 'M:1', label: 'Governorate' },
      { field: 'id', targetTable: 'districts', targetField: 'region_id', type: '1:M', label: 'Districts' }
    ]
  },
  {
    id: 'districts',
    name: 'districts',
    displayName: 'Districts & Postal Zones',
    category: 'geography',
    description: 'City zones, districts, postal addresses, and local corporate ownership.',
    icon: 'Compass',
    primaryKey: 'id',
    displayField: 'title',
    relations: [
      { field: 'region_id', targetTable: 'regions', targetField: 'id', type: 'M:1', label: 'Region' },
      { field: 'client_id', targetTable: 'clients', targetField: 'id', type: 'M:1', label: 'Corporate Client' }
    ]
  },
  {
    id: 'proposal_data_entry',
    name: 'proposal_data_entry',
    displayName: 'Water Feature Technical Entry',
    category: 'civil',
    description: 'Technical dimensions, turnover hours, lagoon beach shores, deep walls & island specifications.',
    icon: 'Waves',
    primaryKey: 'id',
    displayField: 'water_feature_type',
    relations: [
      { field: 'tender_log_id', targetTable: 'tender_log', targetField: 'id', type: 'M:1', label: 'Tender Proposal' },
      { field: 'phase_id', targetTable: 'phases', targetField: 'id', type: 'M:1', label: 'Phase Scope' }
    ]
  },
  {
    id: 'pump_room_data_entry',
    name: 'pump_room_data_entry',
    displayName: 'Pump Room Technical Entry',
    category: 'mep',
    description: 'Pump room dimensions, sump pit footprint, surge balance tanks & volume capacities.',
    icon: 'Cpu',
    primaryKey: 'id',
    displayField: 'pump_room_area_m2',
    relations: [
      { field: 'tender_log_id', targetTable: 'tender_log', targetField: 'id', type: 'M:1', label: 'Tender Proposal' },
      { field: 'linked_phase', targetTable: 'phases', targetField: 'id', type: 'M:1', label: 'Pump Room Phase' }
    ]
  },
];