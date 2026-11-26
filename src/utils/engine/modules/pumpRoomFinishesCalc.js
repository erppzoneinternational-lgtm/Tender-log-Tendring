import { isWfLagoon, isWfSandBaseLagoon } from '../../../lib/staticLookup.js';

export const getPumpRoomFinishesDependencies = (u) => [
  u?.improving_material,
  u?.add_fiberglass,
  u?.epoxy_brand_id,
  u?.epoxy_material_id,
  u?.pr_ceramic_material,
  u?.bt_ceramic_material,
  u?.ceramic_material_id,
  u?.pr_adhesive_brand,
  u?.pr_adhesive_material,
  u?.pr_grout_brand,
  u?.pr_grout_material,
  u?.bt_adhesive_brand,
  u?.bt_adhesive_material,
  u?.bt_grout_brand,
  u?.bt_grout_material,
  u?.qty_stucco_m3_user,
  u?.qty_stucco_m3_erp,
  u?.qty_epoxy_m2_user,
  u?.qty_epoxy_m2_erp,
  u?.qty_tiling_m2_user,
  u?.qty_tiling_m2_erp,
  u?.qty_balance_tank_tiling_m2_user,
  u?.qty_balance_tank_tiling_m2_erp
];

export function calculatePumpRoomFinishes(formData, parentWF = null, opts = {}) {
  let u = { ...formData };
  const parent = parentWF || u;

  u.add_fiberglass = u.add_fiberglass || u.add_fiberglass_stucco || 'No';
  u.add_fiberglass_stucco = u.add_fiberglass;

  u.improving_material = u.improving_material || u.improving_material_cement_mortar || 'None';
  u.improving_material_cement_mortar = u.improving_material;

  u.epoxy_brand_id = u.epoxy_brand_id || u.epoxy_paintings_brand || '';
  u.epoxy_paintings_brand = u.epoxy_brand_id;

  u.epoxy_material_id = u.epoxy_material_id || u.epoxy_paintings_material || '';
  u.epoxy_paintings_material = u.epoxy_material_id;

  u.ceramic_material_id = u.ceramic_material_id || u.pr_ceramic_material || '86acaacf-f943-4845-aaeb-bd836ac641a8';
  u.pr_ceramic_material = u.pr_ceramic_material || u.ceramic_material_id;
  u.bt_ceramic_material = u.bt_ceramic_material || u.ceramic_material_id;

  u.pr_adhesive_brand = u.pr_adhesive_brand || '';
  u.pr_adhesive_material = u.pr_adhesive_material || '';
  u.pr_grout_brand = u.pr_grout_brand || '';
  u.pr_grout_material = u.pr_grout_material || '';

  u.bt_adhesive_brand = u.bt_adhesive_brand || '';
  u.bt_adhesive_material = u.bt_adhesive_material || '';
  u.bt_grout_brand = u.bt_grout_brand || '';
  u.bt_grout_material = u.bt_grout_material || '';

  let stucco_erp = 0;
  u._show_stucco = true;

  if (parent) {
    const proposals = opts?.proposal_data_entry || opts?.proposals || [];
    const linkedPhaseId = parent.linked_phase || parent.phase_id || u.linked_phase || u.phase_id;
    const grandparent = proposals.find((p) => String(p.id) === String(linkedPhaseId) || String(p.phase_id) === String(linkedPhaseId)) || {};

    const prPerim = Number(parent.pump_room_perimeter_m || u.pump_room_perimeter_m || 0);
    const prHeight = Number(parent.pump_room_height_m || u.pump_room_height_m || 0);
    const prArea = Number(parent.pump_room_area_m2 || u.pump_room_area_m2 || 0);

    const btPerim = Number(parent.balance_tank_perimeter_m || u.balance_tank_perimeter_m || 0);
    const btArea = Number(parent.balance_tank_area_m2 || u.balance_tank_area_m2 || 0);
    const btHeight = Number(parent.balance_tank_height_m || u.balance_tank_height_m || 0);

    const sumpitArea = Number(parent.sumpit_area_m2 || u.sumpit_area_m2 || 0);
    const sumpitHeight = Number(parent.sumpit_height_m || u.sumpit_height_m || 0);
    const sumpitPerim = Number(parent.sumpit_perimeter_m || u.sumpit_perimeter_m || 0);

    const mathPart =
      (prPerim * prHeight + prArea) +
      (btPerim * btHeight + btArea) +
      (sumpitArea + sumpitPerim * sumpitHeight);

    const wfCategory = String(grandparent.water_feature_category || grandparent.water_feature_category_id || '');
    const wfType = String(grandparent.water_feature_type || grandparent.water_feature_type_id || '');

    const isLagoon = isWfLagoon(wfCategory);
    const isSandBaseLagoon = isWfSandBaseLagoon(wfType);

    u._show_stucco = !isLagoon || isSandBaseLagoon;
    const isNotLagoon = !isLagoon;

    const calcBoqRaw = grandparent.calculate_the_pump_room_boq || grandparent.calculate_pump_room_boq;
    const isCalcBoq = calcBoqRaw === undefined ? true : (String(calcBoqRaw).toLowerCase() === 'yes' || String(calcBoqRaw).toLowerCase() === 'y' || calcBoqRaw === true);

    const numPumpRoomsRaw = grandparent.no_of_pumps_room_related_to_the_water_feature || grandparent.no_of_pump_rooms || parent.no_of_pump_rooms || u.no_of_pump_rooms;
    const numPumpRooms = (numPumpRoomsRaw === undefined || numPumpRoomsRaw === null || numPumpRoomsRaw === '') ? 1 : Number(numPumpRoomsRaw);

    const multiplier = (isNotLagoon && isCalcBoq) ? numPumpRooms : 1;

    stucco_erp = Math.ceil(mathPart) * multiplier;

    const sumpitWalls = sumpitPerim * sumpitHeight;
    const epoxy_erp = (prArea + Math.ceil(sumpitArea + sumpitWalls)) * multiplier;
    u.qty_epoxy_m2_erp = epoxy_erp;

    const tiling_erp = Math.ceil(prPerim * prHeight + prArea) * multiplier;
    u.qty_tiling_m2_erp = tiling_erp;

    const bt_tiling_erp = Math.ceil(btPerim * btHeight + btArea) * multiplier;
    u.qty_balance_tank_tiling_m2_erp = bt_tiling_erp;
  }

  u.qty_stucco_m3_erp = stucco_erp;

  if (u.qty_stucco_m3_user === undefined || u.qty_stucco_m3_user === null || u.qty_stucco_m3_user === '') {
    u.qty_stucco_m3_user = u.qty_cement_stucco_m3 ?? u.qty_stucco_m3_erp;
  }

  if (u.qty_epoxy_m2_user === undefined || u.qty_epoxy_m2_user === null || u.qty_epoxy_m2_user === '') {
    u.qty_epoxy_m2_user = u.qty_epoxy_paintings_m2 ?? u.qty_epoxy_m2_erp ?? 0;
  }

  if (u.qty_tiling_m2_user === undefined || u.qty_tiling_m2_user === null || u.qty_tiling_m2_user === '') {
    u.qty_tiling_m2_user = u.qty_pr_tiling_m2 ?? u.qty_tiling_m2_erp ?? 0;
  }
  if (u.qty_balance_tank_tiling_m2_user === undefined || u.qty_balance_tank_tiling_m2_user === null || u.qty_balance_tank_tiling_m2_user === '') {
    u.qty_balance_tank_tiling_m2_user = u.qty_bt_tiling_m2 ?? u.qty_balance_tank_tiling_m2_erp ?? 0;
  }

  u.qty_stucco_m3 = Number(u.qty_stucco_m3_user || u.qty_stucco_m3_erp || 0);
  u.qty_cement_stucco_m3 = u.qty_stucco_m3;
  const stuccoArea = u.qty_stucco_m3;
  const thicknessM = 0.03;

  u.qty_cement_stucco_vol_m3 = Number((stuccoArea * thicknessM).toFixed(3));
  const volume = u.qty_cement_stucco_vol_m3;
  u.qty_cement_for_stucco_ton = Number(((volume * 1.5 * (1 / 5)) * 1.4).toFixed(3));
  u.qty_sand_for_stucco_m3 = Number((volume * 1.5 * (4 / 5)).toFixed(3));
  u.qty_water_for_stucco_ltr = Number((u.qty_cement_for_stucco_ton * 0.5 * 1000).toFixed(1));
  u.qty_addibond_for_stucco_ltr = Number((u.qty_water_for_stucco_ltr / 10).toFixed(1));

  u.final_epoxy_area_m2 = Number(u.qty_epoxy_m2_user || u.qty_epoxy_m2_erp || 0);
  u.qty_epoxy_paintings_m2 = u.final_epoxy_area_m2;
  u.final_tiling_area_m2 = Number(u.qty_tiling_m2_user || u.qty_tiling_m2_erp || 0);
  u.qty_pr_tiling_m2 = u.final_tiling_area_m2;
  u.final_balance_tank_tiling_area_m2 = Number(u.qty_balance_tank_tiling_m2_user || u.qty_balance_tank_tiling_m2_erp || 0);
  u.qty_bt_tiling_m2 = u.final_balance_tank_tiling_area_m2;
  u.qty_total_tiling_m2_erp = u.final_tiling_area_m2 + u.final_balance_tank_tiling_area_m2;

  return u;
}
