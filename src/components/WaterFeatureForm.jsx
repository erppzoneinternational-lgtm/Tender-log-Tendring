import React from 'react';
import { 
  Waves, 
  Ruler, 
  Layers, 
  Sparkles, 
  Sun, 
  Umbrella, 
  Footprints, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import StyledSelect from './StyledSelect';
import { 
  STATIC_WF_CATEGORIES_LOOKUP, 
  STATIC_WF_TYPES_LOOKUP,
  STATIC_WF_CATEGORY_TO_UUID,
  STATIC_WF_TYPE_TO_UUID,
  WF_TYPES_BY_CATEGORY,
  SKIMFILTER_FILTRATION_METHOD_UUID,
  isWfOverflow,
  isWfSkimmer,
  isWfSkimfilter,
  isWfLagoon,
  isWfSandBaseLagoon
} from '../lib/staticLookup';

export default function WaterFeatureForm({
  formData = {},
  onChange,
  proposals = [],
  phases = [],
  waterFeaturePhases = [],
  categories = [],
  featureTypes = [],
  finishesCategoryList = []

}) {
  const {
    tender_log_id = '',
    phase_id = '',
    water_feature_category = '',
    water_feature_type = '',
    swimming_pool_shape = '',
    swimming_pool_finishes_type = '',
    pool_length_m = '',
    pool_width_m = '',
    water_shallow_height_m = '',
    water_deep_height_m = '',
    avg_height_m = '',
    water_feature_area_m2 = '',
    water_feature_perimeter_m = '',
    walls_ground_base_width_m = '',
    water_feature_volume_m3 = '',
    water_feature_usage = '',
    hours_of_water_filtration_h = '',
    accommodations_required = 'No',
    
    // Beach (Lagoon)
    beach_included = 'No',
    beach_length_m = '',
    beach_width_m = '',
    beach_area_m2 = '',

    // Deep Retaining Walls (Lagoon)
    internal_external_walls_deep_part = 'No',
    outer_walls_height_deep_part_m = '',
    external_walls_length_deep_part_m = '',
    internal_walls_height_deep_part_m = '',
    internal_walls_length_deep_part_m = '',
    total_wall_length_deep_part_m = '',

    // Amenities (Lagoon)
    chaise_lounges_included = 'No',
    length_of_chaise_lounges_m = '',
    width_of_chaise_lounges_m = '',
    chaise_lounges_area_m2 = '',

    love_seats_included = 'No',
    length_of_love_seats_m = '',
    width_of_love_seats_m = '',
    love_seats_area_m2 = '',

    // Island & Stairs (Common)
    island_included = 'No',
    island_01_perimeter_m = '',
    island_01_area_m2 = '',
    island_01_height_m = '',
    island_02_perimeter_m = '',
    island_02_area_m2 = '',
    island_02_height_m = '',
    island_03_perimeter_m = '',
    island_03_area_m2 = '',
    island_03_height_m = '',

    concrete_stair_steps_included = 'No',
    type_of_concrete_stairs = 'Reinforced Concrete',
    lengths_of_concrete_stairs = '',
    height_of_concrete_stairs_m = ''
  } = formData || {};

  // Derived Category and Shape Flags using unified helper functions
  const isSwimmingPool = !isWfLagoon(water_feature_category) && (
    isWfOverflow(water_feature_type) ||
    isWfSkimmer(water_feature_type) ||
    isWfSkimfilter(water_feature_type) ||
    water_feature_category === 'Swimming Pool' || 
    water_feature_category === '2af5028b-4bec-403e-8825-75984bcbda28' ||
    (typeof water_feature_category === 'string' && water_feature_category.toLowerCase().includes('pool')) ||
    !water_feature_category
  );

  const isLagoon = isWfLagoon(water_feature_category);

  const isRectangle = isSwimmingPool && (
    swimming_pool_shape === 'Rectangle' || 
    (typeof swimming_pool_shape === 'string' && swimming_pool_shape.toLowerCase().includes('rect')) ||
    swimming_pool_shape === ''
  );

  const isSandBaseLagoon = isLagoon && isWfSandBaseLagoon(water_feature_type);

  const isBeachYes = isLagoon && (beach_included === 'Yes' || beach_included === true);
  const isWallsYes = isLagoon && (internal_external_walls_deep_part === 'Yes' || internal_external_walls_deep_part === true);
  const isChaiseYes = isLagoon && (chaise_lounges_included === 'Yes' || chaise_lounges_included === true);
  const isLoveSeatsYes = isLagoon && (love_seats_included === 'Yes' || love_seats_included === true);
  const isIslandYes = island_included === 'Yes' || island_included === true;
  const isStairsYes = concrete_stair_steps_included === 'Yes' || concrete_stair_steps_included === true;


  // Unified change handler with immediate formula recalculations
  const handleFieldChange = (field, value) => {
    const updated = {
      ...formData,
      [field]: value
    };

    // Auto-calculate Avg Height
    const sH = field === 'water_shallow_height_m' ? value : updated.water_shallow_height_m;
    const dH = field === 'water_deep_height_m' ? value : updated.water_deep_height_m;
    if (sH !== '' || dH !== '') {
      const shallow = Number(sH) || 0;
      const deep = Number(dH) || 0;
      updated.avg_height_m = Number(((shallow + deep) / 2).toFixed(2));
    }

    // Auto-calculate Rectangle Pool Area & Perimeter
    const catStr = String(updated.water_feature_category || '');
    const currentIsPool = !isWfLagoon(catStr) && (
      catStr === 'Swimming Pool' || 
      catStr === '2af5028b-4bec-403e-8825-75984bcbda28' || 
      catStr.toLowerCase().includes('pool') ||
      !catStr
    );
    const currentIsRect = (updated.swimming_pool_shape || 'Rectangle') === 'Rectangle';

    const pL = field === 'pool_length_m' ? value : updated.pool_length_m;
    const pW = field === 'pool_width_m' ? value : updated.pool_width_m;
    if (currentIsPool && currentIsRect && pL !== '' && pW !== '') {
      const len = Number(pL) || 0;
      const wid = Number(pW) || 0;
      if (len > 0 && wid > 0) {
        updated.water_feature_area_m2 = Number((len * wid).toFixed(2));
        updated.water_feature_perimeter_m = Number((2 * (len + wid)).toFixed(2));
      }
    }

    // Auto-calculate Water Volume (Area * Avg Height)
    const lenVal = Number(pL) || 0;
    const widVal = Number(pW) || 0;
    const currentArea = Number(updated.water_feature_area_m2) || ((lenVal > 0 && widVal > 0) ? (lenVal * widVal) : 0);
    const currentAvgH = Number(updated.avg_height_m) || Number(updated.water_deep_height_m) || Number(updated.water_shallow_height_m) || 1.4;
    if (currentArea > 0 && currentAvgH > 0) {
      updated.water_feature_volume_m3 = Number((currentArea * currentAvgH).toFixed(2));
    }

    // Auto-calculate Beach Area (L * W)
    const bL = field === 'beach_length_m' ? value : updated.beach_length_m;
    const bW = field === 'beach_width_m' ? value : updated.beach_width_m;
    if (bL !== '' && bW !== '') {
      updated.beach_area_m2 = Number((Number(bL) * Number(bW)).toFixed(2));
    }

    // Auto-calculate Deep Walls Total Length (External + Internal)
    const wExt = field === 'external_walls_length_deep_part_m' ? value : updated.external_walls_length_deep_part_m;
    const wInt = field === 'internal_walls_length_deep_part_m' ? value : updated.internal_walls_length_deep_part_m;
    if (wExt !== '' || wInt !== '') {
      updated.total_wall_length_deep_part_m = Number(((Number(wExt) || 0) + (Number(wInt) || 0)).toFixed(2));
    }

    // Auto-calculate Chaise Lounges Area (L * W)
    const cL = field === 'length_of_chaise_lounges_m' ? value : updated.length_of_chaise_lounges_m;
    const cW = field === 'width_of_chaise_lounges_m' ? value : updated.width_of_chaise_lounges_m;
    if (cL !== '' && cW !== '') {
      updated.chaise_lounges_area_m2 = Number((Number(cL) * Number(cW)).toFixed(2));
    }

    // Auto-calculate Love Seats Area (L * W)
    const lL = field === 'length_of_love_seats_m' ? value : updated.length_of_love_seats_m;
    const lW = field === 'width_of_love_seats_m' ? value : updated.width_of_love_seats_m;
    if (lL !== '' && lW !== '') {
      updated.love_seats_area_m2 = Number((Number(lL) * Number(lW)).toFixed(2));
    }

    onChange(updated);
  };

  // Parent Category Options with Canonical UUIDs and descriptive labels
  const categoryOptions = [
    { id: '2af5028b-4bec-403e-8825-75984bcbda28', label: 'Swimming Pool', desc: 'Overflow, Skimmer, Skimfilter & Olympic pools' },
    { id: 'b040678e-1343-4def-8fc8-2d6b5850fcbf', label: 'Lagoon', desc: 'Concrete base & Sand base lagoons' }
  ];

  // Derive Canonical Category UUID for Relational Filtering
  const activeCategoryUuid = 
    water_feature_category === 'Swimming Pool' || (!water_feature_category && isSwimmingPool) ? '2af5028b-4bec-403e-8825-75984bcbda28' :
    water_feature_category === 'Lagoon' ? 'b040678e-1343-4def-8fc8-2d6b5850fcbf' :
    (STATIC_WF_CATEGORY_TO_UUID[water_feature_category] || water_feature_category || '2af5028b-4bec-403e-8825-75984bcbda28');

  // Dynamically filter child types by parent category_id (Foreign Key Relationship)
  const childTypesList = (featureTypes && featureTypes.length > 0)
    ? featureTypes.filter(t => t.category_id === activeCategoryUuid)
    : (WF_TYPES_BY_CATEGORY[activeCategoryUuid] || []);

  const typeOptions = childTypesList.map(t => ({
    id: t.id,
    label: t.name || STATIC_WF_TYPES_LOOKUP[t.id] || t.title || t.id
  }));


  const shapeOptions = [
    { id: 'Rectangle', label: 'Rectangle' },
    { id: 'Free Form', label: 'Free Form' }
  ];

      // Finishes strictly from finishes_category database (Mosaic, Liner, Ceramic)
  const finishOptions = finishesCategoryList && finishesCategoryList.length > 0
    ? finishesCategoryList
        .filter(c => c.category_name && c.category_name !== 'Coping')
        .map(c => ({
          id: c.category_name,
          label: c.category_name
        }))
    : [
        { id: 'Mosaic', label: 'Mosaic' },
        { id: 'Liner', label: 'Liner' },
        { id: 'Ceramic', label: 'Ceramic' }
      ];

  const usageOptions = [
    { id: 'Swimmable', label: 'Swimmable (Default 6h turnover)' },
    { id: 'Unswimmable', label: 'Unswimmable (Default 12h turnover)' }
  ];

  const yesNoOptions = [
    { id: 'No', label: 'No' },
    { id: 'Yes', label: 'Yes' }
  ];

  return (
    <div className="space-y-6">
      
      {/* SECTION 0: Linkage */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>Section 0: Proposal & Phase Linkage</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Active Tender Proposal <span className="text-cyan-600">*</span>
            </label>
            <SearchableSelect
              options={proposals.map(p => ({
                id: p.id,
                label: `${p.proposal_number || 'SP.2026'}: ${p.proposal_title || p.proposal_full_title || 'Untitled'}`
              }))}
              value={tender_log_id}
              onChange={(val) => {
                const matchingPhases = phases ? phases.filter(p => p.tender_log_id === val) : [];
                const firstPhase = matchingPhases.find(p => p.component_type === 'Water Feature') || matchingPhases[0];
                onChange({
                  ...formData,
                  tender_log_id: val,
                  phase_id: firstPhase ? firstPhase.id : ''
                });
              }}
              placeholder="Select Tender Proposal..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Water Feature Phase <span className="text-cyan-600">*</span>
            </label>
            <SearchableSelect
              options={waterFeaturePhases.map(ph => ({
                id: ph.id,
                label: `${ph.phase_title || 'Phase'} ${ph.component_type ? `(${ph.component_type})` : ''}`
              }))}
              value={phase_id}
              onChange={(val) => handleFieldChange('phase_id', val)}
              disabled={!tender_log_id}
              placeholder={
                !tender_log_id 
                  ? "Select Tender Proposal first..." 
                  : (waterFeaturePhases.length > 0 ? "Select Water Feature Phase..." : "No phases found for this proposal")
              }
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: Classification & Core Geometry */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <span>Section 1: Classification & Core Geometry</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Category */}
          <StyledSelect
            label="Water Feature Category"
            required
            value={activeCategoryUuid}
            onChange={(cat) => {
              const isPool = cat === '2af5028b-4bec-403e-8825-75984bcbda28' || cat === 'Swimming Pool';
              const defaultTypeUuid = isPool 
                ? 'a8133ec0-271f-44e1-a693-c3c19efe19dc' // Overflow
                : '1657a003-b0c6-4fdc-9614-14861279dbed'; // Concrete Base Lagoon
              onChange({
                ...formData,
                water_feature_category: cat,
                water_feature_type: defaultTypeUuid,
                swimming_pool_shape: isPool ? 'Rectangle' : '',
                hours_of_water_filtration_h: isPool ? 6 : 12
              });
            }}
            options={categoryOptions}
            placeholder="Select Category..."
          />

          {/* Type */}
          <StyledSelect
            label="Water Feature Type"
            required
            value={STATIC_WF_TYPE_TO_UUID[water_feature_type] || water_feature_type}
            onChange={(val) => {
              const isSkim = isWfSkimfilter(val);
              if (isSkim) {
                onChange({
                  ...formData,
                  water_feature_type: val,
                  method_of_water_filtration: SKIMFILTER_FILTRATION_METHOD_UUID,
                  calculate_the_pump_room_boq: 'No',
                  no_of_pumps_room_related_to_the_water_feature: '0'
                });
              } else {
                handleFieldChange('water_feature_type', val);
              }
            }}
            options={typeOptions}
            disabled={!water_feature_category}
            placeholder={!water_feature_category ? "Select Category first..." : "Select Type..."}
          />

          {/* SHOW_IF(Category == 'Swimming Pool') -> Shape */}
          {isSwimmingPool && (
            <StyledSelect
              label="Swimming Pool Shape"
              value={swimming_pool_shape || 'Rectangle'}
              onChange={(val) => handleFieldChange('swimming_pool_shape', val)}
              options={shapeOptions}
              placeholder="Select Shape..."
            />
          )}

          {/* SHOW_IF(Category == 'Swimming Pool') -> Finishes Type */}
          {isSwimmingPool && (
            <StyledSelect
              label="Pool Finishes Type"
              value={swimming_pool_finishes_type}
              onChange={(val) => handleFieldChange('swimming_pool_finishes_type', val)}
              options={finishOptions}
              placeholder="Select Finish..."
            />
          )}

        </div>

        {/* SHOW_IF(Category == 'Swimming Pool' AND Shape == 'Rectangle') */}
        {isSwimmingPool && isRectangle && (
          <div className="p-4 bg-cyan-50/40 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/60 rounded-2xl space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-cyan-900 dark:text-cyan-300">
              Rectangle Pool Dimensions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Pool Length (m) <span className="text-cyan-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 10.0"
                  value={pool_length_m}
                  onChange={(e) => handleFieldChange('pool_length_m', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Pool Width (m) <span className="text-cyan-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.0"
                  value={pool_width_m}
                  onChange={(e) => handleFieldChange('pool_width_m', e.target.value)}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Depths & Calculations Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Shallow Height (m)
            </label>
            <input
              type="number"
              step="0.05"
              placeholder="e.g. 1.0"
              value={water_shallow_height_m}
              onChange={(e) => handleFieldChange('water_shallow_height_m', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Deep Height (m)
            </label>
            <input
              type="number"
              step="0.05"
              placeholder="e.g. 1.8"
              value={water_deep_height_m}
              onChange={(e) => handleFieldChange('water_deep_height_m', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Avg Height (m) <span className="text-cyan-600 text-[10px]">[Auto]</span>
            </label>
            <input
              type="number"
              readOnly
              value={avg_height_m}
              placeholder="Auto"
              className="w-full px-3 py-2 bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs text-cyan-900 dark:text-cyan-300 font-mono font-black"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Surface Area (m²) {isRectangle && <span className="text-cyan-600 text-[10px]">[Auto]</span>}
            </label>
            <input
              type="number"
              step="0.1"
              readOnly={isRectangle}
              placeholder="e.g. 50"
              value={water_feature_area_m2 !== undefined && water_feature_area_m2 !== null && water_feature_area_m2 !== '' ? water_feature_area_m2 : (isRectangle && Number(pool_length_m) > 0 && Number(pool_width_m) > 0 ? (Number(pool_length_m) * Number(pool_width_m)).toFixed(2) : '')}
              onChange={(e) => handleFieldChange('water_feature_area_m2', e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none ${
                isRectangle
                  ? 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-cyan-400'
              }`}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Perimeter (m) {isRectangle && <span className="text-cyan-600 text-[10px]">[Auto]</span>}
            </label>
            <input
              type="number"
              step="0.1"
              readOnly={isRectangle}
              placeholder="e.g. 30"
              value={water_feature_perimeter_m !== undefined && water_feature_perimeter_m !== null && water_feature_perimeter_m !== '' ? water_feature_perimeter_m : (isRectangle && Number(pool_length_m) > 0 && Number(pool_width_m) > 0 ? (2 * (Number(pool_length_m) + Number(pool_width_m))).toFixed(2) : '')}
              onChange={(e) => handleFieldChange('water_feature_perimeter_m', e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none ${
                isRectangle
                  ? 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-cyan-400'
              }`}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5 truncate">
              Water Volume (m³) <span className="text-emerald-600 text-[10px]">[Read-Only]</span>
            </label>
            <input
              type="number"
              readOnly
              value={water_feature_volume_m3 !== undefined && water_feature_volume_m3 !== null && water_feature_volume_m3 !== '' ? water_feature_volume_m3 : ((Number(water_feature_area_m2) || (Number(pool_length_m) * Number(pool_width_m))) > 0 && Number(avg_height_m || 1.4) > 0 ? ((Number(water_feature_area_m2) || (Number(pool_length_m) * Number(pool_width_m))) * Number(avg_height_m || 1.4)).toFixed(2) : '')}
              placeholder="Auto"
              className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 font-mono font-black"
            />
          </div>
        </div>

        {/* SHOW_IF(Category == 'Lagoon' AND Type == 'Sand Base Lagoon') */}
        {isSandBaseLagoon && (
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-1.5">
              Walls Ground Base Width (m) [Default: 1.2m]
            </label>
            <input
              type="number"
              step="0.05"
              placeholder="1.2"
              value={walls_ground_base_width_m}
              onChange={(e) => handleFieldChange('walls_ground_base_width_m', e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2 bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-mono font-bold"
            />
          </div>
        )}

        {/* Usage, Filtration & Accommodations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <StyledSelect
            label="Water Feature Usage"
            value={water_feature_usage}
            onChange={(u) => {
              onChange({
                ...formData,
                water_feature_usage: u,
                hours_of_water_filtration_h: u === 'Swimmable' ? 6 : 12
              });
            }}
            options={usageOptions}
            placeholder="Select Usage..."
          />

          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Turnover Period (Hours of Filtration)
            </label>
            <input
              type="number"
              placeholder="e.g. 6"
              value={hours_of_water_filtration_h}
              onChange={(e) => handleFieldChange('hours_of_water_filtration_h', e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <StyledSelect
            label="Site Accommodations Required"
            value={accommodations_required}
            onChange={(acc) => handleFieldChange('accommodations_required', acc)}
            options={yesNoOptions}
            placeholder="Select..."
          />
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: Beach & Shore Options (SHOW_IF: Category == 'Lagoon') */}
      {/* ========================================================================= */}
      {isLagoon && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
              <Sun className="w-4 h-4 text-teal-600" />
              <span>Section 2: Beach & Shore Options (Lagoon Only)</span>
            </div>
            <div className="w-36">
              <StyledSelect
                value={beach_included}
                onChange={(val) => handleFieldChange('beach_included', val)}
                options={yesNoOptions}
              />
            </div>
          </div>

          {isBeachYes && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Beach Length (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 20.0"
                  value={beach_length_m}
                  onChange={(e) => handleFieldChange('beach_length_m', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Beach Width (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 5.0"
                  value={beach_width_m}
                  onChange={(e) => handleFieldChange('beach_width_m', e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Beach Area (m²) <span className="text-teal-600 text-[10px]">[Auto: L × W]</span>
                </label>
                <input
                  type="number"
                  readOnly
                  value={beach_area_m2}
                  placeholder="Auto"
                  className="w-full px-3.5 py-2 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-mono font-black text-teal-900 dark:text-teal-300"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: Deep Part Retaining Walls (SHOW_IF: Category == 'Lagoon') */}
      {/* ========================================================================= */}
      {isLagoon && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Section 3: Deep Part Retaining Walls (Lagoon Only)</span>
            </div>
            <div className="w-36">
              <StyledSelect
                value={internal_external_walls_deep_part}
                onChange={(val) => handleFieldChange('internal_external_walls_deep_part', val)}
                options={yesNoOptions}
              />
            </div>
          </div>

          {isWallsYes && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Outer Walls Height (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="e.g. 2.0"
                    value={outer_walls_height_deep_part_m}
                    onChange={(e) => handleFieldChange('outer_walls_height_deep_part_m', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    External Walls Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.0"
                    value={external_walls_length_deep_part_m}
                    onChange={(e) => handleFieldChange('external_walls_length_deep_part_m', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Internal Walls Height (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="e.g. 2.0"
                    value={internal_walls_height_deep_part_m}
                    onChange={(e) => handleFieldChange('internal_walls_height_deep_part_m', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Internal Walls Length (m)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 10.0"
                    value={internal_walls_length_deep_part_m}
                    onChange={(e) => handleFieldChange('internal_walls_length_deep_part_m', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Total Wall Length (m) <span className="text-indigo-600 text-[10px]">[Auto]</span>
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={total_wall_length_deep_part_m}
                    placeholder="Auto"
                    className="w-full px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-mono font-black text-indigo-900 dark:text-indigo-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: Lagoon Amenities (SHOW_IF: Category == 'Lagoon') */}
      {/* ========================================================================= */}
      {isLagoon && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300">
            <Umbrella className="w-4 h-4 text-rose-600" />
            <span>Section 4: Lagoon Amenities (Chaise Lounges & Love Seats)</span>
          </div>

          {/* Chaise Lounges */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Chaise Lounges</span>
              <div className="w-32">
                <StyledSelect
                  value={chaise_lounges_included}
                  onChange={(val) => handleFieldChange('chaise_lounges_included', val)}
                  options={yesNoOptions}
                />
              </div>
            </div>

            {isChaiseYes && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Length of Chaise Lounges (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 2.0"
                    value={length_of_chaise_lounges_m}
                    onChange={(e) => handleFieldChange('length_of_chaise_lounges_m', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Width of Chaise Lounges (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 0.8"
                    value={width_of_chaise_lounges_m}
                    onChange={(e) => handleFieldChange('width_of_chaise_lounges_m', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Total Chaise Area (m²) [Auto]</label>
                  <input
                    type="number"
                    readOnly
                    value={chaise_lounges_area_m2}
                    placeholder="Auto"
                    className="w-full px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-xl text-xs font-mono font-bold text-rose-900 dark:text-rose-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Love Seats */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Love Seats</span>
              <div className="w-32">
                <StyledSelect
                  value={love_seats_included}
                  onChange={(val) => handleFieldChange('love_seats_included', val)}
                  options={yesNoOptions}
                />
              </div>
            </div>

            {isLoveSeatsYes && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Length of Love Seats (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 1.5"
                    value={length_of_love_seats_m}
                    onChange={(e) => handleFieldChange('length_of_love_seats_m', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Width of Love Seats (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 0.8"
                    value={width_of_love_seats_m}
                    onChange={(e) => handleFieldChange('width_of_love_seats_m', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Total Love Seats Area (m²) [Auto]</label>
                  <input
                    type="number"
                    readOnly
                    value={love_seats_area_m2}
                    placeholder="Auto"
                    className="w-full px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-xl text-xs font-mono font-bold text-rose-900 dark:text-rose-300"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: Island Structures & Concrete Stairs (Common) */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300">
          <Footprints className="w-4 h-4 text-purple-600" />
          <span>Section 5: Island Structures & Concrete Stairs (Common)</span>
        </div>

        {/* Islands Toggle */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Island Structures Included</span>
            <div className="w-32">
              <StyledSelect
                value={island_included}
                onChange={(val) => handleFieldChange('island_included', val)}
                options={yesNoOptions}
              />
            </div>
          </div>

          {isIslandYes && (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map(num => {
                const pKey = `island_0${num}_perimeter_m`;
                const aKey = `island_0${num}_area_m2`;
                const hKey = `island_0${num}_height_m`;

                return (
                  <div key={num} className="p-3 bg-white dark:bg-slate-900 border rounded-xl space-y-2">
                    <span className="text-[11px] font-mono font-bold text-purple-900 dark:text-purple-300">
                      Island 0{num}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Perimeter (m)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={formData[pKey] || ''}
                          onChange={(e) => handleFieldChange(pKey, e.target.value)}
                          className="w-full px-3 py-1.5 border rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Area (m²)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={formData[aKey] || ''}
                          onChange={(e) => handleFieldChange(aKey, e.target.value)}
                          className="w-full px-3 py-1.5 border rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Height (m)</label>
                        <input
                          type="number"
                          step="0.05"
                          placeholder="0.0"
                          value={formData[hKey] || ''}
                          onChange={(e) => handleFieldChange(hKey, e.target.value)}
                          className="w-full px-3 py-1.5 border rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stairs Toggle */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Concrete Stair Steps Included</span>
            <div className="w-32">
              <StyledSelect
                value={concrete_stair_steps_included}
                onChange={(val) => handleFieldChange('concrete_stair_steps_included', val)}
                options={yesNoOptions}
              />
            </div>
          </div>

          {isStairsYes && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <StyledSelect
                label="Type of Concrete Stairs"
                value={type_of_concrete_stairs}
                onChange={(val) => handleFieldChange('type_of_concrete_stairs', val)}
                options={[
                  { id: 'Reinforced Concrete', label: 'Reinforced Concrete' },
                  { id: 'Plain Concrete', label: 'Plain Concrete' }
                ]}
              />

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Lengths of Concrete Stairs (m)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 3.0"
                  value={lengths_of_concrete_stairs}
                  onChange={(e) => handleFieldChange('lengths_of_concrete_stairs', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Height of Concrete Stairs (m)</label>
                <input
                  type="number"
                  step="0.05"
                  placeholder="e.g. 1.2"
                  value={height_of_concrete_stairs_m}
                  onChange={(e) => handleFieldChange('height_of_concrete_stairs_m', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
