import { isWfLagoon, isWfOverflow } from '../../../lib/staticLookup.js';

export const getWaterFeatureFinishesDependencies = (u) => [
    u?.accommodations_required,
    u?.accommodations,
    u?.accommodation_required,
    u?.accommodation,
    u?.ladder_2_steps_no,
    u?.ladder_3_steps_no,
    u?.ladder_4_steps_no,
    u?.ladder_5_steps_no,
    u?.qty_resilient_sheet_m2_user,
    u?.qty_resilient_sheet_m2_erp,
    u?.qty_slip_resistant_vinyl_m2_user,
    u?.qty_slip_resistant_vinyl_m2_erp,
    u?.grout_material_id,
    u?.adhesive_material_id,
    u?.water_feature_mosaic_type_id,
    u?.water_feature_tiling_type_id,
    u?.qty_tiling_m2_user,
    u?.qty_tiling_m2_erp,
    u?.qty_stucco_m2_user,
    u?.qty_stucco_m2_erp,
    u?.qty_linerlock_m_user,
    u?.qty_linerlock_m_erp,
    u?.qty_rivet_nails_no_user,
    u?.qty_rivet_nails_no_erp,
    u?.add_fiberglass,
    u?.improving_material,
    u?.floor_tile_type_id,
    u?.resilient_sheet_brand_id,
    u?.resilient_sheet_type_id,
    u?.resilient_sheet_stairs_type_id,
    u?.resilient_sheet_color_id,
    u?.wf_adhesive_brand,
    u?.wf_adhesive_material,
    u?.wf_grout_brand,
    u?.wf_grout_material,
    u?.tiles_type,
    u?.coping_stone_type
];

export const calculateWaterFeatureFinishes = (u, parent) => {
    if (!u) return {};
    parent = parent || u;

    // Ladders normalisation
    u.ladder_2_steps_no = u.ladder_2_steps_no !== undefined ? u.ladder_2_steps_no : (u.ss_ladder_2_steps_no || 0);
    u.ss_ladder_2_steps_no = u.ladder_2_steps_no;
    u.ladder_3_steps_no = u.ladder_3_steps_no !== undefined ? u.ladder_3_steps_no : (u.ss_ladder_3_steps_no || 0);
    u.ss_ladder_3_steps_no = u.ladder_3_steps_no;
    u.ladder_4_steps_no = u.ladder_4_steps_no !== undefined ? u.ladder_4_steps_no : (u.ss_ladder_4_steps_no || 0);
    u.ss_ladder_4_steps_no = u.ladder_4_steps_no;
    u.ladder_5_steps_no = u.ladder_5_steps_no !== undefined ? u.ladder_5_steps_no : (u.ss_ladder_5_steps_no || 0);
    u.ss_ladder_5_steps_no = u.ladder_5_steps_no;

    // Plastering / Stucco flags
    u.add_fiberglass = u.add_fiberglass || u.add_fiberglass_stucco || 'No';
    u.add_fiberglass_stucco = u.add_fiberglass;
    u.improving_material = u.improving_material || u.improving_material_cement_mortar || 'None';
    u.improving_material_cement_mortar = u.improving_material;

    // Floor tile / Coping
    u.floor_tile_type_id = u.floor_tile_type_id || u.floor_tile_type || '';
    u.floor_tile_type = u.floor_tile_type_id;

    // Resilient sheet / Liner
    u.resilient_sheet_brand_id = u.resilient_sheet_brand_id || u.resilient_sheet_brand || parent?.resilient_sheet_brand_id || parent?.resilient_sheet_brand || '';
    u.resilient_sheet_brand = u.resilient_sheet_brand_id;
    u.resilient_sheet_type_id = u.resilient_sheet_type_id || u.wf_resilient_sheet_type || parent?.wf_resilient_sheet_type || parent?.water_feature_resilient_sheet_type || parent?.resilient_sheet_type_id || '';
    u.wf_resilient_sheet_type = u.resilient_sheet_type_id;
    u.water_feature_resilient_sheet_type = u.resilient_sheet_type_id;
    u.resilient_sheet_stairs_type_id = u.resilient_sheet_stairs_type_id || u.resilient_sheet_type_stairs || parent?.resilient_sheet_stairs_type_id || parent?.resilient_sheet_type_stairs || '';
    u.resilient_sheet_type_stairs = u.resilient_sheet_stairs_type_id;
    u.resilient_sheet_color_id = u.resilient_sheet_color_id || u.resilient_sheet_color || parent?.resilient_sheet_color_id || parent?.resilient_sheet_color || '';
    u.resilient_sheet_color = u.resilient_sheet_color_id;

    // Tiling & Mosaic
    u.water_feature_tiling_type_id = u.water_feature_tiling_type_id || u.wf_tiling_type || '';
    u.wf_tiling_type = u.water_feature_tiling_type_id;
    u.water_feature_mosaic_type_id = u.water_feature_mosaic_type_id || u.wf_mosaic_type || '2e230add-9db2-413b-a970-74f4ec111524';
    u.wf_mosaic_type = u.water_feature_mosaic_type_id;

    u.wf_adhesive_brand_id = u.wf_adhesive_brand_id || u.wf_adhesive_brand || u.adhesive_brand_id || '25b1498a-9c86-46a2-943b-9b889001a650';
    u.adhesive_brand_id = u.wf_adhesive_brand_id;
    u.wf_adhesive_brand = u.wf_adhesive_brand_id;
    u.wf_adhesive_material = u.wf_adhesive_material || u.adhesive_material_id || '687b0379-7a49-440d-a209-7eb965978b37';
    u.adhesive_material_id = u.wf_adhesive_material;

    u.wf_grout_brand_id = u.wf_grout_brand_id || u.wf_grout_brand || u.grout_brand_id || '25b1498a-9c86-46a2-943b-9b889001a650';
    u.grout_brand_id = u.wf_grout_brand_id;
    u.wf_grout_brand = u.wf_grout_brand_id;
    u.wf_grout_material = u.wf_grout_material || u.grout_material_id || '00d65ca2-3343-4583-a7ee-ac341bc5331b';
    u.grout_material_id = u.wf_grout_material;

    // Tiles Type mapping
    if (u.tiles_type !== undefined && u.tiles_type !== null && u.tiles_type !== '') {
        if (u.tiles_type === 'mosaic glass') {
            u.water_feature_tiling_type_id = '7a6d93d2-e82a-4c25-98ee-aeb686cc15f0';
            if (!u.water_feature_mosaic_type_id) {
                u.water_feature_mosaic_type_id = '2e230add-9db2-413b-a970-74f4ec111524';
            }
        } else if (u.tiles_type === 'ceramic tiles') {
            u.water_feature_tiling_type_id = '0f870c8e-c26f-4dd2-94d8-2d65806eecfe';
            u.water_feature_mosaic_type_id = '';
        } else if (u.tiles_type === 'plastering') {
            u.water_feature_tiling_type_id = '';
            u.water_feature_mosaic_type_id = '';
        }
    } else {
        if (parent) {
            const wfc = String(parent.water_feature_category_id || parent.water_feature_category || '');
            const spt = String(parent.swimming_pool_finishes_type_id || parent.swimming_pool_finishes_type || '');
            
            const isLinerWFC = wfc.includes('b040678e-1343-4def-8fc8-2d6b5850fcbf');
            const isLinerSPT = spt.includes('e68a9618-f808-49b8-bb84-08361ad96eda');
            
            if (!isLinerWFC || !isLinerSPT) {
                u.water_feature_tiling_type_id = spt;
            } else {
                u.water_feature_tiling_type_id = '';
            }
        }
        
        if (u.water_feature_tiling_type_id === '7a6d93d2-e82a-4c25-98ee-aeb686cc15f0') {
            u.tiles_type = 'mosaic glass';
        } else if (u.water_feature_tiling_type_id === '0f870c8e-c26f-4dd2-94d8-2d65806eecfe') {
            u.tiles_type = 'ceramic tiles';
        } else {
            u.tiles_type = 'plastering';
        }
    }

    // Coping Stone mapping
    if (u.coping_stone_type !== undefined && u.coping_stone_type !== null) {
        if (u.coping_stone_type === 'marble') {
            u.floor_tile_type_id = 'fd96d019-73d4-4f3e-9899-95c40b62a0a1';
        } else if (u.coping_stone_type === 'granite') {
            u.floor_tile_type_id = '94efac3b-5706-4118-ae10-1a51c9a970d8';
        } else if (u.coping_stone_type === 'artificial stone') {
            u.floor_tile_type_id = '0786cbc5-ecf9-4f77-b83d-00fc20034c09';
        }
    } else {
        if (u.floor_tile_type_id === 'fd96d019-73d4-4f3e-9899-95c40b62a0a1') {
            u.coping_stone_type = 'marble';
        } else if (u.floor_tile_type_id === '94efac3b-5706-4118-ae10-1a51c9a970d8') {
            u.coping_stone_type = 'granite';
        } else if (u.floor_tile_type_id === '0786cbc5-ecf9-4f77-b83d-00fc20034c09') {
            u.coping_stone_type = 'artificial stone';
        } else {
            u.coping_stone_type = 'marble';
            u.floor_tile_type_id = 'fd96d019-73d4-4f3e-9899-95c40b62a0a1';
        }
    }
    
    // Ladders sum
    const l2 = Number(u.ladder_2_steps_no || 0);
    const l3 = Number(u.ladder_3_steps_no || 0);
    const l4 = Number(u.ladder_4_steps_no || 0);
    const l5 = Number(u.ladder_5_steps_no || 0);
    u.qty_ladder_no_erp = l2 + l3 + l4 + l5;
    
    if (parent) {
        const wfc = String(parent.water_feature_category_id || parent.water_feature_category || parent.water_feature_type || parent.water_feature_type_id || u.water_feature_category || u.water_feature_type || '');
        
        // Island calculation
        const islandIncluded = String(parent.island_included || '').toLowerCase() === 'yes';
        let islandMath = 0;
        if (islandIncluded) {
            islandMath = (Number(parent.island_01_area_m2 || 0) + Number(parent.island_02_area_m2 || 0) + Number(parent.island_03_area_m2 || 0)) +
                         (Number(parent.island_01_perimeter_m || 0) * Number(parent.island_01_height_m || 0)) +
                         (Number(parent.island_02_perimeter_m || 0) * Number(parent.island_02_height_m || 0)) +
                         (Number(parent.island_03_perimeter_m || 0) * Number(parent.island_03_height_m || 0));
        }

        let smoothLiner_erp = 0;
        const spt = String(parent.swimming_pool_finishes_type_id || parent.swimming_pool_finishes_type || '');
        const isSmoothLinerType = spt.includes('e68a9618-f808-49b8-bb84-08361ad96eda');
        
        const isCat2 = isWfLagoon(wfc);
        const isCat1 = !isCat2;
        u._show_smooth_liner = (isCat1 && isSmoothLinerType) || isCat2;
        u._show_tiling_m2 = isCat1 && !isSmoothLinerType;

        // Smooth Liner calculation
        if (isCat1) {
            if (isSmoothLinerType) {
                const perimeter = Number(parent.water_feature_perimeter_m || 0);
                const avgHeight = Number(parent.avg_height_m || 0);
                const area = Number(parent.water_feature_area_m2 || 0);
                smoothLiner_erp = Math.ceil((perimeter * (avgHeight + 0.06 + 0.09)) + area + islandMath);
            }
        } else if (isCat2) {
            const area = Number(parent.water_feature_area_m2 || u.water_feature_area_m2 || 0);
            const extLength = Number(parent.external_walls_length_deep_part_m || parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0);
            const extHeight = Number(parent.outer_walls_height_deep_part_m || parent.avg_height_m || parent.water_deep_height_m || u.avg_height_m || 0);
            
            const hasIntWalls = String(parent.internal_external_walls_deep_part || '').toLowerCase() === 'yes';
            const intLength = Number(parent.internal_walls_length_deep_part_m || 0);
            const intHeight = Number(parent.internal_walls_height_deep_part_m || extHeight || 0);
            const intWallsMath = hasIntWalls ? (intLength * intHeight) : 0;
            
            const beachArea = Number(parent.beach_area_m2 || 0);
            
            let stairDeduction = 0;
            const stairsIncluded = String(parent.concrete_stair_steps_included || '').toLowerCase() === 'yes';
            const stairResilientSheet = String(parent.resilient_sheet_stairs_type_id || '');
            const isNotSmoothLiner = !stairResilientSheet.includes('e68a9618-f808-49b8-bb84-08361ad96eda') && stairResilientSheet !== '';
            
            if (stairsIncluded && isNotSmoothLiner) {
                const stairLength = Number(parent.lengths_of_concrete_stairs || 0);
                stairDeduction = (stairLength * extHeight) + (stairLength * extHeight * 2);
            }
            
            smoothLiner_erp = Math.ceil((area + ((extLength * extHeight) + intWallsMath) - beachArea) - stairDeduction + islandMath);
        }
        u.qty_resilient_sheet_m2_erp = smoothLiner_erp;

        // Anti-Slip Liner calculation
        let antiSlipLiner_erp = 0;
        if (isCat2) {
            const extHeight = Number(parent.outer_walls_height_deep_part_m || parent.avg_height_m || parent.water_deep_height_m || u.avg_height_m || 0);
            const beachArea = Number(parent.beach_area_m2 || 0);
            
            let loveSeatsMath = 0;
            const loveSeatsIncluded = String(parent.love_seats_included || '').toLowerCase() === 'yes';
            if (loveSeatsIncluded) {
                const lsLength = Number(parent.length_of_love_seats_m || 0);
                const lsWidth = Number(parent.width_of_love_seats_m || 0);
                loveSeatsMath = lsLength * (lsWidth + extHeight);
            }
            
            let stairAddition = 0;
            const stairsIncluded = String(parent.concrete_stair_steps_included || '').toLowerCase() === 'yes';
            const stairResilientSheet = String(parent.resilient_sheet_stairs_type_id || '');
            const isAntiSlipStairs = !stairResilientSheet.includes('e68a9618-f808-49b8-bb84-08361ad96eda') && stairResilientSheet !== '';
            
            if (stairsIncluded && isAntiSlipStairs) {
                const stairLength = Number(parent.lengths_of_concrete_stairs || 0);
                stairAddition = (stairLength * extHeight) + (stairLength * extHeight * 2);
            }
            
            antiSlipLiner_erp = Math.ceil(loveSeatsMath + beachArea + stairAddition);
        }
        u.qty_slip_resistant_vinyl_m2_erp = antiSlipLiner_erp;

        // Rivet Nails
        let rivetNails_erp = 0;
        if (isCat1 && isSmoothLinerType) {
            const perimeter = Number(parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0);
            rivetNails_erp = Math.ceil(perimeter * 2);
        } else if (isCat2) {
            const perimeter = Number(parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0);
            const totalWallLengthDeep = Number(parent.total_wall_length_deep_part_m || parent.external_walls_length_deep_part_m || perimeter || 0);
            rivetNails_erp = Math.ceil((perimeter + (2 * totalWallLengthDeep)) / 0.10);
        }
        u.qty_rivet_nails_no_erp = rivetNails_erp;

        // Linerlock
        let linerlock_erp = 0;
        if (isCat1 && isSmoothLinerType) {
            const perimeter = Number(parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0);
            linerlock_erp = Math.ceil(perimeter * 2);
        } else if (isCat2) {
            linerlock_erp = Math.ceil(Number(parent.external_walls_length_deep_part_m || parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0));
        }
        u.qty_linerlock_m_erp = linerlock_erp;

        // Wood Screws
        const finalLinerlock = Number(u.qty_linerlock_m_user) || linerlock_erp;
        u.qty_wood_screw_no_erp = Math.ceil(finalLinerlock * 0.25);

        // Tiling
        let tiling_erp = 0;
        if (isCat1 && !isSmoothLinerType) {
            const perimeter = Number(parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0);
            const avgHeight = Number(parent.avg_height_m || u.avg_height_m || 0);
            const area = Number(parent.water_feature_area_m2 || u.water_feature_area_m2 || 0);
            tiling_erp = Math.ceil((perimeter * (avgHeight + 0.06 + 0.09)) + area) + islandMath;
        }
        u.qty_tiling_m2_erp = tiling_erp;

        // Coping Stone
        let stoneFloor_erp = 0;
        const wft = String(parent.water_feature_type_id || parent.water_feature_type || '');
        const isWftOverflow = isWfOverflow(wft);
        
        if (isCat1 && !isWftOverflow) {
            stoneFloor_erp = Math.ceil(Number(parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0));
        } else if (isCat2) {
            stoneFloor_erp = Math.ceil(Number(parent.external_walls_length_deep_part_m || parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0));
        } else if (isCat1 && isWftOverflow) {
            const perimeter = Number(parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0);
            stoneFloor_erp = Math.ceil((perimeter + 1) * 2);
        }
        u.qty_stone_floor_m_erp = stoneFloor_erp;

        // Ladder sum
        u.qty_ladder_no_erp = Number(u.ladder_2_steps_no || 0) + 
                              Number(u.ladder_3_steps_no || 0) + 
                              Number(u.ladder_4_steps_no || 0) + 
                              Number(u.ladder_5_steps_no || 0);
        u.qty_ladder_no_user = u.qty_ladder_no_erp;

        // Stucco / Plastering
        let stucco_erp = 0;
        if (isCat1) {
            const perimeter = Number(parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0);
            const avgHeight = Number(parent.avg_height_m || u.avg_height_m || 0);
            const area = Number(parent.water_feature_area_m2 || u.water_feature_area_m2 || 0);
            stucco_erp = Math.ceil((perimeter * (avgHeight + 0.06 + 0.09)) + area + islandMath);
        } else if (isCat2) {
            const extLength = Number(parent.external_walls_length_deep_part_m || parent.water_feature_perimeter_m || u.water_feature_perimeter_m || 0);
            const extHeight = Number(parent.outer_walls_height_deep_part_m || parent.avg_height_m || parent.water_deep_height_m || u.avg_height_m || 0);
            
            const hasIntWalls = String(parent.internal_external_walls_deep_part || '').toLowerCase() === 'yes';
            const intLength = Number(parent.internal_walls_length_deep_part_m || 0);
            const intHeight = Number(parent.internal_walls_height_deep_part_m || extHeight || 0);
            const intWallsMath = hasIntWalls ? (intLength * intHeight) : 0;
            
            const loveSeats = Number(parent.length_of_love_seats_m || 0);
            const stairs = Number(parent.lengths_of_concrete_stairs || 0);
            
            stucco_erp = Math.ceil((extLength * extHeight) + intWallsMath + (loveSeats * 0.45) + (stairs * extHeight * 2) + islandMath);
        }
        u.qty_stucco_m2_erp = stucco_erp;
    }

    // Sync ERP quantities into user billable quantities if empty
    const syncFields = [
        { erp: 'qty_ladder_no_erp', user: 'qty_ladder_no_user' },
        { erp: 'qty_stucco_m2_erp', user: 'qty_stucco_m2_user' },
        { erp: 'qty_resilient_sheet_m2_erp', user: 'qty_resilient_sheet_m2_user' },
        { erp: 'qty_slip_resistant_vinyl_m2_erp', user: 'qty_slip_resistant_vinyl_m2_user' },
        { erp: 'qty_rivet_nails_no_erp', user: 'qty_rivet_nails_no_user' },
        { erp: 'qty_linerlock_m_erp', user: 'qty_linerlock_m_user' },
        { erp: 'qty_wood_screw_no_erp', user: 'qty_wood_screw_no_user' },
        { erp: 'qty_tiling_m2_erp', user: 'qty_tiling_m2_user' },
        { erp: 'qty_stone_floor_m_erp', user: 'qty_stone_floor_m_user' }
    ];
    syncFields.forEach(f => {
        if ((u[f.user] === undefined || u[f.user] === null || u[f.user] === '') && u[f.erp]) {
            u[f.user] = u[f.erp];
        }
    });

    // Total Liner
    const smoothLiner = Number(u.qty_resilient_sheet_m2_user) || Number(u.qty_resilient_sheet_m2_erp) || 0;
    const antiSlipLiner = Number(u.qty_slip_resistant_vinyl_m2_user) || Number(u.qty_slip_resistant_vinyl_m2_erp) || 0;
    u.qty_total_liner_m2_erp = smoothLiner + antiSlipLiner;

    // Stucco Consumables (3 cm Stucco Plastering)
    const finalStuccoQty = Number(u.qty_stucco_m2_user) || Number(u.qty_stucco_m2_erp) || 0;
    const stuccoVolTon = finalStuccoQty * 0.03;
    u.qty_stucco_vol_ton = Number(stuccoVolTon.toFixed(3));
    
    const cementQty = (stuccoVolTon * 1.5 * (1 / 5)) * 1.4;
    u.qty_cement_stucco_tons = Number(cementQty.toFixed(3));
    
    const sandQty = (stuccoVolTon * 1.5 * (4 / 5));
    u.qty_sand_stucco_m3 = Number(sandQty.toFixed(3));
    
    const waterQty = cementQty * 0.5 * 1000;
    u.qty_water_stucco_ltr = Number(waterQty.toFixed(3));
    
    const addibondQty = waterQty / 10;
    u.qty_addibond_stucco_ltr = Number(addibondQty.toFixed(3));

    return u;
};
