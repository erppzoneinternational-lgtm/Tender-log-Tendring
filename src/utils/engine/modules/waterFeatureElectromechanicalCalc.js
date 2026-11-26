// src/utils/engine/modules/waterFeatureElectromechanicalCalc.js
import { 
  STATIC_WF_TYPES_LOOKUP,
  STATIC_WF_CATEGORIES_LOOKUP,
  isWfOverflow,
  isWfSkimmer,
  isWfSkimfilter,
  isWfLagoon,
  isWfSandBaseLagoon,
  isWfConcreteBaseLagoon,
  SKIMFILTER_FILTRATION_METHOD_UUID
} from '../../../lib/staticLookup.js';


export const getUuidItemName = (itemOrId, itemsList = []) => {
    if (!itemOrId) return '';
    const rawId = typeof itemOrId === 'object' ? String(itemOrId.id || itemOrId.value || '') : String(itemOrId);
    let name = typeof itemOrId === 'object' 
        ? String(itemOrId.item_name || itemOrId.title || itemOrId.name || itemOrId.label || itemOrId.value || '') 
        : '';
    if ((!name || name === rawId) && rawId && Array.isArray(itemsList)) {
        const foundItem = itemsList.find(i => String(i.id) === rawId);
        if (foundItem) {
            name = foundItem.item_name || foundItem.title || foundItem.name || rawId;
        }
    }
    return name || rawId;
};

export const calculateWaterFeatureElectromechanical = (u, parent = {}, opts = {}) => {
    let changed = false;

    const parseNum = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };

    if (u && !u.phase_id && u.linked_phase) {
        u.phase_id = u.linked_phase;
    }

    if (u) {
        if (u.underwater_light_type && String(u.water_feature_lighting_code || '') !== String(u.underwater_light_type)) {
            u.water_feature_lighting_code = u.underwater_light_type;
            changed = true;
        } else if (u.water_feature_lighting_code && String(u.underwater_light_type || '') !== String(u.water_feature_lighting_code)) {
            u.underwater_light_type = u.water_feature_lighting_code;
            changed = true;
        }
    }

    const findLinkedPhase = (uVal, pdeList) => {
        if (!uVal || !Array.isArray(pdeList)) return null;
        const uPhaseId = String(uVal.phase_id || '');
        const uLinkedPhase = String(uVal.linked_phase || '');
        const uTenderLogId = String(uVal.linked_proposal || uVal.tender_log_id || '');
        
        let matching = pdeList.filter(p => {
            const pId = String(p.id || '');
            const pPhaseId = String(p.phase_id || p.linked_phase || '');
            if (uPhaseId && (pId === uPhaseId || pPhaseId === uPhaseId)) return true;
            if (uLinkedPhase && (pId === uLinkedPhase || pPhaseId === uLinkedPhase)) return true;
            return false;
        });
        if (matching.length === 0 && uTenderLogId) {
            matching = pdeList.filter(p => {
                const pTenderLogId = String(p.tender_log_id || p.linked_proposal || '');
                return pTenderLogId && pTenderLogId === uTenderLogId;
            });
        }
        if (matching.length === 0) return null;
        // Prioritize candidate with actual dimensions
        const withDims = matching.find(p => Number(p.water_feature_area_m2 || p.water_feature_area || (Number(p.pool_length_m) * Number(p.pool_width_m))) > 0);
        return withDims || matching[0];
    };

    // 1. Auto-fill from Linked Phase (proposal_data_entry)
    let linkedPhase = null;
    if (u.phase_id && opts.proposal_data_entry) {
        linkedPhase = findLinkedPhase(u, opts.proposal_data_entry);
        if (linkedPhase) {
            const pL = parseNum(linkedPhase.pool_length_m || u.pool_length_m);
            const pW = parseNum(linkedPhase.pool_width_m || u.pool_width_m);
            const calcAr = (pL > 0 && pW > 0) ? Number((pL * pW).toFixed(2)) : 0;
            const resArea = parseNum(linkedPhase.water_feature_area_m2 || linkedPhase.water_feature_area) || calcAr;
            const resDepth = parseNum(linkedPhase.avg_height_m || linkedPhase.water_deep_height_m || linkedPhase.depth_m) || 1.4;
            const resVol = parseNum(linkedPhase.water_feature_volume_m3 || linkedPhase.water_feature_volume) || (resArea > 0 ? Number((resArea * resDepth).toFixed(2)) : 0);
            const resPerim = parseNum(linkedPhase.water_feature_perimeter_m || linkedPhase.water_feature_perimeter) || (pL > 0 && pW > 0 ? Number((2 * (pL + pW)).toFixed(2)) : 0);

            if (resArea > 0 && (!u.water_feature_area_m2 || parseNum(u.water_feature_area_m2) === 0)) {
                u.water_feature_area_m2 = resArea;
                u.water_feature_area = String(resArea);
                changed = true;
            }
            if (resVol > 0 && (!u.water_feature_volume_m3 || parseNum(u.water_feature_volume_m3) === 0)) {
                u.water_feature_volume_m3 = resVol;
                u.water_feature_volume = String(resVol);
                changed = true;
            }
            if (resPerim > 0 && (!u.water_feature_perimeter_m || parseNum(u.water_feature_perimeter_m) === 0)) {
                u.water_feature_perimeter_m = resPerim;
                u.water_feature_perimeter = String(resPerim);
                changed = true;
            }
            if (!u.depth_m) {
                u.depth_m = resDepth;
                changed = true;
            }
            if (!u.pool_length_m && pL > 0) {
                u.pool_length_m = pL;
                changed = true;
            }
            if (!u.pool_width_m && pW > 0) {
                u.pool_width_m = pW;
                changed = true;
            }

            if (!u.water_feature_type && linkedPhase.water_feature_type) {
                u.water_feature_type = linkedPhase.water_feature_type;
            }
            if (!u.water_feature_category && linkedPhase.water_feature_category) {
                u.water_feature_category = linkedPhase.water_feature_category;
            }
            if (linkedPhase.hours_of_water_filtration_h) {
                if (!u.hours_of_filtration && u.hours_of_filtration !== 0 && u.hours_of_filtration !== '0') {
                    u.hours_of_filtration = String(linkedPhase.hours_of_water_filtration_h);
                    changed = true;
                }
            }
            if (linkedPhase.method_of_water_filtration) {
                const methStr = String(linkedPhase.method_of_water_filtration);
                if (u.water_filtration_method !== methStr) {
                    u.water_filtration_method = methStr;
                    changed = true;
                }
            }
            if (linkedPhase.related_pump_rooms && (!u.related_pump_rooms || u.related_pump_rooms.length === 0)) {
                u.related_pump_rooms = linkedPhase.related_pump_rooms;
                changed = true;
            }
        }
    }

    const pLen = parseNum(u.pool_length_m || parent?.pool_length_m || linkedPhase?.pool_length_m);
    const pWid = parseNum(u.pool_width_m || parent?.pool_width_m || linkedPhase?.pool_width_m);
    const calcAreaFromDim = (pLen > 0 && pWid > 0) ? Number((pLen * pWid).toFixed(2)) : 0;

    const wfArea = parseNum(
        u.water_feature_area_m2 || 
        u.water_feature_area || 
        parent?.water_feature_area_m2 || 
        parent?.water_feature_area || 
        linkedPhase?.water_feature_area_m2 ||
        calcAreaFromDim
    ) || 50;

    const wfDepth = parseNum(
        u.depth_m || 
        u.avg_height_m || 
        parent?.avg_height_m || 
        parent?.pool_depth_m || 
        linkedPhase?.avg_height_m || 
        1.4
    );

    const wfVolume = parseNum(
        u.water_feature_volume_m3 || 
        u.water_feature_volume || 
        parent?.water_feature_volume_m3 || 
        parent?.water_feature_volume || 
        linkedPhase?.water_feature_volume_m3 ||
        (wfArea * wfDepth)
    ) || Number((wfArea * wfDepth).toFixed(2));

    const wfPerimeter = parseNum(
        u.water_feature_perimeter_m || 
        u.water_feature_perimeter || 
        parent?.water_feature_perimeter_m || 
        parent?.water_feature_perimeter || 
        linkedPhase?.water_feature_perimeter_m ||
        (pLen > 0 && pWid > 0 ? Number((2 * (pLen + pWid)).toFixed(2)) : 0)
    ) || 30;

    // Ensure synchronized dimensional properties on output
    u.water_feature_area_m2 = wfArea;
    u.water_feature_area = String(wfArea);
    u.water_feature_volume_m3 = wfVolume;
    u.water_feature_volume = String(wfVolume);
    u.water_feature_perimeter_m = wfPerimeter;
    u.water_feature_perimeter = String(wfPerimeter);
    u.depth_m = wfDepth;

    const rawType = String(u.water_feature_type || parent?.water_feature_type || linkedPhase?.water_feature_type || '');
    const resolvedType = (STATIC_WF_TYPES_LOOKUP[rawType] || rawType).toLowerCase();
    const rawCategory = String(u.water_feature_category || parent?.water_feature_category || linkedPhase?.water_feature_category || '');
    const isOverflow = isWfOverflow(rawType) || isWfOverflow(resolvedType);
    const isSkimfilter = isWfSkimfilter(rawType, u.water_filtration_method) || isWfSkimfilter(resolvedType);
    const isLagoon = isWfLagoon(rawCategory) || isWfLagoon(rawType) || isWfLagoon(resolvedType);


    // =========================================================================
    // SUB-TAB 1: TURNOVER & FILTRATION MATHEMATICAL SIZING
    // =========================================================================
    const hrs = parseNum(u.hours_of_filtration) || 6;
    if (!u.hours_of_filtration) u.hours_of_filtration = '6';

    const filtSpeed = parseNum(u.filtration_speed) || 40;
    if (!u.filtration_speed) u.filtration_speed = '40';

    let waterFiltNum = 0;
    if (wfVolume > 0 && hrs > 0) {
        waterFiltNum = Number((wfVolume / hrs).toFixed(2));
        u.water_filtration = waterFiltNum.toString();
        const reqArea = Number((waterFiltNum / filtSpeed).toFixed(3));
        u.required_filtration_area_m2 = reqArea;
    } else {
        u.water_filtration = u.water_filtration || '0.00';
        u.required_filtration_area_m2 = u.required_filtration_area_m2 || 0;
    }

    // Auto Sizing of Primary Sand Filters
    const mediaFiltersList = opts.mediaFilters || opts.filter_types || [];
    let selectedFilterSpec = null;
    if (u.water_filter_code) {
        selectedFilterSpec = mediaFiltersList.find(f => String(f.id) === String(u.water_filter_code));
        // If brand was specified and doesn't match selected code, re-evaluate
        if (u.water_filter_brand && selectedFilterSpec) {
            const specBrand = selectedFilterSpec.filter_brand || selectedFilterSpec.brand_id;
            if (String(specBrand) !== String(u.water_filter_brand)) {
                selectedFilterSpec = null;
                u.water_filter_code = '';
            }
        }
    }

    // Exact AppSheet Formula for Filter Diameter & Model Selection:
    // IF(ISNOTBLANK(SELECT(Filter Type[Min.Flow Rate], AND([Filter Brand]=[Brand], [Min.Flow Rate] >= [Water Filtration]))),
    //    LOOKUP(MIN(SELECT(Filter Type[Min.Flow Rate], AND([Filter Brand]=[Brand], [Min.Flow Rate] >= [Water Filtration]))), "Filter Type", "Min.Flow Rate", "Filter Dia"),
    //    LOOKUP(MAX(SELECT(Filter Type[Min.Flow Rate], [Filter Brand]=[Brand])), "Filter Type", "Min.Flow Rate", "Filter Dia"))
    if (!selectedFilterSpec && mediaFiltersList.length > 0 && (!u.water_filter_code || u.water_filter_code === '')) {
        let brandFilters = mediaFiltersList;
        if (u.water_filter_brand) {
            brandFilters = mediaFiltersList.filter(f => String(f.filter_brand) === String(u.water_filter_brand) || String(f.brand_id) === String(u.water_filter_brand));
            if (brandFilters.length === 0) brandFilters = mediaFiltersList;
        }
        const validFilters = brandFilters.filter(f => Number(f.min_flow_rate || 0) > 0);
        if (validFilters.length > 0) {
            if (waterFiltNum > 0) {
                const sufficientFilters = validFilters.filter(f => Number(f.min_flow_rate) >= waterFiltNum);
                if (sufficientFilters.length > 0) {
                    // MIN flow rate among sufficient filters
                    selectedFilterSpec = [...sufficientFilters].sort((a, b) => Number(a.min_flow_rate) - Number(b.min_flow_rate))[0];
                } else {
                    // MAX flow rate among brand filters
                    selectedFilterSpec = [...validFilters].sort((a, b) => Number(b.min_flow_rate) - Number(a.min_flow_rate))[0];
                }
            } else {
                selectedFilterSpec = validFilters.find(f => Number(f.filter_dia) === 1050 || Number(f.filter_dia) === 650) || validFilters[0];
            }

            if (selectedFilterSpec && !u.water_filter_code) {
                u.water_filter_code = selectedFilterSpec.id;
                if (selectedFilterSpec.filter_dia) u.water_filter_diameter = String(selectedFilterSpec.filter_dia);
                if (selectedFilterSpec.filter_brand) u.water_filter_brand = selectedFilterSpec.filter_brand;
            }
        }
    }

    // Calculate N_filter = max(1, ceil(Q_filt / Q_model)) strictly when filter model is selected
    if (selectedFilterSpec || u.water_filter_code) {
        const filterModelFlow = Number(selectedFilterSpec?.min_flow_rate) || parseNum(u.water_filter_quanitity_coverage_filtration) || 14;
        const calculatedFilterQty = (waterFiltNum > 0 && filterModelFlow > 0) ? Math.max(1, Math.ceil(waterFiltNum / filterModelFlow)) : (parseNum(u.no_of_water_filter) || 1);
        u.no_of_water_filter = String(calculatedFilterQty);
    } else {
        u.no_of_water_filter = '0';
    }

    // =========================================================================
    // TOTAL NO. OF (H) AND (T) NETWORKS (Strictly when Sand Filter is selected)
    // =========================================================================
    const filtMethod = String(u.water_filtration_method || 'sand_filter').toLowerCase();
    const isSandOrRmf = filtMethod.includes('sand') || filtMethod.includes('rmf') || filtMethod.includes('media') || filtMethod === 'sand_filter' || filtMethod === 'rmf';
    
    const numFilters = parseNum(u.no_of_water_filter);
    const filterFlowRate = (selectedFilterSpec || u.water_filter_code) 
        ? (Number(selectedFilterSpec?.min_flow_rate) || parseNum(u.water_filter_quanitity_coverage_filtration) || 0)
        : 0;
    u.water_filter_quanitity_coverage_filtration = String(filterFlowRate);

    // Total No. H = Ceiling((total number of filters * the flow rate of the filter) / 40)
    let totalNoH = 0;
    if (isSandOrRmf && (selectedFilterSpec || u.water_filter_code) && numFilters > 0 && filterFlowRate > 0) {
        totalNoH = Math.ceil((numFilters * filterFlowRate) / 40);
    }
    u.total_no_of_h_networks = String(totalNoH);

    // Total No. of T = Ceiling(if(total no H > 1, Total No H / 2, 0))
    const totalNoT = totalNoH > 1 ? Math.ceil(totalNoH / 2) : 0;
    u.total_no_of_t_networks = String(totalNoT);

    // Vacuum Filters: Defaults to 0 unless user chooses a vacuum filter model
    const vacFilterSpec = mediaFiltersList.find(f => String(f.id) === String(u.vacuum_filter_code));
    if (vacFilterSpec) {
        if (!u.no_of_vacuum_filter || u.no_of_vacuum_filter === '0') {
            const calculatedVac = wfPerimeter > 0 ? Math.max(1, Math.ceil(wfPerimeter / 100)) : 1;
            u.no_of_vacuum_filter = String(calculatedVac);
        }
    } else if (!u.no_of_vacuum_filter) {
        u.no_of_vacuum_filter = '0';
    }

    if (u.drainage_chamber === undefined || u.drainage_chamber === null) {
        u.drainage_chamber = 0;
    }

    // =========================================================================
    // PUMP ROOM GEOMETRY & BALANCE TANK AGGREGATION
    // =========================================================================
    let hasBalanceTank = false;
    if (u.related_pump_rooms && opts.pump_room_data_entry) {
        let selectedIds = [];
        try {
            const parsed = typeof u.related_pump_rooms === 'string' && u.related_pump_rooms.startsWith('[') 
                ? JSON.parse(u.related_pump_rooms) 
                : u.related_pump_rooms;
                
            if (Array.isArray(parsed)) {
                selectedIds = parsed.map(id => typeof id === 'object' && id !== null ? String(id.id || id.value || '') : String(id));
            } else if (typeof parsed === 'string') {
                selectedIds = parsed.split(',').map(id => id.replace(/["'\[\]]/g, '').trim()).filter(Boolean);
            }
        } catch (e) {
            selectedIds = String(u.related_pump_rooms).split(',').map(id => id.replace(/["'\[\]]/g, '').trim()).filter(Boolean);
        }
        
        const selectedPRs = opts.pump_room_data_entry.filter(pr => 
            selectedIds.includes(String(pr.id)) || 
            (pr.phase_id && selectedIds.includes(String(pr.phase_id))) ||
            (pr.linked_phase && selectedIds.includes(String(pr.linked_phase)))
        );
        
        const noPumpRoomsCount = Math.max(selectedPRs.length, selectedIds.length, 1);
        u.no_pump_rooms = String(noPumpRoomsCount);

        let totalLength = 0, totalWidth = 0, totalHeight = 0, totalPerimeter = 0, totalArea = 0;
        let totalBtLength = 0, totalBtWidth = 0, totalBtHeight = 0, totalBtPerimeter = 0, totalBtArea = 0, noOfBalanceTanks = 0;
        
        selectedPRs.forEach(pr => {
            totalLength += parseNum(pr.pump_room_length_m);
            totalWidth += parseNum(pr.pump_room_width_m);
            totalHeight += parseNum(pr.pump_room_height_m);
            totalPerimeter += parseNum(pr.pump_room_perimeter_m) || (2 * (parseNum(pr.pump_room_length_m) + parseNum(pr.pump_room_width_m)));
            totalArea += parseNum(pr.pump_room_area_m2) || (parseNum(pr.pump_room_length_m) * parseNum(pr.pump_room_width_m));
            
            const btPerim = parseNum(pr.balance_tank_perimeter_m) || (2 * (parseNum(pr.balance_tank_length_m) + parseNum(pr.balance_tank_width_m)));
            if (btPerim > 0 || parseNum(pr.balance_tank_area_m2) > 0) {
                noOfBalanceTanks += parseNum(pr.no_of_balance_tank) || 1;
                totalBtLength += parseNum(pr.balance_tank_length_m);
                totalBtWidth += parseNum(pr.balance_tank_width_m);
                totalBtHeight += parseNum(pr.balance_tank_height_m);
                totalBtPerimeter += btPerim;
                totalBtArea += parseNum(pr.balance_tank_area_m2) || (parseNum(pr.balance_tank_length_m) * parseNum(pr.balance_tank_width_m));
            }
        });

        u.pump_room_length = totalLength > 0 ? Number(totalLength.toFixed(2)).toString() : (u.pump_room_length || '6');
        u.pump_room_width = totalWidth > 0 ? Number(totalWidth.toFixed(2)).toString() : (u.pump_room_width || '4');
        u.pump_room_height = totalHeight > 0 ? Number(totalHeight.toFixed(2)).toString() : (u.pump_room_height || '3');
        u.pump_room_perimeter = totalPerimeter > 0 ? Number(totalPerimeter.toFixed(2)).toString() : (2 * (parseNum(u.pump_room_length) + parseNum(u.pump_room_width))).toString();
        u.pump_room_areas = totalArea > 0 ? Number(totalArea.toFixed(2)).toString() : (parseNum(u.pump_room_length) * parseNum(u.pump_room_width)).toString();
        
        u.balance_tank_length = totalBtLength > 0 ? Number(totalBtLength.toFixed(2)).toString() : '';
        u.balance_tank_width = totalBtWidth > 0 ? Number(totalBtWidth.toFixed(2)).toString() : '';
        u.balance_tank_height = totalBtHeight > 0 ? Number(totalBtHeight.toFixed(2)).toString() : '';
        u.balance_tank_perimeter = totalBtPerimeter > 0 ? Number(totalBtPerimeter.toFixed(2)).toString() : '';
        u.balance_tank_area = totalBtArea > 0 ? Number(totalBtArea.toFixed(2)).toString() : '';
        u.no_of_balance_tank = noOfBalanceTanks > 0 ? String(noOfBalanceTanks) : '';

        if (noOfBalanceTanks > 0 || totalBtArea > 0 || isOverflow) {
            hasBalanceTank = true;
        }

        // Fire Extinguishers: N_extinguishers = N_pump rooms
        u.no_of_fire_extinguisher = String(noPumpRoomsCount);
    } else {
        u.pump_room_length = u.pump_room_length || '6';
        u.pump_room_width = u.pump_room_width || '4';
        u.pump_room_height = u.pump_room_height || '3';
        u.pump_room_areas = u.pump_room_areas || (parseNum(u.pump_room_length) * parseNum(u.pump_room_width)).toString();
        u.pump_room_perimeter = u.pump_room_perimeter || (2 * (parseNum(u.pump_room_length) + parseNum(u.pump_room_width))).toString();
        u.no_of_fire_extinguisher = u.no_of_fire_extinguisher || '1';
    }

    // =========================================================================
    // SUB-TAB 2: PUMPS CONFIGURATION & ELECTRICAL CONNECTION RULES
    // =========================================================================
    const filterPumpsList = opts.filterPumps || opts.filter_pump_types || [];
    const syncPumpElectricalFields = (pumpSpec, prefix, defaultFallbackCable, defaultFallbackDs) => {
        if (!pumpSpec) return;
        if (pumpSpec.filter_pump_hp && !u[`${prefix}_hp`]) u[`${prefix}_hp`] = String(pumpSpec.filter_pump_hp);
        if (pumpSpec.p_kw && !u[`${prefix}_p_kw`]) {
            u[`${prefix}_p_kw`] = String(pumpSpec.p_kw);
            if (prefix === 'water_filter_pump') u.filtration_pump_p_kw = String(pumpSpec.p_kw);
        }
        if (pumpSpec.operating_voltage && !u[`${prefix}_operating_voltage`]) {
            u[`${prefix}_operating_voltage`] = String(pumpSpec.operating_voltage);
            if (prefix === 'water_filter_pump') u.filtration_pump_operating_voltage = String(pumpSpec.operating_voltage);
        }

        const c1 = pumpSpec.elec_cable_1_id || pumpSpec.electric_cable_type_01_id;
        const g1 = pumpSpec.elec_cable_1_gland || pumpSpec.electric_cable_type_01_gland_id;
        const c2 = pumpSpec.elec_cable_2_id || pumpSpec.electric_cable_type_02_id;
        const ds1 = pumpSpec.disconnect_switch_1 || pumpSpec.disconnect_switches_types_one_id;
        const ds2 = pumpSpec.disconnect_switch_2 || pumpSpec.disconnect_switches_types_two_id;

        if (c1 && (!u[`${prefix}_electric_cable_type_01_id`] || u[`${prefix}_electric_cable_type_01_id`] === defaultFallbackCable)) {
            u[`${prefix}_electric_cable_type_01_id`] = c1;
        }
        if (g1 && !u[`${prefix}_electric_cable_type_01_gland_id`]) {
            u[`${prefix}_electric_cable_type_01_gland_id`] = g1;
        }
        if (c2 && !u[`${prefix}_electric_cable_type_02_id`]) {
            u[`${prefix}_electric_cable_type_02_id`] = c2;
        }
        if (ds1 && (!u[`${prefix}_disconnect_switches_types_one_id`] || u[`${prefix}_disconnect_switches_types_one_id`] === defaultFallbackDs)) {
            u[`${prefix}_disconnect_switches_types_one_id`] = ds1;
            if (prefix === 'water_filter_pump') u.filtration_pump_disconnect_switches_types_one_id = ds1;
        }
        if (ds2 && !u[`${prefix}_disconnect_switches_types_two_id`]) {
            u[`${prefix}_disconnect_switches_types_two_id`] = ds2;
        }

        const bTray = pumpSpec.branch_tray_id || pumpSpec.branch_cable_tray_type_id;
        const spPlate = pumpSpec.splice_plate_id || pumpSpec.splice_plate_type_id;
        const elbow90 = pumpSpec.elbow_90_id || pumpSpec.cable_tray_elbow_90_id;
        const cChan = pumpSpec.c_channel_id || pumpSpec.c_channel_type_id;
        const endCap = pumpSpec.end_cap_id || pumpSpec.end_cap_type_id;
        const anchors = pumpSpec.anchors_id || pumpSpec.anchors_type_id;
        const offsetTee = pumpSpec.offset_tee_id || pumpSpec.offset_tee_type_id;

        if (bTray && !u[`${prefix}_branch_cable_tray_type_id`]) u[`${prefix}_branch_cable_tray_type_id`] = bTray;
        if (spPlate && !u[`${prefix}_splice_plate_type_id`]) u[`${prefix}_splice_plate_type_id`] = spPlate;
        if (elbow90 && !u[`${prefix}_cable_tray_elbow_90_id`]) u[`${prefix}_cable_tray_elbow_90_id`] = elbow90;
        if (cChan && !u[`${prefix}_c_channel_type_id`]) u[`${prefix}_c_channel_type_id`] = cChan;
        if (endCap && !u[`${prefix}_end_cap_type_id`]) u[`${prefix}_end_cap_type_id`] = endCap;
        if (anchors && !u[`${prefix}_anchors_type_id`]) u[`${prefix}_anchors_type_id`] = anchors;
        if (offsetTee && !u[`${prefix}_offset_tee_type_id`]) u[`${prefix}_offset_tee_type_id`] = offsetTee;
    };

    let selectedCircPumpSpec = null;
    if (u.water_filter_pump_code) {
        selectedCircPumpSpec = filterPumpsList.find(p => String(p.id) === String(u.water_filter_pump_code));
    }

    // Auto-select circulation pump strictly matching filter pump_hp and brand ONLY if not set
    if (!selectedCircPumpSpec && filterPumpsList.length > 0 && (!u.water_filter_pump_code || u.water_filter_pump_code === '')) {
        const circPumpsOnly = filterPumpsList.filter(p => 
            String(p.item_category) === '0204d1e9-0155-4f33-a482-5793abf32354' ||
            (!String(p.item_category).includes('6b8ed887') && !String(p.item_category).includes('eb18002a'))
        );
        
        const preferredBrand = u.pump_brand || selectedFilterSpec?.filter_brand || selectedFilterSpec?.brand_id;
        let candidatePumps = circPumpsOnly;
        if (preferredBrand) {
            const brandPumps = circPumpsOnly.filter(p => String(p.pump_brand) === String(preferredBrand) || String(p.brand_id) === String(preferredBrand));
            if (brandPumps.length > 0) candidatePumps = brandPumps;
        }

        const targetHp = Number(selectedFilterSpec?.pump_hp) || (waterFiltNum > 30 ? 3 : waterFiltNum > 15 ? 2 : 1);
        const sorted = [...candidatePumps].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
        selectedCircPumpSpec = sorted.find(p => Number(p.filter_pump_hp || 0) >= targetHp) || sorted[0];

        if (selectedCircPumpSpec && !u.water_filter_pump_code) {
            u.water_filter_pump_code = selectedCircPumpSpec.id;
            if (selectedCircPumpSpec.pump_brand) u.pump_brand = selectedCircPumpSpec.pump_brand;
        }
    }

    if (selectedCircPumpSpec) {
        syncPumpElectricalFields(selectedCircPumpSpec, 'water_filter_pump', '3378ce89-417d-4bd3-adc7-9ba9413553ae', 'fa7cbaaa-3b15-43f2-9cd0-76267473e749');
    }

    // Duty pumps: strictly matches number of water filters when a filter is selected
    const filterQtyNum = parseNum(u.no_of_water_filter);
    const circDuty = (selectedFilterSpec || u.water_filter_code || u.water_filter_pump_code) && filterQtyNum > 0 ? filterQtyNum : 0;
    u.no_of_water_filter_pump = String(circDuty);

    // Standby: 0 if Skimfilter or if duty is 0, max(1, ceil(Duty / 3)) for standard public
    if (isSkimfilter || circDuty === 0) {
        u.no_of_water_filter_pump_stand_by = '0';
    } else {
        u.no_of_water_filter_pump_stand_by = String(Math.max(1, Math.ceil(circDuty / 3)));
    }

    // Vacuum Pumps: strictly depend on vacuum filter model & quantity
    const vacFilterChosen = !!u.vacuum_filter_code;
    const vacFilterQtyNum = parseNum(u.no_of_vacuum_filter);
    
    if (vacFilterChosen && vacFilterQtyNum > 0) {
        u.no_of_vacuum_filter_pump = String(vacFilterQtyNum);
        u.no_of_vacuum_filter_pump_stand_by = String(Math.max(1, Math.ceil(vacFilterQtyNum / 3)));
        if (u.vacuum_filter_pump_code) {
            const selectedVacPumpSpec = filterPumpsList.find(p => String(p.id) === String(u.vacuum_filter_pump_code));
            if (selectedVacPumpSpec) {
                syncPumpElectricalFields(selectedVacPumpSpec, 'vacuum_pump', '475decb5-e92b-4d55-b455-603ecec25095', 'cb9e357d-c7c2-4803-b8ff-a5a17d8a13d9');
            }
        }
    } else {
        u.no_of_vacuum_filter = '0';
        u.no_of_vacuum_filter_pump = '0';
        u.no_of_vacuum_filter_pump_stand_by = '0';
        u.vacuum_filter_pump_code = '';
    }

    // =========================================================================
    // DRAINAGE CHAMBERS & SUBMERSIBLE PIT DRAINAGE PUMPS SIZING
    // =========================================================================
    const totalFiltersCount = parseNum(u.no_of_water_filter);
    
    // 1. Drainage Chamber Auto-Calculation:
    // If Filtration Method is Skimfilters AND Water Filters >= 12:
    // expectedDrainageChamber = floor(No. of Water Filters / 12)
    // If Filtration Method is Sand Filter / RMF Filter OR Water Filters < 12:
    // expectedDrainageChamber = 0
    let autoDrainageChamber = 0;
    if (isSkimfilter && totalFiltersCount >= 12) {
        autoDrainageChamber = Math.floor(totalFiltersCount / 12);
    } else {
        autoDrainageChamber = 0;
    }

    if (u.drainage_chamber === undefined || u.drainage_chamber === null || u.drainage_chamber === '') {
        u.drainage_chamber = String(autoDrainageChamber);
    } else {
        u.drainage_chamber = String(u.drainage_chamber);
    }

    const currentChamberQty = parseNum(u.drainage_chamber);

    // 2. Submersible Pumps Auto-Calculation:
    // For Skimfilters (>= 12 filters): No. of Submersible Pumps = Drainage Chamber Quantity
    // For Sand / RMF Filters with Pump Rooms: No. of Submersible Pumps = No. of Pump Rooms
    let autoSubmersibleQty = 0;
    if (isSkimfilter) {
        autoSubmersibleQty = currentChamberQty;
    } else {
        const prCount = parseNum(u.no_pump_rooms) || (u.related_pump_rooms && u.related_pump_rooms.length > 0 ? 1 : 1);
        autoSubmersibleQty = Math.max(prCount, 1);
    }

    if (u.no_of_submersible_pump === undefined || u.no_of_submersible_pump === null || u.no_of_submersible_pump === '' || (!isSkimfilter && parseNum(u.no_of_submersible_pump) === 0)) {
        u.no_of_submersible_pump = String(autoSubmersibleQty);
    } else {
        u.no_of_submersible_pump = String(u.no_of_submersible_pump);
    }
    u.submersible_pump_qty = u.no_of_submersible_pump;

    // Auto-select submersible drainage pump if not set
    if (!u.submersible_pump_code && filterPumpsList.length > 0) {
        const targetBrand = String(u.submersible_pump_brand || 'fe7c3a44-3e9d-4a32-8831-d47a042826ee').toLowerCase();
        let subPumps = filterPumpsList.filter(p => {
            const pBrand = String(p.pump_brand || p.brand_id || '').toLowerCase();
            const isSub = (
                String(p.item_category) === '6b8ed887-6fc1-4bc4-be82-9964255679a5' ||
                String(p.filter_pump_code || '').toUpperCase().startsWith('DW') ||
                String(p.filter_pump_code || '').toUpperCase().startsWith('MC') ||
                String(p.filter_pump_code || '').toUpperCase().startsWith('TOP') ||
                String(p.filter_pump_hp || '') !== ''
            );
            return isSub && (
                pBrand === targetBrand || 
                pBrand.includes(targetBrand) || 
                (targetBrand.includes('pedrollo') && pBrand.includes('fe7c3a44')) || 
                (targetBrand.includes('ebara') && pBrand.includes('2d99b439')) ||
                (targetBrand.includes('fe7c3a44') && pBrand.includes('fe7c3a44')) ||
                (targetBrand.includes('2d99b439') && pBrand.includes('2d99b439'))
            );
        });
        if (subPumps.length === 0) {
            subPumps = filterPumpsList.filter(p => 
                String(p.item_category) === '6b8ed887-6fc1-4bc4-be82-9964255679a5' ||
                String(p.filter_pump_code || '').toUpperCase().startsWith('DW') ||
                String(p.filter_pump_code || '').toUpperCase().startsWith('MC') ||
                String(p.filter_pump_code || '').toUpperCase().startsWith('TOP')
            );
        }
        if (subPumps.length > 0) {
            const sortedSub = [...subPumps].sort((a, b) => Number(a.filter_pump_hp || 0) - Number(b.filter_pump_hp || 0));
            const defaultSub = sortedSub[0];
            if (defaultSub) {
                u.submersible_pump_code = defaultSub.id;
                if (!u.submersible_pump_brand && (defaultSub.pump_brand || defaultSub.brand_id)) {
                    u.submersible_pump_brand = defaultSub.pump_brand || defaultSub.brand_id;
                }
            }
        }
    }

    if (u.submersible_pump_code) {
        const selectedSubPumpSpec = filterPumpsList.find(p => String(p.id) === String(u.submersible_pump_code));
        if (selectedSubPumpSpec) {
            syncPumpElectricalFields(selectedSubPumpSpec, 'submersible_pump', '3378ce89-417d-4bd3-adc7-9ba9413553ae', '222ec164-1dae-4cef-a984-fb449450442f');
        }
    }

// Conduit Lengths strictly match Electric Cable Lengths (Type 01 & Type 02)
    const c1Len = parseNum(u.water_filter_pump_electric_cable_type_01_length) || 30;
    const c2Len = parseNum(u.water_filter_pump_electric_cable_type_02_length) || 0;
    u.water_filter_pump_electric_cable_type_01_length = String(c1Len);
    u.water_filter_pump_conduit_for_cable_type_01_length_m = String(c1Len);
    u.water_filter_pump_conduit_for_cable_type_02_length_m = String(c2Len);

    const vacC1Len = parseNum(u.vacuum_pump_electric_cable_type_01_length) || 30;
    const vacC2Len = parseNum(u.vacuum_pump_electric_cable_type_02_length) || 0;
    u.vacuum_pump_electric_cable_type_01_length = String(vacC1Len);
    u.vacuum_pump_conduit_for_cable_type_01_length_m = String(vacC1Len);
    u.vacuum_pump_conduit_for_cable_type_02_length_m = String(vacC2Len);

    const subC1Len = parseNum(u.submersible_pump_electric_cable_type_01_length) || 30;
    const subC2Len = parseNum(u.submersible_pump_electric_cable_type_02_length) || 0;
    u.submersible_pump_electric_cable_type_01_length = String(subC1Len);
    u.submersible_pump_conduit_for_cable_type_01_length_m = String(subC1Len);
    u.submersible_pump_conduit_for_cable_type_02_length_m = String(subC2Len);

    // Exact AppSheet Formula for Branch Cable Tray Length (m):
    // IF([Phase Title].[Water Feature Type]="e076f96a-8aa7-4515-a917-3e95039f2133", 0, [Phase Title].[Pump Room Height (m)] * [Quantity])
    const isSkimfilterWF = isWfSkimfilter(u.water_feature_type || linkedPhase?.water_feature_type, u.water_filtration_method || linkedPhase?.water_filtration_method);
    const pumpRoomHeight = parseNum(u.pump_room_height_m || u.pump_room_height || linkedPhase?.pump_room_height_m || 3);

    
    if (isSkimfilterWF) {
        u.water_filter_pump_branch_cable_tray_length = '0';
        u.vacuum_pump_branch_cable_tray_length = '0';
        u.submersible_pump_branch_cable_tray_length = '0';
    } else {
        const circPumpsCount = (parseNum(u.no_of_filtration_pump) || 1) + (parseNum(u.no_of_filtration_pump_stand_by) || 0);
        u.water_filter_pump_branch_cable_tray_length = String(parseNum(u.water_filter_pump_branch_cable_tray_length) || (pumpRoomHeight * circPumpsCount));
        
        const vacPumpsCount = (parseNum(u.no_of_vacuum_filter_pump) || 0) + (parseNum(u.no_of_vacuum_filter_pump_stand_by) || 0);
        if (vacPumpsCount > 0) {
            u.vacuum_pump_branch_cable_tray_length = String(parseNum(u.vacuum_pump_branch_cable_tray_length) || (pumpRoomHeight * vacPumpsCount));
        }
        
        const subPumpsCount = (parseNum(u.no_of_submersible_sump_pump) || 0) + (parseNum(u.no_of_submersible_sump_pump_stand_by) || 0);
        if (subPumpsCount > 0) {
            u.submersible_pump_branch_cable_tray_length = String(parseNum(u.submersible_pump_branch_cable_tray_length) || (pumpRoomHeight * subPumpsCount));
        }
    }

    // Total pumps count for containment and cables
    const vacDuty = parseNum(u.no_of_vacuum_filter_pump) || 0;
    const totalCircPumps = circDuty + (parseNum(u.no_of_water_filter_pump_stand_by) || 0);
    const totalVacPumps = vacDuty + (parseNum(u.no_of_vacuum_filter_pump_stand_by) || 0);
    const totalSubPumps = parseNum(u.no_of_submersible_pump || u.submersible_pump_qty) || 0;
    const allPumpsCount = totalCircPumps + totalVacPumps + totalSubPumps;

    // Cable & conduit rules per pump network
    u.pump_power_cable_length_total_m = String(allPumpsCount * 15);
    u.pump_cable_glands_total_qty = String(allPumpsCount * 2);
    u.pump_liquidtight_conduit_total_m = String(allPumpsCount * 3);
    u.pump_conduit_adapters_total_qty = String(allPumpsCount * 2);
    u.pump_branch_tray_total_m = String(allPumpsCount * 2.5);

    // =========================================================================
    // SUB-TAB 3: CHEMICAL DOSING & SHELL FITTINGS SIZING
    // =========================================================================
    if (!u.type_of_chlorinator_system) {
        u.type_of_chlorinator_system = 'Chlorinator Tablet';
    }

    if (u.type_of_chlorinator_system === 'Chlorinator Tablet') {
        if (!u.tablet_chlorinator_quantity || u.tablet_chlorinator_quantity === '0') {
            u.tablet_chlorinator_quantity = String(Math.max(1, Math.ceil((wfVolume || 50) / 100)));
        }
    } else {
        if (!u.dosing_pump_type && !u.chemical_feeder_code) {
            u.dosing_pump_type = '34681aa7-c226-4ef8-9f86-aadf236159a7'; // Astral Pool 5L/H default
            u.chemical_feeder_code = '34681aa7-c226-4ef8-9f86-aadf236159a7';
        }
        if (!u.mixing_tank_capacity) {
            u.mixing_tank_capacity = '82639f46-6af2-4dd6-9302-0e86e5d8b637'; // Shawwa Plastics 300L default
        }
        if (!u.electrical_stirrer_type) {
            u.electrical_stirrer_type = 'bbecbd5a-6c54-40b3-97db-48bbd1599b0e'; // Motovario TS71B4 default
        }
        if (u.chemical_feeder_qty === undefined || u.chemical_feeder_qty === null || u.chemical_feeder_qty === '') {
            u.chemical_feeder_qty = '2';
        }
        if (u.no_of_mixing_tank === undefined || u.no_of_mixing_tank === null || u.no_of_mixing_tank === '') {
            u.no_of_mixing_tank = '2';
        }
        if (u.no_of_electrical_stirrer === undefined || u.no_of_electrical_stirrer === null || u.no_of_electrical_stirrer === '') {
            u.no_of_electrical_stirrer = '2';
            u.no_of_stirrer = '2';
        } else {
            u.no_of_stirrer = String(u.no_of_electrical_stirrer);
        }
    }

    // Surface Skimmers: max(1, ceil(A_WF / 40)) for Skimmer pools (0 for Overflow and Skimfilter)
    if (!isOverflow && !isSkimfilter && wfArea > 0) {
        u.no_of_skimmer = String(Math.max(1, Math.ceil(wfArea / 40)));
    } else {
        u.no_of_skimmer = '0';
    }

    // Floor Inlets: max(2, ceil(Q_filt / 5)) for Overflow pools
    if (isOverflow && waterFiltNum > 0) {
        u.no_of_floor_inlets = String(Math.max(2, Math.ceil(waterFiltNum / 5)));
    }

    // Wall Inlets: max(2, ceil(Q_filt / 4.5)) for Skimmer pools
    if (!isOverflow && waterFiltNum > 0) {
        u.no_of_wall_inlets = String(Math.max(2, Math.ceil(waterFiltNum / 4.5)));
    }

    // Vacuum Points: max(1, ceil(P_WF / 15))
    if (wfPerimeter > 0) {
        u.no_of_vacuum_inlets = String(Math.max(1, Math.ceil(wfPerimeter / 15)));
    } else if (!u.no_of_vacuum_inlets) {
        u.no_of_vacuum_inlets = '1';
    }

    // Main Drains: max(2, ceil(Q_filt / 15)) anti-vortex dual drain standard
    if (waterFiltNum > 0) {
        u.no_of_main_drain = String(Math.max(2, Math.ceil(waterFiltNum / 15)));
    } else if (!u.no_of_main_drain) {
        u.no_of_main_drain = '2';
    }

    // Gutter Drains: max(2, ceil(P_WF / 8)) for Overflow pools
    if (isOverflow && wfPerimeter > 0) {
        u.no_of_gutter_drain = String(Math.max(2, Math.ceil(wfPerimeter / 8)));
    } else if (!isOverflow) {
        u.no_of_gutter_drain = '0';
    }

    // Balance Tank Automation & Safety Valves
    if (hasBalanceTank) {
        if (!u.no_of_selnoid_valve) u.no_of_selnoid_valve = '1';
        if (!u.no_of_float_valve) u.no_of_float_valve = '1';
        if (!u.no_of_float_switch) u.no_of_float_switch = '2';
    }

    // Manual Cleaning Set: max(1, ceil(A_WF / 500))
    const autoCleanQty = wfArea > 0 ? Math.max(1, Math.ceil(wfArea / 500)) : 1;
    if (u.no_of_manual_cleaning_set === undefined || u.no_of_manual_cleaning_set === null || u.no_of_manual_cleaning_set === '') {
        u.no_of_manual_cleaning_set = String(autoCleanQty);
    }
    const cleanSets = String(parseNum(u.no_of_manual_cleaning_set) || autoCleanQty);
    
    // Exact 6 Database Components
    if (!u.no_of_telescopic_pole) u.no_of_telescopic_pole = cleanSets;
    if (!u.no_of_vacuum_head) u.no_of_vacuum_head = cleanSets;
    if (!u.no_of_floating_hose) u.no_of_floating_hose = cleanSets;
    if (!u.no_of_leaf_rake_net) u.no_of_leaf_rake_net = cleanSets;
    if (!u.no_of_wall_brush) u.no_of_wall_brush = cleanSets;
    if (!u.no_of_chemical_test_kit) u.no_of_chemical_test_kit = cleanSets;

    // Default accessory models auto-selection
    const itemsList = opts.items || [];
    const accList = opts.circulation_accessories || [];
    const mdList = opts.main_drain || [];

    if (!u.tablet_chlorinator_type && (opts.tablet_chlorinators || opts.tablet_chlorinator || []).length > 0) {
        const chlorList = opts.tablet_chlorinators || opts.tablet_chlorinator || [];
        u.tablet_chlorinator_type = chlorList[0].id;
    }
    if (isOverflow && !u.floor_inlets_type) {
        const defFloor = itemsList.find(i => (i.item_name || '').toLowerCase().includes('floor return inlet') || (i.item_name || '').toLowerCase().includes('00303'));
        if (defFloor) u.floor_inlets_type = defFloor.id;
    }
    if (!isOverflow && !u.wall_inlets_type) {
        const defWall = itemsList.find(i => (i.item_name || '').toLowerCase().includes('wall inlet') || (i.item_name || '').toLowerCase().includes('41518'));
        if (defWall) u.wall_inlets_type = defWall.id;
    }
    if (!isOverflow && !isSkimfilter && !u.skimmer_type) {
        const defSkim = accList.find(a => String(a.item_category).includes('c30d9509')) || itemsList.find(i => (i.item_name || '').toLowerCase().includes('skimmer'));
        if (defSkim) u.skimmer_type = defSkim.id;
    }
    if (!u.vacuum_inlets_type) {
        const defVac = accList.find(a => String(a.item_category).includes('27a3e0c6')) || itemsList.find(i => (i.item_name || '').toLowerCase().includes('vaccum point') || (i.item_name || '').toLowerCase().includes('vacuum point'));
        if (defVac) u.vacuum_inlets_type = defVac.id;
    }
    if (!u.main_drain_type) {
        const defMd = mdList.find(m => String(m.brand_id) === 'e052dc94-8b69-4042-b587-49a266f11a33') || mdList[0] || itemsList.find(i => (i.item_name || '').toLowerCase().includes('main drain'));
        if (defMd) u.main_drain_type = defMd.id;
    }
    if (isOverflow && !u.gutter_drain_type) {
        const defGutter = accList.find(a => String(a.item_category).includes('9f72c25a')) || itemsList.find(i => (i.item_name || '').toLowerCase().includes('gutter drain'));
        if (defGutter) u.gutter_drain_type = defGutter.id;
    }
    if (!u.manual_cleaning_set_type) {
        const defClean = itemsList.find(i => (i.item_name || '').toLowerCase().includes('cleaning') || (i.item_name || '').toLowerCase().includes('cleaner'));
        if (defClean) u.manual_cleaning_set_type = defClean.id;
    }
    if (hasBalanceTank) {
        if (!u.solenoid_valve_type) {
            const defSol = itemsList.find(i => (i.item_name || '').toLowerCase().includes('solenoid') || (i.item_name || '').toLowerCase().includes('seneloid'));
            if (defSol) u.solenoid_valve_type = defSol.id;
        }
        if (!u.float_valve_type) {
            const defFloat = itemsList.find(i => (i.item_name || '').toLowerCase().includes('float valve'));
            if (defFloat) u.float_valve_type = defFloat.id;
        }
        if (!u.float_switch_type) {
            const defSwitch = itemsList.find(i => (i.item_name || '').toLowerCase().includes('float switch') || (i.item_name || '').toLowerCase().includes('level switch'));
            if (defSwitch) u.float_switch_type = defSwitch.id;
        }
    }

    // =========================================================================
    // SUB-TAB 4: HEATING SYSTEM THERMODYNAMICS
    // =========================================================================
    const deltaT = 13; // Standard Design Delta: 28°C pool target - 15°C winter ambient = 13°C
    const heatUpHours = 24; // Standard initial heat-up timeframe: 24 Hours
    if (wfVolume > 0) {
        // Equation: P_required (kW) = (V * 1000 kg/m³ * 4.186 kJ/kg·°C * ΔT) / (3600 s/h * 24 h) * 1.20 (20% surface & radiation losses)
        // Equivalent: P_required (kW) = (V * 1.163 kWh/m³·°C * 13°C) / 24 h * 1.20
        const reqHeatingKw = Number(((wfVolume * 1000 * 4.186 * deltaT) / (3600 * heatUpHours) * 1.20).toFixed(2));
        u.required_heating_power_kw = reqHeatingKw;
        
        const heatersList = opts.heaters || [];
        let selectedHeater = null;
        
        // ONLY select a heater if the user has explicitly chosen a heater_brand, heater_type, or recommended_heater_model
        if (u.heater_type || u.recommended_heater_model) {
            selectedHeater = heatersList.find(h => String(h.id) === String(u.heater_type || u.recommended_heater_model));
        } else if (u.heater_brand) {
            const brandHeaters = heatersList.filter(h => String(h.brand_id) === String(u.heater_brand));
            if (brandHeaters.length > 0) {
                if (reqHeatingKw >= 100) {
                    const sortedByKwDesc = [...brandHeaters].sort((a, b) => Number(b.output_kw || 0) - Number(a.output_kw || 0));
                    selectedHeater = sortedByKwDesc[0];
                } else {
                    const sortedByKwAsc = [...brandHeaters].sort((a, b) => Number(a.output_kw || 0) - Number(b.output_kw || 0));
                    selectedHeater = sortedByKwAsc.find(h => Number(h.output_kw || 0) >= reqHeatingKw) || sortedByKwAsc[sortedByKwAsc.length - 1];
                }
                if (selectedHeater) {
                    u.heater_type = selectedHeater.id;
                    u.recommended_heater_model = selectedHeater.id;
                    u.heater_output_kw = String(selectedHeater.output_kw || 0);
                }
            }
        }

        if (selectedHeater) {
            const unitKw = Number(selectedHeater.output_kw) || parseNum(u.heater_output_kw) || 30;
            const computedQty = Math.max(1, Math.ceil(reqHeatingKw / (unitKw > 0 ? unitKw : 30)));
            if (!u.no_of_heaters || u.no_of_heaters === '0') {
                u.no_of_heaters = String(computedQty);
            }
            u.heater_qty = u.no_of_heaters;
            u.heater_output_kw = String(unitKw);
            u.installed_heating_capacity_kw = String(Number((Number(u.no_of_heaters) * unitKw).toFixed(2)));
        } else {
            // Keep completely clear by default or when cleared
            u.heater_type = '';
            u.recommended_heater_model = '';
            u.heater_output_kw = '0';
            u.no_of_heaters = '0';
            u.heater_qty = '0';
            u.installed_heating_capacity_kw = '0';
        }
    } else {
        u.required_heating_power_kw = u.required_heating_power_kw || 0;
        u.no_of_heaters = '0';
    }

    // =========================================================================
    // SUB-TAB 5: UNDERWATER LIGHTING & TRANSFORMERS
    // =========================================================================
    const isLightingDisabled = u.qty_lights === '0' || (!u.underwater_light_type && !u.water_feature_lighting_code && wfPerimeter <= 0);
    
    if (isLightingDisabled) {
        u.qty_lights = '0';
        u.underwater_light_type = '';
        u.water_feature_lighting_code = '';
        u.lighting_brand = '';
        u.water_feature_lighting_backbox = '';
        u.water_feature_lighting_backbox_qty = '0';
        u.electric_cable_length_per_one_lighting = '0';
        u.total_electric_cable_lengths = '0';
        u.electric_cable_gland_quantity = '0';
        u.transformer_brand = '';
        u.transformer_type = '';
        u.transformer_qty = '0';
        u.transformer_feeding_cable_length_m = '0';
        u.transfomer_feeding_cable_length = '0';
        u.transfomer_feeding_cable_gland_no = '0';
        u.transformer_feeding_cable_conduit_adapter_qty_no = '0';
        u.transformer_feeding_cable_conduit_coupler_qty_no = '0';
        u.no_of_output_electric_line_cables = '0';
        u.transformer_output_cable_conduit_length_m = '0';
        u.transfomer_output_cable_length = '0';
        u.transfomer_output_cable_gland_no = '0';
        u.transformer_output_cable_conduit_adapter_quantity_no = '0';
        u.transformer_output_cable_conduit_coupler_quantity_no = '0';
        u.junction_box_type = '';
        u.junction_box_qty = '0';
    } else {
        // Fixture count: N_lights = max(1, ceil(P_WF / 10))
        if (wfPerimeter > 0 && (!u.qty_lights || u.qty_lights === '0')) {
            u.qty_lights = String(Math.max(1, Math.ceil(wfPerimeter / 10)));
        } else if (!u.qty_lights) {
            u.qty_lights = '1';
        }
        const lightQty = parseNum(u.qty_lights) || 1;

        // Auto-select Default LED Luminaire if empty
        if (!u.underwater_light_type && (opts.lighting || opts.lighting_type || []).length > 0) {
            const lList = opts.lighting || opts.lighting_type || [];
            const defLight = lList.find(l => String(l.item_code || '').includes('67510')) || lList[0];
            if (defLight) {
                u.underwater_light_type = defLight.id;
                u.water_feature_lighting_code = defLight.id;
                if (!u.lighting_brand) u.lighting_brand = defLight.brand_id;
            }
        }

        // Submersible Cable & Niches
        if (!u.electric_cable_length_per_one_lighting || u.electric_cable_length_per_one_lighting === '0') {
            u.electric_cable_length_per_one_lighting = '5';
        }
        const cableLenPerLighting = parseNum(u.electric_cable_length_per_one_lighting) || 5;
        u.total_electric_cable_lengths = String(cableLenPerLighting * lightQty);
        u.water_feature_lighting_backbox_qty = String(lightQty);
        u.electric_cable_gland_quantity = String(lightQty);
        u.total_protective_conduit_length = String(cableLenPerLighting * lightQty);
        u.total_main_conduit_lengths = String(lightQty * 10);
        u.total_main_conduit_adapter_qty = String(lightQty * 2);

        if (!u.recommended_electric_cable_type) {
            u.recommended_electric_cable_type = '870785ee-c1e4-4f2b-8233-bf662ce78dd1';
        }
        if (!u.protective_conduit) {
            u.protective_conduit = '3906d89e-476f-450d-be1b-90ce73a60906';
        }
        if (!u.recommended_main_conduit_type) {
            u.recommended_main_conduit_type = '65e37519-39a2-49cf-97e3-0e791084ca45';
        }
        if (!u.recommended_electric_cable_gland) {
            u.recommended_electric_cable_gland = '73e5eca3-396a-4318-a30b-cbbcc4a8f84a';
        }
        if (!u.main_conduit_adapter_type) {
            u.main_conduit_adapter_type = '752fdb9d-a15b-465d-8155-3f6462d07e8e';
        }

        // Auto-select Niche Backbox
        if (!u.water_feature_lighting_backbox) {
            const defNiche = itemsList.find(i => (i.item_name || '').toLowerCase().includes('07844') || (i.item_name || '').toLowerCase().includes('backbox for concrete') || (i.item_name || '').toLowerCase().includes('niche'));
            if (defNiche) u.water_feature_lighting_backbox = defNiche.id;
        }

        // Auto-select Deck Junction Box
        u.junction_box_qty = String(lightQty);
        if (!u.junction_box_type) {
            const defJBox = (opts.junction_box || []).find(j => String(j.id).includes('6b7ca987') || String(j.code || '').includes('30825')) ||
                            itemsList.find(i => (i.item_name || '').toLowerCase().includes('deck box') || (i.item_name || '').toLowerCase().includes('junction box'));
            if (defJBox) u.junction_box_type = defJBox.id;
            else u.junction_box_type = '6b7ca987-3e33-498c-8034-1b0a420e1bb7';
        }

        // Transformers (Sized per 400VA rating for LED lights ~35W each)
        const totalWattage = lightQty * 35;
        const calculatedTransQty = Math.max(1, Math.ceil(totalWattage / 320));
        if (!u.transformer_qty || u.transformer_qty === '0') {
            u.transformer_qty = String(calculatedTransQty);
        }
        const activeTransQty = parseNum(u.transformer_qty) || calculatedTransQty;

        // Auto-select Transformer Model
        if (!u.transformer_type) {
            const transList = opts.transformers || opts.transformer_type || [];
            const defTrans = transList.find(t => String(t.item_code || '').includes('400') || String(t.id || '').includes('400')) ||
                             transList[0] ||
                             itemsList.find(i => (i.item_name || '').toLowerCase().includes('transformer 400'));
            if (defTrans) {
                u.transformer_type = defTrans.id;
                if (!u.transformer_brand) u.transformer_brand = defTrans.brand_id;
            } else {
                u.transformer_type = '53a11bd5-942b-476b-becc-9c6d776e8ae7';
            }
        }
        
        // Transformer Cables & Conduits
        if (!u.transformer_feeding_cable_type && !u.transfomer_feeding_cable_type) {
            u.transformer_feeding_cable_type = '9a8108d6-98d6-4fdb-8a43-992ae321f6df';
            u.transfomer_feeding_cable_type = '9a8108d6-98d6-4fdb-8a43-992ae321f6df';
        }
        if (!u.transformer_output_cable_type && !u.transfomer_output_cable_type) {
            u.transformer_output_cable_type = '64363bdb-ba97-4f54-8a39-8d4d4c256615';
            u.transfomer_output_cable_type = '64363bdb-ba97-4f54-8a39-8d4d4c256615';
        }
        u.transformer_feeding_cable_length_m = String(activeTransQty * 30);
        u.transfomer_feeding_cable_length = String(activeTransQty * 30);
        u.transfomer_feeding_cable_gland_no = String(activeTransQty * 2);
        u.transformer_feeding_cable_conduit_adapter_qty_no = String(activeTransQty * 2);
        u.transformer_feeding_cable_conduit_coupler_qty_no = String(Math.ceil(activeTransQty * 30 / 3));
        u.no_of_output_electric_line_cables = String(lightQty);
        u.transformer_output_cable_conduit_length_m = String((30 * activeTransQty) + (5 * lightQty));
        u.transfomer_output_cable_length = String((30 * activeTransQty) + (5 * lightQty));
        u.transfomer_output_cable_gland_no = String(lightQty * 2);
        u.transformer_output_cable_conduit_adapter_quantity_no = String(lightQty * 2);
        u.transformer_output_cable_conduit_coupler_quantity_no = String(Math.ceil(((30 * activeTransQty) + (5 * lightQty)) / 3));
        u.transfomer_feeding_cable_length = String(calculatedTransQty * 30);
        u.transfomer_feeding_cable_gland_no = String(calculatedTransQty * 2);
        u.transformer_feeding_cable_conduit_adapter_qty_no = String(calculatedTransQty * 2);
        u.transformer_feeding_cable_conduit_coupler_qty_no = String(Math.ceil(calculatedTransQty * 30 / 3));
        if (!u.transfomer_feeding_cable_type) {
            u.transfomer_feeding_cable_type = '9a8108d6-98d6-4fdb-8a43-992ae321f6df';
        }
        if (!u.transformer_feeding_cable_conduit) {
            u.transformer_feeding_cable_conduit = '3906d89e-476f-450d-be1b-90ce73a60906';
        }

        // Transformer Output Secondary Lines
        const expectedOutputLines = Math.max(1, Math.ceil(lightQty / (calculatedTransQty * 5)));
        u.no_of_output_electric_line_cables = String(expectedOutputLines);
        u.transformer_output_cable_conduit_length_m = String(30 * expectedOutputLines);
        u.transfomer_output_cable_length = String((30 * expectedOutputLines) + (5 * lightQty));
        u.transfomer_output_cable_gland_no = String(expectedOutputLines * 2);
        u.transformer_output_cable_conduit_adapter_quantity_no = String(expectedOutputLines * 2);
        u.transformer_output_cable_conduit_coupler_quantity_no = String(Math.ceil(30 * expectedOutputLines / 3));
        if (!u.transformer_output_cable_type) {
            u.transformer_output_cable_type = '64363bdb-ba97-4f54-8a39-8d4d4c256615';
        }
        if (!u.transformer_output_cable_conduit_type) {
            u.transformer_output_cable_conduit_type = '65e37519-39a2-49cf-97e3-0e791084ca45';
        }

        // Deck Junction Boxes (1 per light)
        u.junction_box_qty = String(lightQty);
        if (!u.junction_box_type) {
            const defDeck = itemsList.find(i => (i.item_name || '').toLowerCase().includes('30825') || (i.item_name || '').toLowerCase().includes('deck box'));
            if (defDeck) u.junction_box_type = defDeck.id;
        }

        // Main Cable Tray
        if (!u.main_cable_tray_type) {
            u.main_cable_tray_type = 'a8b1c9d4-8c88-4a33-95dc-9e56084b3dc0';
        }
        if (!u.main_cable_tray_length_m || u.main_cable_tray_length_m === '0') {
            u.main_cable_tray_length_m = '12';
        }
    }

    // =========================================================================
    // SUB-TAB 3B: PIPING NETWORKS & INFRASTRUCTURE SIZING (UPVC & HDPE)
    // =========================================================================
    const prDist = parseNum(u.distance_between_pool_and_pump_room_m) || 12;
    const matSystem = u.piping_material_system || 'upvc_only';
    u.piping_material_system = matSystem;

    // Sizing rules based on turnover flow rate Q (m³/h):
    let inletSize = '63mm';
    let drainSize = '90mm';
    let skimmerSize = '75mm';
    let vacSize = '63mm';

    if (waterFiltNum > 120) {
        inletSize = '110mm';
        drainSize = '200mm';
        skimmerSize = '160mm';
        vacSize = '90mm';
    } else if (waterFiltNum > 70) {
        inletSize = '90mm';
        drainSize = '160mm';
        skimmerSize = '110mm';
        vacSize = '75mm';
    } else if (waterFiltNum > 30) {
        inletSize = '75mm';
        drainSize = '110mm';
        skimmerSize = '90mm';
        vacSize = '63mm';
    }

    // Calculated base lengths:
    const poolLength = parseNum(u.water_feature_length) || (wfPerimeter > 0 ? Math.ceil(wfPerimeter / 4) : 10);
    const returnLineLen = Math.ceil(wfPerimeter * 0.85 + prDist);
    const drainLineLen = Math.ceil(prDist + (poolLength / 2) + 2);
    const skimmerLineLen = Math.ceil(wfPerimeter * 0.5 + prDist);
    const vacLineLen = Math.ceil(prDist + (wfPerimeter * 0.25));

    // Internal Pump Room Headers:
    const prLength = parseNum(u.pump_room_length) || 6;
    const prWidth = parseNum(u.pump_room_width) || 4;
    const suctionHeaderLen = Math.ceil((2 * prLength) + 3);
    const dischargeHeaderLen = Math.ceil((2 * prLength) + 3);
    const interconnectLen = Math.ceil(circDuty * 4 + 2);

    const pipeSizesAll = ['63mm', '75mm', '90mm', '110mm', '160mm', '200mm', '250mm', '315mm'];
    const hdpeSizesAll = ['63mm', '75mm', '90mm', '110mm', '160mm', '200mm'];

    // =========================================================================
    // EXACT PIPE Ø63mm EQUATION (UPVC & HDPE)
    // =========================================================================
    const term1_63 = (parseNum(u.total_no_of_h_networks) * 2) * 5;

    const nSurface_63 = (parseNum(u.no_of_skimmer) || 0) + (parseNum(u.no_of_gutter_drain) || 0);
    let term2_63 = 0;
    if (nSurface_63 > 3) {
        term2_63 = (nSurface_63 * 2) + ((nSurface_63 / 3) * 7);
    } else if (nSurface_63 > 0) {
        term2_63 = nSurface_63 * 7;
    }

    let term3_63 = 0;
    if (isSkimfilter) {
        term3_63 = 18 * (parseNum(u.no_of_water_filter) || 0);
    }

    let term4_63 = 0;
    if (parseNum(u.drainage_chamber) > 0) {
        term4_63 = wfPerimeter;
    }

    const nVac_63 = parseNum(u.no_of_vacuum_inlets) || 0;
    let term5_63 = 0;
    if (nVac_63 === 1) {
        term5_63 = wfPerimeter;
    } else if (nVac_63 >= 2) {
        term5_63 = nVac_63 * 15;
    }

    const nDrain_63 = parseNum(u.no_of_main_drain) || 0;
    let term6_63 = 0;
    if (nDrain_63 > 0 && nDrain_63 < 4) {
        term6_63 = nDrain_63 * 15;
    }

    const calculatedPipe63Len = Math.ceil(term1_63 + term2_63 + term3_63 + term4_63 + term5_63 + term6_63);

    // =========================================================================
    // EXACT PIPE Ø75mm EQUATION (UPVC & HDPE)
    // =========================================================================
    const term1_75 = (parseNum(u.total_no_of_h_networks) * 2) * 3;

    const nSurface_75 = (parseNum(u.no_of_skimmer) || 0) + (parseNum(u.no_of_gutter_drain) || 0);
    const term2_75 = nSurface_75 > 3 ? (nSurface_75 / 3) * 7 : 0;

    const nVac_75 = parseNum(u.no_of_vacuum_inlets) || 0;
    const term3_75 = nVac_75 > 2 ? (nVac_75 / 2) * 15 : 0;

    const nDrain_75 = parseNum(u.no_of_main_drain) || 0;
    const term4_75 = nDrain_75 > 8 ? nDrain_75 * 15 : 0;

    const calculatedPipe75Len = Math.ceil(term1_75 + term2_75 + term3_75 + term4_75);

    // =========================================================================
    // EXACT PIPE Ø90mm EQUATION (UPVC & HDPE)
    // =========================================================================
    const term1_90 = (parseNum(u.total_no_of_h_networks) * 1) * 8;

    const nSurface_90 = (parseNum(u.no_of_skimmer) || 0) + (parseNum(u.no_of_gutter_drain) || 0);
    const term2_90 = nSurface_90 > 3 ? (nSurface_90 / 4) * 7 : 0;

    const calculatedPipe90Len = Math.ceil(term1_90 + term2_90);

    // =========================================================================
    // EXACT PIPE Ø110mm EQUATION (UPVC & HDPE)
    // =========================================================================
    const term1_110 = parseNum(u.total_no_of_t_networks) * 20;

    const nSurface_110 = (parseNum(u.no_of_skimmer) || 0) + (parseNum(u.no_of_gutter_drain) || 0);
    const term2_110 = nSurface_110 > 6 ? (nSurface_110 / 6) * 30 : 0;

    const nVac_110 = parseNum(u.no_of_vacuum_inlets) || 0;
    const term3_110 = nVac_110 > 4 ? 32 : 0;

    const nDrain_110 = parseNum(u.no_of_main_drain) || 0;
    const term4_110 = nDrain_110 > 8 ? (nDrain_110 * 15) + wfPerimeter : 0;

    const calculatedPipe110Len = Math.ceil(term1_110 + term2_110 + term3_110 + term4_110);

    // =========================================================================
    // EXACT PIPE Ø160mm EQUATION (UPVC & HDPE)
    // =========================================================================
    const term1_160 = parseNum(u.total_no_of_t_networks) > 2 ? (parseNum(u.total_no_of_t_networks) / 2) * 300 : 0;

    const nSurface_160 = (parseNum(u.no_of_skimmer) || 0) + (parseNum(u.no_of_gutter_drain) || 0);
    const term2_160 = nSurface_160 > 8 ? ((nSurface_160 / 8) * 30) + wfPerimeter : 0;

    const nVac_160 = parseNum(u.no_of_vacuum_inlets) || 0;
    const term3_160 = nVac_160 > 4 ? 32 : 0;

    const nDrain_160 = parseNum(u.no_of_main_drain) || 0;
    const term4_160 = nDrain_160 > 10 ? ((nDrain_160 / 4) * 15) + wfPerimeter : 0;

    const calculatedPipe160Len = Math.ceil(term1_160 + term2_160 + term3_160 + term4_160);

    // =========================================================================
    // EXACT PIPE Ø200mm EQUATION (UPVC & HDPE)
    // =========================================================================
    const term1_200 = parseNum(u.total_no_of_t_networks) > 4 ? (parseNum(u.total_no_of_t_networks) / 4) * 300 : 0;

    const nSurface_200 = (parseNum(u.no_of_skimmer) || 0) + (parseNum(u.no_of_gutter_drain) || 0);
    const term2_200 = nSurface_200 > 10 ? ((nSurface_200 / 10) * 30) + wfPerimeter : 0;

    const term3_200 = isLagoon ? 60 : 0;

    const nDrain_200 = parseNum(u.no_of_main_drain) || 0;
    const term4_200 = nDrain_200 > 12 ? ((nDrain_200 / 8) * 15) + wfPerimeter : 0;

    const calculatedPipe200Len = Math.ceil(term1_200 + term2_200 + term3_200 + term4_200);

    if (matSystem === 'upvc_and_hdpe') {
        const hdpeInletLen = prDist;
        const hdpeDrainLen = prDist;
        const hdpeSkimLen = prDist;
        const hdpeVacLen = prDist;

        // Populate HDPE
        hdpeSizesAll.forEach(sz => {
            if (sz === '63mm') {
                u[`hdpe_pipe_${sz}`] = String(calculatedPipe63Len);
                return;
            }
            if (sz === '75mm') {
                u[`hdpe_pipe_${sz}`] = String(calculatedPipe75Len);
                return;
            }
            if (sz === '90mm') {
                u[`hdpe_pipe_${sz}`] = String(calculatedPipe90Len);
                return;
            }
            if (sz === '110mm') {
                u[`hdpe_pipe_${sz}`] = String(calculatedPipe110Len);
                return;
            }
            if (sz === '160mm') {
                u[`hdpe_pipe_${sz}`] = String(calculatedPipe160Len);
                return;
            }
            if (sz === '200mm') {
                u[`hdpe_pipe_${sz}`] = String(calculatedPipe200Len);
                return;
            }
            let len = 0;
            if (sz === inletSize) len += hdpeInletLen;
            if (sz === vacSize) len += hdpeVacLen;
            if (sz === drainSize) len += hdpeDrainLen;
            if (sz === skimmerSize) len += hdpeSkimLen;
            if (!u[`hdpe_pipe_${sz}`] || u[`hdpe_pipe_${sz}`] === '0') {
                u[`hdpe_pipe_${sz}`] = len > 0 ? String(len) : '0';
            }
        });

        // Water Feature UPVC Pipes
        pipeSizesAll.forEach(sz => {
            if (sz === '63mm') {
                u[`upvc_pipe_${sz}`] = '0';
                return;
            }
            if (sz === '75mm') {
                u[`upvc_pipe_${sz}`] = '0';
                return;
            }
            if (sz === '90mm') {
                u[`upvc_pipe_${sz}`] = '0';
                return;
            }
            if (sz === '110mm') {
                u[`upvc_pipe_${sz}`] = '0';
                return;
            }
            if (sz === '160mm') {
                u[`upvc_pipe_${sz}`] = '0';
                return;
            }
            if (sz === '200mm') {
                u[`upvc_pipe_${sz}`] = '0';
                return;
            }
            let len = 0;
            if (sz === inletSize) len += Math.max(0, returnLineLen - hdpeInletLen);
            if (sz === vacSize) len += Math.max(0, vacLineLen - hdpeVacLen);
            if (sz === drainSize) len += Math.max(0, drainLineLen - hdpeDrainLen);
            if (sz === skimmerSize) len += Math.max(0, skimmerLineLen - hdpeSkimLen);
            if (!u[`upvc_pipe_${sz}`] || u[`upvc_pipe_${sz}`] === '0') {
                u[`upvc_pipe_${sz}`] = len > 0 ? String(len) : '0';
            }
        });
    } else {
        // UPVC Only
        hdpeSizesAll.forEach(sz => {
            u[`hdpe_pipe_${sz}`] = '0';
        });

        pipeSizesAll.forEach(sz => {
            if (sz === '63mm') {
                u[`upvc_pipe_${sz}`] = String(calculatedPipe63Len);
                return;
            }
            if (sz === '75mm') {
                u[`upvc_pipe_${sz}`] = String(calculatedPipe75Len);
                return;
            }
            if (sz === '90mm') {
                u[`upvc_pipe_${sz}`] = String(calculatedPipe90Len);
                return;
            }
            if (sz === '110mm') {
                u[`upvc_pipe_${sz}`] = String(calculatedPipe110Len);
                return;
            }
            if (sz === '160mm') {
                u[`upvc_pipe_${sz}`] = String(calculatedPipe160Len);
                return;
            }
            if (sz === '200mm') {
                u[`upvc_pipe_${sz}`] = String(calculatedPipe200Len);
                return;
            }
            let len = 0;
            if (sz === inletSize) len += returnLineLen;
            if (sz === vacSize) len += vacLineLen;
            if (sz === drainSize) len += drainLineLen;
            if (sz === skimmerSize) len += skimmerLineLen;
            if (!u[`upvc_pipe_${sz}`] || u[`upvc_pipe_${sz}`] === '0') {
                u[`upvc_pipe_${sz}`] = len > 0 ? String(len) : '0';
            }
        });
    }

    // Pump Room Internal UPVC Manifolds
    const prPerimeterVal = parseNum(u.pump_room_perimeter) || (2 * (prLength + prWidth));
    
    pipeSizesAll.forEach(sz => {
        if (sz === '63mm') {
            u[`pump_room_upvc_pipe_${sz}`] = !isSkimfilter ? String(Math.ceil(prPerimeterVal)) : '0';
            return;
        }
        if (sz === '75mm') {
            u[`pump_room_upvc_pipe_${sz}`] = !isSkimfilter ? String(Math.ceil(prPerimeterVal)) : '0';
            return;
        }
        if (sz === '90mm') {
            u[`pump_room_upvc_pipe_${sz}`] = !isSkimfilter ? String(Math.ceil(prPerimeterVal * 2)) : '0';
            return;
        }
        if (sz === '110mm') {
            const pr110 = waterFiltNum > 40 ? Math.ceil(prPerimeterVal * 2) : 0;
            u[`pump_room_upvc_pipe_${sz}`] = !isSkimfilter ? String(pr110) : '0';
            return;
        }
        if (sz === '160mm') {
            const pr160 = waterFiltNum > 40 ? Math.ceil(prPerimeterVal * 2) : 0;
            u[`pump_room_upvc_pipe_${sz}`] = !isSkimfilter ? String(pr160) : '0';
            return;
        }
        if (sz === '200mm') {
            const pr200 = waterFiltNum > 120 ? Math.ceil(prPerimeterVal * 2) : 0;
            u[`pump_room_upvc_pipe_${sz}`] = !isSkimfilter ? String(pr200) : '0';
            return;
        }
        if (sz === '250mm') {
            const pr250 = waterFiltNum > 160 ? Math.ceil(prPerimeterVal * 2) : 0;
            u[`pump_room_upvc_pipe_${sz}`] = !isSkimfilter ? String(pr250) : '0';
            return;
        }
        if (sz === '315mm') {
            const pr315 = waterFiltNum > 200 ? Math.ceil(prPerimeterVal * 2) : 0;
            u[`pump_room_upvc_pipe_${sz}`] = !isSkimfilter ? String(pr315) : '0';
            return;
        }
        let len = 0;
        if (sz === drainSize || sz === skimmerSize) len += suctionHeaderLen;
        if (sz === inletSize) len += (dischargeHeaderLen + interconnectLen);
        if (!u[`pump_room_upvc_pipe_${sz}`] || u[`pump_room_upvc_pipe_${sz}`] === '0') {
            u[`pump_room_upvc_pipe_${sz}`] = len > 0 ? String(len) : '0';
        }
    });

    // =========================================================================
    // 90° ELBOWS CALCULATIONS
    // =========================================================================
    // Elbow 90° Ø 63mm
    const term1_elb_63 = nSurface_63;
    const term2_elb_63 = isSkimfilter ? (10 * (parseNum(u.no_of_water_filter) || 0)) : 0;
    const term3_elb_63 = (parseNum(u.drainage_chamber) || 0) * 3;
    const term4_elb_63 = isLagoon ? 1 : 0;
    const calculatedElbow90_63 = Math.ceil(term1_elb_63 + term2_elb_63 + term3_elb_63 + term4_elb_63);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_elbow_90_degree_63mm = String(calculatedElbow90_63);
        u.hdpe_elbow_90_degree_63 = String(calculatedElbow90_63);
        u.upvc_elbow_90_degree_63mm = '0';
        u.upvc_elbow_90_degree_63 = '0';
    } else {
        u.upvc_elbow_90_degree_63mm = String(calculatedElbow90_63);
        u.upvc_elbow_90_degree_63 = String(calculatedElbow90_63);
        u.hdpe_elbow_90_degree_63mm = '0';
        u.hdpe_elbow_90_degree_63 = '0';
    }

    // Elbow 90° Ø 75mm
    const calculatedElbow90_75 = Math.ceil(nSurface_63 > 3 ? (nSurface_63 / 3) : 0);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_elbow_90_degree_75mm = String(calculatedElbow90_75);
        u.hdpe_elbow_90_degree_75 = String(calculatedElbow90_75);
        u.upvc_elbow_90_degree_75mm = '0';
        u.upvc_elbow_90_degree_75 = '0';
    } else {
        u.upvc_elbow_90_degree_75mm = String(calculatedElbow90_75);
        u.upvc_elbow_90_degree_75 = String(calculatedElbow90_75);
        u.hdpe_elbow_90_degree_75mm = '0';
        u.hdpe_elbow_90_degree_75 = '0';
    }

    // Elbow 90° Ø 90mm
    const calculatedElbow90_90 = Math.ceil(nSurface_90 > 4 ? (nSurface_90 / 4) : 0);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_elbow_90_degree_90mm = String(calculatedElbow90_90);
        u.hdpe_elbow_90_degree_90 = String(calculatedElbow90_90);
        u.upvc_elbow_90_degree_90mm = '0';
        u.upvc_elbow_90_degree_90 = '0';
    } else {
        u.upvc_elbow_90_degree_90mm = String(calculatedElbow90_90);
        u.upvc_elbow_90_degree_90 = String(calculatedElbow90_90);
        u.hdpe_elbow_90_degree_90mm = '0';
        u.hdpe_elbow_90_degree_90 = '0';
    }

    // Elbow 90° Ø 110mm
    const calculatedElbow90_110 = Math.ceil(nSurface_160 > 8 ? (nSurface_160 / 8) : 0);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_elbow_90_degree_110mm = String(calculatedElbow90_110);
        u.hdpe_elbow_90_degree_110 = String(calculatedElbow90_110);
        u.upvc_elbow_90_degree_110mm = '0';
        u.upvc_elbow_90_degree_110 = '0';
    } else {
        u.upvc_elbow_90_degree_110mm = String(calculatedElbow90_110);
        u.upvc_elbow_90_degree_110 = String(calculatedElbow90_110);
        u.hdpe_elbow_90_degree_110mm = '0';
        u.hdpe_elbow_90_degree_110 = '0';
    }

    // Elbow 90° Ø 160mm
    const calculatedElbow90_160 = Math.ceil(nSurface_90 > 4 ? (nSurface_90 / 4) : 0);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_elbow_90_degree_160mm = String(calculatedElbow90_160);
        u.hdpe_elbow_90_degree_160 = String(calculatedElbow90_160);
        u.upvc_elbow_90_degree_160mm = '0';
        u.upvc_elbow_90_degree_160 = '0';
    } else {
        u.upvc_elbow_90_degree_160mm = String(calculatedElbow90_160);
        u.upvc_elbow_90_degree_160 = String(calculatedElbow90_160);
        u.hdpe_elbow_90_degree_160mm = '0';
        u.hdpe_elbow_90_degree_160 = '0';
    }

    // Elbow 90° Ø 200mm
    const calculatedElbow90_200 = Math.ceil(nSurface_160 > 8 ? (nSurface_160 / 8) : 0);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_elbow_90_degree_200mm = String(calculatedElbow90_200);
        u.hdpe_elbow_90_degree_200 = String(calculatedElbow90_200);
        u.upvc_elbow_90_degree_200mm = '0';
        u.upvc_elbow_90_degree_200 = '0';
    } else {
        u.upvc_elbow_90_degree_200mm = String(calculatedElbow90_200);
        u.upvc_elbow_90_degree_200 = String(calculatedElbow90_200);
        u.hdpe_elbow_90_degree_200mm = '0';
        u.hdpe_elbow_90_degree_200 = '0';
    }

    // =========================================================================
    // TEES CALCULATIONS
    // =========================================================================
    // Tee Ø 63mm
    const term1_tee_63 = nSurface_63;
    const term2_tee_63 = isSkimfilter ? (parseNum(u.no_of_water_filter) || 0) : 0;
    const term3_tee_63 = nVac_63 < 2 ? nVac_63 : 0;
    const term4_tee_63 = nDrain_63 < 4 ? nDrain_63 : 0;
    const calculatedTee63 = Math.ceil(term1_tee_63 + term2_tee_63 + term3_tee_63 + term4_tee_63);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_tee_63mm = String(calculatedTee63);
        u.hdpe_tee_63 = String(calculatedTee63);
        u.upvc_tee_63mm = '0';
        u.upvc_tee_63 = '0';
    } else {
        u.upvc_tee_63mm = String(calculatedTee63);
        u.upvc_tee_63 = String(calculatedTee63);
        u.hdpe_tee_63mm = '0';
        u.hdpe_tee_63 = '0';
    }

    // Pump Room Tee Ø 63mm
    const prTee63 = waterFiltNum < 40 ? 16 : 8;
    u.pump_room_upvc_tee_63mm = !isSkimfilter ? String(prTee63) : '0';
    u.pump_room_upvc_tee_63 = !isSkimfilter ? String(prTee63) : '0';
    // Tee Ø 75mm
    const term1_tee_75 = parseNum(u.total_no_of_h_networks) * 2;
    const term2_tee_75 = nSurface_63;
    const term3_tee_75 = nVac_63 < 8 ? nVac_63 : 0;
    const term4_tee_75 = nDrain_63 > 8 ? (nDrain_63 / 4) : 0;
    const calculatedTee75 = Math.ceil(term1_tee_75 + term2_tee_75 + term3_tee_75 + term4_tee_75);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_tee_75mm = String(calculatedTee75);
        u.hdpe_tee_75 = String(calculatedTee75);
        u.upvc_tee_75mm = '0';
        u.upvc_tee_75 = '0';
    } else {
        u.upvc_tee_75mm = String(calculatedTee75);
        u.upvc_tee_75 = String(calculatedTee75);
        u.hdpe_tee_75mm = '0';
        u.hdpe_tee_75 = '0';
    }

    // Pump Room Tee Ø 75mm
    const prTee75 = waterFiltNum < 40 ? 16 : 8;
    u.pump_room_upvc_tee_75mm = !isSkimfilter ? String(prTee75) : '0';
    u.pump_room_upvc_tee_75 = !isSkimfilter ? String(prTee75) : '0';

    // Tee Ø 90mm
    const term1_tee_90 = parseNum(u.total_no_of_h_networks) * 1;
    const term2_tee_90 = nSurface_90 > 4 ? (nSurface_90 / 4) : 0;
    const term3_tee_90 = isSkimfilter ? parseNum(u.drainage_chamber) : 0;
    const term4_tee_90 = !isSkimfilter && parseNum(u.drainage_chamber) > 0 ? 1 : 0;
    const term5_tee_90 = isLagoon ? 2 : 0;
    const calculatedTee90 = Math.ceil(term1_tee_90 + term2_tee_90 + term3_tee_90 + term4_tee_90 + term5_tee_90);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_tee_90mm = String(calculatedTee90);
        u.hdpe_tee_90 = String(calculatedTee90);
        u.upvc_tee_90mm = '0';
        u.upvc_tee_90 = '0';
    } else {
        u.upvc_tee_90mm = String(calculatedTee90);
        u.upvc_tee_90 = String(calculatedTee90);
        u.hdpe_tee_90mm = '0';
        u.hdpe_tee_90 = '0';
    }

    // Pump Room Tee Ø 90mm
    const prTee90 = waterFiltNum > 40 ? 16 : 8;
    u.pump_room_upvc_tee_90mm = !isSkimfilter ? String(prTee90) : '0';
    u.pump_room_upvc_tee_90 = !isSkimfilter ? String(prTee90) : '0';

    // Tee Ø 110mm
    const term1_tee_110 = parseNum(u.total_no_of_t_networks) * 1;
    const term2_tee_110 = nSurface_160 > 8 ? (nSurface_160 / 8) : 0;
    const term3_tee_110 = isLagoon ? 4 : 0;
    const term4_tee_110 = nVac_63 > 8 ? nVac_63 : 0;
    const term5_tee_110 = nDrain_63 > 8 ? (nDrain_63 / 4) : 0;
    const calculatedTee110 = Math.ceil(term1_tee_110 + term2_tee_110 + term3_tee_110 + term4_tee_110 + term5_tee_110);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_tee_110mm = String(calculatedTee110);
        u.hdpe_tee_110 = String(calculatedTee110);
        u.upvc_tee_110mm = '0';
        u.upvc_tee_110 = '0';
    } else {
        u.upvc_tee_110mm = String(calculatedTee110);
        u.upvc_tee_110 = String(calculatedTee110);
        u.hdpe_tee_110mm = '0';
        u.hdpe_tee_110 = '0';
    }

    // Pump Room Tee Ø 110mm
    const prTee110 = waterFiltNum > 80 ? Math.ceil(waterFiltNum / 7) : 0;
    u.pump_room_upvc_tee_110mm = !isSkimfilter ? String(prTee110) : '0';
    u.pump_room_upvc_tee_110 = !isSkimfilter ? String(prTee110) : '0';

    // Tee Ø 160mm
    const term1_tee_160 = nSurface_90 > 4 ? (nSurface_90 / 4) : 0;
    const term2_tee_160 = nDrain_200 > 12 ? (nDrain_200 / 8) : 0;
    const calculatedTee160 = Math.ceil(term1_tee_160 + term2_tee_160);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_tee_160mm = String(calculatedTee160);
        u.hdpe_tee_160 = String(calculatedTee160);
        u.upvc_tee_160mm = '0';
        u.upvc_tee_160 = '0';
    } else {
        u.upvc_tee_160mm = String(calculatedTee160);
        u.upvc_tee_160 = String(calculatedTee160);
        u.hdpe_tee_160mm = '0';
        u.hdpe_tee_160 = '0';
    }

    // Pump Room Tee Ø 160mm
    const prTee160 = waterFiltNum > 80 ? Math.ceil(waterFiltNum / 7) : 0;
    u.pump_room_upvc_tee_160mm = !isSkimfilter ? String(prTee160) : '0';
    u.pump_room_upvc_tee_160 = !isSkimfilter ? String(prTee160) : '0';

    // Tee Ø 200mm
    const term1_tee_200 = nSurface_160 > 8 ? (nSurface_160 / 8) : 0;
    const term2_tee_200 = nDrain_200 > 12 ? (nDrain_200 / 8) : 0;
    const calculatedTee200 = Math.ceil(term1_tee_200 + term2_tee_200);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_tee_200mm = String(calculatedTee200);
        u.hdpe_tee_200 = String(calculatedTee200);
        u.upvc_tee_200mm = '0';
        u.upvc_tee_200 = '0';
    } else {
        u.upvc_tee_200mm = String(calculatedTee200);
        u.upvc_tee_200 = String(calculatedTee200);
        u.hdpe_tee_200mm = '0';
        u.hdpe_tee_200 = '0';
    }

    // Pump Room Tee Ø 200mm
    const prTee200 = waterFiltNum > 120 ? Math.ceil(waterFiltNum / 14) : 0;
    u.pump_room_upvc_tee_200mm = !isSkimfilter ? String(prTee200) : '0';
    u.pump_room_upvc_tee_200 = !isSkimfilter ? String(prTee200) : '0';

    // Pump Room Tee Ø 250mm
    const prTee250 = waterFiltNum > 160 ? Math.ceil(waterFiltNum / 28) : 0;
    u.pump_room_upvc_tee_250mm = !isSkimfilter ? String(prTee250) : '0';
    u.pump_room_upvc_tee_250 = !isSkimfilter ? String(prTee250) : '0';

    // Pump Room Tee Ø 315mm
    const prTee315 = waterFiltNum > 200 ? Math.ceil(waterFiltNum / 36) : 0;
    u.pump_room_upvc_tee_315mm = !isSkimfilter ? String(prTee315) : '0';
    u.pump_room_upvc_tee_315 = !isSkimfilter ? String(prTee315) : '0';

    // =========================================================================
    // REDUCERS CALCULATIONS
    // =========================================================================
    // Reducer Ø 75/63mm
    const term1_red_75_63 = parseNum(u.total_no_of_h_networks) * 4;
    const term2_red_75_63 = nSurface_63 > 3 ? (nSurface_63 / 3) : 0;
    const term3_red_75_63 = nVac_63 > 2 ? (nVac_63 / 2) : 0;
    const term4_red_75_63 = nDrain_63 < 8 ? nDrain_63 : 0;
    const calculatedReducer75_63 = Math.ceil(term1_red_75_63 + term2_red_75_63 + term3_red_75_63 + term4_red_75_63);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_reducer_75_63mm = String(calculatedReducer75_63);
        u.hdpe_reducer_75_63 = String(calculatedReducer75_63);
        u.upvc_reducer_75_63mm = '0';
        u.upvc_reducer_75_63 = '0';
    } else {
        u.upvc_reducer_75_63mm = String(calculatedReducer75_63);
        u.upvc_reducer_75_63 = String(calculatedReducer75_63);
        u.hdpe_reducer_75_63mm = '0';
        u.hdpe_reducer_75_63 = '0';
    }

    // Pump Room Reducer Ø 75/63mm
    const prRed75_63 = waterFiltNum < 40 ? 16 : 8;
    u.pump_room_upvc_reducer_75_63mm = !isSkimfilter ? String(prRed75_63) : '0';
    u.pump_room_upvc_reducer_75_63 = !isSkimfilter ? String(prRed75_63) : '0';

    // Reducer Ø 90/75mm
    const term1_red_90_75 = parseNum(u.total_no_of_h_networks) * 2;
    const term2_red_90_75 = nSurface_90 > 4 ? (nSurface_90 / 4) : 0;
    const calculatedReducer90_75 = Math.ceil(term1_red_90_75 + term2_red_90_75);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_reducer_90_75mm = String(calculatedReducer90_75);
        u.hdpe_reducer_90_75 = String(calculatedReducer90_75);
        u.upvc_reducer_90_75mm = '0';
        u.upvc_reducer_90_75 = '0';
    } else {
        u.upvc_reducer_90_75mm = String(calculatedReducer90_75);
        u.upvc_reducer_90_75 = String(calculatedReducer90_75);
        u.hdpe_reducer_90_75mm = '0';
        u.hdpe_reducer_90_75 = '0';
    }

    // Pump Room Reducer Ø 90/75mm
    const prRed90_75 = waterFiltNum > 40 ? 16 : 8;
    u.pump_room_upvc_reducer_90_75mm = !isSkimfilter ? String(prRed90_75) : '0';
    u.pump_room_upvc_reducer_90_75 = !isSkimfilter ? String(prRed90_75) : '0';

    // Reducer Ø 110/160mm
    const term1_red_110_160 = parseNum(u.total_no_of_t_networks) > 2 ? parseNum(u.total_no_of_t_networks) : 0;
    const term2_red_110_160 = nSurface_160 > 8 ? (nSurface_160 / 8) : 0;
    const term3_red_110_160 = isLagoon ? 4 : 0;
    const term4_red_110_160 = nDrain_110 > 8 ? (nDrain_110 / 4) : 0;
    const calculatedReducer110_160 = Math.ceil(term1_red_110_160 + term2_red_110_160 + term3_red_110_160 + term4_red_110_160);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_reducer_110_160mm = String(calculatedReducer110_160);
        u.hdpe_reducer_110_160 = String(calculatedReducer110_160);
        u.upvc_reducer_110_160mm = '0';
        u.upvc_reducer_110_160 = '0';
    } else {
        u.upvc_reducer_110_160mm = String(calculatedReducer110_160);
        u.upvc_reducer_110_160 = String(calculatedReducer110_160);
        u.hdpe_reducer_110_160mm = '0';
        u.hdpe_reducer_110_160 = '0';
    }

    // Pump Room Reducer Ø 110/160mm
    const prRed110_160 = waterFiltNum > 80 ? Math.ceil(waterFiltNum / 7) : 0;
    u.pump_room_upvc_reducer_110_160mm = !isSkimfilter ? String(prRed110_160) : '0';
    u.pump_room_upvc_reducer_110_160 = !isSkimfilter ? String(prRed110_160) : '0';

    // Reducer Ø 110/63mm
    const calculatedReducer110_63 = Math.ceil(nVac_63 > 8 ? nVac_63 : 0);
    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_reducer_110_63mm = String(calculatedReducer110_63);
        u.hdpe_reducer_110_63 = String(calculatedReducer110_63);
        u.upvc_reducer_110_63mm = '0';
        u.upvc_reducer_110_63 = '0';
    } else {
        u.upvc_reducer_110_63mm = String(calculatedReducer110_63);
        u.upvc_reducer_110_63 = String(calculatedReducer110_63);
        u.hdpe_reducer_110_63mm = '0';
        u.hdpe_reducer_110_63 = '0';
    }

    // Reducer Ø 110/75mm
    const calculatedReducer110_75 = Math.ceil(nDrain_63 < 8 ? nDrain_63 : 0);
    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_reducer_110_75mm = String(calculatedReducer110_75);
        u.hdpe_reducer_110_75 = String(calculatedReducer110_75);
        u.upvc_reducer_110_75mm = '0';
        u.upvc_reducer_110_75 = '0';
    } else {
        u.upvc_reducer_110_75mm = String(calculatedReducer110_75);
        u.upvc_reducer_110_75 = String(calculatedReducer110_75);
        u.hdpe_reducer_110_75mm = '0';
        u.hdpe_reducer_110_75 = '0';
    }

    // Reducer Ø 110/90mm
    const calculatedReducer110_90 = Math.ceil(nSurface_160 > 8 ? (nSurface_160 / 8) : 0);
    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_reducer_110_90mm = String(calculatedReducer110_90);
        u.hdpe_reducer_110_90 = String(calculatedReducer110_90);
        u.upvc_reducer_110_90mm = '0';
        u.upvc_reducer_110_90 = '0';
    } else {
        u.upvc_reducer_110_90mm = String(calculatedReducer110_90);
        u.upvc_reducer_110_90 = String(calculatedReducer110_90);
        u.hdpe_reducer_110_90mm = '0';
        u.hdpe_reducer_110_90 = '0';
    }

    // Reducer Ø 200/160mm
    const term1_red_200_160 = parseNum(u.total_no_of_t_networks) > 4 ? parseNum(u.total_no_of_t_networks) : 0;
    const term2_red_200_160 = nSurface_200 > 16 ? (nSurface_200 / 16) : 0;
    const term3_red_200_160 = isLagoon ? 4 : 0;
    const term4_red_200_160 = nDrain_200 > 12 ? (nDrain_200 / 8) : 0;
    const calculatedReducer200_160 = Math.ceil(term1_red_200_160 + term2_red_200_160 + term3_red_200_160 + term4_red_200_160);

    if (matSystem === 'upvc_and_hdpe') {
        u.hdpe_reducer_200_160mm = String(calculatedReducer200_160);
        u.hdpe_reducer_200_160 = String(calculatedReducer200_160);
        u.upvc_reducer_200_160mm = '0';
        u.upvc_reducer_200_160 = '0';
    } else {
        u.upvc_reducer_200_160mm = String(calculatedReducer200_160);
        u.upvc_reducer_200_160 = String(calculatedReducer200_160);
        u.hdpe_reducer_200_160mm = '0';
        u.hdpe_reducer_200_160 = '0';
    }

    // Pump Room Reducer Ø 200/160mm
    const prRed200_160 = waterFiltNum > 120 ? Math.ceil(waterFiltNum / 14) : 0;
    u.pump_room_upvc_reducer_200_160mm = !isSkimfilter ? String(prRed200_160) : '0';
    u.pump_room_upvc_reducer_200_160 = !isSkimfilter ? String(prRed200_160) : '0';

    // Pump Room Reducer Ø 250/200mm
    const prRed250_200 = waterFiltNum > 160 ? Math.ceil(waterFiltNum / 28) : 0;
    u.pump_room_upvc_reducer_250_200mm = !isSkimfilter ? String(prRed250_200) : '0';
    u.pump_room_upvc_reducer_250_200 = !isSkimfilter ? String(prRed250_200) : '0';

    // Pump Room Reducer Ø 315/250mm
    const prRed315_250 = waterFiltNum > 200 ? Math.ceil(waterFiltNum / 36) : 0;
    u.pump_room_upvc_reducer_315_250mm = !isSkimfilter ? String(prRed315_250) : '0';
    u.pump_room_upvc_reducer_315_250 = !isSkimfilter ? String(prRed315_250) : '0';

    // =========================================================================
    // VALVES CALCULATIONS
    // =========================================================================
    // Water Feature Ball Valve Ø 63mm
    const wfBv63_skim = isSkimfilter ? (2 * (parseNum(u.no_of_water_filter) || 0)) : 0;
    const wfBv63_dc = (parseNum(u.drainage_chamber) || 0) * 2;
    const calculatedWfBv63 = Math.ceil(wfBv63_skim + wfBv63_dc);
    u.ball_valve_63mm = String(calculatedWfBv63);
    u.ball_valve_63mm_no = String(calculatedWfBv63);

    // Water Feature Check Valve 63mm
    const wfCv63 = isSkimfilter ? Math.ceil((parseNum(u.no_of_water_filter) > 12 ? (parseNum(u.no_of_water_filter) / 12) : 1) * 2) : 0;
    u.check_valve_63mm = String(wfCv63);
    u.check_valve_63_mm = String(wfCv63);

    // Pump Room Ball Valve Ø 63mm
    const prBv63 = waterFiltNum < 40 ? 8 : 4;
    u.pump_room_ball_valve_63mm = !isSkimfilter ? String(prBv63) : '0';
    u.pump_room_ball_valve_63 = !isSkimfilter ? String(prBv63) : '0';

    // Pump Room Ball Valve Ø 75mm
    const prBv75 = waterFiltNum < 40 ? 8 : 4;
    u.pump_room_ball_valve_75mm = !isSkimfilter ? String(prBv75) : '0';
    u.pump_room_ball_valve_75 = !isSkimfilter ? String(prBv75) : '0';

    // Pump Room Ball Valve Ø 90mm
    const prBv90 = waterFiltNum < 40 ? 8 : 4;
    u.pump_room_ball_valve_90mm = !isSkimfilter ? String(prBv90) : '0';
    u.pump_room_ball_valve_90 = !isSkimfilter ? String(prBv90) : '0';

    // Pump Room Ball Valve Ø 110mm
    const prBv110 = waterFiltNum > 40 ? Math.ceil(waterFiltNum / 40) : 0;
    u.pump_room_ball_valve_110mm = !isSkimfilter ? String(prBv110) : '0';
    u.pump_room_ball_valve_110 = !isSkimfilter ? String(prBv110) : '0';

    // Pump Room Ball Valve Ø 160mm
    const prBv160 = waterFiltNum > 80 ? Math.ceil(waterFiltNum / 80) : 0;
    u.pump_room_ball_valve_160mm = !isSkimfilter ? String(prBv160) : '0';
    u.pump_room_ball_valve_160 = !isSkimfilter ? String(prBv160) : '0';

    // Pump Room Ball Valve Ø 200mm
    const prBv200 = waterFiltNum > 120 ? Math.ceil(waterFiltNum / 120) : 0;
    u.pump_room_ball_valve_200mm = !isSkimfilter ? String(prBv200) : '0';
    u.pump_room_ball_valve_200 = !isSkimfilter ? String(prBv200) : '0';

    // Pump Room Ball Valve Ø 250mm
    const prBv250 = waterFiltNum > 160 ? Math.ceil(waterFiltNum / 160) : 0;
    u.pump_room_ball_valve_250mm = !isSkimfilter ? String(prBv250) : '0';
    u.pump_room_ball_valve_250 = !isSkimfilter ? String(prBv250) : '0';

    // Pump Room Ball Valve Ø 315mm
    const prBv315 = waterFiltNum > 200 ? Math.ceil(waterFiltNum / 200) : 0;
    u.pump_room_ball_valve_315mm = !isSkimfilter ? String(prBv315) : '0';
    u.pump_room_ball_valve_315 = !isSkimfilter ? String(prBv315) : '0';

    // If material system is UPVC only, ensure all HDPE fields are zeroed out
    if (matSystem !== 'upvc_and_hdpe') {
        hdpeSizesAll.forEach(sz => {
            u[`hdpe_pipe_${sz}`] = '0';
            u[`hdpe_pipe_dia_${sz}`] = '0';
            u[`hdpe_elbow_90_degree_${sz}`] = '0';
            u[`hdpe_elbow_45_degree_${sz}`] = '0';
            u[`hdpe_tee_${sz}`] = '0';
            u[`hdpe_flange_${sz}`] = '0';
        });
        ['75_63mm', '90_75mm', '110_63mm', '110_75mm', '110_90mm', '110_160mm', '200_160mm'].forEach(k => {
            u[`hdpe_reducer_${k}`] = '0';
            u[`hdpe_reducer_${k.replace('_', '')}`] = '0';
        });
    } else {
        pipeSizesAll.forEach(sz => {
            u[`upvc_pipe_${sz}`] = '0';
            u[`upvc_pipe_dia_${sz}`] = '0';
            u[`upvc_elbow_90_degree_${sz}`] = '0';
            u[`upvc_elbow_45_degree_${sz}`] = '0';
            u[`upvc_tee_${sz}`] = '0';
            u[`upvc_flange_${sz}`] = '0';
        });
        ['75_63mm', '90_75mm', '110_63mm', '110_75mm', '110_90mm', '110_160mm', '200_160mm'].forEach(k => {
            u[`upvc_reducer_${k}`] = '0';
            u[`upvc_reducer_${k.replace('_', '')}`] = '0';
        });
    }

    // =========================================================================
    // SUB-TAB 6: CABLE TRAY RACEWAYS & CONDUITS
    // =========================================================================
    const trayLength = Math.ceil((prLength + prWidth) * 1.15);
    u.main_cable_tray_length_m = String(trayLength);
    u.splice_plate_quantity = String(Math.ceil(trayLength / 3) * 2);
    u.main_cable_tray_c_channel_quantity = String(Math.ceil(trayLength / 1.5));
    u.main_cable_tray_anchors_quantity = String(Math.ceil(trayLength / 1.5) * 2);
    u.end_cap_qty_quantity = '2';
    u.main_cable_tray_vertical_elbow_90_quantity = '2';

    // =========================================================================
    // SUB-TAB 5: EARTHING & LIGHTNING GROUNDING PROTECTION (IEEE 80 / BS 7430)
    // =========================================================================
    const prPerimeter = parseNum(u.pump_room_perimeter) || (2 * (prLength + prWidth));
    const pumpPowerKw = (circDuty * 2.2) + (vacDuty * 1.5) + (totalSubPumps * 0.75);
    const heaterPowerKw = (parseNum(u.no_of_heaters) || 0) * 30;
    const lightingPowerKw = (parseNum(u.qty_lights) || 0) * 0.05;
    const totalPowerKw = Number((pumpPowerKw + heaterPowerKw + lightingPowerKw).toFixed(2));
    u.total_power_kw = String(totalPowerKw);
    u.pump_power_kw = String(Number(pumpPowerKw.toFixed(2)));
    u.heater_power_kw = String(Number(heaterPowerKw.toFixed(2)));
    u.lighting_power_kw = String(Number(lightingPowerKw.toFixed(2)));

    // 1. Soil Resistivity & Earthing Requirements
    if (!u.soil_sensitivity_type) u.soil_sensitivity_type = 'Marls (e.g. Keuper marl)';
    const rho = parseNum(u.soil_sensitivity_probable_value) || 20;
    u.soil_sensitivity_probable_value = String(rho);
    const reqR = parseNum(u.required_earthing_system_resistant) || 0.50;
    u.required_earthing_system_resistant = String(reqR.toFixed(2));

    // 2. Rod Dimensions & Calculations
    const nRodsPerComp = parseNum(u.no_of_rods_for_one_component) || 2;
    u.no_of_rods_for_one_component = String(nRodsPerComp);
    const rodLen1 = parseNum(u.one_rod_length) || 1.5;
    u.one_rod_length = String(rodLen1);
    const totalRodLen = parseNum(u.overall_length_of_one_rod_component) || (nRodsPerComp * rodLen1);
    u.overall_length_of_one_rod_component = String(totalRodLen);
    const rodDiameter = parseNum(u.cross_section_of_the_rod_inch) || 0.0019;
    u.cross_section_of_the_rod_inch = String(rodDiameter);

    // 3. Single Rod Resistance Rr (Dwight formula)
    let singleRodRr = parseNum(u.earthing_rod_resistance_rr);
    if (!singleRodRr || isNaN(singleRodRr)) {
      const logTerm = Math.log((8 * Math.max(1, totalRodLen)) / Math.max(0.001, rodDiameter)) - 1;
      singleRodRr = (rho / (2 * Math.PI * Math.max(1, totalRodLen))) * Math.max(1, logTerm);
      singleRodRr = Number(singleRodRr.toFixed(2));
      if (singleRodRr < 1) singleRodRr = 8.96;
    }
    u.earthing_rod_resistance_rr = String(singleRodRr || 8.96);

    // 4. Grouping & Mutual Resistance
    const numRods = Math.max(2, parseNum(u.no_of_earthing_rods_qty) || Math.ceil(totalPowerKw / 15));
    u.no_of_earthing_rods_qty = String(numRods);
    if (u.no_of_electrodes_to_reach_required_resistance === undefined) {
      u.no_of_electrodes_to_reach_required_resistance = String(Math.max(2, Math.ceil(singleRodRr / reqR)));
    }
    if (u.lambda_factor === undefined) u.lambda_factor = '0.85';
    if (u.distance_between_adjacent_rods_m === undefined) u.distance_between_adjacent_rods_m = String(Math.max(3, totalRodLen * 2));
    if (u.alpha_coefficient === undefined) u.alpha_coefficient = String(Number((Number(u.lambda_factor || 0.85) / Math.max(1, numRods)).toFixed(2)));
    if (u.total_resistance_of_earthing_rods_rn === undefined) {
      const rn = (singleRodRr / Math.max(1, numRods)) * (1 + (parseNum(u.alpha_coefficient) || 0.05));
      u.total_resistance_of_earthing_rods_rn = String(Number(rn.toFixed(2)));
    }

    // 5. Buried Cable Conductor Resistance Rc
    const cableDiameter = parseNum(u.earthing_cable_diameter_m) || 0.0067;
    u.earthing_cable_diameter_m = String(cableDiameter);
    const burialDepth = parseNum(u.burial_depth_of_cable_m) || 0.6;
    u.burial_depth_of_cable_m = String(burialDepth);

    const totalCableLen = Math.max(10, Math.ceil(wfPerimeter + prPerimeter + (numRods * 6)));
    u.total_earthing_cable_length_m = String(parseNum(u.total_earthing_cable_length_m) || totalCableLen);
    u.perimeter_bare_copper_m = String(Math.ceil(wfPerimeter));

    let cableRc = parseNum(u.earthing_cable_resistance_rc);
    if (!cableRc || isNaN(cableRc)) {
      const lCable = parseNum(u.total_earthing_cable_length_m) || totalCableLen;
      const logTermCable = Math.log((2 * Math.pow(lCable, 2)) / (Math.max(0.1, burialDepth) * Math.max(0.001, cableDiameter)));
      cableRc = (rho / (2 * Math.PI * Math.max(1, lCable))) * Math.max(0.5, logTermCable);
      cableRc = Number(cableRc.toFixed(2));
      if (isNaN(cableRc) || cableRc <= 0) cableRc = 0.52;
    }
    u.earthing_cable_resistance_rc = String(cableRc || 0.52);

    // 6. Final Total System Resistance Rt
    const rnVal = parseNum(u.total_resistance_of_earthing_rods_rn) || (singleRodRr / numRods);
    const rcVal = parseNum(u.earthing_cable_resistance_rc) || 0.52;
    const finalRt = (rnVal * rcVal) / Math.max(0.1, (rnVal + rcVal));
    u.final_earthing_resistance_rt = String(Number(finalRt.toFixed(2)) || 0.48);

    // Hardware Catalog Matching
    if (!u.earthing_system_rod_type) {
        const defRod = itemsList.find(i => (i.item_name || '').toLowerCase().includes('earth rod') || (i.item_name || '').toLowerCase().includes('copper bonded'));
        if (defRod) u.earthing_system_rod_type = defRod.id;
    }
    u.driving_stud_qty = '1';
    u.rod_coupler_qty = String(Math.max(1, Math.ceil((3 * numRods) / 2)));
    u.rebar_clamp_qty = String(Math.max(1, Math.ceil((3 * numRods) / 2)));
    u.thermoweld_qty = String(numRods);
    if (!u.earthing_system_grounding_cable_type) {
        const defCable = itemsList.find(i => (i.item_name || '').toLowerCase().includes('bare copper') || (i.item_name || '').toLowerCase().includes('1x70') || (i.item_name || '').toLowerCase().includes('grounding'));
        if (defCable) u.earthing_system_grounding_cable_type = defCable.id;
    }
    if (!u.earth_pit_type) {
        const defPit = itemsList.find(i => (i.item_name || '').toLowerCase().includes('earth pit'));
        if (defPit) u.earth_pit_type = defPit.id;
    }
    u.no_of_earth_pits = String(numRods);
    u.earthing_clamp_quantity = String(numRods * 2);

    // =========================================================================
    // SUB-TAB 8: PUMP ROOM MEP SERVICES & SAFETY
    // =========================================================================
    const prArea = parseNum(u.pump_room_areas) || (prLength * prWidth);
    const noPR = parseNum(u.no_pump_rooms) || 1;
    
    // Tri-Proof IP65 LED Luminaires: N_PR lights = max(2, ceil(A_PR / 8))
    const prLights = Math.max(2 * noPR, Math.ceil(prArea / 8));
    u.pump_room_lighting_quantity = String(prLights);
    if (!u.pump_room_lighting_type) {
        const defPrLight = itemsList.find(i => (i.item_name || '').toLowerCase().includes('greenperform') || (i.item_name || '').toLowerCase().includes('wt198c') || (i.item_name || '').toLowerCase().includes('tri-proof'));
        if (defPrLight) u.pump_room_lighting_type = defPrLight.id;
    }
    if (!u.pump_room_lighting_cable_type) {
        u.pump_room_lighting_cable_type = '9a8108d6-98d6-4fdb-8a43-992ae321f6df';
    }
    if (!u.pump_room_lighting_cable_conduit_emt_type) {
        u.pump_room_lighting_cable_conduit_emt_type = '325663e7-139d-4f3c-a291-8452ca523ed3';
    }
    u.pump_room_lighting_cable_length_m = String(prLights * 8);
    u.pump_room_lighting_cable_gland_quantity = String(prLights * 2);
    u.pump_room_lighting_cable_emt_conduit_length_m = String(prLights * 4);
    u.pump_room_lighting_emt_conduit_adapter_quantity = String(prLights * 2);
    u.pump_room_lighting_emt_conduit_coupler_quantity = String(Math.ceil(prLights * 4 / 3));
    u.pump_room_lighting_emt_conduit_strap_quantity = String(Math.ceil(prLights * 4 / 1.5));
    u.pump_room_lighting_emt_junction_box_quantity = String(prLights);
    u.weatherproof_light_switch_qty = String(noPR);
    if (!u.pump_room_lighting_switch_type) {
        u.pump_room_lighting_switch_type = '8cc7cd49-6d9b-490c-ab2e-f902d3122e36';
    }
    if (!u.pump_room_lighting_water_tight_enclosure_type) {
        u.pump_room_lighting_water_tight_enclosure_type = 'c23c71c4-d5a4-431d-ab30-3bc9bb969964';
    }

    // Ventilation Fans
    u.no_of_ventilation_fan = String(noPR);
    if (!u.pump_room_ventilation_type) {
        const defFan = itemsList.find(i => (i.item_name || '').toLowerCase().includes('rosenberg') || (i.item_name || '').toLowerCase().includes('ventilation fan'));
        if (defFan) u.pump_room_ventilation_type = defFan.id;
    }

    // Industrial Service Sockets
    const prSockets = Math.max(2 * noPR, parseNum(u.service_socket_qty) || (2 * noPR));
    u.service_socket_qty = String(prSockets);
    if (!u.service_socket_type) {
        const defSock = itemsList.find(i => (i.item_name || '').toLowerCase().includes('gw66004') || (i.item_name || '').toLowerCase().includes('industrial socket') || (i.item_name || '').toLowerCase().includes('2p+e 16a'));
        if (defSock) u.service_socket_type = defSock.id;
    }
    if (!u.service_socket_cable_type) {
        u.service_socket_cable_type = '9a8108d6-98d6-4fdb-8a43-992ae321f6df';
    }
    if (!u.service_socket_cable_conduit_emt_type) {
        u.service_socket_cable_conduit_emt_type = '325663e7-139d-4f3c-a291-8452ca523ed3';
    }
    u.service_socket_cable_length_m = String(prSockets * 12);
    u.service_socket_cable_gland_quantity = String(prSockets * 2);
    u.service_socket_cable_emt_conduit_length_m = String(prSockets * 6);
    u.service_socket_emt_conduit_adapter_quantity = String(prSockets * 2);
    u.service_socket_emt_conduit_coupler_quantity = String(Math.ceil(prSockets * 6 / 3));
    u.service_socket_emt_conduit_strap_quantity = String(Math.ceil(prSockets * 6 / 1.5));
    u.service_socket_emt_junction_box_quantity = String(prSockets);

    // Disconnect Switch
    if (!u.disconnect_switch_type) {
        const defDisc = itemsList.find(i => (i.item_name || '').toLowerCase().includes('rot.ctrl.switch 3p 32a') || (i.item_name || '').toLowerCase().includes('gw70435p') || (i.item_name || '').toLowerCase().includes('isolator'));
        if (defDisc) u.disconnect_switch_type = defDisc.id;
    }

    // Fire Extinguishers
    u.no_of_fire_extinguisher = String(noPR);
    if (!u.fire_extinguisher_type) {
        const defExt = itemsList.find(i => (i.item_name || '').toLowerCase().includes('naffco') || (i.item_name || '').toLowerCase().includes('fire extinguisher'));
        if (defExt) u.fire_extinguisher_type = defExt.id;
    }

    return u;
};
