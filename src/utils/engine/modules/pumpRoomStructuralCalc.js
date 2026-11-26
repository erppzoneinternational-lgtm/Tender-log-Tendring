// src/utils/engine/modules/pumpRoomStructuralCalc.js

export function calculatePumpRoomStructural(formData, parentWF = null, dropdownOptions = null) {
    let u = { ...formData };
    let wfRecord = null;
    
    const prDataList = dropdownOptions?.pump_room_data_entry || dropdownOptions?.prDataEntries || dropdownOptions?.proposal_data_entry || [];
    const linkedPhaseId = u.linked_phase || u.phase_id || parentWF?.phase_id || parentWF?.linked_phase || parentWF?.id;
    
    if (Array.isArray(prDataList) && linkedPhaseId) {
        wfRecord = prDataList.find((p) => 
            String(p.id) === String(linkedPhaseId) || 
            String(p.linked_phase) === String(linkedPhaseId) || 
            String(p.phase_id) === String(linkedPhaseId)
        );
        if (!wfRecord) {
            const tenderId = u.tender_log_id || u.linked_proposal || parentWF?.tender_log_id || parentWF?.linked_proposal;
            if (tenderId) {
                wfRecord = prDataList.find((p) => 
                    String(p.tender_log_id) === String(tenderId) || 
                    String(p.linked_proposal) === String(tenderId)
                );
            }
        }
    }
    const wfParent = parentWF || wfRecord;

    // Retrieve Upstream Dimensions with solid fallbacks
    const prLen = parseFloat(u.pump_room_length_m || wfParent?.pump_room_length_m || 10) || 10;
    const prWid = parseFloat(u.pump_room_width_m || wfParent?.pump_room_width_m || 5) || 5;
    const prHgt = parseFloat(u.pump_room_height_m || wfParent?.pump_room_height_m || 3) || 3;
    const btWid = parseFloat(u.balance_tank_width_m || wfParent?.balance_tank_width_m || 0) || 0;
    const btLen = parseFloat(u.balance_tank_length_m || wfParent?.balance_tank_length_m || 0) || 0;
    const btHgt = parseFloat(u.balance_tank_height_m || wfParent?.balance_tank_height_m || 0) || 0;
    const btArea = parseFloat(u.balance_tank_area_m2 || wfParent?.balance_tank_area_m2 || (btLen * btWid) || 0) || 0;
    
    const sumpitArea = parseFloat(u.sumpit_area_m2 || wfParent?.sumpit_area_m2 || 0) || 0;
    const sumpitHeight = parseFloat(u.sumpit_height_m || wfParent?.sumpit_height_m || 0) || 0;
    const sumpitPerimeter = parseFloat(u.sumpit_perimeter_m || wfParent?.sumpit_perimeter_m || (sumpitArea > 0 ? 4 * Math.sqrt(sumpitArea) : 0)) || 0;

    // Section 3: Plain Concrete (PC) Thickness & Footing defaults
    if (u._pc_thick_init !== 'done') {
        const val = parseFloat(u.pc_thickness_ground_m);
        if (isNaN(val) || val === 0) u.pc_thickness_ground_m = 0.1;
        u._pc_thick_init = 'done';
    }
    if (u._pc_foot_init !== 'done') {
        const val = parseFloat(u.pc_footing_ground_m);
        if (isNaN(val) || val === 0) u.pc_footing_ground_m = 0.1;
        u._pc_foot_init = 'done';
    }

    // Section 4: Reinforced Concrete (RC) Thicknesses & Rebar defaults
    if (u._rc_thick_ground_init !== 'done') {
        const val = parseFloat(u.rc_thickness_ground_m);
        if (isNaN(val) || val === 0) u.rc_thickness_ground_m = 0.25;
        u._rc_thick_ground_init = 'done';
    }
    if (u._rc_thick_wall_init !== 'done') {
        const val = parseFloat(u.rc_thickness_wall_m);
        if (isNaN(val) || val === 0) u.rc_thickness_wall_m = 0.25;
        u._rc_thick_wall_init = 'done';
    }
    if (u._rc_thick_ceiling_init !== 'done') {
        const val = parseFloat(u.rc_thickness_ceiling_m);
        if (isNaN(val) || val === 0) u.rc_thickness_ceiling_m = 0.20;
        u._rc_thick_ceiling_init = 'done';
    }
    if (u._rebar_density_init !== 'done') {
        const val = parseFloat(u.rebar_density_kg_m3);
        if (isNaN(val) || val === 0) u.rebar_density_kg_m3 = 85;
        u._rebar_density_init = 'done';
    }
    if (u._wp_bitumen_layers_init !== 'done') {
        const val = parseFloat(u.wp_bitumen_layers);
        if (isNaN(val) || val === 0) u.wp_bitumen_layers = 2;
        u._wp_bitumen_layers_init = 'done';
    }

    const pcThick = parseFloat(u.pc_thickness_ground_m) || 0.10;
    const pcFooting = parseFloat(u.pc_footing_ground_m) || 0.10;
    const rcGroundThick = parseFloat(u.rc_thickness_ground_m) || 0.25;
    const rcWallThick = parseFloat(u.rc_thickness_wall_m) || 0.25;
    const rcCeilingThick = parseFloat(u.rc_thickness_ceiling_m) || 0.20;

    // RC Dimensions: L_RC = PR_L + BT_W + 2*T_wall, W_RC = PR_W + 2*T_wall
    let rcLen = parseFloat(u.rc_length_m);
    if (isNaN(rcLen) || rcLen === 0) {
        rcLen = parseFloat((prLen + btWid + (2 * rcWallThick)).toFixed(4));
        u.rc_length_m = rcLen;
    }
    let rcWid = parseFloat(u.rc_width_m);
    if (isNaN(rcWid) || rcWid === 0) {
        rcWid = parseFloat((prWid + (2 * rcWallThick)).toFixed(4));
        u.rc_width_m = rcWid;
    }

    // Concrete Forming Height = H_PR + T_RC,ground + T_RC,ceiling
    u.concrete_forming_height_m = parseFloat((prHgt + rcGroundThick + rcCeilingThick).toFixed(4));
    const formingHeight = parseFloat(u.concrete_forming_height_m) || 3.45;

    // Excavation Works
    const excInScopeVal = String(u.excavation_in_scope || '').toLowerCase();
    const isExcInScope = excInScopeVal === 'yes' || excInScopeVal === 'y';
    if (isExcInScope) {
        if (u._exc_footing_init !== 'done') {
            const val = parseFloat(u.excavation_footing_m);
            if (isNaN(val) || val === 0) u.excavation_footing_m = 0.7;
            u._exc_footing_init = 'done';
        }
    } else {
        u.excavation_footing_m = 0;
        u._exc_footing_init = undefined;
    }
    const activeExcFooting = parseFloat(u.excavation_footing_m) || 0;

    if (isExcInScope) {
        u.excavation_length_m = parseFloat((rcLen + (2 * rcWallThick) + (2 * pcFooting) + (2 * activeExcFooting)).toFixed(4));
        u.excavation_width_m = parseFloat((rcWid + (2 * rcWallThick) + (2 * pcFooting) + (2 * activeExcFooting)).toFixed(4));
        u.excavation_height_m = parseFloat((prHgt + pcThick + rcGroundThick).toFixed(4));
        const excVol = u.excavation_length_m * u.excavation_width_m * u.excavation_height_m;
        u.qty_excavation_m3 = isNaN(excVol) ? 0 : Number(Math.ceil(excVol).toFixed(3));
    } else {
        u.excavation_length_m = 0;
        u.excavation_width_m = 0;
        u.excavation_height_m = 0;
        u.qty_excavation_m3 = 0;
    }

    // Plain Concrete (PC) Dimensions: L_PC = L_RC + 2*T_PC + 2*F_PC, W_PC = W_RC + 2*T_PC + 2*F_PC
    u.pc_length_m = parseFloat((rcLen + (2 * pcThick) + (2 * pcFooting)).toFixed(4));
    u.pc_width_m = parseFloat((rcWid + (2 * pcThick) + (2 * pcFooting)).toFixed(4));
    
    const pcVol = (u.pc_length_m * u.pc_width_m) * pcThick;
    u.qty_pc_m3_erp = isNaN(pcVol) ? 0 : Number(Math.ceil(pcVol).toFixed(3));
    u.qty_pc_total_m3 = u.qty_pc_m3_erp;

    // Polyethylene Sheet: (V_PC / T_PC) / SpecRate (default 2)
    if (pcThick > 0 && u.qty_pc_m3_erp > 0) {
        const polyBrand = formData.polyethylene_brand;
        const civilMaterials = dropdownOptions?.civil_material_types || [];
        const matchedPoly = civilMaterials.find((m) => String(m.item_id || m.id).toLowerCase() === String(polyBrand).toLowerCase());
        const specRate = matchedPoly && matchedPoly.specification_rate > 0 ? parseFloat(matchedPoly.specification_rate) : 2;
        u.qty_polyethylene_kg = Math.ceil((u.qty_pc_m3_erp / pcThick) / specRate);
    } else {
        u.qty_polyethylene_kg = 0;
    }

    // Reinforced Concrete (RC) Volumes
    const baseRcGround = Math.ceil((rcLen * rcWid) * rcGroundThick);
    const sumpitRcGround1 = Math.ceil(sumpitArea * rcGroundThick);
    const sumpitRcGround2 = Math.ceil((sumpitPerimeter * sumpitHeight) * rcGroundThick);
    const rcGroundVol = baseRcGround + sumpitRcGround1 + sumpitRcGround2;
    u.qty_rc_ground_m3 = isNaN(rcGroundVol) ? 0 : Number(rcGroundVol.toFixed(3));

    const activePerimeter = (rcLen + rcWid) * 2;
    const rcWallVol = Math.ceil(activePerimeter * prHgt * rcWallThick);
    u.qty_rc_walls_m3 = isNaN(rcWallVol) ? 0 : Number(rcWallVol.toFixed(3));

    const rcCeilingVol = Math.ceil((rcLen * rcWid) * rcCeilingThick);
    u.qty_rc_ceiling_m3 = isNaN(rcCeilingVol) ? 0 : Number(rcCeilingVol.toFixed(3));

    const totalRc = u.qty_rc_ground_m3 + u.qty_rc_walls_m3 + u.qty_rc_ceiling_m3;
    u.qty_rc_total_m3 = isNaN(totalRc) ? 0 : Number(totalRc.toFixed(3));
    u.qty_rc_m3_erp = u.qty_rc_total_m3;
    u.qty_rc_m3 = u.qty_rc_total_m3;

    // Coffor Formwork Area = 2*(L_RC + W_RC) * FormingHeight + ceil(P_sumpit * H_sumpit)
    const mainCofforArea = ((rcLen * 2) + (rcWid * 2)) * formingHeight;
    const sumpitCofforArea = Math.ceil(sumpitPerimeter * sumpitHeight);
    u.coffor_qty_m2_erp = Math.ceil(mainCofforArea + sumpitCofforArea);

    // Bituminous & Membrane Waterproofing Area
    const pcArea = (parseFloat(u.pc_length_m) || 0) * (parseFloat(u.pc_width_m) || 0);
    const rcPerimeter = 2 * (rcLen + rcWid);
    const wallWpArea = rcPerimeter * (formingHeight + 0.1);
    const rcArea = rcLen * rcWid;
    const bitumWpQty = Math.ceil(pcArea + wallWpArea + rcArea);
    u.bituminous_wp_qty_m2_erp = Number(bitumWpQty.toFixed(3));

    // Cementitious Waterproofing Area (Balance Tank + Sump Pit)
    const cemWpTerm1 = 2 * (btLen + btWid) * prHgt;
    const cemWpTerm2 = btArea;
    const cemWpTerm3 = Math.ceil(sumpitArea + (sumpitHeight * sumpitPerimeter));
    const cemWpQty = Math.ceil(cemWpTerm1 + cemWpTerm2 + cemWpTerm3);
    u.cementitious_wp_qty_m2_erp = Number(cemWpQty.toFixed(3));

    // Internal Plastering
    u.qty_plaster_int_area_m2 = Number(cemWpTerm1.toFixed(3));
    u.qty_plaster_int_vol_m3 = Number((u.qty_plaster_int_area_m2 * 0.02).toFixed(3));
    u.qty_cement_int_tons = Number(((u.qty_plaster_int_vol_m3 * 1.5 * (1 / 5)) * 1.4).toFixed(3));
    u.qty_sand_int_m3 = Number((u.qty_plaster_int_vol_m3 * 1.5 * (4 / 5)).toFixed(3));
    u.qty_water_int_ltr = Number((u.qty_cement_int_tons * 0.5 * 1000).toFixed(3));
    u.qty_adipond_int_ltr = Number((u.qty_water_int_ltr / 10).toFixed(3));
    u.qty_grout_int_repair_m3 = Number((u.qty_plaster_int_area_m2 * 0.001).toFixed(4));

    // Sync ERP quantities into billable user fields if not manually overridden
    const syncUserField = (userKey, erpKey) => {
        const lastErpKey = `_last_${erpKey}`;
        if (u[userKey] === undefined || u[userKey] === null || u[userKey] === '' || u[userKey] === u[lastErpKey]) {
            u[userKey] = u[erpKey];
        }
        u[lastErpKey] = u[erpKey];
    };
    u.qty_excavation_m3_erp = u.qty_excavation_m3 || 0;
    syncUserField('qty_excavation_m3_user', 'qty_excavation_m3_erp');
    syncUserField('qty_pc_m3_user', 'qty_pc_m3_erp');
    syncUserField('qty_rc_ground_user_m3', 'qty_rc_ground_m3');
    syncUserField('qty_rc_walls_user_m3', 'qty_rc_walls_m3');
    syncUserField('qty_rc_ceiling_user_m3', 'qty_rc_ceiling_m3');
    syncUserField('total_rc_qty_user', 'qty_rc_total_m3');
    syncUserField('coffor_qty_m2_user', 'coffor_qty_m2_erp');
    syncUserField('bituminous_wp_qty_m2_user', 'bituminous_wp_qty_m2_erp');
    syncUserField('cementitious_wp_qty_m2_user', 'cementitious_wp_qty_m2_erp');

    // External Protective Plastering
    const pcLength = parseFloat(u.pc_length_m) || 0;
    const pcWidth = parseFloat(u.pc_width_m) || 0;
    u.qty_plaster_ext_protect_vol_m3 = Math.ceil((pcLength * pcWidth) * 0.02);
    u.qty_cement_ext_protect_tons = Number(((u.qty_plaster_ext_protect_vol_m3 * 1.5 * (1 / 5)) * 1.4).toFixed(3));
    u.qty_sand_ext_protect_m3 = Number((u.qty_plaster_ext_protect_vol_m3 * 1.5 * (4 / 5)).toFixed(3));
    u.qty_water_ext_protect_ltr = Number((u.qty_cement_ext_protect_tons * 0.5 * 1000).toFixed(3));
    u.qty_grout_ext_repair_m3 = Number((((2 * (rcLen + rcWid)) * formingHeight) * 0.001).toFixed(4));
    u.qty_plaster_ext_vol_m3 = Number((((2 * (rcLen + rcWid)) * formingHeight) * 0.02).toFixed(3));
    u.qty_cement_ext_tons = Number(((u.qty_plaster_ext_vol_m3 * 1.5 * (1 / 5)) * 1.4).toFixed(3));
    u.qty_sand_ext_m3 = Number(((u.qty_plaster_ext_vol_m3 / 1.5) * (4 / 5)).toFixed(3));
    u.qty_adipond_ext_ltr = Number((u.qty_sand_ext_m3 / 10).toFixed(3));
    u.qty_water_ext_ltr = Number((u.qty_cement_ext_tons * 0.5 * 1000).toFixed(3));

    // Backfilling
    const bfPerim = parseFloat(u.backfilling_perimeter_m) || (2 * (rcLen + rcWid));
    const excFooting = parseFloat(u.excavation_footing_m) || 0;
    const excHeight = parseFloat(u.excavation_height_m) || 0;
    const rcLength = parseFloat(u.rc_length_m) || rcLen;
    const rcWidth = parseFloat(u.rc_width_m) || rcWid;
    const overPrBf = parseFloat(u.over_backfilling_m) || 0;
    
    const bfVol = (bfPerim * excFooting * excHeight) + (rcLength * rcWidth * overPrBf);
    u.qty_backfilling_m2 = Number(Math.ceil(bfVol).toFixed(3));
    return u;
}

export function getPumpRoomStructuralDependencies(formData) {
    return [
        formData.phase_id, formData.linked_phase, formData.rc_length_m, formData.rc_width_m,
        formData.pc_thickness_ground_m, formData.pc_footing_ground_m, formData.rc_thickness_ground_m,
        formData.rc_thickness_wall_m, formData.rc_thickness_ceiling_m, formData.concrete_forming_height_m,
        formData.pump_room_perimeter_m, formData.excavation_in_scope, formData.excavation_footing_m,
        formData.pump_room_length_m, formData.pump_room_width_m, formData.pump_room_height_m,
        formData.sumpit_area_m2, formData.sumpit_perimeter_m, formData.sumpit_height_m,
        formData.balance_tank_length_m, formData.balance_tank_width_m, formData.balance_tank_height_m,
        formData.balance_tank_perimeter_m, formData.balance_tank_area_m2, formData.balance_tank_volume_m3,
        formData.water_feature_type, formData.water_feature_category, formData.wp_bituminous_brand,
        formData.wp_bituminous_material, formData.wp_membrane_brand, formData.wp_membrane_material,
        formData.wp_cementitious_brand, formData.wp_cementitious_material, formData.qty_excavation_m3_user,
        formData.qty_pc_m3_user, formData.total_rc_qty_user, formData.bituminous_wp_qty_m2_user,
        formData.cementitious_wp_qty_m2_user, formData.coffor_qty_m2_user, formData.polyethylene_brand
    ];
}
