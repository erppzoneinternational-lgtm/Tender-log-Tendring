// src/utils/engine/modules/pumpRoomStructuralBoqBuilder.js
import { calculatePumpRoomStructural } from './pumpRoomStructuralCalc.js';

const safeParseDb = (val) => parseFloat(String(val || 0).replace(/,/g, '').replace(/\$/g, '').trim()) || 0;
const safeParsePct = (val) => {
    let num = parseFloat(String(val || 0).replace(/,/g, '').replace(/%/g, '').trim()) || 0;
    if (num > 0 && num <= 1) num *= 100;
    return num;
};

export const safeExtractPrice = (obj) => {
    if (!obj) return 0;
    const rawPrice = String(
        obj['Unit Cost'] || obj['Cost'] || obj['UNIT PRICE'] || obj['Unit Price'] ||
        obj.item_cost || obj.unit_price || obj.unit_cost || obj.price || obj.rate || obj.default_price || 
        obj.items?.item_cost || obj.items?.unit_price || obj.items?.unit_cost || obj.items?.price || 0
    );
    return parseFloat(rawPrice.replace(/,/g, '').replace(/\$/g, '')) || 0;
};

export function getAllItemsDb(dropdownOptions) {
    let db = [];
    const gRollups = typeof window !== 'undefined' ? (window.__erp_global_rollups || {}) : {};
    
    const tablesToMerge = [
        'items', 'items_database', 'civil_material_types', 'finishes_type', 'finishes_types',
        'finishes_category', 'finishes_categories', 'proposal_items_database',
        'items_database_materials_cost_per_pzone', 'items_database_water_features_finishes_costs',
        'items_database_subcontractors', 'items_database_labours_accomodation_and_meals',
        'items_database_man_power', 'Items'
    ];
    tablesToMerge.forEach(key => {
        if (Array.isArray(dropdownOptions?.[key])) db = db.concat(dropdownOptions[key]);
        if (Array.isArray(gRollups?.[key])) db = db.concat(gRollups[key]);
    });
    return db;
}

export const DB_ITEM_NAME_FALLBACKS = {
    // civil_material_types IDs & Items IDs for Plain Concrete
    '6494ee09-4be6-4bc2-af85-983fc15df4b6': 'Ready-mixed Concrete for Plain concrete 15 N/mm²',
    'daa27b0c-d1d5-4d13-8361-430487dc3f7c': 'Ready-mixed Concrete for Plain concrete 15 N/mm²',
    '3bc9482b-8664-43cb-93e5-7975b318d184': 'Ready-mixed Concrete for Plain concrete 20 N/mm²',
    'a4e313a3-2009-4878-a66e-5a9178a08d0a': 'Ready-mixed Concrete for Plain concrete 20 N/mm²',
    '15264b4c-9f8d-4a11-a83d-3b7c25091724': 'Ready-mixed Concrete for Plain concrete 25 N/mm²',
    'ab0c6e75-d851-42cc-acb5-4680380b50c3': 'Ready-mixed Concrete for Plain concrete 25 N/mm²',

    // civil_material_types IDs & Items IDs for Reinforced Concrete
    '238698bf-4952-4752-9bc5-e87f6f1bfd8c': 'Ready-mixed Concrete for Reinforced concrete 25 N/mm²',
    '4e8b5ca6-4570-417f-97b9-bdf199aa012a': 'Ready-mixed Concrete for Reinforced concrete 25 N/mm²',
    '343e0e75-e089-4a0b-93df-40cb6c5c00e1': 'Ready-mixed Concrete for Reinforced concrete 30 N/mm²',
    'd1c44be1-b986-4993-9939-a19fb793b214': 'Ready-mixed Concrete for Reinforced concrete 30 N/mm²',
    'c2e432a5-ebca-4f51-a9c2-55f69c6cfaf1': 'Ready-mixed Concrete for Reinforced concrete 35 N/mm²',
    'a1923c48-9211-4746-a6e5-e61e2e6daca9': 'Ready-mixed Concrete for Reinforced concrete 35 N/mm²',

    // Steel Rebar
    'c3260aa7-7108-4e89-be21-eaae7c68832a': 'Steel Rebar ⌀ 10mm',
    'ce2ed151-3c6c-43e2-bbeb-8f1f1bef9702': 'Steel Rebar ⌀ 10mm',
    '3c990ba8-6f68-45e0-b6f7-b088cf9f1406': 'Steel Rebar ⌀ 12mm',
    '814b9a89-31e5-4fe4-8809-a0c5dbddf74d': 'Steel Rebar ⌀ 12mm',
    'ba81ae80-60b6-45a7-96a9-8d769c3a3fe4': 'Steel Rebar ⌀ 16mm',
    '20c2a434-42d2-4ed3-b088-aa234de79fff': 'Steel Rebar ⌀ 16mm',

    // Polyethylene Sheet
    '9ec4df2b-c8ff-4537-b505-ff24a6e54f98': 'Armada DPE Geomembrane 400 micron',
    '8c665915-e095-4da7-9d9d-e8477e1295ec': 'Armada DPE Geomembrane 400 micron',
    'fdf85a1a-3d23-40f4-81ae-d6981cf0ec18': 'Shouman DPE Geomembrane 400 micron',
    'cc67f864-bdf0-4091-b3f4-7db297fc35ab': 'Shouman DPE Geomembrane 400 micron',

    // Waterproofing, Additives & Materials
    '8e8ef6e6-9943-455b-b9fb-1c4b78bb932a': 'Masterseal 501',
    '3395c5ef-1a41-47fe-bb08-01e4aeb0268a': 'Masterseal 588',
    'a5c99837-9b3c-4031-bbb4-b13bbfef5be8': 'masterseal 681',
    '141f6eb6-0eaa-4d32-b091-019b7e8640d5': 'Ceroplast',
    '89731c2e-01ff-4b0b-b523-d67144f82093': 'Sika Bitumen - w',
    'daaf37a1-3345-4399-b412-1bbd05d2a460': 'Sika Bitucoat - M',
    'af1b70e6-e46e-4711-a2c8-b2b152691a18': 'Insucoat - WB',
    '779d5d0d-5113-4732-acb1-1b99b7cdb93e': 'Insuprimer',
    '2780d58f-3311-4c7c-b4c4-b9cd8f88a638': 'Bitucoat',
    'debffd2d-3348-4a70-aa0a-c4145099ff82': 'Bitunil - Primanil',
    '51d71e10-d0a3-4c03-bd27-1d93345744ff': 'Bitumode Alpha - P Anti Root 4mm',
    '44377311-fa5c-4f02-85bc-58abe262b1ad': 'Bitumode Gamma - P 4mm',
    '2a35452e-9c2d-4d8c-8a1a-689bb5b30580': 'Bitumode Beta - P 4mm',
    '83d56e44-35e7-447e-bfef-5f8d5f0f700d': 'Bitumode - Delta - P 4mm',
    '3cfc7af8-20f3-4bea-9f5e-0a47a259e4aa': 'Masterseal 732AT 4mm',
    '90649a11-8d46-431e-996e-829469fcde2a': 'Sika Bit Pro 4mm',
    '1952189f-abe2-4593-a62b-a420851eda80': 'Membranil CMB 4mm',
    '48345ef5-ce97-4175-8930-463876e374c2': 'Insutech - APP ANTIROOT',
    '93418ed4-fd56-4956-a409-49fb3a215236': 'Insutech - APP ANTIROOT',
    '555c6c16-854d-449a-b145-8268d991f29d': 'Insutech N 4mm',
    '18fa4190-5fb5-42e8-97e2-d64e51222132': 'Insutech N 4mm',
    '13b269b0-262a-4ef9-add2-f85f68ace6fe': 'Bitunil - Bituguard 4 mm',
    'c49b8b69-dc0f-436b-be5b-c5958dd19d5b': 'Bitunil - Bituguard 4 mm',
    'aafb3b9b-b7ed-4245-b6c6-5411569633ae': 'Bitunil - Bituguarden - Anti Root 4 mm',
    '3916f02b-76af-43fb-a968-a3641953c709': 'Bitunil - Bituguarden - Anti Root 4 mm',
    '2d43472a-b804-4742-a1a7-b72e53b360a4': 'masterseal 521',
    'e5fbfaba-2cfc-49c0-b0a5-72085d421289': 'masterseal 541',
    '3a752e2a-ba19-4f44-b51b-d4068e02cd2e': 'masterseal 550',
    '0f9e8ac4-b4a2-4e0c-b7e5-454b9e1fbc3f': 'masterseal 599',
    'e8212c72-ea9f-4d32-801e-fa5891877509': 'Sika top seal 107',
    '8298f657-eb01-4271-ac90-e3b14b65bdaf': 'Addicur E2',
    '18e7d8a5-cd50-4832-8eee-3ff9aa7127b8': 'Addicur E2 BR',
    'e0d55ddf-df78-41c0-a0d7-13100f8ebd1b': 'Wood For Plain Concrete',
    'e4be903c-63f2-4185-a908-283cb48afe03': 'wood for Reinforced Concrete formwork',
    'dcf713e9-afca-44fe-a577-2cab176f1d2d': 'Supply Coffor Panels',
    '8a44d702-32d3-4805-948a-91d0ec466034': 'Nails for RC formwork',
    'f81aabf5-fedd-4591-8c28-57ced841ef04': 'Nails for Plain Concrete formwork',
    'a6fbe852-6712-4015-8fb9-ad9919f2a9fb': 'Subcontractor - Excavation by Equipment',
    'f5fa7506-b946-4491-aa96-d0263cb23614': 'Cementitious Waterproofing: Sikagrout Ar - 200',
    '19236bf1-35b7-40f2-b540-7b88975aaac8': 'Bituminous Waterproofing: Sikagrout ® - 200 for waterproofing works',
    '77c2e988-18cd-4fdc-9740-2eb7518156eb': 'Cartonal N-1300 3mm',
    '7b89b71a-62b1-4e5d-8aee-ea13c04a3a0b': 'Subcontractor for executing Membrane Waterproofing works',
    'afe8f2ee-9cf4-4aa7-bf45-a13c31ab03c4': 'Subcontractor for executing Bituminious Waterproofing works',
    '334c8a56-bc1b-4e99-a0cc-145990629262': 'Cement For External waterproofing',
    '0d573b92-3daf-43a6-b17a-1e6217fe1ee5': 'Sand For External waterproofing',
    '5db396fb-3ae1-4293-aeb5-b4933d9c3b78': 'Water For External water proofing',
    '88d4fa63-1df6-4286-b7cb-15ecbc7f4dd0': 'Addibond for External Water Proofing'
};

export const DB_ITEM_PRICE_FALLBACKS = {
    // Plain Concrete
    '6494ee09-4be6-4bc2-af85-983fc15df4b6': 2500,
    'daa27b0c-d1d5-4d13-8361-430487dc3f7c': 2500,
    '3bc9482b-8664-43cb-93e5-7975b318d184': 2500,
    'a4e313a3-2009-4878-a66e-5a9178a08d0a': 2500,
    '15264b4c-9f8d-4a11-a83d-3b7c25091724': 2500,
    'ab0c6e75-d851-42cc-acb5-4680380b50c3': 2500,

    // Reinforced Concrete
    '238698bf-4952-4752-9bc5-e87f6f1bfd8c': 2650,
    '4e8b5ca6-4570-417f-97b9-bdf199aa012a': 2650,
    '343e0e75-e089-4a0b-93df-40cb6c5c00e1': 2650,
    'd1c44be1-b986-4993-9939-a19fb793b214': 2650,
    'c2e432a5-ebca-4f51-a9c2-55f69c6cfaf1': 2650,
    'a1923c48-9211-4746-a6e5-e61e2e6daca9': 2650,

    // Steel Rebar
    'c3260aa7-7108-4e89-be21-eaae7c68832a': 45000,
    'ce2ed151-3c6c-43e2-bbeb-8f1f1bef9702': 45000,
    '3c990ba8-6f68-45e0-b6f7-b088cf9f1406': 45000,
    '814b9a89-31e5-4fe4-8809-a0c5dbddf74d': 45000,
    'ba81ae80-60b6-45a7-96a9-8d769c3a3fe4': 45000,
    '20c2a434-42d2-4ed3-b088-aa234de79fff': 45000,

    // Polyethylene Sheet
    '9ec4df2b-c8ff-4537-b505-ff24a6e54f98': 25,
    '8c665915-e095-4da7-9d9d-e8477e1295ec': 25,
    'fdf85a1a-3d23-40f4-81ae-d6981cf0ec18': 25,
    'cc67f864-bdf0-4091-b3f4-7db297fc35ab': 25,

    // Membrane Waterproofing (Anti-Root Sheet - 530 EGP per roll)
    '51d71e10-d0a3-4c03-bd27-1d93345744ff': 530,
    '44377311-fa5c-4f02-85bc-58abe262b1ad': 530,
    '2a35452e-9c2d-4d8c-8a1a-689bb5b30580': 530,
    '83d56e44-35e7-447e-bfef-5f8d5f0f700d': 530,
    '3cfc7af8-20f3-4bea-9f5e-0a47a259e4aa': 530,
    '90649a11-8d46-431e-996e-829469fcde2a': 530,
    '1952189f-abe2-4593-a62b-a420851eda80': 530,
    '93418ed4-fd56-4956-a409-49fb3a215236': 530,
    '48345ef5-ce97-4175-8930-463876e374c2': 530,
    '18fa4190-5fb5-42e8-97e2-d64e51222132': 530,
    '555c6c16-854d-449a-b145-8268d991f29d': 530,
    '13b269b0-262a-4ef9-add2-f85f68ace6fe': 530,
    'c49b8b69-dc0f-436b-be5b-c5958dd19d5b': 530,
    'aafb3b9b-b7ed-4245-b6c6-5411569633ae': 530,
    '3916f02b-76af-43fb-a968-a3641953c709': 530,

    // Bituminous Waterproofing (Primer / Liquid)
    '89731c2e-01ff-4b0b-b523-d67144f82093': 3500,
    'daaf37a1-3345-4399-b412-1bbd05d2a460': 3500,
    'af1b70e6-e46e-4711-a2c8-b2b152691a18': 450,
    '779d5d0d-5113-4732-acb1-1b99b7cdb93e': 3200,
    '2780d58f-3311-4c7c-b4c4-b9cd8f88a638': 3000,
    'debffd2d-3348-4a70-aa0a-c4145099ff82': 3200,

    // Protection board
    '77c2e988-18cd-4fdc-9740-2eb7518156eb': 100,

    // Subcontractors
    '7b89b71a-62b1-4e5d-8aee-ea13c04a3a0b': 70,
    'afe8f2ee-9cf4-4aa7-bf45-a13c31ab03c4': 70,

    // Screed consumables
    '334c8a56-bc1b-4e99-a0cc-145990629262': 5000,
    '0d573b92-3daf-43a6-b17a-1e6217fe1ee5': 250,
    '5db396fb-3ae1-4293-aeb5-b4933d9c3b78': 20,
    '88d4fa63-1df6-4286-b7cb-15ecbc7f4dd0': 160,
    '19236bf1-35b7-40f2-b540-7b88975aaac8': 300,

    // Wood, Panels, Nails & Subcontractors
    'e0d55ddf-df78-41c0-a0d7-13100f8ebd1b': 17000,
    'e4be903c-63f2-4185-a908-283cb48afe03': 17000,
    'dcf713e9-afca-44fe-a577-2cab176f1d2d': 600,
    '8a44d702-32d3-4805-948a-91d0ec466034': 40,
    'f81aabf5-fedd-4591-8c28-57ced841ef04': 40,
    'a6fbe852-6712-4015-8fb9-ad9919f2a9fb': 80,
    'f5fa7506-b946-4491-aa96-d0263cb23614': 45
};

export const DB_ITEM_SPEC_RATE_FALLBACKS = {
    // Membrane (9 m² per roll)
    '51d71e10-d0a3-4c03-bd27-1d93345744ff': 9,
    '44377311-fa5c-4f02-85bc-58abe262b1ad': 9,
    '2a35452e-9c2d-4d8c-8a1a-689bb5b30580': 9,
    '83d56e44-35e7-447e-bfef-5f8d5f0f700d': 9,
    '3cfc7af8-20f3-4bea-9f5e-0a47a259e4aa': 9,
    '90649a11-8d46-431e-996e-829469fcde2a': 9,
    '1952189f-abe2-4593-a62b-a420851eda80': 9,
    '93418ed4-fd56-4956-a409-49fb3a215236': 9,
    '48345ef5-ce97-4175-8930-463876e374c2': 9,
    '18fa4190-5fb5-42e8-97e2-d64e51222132': 9,
    '555c6c16-854d-449a-b145-8268d991f29d': 9,
    '13b269b0-262a-4ef9-add2-f85f68ace6fe': 9,
    'c49b8b69-dc0f-436b-be5b-c5958dd19d5b': 9,
    'aafb3b9b-b7ed-4245-b6c6-5411569633ae': 9,
    '3916f02b-76af-43fb-a968-a3641953c709': 9,

    // Primer (m² per drum/unit)
    '89731c2e-01ff-4b0b-b523-d67144f82093': 333.33,
    'daaf37a1-3345-4399-b412-1bbd05d2a460': 333.33,
    'af1b70e6-e46e-4711-a2c8-b2b152691a18': 29.85,
    '779d5d0d-5113-4732-acb1-1b99b7cdb93e': 300,
    '2780d58f-3311-4c7c-b4c4-b9cd8f88a638': 180,
    'debffd2d-3348-4a70-aa0a-c4145099ff82': 166.67
};

export const DB_ITEM_UNIT_FALLBACKS = {
    '51d71e10-d0a3-4c03-bd27-1d93345744ff': 'Roll 1 x 10 m',
    '44377311-fa5c-4f02-85bc-58abe262b1ad': 'Roll 1 x 10 m',
    '2a35452e-9c2d-4d8c-8a1a-689bb5b30580': 'Roll 1 x 10 m',
    '83d56e44-35e7-447e-bfef-5f8d5f0f700d': 'Roll 1 x 10 m',
    '3cfc7af8-20f3-4bea-9f5e-0a47a259e4aa': 'Roll 1 x 10 m',
    '90649a11-8d46-431e-996e-829469fcde2a': 'Roll 1 x 10 m',
    '1952189f-abe2-4593-a62b-a420851eda80': 'Roll 1 x 10 m',
    '93418ed4-fd56-4956-a409-49fb3a215236': 'Roll 1 x 10 m',
    '48345ef5-ce97-4175-8930-463876e374c2': 'Roll 1 x 10 m',
    '18fa4190-5fb5-42e8-97e2-d64e51222132': 'Roll 1 x 10 m',
    '555c6c16-854d-449a-b145-8268d991f29d': 'Roll 1 x 10 m',
    '13b269b0-262a-4ef9-add2-f85f68ace6fe': 'Roll 1 x 10 m',
    'c49b8b69-dc0f-436b-be5b-c5958dd19d5b': 'Roll 1 x 10 m',
    'aafb3b9b-b7ed-4245-b6c6-5411569633ae': 'Roll 1 x 10 m',
    '3916f02b-76af-43fb-a968-a3641953c709': 'Roll 1 x 10 m',

    '89731c2e-01ff-4b0b-b523-d67144f82093': '200 kg',
    'daaf37a1-3345-4399-b412-1bbd05d2a460': '200 kg',
    'af1b70e6-e46e-4711-a2c8-b2b152691a18': '20 kg',
    '779d5d0d-5113-4732-acb1-1b99b7cdb93e': '180 liters',
    '2780d58f-3311-4c7c-b4c4-b9cd8f88a638': '180 liters',
    'debffd2d-3348-4a70-aa0a-c4145099ff82': '200 liters',
    '77c2e988-18cd-4fdc-9740-2eb7518156eb': 'Board'
};

export function extractDropdownDetails(itemsDb, searchIdRaw, fallbackName) {
    if (!searchIdRaw) return { name: fallbackName, unit: "m³", unitCost: 0, extraPct: 0, found: false };
    const searchId = String(searchIdRaw).trim().toLowerCase();
    
    // 1. Check if searchId directly matches a civil_material_types or finishes_type record by id or item_id
    const matchedCivil = itemsDb.find(d => d && (String(d.id || '').toLowerCase() === searchId || String(d.item_id || '').toLowerCase() === searchId) && d.item_id);
    const targetItemId = matchedCivil ? String(matchedCivil.item_id).toLowerCase() : searchId;

    // 2. Find in items / itemsDb (prefer direct items row without wrapper item_id)
    const directItemMatch = itemsDb.find(dbItem => dbItem && !dbItem.item_id && String(dbItem.id || '').toLowerCase() === targetItemId);
    const matchedItem = directItemMatch || itemsDb.find((dbItem) => {
        if (!dbItem) return false;
        const name1 = String(dbItem['ITEM NAME'] || '').toLowerCase();
        const name2 = String(dbItem.item_name || dbItem.items?.item_name || '').toLowerCase();
        const name3 = String(dbItem.Name || '').toLowerCase();
        const id1 = String(dbItem.id || '').toLowerCase();
        const itemId1 = String(dbItem.item_id || '').toLowerCase();
        
        // Exact ID match
        if (id1 === targetItemId || id1 === searchId) return true;

        // Item ID match for nested items
        if (itemId1 && (itemId1 === targetItemId || itemId1 === searchId)) return true;

        // Exact or fuzzy Name match
        if (name1 && (name1 === targetItemId || name1 === searchId || name1.includes(searchId) || name1.includes(targetItemId))) return true;
        if (name2 && (name2 === targetItemId || name2 === searchId || name2.includes(searchId) || name2.includes(targetItemId))) return true;
        if (name3 && (name3 === targetItemId || name3 === searchId || name3.includes(searchId) || name3.includes(targetItemId))) return true;

        return false;
    }) || {};

    const civilTypeItem = matchedCivil || itemsDb.find(dbItem => dbItem && (String(dbItem.item_id || '').toLowerCase() === targetItemId || String(dbItem.id || '').toLowerCase() === searchId));
    
    const rawExtra = String(matchedItem['PERCENTAGE FOR EXTRA AMOUNT'] || matchedItem['Percentage for Extra Amount'] || matchedItem.percentage_for_extra_amount || matchedItem.extra_amount_percentage || matchedItem.items?.percentage_for_extra_amount || matchedItem.items?.extra_amount_percentage || (targetItemId.includes('rebar') || targetItemId.includes('poly') || targetItemId.includes('nail') || targetItemId.includes('membrane') ? 5 : 0));
    const parsedExtraPct = safeParsePct(rawExtra) || 0; 
    let parsedUnitCost = safeExtractPrice(matchedItem); 
    if (parsedUnitCost === 0 && (DB_ITEM_PRICE_FALLBACKS[targetItemId] || DB_ITEM_PRICE_FALLBACKS[searchId])) {
        parsedUnitCost = DB_ITEM_PRICE_FALLBACKS[targetItemId] || DB_ITEM_PRICE_FALLBACKS[searchId];
    }
    
    const rawSpecRate = civilTypeItem && civilTypeItem.specification_rate !== undefined && civilTypeItem.specification_rate !== null
        ? String(civilTypeItem.specification_rate)
        : String(matchedItem['SPECIFICATION RATE'] || matchedItem['Specification rate'] || matchedItem['Specification Rate'] || matchedItem.specification_rate || matchedItem.items?.specification_rate || DB_ITEM_SPEC_RATE_FALLBACKS[targetItemId] || DB_ITEM_SPEC_RATE_FALLBACKS[searchId] || 1);
    const parsedSpecRate = parseFloat(rawSpecRate) || 1;
    const rawLaborers = String(matchedItem['NO. OF LABORERS PER GROUP'] || matchedItem['No. of Laborers Per Group'] || matchedItem.laborers_per_group || matchedItem.items?.laborers_per_group || 0);
    const parsedLaborers = parseFloat(rawLaborers) || 0;
    const rawProd = String(matchedItem['PRODUCTIVITY RATE PER DAY'] || matchedItem['Productivity Rate Per Day'] || matchedItem.productivity_rate_per_day || matchedItem.items?.productivity_rate_per_day || 0);
    const parsedProd = parseFloat(rawProd) || 0;

    const resolvedName = matchedItem['ITEM NAME'] || matchedItem['Item Name'] || matchedItem.item_name || matchedItem.items?.item_name || matchedItem.Name || DB_ITEM_NAME_FALLBACKS[targetItemId] || DB_ITEM_NAME_FALLBACKS[searchId] || fallbackName;
    let resolvedUnit = matchedItem['UNIT'] || matchedItem['Unit'] || matchedItem.unit || matchedItem.items?.unit || (civilTypeItem?.item_unit) || DB_ITEM_UNIT_FALLBACKS[targetItemId] || DB_ITEM_UNIT_FALLBACKS[searchId];
    if (!resolvedUnit || resolvedUnit === 'm³') {
        const checkStr = `${resolvedName} ${fallbackName}`.toLowerCase();
        if (
            checkStr.includes('gland') || checkStr.includes('switch') || checkStr.includes('panel') || 
            checkStr.includes('transformer') || checkStr.includes('pump') || checkStr.includes('filter') || 
            checkStr.includes('heater') || checkStr.includes('socket') || checkStr.includes('box') || 
            checkStr.includes('coupler') || checkStr.includes('adapter') || checkStr.includes('strap') || 
            checkStr.includes('elbow') || checkStr.includes('tee') || checkStr.includes('clamp') || 
            checkStr.includes('plate') || checkStr.includes('stud') || checkStr.includes('anchor') || 
            checkStr.includes('pit') || checkStr.includes('rod') || checkStr.includes('weld') ||
            checkStr.includes('fan') || checkStr.includes('light') || checkStr.includes('drain') || 
            checkStr.includes('inlet') || checkStr.includes('valve')
        ) {
            resolvedUnit = 'No.';
        } else if (checkStr.includes('roll') || checkStr.includes('membrane') || checkStr.includes('antiroot') || checkStr.includes('anti root') || checkStr.includes('insutech') || checkStr.includes('bitumode') || checkStr.includes('bitunil') || checkStr.includes('sikabit')) {
            resolvedUnit = 'Roll 1 x 10 m';
        } else if (checkStr.includes('bitumen - w') || checkStr.includes('bitucoat') || checkStr.includes('ceroplast')) {
            resolvedUnit = '200 kg';
        } else if (checkStr.includes('cartonal')) {
            resolvedUnit = 'Board';
        } else if (checkStr.includes('cable') || checkStr.includes('conduit') || checkStr.includes('pipe') || checkStr.includes('tray') || checkStr.includes('hose')) {
            resolvedUnit = 'm';
        } else if (!resolvedUnit) {
            resolvedUnit = 'm³';
        }
    }

    return {
        id: matchedItem.item_id || civilTypeItem?.item_id || matchedItem.id || targetItemId || searchIdRaw,
        name: resolvedName,
        unit: resolvedUnit,
        unitCost: safeParseDb(parsedUnitCost),
        extraPct: safeParseDb(parsedExtraPct),
        specificationRate: parsedSpecRate,
        laborers: parsedLaborers,
        productivity: parsedProd,
        found: !!(matchedItem.id || matchedCivil || DB_ITEM_NAME_FALLBACKS[targetItemId] || DB_ITEM_NAME_FALLBACKS[searchId])
    };
}

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export function upsertBoqRow(updatedBreakdown, params) {
    const { 
        phaseId, proposalId, phaseComponent, workMainCategory, 
        searchKey, fallbackName, baseQty, itemsDb, rowIdFlag, 
        responsibility = 'P.Zone', activityType = 'Procurement',
        laborersPerGroup = 0, productivityRatePerDay = 0, daysToComplete = 0
    } = params;
    
    if (baseQty <= 0) {
        const detailsForDestroy = extractDropdownDetails(itemsDb, searchKey, fallbackName);
        const idx = updatedBreakdown.findIndex(item => {
            const itemSpawner = String(item._spawnerid || item._spawnerId || '').trim().toLowerCase();
            const targetSpawner = String(rowIdFlag).trim().toLowerCase();
            if (String(item.phase_id || '').toLowerCase() !== String(phaseId || '').toLowerCase()) return false;
            const isMatch = (item[rowIdFlag] === true) || 
                (itemSpawner !== '' && itemSpawner === targetSpawner) ||
                (
                    (itemSpawner === '' || itemSpawner === undefined) &&
                    (item._isAutoGenerated || item._isautogenerated) && 
                    String(item.work_main_category || item.main_category).toLowerCase().trim() === String(workMainCategory).toLowerCase().trim() && 
                    (
                        String(item.item).toLowerCase().trim() === String(detailsForDestroy.name).toLowerCase().trim() || 
                        String(item.item).toLowerCase().trim() === String(searchKey).toLowerCase().trim()
                    )
                );
            return isMatch;
        });
        if (idx >= 0) updatedBreakdown.splice(idx, 1);
        return { totalCost: 0, days: 0, laborers: 0, changed: idx >= 0 };
    }

    const details = extractDropdownDetails(itemsDb, searchKey, fallbackName);
    const finalQty = baseQty * (1 + (details.extraPct / 100));
    const totalCost = finalQty * details.unitCost;
    
    const effLaborersGroup = laborersPerGroup || details.laborers || 0;
    const effProdRate = productivityRatePerDay || details.productivity || 0;
    
    let effDays = daysToComplete || 0;
    if (effDays === 0 && effProdRate > 0) {
        effDays = Math.ceil(baseQty / effProdRate);
    }
    
    let computedLaborersPerDay = 0;
    let groupsNeeded = 0;
    let plannedAmountPerDay = 0;
    if (effDays > 0 && effProdRate > 0) {
        const requiredTotalDays = baseQty / effProdRate;
        groupsNeeded = Math.ceil(requiredTotalDays / effDays);
        computedLaborersPerDay = groupsNeeded * effLaborersGroup;
        plannedAmountPerDay = effProdRate * groupsNeeded;
    }
    
    let changed = false;
    let indices = [];
    for (let i = 0; i < updatedBreakdown.length; i++) {
        const item = updatedBreakdown[i];
        const itemSpawner = String(item._spawnerid || item._spawnerId || '').trim().toLowerCase();
        const targetSpawner = String(rowIdFlag).trim().toLowerCase();
        
        const isMatch = String(item.phase_id || '').toLowerCase() === String(phaseId || '').toLowerCase() && (
            (item[rowIdFlag] === true) || 
            (itemSpawner !== '' && itemSpawner === targetSpawner) ||
            (
                (itemSpawner === '' || itemSpawner === undefined) &&
                (item._isAutoGenerated || item._isautogenerated) && 
                String(item.work_main_category || item.main_category).toLowerCase().trim() === String(workMainCategory).toLowerCase().trim() && 
                (
                    String(item.item).toLowerCase().trim() === String(details.name).toLowerCase().trim() || 
                    String(item.item).toLowerCase().trim() === String(searchKey).toLowerCase().trim()
                )
            )
        );
        if (isMatch) indices.push(i);
    }
    
    if (indices.length > 1) {
        for (let j = indices.length - 1; j > 0; j--) {
            updatedBreakdown.splice(indices[j], 1);
            changed = true;
        }
    }
    
    let index = indices.length > 0 ? indices[0] : -1;
    
    if (index >= 0) {
        const existing = updatedBreakdown[index];
        existing[rowIdFlag] = true;
        
        const dropdownChanged = details.found && (
            !existing.item_uuid || 
            String(existing.item_uuid).toLowerCase() === 'null' ||
            String(existing.item_uuid).toLowerCase() !== String(details.id).toLowerCase()
        );
        
        let currentItem = existing.item;
        let currentUnit = existing.unit;
        let currentExtraPct = existing.extra_amount_percentage !== undefined ? Number(existing.extra_amount_percentage) : details.extraPct;
        let currentUnitCost = existing.unit_cost !== undefined ? Number(existing.unit_cost) : details.unitCost;
        let currentItemUuid = existing.item_uuid !== undefined ? existing.item_uuid : details.id;
        if (dropdownChanged || existing.item === undefined) {
            currentItem = details.name;
            currentItemUuid = details.id;
            currentUnit = details.unit;
            currentExtraPct = details.extraPct;
            currentUnitCost = details.unitCost;
        } else {
            if (currentItem === undefined) currentItem = details.name;
            if (currentUnit === undefined) currentUnit = details.unit;
        }
        
        const hasQtyOverride = existing.quantity_override !== undefined && existing.quantity_override !== null;
        const currentQtyOverride = hasQtyOverride ? Number(existing.quantity_override) : null;
        
        const currentFinalQty = hasQtyOverride 
            ? currentQtyOverride 
            : Number((baseQty * (1 + (currentExtraPct / 100))).toFixed(3));
            
        const currentResponsibility = existing.activity_responsibility !== undefined ? existing.activity_responsibility : responsibility;
        const currentActivityType = existing.activity_type !== undefined ? existing.activity_type : activityType;
        const currentTotalCost = currentResponsibility === 'Client'
            ? 0
            : Number((currentFinalQty * currentUnitCost).toFixed(2));
        
        const currentLaborersPerGroup = existing.laborers_per_group !== undefined ? Number(existing.laborers_per_group) : effLaborersGroup;
        const currentProductivityRate = existing.productivity_rate_per_day !== undefined ? Number(existing.productivity_rate_per_day) : effProdRate;
        const currentDays = existing.days_to_complete !== undefined ? Number(existing.days_to_complete) : effDays;
        let calculatedGroupsNeeded = 0;
        let calculatedPlannedAmountPerDay = 0;
        let calculatedTotalLaborers = 0;
        if (currentDays > 0 && currentProductivityRate > 0) {
            const requiredTotalDays = currentFinalQty / currentProductivityRate;
            calculatedGroupsNeeded = Math.ceil(requiredTotalDays / currentDays);
            calculatedTotalLaborers = calculatedGroupsNeeded * currentLaborersPerGroup;
            calculatedPlannedAmountPerDay = currentProductivityRate * calculatedGroupsNeeded;
        }
        const currentGroupsRequired = calculatedGroupsNeeded;
        const currentPlannedAmountPerDay = calculatedPlannedAmountPerDay;
        const currentTotalLaborers = calculatedTotalLaborers;
        if (
            existing.work_main_category !== workMainCategory ||
            existing.quantity !== baseQty || 
            existing.item !== currentItem || 
            existing.item_uuid !== currentItemUuid ||
            existing._spawnerid !== rowIdFlag ||
            existing.unit !== currentUnit ||
            existing.extra_amount_percentage !== currentExtraPct ||
            existing.final_quantity !== currentFinalQty ||
            existing.quantity_override !== currentQtyOverride ||
            existing.unit_cost !== currentUnitCost ||
            existing.total_cost !== currentTotalCost || 
            existing.activity_responsibility !== currentResponsibility ||
            existing.activity_type !== currentActivityType ||
            existing.laborers_per_group !== currentLaborersPerGroup ||
            existing.productivity_rate_per_day !== currentProductivityRate ||
            existing.days_to_complete !== currentDays || 
            existing.groups_required !== currentGroupsRequired ||
            existing.planned_amount_per_day !== currentPlannedAmountPerDay ||
            existing.total_laborers_per_day !== currentTotalLaborers ||
            existing.phase_id !== phaseId ||
            (existing.tender_log_id || existing.proposal_id) !== proposalId ||
            existing.phase_component !== phaseComponent
        ) {
            updatedBreakdown[index] = {
                ...existing,
                work_main_category: workMainCategory,
                quantity: baseQty,
                base_qty: baseQty,
                item: currentItem,
                item_name: currentItem,
                item_uuid: currentItemUuid,
                _spawnerid: rowIdFlag,
                unit: currentUnit,
                extra_amount_percentage: currentExtraPct,
                final_quantity: currentFinalQty,
                quantity_override: currentQtyOverride,
                unit_cost: currentUnitCost,
                total_cost: currentTotalCost,
                activity_responsibility: currentResponsibility,
                activity_type: currentActivityType,
                laborers_per_group: currentLaborersPerGroup,
                productivity_rate_per_day: currentProductivityRate,
                days_to_complete: currentDays,
                groups_required: currentGroupsRequired,
                planned_amount_per_day: currentPlannedAmountPerDay,
                total_laborers_per_day: currentTotalLaborers,
                phase_id: phaseId,
                tender_log_id: proposalId,
                proposal_id: proposalId,
                phase_component: phaseComponent
            };
            changed = true;
        }
    } else {
        updatedBreakdown.push({
            id: generateUUID(),
            ID: generateUUID(),
            _isAutoGenerated: true,
            _isautogenerated: true,
            [rowIdFlag]: true,
            _spawnerid: rowIdFlag,
            item_uuid: details.id,
            tender_log_id: proposalId,
            proposal_id: proposalId,
            phase_id: phaseId,
            phase_component: phaseComponent,
            main_category: "Construction",
            work_type: "Civil",
            work_main_category: workMainCategory,
            activity_responsibility: responsibility,
            activity_type: activityType,
            item: details.name,
            item_name: details.name,
            unit: details.unit,
            quantity: baseQty,
            base_qty: baseQty,
            extra_amount_percentage: details.extraPct,
            final_quantity: Number(finalQty.toFixed(3)),
            quantity_override: null,
            unit_cost: details.unitCost,
            total_cost: responsibility === 'Client' ? 0 : Number(totalCost.toFixed(2)),
            days_to_complete: effDays,
            total_laborers_per_day: computedLaborersPerDay,
            laborers_per_group: effLaborersGroup,
            productivity_rate_per_day: effProdRate,
            groups_required: groupsNeeded,
            planned_amount_per_day: plannedAmountPerDay
        });
        index = updatedBreakdown.length - 1;
        changed = true;
    }
    const row = updatedBreakdown[index];
    return {
        totalCost: Number(row.total_cost) || 0,
        days: row.days_to_complete || 0,
        laborers: row.total_laborers_per_day || 0,
        changed
    };
}

export function buildPumpRoomStructuralBoq(formData, masterBreakdownItems = [], dropdownOptions = {}, parentWF = null) {
    // 1. Run exact engineering calculations
    let u = calculatePumpRoomStructural(formData, parentWF, dropdownOptions);
    let updatedBreakdown = Array.isArray(masterBreakdownItems) ? [...masterBreakdownItems] : [];
    let changed = false;

    const currentPhaseId = u.phase_id || u.linked_phase || 'UNKNOWN_PHASE';
    const activeProposalId = u.tender_log_id || u.linked_proposal || u.project_title || u.proposal_id || '';
    const phaseComponentTarget = 'Pump Room';
    const itemsDb = getAllItemsDb(dropdownOptions);
    const linkedPhaseId = u.linked_phase || u.phase_id || parentWF?.phase_id;
    const phaseRecord = dropdownOptions?.phases?.find((p) => String(p.id) === String(linkedPhaseId)) || {};

    let wfRecord = dropdownOptions?.pump_room_data_entry?.find((p) => String(p.id) === String(linkedPhaseId) || String(p.linked_phase) === String(linkedPhaseId) || String(p.phase_id) === String(linkedPhaseId)) ||
        dropdownOptions?.proposal_data_entry?.find((p) => String(p.id) === String(linkedPhaseId) || String(p.linked_phase) === String(linkedPhaseId) || String(p.phase_id) === String(linkedPhaseId)) || {};

    if ((!wfRecord || !wfRecord.id) && parentWF) {
        wfRecord = parentWF;
    }

    const checkAccom = (val) => {
        const strVal = String(val || '').toLowerCase().trim();
        return strVal === 'yes' || strVal === 'true' || strVal === '1' || val === true || val === 1;
    };
    const isAccomRequired = checkAccom(u.accommodations_required) || checkAccom(parentWF?.accommodations_required) || checkAccom(phaseRecord?.accommodations_required) || checkAccom(wfRecord?.accommodations_required) || checkAccom(u.accommodations) || checkAccom(parentWF?.accommodations) || checkAccom(phaseRecord?.accommodations) || checkAccom(u.accommodation_required) || checkAccom(parentWF?.accommodation_required) || checkAccom(u.accommodation) || checkAccom(parentWF?.accommodation);

    // =========================================================================
    // 0. EXCAVATION WORKS
    // =========================================================================
    const excQty = u.qty_excavation_m3_user !== undefined && u.qty_excavation_m3_user !== null && u.qty_excavation_m3_user !== ''
        ? parseFloat(u.qty_excavation_m3_user)
        : (parseFloat(u.qty_excavation_m3_erp) || parseFloat(u.qty_excavation_m3) || 0);

    const excInScope = String(u.excavation_in_scope || '').toLowerCase() === 'yes';
    const effectiveExcQty = excInScope ? excQty : 0;

    const excSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Excavation Works',
        searchKey: u.excavation_method || 'Subcontractor - Excavation by Equipment',
        fallbackName: 'Subcontractor - Excavation by Equipment',
        baseQty: effectiveExcQty, itemsDb, rowIdFlag: '_isExcSubAuto',
        responsibility: 'P.Zone', activityType: 'Installation',
        laborersPerGroup: 2, productivityRatePerDay: 50, daysToComplete: effectiveExcQty > 0 ? 2 : 0
    });
    if (excSubRes.changed) changed = true;

    // =========================================================================
    // 1. PLAIN CONCRETE (PC)
    // =========================================================================
    const pcQty = u.qty_pc_m3_user !== undefined && u.qty_pc_m3_user !== null && u.qty_pc_m3_user !== ''
        ? parseFloat(u.qty_pc_m3_user)
        : (parseFloat(u.qty_pc_total_m3) || parseFloat(u.qty_pc_m3_erp) || parseFloat(u.qty_pc_m3) || 0);

    const pcRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete',
        searchKey: u.pc_grade || u.grade_of_plain_concrete_used || 'a4e313a3-2009-4878-a66e-5a9178a08d0a',
        fallbackName: 'Ready-mixed Concrete for Plain concrete 20 N/mm²',
        baseQty: pcQty, itemsDb, rowIdFlag: '_isPcAuto'
    });
    if (pcRes.changed) changed = true;

    const pcSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete',
        searchKey: 'Subcontractor for casting and compacting plain concrete',
        fallbackName: 'Subcontractor for casting and compacting plain concrete',
        baseQty: pcQty, itemsDb, rowIdFlag: '_isPcSubAuto', responsibility: 'P.Zone',
        activityType: 'Installation', laborersPerGroup: 6, productivityRatePerDay: 40, daysToComplete: 1
    });
    if (pcSubRes.changed) changed = true;

    const pcCarpentrySubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete',
        searchKey: 'Subcontractor for carpentry of plain concrete formwork',
        fallbackName: 'Subcontractor for carpentry of plain concrete formwork',
        baseQty: pcQty, itemsDb, rowIdFlag: '_isPcCarpentrySubAuto', responsibility: 'P.Zone',
        activityType: 'Installation', laborersPerGroup: 3, productivityRatePerDay: 50, daysToComplete: 1
    });
    if (pcCarpentrySubRes.changed) changed = true;

    const prPerimeter = parseFloat(u.pump_room_perimeter_m) || parseFloat(wfRecord?.pump_room_perimeter_m) || 0;
    const pcWoodQty = pcQty > 0 ? (((prPerimeter / 3) / 133) * 1.1) : 0;
    const pcWoodRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete',
        searchKey: 'e0d55ddf-df78-41c0-a0d7-13100f8ebd1b',
        fallbackName: 'Wood For Plain Concrete',
        baseQty: pcWoodQty, itemsDb, rowIdFlag: '_isPcWoodAuto', responsibility: 'P.Zone'
    });
    if (pcWoodRes.changed) changed = true;

    const pcNailsQty = pcQty > 0 ? Math.ceil(pcQty * 0.25) : 0;
    const pcNailsRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete',
        searchKey: 'f81aabf5-fedd-4591-8c28-57ced841ef04',
        fallbackName: 'Nails for Plain Concrete formwork',
        baseQty: pcNailsQty, itemsDb, rowIdFlag: '_isPcNailsAuto', responsibility: 'P.Zone'
    });
    if (pcNailsRes.changed) changed = true;

    const pcThickness = parseFloat(u.pc_thickness_ground_m) || parseFloat(wfRecord?.pc_thickness_ground_m) || 0.10;
    const polySheetQty = (pcQty > 0 && pcThickness > 0) ? ((pcQty / pcThickness) / 2) : 0;
    const peItemId = (u.polyethylene_brand === '80ac88d0-33c7-4aa8-9e53-e3f9de7ff5f4' || u.polyethylene_brand === 'cc67f864-bdf0-4091-b3f4-7db297fc35ab')
      ? 'cc67f864-bdf0-4091-b3f4-7db297fc35ab'
      : (u.polyethylene_brand === 'e1650748-60f8-429d-8c52-d6b6d9cd1bea' || u.polyethylene_brand === '8c665915-e095-4da7-9d9d-e8477e1295ec')
      ? '8c665915-e095-4da7-9d9d-e8477e1295ec'
      : (u.polyethylene_brand || '8c665915-e095-4da7-9d9d-e8477e1295ec');

    const polySheetRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete',
        searchKey: peItemId,
        fallbackName: 'Armada DPE Geomembrane 400 micron',
        baseQty: polySheetQty, itemsDb, rowIdFlag: '_isPolySheetAuto', responsibility: 'P.Zone'
    });
    if (polySheetRes.changed) changed = true;

    const totalPcDaysWithoutMicrobus = Math.ceil(pcRes.days + pcSubRes.days + pcCarpentrySubRes.days + pcWoodRes.days + pcNailsRes.days + polySheetRes.days);
    const totalPcLaborersWithoutMicrobus = Math.ceil(pcRes.laborers + pcSubRes.laborers + pcCarpentrySubRes.laborers + pcWoodRes.laborers + pcNailsRes.laborers + polySheetRes.laborers);

    const pcApartmentQty = (pcQty > 0 && isAccomRequired) ? Math.ceil(totalPcLaborersWithoutMicrobus / 6) * totalPcDaysWithoutMicrobus : 0;
    const pcApartmentRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete', activityType: 'Accommodation',
        searchKey: 'Apartment class C', fallbackName: 'Apartment class C',
        baseQty: pcApartmentQty, itemsDb, rowIdFlag: '_isPcApartmentAuto', responsibility: 'P.Zone'
    });
    if (pcApartmentRes.changed) changed = true;

    const pcMicrobusQty = (pcQty > 0 && isAccomRequired) ? Math.ceil(totalPcLaborersWithoutMicrobus / 14) * totalPcDaysWithoutMicrobus : 0;
    const pcMicrobusRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete', activityType: 'Accommodation',
        searchKey: 'Micro bus', fallbackName: 'Micro bus',
        baseQty: pcMicrobusQty, itemsDb, rowIdFlag: '_isPcMicrobusAuto', responsibility: 'P.Zone'
    });
    if (pcMicrobusRes.changed) changed = true;

    const totalPcCost = pcRes.totalCost + pcSubRes.totalCost + pcCarpentrySubRes.totalCost + pcWoodRes.totalCost + pcNailsRes.totalCost + polySheetRes.totalCost + pcApartmentRes.totalCost + pcMicrobusRes.totalCost;
    const totalPcDays = Math.ceil(totalPcDaysWithoutMicrobus + pcApartmentRes.days + pcMicrobusRes.days);
    const totalPcLaborers = Math.ceil(totalPcLaborersWithoutMicrobus + pcApartmentRes.laborers + pcMicrobusRes.laborers);

    if (u.total_cost_pc !== Number(totalPcCost.toFixed(2)) || u.days_to_complete_pc !== totalPcDays || u.plain_concrete_no_of_laborers !== totalPcLaborers) {
        u.total_cost_pc = Number(totalPcCost.toFixed(2));
        u.unit_cost_pc = pcQty > 0 ? Number((totalPcCost / pcQty).toFixed(2)) : 0;
        u.days_to_complete_pc = totalPcDays;
        u.plain_concrete_no_of_laborers = totalPcLaborers;
        changed = true;
    }

    // =========================================================================
    // 2. REINFORCED CONCRETE (RC)
    // =========================================================================
    const rcQty = u.total_rc_qty_user !== undefined && u.total_rc_qty_user !== null && u.total_rc_qty_user !== ''
        ? parseFloat(u.total_rc_qty_user)
        : (parseFloat(u.qty_rc_total_m3) || parseFloat(u.qty_rc_m3_erp) || parseFloat(u.qty_rc_m3) || 0);
    
    const rcWoodQty = rcQty > 0 ? (prPerimeter / 1.1 / 133) : 0;
    const rcWoodRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: 'e4be903c-63f2-4185-a908-283cb48afe03',
        fallbackName: 'wood for Reinforced Concrete formwork',
        baseQty: rcWoodQty, itemsDb, rowIdFlag: '_isRcWoodAuto', responsibility: 'P.Zone', activityType: 'Procurement'
    });
    if (rcWoodRes.changed) changed = true;

    const rcVibratorQty = rcQty > 0 ? Math.ceil(Math.ceil((36 / 7000) * rcQty)) : 0;
    const rcVibratorRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: 'Vibrator For Reinforced Concrete Works',
        fallbackName: 'Vibrator For Reinforced Concrete Works',
        baseQty: rcVibratorQty, itemsDb, rowIdFlag: '_isRcVibratorAuto', responsibility: 'P.Zone', activityType: 'Procurement'
    });
    if (rcVibratorRes.changed) changed = true;

    const rcRebarQty = rcQty > 0 ? Math.ceil((rcQty * (parseFloat(u.rebar_density_kg_m3) || 85)) / 1000) : 0;
    const rcRebarRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: u.rebar_diameter_mm || '814b9a89-31e5-4fe4-8809-a0c5dbddf74d',
        fallbackName: 'Steel Rebar ⌀ 12mm',
        baseQty: rcRebarQty, itemsDb, rowIdFlag: '_isRcRebarAuto', responsibility: 'P.Zone', activityType: 'Procurement'
    });
    if (rcRebarRes.changed) changed = true;

    const rcConcreteQty = rcQty > 0 ? rcQty : 0;
    const rcConcreteRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: u.rc_grade || 'd1c44be1-b986-4993-9939-a19fb793b214',
        fallbackName: 'Ready-mixed Concrete for Reinforced concrete 30 N/mm²',
        baseQty: rcConcreteQty, itemsDb, rowIdFlag: '_isRcConcreteAuto', responsibility: 'P.Zone', activityType: 'Procurement'
    });
    if (rcConcreteRes.changed) changed = true;

    const rcSteelSubcontractorQty = rcQty > 0 ? rcQty : 0;
    const rcSteelSubcontractorRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: 'Subcontractor for reinforced steel fabrication works',
        fallbackName: 'Subcontractor for reinforced steel fabrication works',
        baseQty: rcSteelSubcontractorQty, itemsDb, rowIdFlag: '_isRcSteelSubcontractorAuto', responsibility: 'P.Zone', activityType: 'Installation',
        laborersPerGroup: 2, productivityRatePerDay: 30, daysToComplete: 7
    });
    if (rcSteelSubcontractorRes.changed) changed = true;

    const rcCastingSubcontractorQty = rcQty > 0 ? rcQty : 0;
    const rcCastingSubcontractorRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: 'Subcontractor for casting and compacting reinforced concrete',
        fallbackName: 'Subcontractor for casting and compacting reinforced concrete',
        baseQty: rcCastingSubcontractorQty, itemsDb, rowIdFlag: '_isRcCastingSubcontractorAuto', responsibility: 'P.Zone', activityType: 'Installation',
        laborersPerGroup: 6, productivityRatePerDay: 300, daysToComplete: 1
    });
    if (rcCastingSubcontractorRes.changed) changed = true;

    const rcCarpentrySubcontractorQty = rcQty > 0 ? rcQty : 0;
    const rcCarpentrySubcontractorRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: 'Subcontractor for carpentry of reinforced concrete formwork',
        fallbackName: 'Subcontractor for carpentry of reinforced concrete formwork',
        baseQty: rcCarpentrySubcontractorQty, itemsDb, rowIdFlag: '_isRcCarpentrySubcontractorAuto', responsibility: 'P.Zone', activityType: 'Installation',
        laborersPerGroup: 2, productivityRatePerDay: 50, daysToComplete: 3
    });
    if (rcCarpentrySubcontractorRes.changed) changed = true;

    const rcNailsQty = rcQty > 0 ? rcQty * 2 : 0;
    const rcNailsRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: 'Nails for Reinforced Concrete formwork',
        fallbackName: 'Nails for Reinforced Concrete formwork',
        baseQty: rcNailsQty, itemsDb, rowIdFlag: '_isRcNailsAuto', responsibility: 'P.Zone', activityType: 'Procurement'
    });
    if (rcNailsRes.changed) changed = true;

    const prArea = parseFloat(u.pump_room_area_m2) || parseFloat(wfRecord?.pump_room_area_m2) || 0;
    const prHeight = parseFloat(u.pump_room_height_m) || parseFloat(wfRecord?.pump_room_height_m) || 0;
    const rcMasterKureQty = rcQty > 0 ? (((prArea + (prPerimeter * prHeight)) * 0.333) / 200) : 0;
    const rcMasterKureRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: 'MasterKure 102 For Reinforced Concrete Curing',
        fallbackName: 'MasterKure 102 For Reinforced Concrete Curing',
        baseQty: rcMasterKureQty, itemsDb, rowIdFlag: '_isRcMasterKureAuto', responsibility: 'P.Zone', activityType: 'Procurement'
    });
    if (rcMasterKureRes.changed) changed = true;

    const totalRcDaysWithoutMicrobus = Math.ceil(rcWoodRes.days + rcVibratorRes.days + rcRebarRes.days + rcConcreteRes.days + rcSteelSubcontractorRes.days + rcCastingSubcontractorRes.days + rcCarpentrySubcontractorRes.days + rcNailsRes.days + rcMasterKureRes.days);
    const totalRcLaborersWithoutMicrobus = Math.ceil(rcWoodRes.laborers + rcVibratorRes.laborers + rcRebarRes.laborers + rcConcreteRes.laborers + rcSteelSubcontractorRes.laborers + rcCastingSubcontractorRes.laborers + rcCarpentrySubcontractorRes.laborers + rcNailsRes.laborers + rcMasterKureRes.laborers);

    const rcApartmentQty = (rcQty > 0 && isAccomRequired) ? Math.ceil(totalRcLaborersWithoutMicrobus / 6) * totalRcDaysWithoutMicrobus : 0;
    const rcApartmentRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Accommodation',
        searchKey: 'Apartment class C', fallbackName: 'Apartment class C',
        baseQty: rcApartmentQty, itemsDb, rowIdFlag: '_isRcApartmentAuto', responsibility: 'P.Zone'
    });
    if (rcApartmentRes.changed) changed = true;

    const rcMicrobusQty = (rcQty > 0 && isAccomRequired) ? Math.ceil(totalRcLaborersWithoutMicrobus / 14) * totalRcDaysWithoutMicrobus : 0;
    const rcMicrobusRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Accommodation',
        searchKey: 'Micro bus', fallbackName: 'Micro bus',
        baseQty: rcMicrobusQty, itemsDb, rowIdFlag: '_isRcMicrobusAuto', responsibility: 'P.Zone'
    });
    if (rcMicrobusRes.changed) changed = true;

    let totalRcCost = rcWoodRes.totalCost + rcVibratorRes.totalCost + rcRebarRes.totalCost + rcConcreteRes.totalCost + rcSteelSubcontractorRes.totalCost + rcCastingSubcontractorRes.totalCost + rcCarpentrySubcontractorRes.totalCost + rcNailsRes.totalCost + rcMasterKureRes.totalCost + rcApartmentRes.totalCost + rcMicrobusRes.totalCost;
    let totalRcDays = Math.ceil(totalRcDaysWithoutMicrobus + rcApartmentRes.days + rcMicrobusRes.days);
    let totalRcLaborers = Math.ceil(totalRcLaborersWithoutMicrobus + rcApartmentRes.laborers + rcMicrobusRes.laborers);
    const calcUnitCost = rcQty > 0 ? Number((totalRcCost / rcQty).toFixed(2)) : 0;

    if (u.rc_total_cost !== Number(totalRcCost.toFixed(2)) || u.rc_unit_cost !== calcUnitCost || u.rc_no_of_days_to_complete_installation !== totalRcDays || u.rc_no_of_laborers !== totalRcLaborers) {
        u.rc_total_cost = Number(totalRcCost.toFixed(2));
        u.rc_unit_cost = calcUnitCost;
        u.rc_no_of_days_to_complete_installation = totalRcDays;
        u.rc_no_of_laborers = totalRcLaborers;
        changed = true;
    }

    // =========================================================================
    // 3. COFFOR FORMWORK
    // =========================================================================
    const cofforQty = u.coffor_qty_m2_user !== undefined && u.coffor_qty_m2_user !== null && u.coffor_qty_m2_user !== ''
        ? parseFloat(u.coffor_qty_m2_user)
        : (parseFloat(u.coffor_qty_m2_erp) || parseFloat(u.qty_coffor_m2) || 0);

    const cofforPanelsRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Coffor',
        searchKey: 'dcf713e9-afca-44fe-a577-2cab176f1d2d',
        fallbackName: 'Supply Coffor Panels',
        baseQty: cofforQty, itemsDb, rowIdFlag: '_isCofforPanelsAuto', responsibility: 'P.Zone', activityType: 'Procurement'
    });
    if (cofforPanelsRes.changed) changed = true;

    const cofforSubcontractorDays = cofforQty > 0 ? Math.ceil(cofforQty / 50) : 0;
    const cofforSubcontractorRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Coffor',
        searchKey: 'Subcontractor for Coffor installation works',
        fallbackName: 'Subcontractor for Coffor installation works',
        baseQty: cofforQty, itemsDb, rowIdFlag: '_isCofforSubcontractorAuto', responsibility: 'P.Zone',
        activityType: 'Installation', laborersPerGroup: 3, productivityRatePerDay: 50, daysToComplete: cofforSubcontractorDays
    });
    if (cofforSubcontractorRes.changed) changed = true;
    
    const totalCofforDaysWithoutMicrobus = Math.ceil(cofforPanelsRes.days + cofforSubcontractorRes.days);
    const totalCofforLaborersWithoutMicrobus = Math.ceil(cofforPanelsRes.laborers + cofforSubcontractorRes.laborers);

    const cofforApartmentQty = (cofforQty > 0 && isAccomRequired) ? Math.ceil(totalCofforLaborersWithoutMicrobus / 6) * totalCofforDaysWithoutMicrobus : 0;
    const cofforApartmentRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Coffor', activityType: 'Accommodation',
        searchKey: 'Apartment class C', fallbackName: 'Apartment class C',
        baseQty: cofforApartmentQty, itemsDb, rowIdFlag: '_isCofforApartmentAuto', responsibility: 'P.Zone'
    });
    if (cofforApartmentRes.changed) changed = true;

    const cofforMicrobusQty = (cofforQty > 0 && isAccomRequired) ? Math.ceil(totalCofforLaborersWithoutMicrobus / 14) * totalCofforDaysWithoutMicrobus : 0;
    const cofforMicrobusRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Coffor', activityType: 'Accommodation',
        searchKey: 'Micro bus', fallbackName: 'Micro bus',
        baseQty: cofforMicrobusQty, itemsDb, rowIdFlag: '_isCofforMicrobusAuto', responsibility: 'P.Zone'
    });
    if (cofforMicrobusRes.changed) changed = true;

    let totalCofforCost = cofforPanelsRes.totalCost + cofforSubcontractorRes.totalCost + cofforApartmentRes.totalCost + cofforMicrobusRes.totalCost;
    let totalCofforDays = Math.ceil(totalCofforDaysWithoutMicrobus + cofforApartmentRes.days + cofforMicrobusRes.days);
    let totalCofforLaborers = Math.ceil(totalCofforLaborersWithoutMicrobus + cofforApartmentRes.laborers + cofforMicrobusRes.laborers);
    const calcCofforUnitCost = cofforQty > 0 ? Number((totalCofforCost / cofforQty).toFixed(2)) : 0;

    if (u.coffor_total_cost !== Number(totalCofforCost.toFixed(2)) || u.coffor_unit_cost !== calcCofforUnitCost || u.coffor_no_of_days_to_complete_installation !== totalCofforDays || u.coffor_no_of_laborers !== totalCofforLaborers) {
        u.coffor_total_cost = Number(totalCofforCost.toFixed(2));
        u.coffor_unit_cost = calcCofforUnitCost;
        u.coffor_no_of_days_to_complete_installation = totalCofforDays;
        u.coffor_no_of_laborers = totalCofforLaborers;
        changed = true;
    }

    // =========================================================================
    // 4. BITUMINOUS & MEMBRANE WATERPROOFING (EXTERNAL)
    // =========================================================================
    const bituWpQtyRaw = u.bituminous_wp_qty_m2_user !== undefined && u.bituminous_wp_qty_m2_user !== null && u.bituminous_wp_qty_m2_user !== ''
        ? parseFloat(u.bituminous_wp_qty_m2_user)
        : (parseFloat(u.bituminous_wp_qty_m2_erp) || parseFloat(u.qty_wp_m2) || 0);
    const bituWpQty = Math.ceil(bituWpQtyRaw);

    const bituRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Cartonal N-1300 3mm',
        fallbackName: 'Cartonal N-1300 3mm',
        baseQty: bituWpQty, itemsDb, rowIdFlag: '_isBituCartonalAuto'
    });
    if (bituRes.changed) changed = true;

    // 1. Bituminous Waterproofing (Liquid / Primer)
    let bituMaterialId = u.wp_bituminous_material || u.type_of_bituminous_waterproofing;
    if (!bituMaterialId && u.wp_bituminous_brand) {
        const brandMatch = itemsDb.find(d => d && String(d.brand_id || '').toLowerCase() === String(u.wp_bituminous_brand).toLowerCase() && (String(d.item_category || '').toLowerCase().includes('bitumin') || String(d['ITEM NAME'] || '').toLowerCase().includes('bitumen')));
        if (brandMatch) bituMaterialId = brandMatch.id || brandMatch.item_id;
    }
    if (!bituMaterialId) bituMaterialId = '89731c2e-01ff-4b0b-b523-d67144f82093';

    const bituMaterialDetails = extractDropdownDetails(itemsDb, bituMaterialId, 'Sika Bitumen - w');
    const bituMaterialSpecRate = bituMaterialDetails.specificationRate > 0 ? bituMaterialDetails.specificationRate : 333.33;
    const bituLayers = Number(u.wp_bitumen_layers) || 2;
    const bituMaterialQty = Math.ceil((bituWpQtyRaw * bituLayers) / bituMaterialSpecRate);

    const bituMaterialRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: bituMaterialId,
        fallbackName: bituMaterialDetails.name,
        baseQty: bituMaterialQty, itemsDb, rowIdFlag: '_isBituMaterialAuto'
    });
    if (bituMaterialRes.changed) changed = true;

    // 2. Membrane Waterproofing (Anti-Root Sheet Roll)
    let membMaterialId = u.wp_membrane_material;
    if (!membMaterialId && u.wp_membrane_brand) {
        const brandMatch = itemsDb.find(d => d && String(d.brand_id || '').toLowerCase() === String(u.wp_membrane_brand).toLowerCase() && (String(d.item_category || '').toLowerCase().includes('membrane') || String(d['ITEM NAME'] || '').toLowerCase().includes('membrane') || String(d['ITEM NAME'] || '').toLowerCase().includes('anti root') || String(d['ITEM NAME'] || '').toLowerCase().includes('insutech')));
        if (brandMatch) membMaterialId = brandMatch.id || brandMatch.item_id;
    }
    if (!membMaterialId) membMaterialId = '555c6c16-854d-449a-b145-8268d991f29d';

    const membMaterialDetails = extractDropdownDetails(itemsDb, membMaterialId, 'Insutech N 4mm');
    const membMaterialSpecRate = membMaterialDetails.specificationRate > 0 ? membMaterialDetails.specificationRate : 9;
    const membMaterialQty = Math.ceil(bituWpQtyRaw / membMaterialSpecRate);

    const bituMembraneMaterialRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: membMaterialId,
        fallbackName: membMaterialDetails.name,
        baseQty: membMaterialQty, itemsDb, rowIdFlag: '_isBituMembraneMaterialAuto'
    });
    if (bituMembraneMaterialRes.changed) changed = true;

    const bituMembraneSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Subcontractor for executing Membrane Waterproofing works',
        fallbackName: 'Subcontractor for executing Membrane Waterproofing works',
        baseQty: bituWpQtyRaw, itemsDb, rowIdFlag: '_isBituSubcontractorAuto', responsibility: 'P.Zone',
        laborersPerGroup: 2, productivityRatePerDay: 100, daysToComplete: 2
    });
    if (bituMembraneSubRes.changed) changed = true;

    const bituBituminousSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Subcontractor for executing Bituminious Waterproofing works',
        fallbackName: 'Subcontractor for executing Bituminious Waterproofing works',
        baseQty: bituWpQtyRaw, itemsDb, rowIdFlag: '_isBituBituminousSubAuto', responsibility: 'P.Zone',
        laborersPerGroup: 2, productivityRatePerDay: 100, daysToComplete: 2
    });
    if (bituBituminousSubRes.changed) changed = true;

    const waterExtProtectQty = Number(u.qty_water_ext_protect_ltr || 0);
    const waterExtQty = Number(u.qty_water_ext_ltr || 0);
    const bituWaterQty = waterExtProtectQty + waterExtQty;
    const bituWaterRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Water For External water proofing',
        fallbackName: 'Water For External water proofing',
        baseQty: bituWaterQty, itemsDb, rowIdFlag: '_isBituWaterAuto', responsibility: 'P.Zone'
    });
    if (bituWaterRes.changed) changed = true;

    const sandExtProtectQty = Number(u.qty_sand_ext_protect_m3 || 0);
    const sandExtQty = Number(u.qty_sand_ext_m3 || 0);
    const bituSandQty = sandExtProtectQty + sandExtQty;
    const bituSandRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Sand For External waterproofing',
        fallbackName: 'Sand For External waterproofing',
        baseQty: bituSandQty, itemsDb, rowIdFlag: '_isBituSandAuto', responsibility: 'P.Zone'
    });
    if (bituSandRes.changed) changed = true;

    const bituSikaQty = Number(u.qty_grout_ext_repair_m3 || 0);
    const bituSikaRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: '19236bf1-35b7-40f2-b540-7b88975aaac8',
        fallbackName: 'Bituminous Waterproofing: Sikagrout ® - 200 for waterproofing works',
        baseQty: bituSikaQty, itemsDb, rowIdFlag: '_isBituSikaAuto', responsibility: 'P.Zone'
    });
    if (bituSikaRes.changed) changed = true;

    const cementExtProtectQty = Number(u.qty_cement_ext_protect_tons || 0);
    const cementExtQty = Number(u.qty_cement_ext_tons || 0);
    const bituCementQty = cementExtProtectQty + cementExtQty;
    const bituCementRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Cement For External waterproofing',
        fallbackName: 'Cement For External waterproofing',
        baseQty: bituCementQty, itemsDb, rowIdFlag: '_isBituCementAuto', responsibility: 'P.Zone'
    });
    if (bituCementRes.changed) changed = true;

    const bituAddibondQty = (Number(u.qty_adipond_ext_ltr || 0)) / 20;
    const bituAddibondRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Addibond for External Water Proofing',
        fallbackName: 'Addibond for External Water Proofing',
        baseQty: bituAddibondQty, itemsDb, rowIdFlag: '_isBituAddibondAuto', responsibility: 'P.Zone'
    });
    if (bituAddibondRes.changed) changed = true;

    const totalBituDaysWithoutMicrobus = Math.ceil(bituRes.days + bituMaterialRes.days + bituMembraneMaterialRes.days + bituMembraneSubRes.days + bituBituminousSubRes.days + bituWaterRes.days + bituSandRes.days + bituSikaRes.days + bituCementRes.days + bituAddibondRes.days);
    const totalBituLaborersWithoutMicrobus = Math.ceil(bituRes.laborers + bituMaterialRes.laborers + bituMembraneMaterialRes.laborers + bituMembraneSubRes.laborers + bituBituminousSubRes.laborers + bituWaterRes.laborers + bituSandRes.laborers + bituSikaRes.laborers + bituCementRes.laborers + bituAddibondRes.laborers);

    const bituApartmentQty = (bituWpQty > 0 && isAccomRequired) ? Math.ceil(totalBituLaborersWithoutMicrobus / 6) * totalBituDaysWithoutMicrobus : 0;
    const bituApartmentRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing', activityType: 'Accommodation',
        searchKey: 'Apartment class C', fallbackName: 'Apartment class C',
        baseQty: bituApartmentQty, itemsDb, rowIdFlag: '_isBituApartmentAuto', responsibility: 'P.Zone'
    });
    if (bituApartmentRes.changed) changed = true;

    const bituMicrobusQty = (bituWpQty > 0 && isAccomRequired) ? Math.ceil(totalBituLaborersWithoutMicrobus / 14) * totalBituDaysWithoutMicrobus : 0;
    const bituMicrobusRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing', activityType: 'Accommodation',
        searchKey: 'Micro bus', fallbackName: 'Micro bus',
        baseQty: bituMicrobusQty, itemsDb, rowIdFlag: '_isBituMicrobusAuto', responsibility: 'P.Zone'
    });
    if (bituMicrobusRes.changed) changed = true;

    let totalBituCost = bituRes.totalCost + bituMaterialRes.totalCost + bituMembraneMaterialRes.totalCost + bituMembraneSubRes.totalCost + bituBituminousSubRes.totalCost + bituWaterRes.totalCost + bituSandRes.totalCost + bituSikaRes.totalCost + bituCementRes.totalCost + bituAddibondRes.totalCost + bituApartmentRes.totalCost + bituMicrobusRes.totalCost;
    let totalBituDays = Math.ceil(totalBituDaysWithoutMicrobus + bituApartmentRes.days + bituMicrobusRes.days);
    let totalBituLaborers = Math.ceil(totalBituLaborersWithoutMicrobus + bituApartmentRes.laborers + bituMicrobusRes.laborers);

    if (u.bituminous_wp_total_cost !== Number(totalBituCost.toFixed(2)) || u.bituminous_wp_no_of_days_to_complete_installation !== totalBituDays || u.bituminous_wp_no_of_laborers !== totalBituLaborers) {
        u.bituminous_wp_total_cost = Number(totalBituCost.toFixed(2));
        u.bituminous_wp_unit_cost = bituWpQty > 0 ? Number((totalBituCost / bituWpQty).toFixed(2)) : 0;
        u.bituminous_wp_no_of_days_to_complete_installation = totalBituDays;
        u.bituminous_wp_no_of_laborers = totalBituLaborers;
        changed = true;
    }

    // =========================================================================
    // 5. CEMENTITIOUS WATERPROOFING (INTERNAL)
    // =========================================================================
    const cemWpQty = u.cementitious_wp_qty_m2_user !== undefined && u.cementitious_wp_qty_m2_user !== null && u.cementitious_wp_qty_m2_user !== ''
        ? parseFloat(u.cementitious_wp_qty_m2_user)
        : (parseFloat(u.cementitious_wp_qty_m2_erp) || parseFloat(u.qty_wp_cementitious_m2) || 0);

    const cemMaterialDetails = extractDropdownDetails(itemsDb, u.wp_cementitious_material || u.cementitious_wp_boq_title || 'MasterSeal 588', 'Cementitious Waterproofing');
    const cemMaterialSpecRate = cemMaterialDetails.specificationRate > 0 ? cemMaterialDetails.specificationRate : 1;
    const cemMaterialQty = Math.ceil(cemWpQty / cemMaterialSpecRate);

    const cemRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        searchKey: u.wp_cementitious_material || u.cementitious_wp_boq_title || 'MasterSeal 588',
        fallbackName: cemMaterialDetails.name,
        baseQty: cemMaterialQty, itemsDb, rowIdFlag: '_isCemAuto'
    });
    if (cemRes.changed) changed = true;

    const cemWaterQty = Number(u.qty_water_int_ltr || 0);
    const cemWaterRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        searchKey: 'Water For Internal waterproofing',
        fallbackName: 'Water For Internal waterproofing',
        baseQty: cemWaterQty, itemsDb, rowIdFlag: '_isCemWaterAuto', responsibility: 'P.Zone'
    });
    if (cemWaterRes.changed) changed = true;

    const cemSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        searchKey: 'Subcontractor for Internal waterproofing works',
        fallbackName: 'Subcontractor for Internal waterproofing works',
        baseQty: cemWpQty, itemsDb, rowIdFlag: '_isCemSubAuto', responsibility: 'P.Zone',
        laborersPerGroup: 2, productivityRatePerDay: 100
    });
    if (cemSubRes.changed) changed = true;

    const cemSikaQty = Number(u.qty_grout_int_repair_m3 || 0);
    const cemSikaRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        searchKey: 'f5fa7506-b946-4491-aa96-d0263cb23614',
        fallbackName: 'Cementitious Waterproofing: Sikagrout Ar - 200',
        baseQty: cemSikaQty, itemsDb, rowIdFlag: '_isCemSikaAuto', responsibility: 'P.Zone'
    });
    if (cemSikaRes.changed) changed = true;

    const cemSandQty = Number(u.qty_sand_int_m3 || 0);
    const cemSandRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        searchKey: 'Sand For Internal waterproofing',
        fallbackName: 'Sand For Internal waterproofing',
        baseQty: cemSandQty, itemsDb, rowIdFlag: '_isCemSandAuto', responsibility: 'P.Zone'
    });
    if (cemSandRes.changed) changed = true;

    const cemCementQty = Number(u.qty_cement_int_tons || 0);
    const cemCementRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        searchKey: 'Cement For Internal waterproofing',
        fallbackName: 'Cement For Internal waterproofing',
        baseQty: cemCementQty, itemsDb, rowIdFlag: '_isCemCementAuto', responsibility: 'P.Zone'
    });
    if (cemCementRes.changed) changed = true;

    const totalCemDaysWithoutMicrobus = Math.ceil(cemRes.days + cemWaterRes.days + cemSubRes.days + cemSikaRes.days + cemSandRes.days + cemCementRes.days);
    const totalCemLaborersWithoutMicrobus = Math.ceil(cemRes.laborers + cemWaterRes.laborers + cemSubRes.laborers + cemSikaRes.laborers + cemSandRes.laborers + cemCementRes.laborers);

    const cemApartmentQty = (cemWpQty > 0 && isAccomRequired) ? Math.ceil(totalCemLaborersWithoutMicrobus / 6) * totalCemDaysWithoutMicrobus : 0;
    const cemApartmentRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        activityType: 'Accommodation',
        searchKey: 'Apartment class C',
        fallbackName: 'Apartment class C',
        baseQty: cemApartmentQty, itemsDb, rowIdFlag: '_isCemApartmentAuto', responsibility: 'P.Zone'
    });
    if (cemApartmentRes.changed) changed = true;

    const cemMicrobusQty = (cemWpQty > 0 && isAccomRequired) ? Math.ceil(totalCemLaborersWithoutMicrobus / 14) * totalCemDaysWithoutMicrobus : 0;
    const cemMicrobusRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        activityType: 'Accommodation',
        searchKey: 'Micro bus',
        fallbackName: 'Micro bus',
        baseQty: cemMicrobusQty, itemsDb, rowIdFlag: '_isCemMicrobusAuto', responsibility: 'P.Zone'
    });
    if (cemMicrobusRes.changed) changed = true;

    let totalCemCost = cemRes.totalCost + cemWaterRes.totalCost + cemSubRes.totalCost + cemSikaRes.totalCost + cemSandRes.totalCost + cemCementRes.totalCost + cemApartmentRes.totalCost + cemMicrobusRes.totalCost;
    let totalCemDays = Math.ceil(totalCemDaysWithoutMicrobus + cemApartmentRes.days + cemMicrobusRes.days);
    let totalCemLaborers = Math.ceil(totalCemLaborersWithoutMicrobus + cemApartmentRes.laborers + cemMicrobusRes.laborers);

    if (u.cementitious_wp_total_cost !== Number(totalCemCost.toFixed(2)) || u.cementitious_wp_no_of_days_to_complete_installation !== totalCemDays || u.cementitious_wp_no_of_laborers !== totalCemLaborers) {
        u.cementitious_wp_total_cost = Number(totalCemCost.toFixed(2));
        u.cementitious_wp_unit_cost = cemWpQty > 0 ? Number((totalCemCost / cemWpQty).toFixed(2)) : 0;
        u.cementitious_wp_no_of_days_to_complete_installation = totalCemDays;
        u.cementitious_wp_no_of_laborers = totalCemLaborers;
        changed = true;
    }

    // Sort all breakdown items descending by total_cost
    const sortedBreakdown = [...updatedBreakdown].sort((a, b) => (Number(b.total_cost) || 0) - (Number(a.total_cost) || 0));
    u.proposal_breakdown_items = sortedBreakdown;
    u.items = sortedBreakdown;
    const overallTotalCost = sortedBreakdown.reduce((sum, it) => sum + (Number(it.total_cost) || 0), 0);
    u.totalCost = Number(overallTotalCost.toFixed(2));
    u.total_cost = u.totalCost;
    return u;
}

export function getPumpRoomStructuralBoqDependencies(formData) {
    return [
        formData.qty_pc_total_m3, formData.qty_pc_m3, formData.qty_pc_m3_user, formData.pc_grade, formData.grade_of_plain_concrete_used,
        formData.qty_rc_total_m3, formData.qty_rc_m3, formData.qty_rc_m3_user, formData.rc_grade, formData.reinforced_concrete_type,
        formData.water_feature_perimeter_m, formData.perimeter, formData.pump_room_perimeter_m,
        formData.qty_polyethylene_kg, formData.polyethylene_brand, formData.pc_thickness_ground_m,
        formData.area_m2, formData.water_feature_area_m2, formData.pump_room_area_m2,
        formData.qty_bituminous_waterproofing_m2, formData.type_of_bituminous_waterproofing,
        formData.wp_bituminous_brand, formData.wp_bituminous_material, formData.wp_bitumen_layers,
        formData.wp_membrane_brand, formData.wp_membrane_material,
        formData.qty_cementitious_waterproofing_m2, formData.type_of_cementitious_waterproofing,
        formData.accommodations_required, formData.accommodations, formData.accommodation_required, formData.accommodation,
        formData.qty_excavation_m3_user, formData.total_rc_qty_user, formData.bituminous_wp_qty_m2_user, formData.cementitious_wp_qty_m2_user, formData.coffor_qty_m2_user
    ];
}
