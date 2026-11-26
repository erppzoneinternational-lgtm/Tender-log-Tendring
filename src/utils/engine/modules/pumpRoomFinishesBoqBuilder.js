// src/utils/engine/modules/pumpRoomFinishesBoqBuilder.js
import { getAllItemsDb, upsertBoqRow, extractDropdownDetails } from './pumpRoomStructuralBoqBuilder.js';

export const buildPumpRoomFinishesBoq = (u, rows = [], dropdownOptions = {}, parentWF = null) => {
  let updatedBreakdown = Array.isArray(rows) ? [...rows] : [];
  let changed = false;
  const currentPhaseId = u.phase_id || u.linked_phase || 'UNKNOWN_PHASE';
  const activeProposalId = u.project_title || u.proposal_id || u.linked_proposal || u.tender_log_id || '';
  const phaseComponentTarget = 'Pump Room - Finishes';
  const itemsDb = getAllItemsDb(dropdownOptions);
  const prArea = Number(u.pump_room_area_m2 || parentWF?.pump_room_area_m2 || 0);
  const phaseTarget = u.phase_id || u.linked_phase || '';

  const checkAccom = (val) => {
    const strVal = String(val || '').toLowerCase().trim();
    return strVal === 'yes' || strVal === 'true' || strVal === '1' || val === true || val === 1;
  };

  const matchingPhase = dropdownOptions?.phases?.find?.((p) => String(p.id) === String(phaseTarget)) || {};
  const needsAccommodation =
    checkAccom(u.accommodations_required) ||
    checkAccom(u.accommodations) ||
    checkAccom(parentWF?.accommodations_required) ||
    checkAccom(parentWF?.accommodations) ||
    checkAccom(matchingPhase?.accommodations_required) ||
    checkAccom(matchingPhase?.accommodations);

  // ==========================================
  // 1. PLASTERING WORKS (STUCCO) ENGINE
  // ==========================================
  const processStucco = (qtyInput, searchKey, fallbackName, rowIdFlag, activityType = 'Procurement', extraParams = {}) => {
    let qty = 0;
    if (typeof qtyInput === 'string') {
      qty = Number(u[qtyInput] || 0);
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
      workMainCategory: 'Plastering Works',
      searchKey,
      fallbackName,
      baseQty: qty,
      itemsDb,
      rowIdFlag,
      responsibility: 'P.Zone',
      activityType,
      ...extraParams
    });
    if (res.changed) changed = true;
    return res;
  };

  const stuccoArea = Number(u.qty_stucco_m3_user || u.qty_cement_stucco_m3 || u.qty_stucco_m3_erp || u.qty_stucco_m3 || 0);
  const waterStuccoRes = processStucco('qty_water_for_stucco_ltr', '2eb2c9f6-2d09-4c35-8a99-d4a84952b11d', 'Water for Plastering (Pump Room)', '_isWaterStuccoAuto');
  const sandStuccoRes = processStucco('qty_sand_for_stucco_m3', '9937162c-9335-4260-a211-fc6295d41ef4', 'Sand for Plastering (Pump Room)', '_isSandStuccoAuto');
  const cementStuccoRes = processStucco('qty_cement_for_stucco_ton', '2e131253-45a0-4c7d-add0-19611ef318b6', 'Cement for plastering (Pump Room)', '_isCementStuccoAuto');

  const wantsAddibond = (u.improving_material === 'Addibond 65' || u.improving_material_cement_mortar === 'Addibond 65');
  const addibondQty = wantsAddibond ? u.qty_addibond_for_stucco_ltr : 0;
  const addibondStuccoRes = processStucco(addibondQty, '3942cb95-38aa-4bca-a00a-b4ab0700a5a8', 'Addibond 65 for Plastering Works (Pump Room)', '_isAddibondStuccoAuto');

  const getPlasteringDays = (area) => {
    if (area <= 1000) return 20;
    if (area <= 2500) return 25;
    if (area <= 4000) return 40;
    return 60;
  };

  const stuccoSubRes = processStucco(stuccoArea, '1765dc0e-e15b-4262-9067-f841a254e006', 'Plastering subcontractor (Pump Room)', '_isStuccoSubAuto', 'Installation', {
    responsibility: 'P.Zone',
    laborersPerGroup: 6,
    productivityRatePerDay: 180,
    daysToComplete: getPlasteringDays(prArea)
  });
  const stuccoDays = stuccoSubRes.days || 0;
  const stuccoLaborers = stuccoSubRes.laborers || 0;

  let stuccoAptRes = { totalCost: 0, days: 0, laborers: 0, changed: false };
  let stuccoMicrobusRes = { totalCost: 0, days: 0, laborers: 0, changed: false };
  if (needsAccommodation && stuccoDays > 0 && stuccoLaborers > 0) {
    const aptQty = Math.ceil(stuccoLaborers / 6) * stuccoDays;
    stuccoAptRes = upsertBoqRow(updatedBreakdown, {
      phaseId: currentPhaseId,
      proposalId: activeProposalId,
      phaseComponent: phaseComponentTarget,
      workMainCategory: 'Plastering Works',
      searchKey: 'Apartment class C',
      fallbackName: 'Apartment class C',
      baseQty: aptQty,
      itemsDb,
      rowIdFlag: '_isStuccoAptAuto',
      responsibility: 'P.Zone',
      activityType: 'Accommodation'
    });
    if (stuccoAptRes.changed) changed = true;

    const microbusQty = Math.ceil(stuccoLaborers / 12) * stuccoDays;
    stuccoMicrobusRes = upsertBoqRow(updatedBreakdown, {
      phaseId: currentPhaseId,
      proposalId: activeProposalId,
      phaseComponent: phaseComponentTarget,
      workMainCategory: 'Plastering Works',
      searchKey: 'Micro bus',
      fallbackName: 'Micro bus',
      baseQty: microbusQty,
      itemsDb,
      rowIdFlag: '_isStuccoMicrobusAuto',
      responsibility: 'P.Zone',
      activityType: 'Accommodation'
    });
    if (stuccoMicrobusRes.changed) changed = true;
  } else {
    const lenBefore = updatedBreakdown.length;
    updatedBreakdown = updatedBreakdown.filter(item => !(item._isStuccoAptAuto || item._isStuccoMicrobusAuto || item._spawnerid === '_isStuccoAptAuto' || item._spawnerid === '_isStuccoMicrobusAuto'));
    if (updatedBreakdown.length !== lenBefore) changed = true;
  }

  const lenBeforeLegacyStucco = updatedBreakdown.length;
  updatedBreakdown = updatedBreakdown.filter(item => !(item._isFiberglassStuccoAuto || item._spawnerid === '_isFiberglassStuccoAuto'));
  if (updatedBreakdown.length !== lenBeforeLegacyStucco) changed = true;

  const totalStuccoCost = Number((waterStuccoRes.totalCost + sandStuccoRes.totalCost + cementStuccoRes.totalCost + addibondStuccoRes.totalCost + stuccoSubRes.totalCost + stuccoAptRes.totalCost + stuccoMicrobusRes.totalCost).toFixed(2));
  if (u.total_cost_stucco !== totalStuccoCost) {
    u.total_cost_stucco = totalStuccoCost;
    u.unit_cost_stucco = stuccoArea > 0 ? Number((totalStuccoCost / stuccoArea).toFixed(2)) : 0;
    u.days_to_complete_stucco = Math.ceil(waterStuccoRes.days + sandStuccoRes.days + cementStuccoRes.days + addibondStuccoRes.days + stuccoSubRes.days + stuccoAptRes.days + stuccoMicrobusRes.days);
    u.no_of_laborers_stucco = Math.ceil(waterStuccoRes.laborers + sandStuccoRes.laborers + cementStuccoRes.laborers + addibondStuccoRes.laborers + stuccoSubRes.laborers + stuccoAptRes.laborers + stuccoMicrobusRes.laborers);
    changed = true;
  }

  // ==========================================
  // 2. EPOXY PAINTINGS BOQ ENGINE
  // ==========================================
  const processEpoxy = (qtyInput, searchKey, fallbackName, rowIdFlag, activityType = 'Procurement', extraParams = {}) => {
    let qty = 0;
    if (typeof qtyInput === 'string') {
      qty = Number(u[qtyInput] || 0);
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
      workMainCategory: 'Epoxy Painting',
      searchKey,
      fallbackName,
      baseQty: qty,
      itemsDb,
      rowIdFlag,
      responsibility: 'P.Zone',
      activityType,
      ...extraParams
    });
    if (res.changed) changed = true;
    return res;
  };

  const epoxyArea = Number(u.qty_epoxy_m2_user || u.qty_epoxy_paintings_m2 || u.qty_epoxy_m2_erp || u.qty_epoxy_m2 || 0);
  const epoxyMaterialId = u.epoxy_material_id || u.epoxy_paintings_material || '';
  let epoxyQty = 0;
  if (epoxyArea > 0 && epoxyMaterialId) {
    const epoxyDetails = extractDropdownDetails(itemsDb, epoxyMaterialId, 'Epoxy Paintings Material');
    let validSpecRate = epoxyDetails.specificationRate > 0 ? epoxyDetails.specificationRate : 0;
    if (!validSpecRate) {
      if (epoxyMaterialId === '952e42ba-16ca-44a8-9bbb-8500e52a2434') validSpecRate = 5; // 2.5 kg covers 5 m²
      else if (epoxyMaterialId === 'cac62fd4-a918-45c8-8830-fa4544a9c75a') validSpecRate = 10; // 5 kg covers 10 m²
      else if (epoxyMaterialId === '1c005ea2-69f6-4fd0-9ad7-e970b230ba15') validSpecRate = 10; // 5 kg covers 10 m²
      else validSpecRate = 5;
    }
    epoxyQty = Math.ceil(epoxyArea / validSpecRate);
  }

  const epoxyMaterialRes = processEpoxy(epoxyQty, epoxyMaterialId, 'KEMAPOXY 150 QQ', '_isEpoxyMaterialAuto');

  const epoxySubcontractorRes = processEpoxy(epoxyArea, '15e0f246-eee3-421f-8381-59d88c5903f9', 'Subcontractor for Epoxy Paintings Works (Pump Room)', '_isEpoxySubAuto', 'Installation', {
    laborersPerGroup: 3,
    productivityRatePerDay: 50,
    daysToComplete: 3
  });
  const epoxyDays = epoxySubcontractorRes.days || 0;
  const epoxyLaborers = epoxySubcontractorRes.laborers || 0;

  let epoxyAptRes = { totalCost: 0, days: 0, laborers: 0, changed: false };
  let epoxyMicrobusRes = { totalCost: 0, days: 0, laborers: 0, changed: false };
  if (needsAccommodation && epoxyDays > 0 && epoxyLaborers > 0) {
    const aptQty = Math.ceil(epoxyLaborers / 6) * epoxyDays;
    epoxyAptRes = upsertBoqRow(updatedBreakdown, {
      phaseId: currentPhaseId,
      proposalId: activeProposalId,
      phaseComponent: phaseComponentTarget,
      workMainCategory: 'Epoxy Painting',
      searchKey: 'Apartment class C',
      fallbackName: 'Apartment class C',
      baseQty: aptQty,
      itemsDb,
      rowIdFlag: '_isEpoxyAptAuto',
      responsibility: 'P.Zone',
      activityType: 'Accommodation'
    });
    if (epoxyAptRes.changed) changed = true;

    const microbusQty = Math.ceil(epoxyLaborers / 12) * epoxyDays;
    epoxyMicrobusRes = upsertBoqRow(updatedBreakdown, {
      phaseId: currentPhaseId,
      proposalId: activeProposalId,
      phaseComponent: phaseComponentTarget,
      workMainCategory: 'Epoxy Painting',
      searchKey: 'Micro bus',
      fallbackName: 'Micro bus',
      baseQty: microbusQty,
      itemsDb,
      rowIdFlag: '_isEpoxyMicrobusAuto',
      responsibility: 'P.Zone',
      activityType: 'Accommodation'
    });
    if (epoxyMicrobusRes.changed) changed = true;
  } else {
    const lenBefore = updatedBreakdown.length;
    updatedBreakdown = updatedBreakdown.filter(item => !(item._isEpoxyAptAuto || item._isEpoxyMicrobusAuto || item._spawnerid === '_isEpoxyAptAuto' || item._spawnerid === '_isEpoxyMicrobusAuto'));
    if (updatedBreakdown.length !== lenBefore) changed = true;
  }

  const totalEpoxyCost = Number((epoxyMaterialRes.totalCost + epoxySubcontractorRes.totalCost + epoxyAptRes.totalCost + epoxyMicrobusRes.totalCost).toFixed(2));
  if (u.total_cost_epoxy !== totalEpoxyCost) {
    u.total_cost_epoxy = totalEpoxyCost;
    u.unit_cost_epoxy = epoxyArea > 0 ? Number((totalEpoxyCost / epoxyArea).toFixed(2)) : 0;
    u.days_to_complete_epoxy = Math.ceil(epoxyMaterialRes.days + epoxySubcontractorRes.days + epoxyAptRes.days + epoxyMicrobusRes.days);
    u.no_of_laborers_epoxy = Math.ceil(epoxyMaterialRes.laborers + epoxySubcontractorRes.laborers + epoxyAptRes.laborers + epoxyMicrobusRes.laborers);
    changed = true;
  }

  // ==========================================
  // 3. TILING WORKS BOQ ENGINE
  // ==========================================
  const processTiling = (qtyInput, searchKey, fallbackName, rowIdFlag, activityType = 'Procurement', extraParams = {}) => {
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
      searchKey,
      fallbackName,
      baseQty: qty,
      itemsDb,
      rowIdFlag,
      responsibility: 'P.Zone',
      activityType,
      ...extraParams
    });
    if (res.changed) changed = true;
    return res;
  };

  const tilingQtyCondition = Number(u.qty_tiling_m2_user || u.qty_pr_tiling_m2 || u.qty_tiling_m2_erp || u.qty_tiling_m2 || 0);
  const btTilingQtyCondition = Number(u.qty_balance_tank_tiling_m2_user || u.qty_bt_tiling_m2 || u.qty_balance_tank_tiling_m2_erp || u.qty_balance_tank_tiling_m2 || 0);
  const totalTilingArea = tilingQtyCondition + btTilingQtyCondition;

  const lenBeforeLegacyTiling = updatedBreakdown.length;
  updatedBreakdown = updatedBreakdown.filter(item => !(item._isTileAdhesiveAuto || item._isTileGroutAuto || item._spawnerid === '_isTileAdhesiveAuto' || item._spawnerid === '_isTileGroutAuto'));
  if (updatedBreakdown.length !== lenBeforeLegacyTiling) changed = true;

  // Supply Ceramic Tiles Material (Total Tiling Area)
  const ceramicMaterialId = u.pr_ceramic_material || u.ceramic_material_id || '86acaacf-f943-4845-aaeb-bd836ac641a8';
  const ceramicRes = processTiling(
    totalTilingArea,
    ceramicMaterialId,
    'Ceramic',
    '_isSupplyTilesAuto',
    'Procurement'
  );

  // PR Adhesive Material
  const prAdhesiveMaterialId = u.pr_adhesive_material || '';
  let prAdhesiveQty = 0;
  if (tilingQtyCondition > 0 && prAdhesiveMaterialId) {
    const adhesiveDetails = extractDropdownDetails(itemsDb, prAdhesiveMaterialId, 'Adhesive Material');
    const validSpecRate = adhesiveDetails.specificationRate > 0 ? adhesiveDetails.specificationRate : 1;
    prAdhesiveQty = Math.ceil(tilingQtyCondition / validSpecRate);
  }
  const prTileAdhesiveRes = processTiling(prAdhesiveQty, prAdhesiveMaterialId, 'Adhesive Material (Pump Room)', '_isPrTileAdhesiveAuto', 'Procurement');

  // PR Tile Grout Material
  const prGroutMaterialId = u.pr_grout_material || '';
  let prGroutQty = 0;
  if (tilingQtyCondition > 0 && prGroutMaterialId) {
    const groutDetails = extractDropdownDetails(itemsDb, prGroutMaterialId, 'Tile Grout Material');
    const validSpecRate = groutDetails.specificationRate > 0 ? groutDetails.specificationRate : 1;
    prGroutQty = Math.ceil(tilingQtyCondition / validSpecRate);
  }
  const prTileGroutRes = processTiling(prGroutQty, prGroutMaterialId, 'Tile Grout Material (Pump Room)', '_isPrTileGroutAuto', 'Procurement');

  // BT Adhesive Material
  const btAdhesiveMaterialId = u.bt_adhesive_material || '';
  let btAdhesiveQty = 0;
  if (btTilingQtyCondition > 0 && btAdhesiveMaterialId) {
    const adhesiveDetails = extractDropdownDetails(itemsDb, btAdhesiveMaterialId, 'Adhesive Material');
    const validSpecRate = adhesiveDetails.specificationRate > 0 ? adhesiveDetails.specificationRate : 1;
    btAdhesiveQty = Math.ceil(btTilingQtyCondition / validSpecRate);
  }
  const btTileAdhesiveRes = processTiling(btAdhesiveQty, btAdhesiveMaterialId, 'Adhesive Material (Balance Tank)', '_isBtTileAdhesiveAuto', 'Procurement');

  // BT Tile Grout Material
  const btGroutMaterialId = u.bt_grout_material || '';
  let btGroutQty = 0;
  if (btTilingQtyCondition > 0 && btGroutMaterialId) {
    const groutDetails = extractDropdownDetails(itemsDb, btGroutMaterialId, 'Tile Grout Material');
    const validSpecRate = groutDetails.specificationRate > 0 ? groutDetails.specificationRate : 1;
    btGroutQty = Math.ceil(btTilingQtyCondition / validSpecRate);
  }
  const btTileGroutRes = processTiling(btGroutQty, btGroutMaterialId, 'Tile Grout Material (Balance Tank)', '_isBtTileGroutAuto', 'Procurement');

  const tilingSubcontractorRes = processTiling(totalTilingArea, '12052f76-b43f-4343-a697-200762bfc907', 'Subcontractor for Tiling works (Pump Room)', '_isTilingSubcontractorAuto', 'Installation', {
    laborersPerGroup: 3,
    productivityRatePerDay: 25,
    daysToComplete: 5
  });
  const tilingDays = tilingSubcontractorRes.days || 0;
  const tilingLaborers = tilingSubcontractorRes.laborers || 0;

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

  const totalTilingCost = Number((ceramicRes.totalCost + prTileAdhesiveRes.totalCost + prTileGroutRes.totalCost + btTileAdhesiveRes.totalCost + btTileGroutRes.totalCost + tilingSubcontractorRes.totalCost + tilingAptRes.totalCost + tilingMicrobusRes.totalCost).toFixed(2));
  if (u.total_cost_tiling !== totalTilingCost) {
    u.total_cost_tiling = totalTilingCost;
    u.unit_cost_tiling = totalTilingArea > 0 ? Number((totalTilingCost / totalTilingArea).toFixed(2)) : 0;
    u.days_to_complete_tiling = Math.ceil(ceramicRes.days + prTileAdhesiveRes.days + prTileGroutRes.days + btTileAdhesiveRes.days + btTileGroutRes.days + tilingSubcontractorRes.days + tilingAptRes.days + tilingMicrobusRes.days);
    u.no_of_laborers_tiling = Math.ceil(ceramicRes.laborers + prTileAdhesiveRes.laborers + prTileGroutRes.laborers + btTileAdhesiveRes.laborers + btTileGroutRes.laborers + tilingSubcontractorRes.laborers + tilingAptRes.laborers + tilingMicrobusRes.laborers);
    changed = true;
  }

  return { ...u, proposal_breakdown_items: updatedBreakdown, _changed: changed };
};
