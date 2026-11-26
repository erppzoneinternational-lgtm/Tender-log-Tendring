// @ts-nocheck
/**
 * Water Feature Finishes BOQ Builder
 * Generates itemized BOQ breakdowns, labor crew sizes, duration schedules,
 * and logistics for Stainless Steel Ladders, Plastering, Liner, Tiling, and Coping works.
 */

import { getAllItemsDb, upsertBoqRow, extractDropdownDetails } from './waterFeatureStructuralBoqBuilder.js';

export const buildWaterFeatureFinishesBoq = (u, rows = [], dropdownOptions = {}, parentWF = {}) => {
    if (!u) return { ...u, proposal_breakdown_items: rows, _changed: false };

    const linkedPhaseId = u.linked_phase || u.phase_id || parentWF?.phase_id;
    const phaseRecord = dropdownOptions?.phases?.find(p => String(p.id) === String(linkedPhaseId)) || {};
    const wfRecord = dropdownOptions?.proposal_data_entry?.find(p => 
        String(p.id) === String(linkedPhaseId) || 
        String(p.linked_phase) === String(linkedPhaseId) || 
        String(p.phase_id) === String(linkedPhaseId)
    ) || {};

    const rawAccRequired = u.accommodations_required || parentWF?.accommodations_required || phaseRecord?.accommodations_required || wfRecord?.accommodations_required || '';
    const needsAccommodation = rawAccRequired === true || String(rawAccRequired).trim().toLowerCase() === 'yes';

    let updatedBreakdown = [...rows];
    let changed = false;
    const currentPhaseId = u.phase_id || linkedPhaseId || 'UNKNOWN_PHASE';
    const activeProposalId = u.project_title || u.proposal_id || parentWF?.project_title || parentWF?.proposal_id || '';
    const itemsDb = getAllItemsDb(dropdownOptions);

    let phaseComponentTarget = 'Water Feature Finishes';
    const catUuid = u.water_feature_category || parentWF?.water_feature_category || phaseRecord?.water_feature_category || wfRecord?.water_feature_category;
    if (catUuid) {
        const matchedCat = dropdownOptions?.water_feature_category?.find(c => String(c.id).toLowerCase() === String(catUuid).toLowerCase());
        if (matchedCat) {
            phaseComponentTarget = (matchedCat.name || matchedCat.category_name || 'Water Feature') + ' - Finishes';
        }
    }

    // =========================================================================
    // 1. STAINLESS STEEL LADDERS
    // =========================================================================
    const processLadder = (qty, searchKey, fallbackName, rowIdFlag, resp = 'P.Zone', actType = 'Procurement') => {
        const res = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Stainless Steel Ladder',
            searchKey: searchKey,
            fallbackName: fallbackName,
            baseQty: qty, 
            itemsDb, 
            rowIdFlag: rowIdFlag,
            responsibility: resp,
            activityType: actType
        });
        if (res.changed) changed = true;
        return res;
    };

    const ladder2Qty = Number(u.ladder_2_steps_no || 0);
    const ladder3Qty = Number(u.ladder_3_steps_no || 0);
    const ladder4Qty = Number(u.ladder_4_steps_no || 0);
    const ladder5Qty = Number(u.ladder_5_steps_no || 0);
    const totalLadderQty = ladder2Qty + ladder3Qty + ladder4Qty + ladder5Qty;

    const ladder2Res = processLadder(ladder2Qty, '4597fa4e-2783-42fe-aedd-de7b9b229ba6', 'Stainless Steel Ladder 2 Steps', '_isLadder2Auto');
    const ladder3Res = processLadder(ladder3Qty, '75824d45-b377-4859-b43d-ef6aad71d8bb', 'Stainless Steel Ladder 3 Steps', '_isLadder3Auto');
    const ladder4Res = processLadder(ladder4Qty, '44ba7d55-a969-4000-acaf-24287bd43c30', 'Stainless Steel Ladder 4 Steps', '_isLadder4Auto');
    const ladder5Res = processLadder(ladder5Qty, '1920233d-e1e7-4037-b421-a15a27263eec', 'Stainless Steel Ladder 5 Steps', '_isLadder5Auto');
    
    const ladderInstallRes = processLadder(totalLadderQty, '71469901-8945-402b-98e0-93dbb8157352', 'Subcontractor to Install Stainless Steel Ladder', '_isLadderInstallAuto', 'P.Zone', 'Installation');
    const totalLadderCost = Number((ladder2Res.totalCost + ladder3Res.totalCost + ladder4Res.totalCost + ladder5Res.totalCost + ladderInstallRes.totalCost).toFixed(2));
    
    if (u.total_cost_ladder !== totalLadderCost) {
        u.total_cost_ladder = totalLadderCost;
        u.unit_cost_ladder = totalLadderQty > 0 ? Number((totalLadderCost / totalLadderQty).toFixed(2)) : 0;
        u.days_to_complete_ladder = Math.ceil(ladder2Res.days + ladder3Res.days + ladder4Res.days + ladder5Res.days + ladderInstallRes.days);
        u.no_of_laborers_ladder = Math.ceil(ladder2Res.laborers + ladder3Res.laborers + ladder4Res.laborers + ladder5Res.laborers + ladderInstallRes.laborers);
        changed = true;
    }

    // =========================================================================
    // 2. PLASTERING / CEMENT STUCCO WORKS
    // =========================================================================
    const wfArea = Number(parentWF?.water_feature_area_m2 || 0);
    const getPlasteringDays = (area) => {
        if (area <= 1000) return 20;
        if (area <= 2500) return 25;
        if (area <= 4000) return 40;
        if (area <= 5500) return 60;
        if (area <= 10000) return 70;
        if (area <= 12000) return 80;
        if (area <= 14000) return 95;
        return 110;
    };

    const processPlastering = (qtyField, searchKey, fallbackName, rowIdFlag, activityType = 'Installation', extraParams = {}) => {
        const qty = Number(u[qtyField] || u.qty_stucco_m2_erp || 0);
        const res = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Plastering Works',
            searchKey: searchKey,
            fallbackName: fallbackName,
            baseQty: qty, 
            itemsDb, 
            rowIdFlag: rowIdFlag,
            responsibility: 'P.Zone',
            activityType: activityType,
            ...extraParams
        });
        if (res.changed) changed = true;
        return res;
    };

    const waterPlasteringRes = processPlastering('qty_water_stucco_ltr', '2eb2c9f6-2d09-4c35-8a99-d4a84952b11d', 'Water for Plastering', '_isWaterPlasteringAuto', 'Procurement');
    const sandPlasteringRes = processPlastering('qty_sand_stucco_m3', '9937162c-9335-4260-a211-fc6295d41ef4', 'Sand for Plastering', '_isSandPlasteringAuto', 'Procurement');
    const cementPlasteringRes = processPlastering('qty_cement_stucco_tons', '2e131253-45a0-4c7d-add0-19611ef318b6', 'Cement for plastering', '_isCementPlasteringAuto', 'Procurement');
    const addibondPlasteringRes = processPlastering('qty_addibond_stucco_ltr', '3942cb95-38aa-4bca-a00a-b4ab0700a5a8', 'Addibond 65 for Plastering Works', '_isAddibondPlasteringAuto', 'Procurement');
    
    const plasteringSubcontractorRes = processPlastering('qty_stucco_m2_user', '1765dc0e-e15b-4262-9067-f841a254e006', 'Plastering subcontractor', '_isPlasteringSubAuto', 'Installation', {
        responsibility: 'P.Zone',
        laborersPerGroup: 6,
        productivityRatePerDay: 180,
        daysToComplete: getPlasteringDays(wfArea)
    });

    const plasterDays = plasteringSubcontractorRes.days;
    const plasterLaborers = plasteringSubcontractorRes.laborers;
    let plasterAptRes = { totalCost: 0, days: 0, laborers: 0, changed: false };
    let plasterMicrobusRes = { totalCost: 0, days: 0, laborers: 0, changed: false };

    if (needsAccommodation && plasterDays > 0 && plasterLaborers > 0) {
        const aptQty = Math.ceil(plasterLaborers / 6) * plasterDays;
        plasterAptRes = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Plastering Works',
            searchKey: 'Apartment class C',
            fallbackName: 'Apartment class C',
            baseQty: aptQty, 
            itemsDb, 
            rowIdFlag: '_isPlasterAptAuto',
            responsibility: 'P.Zone',
            activityType: 'Accommodation'
        });
        if (plasterAptRes.changed) changed = true;

        const microbusQty = Math.ceil(plasterLaborers / 12) * plasterDays;
        plasterMicrobusRes = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Plastering Works',
            searchKey: 'Micro bus',
            fallbackName: 'Micro bus',
            baseQty: microbusQty, 
            itemsDb, 
            rowIdFlag: '_isPlasterMicrobusAuto',
            responsibility: 'P.Zone',
            activityType: 'Accommodation'
        });
        if (plasterMicrobusRes.changed) changed = true;
    } else {
        const lenBefore = updatedBreakdown.length;
        updatedBreakdown = updatedBreakdown.filter(item => !(item._isPlasterAptAuto || item._isPlasterMicrobusAuto || item._spawnerid === '_isPlasterAptAuto' || item._spawnerid === '_isPlasterMicrobusAuto'));
        if (updatedBreakdown.length !== lenBefore) changed = true;
    }

    const totalPlasteringCost = Number((waterPlasteringRes.totalCost + sandPlasteringRes.totalCost + cementPlasteringRes.totalCost + addibondPlasteringRes.totalCost + plasteringSubcontractorRes.totalCost + plasterAptRes.totalCost + plasterMicrobusRes.totalCost).toFixed(2));
    if (u.total_cost_stucco !== totalPlasteringCost) {
        u.total_cost_stucco = totalPlasteringCost;
        const baseStuccoQty = Number(u.qty_stucco_m2_user || u.qty_stucco_m2_erp || 0);
        u.unit_cost_stucco = baseStuccoQty > 0 ? Number((totalPlasteringCost / baseStuccoQty).toFixed(2)) : 0;
        u.days_to_complete_stucco = Math.ceil(waterPlasteringRes.days + sandPlasteringRes.days + cementPlasteringRes.days + addibondPlasteringRes.days + plasteringSubcontractorRes.days + plasterAptRes.days + plasterMicrobusRes.days);
        u.no_of_laborers_stucco = Math.ceil(waterPlasteringRes.laborers + sandPlasteringRes.laborers + cementPlasteringRes.laborers + addibondPlasteringRes.laborers + plasteringSubcontractorRes.laborers + plasterAptRes.laborers + plasterMicrobusRes.laborers);
        changed = true;
    }

    // =========================================================================
    // 3. LINER WORKS
    // =========================================================================
    const processLiner = (qtyInput, searchKey, fallbackName, rowIdFlag, activityType, extraParams = {}) => {
        let qty = 0;
        if (typeof qtyInput === 'string') {
            const erpField = qtyInput.replace('_user', '_erp');
            qty = Number(u[qtyInput] || u[erpField] || 0);
        } else {
            qty = Number(qtyInput || 0);
        }
        if (qty <= 0) {
            const lenBefore = updatedBreakdown.length;
            updatedBreakdown = updatedBreakdown.filter(item => !(item[rowIdFlag] || item._spawnerid === rowIdFlag));
            if (updatedBreakdown.length !== lenBefore) changed = true;
            return { totalCost: 0, days: 0, laborers: 0, changed: false };
        }
        const res = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Liner Works',
            searchKey: searchKey,
            fallbackName: fallbackName,
            baseQty: qty, 
            itemsDb, 
            rowIdFlag: rowIdFlag,
            responsibility: 'P.Zone',
            activityType: activityType,
            ...extraParams
        });
        if (res.changed) changed = true;
        return res;
    };

    const getLinerDays = (area) => {
        if (area <= 1000) return 4;
        if (area <= 2500) return 5;
        if (area <= 4000) return 5;
        if (area <= 5500) return 6;
        if (area <= 7000) return 7;
        if (area <= 10000) return 10;
        if (area <= 12000) return 10;
        if (area <= 16000) return 12;
        if (area <= 18000) return 15;
        return 15;
    };

    const smoothLinerTypeId = u?.resilient_sheet_type_id || u?.wf_resilient_sheet_type || parentWF?.wf_resilient_sheet_type || parentWF?.water_feature_resilient_sheet_type || u?.water_feature_resilient_sheet_type || 'd2c1df2b-363e-4813-a09d-2dd00893d07d';
    const smoothLinerRes = processLiner('qty_resilient_sheet_m2_user', smoothLinerTypeId, 'Supply Smooth Liner', '_isSmoothLinerAuto', 'Procurement');
    const antiSlipLinerTypeId = u?.resilient_sheet_stairs_type_id || u?.resilient_sheet_type_stairs || parentWF?.resilient_sheet_stairs_type_id || parentWF?.resilient_sheet_type_stairs || 'b6cb2aff-8a50-4172-9f82-51b77bab90ad';
    const antiSlipLinerRes = processLiner('qty_slip_resistant_vinyl_m2_user', antiSlipLinerTypeId, 'Supply Anti Slip Liner', '_isAntiSlipLinerAuto', 'Procurement');
    
    const linerlockQtyCondition = Number(u.qty_linerlock_m_user || u.qty_linerlock_m_erp || 0);
    const rivetNailsQty = linerlockQtyCondition > 0 ? Number(u.qty_rivet_nails_no_user || u.qty_rivet_nails_no_erp || 0) : 0;
    const rivetScrewRes = processLiner(rivetNailsQty, 'ed64565d-f043-420c-8210-86290d123483', 'Rivet Screw for Liners', '_isRivetScrewLinerAuto', 'Procurement');
    const linerlockRes = processLiner('qty_linerlock_m_user', '98c04c06-0723-43b0-a100-6bf087bae0d7', 'Supply Linerlock', '_isLinerlockAuto', 'Procurement');
    
    const smoothLinerQty = Number(u.qty_resilient_sheet_m2_user || u.qty_resilient_sheet_m2_erp || 0);
    const antiSlipQty = Number(u.qty_slip_resistant_vinyl_m2_user || u.qty_slip_resistant_vinyl_m2_erp || 0);
    const totalSubcontractorLinerQty = smoothLinerQty + antiSlipQty;
    u.qty_total_liner_m2_erp = totalSubcontractorLinerQty;
    
    const linerSubcontractorRes = processLiner(totalSubcontractorLinerQty, '5d15b908-e2ab-44d1-894d-4179d8f3be8b', 'Subcontractor for Liner Works', '_isLinerSubcontractorAuto', 'Installation', {
        overrideDays: getLinerDays(Number(parentWF?.water_feature_area_m2 || 0))
    });

    const linerDays = linerSubcontractorRes.days;
    const linerLaborers = linerSubcontractorRes.laborers;
    let linerAptRes = { totalCost: 0, days: 0, laborers: 0, changed: false };
    let linerMicrobusRes = { totalCost: 0, days: 0, laborers: 0, changed: false };

    if (needsAccommodation && linerDays > 0 && linerLaborers > 0) {
        const aptQty = Math.ceil(linerLaborers / 6) * linerDays;
        linerAptRes = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Liner Works',
            searchKey: 'Apartment class C',
            fallbackName: 'Apartment class C',
            baseQty: aptQty, 
            itemsDb, 
            rowIdFlag: '_isLinerAptAuto',
            responsibility: 'P.Zone',
            activityType: 'Accommodation'
        });
        if (linerAptRes.changed) changed = true;

        const microbusQty = Math.ceil(linerLaborers / 12) * linerDays;
        linerMicrobusRes = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Liner Works',
            searchKey: 'Micro bus',
            fallbackName: 'Micro bus',
            baseQty: microbusQty, 
            itemsDb, 
            rowIdFlag: '_isLinerMicrobusAuto',
            responsibility: 'P.Zone',
            activityType: 'Accommodation'
        });
        if (linerMicrobusRes.changed) changed = true;
    } else {
        const lenBefore = updatedBreakdown.length;
        updatedBreakdown = updatedBreakdown.filter(item => !(item._isLinerAptAuto || item._isLinerMicrobusAuto || item._spawnerid === '_isLinerAptAuto' || item._spawnerid === '_isLinerMicrobusAuto'));
        if (updatedBreakdown.length !== lenBefore) changed = true;
    }

    const totalLinerCost = Number((smoothLinerRes.totalCost + antiSlipLinerRes.totalCost + rivetScrewRes.totalCost + linerlockRes.totalCost + linerSubcontractorRes.totalCost + linerAptRes.totalCost + linerMicrobusRes.totalCost).toFixed(2));
    if (u.total_cost_liner !== totalLinerCost || u.total_cost_total_liner !== totalLinerCost) {
        u.total_cost_liner = totalLinerCost;
        u.total_cost_total_liner = totalLinerCost;
        const baseLinerQty = totalSubcontractorLinerQty || Number(u.qty_resilient_sheet_m2_user || u.qty_resilient_sheet_m2_erp || 0);
        const computedUnitCost = baseLinerQty > 0 ? Number((totalLinerCost / baseLinerQty).toFixed(2)) : 0;
        const computedDays = Math.ceil(smoothLinerRes.days + antiSlipLinerRes.days + rivetScrewRes.days + linerlockRes.days + linerSubcontractorRes.days + linerAptRes.days + linerMicrobusRes.days);
        const computedLaborers = Math.ceil(smoothLinerRes.laborers + antiSlipLinerRes.laborers + rivetScrewRes.laborers + linerlockRes.laborers + linerSubcontractorRes.laborers + linerAptRes.laborers + linerMicrobusRes.laborers);
        u.unit_cost_liner = computedUnitCost;
        u.unit_cost_total_liner = computedUnitCost;
        u.days_to_complete_liner = computedDays;
        u.days_to_complete_total_liner = computedDays;
        u.no_of_laborers_liner = computedLaborers;
        u.no_of_laborers_total_liner = computedLaborers;
        changed = true;
    }

    // =========================================================================
    // 4. TILING WORKS
    // =========================================================================
    const processTiling = (qtyInput, searchKey, fallbackName, rowIdFlag, activityType, extraParams = {}) => {
        let qty = 0;
        if (typeof qtyInput === 'string') {
            const erpField = qtyInput.replace('_user', '_erp');
            qty = Number(u[qtyInput] || u[erpField] || 0);
        } else {
            qty = Number(qtyInput || 0);
        }
        if (qty <= 0) {
            const lenBefore = updatedBreakdown.length;
            updatedBreakdown = updatedBreakdown.filter(item => !(item[rowIdFlag] || item._spawnerid === rowIdFlag));
            if (updatedBreakdown.length !== lenBefore) changed = true;
            return { totalCost: 0, days: 0, laborers: 0, changed: false };
        }
        const res = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Tiling Works',
            searchKey: searchKey,
            fallbackName: fallbackName,
            baseQty: qty, 
            itemsDb, 
            rowIdFlag: rowIdFlag,
            responsibility: 'P.Zone',
            activityType: activityType,
            ...extraParams
        });
        if (res.changed) changed = true;
        return res;
    };

    const tilingQtyCondition = Number(u.qty_tiling_m2_user || u.qty_tiling_m2_erp || 0);
    
    let supplyTilesSearchKey = '';
    const isCeramicFinish = String(u.water_feature_tiling_type_id || '').includes('86acaacf') || 
                            String(u.water_feature_tiling_type_id || '').includes('0f870c8e') || 
                            String(u.tiles_type || '').toLowerCase().includes('ceramic');
    if (isCeramicFinish) {
        supplyTilesSearchKey = '86acaacf-f943-4845-aaeb-bd836ac641a8'; // Ceramic Tiles
    } else {
        supplyTilesSearchKey = u.water_feature_mosaic_type_id || '2e230add-9db2-413b-a970-74f4ec111524'; // Mosaic Glass
    }
    
    const supplyTilesRes = processTiling(
        tilingQtyCondition > 0 ? tilingQtyCondition : 0, 
        supplyTilesSearchKey, 
        'Supply Tiles', 
        '_isSupplyTilesAuto', 
        'Procurement'
    );

    const adhesiveMaterialId = u.adhesive_material_id || u.wf_adhesive_material || '';
    let adhesiveQty = 0;
    if (tilingQtyCondition > 0 && adhesiveMaterialId) {
        const adhesiveDetails = extractDropdownDetails(itemsDb, adhesiveMaterialId, 'Adhesive Material');
        const validSpecRate = adhesiveDetails.specificationRate > 0 ? adhesiveDetails.specificationRate : 1;
        adhesiveQty = Math.ceil(tilingQtyCondition / validSpecRate);
    }
    const tileAdhesiveRes = processTiling(adhesiveQty, adhesiveMaterialId, 'Adhesive Material', '_isTileAdhesiveAuto', 'Procurement');

    const groutMaterialId = u.grout_material_id || u.wf_grout_material || '';
    let groutQty = 0;
    if (tilingQtyCondition > 0 && groutMaterialId) {
        const groutDetails = extractDropdownDetails(itemsDb, groutMaterialId, 'Tile Grout Material');
        const validSpecRate = groutDetails.specificationRate > 0 ? groutDetails.specificationRate : 1;
        groutQty = Math.ceil(tilingQtyCondition / validSpecRate);
    }
    const tileGroutRes = processTiling(groutQty, groutMaterialId, 'Tile Grout Material', '_isTileGroutAuto', 'Procurement');

    const tilingSubcontractorRes = processTiling(
        tilingQtyCondition > 0 ? tilingQtyCondition : 0, 
        '12052f76-b43f-4343-a697-200762bfc907', 
        'Subcontractor for Tiling works', 
        '_isTilingSubcontractorAuto', 
        'Installation', {
            laborersPerGroup: 3,
            productivityRatePerDay: 25,
            daysToComplete: 5
        }
    );

    const tilingDays = tilingSubcontractorRes.days;
    const tilingLaborers = tilingSubcontractorRes.laborers;
    let tilingAptRes = { totalCost: 0, days: 0, laborers: 0, changed: false };
    let tilingMicrobusRes = { totalCost: 0, days: 0, laborers: 0, changed: false };

    if (needsAccommodation && tilingDays > 0 && tilingLaborers > 0) {
        const aptQty = Math.ceil(tilingLaborers / 6) * tilingDays;
        tilingAptRes = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Tiling Works',
            searchKey: 'Apartment class C',
            fallbackName: 'Apartment class C',
            baseQty: aptQty, 
            itemsDb, 
            rowIdFlag: '_isTilingAptAuto',
            responsibility: 'P.Zone',
            activityType: 'Accommodation'
        });
        if (tilingAptRes.changed) changed = true;

        const microbusQty = Math.ceil(tilingLaborers / 12) * tilingDays;
        tilingMicrobusRes = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Tiling Works',
            searchKey: 'Micro bus',
            fallbackName: 'Micro bus',
            baseQty: microbusQty, 
            itemsDb, 
            rowIdFlag: '_isTilingMicrobusAuto',
            responsibility: 'P.Zone',
            activityType: 'Accommodation'
        });
        if (tilingMicrobusRes.changed) changed = true;
    } else {
        const lenBefore = updatedBreakdown.length;
        updatedBreakdown = updatedBreakdown.filter(item => !(item._isTilingAptAuto || item._isTilingMicrobusAuto || item._spawnerid === '_isTilingAptAuto' || item._spawnerid === '_isTilingMicrobusAuto'));
        if (updatedBreakdown.length !== lenBefore) changed = true;
    }

    const totalTilingCost = Number((supplyTilesRes.totalCost + tileAdhesiveRes.totalCost + tileGroutRes.totalCost + tilingSubcontractorRes.totalCost + tilingAptRes.totalCost + tilingMicrobusRes.totalCost).toFixed(2));
    if (u.total_cost_tiling !== totalTilingCost) {
        u.total_cost_tiling = totalTilingCost;
        u.unit_cost_tiling = tilingQtyCondition > 0 ? Number((totalTilingCost / tilingQtyCondition).toFixed(2)) : 0;
        u.days_to_complete_tiling = Math.ceil(supplyTilesRes.days + tileAdhesiveRes.days + tileGroutRes.days + tilingSubcontractorRes.days + tilingAptRes.days + tilingMicrobusRes.days);
        u.no_of_laborers_tiling = Math.ceil(supplyTilesRes.laborers + tileAdhesiveRes.laborers + tileGroutRes.laborers + tilingSubcontractorRes.laborers + tilingAptRes.laborers + tilingMicrobusRes.laborers);
        changed = true;
    }

    // =========================================================================
    // 5. COPING STONE WORKS
    // =========================================================================
    const copingQtyCondition = Number(u.qty_stone_floor_m_user) > 0 ? Number(u.qty_stone_floor_m_user) : Number(u.qty_stone_floor_m_erp || 0);
    const processCoping = (qty, searchKey, fbName, flag, activityType, options = {}) => {
        if (qty > 0 && searchKey) {
            const res = upsertBoqRow(updatedBreakdown, {
                phaseId: currentPhaseId, 
                proposalId: activeProposalId, 
                phaseComponent: phaseComponentTarget,
                workMainCategory: 'Copping Works',
                searchKey, 
                fallbackName: fbName, 
                baseQty: qty, 
                itemsDb, 
                rowIdFlag: flag,
                responsibility: 'P.Zone',
                activityType: activityType,
                ...options
            });
            if (res.changed) changed = true;
            return res;
        } else {
            const lenBefore = updatedBreakdown.length;
            updatedBreakdown = updatedBreakdown.filter(item => !(item[flag] || item._spawnerid === flag));
            if (updatedBreakdown.length !== lenBefore) changed = true;
            return { totalCost: 0, days: 0, laborers: 0, changed: false };
        }
    };

    const copingTilesSearchKey = u.floor_tile_type_id || '';
    const supplyCopingTilesRes = processCoping(
        copingQtyCondition > 0 ? copingQtyCondition : 0, 
        copingTilesSearchKey, 
        'Coping Tile', 
        '_isSupplyCopingTilesAuto', 
        'Procurement'
    );

    const areaCoping = Number(parentWF?.water_feature_area_m2 || 0);
    let daysToCompleteCoping = 50;
    if (areaCoping <= 1000) daysToCompleteCoping = 7;
    else if (areaCoping <= 2500) daysToCompleteCoping = 7;
    else if (areaCoping <= 4000) daysToCompleteCoping = 20;
    else if (areaCoping <= 5500) daysToCompleteCoping = 20;
    else if (areaCoping <= 7000) daysToCompleteCoping = 25;
    else if (areaCoping <= 8500) daysToCompleteCoping = 31;
    else if (areaCoping <= 10000) daysToCompleteCoping = 35;
    else if (areaCoping <= 12000) daysToCompleteCoping = 40;
    else if (areaCoping <= 14000) daysToCompleteCoping = 50;
    else if (areaCoping <= 16000) daysToCompleteCoping = 60;
    else if (areaCoping <= 18000) daysToCompleteCoping = 50;
    else daysToCompleteCoping = 50;

    const copingSubcontractorRes = processCoping(
        copingQtyCondition > 0 ? copingQtyCondition : 0,
        '91749cd0-4be6-46ae-8e49-c114f2be7719',
        'Subcontractor for Coping Works',
        '_isCopingSubcontractorAuto',
        'Installation', {
            laborersPerGroup: 3,
            productivityRatePerDay: 35,
            daysToComplete: daysToCompleteCoping
        }
    );

    const sikaLasqaQty = copingQtyCondition > 0 ? copingQtyCondition / 3.1623 : 0;
    const sikaLasqaRes = processCoping(
        sikaLasqaQty,
        '061e4d20-9ca0-4ccb-83c5-44a4eb4865c0',
        'Stone Flooring: Sika Lasqa',
        '_isCopingSikaLasqaAuto',
        'Procurement'
    );

    const copingDays = copingSubcontractorRes.days;
    const copingLaborers = copingSubcontractorRes.laborers;
    let copingAptRes = { totalCost: 0, days: 0, laborers: 0, changed: false };
    let copingMicrobusRes = { totalCost: 0, days: 0, laborers: 0, changed: false };

    if (needsAccommodation && copingDays > 0 && copingLaborers > 0) {
        const aptQty = Math.ceil(copingLaborers / 6) * copingDays;
        copingAptRes = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Copping Works',
            searchKey: 'Apartment class C',
            fallbackName: 'Apartment class C',
            baseQty: aptQty, 
            itemsDb, 
            rowIdFlag: '_isCopingAptAuto',
            responsibility: 'P.Zone',
            activityType: 'Accommodation'
        });
        if (copingAptRes.changed) changed = true;

        const microbusQty = Math.ceil(copingLaborers / 12) * copingDays;
        copingMicrobusRes = upsertBoqRow(updatedBreakdown, {
            phaseId: currentPhaseId, 
            proposalId: activeProposalId, 
            phaseComponent: phaseComponentTarget,
            workMainCategory: 'Copping Works',
            searchKey: 'Micro bus',
            fallbackName: 'Micro bus',
            baseQty: microbusQty, 
            itemsDb, 
            rowIdFlag: '_isCopingMicrobusAuto',
            responsibility: 'P.Zone',
            activityType: 'Accommodation'
        });
        if (copingMicrobusRes.changed) changed = true;
    } else {
        const lenBefore = updatedBreakdown.length;
        updatedBreakdown = updatedBreakdown.filter(item => !(item._isCopingAptAuto || item._isCopingMicrobusAuto || item._spawnerid === '_isCopingAptAuto' || item._spawnerid === '_isCopingMicrobusAuto'));
        if (updatedBreakdown.length !== lenBefore) changed = true;
    }

    const totalCopingCost = Number((supplyCopingTilesRes.totalCost + copingSubcontractorRes.totalCost + sikaLasqaRes.totalCost + copingAptRes.totalCost + copingMicrobusRes.totalCost).toFixed(2));
    if (u.total_cost_stone_floor !== totalCopingCost) {
        u.total_cost_stone_floor = totalCopingCost;
        u.unit_cost_stone_floor = copingQtyCondition > 0 ? Number((totalCopingCost / copingQtyCondition).toFixed(2)) : 0;
        u.days_to_complete_stone_floor = Math.ceil(supplyCopingTilesRes.days + copingSubcontractorRes.days + sikaLasqaRes.days + copingAptRes.days + copingMicrobusRes.days);
        u.no_of_laborers_stone_floor = Math.ceil(supplyCopingTilesRes.laborers + copingSubcontractorRes.laborers + sikaLasqaRes.laborers + copingAptRes.laborers + copingMicrobusRes.laborers);
        changed = true;
    }

    // Overall total finishes civil cost
    u.totalCivilFinishesCost = Number((
        (u.total_cost_ladder || 0) +
        (u.total_cost_stucco || 0) +
        (u.total_cost_total_liner || u.total_cost_liner || 0) +
        (u.total_cost_tiling || 0) +
        (u.total_cost_stone_floor || 0)
    ).toFixed(2));

    return { ...u, proposal_breakdown_items: updatedBreakdown, _changed: changed };
};
