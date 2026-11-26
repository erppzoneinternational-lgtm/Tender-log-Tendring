// src/utils/engine/modules/waterFeatureElectromechanicalBoqBuilder.js
import { upsertBoqRow, getAllItemsDb } from './waterFeatureStructuralBoqBuilder.js';

export const getWaterFeatureElectromechanicalBoqDependencies = () => {
    return [
        'water_feature_volume',
        'water_filtration',
        'no_of_water_filter',
        'water_filter_code',
        'preferred_water_filter',
        'water_filter_pump',
        'preferred_water_filter_pump',
        'no_of_water_filter_pump',
        'no_of_water_filter_pump_stand_by',
        'vacuum_filter_code',
        'no_of_vacuum_filter',
        'vacuum_filter_pump_code',
        'no_of_vacuum_filter_pump',
        'no_of_vacuum_filter_pump_stand_by',
        'submersible_pump_code',
        'submersible_pump_qty',
        'chemical_feeder_code',
        'chemical_feeder_qty',
        'heater_type',
        'heater_qty',
        'underwater_light_type',
        'qty_lights',
        'water_feature_lighting_backbox',
        'transformer_type',
        'transformer_qty',
        'junction_box_type',
        'junction_box_qty',
        'main_cable_tray_type',
        'main_cable_tray_length_m',
        'no_pump_rooms',
        'pump_room_length',
        'pump_room_width',
        'pump_room_height',
        'mechanical_networks_type',
        'solenoid_valve_type',
        'no_of_selnoid_valve',
        'no_of_float_valve',
        'no_of_float_switch',
        'pump_room_lighting_type',
        'pump_room_lighting_quantity',
        'pump_room_lighting_cable_type',
        'pump_room_lighting_cable_length_m',
        'pump_room_lighting_cable_length',
        'pump_room_lighting_cable_gland_type',
        'pump_room_lighting_cable_gland_quantity_no',
        'pump_room_lighting_cable_gland_quantity',
        'pump_room_lighting_cable_conduit_emt_type',
        'pump_room_lighting_cable_emt_conduit_length_m',
        'pump_room_lighting_cable_emt_conduit_length',
        'pump_room_lighting_emt_conduit_adapter_type',
        'pump_room_lighting_emt_conduit_adapter_quantity_no',
        'pump_room_lighting_emt_conduit_adapter_quantity',
        'pump_room_lighting_emt_conduit_coupler_type',
        'pump_room_lighting_emt_conduit_coupler_quantity_no',
        'pump_room_lighting_emt_conduit_coupler_quantity',
        'pump_room_lighting_emt_conduit_strap_type',
        'pump_room_lighting_emt_conduit_strap_quantity_no',
        'pump_room_lighting_emt_conduit_strap_quantity',
        'pump_room_lighting_emt_junction_box_type',
        'pump_room_lighting_emt_junction_box_quantity_no',
        'pump_room_lighting_emt_junction_box_quantity',
        'pump_room_lighting_cable_conduit_liquid_tight_type',
        'pump_room_lighting_cable_liquid_tight_conduit_length_m',
        'pump_room_lighting_cable_liquid_tight_conduit_length',
        'pump_room_lighting_cable_liquid_tight_conduit_adapter_type',
        'pump_room_lighting_cable_liquid_tight_conduit_adapter_quantity_',
        'pump_room_lighting_cable_liquid_tight_conduit_adapter_quantity',
        'pump_room_lighting_cable_liquid_tight_conduit_adapter_quantity_no',
        'pump_room_lighting_water_tight_enclosure_type',
        'pump_room_lighting_water_tight_enclosure_quantity_no',
        'pump_room_lighting_water_tight_enclosure_quantity',
        'pump_room_lighting_switch_type',
        'service_socket_type',
        'service_socket_qty',
        'main_conduit_category',
        'water_filtration_method',
        'method_of_water_filtration',
        'skimmer_type',
        'no_of_skimmer',
        'floor_inlets_type',
        'no_of_floor_inlets',
        'wall_inlets_type',
        'no_of_wall_inlets',
        'vacuum_inlets_type',
        'no_of_vacuum_inlets',
        'main_drain_type',
        'no_of_main_drain',
        'gutter_drain_type',
        'no_of_gutter_drain',
        'tablet_chlorinator_type',
        'tablet_chlorinator_quantity',
        'type_of_chlorinator_system',
        'accommodations_required',
        'accommodations',
        'accommodation_required',
        'accommodation',
        'water_feature_area_m2',
        'area_m2',
        'no_of_manual_cleaning_set',
        'fire_extinguisher_type',
        'no_of_fire_extinguisher',
        'drainage_chamber',
        'mixing_tank_capacity',
        'no_of_mixing_tank',
        'transformer_feeding_cable_conduit',
        'transformer_feeding_cable_conduit_length_m',
        'transformer_feeding_cable_conduit_adapter_type',
        'transformer_feeding_cable_conduit_adapter_qty_no',
        'transformer_feeding_cable_conduit_coupler_type',
        'transformer_feeding_cable_conduit_coupler_qty_no',
        'transfomer_output_cable_gland_type',
        'transfomer_output_cable_gland_no',
        'transformer_output_cable_conduit_type',
        'transformer_output_cable_conduit_length_m',
        'transformer_output_cable_conduit_adapter_type',
        'transformer_output_cable_conduit_adapter_quantity_no',
        'transformer_output_cable_conduit_coupler_type',
        'transformer_output_cable_conduit_coupler_quantity_no',
        'transfomer_feeding_cable_gland_type',
        'transfomer_feeding_cable_gland_no',
        'protective_conduit',
        'total_protective_conduit_length',
        'recommended_main_conduit_type',
        'total_main_conduit_lengths',
        'main_conduit_adapter_type',
        'total_main_conduit_adapter_qty',
        'recommended_electric_cable_gland',
        'electric_cable_gland_quantity',
        'recommended_electric_cable_type',
        'total_electric_cable_lengths',
        'earthing_system_rod_type',
        'no_of_earthing_rods_qty',
        'one_rod_length',
        'earthing_system_grounding_cable_type',
        'total_earthing_cable_length_m',
        'water_feature_perimeter',
        'water_feature_perimeter_m',
        'splice_plate_type',
        'splice_plate_quantity',
        'main_cable_tray_vertical_elbow_90_type',
        'main_cable_tray_vertical_elbow_90_quantity',
        'main_cable_tray_end_cap_type',
        'end_cap_qty_quantity',
        'main_cable_tray_c_channel_type',
        'main_cable_tray_c_channel_quantity',
        'main_cable_tray_anchors_type',
        'main_cable_tray_anchors_quantity',
        'total_no_of_water_filter_pumps',
        'no_of_filtration_pump_required',
        'vacuum_filter_pump_hp',
        'vacuum_filter_pump',
        'total_no_of_vacuum_filter_pumps',
        'submersible_pump_hp',
        'no_of_submersible_pump',
        'heater_output_kw',
        'no_of_heaters'
    ];
};

export const buildWaterFeatureElectromechanicalBoq = (u = {}, breakdown = [], dropdownOptions = {}, parentRecord = {}) => {
    // Robust argument normalizer if arguments were passed in alternative order
    let realBreakdown = Array.isArray(breakdown) ? breakdown : (Array.isArray(parentRecord) ? parentRecord : []);
    let realOptions = (dropdownOptions && typeof dropdownOptions === 'object' && !Array.isArray(dropdownOptions)) 
      ? dropdownOptions 
      : ((breakdown && typeof breakdown === 'object' && !Array.isArray(breakdown)) ? breakdown : {});
    let realParent = (parentRecord && typeof parentRecord === 'object' && !Array.isArray(parentRecord)) 
      ? parentRecord 
      : ((breakdown && typeof breakdown === 'object' && !Array.isArray(breakdown)) ? breakdown : {});

    breakdown = realBreakdown;
    dropdownOptions = realOptions;
    parentRecord = realParent;
    const parseNum = (val) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    };
    const linkedPhaseId = u.linked_phase || u.phase_id || parentRecord?.phase_id || parentRecord?.linked_phase || '';
    const wfCandidates = (dropdownOptions?.proposal_data_entry || []).filter(p => String(p.id) === String(linkedPhaseId) || String(p.linked_phase) === String(linkedPhaseId) || String(p.phase_id) === String(linkedPhaseId));
    const wfRecord = wfCandidates.find(p => Number(p.water_feature_area_m2 || p.water_feature_area || (Number(p.pool_length_m) * Number(p.pool_width_m))) > 0) || wfCandidates[0] || {};

    const pL = parseNum(u.pool_length_m || parentRecord?.pool_length_m || wfRecord?.pool_length_m);
    const pW = parseNum(u.pool_width_m || parentRecord?.pool_width_m || wfRecord?.pool_width_m);
    const calcAr = (pL > 0 && pW > 0) ? Number((pL * pW).toFixed(2)) : 0;
    const wfAr = parseNum(u.water_feature_area || u.water_feature_area_m2 || parentRecord?.water_feature_area_m2 || parentRecord?.water_feature_area || wfRecord?.water_feature_area_m2) || calcAr || 50;
    const wfDep = parseNum(u.depth_m || parentRecord?.pool_depth_m || wfRecord?.avg_height_m || wfRecord?.water_deep_height_m || 1.4);
    const wfVol = parseNum(u.water_feature_volume || u.water_feature_volume_m3 || parentRecord?.water_feature_volume_m3 || parentRecord?.water_feature_volume || wfRecord?.water_feature_volume_m3) || Number((wfAr * wfDep).toFixed(2)) || 70;
    const wfPer = parseNum(u.water_feature_perimeter || u.water_feature_perimeter_m || parentRecord?.water_feature_perimeter_m || parentRecord?.water_feature_perimeter || wfRecord?.water_feature_perimeter_m) || (pL > 0 && pW > 0 ? Number((2 * (pL + pW)).toFixed(2)) : 30);
    const hasPhase = !!(u.phase_id || u.linked_phase) && String(u.phase_id || u.linked_phase) !== 'UNKNOWN_PHASE';

    // Strict Clean Slate Guard: If no phase is selected and dimensions are 0, return empty BOQ
    if (!hasPhase && wfVol <= 0 && wfAr <= 0 && wfPer <= 0) {
        return [];
    }

    const itemsDb = Array.isArray(dropdownOptions) ? dropdownOptions : getAllItemsDb(dropdownOptions);
    let changed = false;
    let updatedBreakdown = Array.isArray(breakdown) ? [...breakdown] : [];
    const currentPhaseId = u.phase_id || 'UNKNOWN_PHASE';
    if (currentPhaseId !== 'UNKNOWN_PHASE') {
        updatedBreakdown.forEach(item => {
            const sp = String(item._spawnerid || item.rowIdFlag || '');
            if (sp.startsWith('_isEm') && (!item.phase_id || item.phase_id === 'UNKNOWN_PHASE')) {
                item.phase_id = currentPhaseId;
            }
        });
    }
    const activeProposalId = u.project_title || u.proposal_id || u.tender_log_id || '';
    let phaseComponentTarget = 'Water Feature';
    const phaseRecord = dropdownOptions?.phases?.find(p => String(p.id) === String(linkedPhaseId)) || {};
    const catUuid = u.water_feature_category || parentRecord?.water_feature_category || phaseRecord?.water_feature_category || wfRecord?.water_feature_category;
    if (catUuid && dropdownOptions && !Array.isArray(dropdownOptions)) {
        const matchedCat = dropdownOptions.water_feature_category?.find(c => String(c.id).toLowerCase() === String(catUuid).toLowerCase());
        if (matchedCat) {
            phaseComponentTarget = matchedCat.name || matchedCat.category_name || 'Water Feature';
        }
    }
    const resolveItemUuid = (idRaw) => {
        if (!idRaw || !dropdownOptions || Array.isArray(dropdownOptions)) return idRaw;
        const idStr = String(idRaw).trim().toLowerCase();
        
        const tables = [
            'filter_type', 'filter_types', 'filter_pump_types', 'heaters',
            'cable_types', 'cable_glands', 'disconnect_switch_types', 'circulation_accessories',
            'lighting_type', 'transformer_type', 'junction_box', 'main_drain', 'tablet_chlorinator'
        ];
        
        for (const t of tables) {
            const list = dropdownOptions[t];
            if (list && Array.isArray(list)) {
                const found = list.find(row => String(row.id).toLowerCase() === idStr);
                if (found) {
                    const itemId = found.item_id;
                    if (itemId && typeof itemId === 'object') return itemId.id || itemId.value || itemId;
                    if (itemId) return itemId;
                }
            }
        }
        return idRaw;
    };
    const isElecCategory = (cat = '', name = '', rowFlag = '') => {
        const str = `${cat} ${name} ${rowFlag}`.toLowerCase();
        return (
            str.includes('elec') ||
            str.includes('lighting') ||
            str.includes('light') ||
            str.includes('transformer') ||
            str.includes('cable') ||
            str.includes('conduit') ||
            str.includes('tray') ||
            str.includes('containment') ||
            str.includes('earthing') ||
            str.includes('grounding') ||
            str.includes('protection') ||
            str.includes('socket') ||
            str.includes('isolator') ||
            str.includes('disconnect') ||
            str.includes('switch') ||
            str.includes('junction')
        );
    };

    /**
     * Standardized Upsert Wrapper for Electromechanical Items
     */
    const upsertEMRow = (params) => {
        const resolvedSearchKey = resolveItemUuid(params.searchKey);
        const isElec = isElecCategory(params.workMainCategory, params.fallbackName, params.rowIdFlag);
        const resolvedWorkType = params.workType || params.work_type || (isElec ? 'Electrical' : 'Mechanical');
        const res = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId,
            proposalId: activeProposalId,
            phaseComponent: params.phaseComponent || phaseComponentTarget,
            itemsDb,
            responsibility: params.responsibility || 'P.Zone',
            activityType: params.activityType || 'Procurement',
            ...params,
            workType: resolvedWorkType,
            work_type: resolvedWorkType,
            searchKey: resolvedSearchKey
        });
        if (res.changed) changed = true;
    };

    const isHdpeActive = (u.piping_material_system || u.mechanical_networks_type || '').toLowerCase().includes('hdpe');

    // =========================================================================
    // 1. PUMPS & FILTRATION EQUIPMENT
    // =========================================================================
    
    // 1. Sand Filter
    const filterId = u.water_filter_code || u.preferred_water_filter;
    const filterQty = parseNum(u.no_of_water_filter);
    if (filterId && filterQty > 0) {
        upsertEMRow({
            workMainCategory: 'Water Filter',
            searchKey: filterId,
            fallbackName: 'Sand Filter',
            baseQty: filterQty,
            rowIdFlag: '_isEmSandFilterAuto'
        });
    }

    // 2. Vacuum Filter
    const vacFilterId = u.vacuum_filter_code;
    const vacFilterQty = parseNum(u.no_of_vacuum_filter);
    if (vacFilterId && vacFilterQty > 0) {
        upsertEMRow({
            workMainCategory: 'Vacuum Filter',
            searchKey: vacFilterId,
            fallbackName: 'Vacuum Filter',
            baseQty: vacFilterQty,
            rowIdFlag: '_isEmVacuumFilterAuto'
        });
    }

    // 3. GRP Box (For Skimfilters)
    const filtrationMethod = String(
        u.water_filtration_method || 
        phaseRecord?.method_of_water_filtration || 
        wfRecord?.method_of_water_filtration || 
        u.method_of_water_filtration || 
        ''
    );
    const isSkimfilter = filtrationMethod === '4ec9604f-02b4-4540-8e1d-10c95b9f3652';
    const grpBoxQty = isSkimfilter ? parseNum(u.no_of_water_filter) : 0;
    if (grpBoxQty > 0) {
        upsertEMRow({
            workMainCategory: 'Drainage Chamber',
            searchKey: '9f38b69e-4ee2-4717-aacc-1762912d5772',
            fallbackName: 'GRP Box',
            baseQty: grpBoxQty,
            rowIdFlag: '_isEmGrpBoxAuto'
        });
    }

    // 4. Circulation (Filtration) Pump
    const filterPumpId = u.water_filter_pump_code || u.preferred_water_filter_pump || u.water_filter_pump;
    const filterPumpQty = parseNum(u.total_no_of_water_filter_pumps) || 
                          parseNum(u.no_of_filtration_pump_required) || 
                          (parseNum(u.no_of_water_filter_pump) + parseNum(u.no_of_water_filter_pump_stand_by));
    if (filterPumpId && filterPumpQty > 0) {
        upsertEMRow({
            workMainCategory: 'Water Filtration Pump',
            searchKey: filterPumpId,
            fallbackName: 'Circulation Pump',
            baseQty: filterPumpQty,
            rowIdFlag: '_isEmFilterPumpAuto'
        });
    }

    // 5. Vacuum Pump
    const vacuumPumpId = u.vacuum_filter_pump_code;
    const vacuumPumpQty = parseNum(u.no_of_vacuum_filter_pump) + parseNum(u.no_of_vacuum_filter_pump_stand_by);
    if (vacuumPumpId && vacuumPumpQty > 0) {
        upsertEMRow({
            workMainCategory: 'Vacuum Filtration Pump',
            searchKey: vacuumPumpId,
            fallbackName: 'Vacuum Pump',
            baseQty: vacuumPumpQty,
            rowIdFlag: '_isEmVacuumPumpAuto'
        });
    }

    // 6. Submersible Drainage Pump
    const submersiblePumpId = u.submersible_pump_code;
    const submersiblePumpQty = parseNum(u.no_of_submersible_pump) || parseNum(u.submersible_pump_qty);
    if (submersiblePumpId && submersiblePumpQty > 0) {
        upsertEMRow({
            workMainCategory: 'Submersible Pumps',
            searchKey: submersiblePumpId,
            fallbackName: 'Submersible Pump',
            baseQty: submersiblePumpQty,
            rowIdFlag: '_isEmSubmersiblePumpAuto'
        });
    }

    // =========================================================================
    // 2. RECIRCULATION ACCESSORIES & SHELL FITTINGS
    // =========================================================================
    
    // 10. Skimmers
    const skimmerId = u.skimmer_type;
    const skimmerQty = parseNum(u.no_of_skimmer);
    if (skimmerId && skimmerQty > 0) {
        upsertEMRow({
            workMainCategory: 'Skimmer',
            searchKey: skimmerId,
            fallbackName: 'Skimmer',
            baseQty: skimmerQty,
            rowIdFlag: '_isEmSkimmerAuto'
        });
    }

    // 11. Floor Inlets
    const floorInletId = u.floor_inlets_type;
    const floorInletQty = parseNum(u.no_of_floor_inlets);
    if (floorInletId && floorInletQty > 0) {
        upsertEMRow({
            workMainCategory: 'Floor Inlets',
            searchKey: floorInletId,
            fallbackName: 'Floor Inlet',
            baseQty: floorInletQty,
            rowIdFlag: '_isEmFloorInletAuto'
        });
    }

    // 12. Wall Inlets
    const wallInletId = u.wall_inlets_type;
    const wallInletQty = parseNum(u.no_of_wall_inlets);
    if (wallInletId && wallInletQty > 0) {
        upsertEMRow({
            workMainCategory: 'Wall Inlets',
            searchKey: wallInletId,
            fallbackName: 'Wall Inlet',
            baseQty: wallInletQty,
            rowIdFlag: '_isEmWallInletAuto'
        });
    }

    // 13. Vacuum Inlets
    const vacuumInletId = u.vacuum_inlets_type;
    const vacuumInletQty = parseNum(u.no_of_vacuum_inlets);
    if (vacuumInletId && vacuumInletQty > 0) {
        upsertEMRow({
            workMainCategory: 'Vacuum Points',
            searchKey: vacuumInletId,
            fallbackName: 'Vacuum Inlet',
            baseQty: vacuumInletQty,
            rowIdFlag: '_isEmVacuumInletAuto'
        });
    }

    // 14. Main Drain
    const mainDrainId = u.main_drain_type;
    const mainDrainQty = parseNum(u.no_of_main_drain);
    if (mainDrainId && mainDrainQty > 0) {
        upsertEMRow({
            workMainCategory: 'Main Drain',
            searchKey: mainDrainId,
            fallbackName: 'Main Drain',
            baseQty: mainDrainQty,
            rowIdFlag: '_isEmMainDrainAuto'
        });
    }

    // 15. Gutter Drain
    const gutterDrainId = u.gutter_drain_type;
    const gutterDrainQty = parseNum(u.no_of_gutter_drain);
    if (gutterDrainId && gutterDrainQty > 0) {
        upsertEMRow({
            workMainCategory: 'Gutter Drain',
            searchKey: gutterDrainId,
            fallbackName: 'Gutter Drain',
            baseQty: gutterDrainQty,
            rowIdFlag: '_isEmGutterDrainAuto'
        });
    }

    // =========================================================================
    // 3. CHEMICAL DOSING & MIXING SYSTEMS
    // =========================================================================
    
    // 7. Dosing Pump (Active ONLY when Dosing Pump architecture is chosen)
    if (String(u.type_of_chlorinator_system) === 'Dosing Pump') {
        const dosingPumpId = u.dosing_pump_type || u.chemical_feeder_code || '34681aa7-c226-4ef8-9f86-aadf236159a7';
        const dosingPumpQty = parseNum(u.chemical_feeder_qty) || parseNum(u.no_of_dosing_pump) || 2;
        if (dosingPumpId && dosingPumpQty > 0) {
            upsertEMRow({
                workMainCategory: 'Chemical Dosing System',
                searchKey: dosingPumpId,
                fallbackName: 'Dosing Pump',
                baseQty: dosingPumpQty,
                rowIdFlag: '_isEmDosingPumpAuto'
            });
        }

        // 7. Electrical Stirrer
        const stirrerId = u.electrical_stirrer_type || 'bbecbd5a-6c54-40b3-97db-48bbd1599b0e';
        const stirrerQty = parseNum(u.no_of_electrical_stirrer) || parseNum(u.no_of_stirrer) || 2;
        if (stirrerId && stirrerQty > 0) {
            upsertEMRow({
                workMainCategory: 'Chemical Dosing System',
                searchKey: stirrerId,
                fallbackName: 'Electrical Stirrer',
                baseQty: stirrerQty,
                rowIdFlag: '_isEmStirrerAuto'
            });
        }

        // 7. Mixing Tank
        const mixingTankId = u.mixing_tank_capacity || '82639f46-6af2-4dd6-9302-0e86e5d8b637';
        const mixingTankQty = parseNum(u.no_of_mixing_tank) || 2;
        if (mixingTankId && mixingTankQty > 0) {
            upsertEMRow({
                workMainCategory: 'Chemical Dosing System',
                searchKey: mixingTankId,
                fallbackName: 'Mixing Tank',
                baseQty: mixingTankQty,
                rowIdFlag: '_isEmMixingTankAuto'
            });
        }
    } else {
        // 8. Tablet Chlorinator (Active ONLY when Chlorinator Tablet architecture is chosen)
        const tabletId = u.tablet_chlorinator_type;
        const tabletQty = parseNum(u.tablet_chlorinator_quantity);
        if (tabletId && tabletQty > 0) {
            upsertEMRow({
                workMainCategory: 'Tablet Chlorinator',
                searchKey: tabletId,
                fallbackName: 'Tablet Chlorinator',
                baseQty: tabletQty,
                rowIdFlag: '_isEmTabletChlorinatorAuto'
            });
        }
    }

    // 22. Manual Cleaning Set (Single Consolidated Item from Items Database)
    const cleanSets = parseNum(u.no_of_manual_cleaning_set) || (parseNum(u.water_feature_area || u.water_feature_area_m2) > 0 ? Math.max(1, Math.ceil(parseNum(u.water_feature_area || u.water_feature_area_m2) / 500)) : 1);
    if (cleanSets > 0) {
        upsertEMRow({
            workMainCategory: 'Manual Cleaning Set',
            workType: 'Mechanical',
            searchKey: u.manual_cleaning_set_type || '8f8944f3-ffe0-44ed-91da-4c935b2351f8',
            fallbackName: 'Manual Cleaning Set',
            unit: 'Set',
            baseQty: cleanSets,
            rowIdFlag: '_isEmManualCleaningSetAuto'
        });
    }

    // 21. Drainage Chamber (2m x 2m x 2m)
    const chamberQty = parseNum(u.drainage_chamber);
    if (chamberQty > 0) {
        upsertEMRow({
            workMainCategory: 'Drainage Chamber',
            searchKey: 'f58445a6-a44c-4233-960c-528041dfc2dc',
            fallbackName: 'Drainage Chamber 2m x 2m x 2m',
            baseQty: chamberQty,
            rowIdFlag: '_isEmDrainageChamberAuto'
        });
    }

    // =========================================================================
    // 4. HEATING SYSTEM
    // =========================================================================
    const heaterId = u.recommended_heater_model || u.heater_type;
    const heaterQty = parseNum(u.no_of_heaters) || parseNum(u.heater_qty) || 0;
    if (heaterId && heaterQty > 0) {
        upsertEMRow({
            workMainCategory: 'Heating System',
            searchKey: heaterId,
            fallbackName: 'Electric/Gas Heater',
            baseQty: heaterQty,
            rowIdFlag: '_isEmHeaterAuto'
        });
    } else {
        // Explicitly remove previously generated heater item if heating is cleared or zero
        for (let i = updatedBreakdown.length - 1; i >= 0; i--) {
            const itm = updatedBreakdown[i];
            const phaseMatch = currentPhaseId === 'UNKNOWN_PHASE' || !itm.phase_id || String(itm.phase_id || '').toLowerCase() === String(currentPhaseId || '').toLowerCase();
            if (phaseMatch && (itm._spawnerid === '_isEmHeaterAuto' || itm.rowIdFlag === '_isEmHeaterAuto' || itm.work_main_category === 'Heating System' || String(itm.item || '').toLowerCase().includes('heater'))) {
                updatedBreakdown.splice(i, 1);
                changed = true;
            }
        }
    }

    // =========================================================================
    // 5. PIPING NETWORKS (UPVC & HDPE)
    // =========================================================================
    
    // 18. UPVC Pipes (Main Pool Network)
    const sizes = ['63mm', '75mm', '90mm', '110mm', '160mm', '200mm', '250mm', '315mm'];
    sizes.forEach(size => {
        const pipeKey = `upvc_pipe_${size}`;
        const pipeQty = parseNum(u[pipeKey]);
        if (pipeQty > 0) {
            upsertEMRow({
                workMainCategory: 'Water Feature UPVC Pipes, Fittings & Valves',
                searchKey: `UPVC Pipes Ø${size.replace('mm', '')} mm Brand: Misr Al Nour`,
                fallbackName: `UPVC Pipes Ø${size}`,
                baseQty: pipeQty,
                rowIdFlag: `_isEmUpvcPipe_${size}_Auto`
            });
        }
    });

    // 19. HDPE Pipes (Underground Mains)
    const hdpeSizes = ['63mm', '75mm', '90mm', '110mm', '160mm', '200mm'];
    hdpeSizes.forEach(size => {
        const pipeKey = `hdpe_pipe_${size}`;
        const pipeQty = parseNum(u[pipeKey]);
        if (pipeQty > 0) {
            upsertEMRow({
                workMainCategory: 'Water Feature HDPE Pipes, Fittings & Valves',
                searchKey: `HDPE pipes Ø ${size.replace('mm', '')} mm Brand: Red Sea`,
                fallbackName: `HDPE pipes Ø ${size}`,
                baseQty: pipeQty,
                rowIdFlag: `_isEmHdpePipe_${size}_Auto`
            });
        }
    });

    // 20. Pump Room UPVC Pipes
    const prUpvcSizes = ['63mm', '75mm', '90mm', '110mm', '160mm', '200mm', '250mm', '315mm'];
    prUpvcSizes.forEach(size => {
        const pipeKey = `pump_room_upvc_pipe_${size}`;
        const pipeQty = parseNum(u[pipeKey]);
        if (pipeQty > 0) {
            upsertEMRow({
                workMainCategory: 'Pump Room UPVC Pipes, Fittings & Valves',
                searchKey: `UPVC Pipes Ø${size.replace('mm', '')} mm Brand: Misr Al Nour`,
                fallbackName: `Pump Room UPVC Pipe Ø${size}`,
                baseQty: pipeQty,
                rowIdFlag: `_isEmPrUpvcPipe_${size}_Auto`
            });
        }
    });

    // UPVC Bush Reducers
    const upvcReducers = [
        { key: 'upvc_reducer_7563mm', size: '75/63 mm' },
        { key: 'upvc_reducer_9075mm', size: '90/75 mm' },
        { key: 'upvc_reducer_11063mm', size: '110/63 mm' },
        { key: 'upvc_reducer_11075mm', size: '110/75 mm' },
        { key: 'upvc_reducer_11090mm', size: '110/90 mm' },
        { key: 'upvc_reducer_110160mm', size: '160/110 mm' },
        { key: 'upvc_reducer_200160mm', size: '200/160 mm' },
        { key: 'upvc_reducer_250200mm', size: '250/200 mm' },
        { key: 'upvc_reducer_315250mm', size: '315/250 mm' }
    ];
    upvcReducers.forEach(red => {
        const redQty = parseNum(u[red.key]);
        if (redQty > 0) {
            upsertEMRow({
                workMainCategory: 'Water Feature UPVC Pipes, Fittings & Valves',
                searchKey: `UPVC Bush ${red.size} Brand: Comer`,
                fallbackName: `UPVC Bush ${red.size}`,
                baseQty: redQty,
                rowIdFlag: `_isEmUpvcRed_${red.key}_Auto`
            });
        }
    });

    // HDPE Bush Reducers (Only when HDPE is active)
    if (isHdpeActive) {
        const hdpeReducers = [
            { key: 'hdpe_reducer_7563mm', size: '75/63 mm' },
            { key: 'hdpe_reducer_9075mm', size: '90/75 mm' },
            { key: 'hdpe_reducer_11063mm', size: '110/63 mm' },
            { key: 'hdpe_reducer_11075mm', size: '110/75 mm' },
            { key: 'hdpe_reducer_11090mm', size: '110/90 mm' },
            { key: 'hdpe_reducer_110160mm', size: '160/110 mm' },
            { key: 'hdpe_reducer_200160mm', size: '200/160 mm' }
        ];
        hdpeReducers.forEach(red => {
            const redQty = parseNum(u[red.key]);
            if (redQty > 0) {
                upsertEMRow({
                    workMainCategory: 'Water Feature HDPE Pipes, Fittings & Valves',
                    searchKey: `HDPE Bush ${red.size} Brand: Red Sea`,
                    fallbackName: `HDPE Bush ${red.size}`,
                    baseQty: redQty,
                    rowIdFlag: `_isEmHdpeRed_${red.key}_Auto`
                });
            }
        });
    }

    // UPVC Tees
    sizes.forEach(size => {
        const teeKey = `upvc_tee_${size}`;
        const teeQty = parseNum(u[teeKey]);
        if (teeQty > 0) {
            upsertEMRow({
                workMainCategory: 'Water Feature UPVC Pipes, Fittings & Valves',
                searchKey: `UPVC TEE Ø ${size.replace('mm', '')} mm Brand: Comer`,
                fallbackName: `UPVC Tee Ø ${size}`,
                baseQty: teeQty,
                rowIdFlag: `_isEmUpvcTee_${size}_Auto`
            });
        }
    });

    // HDPE Tees (Only when HDPE is active)
    if (isHdpeActive) {
        hdpeSizes.forEach(size => {
            const teeKey = `hdpe_tee_${size}`;
            const teeQty = parseNum(u[teeKey]);
            if (teeQty > 0) {
                upsertEMRow({
                    workMainCategory: 'Water Feature HDPE Pipes, Fittings & Valves',
                    searchKey: `HDPE Tee Ø ${size.replace('mm', '')} mm Brand: Red Sea`,
                    fallbackName: `HDPE Tee Ø ${size}`,
                    baseQty: teeQty,
                    rowIdFlag: `_isEmHdpeTee_${size}_Auto`
                });
            }
        });
    }

    // UPVC Elbows 90°
    sizes.forEach(size => {
        const elbowKey = `upvc_elbow_90_degree_${size}`;
        const elbowQty = parseNum(u[elbowKey]);
        if (elbowQty > 0) {
            upsertEMRow({
                workMainCategory: 'Water Feature UPVC Pipes, Fittings & Valves',
                searchKey: `UPVC Elbow Ø ${size.replace('mm', '')} mm ^ 90⁰ Brand: Comer`,
                fallbackName: `UPVC Elbow 90⁰ Ø ${size}`,
                baseQty: elbowQty,
                rowIdFlag: `_isEmUpvcElbow_${size}_Auto`
            });
        }
    });

    // UPVC Elbows 45°
    const upvcElbow45Map = {
        '63mm': 'df376d89-f89e-4423-b8bd-93b094308083',
        '75mm': 'e38e679e-59f6-4dc3-bf50-4670fd899d1c',
        '90mm': 'd597853a-2fcd-4413-8807-9d78f44a7eb7',
        '110mm': 'f43f995d-bcb6-4998-a8a6-3844c83a4b99',
        '160mm': 'f43f995d-bcb6-4998-a8a6-3844c83a4b99',
        '200mm': 'f43f995d-bcb6-4998-a8a6-3844c83a4b99',
        '250mm': 'f43f995d-bcb6-4998-a8a6-3844c83a4b99',
        '315mm': 'f43f995d-bcb6-4998-a8a6-3844c83a4b99'
    };
    sizes.forEach(size => {
        const elbowKey = `upvc_elbow_45_degree_${size}`;
        const elbowQty = parseNum(u[elbowKey]);
        if (elbowQty > 0) {
            upsertEMRow({
                workMainCategory: 'Water Feature UPVC Pipes, Fittings & Valves',
                searchKey: upvcElbow45Map[size] || `UPVC Elbow Ø ${size.replace('mm', '')} mm ^ 45⁰ Brand: Comer`,
                fallbackName: `UPVC Elbow 45⁰ Ø ${size}`,
                baseQty: elbowQty,
                rowIdFlag: `_isEmUpvcElbow45_${size}_Auto`
            });
        }
    });

    // UPVC Flanges & Stubs
    const upvcFlangeMap = {
        '63mm': '313b6bca-6542-4f5e-991b-4e0d509ca0dd',
        '75mm': '313b6bca-6542-4f5e-991b-4e0d509ca0dd',
        '90mm': '3a4db03f-251b-4982-a9f6-c649bb0017bb',
        '110mm': 'db13819f-1489-4082-8d1b-42e560bf080c',
        '160mm': '8b71097b-9e54-48c6-a572-bcf24a51398b',
        '200mm': '8b71097b-9e54-48c6-a572-bcf24a51398b',
        '250mm': '8b71097b-9e54-48c6-a572-bcf24a51398b',
        '315mm': '8b71097b-9e54-48c6-a572-bcf24a51398b'
    };
    sizes.forEach(size => {
        const flangeKey = `upvc_flange_${size}`;
        const flangeQty = parseNum(u[flangeKey]);
        if (flangeQty > 0) {
            upsertEMRow({
                workMainCategory: 'Water Feature UPVC Pipes, Fittings & Valves',
                searchKey: upvcFlangeMap[size] || `UPVC Flange and Stub serrated Ø${size.replace('mm', '')} mm Brand:Comer`,
                fallbackName: `UPVC Flange and Stub Ø ${size}`,
                baseQty: flangeQty,
                rowIdFlag: `_isEmUpvcFlange_${size}_Auto`
            });
        }
    });

    // HDPE Elbows 90° (Only when HDPE is active)
    if (isHdpeActive) {
        hdpeSizes.forEach(size => {
            const elbowKey = `hdpe_elbow_90_degree_${size}`;
            const elbowQty = parseNum(u[elbowKey]);
            if (elbowQty > 0) {
                upsertEMRow({
                    workMainCategory: 'Water Feature HDPE Pipes, Fittings & Valves',
                    searchKey: `HDPE Elbow Ø ${size.replace('mm', '')} mm ^ 90⁰ Brand: Red Sea`,
                    fallbackName: `HDPE Elbow 90⁰ Ø ${size}`,
                    baseQty: elbowQty,
                    rowIdFlag: `_isEmHdpeElbow_${size}_Auto`
                });
            }
        });

        // HDPE Elbows 45° (Only when HDPE is active)
        const hdpeElbow45Map = {
            '63mm': 'e25ea146-f60d-492c-b753-b1aa32a02ba9',
            '75mm': 'e25ea146-f60d-492c-b753-b1aa32a02ba9',
            '90mm': 'e25ea146-f60d-492c-b753-b1aa32a02ba9',
            '110mm': '7e8773dd-e662-4f34-8431-688283074ae4',
            '160mm': '04446efa-924d-421a-84ff-cd20b5ce7682',
            '200mm': '04446efa-924d-421a-84ff-cd20b5ce7682'
        };
        hdpeSizes.forEach(size => {
            const elbowKey = `hdpe_elbow_45_degree_${size}`;
            const elbowQty = parseNum(u[elbowKey]);
            if (elbowQty > 0) {
                upsertEMRow({
                    workMainCategory: 'Water Feature HDPE Pipes, Fittings & Valves',
                    searchKey: hdpeElbow45Map[size] || `HDPE Elbow Ø ${size.replace('mm', '')} mm ^ 45⁰ Brand: Red Sea`,
                    fallbackName: `HDPE Elbow 45⁰ Ø ${size}`,
                    baseQty: elbowQty,
                    rowIdFlag: `_isEmHdpeElbow45_${size}_Auto`
                });
            }
        });

        // HDPE Flanges & Stubs (Only when HDPE is active)
        const hdpeFlangeMap = {
            '63mm': '99abe80c-82e9-497c-b0fa-d07515570cc2',
            '75mm': '99abe80c-82e9-497c-b0fa-d07515570cc2',
            '90mm': 'c7d59662-5f27-40ff-9fcf-06d213f76baa',
            '110mm': '99e86aee-6163-45ff-9aac-6b65cfd32c4c',
            '160mm': '2377e2de-01c9-4772-a5d3-fd42b2f724fa',
            '200mm': 'e8393c64-58bd-47de-b132-c4769db2ccc9'
        };
        hdpeSizes.forEach(size => {
            const flangeKey = `hdpe_flange_${size}`;
            const flangeQty = parseNum(u[flangeKey]);
            if (flangeQty > 0) {
                upsertEMRow({
                    workMainCategory: 'Water Feature HDPE Pipes, Fittings & Valves',
                    searchKey: hdpeFlangeMap[size] || `HDPE Flange and Stub serrated Ø${size.replace('mm', '')} mm Brand: Red Sea`,
                    fallbackName: `HDPE Flange and Stub Ø ${size}`,
                    baseQty: flangeQty,
                    rowIdFlag: `_isEmHdpeFlange_${size}_Auto`
                });
            }
        });
    }

    // =========================================================================
    // 6. VALVES (SOLENOID, FLOAT, BALL, CHECK)
    // =========================================================================
    
    // 16. Solenoid Makeup Valves
    const solenoidId = u.solenoid_valve_type;
    const solenoidQty = parseNum(u.no_of_selnoid_valve);
    if (solenoidId && solenoidQty > 0) {
        upsertEMRow({
            workMainCategory: 'Automatic Makeup System',
            searchKey: solenoidId,
            fallbackName: 'Solenoid Valve',
            baseQty: solenoidQty,
            rowIdFlag: '_isEmSolenoidValveAuto'
        });
    }

    // 16. Float Valves
    const floatQty = parseNum(u.no_of_float_valve);
    if (floatQty > 0) {
        upsertEMRow({
            workMainCategory: 'Automatic Makeup System',
            searchKey: 'efe4f242-4cb2-4084-916f-4e9b1aa3ecb6',
            fallbackName: 'Float Valve',
            baseQty: floatQty,
            rowIdFlag: '_isEmFloatValveAuto'
        });
    }

    // 16. Float Switches
    const floatSwitchQty = parseNum(u.no_of_float_switch);
    if (floatSwitchQty > 0) {
        upsertEMRow({
            workMainCategory: 'Automatic Makeup System',
            searchKey: 'f594f461-16d5-4233-9ff1-89a996f2df27',
            fallbackName: 'Float Switch Brand: FAES',
            baseQty: floatSwitchQty,
            rowIdFlag: '_isEmFloatSwitchAuto'
        });
    }

    // 17. Non-Return (Check) Valves
    const checkValves = [
        { key: 'check_valve_63mm', size: '63 mm', search: 'Non Return Valve 63 mm Brand Comer' },
        { key: 'check_valve_75mm', size: '75 mm', search: 'Non Return Valve 75 mm Brand Comer' },
        { key: 'check_valve_90mm', size: '90 mm', search: 'Non Return Valve 90 mm Brand: Comer' },
        { key: 'check_valve_110mm', size: '110 mm', search: 'Non Return Valve 110 mm Brand: Comer' },
        { key: 'check_valve_160mm', size: '160 mm', search: 'Non Return Valve 160 mm Brand: Comer' },
        { key: 'check_valve_200mm', size: '200 mm', search: 'Non Return Valve 200 mm Brand: Comer' }
    ];
    checkValves.forEach(cv => {
        const cvQty = parseNum(u[cv.key]);
        if (cvQty > 0) {
            upsertEMRow({
                workMainCategory: 'Pump Room UPVC Pipes, Fittings & Valves',
                searchKey: cv.search,
                fallbackName: `Non Return Valve ${cv.size}`,
                baseQty: cvQty,
                rowIdFlag: `_isEmCheckValve_${cv.key}_Auto`
            });
        }
    });

    // 17. Pump Room Double Union Ball Valves
    sizes.forEach(size => {
        const valveKey = `pump_room_ball_valve_${size}`;
        const valveQty = parseNum(u[valveKey]);
        if (valveQty > 0) {
            upsertEMRow({
                workMainCategory: 'Pump Room UPVC Pipes, Fittings & Valves',
                searchKey: `Ball Valve ${size.replace('mm', '')} mm Brand: Comer`,
                fallbackName: `Ball Valve Ø ${size}`,
                baseQty: valveQty,
                rowIdFlag: `_isEmPrBallValve_${size}_Auto`
            });
        }
    });

    // =========================================================================
    // 7. UNDERWATER LIGHTING & TRANSFORMERS
    // =========================================================================
    
    // 25. Underwater LED Lights
    const lightId = u.underwater_light_type || u.water_feature_lighting_code;
    const lightQty = parseNum(u.qty_lights) || parseNum(u.no_of_water_feature_lighting);
    if (lightId && lightQty > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: lightId,
            fallbackName: 'Underwater LED Light',
            baseQty: lightQty,
            rowIdFlag: '_isEmLightAuto'
        });
    }

    // 25. Water Feature Lighting Backbox
    const backboxId = u.water_feature_lighting_backbox;
    const backboxQty = parseNum(u.qty_lights) || parseNum(u.no_of_water_feature_lighting);
    if (backboxId && backboxQty > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: backboxId,
            fallbackName: 'Water Feature Lighting Backbox',
            baseQty: backboxQty,
            rowIdFlag: '_isEmLightBackboxAuto'
        });
    }

    // 25. Deck Junction Box
    const jBoxId = u.junction_box_type;
    const jBoxQty = parseNum(u.junction_box_qty);
    if (jBoxId && jBoxQty > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: jBoxId,
            fallbackName: 'Junction Box',
            baseQty: jBoxQty,
            rowIdFlag: '_isEmJBoxAuto'
        });
    }

    // 25. Submersible Electric Cable
    const cableId = u.recommended_electric_cable_type || '870785ee-c1e4-4f2b-8233-bf662ce78dd1';
    const cableLen = parseNum(u.total_electric_cable_lengths) || (lightQty * 5);
    if (cableLen > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: cableId,
            fallbackName: 'Submersible Electric Cable',
            baseQty: cableLen,
            rowIdFlag: '_isEmElectricCableAuto'
        });
    }

    // 25. Submersible Cable Glands
    const glandId = u.recommended_electric_cable_gland || '73e5eca3-396a-4318-a30b-cbbcc4a8f84a';
    const glandQty = parseNum(u.electric_cable_gland_quantity) || lightQty;
    if (glandQty > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: glandId,
            fallbackName: 'Cable Gland',
            baseQty: glandQty,
            rowIdFlag: '_isEmCableGlandAuto'
        });
    }

    // 25. Protective Main Conduit
    const protectiveConduitId = u.protective_conduit || '3906d89e-476f-450d-be1b-90ce73a60906';
    const protectiveConduitLen = parseNum(u.total_protective_conduit_length) || (lightQty * 5);
    if (protectiveConduitLen > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: protectiveConduitId,
            fallbackName: 'Protective Main Conduit',
            baseQty: protectiveConduitLen,
            rowIdFlag: '_isEmProtectiveConduitAuto'
        });
    }

    // 25. Flexible Main Conduits
    const conduitId = u.recommended_main_conduit_type || '65e37519-39a2-49cf-97e3-0e791084ca45';
    const conduitLen = parseNum(u.total_main_conduit_lengths) || (lightQty * 10);
    if (conduitLen > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: conduitId,
            fallbackName: 'Flexible Main Conduit',
            baseQty: conduitLen,
            rowIdFlag: '_isEmMainConduitAuto'
        });
    }

    // 25. Main Conduit Adapters
    const adapterId = u.main_conduit_adapter_type || '752fdb9d-a15b-465d-8155-3f6462d07e8e';
    const adapterQty = parseNum(u.total_main_conduit_adapter_qty) || (lightQty * 2);
    if (adapterQty > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: adapterId,
            fallbackName: 'Conduit Adapter',
            baseQty: adapterQty,
            rowIdFlag: '_isEmMainConduitAdapterAuto'
        });
    }

    // 25. Safety Transformers
    const transId = u.transformer_type || '53a11bd5-942b-476b-becc-9c6d776e8ae7';
    const transQty = parseNum(u.transformer_qty) || Math.max(1, Math.ceil((lightQty * 35) / 320));
    if (transQty > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: transId,
            fallbackName: 'Light Transformer 400VA',
            baseQty: transQty,
            rowIdFlag: '_isEmTransformerAuto'
        });
    }

    // 25. Transformer Junction Box
    const transJBoxId = u.transformer_junction_box_type || '2fa433ef-4814-458b-8ff5-137d1c2b1ff4';
    const transJBoxQty = parseNum(u.transformer_junction_box_qty) || transQty;
    if (transJBoxQty > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: transJBoxId,
            fallbackName: 'Transformer Junction Box',
            baseQty: transJBoxQty,
            rowIdFlag: '_isEmTransJBoxAuto'
        });
    }

    // 25. Transformer Primary Feeding Cable
    const feedingCableId = u.transfomer_feeding_cable_type || u.transformer_feeding_cable_type || '9a8108d6-98d6-4fdb-8a43-992ae321f6df';
    const feedingCableLen = parseNum(u.transfomer_feeding_cable_length || u.transformer_feeding_cable_length_m) || (transQty * 30);
    if (feedingCableLen > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: feedingCableId,
            fallbackName: 'Transformer Primary Feeding Cable',
            baseQty: feedingCableLen,
            rowIdFlag: '_isEmFeedingCableAuto'
        });
    }

    // 25. Transformer Secondary Output Cable
    const outputCableId = u.transformer_output_cable_type || '64363bdb-ba97-4f54-8a39-8d4d4c256615';
    const outputCableLen = parseNum(u.transfomer_output_cable_length || u.transformer_output_cable_conduit_length_m) || ((30 * transQty) + (5 * lightQty));
    if (outputCableLen > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Lighting',
            searchKey: outputCableId,
            fallbackName: 'Transformer Secondary Output Cable',
            baseQty: outputCableLen,
            rowIdFlag: '_isEmOutputCableAuto'
        });
    }

    // =========================================================================
    // 8. EARTHING & LIGHTNING GROUNDING PROTECTION SYSTEM
    // =========================================================================
    
    // 27. Earthing Electrode Rods
    const rodId = u.earthing_system_rod_type || 'b416f815-ead6-47fc-a3c4-4d7052fd5f91';
    const rodQty = Math.max(2, parseNum(u.no_of_earthing_rods_qty) || parseNum(u.no_of_electrodes_to_reach_required_resistance) || 2);
    upsertEMRow({
        workMainCategory: 'Water Feature Earthing',
        searchKey: rodId,
        fallbackName: 'Copper bonded earth rods 1500X3/4',
        baseQty: rodQty,
        rowIdFlag: '_isEmEarthingRodAuto'
    });

    // 26. Driving Studs 3/4"
    upsertEMRow({
        workMainCategory: 'Water Feature Earthing',
        searchKey: 'b3b0eef8-1349-4a38-87c3-38df3bfb12ce',
        fallbackName: 'Driving Stud 3/4',
        baseQty: parseNum(u.driving_stud_qty) || 1,
        rowIdFlag: '_isEmDrivingStudAuto'
    });

    // 26. Rod Couplers 3/4"
    const couplerQty = parseNum(u.rod_coupler_qty) || Math.max(1, Math.ceil((parseNum(u.no_of_rods_for_one_component || 2) * rodQty) / 2));
    upsertEMRow({
        workMainCategory: 'Water Feature Earthing',
        searchKey: 'b46d3d56-4372-428b-81b3-3611d759ff7b',
        fallbackName: 'Coupler 3/4',
        baseQty: couplerQty,
        rowIdFlag: '_isEmEarthingCouplerAuto'
    });

    // 26. Concrete Earth Inspection Pit
    const earthPitId = u.earth_pit_type || '8e38b15a-d965-4bce-abbb-83d81de39118';
    const earthPitQty = parseNum(u.no_of_earth_pits) || rodQty;
    upsertEMRow({
        workMainCategory: 'Water Feature Earthing',
        searchKey: earthPitId,
        fallbackName: 'Concrete Earth Pit',
        baseQty: earthPitQty,
        rowIdFlag: '_isEmConcreteEarthPitAuto'
    });

    // 26. Cable to Reinforcement Steel Rebar Clamp
    const clampQty = parseNum(u.rebar_clamp_qty) || Math.max(1, Math.ceil((parseNum(u.no_of_rods_for_one_component || 2) * rodQty) / 2));
    upsertEMRow({
        workMainCategory: 'Water Feature Earthing',
        searchKey: 'e258ea1b-dbf5-4021-b4d3-8055c0c6c429',
        fallbackName: 'Cable to reinforcement steel clamp',
        baseQty: clampQty,
        rowIdFlag: '_isEmCableToSteelClampAuto'
    });

    // 26. Cable to Rod Thermo Weld
    const thermoweldQty = parseNum(u.thermoweld_qty) || rodQty;
    upsertEMRow({
        workMainCategory: 'Water Feature Earthing',
        searchKey: '62b7c9c0-3cf3-4733-9163-5599dae81a67',
        fallbackName: 'Cable to Rod Thermo Weld',
        baseQty: thermoweldQty,
        rowIdFlag: '_isEmThermoWeldAuto'
    });

    // 26. 50 mm² Bare Copper Cable = [Phase Title].[Water Feature perimeter (m)]
    const perimeter = Number(u.perimeter_bare_copper_m || u.water_feature_perimeter_m || u.water_feature_perimeter || u.pool_perimeter_m || parentRecord?.water_feature_perimeter_m || 0);
    if (perimeter > 0) {
        upsertEMRow({
            workMainCategory: 'Water Feature Earthing',
            searchKey: '0a9d9810-9499-4df5-b653-851f906a54bb',
            fallbackName: '50 mm2 Bare copper Cable',
            item_name: '50 mm2 Bare copper Cable',
            baseQty: perimeter,
            rowIdFlag: '_isEmBareCopperCableAuto'
        });
    }

    // Prune obsolete duplicate earthing cable flag if present from prior versions
    updatedBreakdown = updatedBreakdown.filter(r => r && r.rowIdFlag !== '_isEmEarthingCableAuto');

    // 28. Main Cable Tray
    const trayId = u.main_cable_tray_type || 'a8b1c9d4-8c88-4a33-95dc-9e56084b3dc0';
    const trayLen = parseNum(u.main_cable_tray_length_m) || 12;
    if (trayLen > 0) {
        upsertEMRow({
            workMainCategory: 'Main Cable Tray',
            searchKey: trayId,
            fallbackName: 'Hot-Dip Galvanized Perforated Cable Tray 100x100mm',
            baseQty: trayLen,
            rowIdFlag: '_isEmCableTrayAuto'
        });
    }

    // 28. Main Cable Tray Splice Plates
    const spQty = parseNum(u.splice_plate_quantity) || 4;
    if (spQty > 0) {
        upsertEMRow({
            workMainCategory: 'Main Cable Tray',
            searchKey: u.splice_plate_type || 'ac7ed164-c456-4f01-8334-a3d5bc4d804c',
            fallbackName: 'Splice Plate for Cable Tray',
            baseQty: spQty,
            rowIdFlag: '_isEmCableTraySplicePlateAuto'
        });
    }

    // 28. Vertical Elbow 90⁰
    const vElbowId = u.main_cable_tray_vertical_elbow_90_type;
    const vElbowQty = parseNum(u.main_cable_tray_vertical_elbow_90_quantity);
    if (vElbowId && vElbowQty > 0) {
        upsertEMRow({
            workMainCategory: 'Main Cable Tray',
            searchKey: vElbowId,
            fallbackName: 'Cable Tray Vertical Elbow 90⁰',
            baseQty: vElbowQty,
            rowIdFlag: '_isEmVElbowAuto'
        });
    }

    // 28. Horizontal Elbow 90⁰
    const hElbowId = u.main_cable_tray_horizontal_elbow_90_type;
    const hElbowQty = parseNum(u.main_cable_tray_horizontal_elbow_90_quantity);
    if (hElbowId && hElbowQty > 0) {
        upsertEMRow({
            workMainCategory: 'Main Cable Tray',
            searchKey: hElbowId,
            fallbackName: 'Cable Tray Horizontal Elbow 90⁰',
            baseQty: hElbowQty,
            rowIdFlag: '_isEmHElbowAuto'
        });
    }

    // 28. End Caps
    const endCapId = u.main_cable_tray_end_cap_type;
    const endCapQty = parseNum(u.end_cap_qty_quantity);
    if (endCapId && endCapQty > 0) {
        upsertEMRow({
            workMainCategory: 'Main Cable Tray',
            searchKey: endCapId,
            fallbackName: 'Cable Tray End Cap',
            baseQty: endCapQty,
            rowIdFlag: '_isEmEndCapAuto'
        });
    }

    // 28. Concrete Anchors
    const anchorId = u.main_cable_tray_anchors_type;
    const anchorQty = parseNum(u.main_cable_tray_anchors_quantity);
    if (anchorId && anchorQty > 0) {
        upsertEMRow({
            workMainCategory: 'Main Cable Tray',
            searchKey: anchorId,
            fallbackName: 'Anchors',
            baseQty: anchorQty,
            rowIdFlag: '_isEmAnchorsAuto'
        });
    }

    // 28. C-Channel Hangers
    const cChannelId = u.main_cable_tray_c_channel_type;
    const cChannelQty = parseNum(u.main_cable_tray_c_channel_quantity);
    if (cChannelId && cChannelQty > 0) {
        upsertEMRow({
            workMainCategory: 'Main Cable Tray',
            searchKey: cChannelId,
            fallbackName: 'C-Channel Hanger Support',
            baseQty: cChannelQty,
            rowIdFlag: '_isEmCChannelAuto'
        });
    }

    // =========================================================================
    // 9. PUMP ROOM LIGHTING, SOCKETS & SAFETY
    // =========================================================================
    
    // 32. Pump Room Lighting Fixtures
    const prLightId = u.pump_room_lighting_type || 'eebc0bd2-37ff-49ef-9d71-bdce4dadbebb';
    const prLightQty = parseNum(u.pump_room_lighting_quantity);
    if (prLightId && prLightQty > 0) {
        upsertEMRow({
            workMainCategory: 'Pump Room Lighting',
            searchKey: prLightId,
            fallbackName: 'GreenPerform Waterproof G3 IP65 LED WT198C',
            baseQty: prLightQty,
            rowIdFlag: '_isEmPrLightAuto'
        });

        // Lighting Power Cable
        const prLightCableId = u.pump_room_lighting_cable_type || '9a8108d6-98d6-4fdb-8a43-992ae321f6df';
        const prLightCableLen = parseNum(u.pump_room_lighting_cable_length_m) || (prLightQty * 8);
        upsertEMRow({
            workMainCategory: 'Pump Room Lighting',
            searchKey: prLightCableId,
            fallbackName: 'Pump Room Lighting Cable 3x2.5mm²',
            baseQty: prLightCableLen,
            rowIdFlag: '_isEmPrLightCableAuto'
        });

        // Lighting Cable Glands
        const prLightGlandQty = parseNum(u.pump_room_lighting_cable_gland_quantity) || (prLightQty * 2);
        upsertEMRow({
            workMainCategory: 'Pump Room Lighting',
            searchKey: '73e5eca3-396a-4318-a30b-cbbcc4a8f84a',
            fallbackName: 'Cable Gland Size 20 S HA2-20 S',
            baseQty: prLightGlandQty,
            rowIdFlag: '_isEmPrLightGlandAuto'
        });

        // Lighting EMT Conduit
        const prLightEmtId = u.pump_room_lighting_cable_conduit_emt_type || '325663e7-139d-4f3c-a291-8452ca523ed3';
        const prLightEmtLen = parseNum(u.pump_room_lighting_cable_emt_conduit_length_m) || (prLightQty * 4);
        upsertEMRow({
            workMainCategory: 'Pump Room Lighting',
            searchKey: prLightEmtId,
            fallbackName: 'EMT Conduit 3/4" (Wheatland)',
            baseQty: prLightEmtLen,
            rowIdFlag: '_isEmPrLightEmtAuto'
        });

        // Lighting EMT Adapters & Couplers & Straps
        const prLightAdapterQty = parseNum(u.pump_room_lighting_emt_conduit_adapter_quantity) || (prLightQty * 2);
        upsertEMRow({
            workMainCategory: 'Pump Room Lighting',
            searchKey: '355786f3-4957-450b-9fa1-e62badd263d0',
            fallbackName: 'Adapter for EMT 3/4"',
            baseQty: prLightAdapterQty,
            rowIdFlag: '_isEmPrLightAdapterAuto'
        });

        const prLightCouplerQty = parseNum(u.pump_room_lighting_emt_conduit_coupler_quantity) || Math.ceil(prLightQty * 4 / 3);
        upsertEMRow({
            workMainCategory: 'Pump Room Lighting',
            searchKey: 'a9ae9651-8222-4458-b9e1-081e284c5652',
            fallbackName: 'Coupler for EMT 3/4"',
            baseQty: prLightCouplerQty,
            rowIdFlag: '_isEmPrLightCouplerAuto'
        });

        const prLightStrapQty = parseNum(u.pump_room_lighting_emt_conduit_strap_quantity) || Math.ceil(prLightQty * 4 / 1.5);
        upsertEMRow({
            workMainCategory: 'Pump Room Lighting',
            searchKey: 'f489563c-5c1f-476d-91d9-f76e35ce007e',
            fallbackName: 'Strap for EMT 3/4"',
            baseQty: prLightStrapQty,
            rowIdFlag: '_isEmPrLightStrapAuto'
        });

        // Watertight Light Switch & Enclosure
        const prSwitchId = u.pump_room_lighting_switch_type || '8cc7cd49-6d9b-490c-ab2e-f902d3122e36';
        const prSwitchQty = parseNum(u.weatherproof_light_switch_qty) || 1;
        upsertEMRow({
            workMainCategory: 'Pump Room Lighting',
            searchKey: prSwitchId,
            fallbackName: 'Watertight Switch 1P 16AX GW20571',
            baseQty: prSwitchQty,
            rowIdFlag: '_isEmPrSwitchAuto'
        });

        const prEnclosureId = u.pump_room_lighting_water_tight_enclosure_type || 'c23c71c4-d5a4-431d-ab30-3bc9bb969964';
        upsertEMRow({
            workMainCategory: 'Pump Room Lighting',
            searchKey: prEnclosureId,
            fallbackName: 'Watertight Enclosure IP65 GW27062',
            baseQty: prSwitchQty,
            rowIdFlag: '_isEmPrEnclosureAuto'
        });
    }

    // 33. Industrial Service Sockets & Electrical Containment
    const socketId = u.service_socket_type || '532885f1-bd29-4eef-98a4-f9af4436d701';
    const socketQty = parseNum(u.service_socket_qty) || 2;
    if (socketId && socketQty > 0) {
        upsertEMRow({
            workMainCategory: 'Service Sockets',
            searchKey: socketId,
            fallbackName: 'Industrial Sockets 2P+E 16A 230V IP67 (GW66004)',
            baseQty: socketQty,
            rowIdFlag: '_isEmSocketAuto'
        });

        // Socket Power Feeding Cable
        const sockCableId = u.service_socket_cable_type || '9a8108d6-98d6-4fdb-8a43-992ae321f6df';
        const sockCableLen = parseNum(u.service_socket_cable_length_m) || (socketQty * 12);
        upsertEMRow({
            workMainCategory: 'Service Sockets',
            searchKey: sockCableId,
            fallbackName: 'Socket Power Cable 3x2.5mm²',
            baseQty: sockCableLen,
            rowIdFlag: '_isEmSocketCableAuto'
        });

        // Socket Cable Glands
        const sockGlandQty = parseNum(u.service_socket_cable_gland_quantity) || (socketQty * 2);
        upsertEMRow({
            workMainCategory: 'Service Sockets',
            searchKey: '73e5eca3-396a-4318-a30b-cbbcc4a8f84a',
            fallbackName: 'Cable Gland Size 20 S HA2-20 S',
            baseQty: sockGlandQty,
            rowIdFlag: '_isEmSocketGlandAuto'
        });

        // Socket EMT Conduit
        const sockEmtId = u.service_socket_cable_conduit_emt_type || '325663e7-139d-4f3c-a291-8452ca523ed3';
        const sockEmtLen = parseNum(u.service_socket_cable_emt_conduit_length_m) || (socketQty * 6);
        upsertEMRow({
            workMainCategory: 'Service Sockets',
            searchKey: sockEmtId,
            fallbackName: 'EMT Conduit 3/4" (Wheatland)',
            baseQty: sockEmtLen,
            rowIdFlag: '_isEmSocketEmtAuto'
        });

        // Socket EMT Adapters & Couplers & Straps
        const sockAdapterQty = parseNum(u.service_socket_emt_conduit_adapter_quantity) || (socketQty * 2);
        upsertEMRow({
            workMainCategory: 'Service Sockets',
            searchKey: '355786f3-4957-450b-9fa1-e62badd263d0',
            fallbackName: 'Adapter for EMT 3/4"',
            baseQty: sockAdapterQty,
            rowIdFlag: '_isEmSocketAdapterAuto'
        });

        const sockCouplerQty = parseNum(u.service_socket_emt_conduit_coupler_quantity) || Math.ceil(socketQty * 6 / 3);
        upsertEMRow({
            workMainCategory: 'Service Sockets',
            searchKey: 'a9ae9651-8222-4458-b9e1-081e284c5652',
            fallbackName: 'Coupler for EMT 3/4"',
            baseQty: sockCouplerQty,
            rowIdFlag: '_isEmSocketCouplerAuto'
        });

        const sockStrapQty = parseNum(u.service_socket_emt_conduit_strap_quantity) || Math.ceil(socketQty * 6 / 1.5);
        upsertEMRow({
            workMainCategory: 'Service Sockets',
            searchKey: 'f489563c-5c1f-476d-91d9-f76e35ce007e',
            fallbackName: 'Strap for EMT 3/4"',
            baseQty: sockStrapQty,
            rowIdFlag: '_isEmSocketStrapAuto'
        });
    }

    // 35. Ventilation Fans
    const fanId = u.pump_room_ventilation_type;
    const fanQty = parseNum(u.no_of_ventilation_fan);
    if (fanId && fanQty > 0) {
        upsertEMRow({
            workMainCategory: 'Ventilation',
            searchKey: fanId,
            fallbackName: 'Ventilation Fan Rosenberg',
            baseQty: fanQty,
            rowIdFlag: '_isEmFanAuto'
        });
    }

    // 36. Fire Extinguishers
    const extId = u.fire_extinguisher_type;
    const extQty = parseNum(u.no_of_fire_extinguisher);
    if (extId && extQty > 0) {
        upsertEMRow({
            workMainCategory: 'Fire Extinguisher',
            searchKey: extId,
            fallbackName: 'Dry Powder Fire Extinguisher 6KG (Naffco)',
            baseQty: extQty,
            rowIdFlag: '_isEmExtAuto'
        });
    }

    // =========================================================================
    // 10. PUMP ELECTRICAL CONNECTION CARDS (Items 29, 30, 31)
    // =========================================================================
    const pumpPrefixes = [
        { prefix: 'filtration_pump', qty: filterPumpQty, pumpId: filterPumpId, name: 'Filtration Pump', defaultCable: '3378ce89-417d-4bd3-adc7-9ba9413553ae', defaultDS: 'fa7cbaaa-3b15-43f2-9cd0-76267473e749' },
        { prefix: 'vacuum_pump', qty: vacuumPumpQty, pumpId: vacuumPumpId, name: 'Vacuum Pump', defaultCable: '475decb5-e92b-4d55-b455-603ecec25095', defaultDS: 'cb9e357d-c7c2-4803-b8ff-a5a17d8a13d9' },
        { prefix: 'submersible_pump', qty: submersiblePumpQty, pumpId: u.submersible_pump_code, name: 'Submersible Pump', defaultCable: '3378ce89-417d-4bd3-adc7-9ba9413553ae', defaultDS: '222ec164-1dae-4cef-a984-fb449450442f' }
    ];
    const defaultCChannelItem = itemsDb.find(item => 
        String(item.item_name || '').toLowerCase().includes('c channel') || 
        String(item.item_name || '').toLowerCase().includes('c-channel')
    )?.id || '262ea9ff-a237-4d75-840b-54c0a0d304ba';

    const filterPumpsDb = Array.isArray(dropdownOptions?.filter_pump_types) ? dropdownOptions.filter_pump_types : [];
    const cablesDb = Array.isArray(dropdownOptions?.cable_types) ? dropdownOptions.cable_types : [];

    const pumpRoomHeight = parseNum(u.pump_room_height_m || u.pump_room_height || 3) || 3;

    pumpPrefixes.forEach(({ prefix, qty, pumpId, name, defaultCable, defaultDS }) => {
        if (qty > 0 && !!pumpId) {
            const categoryName = `${name} Electrical Cable`;
            const altPrefix = prefix === 'filtration_pump' ? 'water_filter_pump' : (prefix === 'vacuum_pump' ? 'vacuum_filter_pump' : 'submersible_pump');
            
            // Helper to get value from either prefix
            const getVal = (suffix) => u[`${prefix}_${suffix}`] || u[`${altPrefix}_${suffix}`];

            // Look up pump spec in filter_pump_types
            const pumpObj = filterPumpsDb.find(p => String(p.id) === String(pumpId) || String(p.item_id) === String(pumpId));
            const dbCable1Id = pumpObj?.elec_cable_1_id || pumpObj?.electric_cable_type_01_id;
            const dbGland1Id = pumpObj?.elec_cable_1_gland || pumpObj?.electric_cable_type_01_gland_id;
            const dbDs1Id = pumpObj?.disconnect_switch_1 || pumpObj?.disconnect_switches_types_one_id;
            const dbBranchTrayId = pumpObj?.branch_tray_id || pumpObj?.branch_cable_tray_type_id;
            const dbElbow90Id = pumpObj?.elbow_90_id || pumpObj?.cable_tray_elbow_90_id;
            const dbSplicePlateId = pumpObj?.splice_plate_id || pumpObj?.splice_plate_type_id;
            const dbCChannelId = pumpObj?.c_channel_id || pumpObj?.c_channel_type_id;
            const dbEndCapId = pumpObj?.end_cap_id || pumpObj?.end_cap_type_id;
            const dbAnchorsId = pumpObj?.anchors_id || pumpObj?.anchors_type_id;
            const dbOffsetTeeId = pumpObj?.offset_tee_id || pumpObj?.offset_tee_type_id;

            // 1. Disconnect Switches 1 & 2
            const rawDs1Id = getVal('disconnect_switches_types_one_id');
            const ds1Id = (rawDs1Id && rawDs1Id !== defaultDS) ? rawDs1Id : (dbDs1Id || rawDs1Id || defaultDS || 'fa7cbaaa-3b15-43f2-9cd0-76267473e749');
            const ds1Qty = parseNum(getVal('disconnect_switches_types_one_quantity') || getVal('disconnect_switches_types_one_quantity_no')) || qty;
            upsertEMRow({
                workMainCategory: categoryName,
                searchKey: ds1Id,
                fallbackName: `${name} Disconnect Switch 1`,
                baseQty: ds1Qty,
                rowIdFlag: `_isEm_${prefix}_ds1_auto`
            });

            const ds2Id = getVal('disconnect_switches_types_two_id') || pumpObj?.disconnect_switch_2;
            const ds2Qty = parseNum(getVal('disconnect_switches_types_two_quantity') || getVal('disconnect_switches_types_two_quantity_no'));
            if (ds2Id && ds2Qty > 0) {
                upsertEMRow({
                    workMainCategory: categoryName,
                    searchKey: ds2Id,
                    fallbackName: `${name} Disconnect Switch 2`,
                    baseQty: ds2Qty,
                    rowIdFlag: `_isEm_${prefix}_ds2_auto`
                });
            }

            // 2. Cables 01 & 02, Glands, Conduits & Fittings
            const rawCable1Id = getVal('electric_cable_type_01_id');
            const cable1Id = (rawCable1Id && rawCable1Id !== defaultCable) ? rawCable1Id : (dbCable1Id || rawCable1Id || defaultCable || '3378ce89-417d-4bd3-adc7-9ba9413553ae');
            const cableObj = cablesDb.find(c => String(c.item_id) === String(cable1Id) || String(c.id) === String(cable1Id));
            const cable1Len = parseNum(getVal('electric_cable_type_01_length') || getVal('electric_cable_type_01_length_m')) || (qty * 30);
            upsertEMRow({
                workMainCategory: categoryName,
                searchKey: cable1Id,
                fallbackName: `${name} Power Cable 01`,
                baseQty: cable1Len,
                rowIdFlag: `_isEm_${prefix}_cable_01_auto`
            });

            const gland1Id = getVal('electric_cable_type_01_gland_id') || dbGland1Id || cableObj?.cable_glands_id || '73e5eca3-396a-4318-a30b-cbbcc4a8f84a';
            const gland1Qty = parseNum(getVal('electric_cable_type_01_gland_quantity') || getVal('electric_cable_type_01_gland_quantity_no')) || (qty * 2);
            upsertEMRow({
                workMainCategory: categoryName,
                searchKey: gland1Id,
                fallbackName: `${name} Gland 01`,
                baseQty: gland1Qty,
                rowIdFlag: `_isEm_${prefix}_gland_01_auto`
            });

            const conduit1Id = getVal('recommended_conduit_for_type_01') || getVal('cable_conduit_liquid_tight_type_01_id') || cableObj?.liquid_tight_conduit_id || '65e37519-39a2-49cf-97e3-0e791084ca45';
            const conduit1Len = parseNum(getVal('conduit_for_cable_type_01_length') || getVal('conduit_for_cable_type_01_length_m') || getVal('electric_cable_type_01_length')) || (qty * 30);
            upsertEMRow({
                workMainCategory: categoryName,
                searchKey: conduit1Id,
                fallbackName: `${name} Conduit 01`,
                baseQty: conduit1Len,
                rowIdFlag: `_isEm_${prefix}_conduit_01_auto`
            });

            const coupler1Id = getVal('recommended_conduit_coupler_for_type_01');
            const coupler1Qty = parseNum(getVal('conduit_coupler_for_type_01_quantity') || getVal('conduit_coupler_for_type_01_quantity_no'));
            if (coupler1Id && coupler1Qty > 0) {
                upsertEMRow({
                    workMainCategory: categoryName,
                    searchKey: coupler1Id,
                    fallbackName: `${name} Conduit Coupler 01`,
                    baseQty: coupler1Qty,
                    rowIdFlag: `_isEm_${prefix}_coupler_01_auto`
                });
            }

            const adapter1Id = getVal('recommended_conduit_adapter_for_type_01') || cableObj?.liquid_tight_conduit_adapter_id || '752fdb9d-a15b-465d-8155-3f6462d07e8e';
            const adapter1Qty = parseNum(getVal('conduit_adapter_for_type_01_quantity') || getVal('conduit_adapter_for_type_01_quantity_no')) || (qty * 2);
            upsertEMRow({
                workMainCategory: categoryName,
                searchKey: adapter1Id,
                fallbackName: `${name} Conduit Adapter 01`,
                baseQty: adapter1Qty,
                rowIdFlag: `_isEm_${prefix}_adapter_01_auto`
            });

            const strap1Id = getVal('recommended_conduit_straps_for_type_01');
            const strap1Qty = parseNum(getVal('conduit_straps_for_type_01_quantity') || getVal('conduit_straps_for_type_01_quantity_no'));
            if (strap1Id && strap1Qty > 0) {
                upsertEMRow({
                    workMainCategory: categoryName,
                    searchKey: strap1Id,
                    fallbackName: `${name} Conduit Strap 01`,
                    baseQty: strap1Qty,
                    rowIdFlag: `_isEm_${prefix}_strap_01_auto`
                });
            }

            // 3. Branch Cable Tray & 90° Elbows
            const branchTrayId = getVal('branch_cable_tray_type_id') || dbBranchTrayId || 'a8b1c9d4-8c88-4a33-95dc-9e56084b3dc0';
            const branchTrayLen = parseNum(getVal('branch_cable_tray_length') || getVal('branch_cable_tray_length_m')) || (isSkimfilter ? 0 : (pumpRoomHeight * qty));
            upsertEMRow({
                workMainCategory: categoryName,
                searchKey: branchTrayId,
                fallbackName: `${name} Branch Cable Tray 100x100mm`,
                baseQty: branchTrayLen,
                rowIdFlag: `_isEm_${prefix}_branch_tray_auto`
            });

            const trayElbowId = getVal('cable_tray_elbow_90_id') || dbElbow90Id || '2dee9412-29e8-473e-9c22-bb3b625161d8';
            const trayElbowQty = parseNum(getVal('cable_tray_elbow_90_quantity') || getVal('cable_tray_elbow_90_quantity_no')) || qty;
            upsertEMRow({
                workMainCategory: categoryName,
                searchKey: trayElbowId,
                fallbackName: `${name} Cable Tray Elbow 90`,
                baseQty: trayElbowQty,
                rowIdFlag: `_isEm_${prefix}_tray_elbow_auto`
            });

            // 4. Support Accessories (Splice Plates, C-Channels, End Caps, Anchors, Offset Tees)
            const spId = getVal('splice_plate_type_id') || dbSplicePlateId || 'ac7ed164-c456-4f01-8334-a3d5bc4d804c';
            const spQty = parseNum(getVal('splice_plate_type_quantity') || getVal('splice_plate_type_quantity_m')) || (qty * 2);
            upsertEMRow({
                workMainCategory: categoryName,
                searchKey: spId,
                fallbackName: `${name} Splice Plate`,
                baseQty: spQty,
                rowIdFlag: `_isEm_${prefix}_splice_plate_auto`
            });

            const ccId = getVal('c_channel_type_id') || dbCChannelId || defaultCChannelItem;
            const ccQty = parseNum(getVal('c_channel_type_quantity') || getVal('c_channel_type_quantity_no')) || (qty * 2);
            upsertEMRow({
                workMainCategory: categoryName,
                searchKey: ccId,
                fallbackName: `${name} C-Channel`,
                baseQty: ccQty,
                rowIdFlag: `_isEm_${prefix}_c_channel_auto`
            });

            const ecId = getVal('end_cap_type_id') || dbEndCapId;
            const ecQty = parseNum(getVal('end_cap_type_quantity') || getVal('end_cap_type_quantity_no'));
            if (ecId && ecQty > 0) {
                upsertEMRow({
                    workMainCategory: categoryName,
                    searchKey: ecId,
                    fallbackName: `${name} End Cap`,
                    baseQty: ecQty,
                    rowIdFlag: `_isEm_${prefix}_end_cap_auto`
                });
            }

            const anchorsId = getVal('anchors_type_id') || dbAnchorsId;
            const anchorsQty = parseNum(getVal('anchors_type') || getVal('anchors_type_no'));
            if (anchorsId && anchorsQty > 0) {
                upsertEMRow({
                    workMainCategory: categoryName,
                    searchKey: anchorsId,
                    fallbackName: `${name} Anchor`,
                    baseQty: anchorsQty,
                    rowIdFlag: `_isEm_${prefix}_anchor_auto`
                });
            }

            const otId = getVal('offset_tee_type_id') || dbOffsetTeeId;
            const otQty = parseNum(getVal('offset_tee_type_quantity') || getVal('offset_tee_type_quantity_no'));
            if (otId && otQty > 0) {
                upsertEMRow({
                    workMainCategory: categoryName,
                    searchKey: otId,
                    fallbackName: `${name} Offset Tee`,
                    baseQty: otQty,
                    rowIdFlag: `_isEm_${prefix}_offset_tee_auto`
                });
            }
        }
    });

    // =========================================================================
    // 11. MECHANICAL & ELECTRICAL INSTALLATION & ACCOMMODATIONS
    // =========================================================================
    
    // 1. Water Feature Mechanical Networks Installation (AppSheet IFS Formula)
    const a = parseFloat(u.water_feature_area_m2 || u.water_feature_area || parentRecord?.water_feature_area_m2 || parentRecord?.water_feature_area || 50);
    let mechDays = 1;
    if (a <= 1000) {
        mechDays = 1;
    } else if (a > 1000 && a <= 2500) {
        mechDays = 1;
    } else if (a > 2500 && a <= 4000) {
        mechDays = 2;
    } else if (a > 4000 && a <= 5500) {
        mechDays = 2;
    } else if (a > 5500 && a <= 7000) {
        mechDays = 2;
    } else if (a > 7000 && a <= 8500) {
        mechDays = 3;
    } else if (a > 8500 && a <= 10000) {
        mechDays = 5;
    } else if (a > 10000 && a <= 12000) {
        mechDays = 5;
    } else if (a > 12000 && a <= 14000) {
        mechDays = 5;
    } else if (a > 14000 && a <= 16000) {
        mechDays = 10;
    } else if (a > 16000 && a <= 18000) {
        mechDays = 10;
    } else {
        mechDays = 10;
    }
    
    const mechanicalNetworksType = u.mechanical_networks_type || 'ed841fd6-79c8-4829-aab9-dddd13d4d166';
    upsertEMRow({
        workMainCategory: 'Mechanical',
        searchKey: mechanicalNetworksType,
        fallbackName: 'Water Feature Mechanical Networks Installation',
        baseQty: mechDays,
        rowIdFlag: '_isEmMechanicalNetworksAuto',
        laborersPerGroup: 8,
        productivityRatePerDay: 1,
        daysToComplete: mechDays,
        activityType: 'Installation'
    });

    // 2. Pump Room Mechanical Installation (AppSheet Quantity = 30, Days = 30, Laborers = 8, Phase Component = 'Pump Room')
    const pumpRoomMechDays = 30;
    upsertEMRow({
        workMainCategory: 'Mechanical',
        searchKey: 'f68b5110-bdc6-450c-b80b-3b276d66e068',
        fallbackName: 'Pump Room Mechanical Installation',
        baseQty: pumpRoomMechDays,
        rowIdFlag: '_isEmPumpRoomMechInstallationAuto',
        phaseComponent: 'Pump Room',
        laborersPerGroup: 8,
        productivityRatePerDay: 1,
        daysToComplete: pumpRoomMechDays,
        activityType: 'Installation'
    });

    // 3. Water Feature Electrical Equipments Installation (AppSheet IFS Formula on WF Area)
    const elecDays = mechDays;
    upsertEMRow({
        workMainCategory: 'Electrical',
        searchKey: 'c30febfb-fa15-4cb1-8611-728732c09490',
        fallbackName: 'Water Feature Electrical Equipments Installation',
        baseQty: elecDays,
        rowIdFlag: '_isEmWfElecInstallationAuto',
        laborersPerGroup: 8,
        productivityRatePerDay: 1,
        daysToComplete: elecDays,
        activityType: 'Installation'
    });

    // 4. Pump Room Electrical Equipments Installation (AppSheet Quantity = 30, Days = 30, Laborers = 8, Phase Component = 'Pump Room')
    const pumpRoomElecDays = 30;
    upsertEMRow({
        workMainCategory: 'Electrical',
        searchKey: '5f6ebbd0-602e-4412-809e-5dec56ea277b',
        fallbackName: 'Pump Room Electrical Equipments Installation',
        baseQty: pumpRoomElecDays,
        rowIdFlag: '_isEmElectricalWorksInstallationAuto',
        phaseComponent: 'Pump Room',
        laborersPerGroup: 8,
        productivityRatePerDay: 1,
        daysToComplete: pumpRoomElecDays,
        activityType: 'Installation'
    });

    // Mechanical & Electrical Accommodations
    const checkVal = (v) => {
        if (v === undefined || v === null || String(v).trim() === '') return null;
        const s = String(v).trim().toLowerCase();
        if (s === 'no' || s === 'false' || s === '0' || v === false) return false;
        if (s === 'yes' || s === 'true' || s === '1' || v === true) return true;
        return null;
    };

    let isAccomRequired = false;
    const directUserChoice = checkVal(u.accommodations_required) ?? 
                             checkVal(u.accommodations) ?? 
                             checkVal(u.accommodation_required) ?? 
                             checkVal(u.accommodation);

    if (directUserChoice !== null) {
        isAccomRequired = directUserChoice;
    } else {
        const upstreamChoice = checkVal(parentRecord?.accommodations_required) ?? 
                               checkVal(wfRecord?.accommodations_required) ?? 
                               checkVal(phaseRecord?.accommodations_required) ?? 
                               checkVal(parentRecord?.accommodations) ?? 
                               checkVal(wfRecord?.accommodations) ?? 
                               checkVal(phaseRecord?.accommodations);
        isAccomRequired = upstreamChoice === true;
    }

    if (isAccomRequired) {
        const totalMechLaborDays = mechDays + pumpRoomMechDays;
        const accomApartmentQty = Math.ceil(8 / 6) * totalMechLaborDays;
        upsertEMRow({
            workMainCategory: 'Mechanical',
            searchKey: '892be778-ed03-436d-ba74-7e4162ae9f82',
            fallbackName: 'Apartment class C',
            baseQty: accomApartmentQty,
            rowIdFlag: '_isEmAccomApartmentAuto',
            activityType: 'Accommodation'
        });

        const accomMicrobusQty = Math.ceil(8 / 14) * totalMechLaborDays;
        upsertEMRow({
            workMainCategory: 'Mechanical',
            searchKey: 'Micro bus',
            fallbackName: 'Micro bus',
            baseQty: accomMicrobusQty,
            rowIdFlag: '_isEmAccomMicrobusAuto',
            activityType: 'Accommodation'
        });

        const totalElecLaborDays = elecDays + pumpRoomElecDays;
        const elecApartmentQty = Math.ceil(8 / 6) * totalElecLaborDays;
        upsertEMRow({
            workMainCategory: 'Electrical',
            searchKey: '892be778-ed03-436d-ba74-7e4162ae9f82',
            fallbackName: 'Apartment class C',
            baseQty: elecApartmentQty,
            rowIdFlag: '_isEmElecAccomApartmentAuto',
            activityType: 'Accommodation'
        });

        const elecMicrobusQty = Math.ceil(8 / 14) * totalElecLaborDays;
        upsertEMRow({
            workMainCategory: 'Electrical',
            searchKey: 'Micro bus',
            fallbackName: 'Micro bus',
            baseQty: elecMicrobusQty,
            rowIdFlag: '_isEmElecAccomMicrobusAuto',
            activityType: 'Accommodation'
        });
    } else {
        // Strict Exclusion: When accommodation is No, completely prune any generated electromechanical accommodation rows
        const accomSpawners = new Set([
            '_isemaccomapartmentauto',
            '_isemaccommicrobusauto',
            '_isemelecaccomapartmentauto',
            '_isemelecaccommicrobusauto'
        ]);
        const beforeLen = updatedBreakdown.length;
        updatedBreakdown = updatedBreakdown.filter(item => {
            const sp = String(item._spawnerid || item.rowIdFlag || '').trim().toLowerCase();
            if (accomSpawners.has(sp)) return false;
            if (item._isEmAccomApartmentAuto || item._isEmAccomMicrobusAuto || 
                item._isEmElecAccomApartmentAuto || item._isEmElecAccomMicrobusAuto) return false;
            
            // Also prune any lingering mechanical/electrical accommodation items
            const itemWorkType = String(item.work_type || '').toLowerCase();
            const itemAct = String(item.activity_type || '').toLowerCase();
            const itemName = String(item.item || item.item_name || item.fallbackName || '').toLowerCase();
            if ((itemWorkType === 'mechanical' || itemWorkType === 'electrical') && 
                itemAct === 'accommodation' && 
                (itemName.includes('apartment') || itemName.includes('micro bus') || itemName.includes('microbus'))) {
                return false;
            }
            return true;
        });
        if (updatedBreakdown.length !== beforeLen) {
            changed = true;
        }
    }

    // =========================================================================
    // 12. DYNAMIC CONTROL PANEL PRICING (Item 24)
    // =========================================================================
    const getPumpHp = (pumpKeyOrId, directHpVal) => {
        if (directHpVal && !isNaN(Number(directHpVal)) && Number(directHpVal) > 0) {
            return Number(directHpVal);
        }
        if (!pumpKeyOrId || !dropdownOptions || Array.isArray(dropdownOptions)) return 0;
        const idStr = String(pumpKeyOrId).trim().toLowerCase();
        const pumpList = dropdownOptions.filter_pump_types || dropdownOptions.filterPumps || [];
        const match = pumpList.find(p => 
            String(p.id).toLowerCase() === idStr ||
            String(p.item_id).toLowerCase() === idStr ||
            String(p.filter_pump_code || p.pump_code || '').toLowerCase() === idStr ||
            String(p.code || '').toLowerCase() === idStr
        );
        if (match) {
            return parseNum(match.filter_pump_hp || match.pump_hp || match.hp || match.power_hp || match.power);
        }
        const itemsList = dropdownOptions.items || [];
        const itemMatch = itemsList.find(i => String(i.id).toLowerCase() === idStr);
        if (itemMatch) {
            const nameMatch = String(itemMatch.item_name || '').match(/(\d+(?:\.\d+)?)\s*hp/i);
            if (nameMatch) return parseNum(nameMatch[1]);
        }
        return 0;
    };

    const filtPumpId = u.water_filter_pump_code || u.preferred_water_filter_pump || u.water_filter_pump;
    const filtPumpHp = getPumpHp(filtPumpId, u.filtration_pump_hp || u.water_filter_pump_hp);
    const filtPumpQty = parseNum(u.total_no_of_water_filter_pumps) || 
                         parseNum(u.no_of_filtration_pump_required) || 
                         (parseNum(u.no_of_water_filter_pump) + parseNum(u.no_of_water_filter_pump_stand_by));
    
    const vacPumpId = u.vacuum_filter_pump_code || u.vacuum_filter_pump;
    const vacPumpHp = getPumpHp(vacPumpId, u.vacuum_filter_pump_hp);
    const vacPumpQty = parseNum(u.no_of_vacuum_filter_pump) + parseNum(u.no_of_vacuum_filter_pump_stand_by) || 
                       parseNum(u.total_no_of_vacuum_filter_pumps);

    const subPumpId = u.submersible_pump_code || u.submersible_pump_type;
    const subPumpHp = getPumpHp(subPumpId, u.submersible_pump_hp);
    const subPumpQty = parseNum(u.no_of_submersible_pump) || parseNum(u.submersible_pump_qty);

    const drainagePumpId = u.drainage_pump_type || u.drainage_chamber;
    const drainagePumpHp = getPumpHp(drainagePumpId, u.drainage_pump_hp);
    const drainagePumpQty = parseNum(u.no_of_drainage_pump) || 0;

    const totalPumpsHp = (filtPumpHp * filtPumpQty) + (vacPumpHp * vacPumpQty) + (subPumpHp * subPumpQty) + (drainagePumpHp * drainagePumpQty);
    let pumpsCost = 0;
    if (totalPumpsHp > 0) {
        if (totalPumpsHp <= 10) {
            pumpsCost = totalPumpsHp * 18000;
        } else {
            pumpsCost = totalPumpsHp * 10000;
        }
    }

    let heaterOutputKw = parseNum(u.heater_output_kw);
    const cpHeaterId = u.recommended_heater_model || u.heater_type;
    const cpHeaterQty = parseNum(u.no_of_heaters) || parseNum(u.heater_qty) || 0;
    if (heaterOutputKw === 0 && cpHeaterId && dropdownOptions && !Array.isArray(dropdownOptions)) {
        const matchingHeater = dropdownOptions.heaters?.find(h => String(h.id) === String(cpHeaterId));
        if (matchingHeater) {
            heaterOutputKw = parseNum(matchingHeater.output_kw || matchingHeater.output__kw_ || matchingHeater.output);
        }
    }
    const heatersCost = heaterOutputKw * cpHeaterQty * 5000;
    const cpUnitCost = pumpsCost + heatersCost;

    // 24. Control Panel
    upsertEMRow({
        workMainCategory: 'Control Panel',
        searchKey: '503a85cb-724b-4000-8e4b-5939414c3b3a',
        fallbackName: 'Control Panel',
        baseQty: 1,
        rowIdFlag: '_isEmControlPanelAuto',
        phaseComponent: 'Pump Room',
        unitCostOverride: cpUnitCost > 0 ? cpUnitCost : 35000
    });

    // =========================================================================
    // 13. ERP METADATA TAGGING & NORMALIZATION
    // =========================================================================
    const ELEC_CAT_UUIDS = new Set([
        '5587a201-cc25-4559-8d72-bd5714ae8a9d', // Control Panel
        'ec468492-fcb8-4a4c-ae13-4f7a4d85ef21', // Electrical
        '4a2c03a7-200f-465b-b0a8-566d2c2bd2ad', // Water Feature Earthing
        '918dcf06-a590-4b68-aef1-0c213a31187a', // Water Feature Lighting
        'b996200f-b484-441e-b9f1-719d0e5c7f78', // Main Cable Tray
        'de8f9f4c-811c-4a67-82d8-6603f7df1f2e', // Pump Room Lighting
        '77d649d8-48e1-4fe9-9d1f-98a64220b3d6', // Service Sockets
        'b43e876f-4f24-4628-ac53-7a81b98c5f48', // Electrical Works
        'ce0eedc7-3d3e-4253-91b5-383c8e908f01', // Earthing & Cable Trays
        '492bd632-e1a8-4428-a46a-6131513be7b7'  // Lighting & Sockets
    ]);
    updatedBreakdown = updatedBreakdown.map(item => {
        const spawner = String(item._spawnerid || item._spawnerId || item.rowIdFlag || '');
        if (spawner.startsWith('_isEm')) {
            const catStr = String(item.work_main_category || '');
            const isElectrical = [
                'Electrical',
                'Earthing & Cable Trays',
                'Lighting & Sockets',
                'Water Feature Lighting',
                'Water Feature Earthing',
                'Service Sockets',
                'Pump Room Lighting',
                'Main Cable Tray',
                'Control Panel'
            ].includes(catStr) ||
            catStr.endsWith('Electrical Cable') ||
            ELEC_CAT_UUIDS.has(catStr.toLowerCase()) ||
            isElecCategory(catStr, item.item_name || item.item || '', spawner);

            return {
                ...item,
                phase_component: (
                    ['Pump Room Lighting', 'Service Sockets', 'Control Panel', 'de8f9f4c-811c-4a67-82d8-6603f7df1f2e', '77d649d8-48e1-4fe9-9d1f-98a64220b3d6', '5587a201-cc25-4559-8d72-bd5714ae8a9d'].includes(catStr) ||
                    /^_isEmPr[A-Z_]/.test(spawner) ||
                    spawner === '_isEmControlPanelAuto' ||
                    spawner === '_isEmPumpRoomMechInstallationAuto' ||
                    spawner === '_isEmElectricalWorksInstallationAuto'
                ) ? 'Pump Room' : phaseComponentTarget,
                work_type: isElectrical ? 'Electrical' : 'Mechanical',
                main_category: 'Construction'
            };
        }
        return item;
    });

    // Final deduplication safety guard for auto-generated electromechanical items
    const seenSpawners = new Set();
    updatedBreakdown = updatedBreakdown.filter(item => {
        const sp = String(item._spawnerid || item.rowIdFlag || '').toLowerCase();
        if (sp.startsWith('_isem')) {
            if (seenSpawners.has(sp)) {
                return false;
            }
            seenSpawners.add(sp);
        }
        return true;
    });

    // Sync back to proposal record
    u.proposal_breakdown_items = [...updatedBreakdown];
    return u;
};
