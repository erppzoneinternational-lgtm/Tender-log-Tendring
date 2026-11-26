// src/utils/engine/modules/waterFeatureStructuralBoqBuilder.js

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
        'items',
        'items_database',
        'civil_material_types',
        'finishes_type',
        'finishes_types',
        'finishes_category',
        'finishes_categories',
        'proposal_items_database',
        'items_database_materials_cost_per_pzone',
        'items_database_water_features_finishes_costs',
        'items_database_subcontractors',
        'items_database_labours_accomodation_and_meals',
        'items_database_man_power',
        'Items',
        'transformer_type',
        'transformers',
        'cable_types',
        'cables',
        'cable_conduits',
        'conduits',
        'disconnect_switch_types',
        'switches',
        'junction_box',
        'lighting_type',
        'lighting',
        'filter_pump_types',
        'filterPumps',
        'filter_types',
        'mediaFilters',
        'heaters'
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
    '93418ed4-fd56-4956-a409-49fb3a215236': 'Insutech - APP ANTIROOT',
    '48345ef5-ce97-4175-8930-463876e374c2': 'Insutech - APP ANTIROOT',
    '18fa4190-5fb5-42e8-97e2-d64e51222132': 'Insutech N 4mm',
    '555c6c16-854d-449a-b145-8268d991f29d': 'Insutech N 4mm',
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
    '88d4fa63-1df6-4286-b7cb-15ecbc7f4dd0': 'Addibond for External Water Proofing',

    // Liner / Resilient Sheets (finishes_type & items)
    '0031ff5b-9aea-4973-bc02-6b37b5ca0b35': 'Slip Resistant Sheet - White Brand Soprema',
    'b6cb2aff-8a50-4172-9f82-51b77bab90ad': 'Slip Resistant Sheet - White Brand Soprema',
    'cf6ab0b7-8020-4f9a-aadd-954043d8172b': 'Resiliant Sheet - White Brand Soprema',
    'd2c1df2b-363e-4813-a09d-2dd00893d07d': 'Resiliant Sheet - White Brand Soprema',
    '364e5a5c-32b7-419c-aebb-a4843f07cded': 'Slip Resistant Sheet - White Brand Insuwrap',
    '6f3105d0-18f7-43f7-9289-deaaf64a95eb': 'Slip Resistant Sheet - White Brand Insuwrap',
    '6ff2f328-2693-4233-9ead-4891ea63743e': 'Resiliant Sheet - White Brand Insuwrap',
    '1f2c26c2-abf5-4dcd-8ef2-81b0cdd9f793': 'Resiliant Sheet - White Brand Insuwrap',
    '92ac660f-a0de-49b9-a58c-748ceb292c99': 'Slip Resistant Sheet - Caribbean Green Brand Soprema',
    'cba9b2fb-f2ae-49d7-880f-136133137940': 'Slip Resistant Sheet - Caribbean Green Brand Soprema',
    '1cfc465c-6a6e-42d3-ba6e-c759ad660b27': 'Resiliant Sheet - Caribbean Green Brand Soprema',
    'dd81a5ab-584c-435b-bf76-03938af305df': 'Resiliant Sheet - Caribbean Green Brand Soprema',
    'ec50e5bd-2ff2-4dab-b883-bf4789be5694': 'Slip Resistant Sheet - Caribbean Green Brand Insuwrap',
    'c708ced2-7b5a-4860-b240-d65da607a39e': 'Slip Resistant Sheet - Caribbean Green Brand Insuwrap',
    'd5c3f715-dbee-4952-b182-765b74dcc429': 'Resilient Sheet - Caribbean Green Brand Insuwrap',
    '7427d6a1-089c-48a1-bc4a-3d627d7cf873': 'Resilient Sheet - Caribbean Green Brand Insuwrap',
    'ed64565d-f043-420c-8210-86290d123483': 'Rivet Screw for Liners',
    '98c04c06-0723-43b0-a100-6bf087bae0d7': 'Supply Linerlock',
    '5d15b908-e2ab-44d1-894d-4179d8f3be8b': 'Subcontractor for Liner Works',

    // Plastering / Stucco Works
    '2eb2c9f6-2d09-4c35-8a99-d4a84952b11d': 'Water for Plastering',
    '9937162c-9335-4260-a211-fc6295d41ef4': 'Sand for Plastering',
    '2e131253-45a0-4c7d-add0-19611ef318b6': 'Cement for plastering',
    '3942cb95-38aa-4bca-a00a-b4ab0700a5a8': 'Addibond 65 for Plastering Works',
    '1765dc0e-e15b-4262-9067-f841a254e006': 'Plastering subcontractor'
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

    // Wood, Panels, Nails
    'e0d55ddf-df78-41c0-a0d7-13100f8ebd1b': 17000,
    'e4be903c-63f2-4185-a908-283cb48afe03': 17000,
    'dcf713e9-afca-44fe-a577-2cab176f1d2d': 600,
    '8a44d702-32d3-4805-948a-91d0ec466034': 40,
    'f81aabf5-fedd-4591-8c28-57ced841ef04': 40,
    'a6fbe852-6712-4015-8fb9-ad9919f2a9fb': 80,
    'f5fa7506-b946-4491-aa96-d0263cb23614': 45,

    // Liner Works
    '0031ff5b-9aea-4973-bc02-6b37b5ca0b35': 450,
    'b6cb2aff-8a50-4172-9f82-51b77bab90ad': 450,
    'cf6ab0b7-8020-4f9a-aadd-954043d8172b': 450,
    'd2c1df2b-363e-4813-a09d-2dd00893d07d': 450,
    '364e5a5c-32b7-419c-aebb-a4843f07cded': 450,
    '6f3105d0-18f7-43f7-9289-deaaf64a95eb': 450,
    '6ff2f328-2693-4233-9ead-4891ea63743e': 450,
    '1f2c26c2-abf5-4dcd-8ef2-81b0cdd9f793': 450,
    '92ac660f-a0de-49b9-a58c-748ceb292c99': 450,
    'cba9b2fb-f2ae-49d7-880f-136133137940': 450,
    '1cfc465c-6a6e-42d3-ba6e-c759ad660b27': 450,
    'dd81a5ab-584c-435b-bf76-03938af305df': 450,
    'ec50e5bd-2ff2-4dab-b883-bf4789be5694': 450,
    'c708ced2-7b5a-4860-b240-d65da607a39e': 450,
    'd5c3f715-dbee-4952-b182-765b74dcc429': 450,
    '7427d6a1-089c-48a1-bc4a-3d627d7cf873': 450,
    'ed64565d-f043-420c-8210-86290d123483': 10,
    '98c04c06-0723-43b0-a100-6bf087bae0d7': 120,
    '5d15b908-e2ab-44d1-894d-4179d8f3be8b': 75,

    // Plastering / Stucco Works
    '2eb2c9f6-2d09-4c35-8a99-d4a84952b11d': 20,
    '9937162c-9335-4260-a211-fc6295d41ef4': 250,
    '2e131253-45a0-4c7d-add0-19611ef318b6': 5000,
    '3942cb95-38aa-4bca-a00a-b4ab0700a5a8': 160,
    '1765dc0e-e15b-4262-9067-f841a254e006': 250
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
    '77c2e988-18cd-4fdc-9740-2eb7518156eb': 'Board',

    // Liner Works
    '0031ff5b-9aea-4973-bc02-6b37b5ca0b35': 'm²',
    'b6cb2aff-8a50-4172-9f82-51b77bab90ad': 'm²',
    'cf6ab0b7-8020-4f9a-aadd-954043d8172b': 'm²',
    'd2c1df2b-363e-4813-a09d-2dd00893d07d': 'm²',
    '364e5a5c-32b7-419c-aebb-a4843f07cded': 'm²',
    '6f3105d0-18f7-43f7-9289-deaaf64a95eb': 'm²',
    '6ff2f328-2693-4233-9ead-4891ea63743e': 'm²',
    '1f2c26c2-abf5-4dcd-8ef2-81b0cdd9f793': 'm²',
    '92ac660f-a0de-49b9-a58c-748ceb292c99': 'm²',
    'cba9b2fb-f2ae-49d7-880f-136133137940': 'm²',
    '1cfc465c-6a6e-42d3-ba6e-c759ad660b27': 'm²',
    'dd81a5ab-584c-435b-bf76-03938af305df': 'm²',
    'ec50e5bd-2ff2-4dab-b883-bf4789be5694': 'm²',
    'c708ced2-7b5a-4860-b240-d65da607a39e': 'm²',
    'd5c3f715-dbee-4952-b182-765b74dcc429': 'm²',
    '7427d6a1-089c-48a1-bc4a-3d627d7cf873': 'm²',
    'ed64565d-f043-420c-8210-86290d123483': 'pcs',
    '98c04c06-0723-43b0-a100-6bf087bae0d7': 'm',
    '5d15b908-e2ab-44d1-894d-4179d8f3be8b': 'm²',

    // Plastering / Stucco Works
    '2eb2c9f6-2d09-4c35-8a99-d4a84952b11d': 'Ltr',
    '9937162c-9335-4260-a211-fc6295d41ef4': 'm³',
    '2e131253-45a0-4c7d-add0-19611ef318b6': 'Ton',
    '3942cb95-38aa-4bca-a00a-b4ab0700a5a8': 'Ltr',
    '1765dc0e-e15b-4262-9067-f841a254e006': 'm²'
};

export const FALLBACK_ITEM_ID_MAP = {
    '0031ff5b-9aea-4973-bc02-6b37b5ca0b35': '57cb4d22-df8c-4484-b174-96be445bc40f',
    'b6cb2aff-8a50-4172-9f82-51b77bab90ad': '57cb4d22-df8c-4484-b174-96be445bc40f',
    'cf6ab0b7-8020-4f9a-aadd-954043d8172b': '3ff2bcf0-9fb9-4e0e-a759-72fc6fb61d23',
    'd2c1df2b-363e-4813-a09d-2dd00893d07d': '3ff2bcf0-9fb9-4e0e-a759-72fc6fb61d23',
    '6f3105d0-18f7-43f7-9289-deaaf64a95eb': '364e5a5c-32b7-419c-aebb-a4843f07cded',
    '1f2c26c2-abf5-4dcd-8ef2-81b0cdd9f793': '6ff2f328-2693-4233-9ead-4891ea63743e',
    'cba9b2fb-f2ae-49d7-880f-136133137940': '92ac660f-a0de-49b9-a58c-748ceb292c99',
    'dd81a5ab-584c-435b-bf76-03938af305df': '1cfc465c-6a6e-42d3-ba6e-c759ad660b27',
    'c708ced2-7b5a-4860-b240-d65da607a39e': 'ec50e5bd-2ff2-4dab-b883-bf4789be5694',
    '7427d6a1-089c-48a1-bc4a-3d627d7cf873': 'd5c3f715-dbee-4952-b182-765b74dcc429'
};

export function extractDropdownDetails(itemsDb, searchIdRaw, fallbackName) {
    if (!searchIdRaw) return { name: fallbackName, unit: "m³", unitCost: 0, extraPct: 0, found: false };
    const searchId = String(searchIdRaw).trim().toLowerCase();
    
    // 1. Check if searchId directly matches a civil_material_types or finishes_type record by id or item_id
    const matchedCivil = itemsDb.find(d => d && (String(d.id || '').toLowerCase() === searchId || String(d.item_id || '').toLowerCase() === searchId) && d.item_id);
    const targetItemId = matchedCivil
        ? String(matchedCivil.item_id).toLowerCase()
        : (FALLBACK_ITEM_ID_MAP[searchId] || searchId);

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
            if (String(item.phase_id || '').toLowerCase() !== String(phaseId || '').toLowerCase()) {
                return false;
            }
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
    const effUnitCost = params.unitCostOverride !== undefined ? params.unitCostOverride : details.unitCost;
    const totalCost = finalQty * effUnitCost;
    
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
        const itemSpawner = String(item._spawnerid || item._spawnerId || item.rowIdFlag || '').trim().toLowerCase();
        const targetSpawner = String(rowIdFlag).trim().toLowerCase();
        
        const itemPhase = String(item.phase_id || '').toLowerCase().trim();
        const targetPhase = String(phaseId || '').toLowerCase().trim();
        const isPhaseMatch = (itemPhase === targetPhase) || 
                             (itemPhase === 'unknown_phase' || itemPhase === '') ||
                             (targetPhase === 'unknown_phase' || targetPhase === '') ||
                             (itemSpawner.startsWith('_isem') && targetSpawner.startsWith('_isem') && itemSpawner === targetSpawner);

        const isMatch = isPhaseMatch && (
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
        if (isMatch) {
            indices.push(i);
        }
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
        let currentUnitCost = params.unitCostOverride !== undefined 
            ? params.unitCostOverride 
            : (existing.unit_cost !== undefined ? Number(existing.unit_cost) : details.unitCost);
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
        const currentActivityType = params.activityType !== undefined ? params.activityType : (existing.activity_type !== undefined ? existing.activity_type : activityType);
        const currentWorkType = params.workType || params.work_type || existing.work_type || "Civil";
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
            existing.work_type !== currentWorkType ||
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
                main_category: params.mainCategory || params.main_category || existing.main_category || "Construction",
                work_type: currentWorkType,
                work_main_category: workMainCategory,
                quantity: baseQty,
                base_qty: baseQty,
                item: currentItem,
                item_name: currentItem,
                item_uuid: currentItemUuid,
                _spawnerid: rowIdFlag,
                rowIdFlag: rowIdFlag,
                _isautogenerated: true,
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
            _isAutoGenerated: true,
            _isautogenerated: true,
            [rowIdFlag]: true,
            _spawnerid: rowIdFlag,
            rowIdFlag: rowIdFlag,
            item_uuid: details.id,
            tender_log_id: proposalId,
            proposal_id: proposalId,
            phase_id: phaseId,
            phase_component: phaseComponent,
            main_category: params.mainCategory || params.main_category || "Construction",
            work_type: params.workType || params.work_type || "Civil",
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
            unit_cost: effUnitCost,
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
        totalCost: row.total_cost || 0,
        days: row.days_to_complete || 0,
        laborers: row.total_laborers_per_day || 0,
        changed
    };
}

export function buildWaterFeatureStructuralBoq(formData, masterBreakdownItems = [], dropdownOptions = {}, parentWF = null) {
    let u = { ...formData };
    let updatedBreakdown = [...(masterBreakdownItems || [])];
    let changed = false;

    const currentPhaseId = u.linked_phase || u.phase_id || 'UNKNOWN_PHASE';
    const activeProposalId = u.linked_proposal || u.tender_log_id || u.project_title || u.proposal_id || '';
    const itemsDb = getAllItemsDb(dropdownOptions);

    const phaseRecord = dropdownOptions?.phases?.find(p => String(p.id) === String(currentPhaseId)) || {};
    const wfRecord = dropdownOptions?.proposal_data_entry?.find(p => String(p.id) === String(currentPhaseId) || String(p.linked_phase) === String(currentPhaseId) || String(p.phase_id) === String(currentPhaseId)) || {};

    let phaseComponentTarget = 'Water Feature';
    const catUuid = u.water_feature_category || parentWF?.water_feature_category || phaseRecord?.water_feature_category || wfRecord?.water_feature_category;
    if (catUuid) {
        const matchedCat = dropdownOptions?.water_feature_categories?.find(c => String(c.id).toLowerCase() === String(catUuid).toLowerCase());
        if (matchedCat) {
            phaseComponentTarget = matchedCat.name || matchedCat.category_name || 'Water Feature';
        }
    }
    
    const checkAccom = (val) => {
        if (val === undefined || val === null || String(val).trim() === '') return true;
        const strVal = String(val).toLowerCase().trim();
        if (strVal === 'no' || strVal === 'false' || strVal === '0') return false;
        return true;
    };
    const isAccomRequired = checkAccom(u.accommodations_required) && 
        checkAccom(u.accommodations) && 
        checkAccom(parentWF?.accommodations_required) && 
        checkAccom(phaseRecord?.accommodations_required) && 
        checkAccom(wfRecord?.accommodations_required);

    // --- EXCAVATION WORKS (LAGOON EARTHWORKS) BOQ ---
    let excavationScale = 1;
    const excErp = parseFloat(u.qty_excavation_m3_erp || u.qty_excavation_m3) || 0;
    const excUser = parseFloat(u.qty_excavation_m3_user);
    if (excUser > 0 && excErp > 0) {
        excavationScale = excUser / excErp;
    }
    const geotextilesQty = (parseFloat(u.qty_geotextiles_m2) || 0) * excavationScale;
    const geomembranesQty = (parseFloat(u.qty_geomembranes_m2) || 0) * excavationScale;
    const geonetsQty = (parseFloat(u.qty_geonets_m2) || 0) * excavationScale;

    const geotextilesRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Geotextiles Works', activityType: 'Procurement',
        searchKey: 'Geotextiles 150g/m2', fallbackName: 'Geotextiles 150g/m2',
        baseQty: geotextilesQty, itemsDb, rowIdFlag: '_isGeotextilesAuto', responsibility: 'P.Zone'
    });
    if (geotextilesRes.changed) changed = true;

    const geomembranesRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Geomembrane Works', activityType: 'Procurement',
        searchKey: 'HDPE Geomembrane 1.5mm', fallbackName: 'HDPE Geomembrane 1.5mm',
        baseQty: geomembranesQty, itemsDb, rowIdFlag: '_isGeomembranesAuto', responsibility: 'P.Zone'
    });
    if (geomembranesRes.changed) changed = true;

    const geonetsRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Geonets Works', activityType: 'Procurement',
        searchKey: 'Geonets / Drainage Nets', fallbackName: 'Geonets / Drainage Nets',
        baseQty: geonetsQty, itemsDb, rowIdFlag: '_isGeonetsAuto', responsibility: 'P.Zone'
    });
    if (geonetsRes.changed) changed = true;

    // --- COFFOR BOQ ---
    const isCofforFormwork = String(u.concrete_forming_type || '').toLowerCase().includes('coffor') ||
                            String(u.concrete_forming_type || '').toLowerCase() === 'dcf713e9-afca-44fe-a577-2cab176f1d2d' ||
                            !u.concrete_forming_type;
    const cofforQty = isCofforFormwork 
        ? (u.coffor_qty_m2_user !== undefined && u.coffor_qty_m2_user !== null && u.coffor_qty_m2_user !== '' 
            ? parseFloat(u.coffor_qty_m2_user) 
            : parseFloat(u.coffor_qty_m2_erp) || 0)
        : 0;
    
    const cofforRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Coffor', activityType: 'Procurement',
        searchKey: 'dcf713e9-afca-44fe-a577-2cab176f1d2d', fallbackName: 'Supply Coffor Panels',
        baseQty: cofforQty, itemsDb, rowIdFlag: '_isCofforAuto', responsibility: 'P.Zone'
    });
    if (cofforRes.changed) changed = true;

    const cofforTransportQty = cofforQty > 0 ? Math.ceil(cofforQty / 1800) : 0;
    const cofforTransportRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Coffor', activityType: 'Procurement',
        searchKey: 'Coffor Panels Transportation', fallbackName: 'Coffor Panels Transportation',
        baseQty: cofforTransportQty, itemsDb, rowIdFlag: '_isCofforTransportAuto', responsibility: 'P.Zone'
    });
    if (cofforTransportRes.changed) changed = true;

    const wfArea = Number(u.water_feature_area_m2 || u.water_feature_area || u.area || parentWF?.water_feature_area_m2 || parentWF?.water_feature_area || parentWF?.area || wfRecord?.water_feature_area_m2 || wfRecord?.water_feature_area || wfRecord?.area || phaseRecord?.water_feature_area_m2 || phaseRecord?.water_feature_area || phaseRecord?.area || 0);
    let calcCofforDays = 0;
    if (wfArea > 0 && cofforQty > 0) {
        if (wfArea <= 1000) calcCofforDays = 4;
        else if (wfArea <= 2500) calcCofforDays = 7;
        else if (wfArea <= 4000) calcCofforDays = 10;
        else if (wfArea <= 5500) calcCofforDays = 10;
        else if (wfArea <= 7000) calcCofforDays = 10;
        else if (wfArea <= 8500) calcCofforDays = 12;
        else if (wfArea <= 10000) calcCofforDays = 12;
        else if (wfArea <= 12000) calcCofforDays = 15;
        else if (wfArea <= 14000) calcCofforDays = 25;
        else if (wfArea <= 16000) calcCofforDays = 30;
        else if (wfArea <= 18000) calcCofforDays = 30;
        else calcCofforDays = 30;
    }

    const cofforSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Coffor', activityType: 'Installation',
        searchKey: 'Subcontractor for Coffor installation works', fallbackName: 'Subcontractor for Coffor installation works',
        baseQty: cofforQty, itemsDb, rowIdFlag: '_isCofforSubAuto', responsibility: 'P.Zone',
        daysToComplete: calcCofforDays, productivityRatePerDay: 50, laborersPerGroup: 3
    });
    if (cofforSubRes.changed) changed = true;

    const totalCofforDaysWithoutMicrobus = Math.max(cofforRes.days, cofforSubRes.days);
    const totalCofforLaborersWithoutMicrobus = Math.ceil(cofforRes.laborers + cofforSubRes.laborers);

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

    const totalCofforCost = cofforRes.totalCost + cofforTransportRes.totalCost + cofforSubRes.totalCost + cofforApartmentRes.totalCost + cofforMicrobusRes.totalCost;
    const totalCofforDays = Math.ceil(totalCofforDaysWithoutMicrobus + cofforApartmentRes.days + cofforMicrobusRes.days);
    const totalCofforLaborers = Math.ceil(totalCofforLaborersWithoutMicrobus + cofforApartmentRes.laborers + cofforMicrobusRes.laborers);

    if (u.coffor_total_cost !== Number(totalCofforCost.toFixed(2))) {
        u.coffor_total_cost = Number(totalCofforCost.toFixed(2));
        u.coffor_unit_cost = cofforQty > 0 ? Number((totalCofforCost / cofforQty).toFixed(2)) : 0;
        u.coffor_no_of_days_to_complete_installation = totalCofforDays;
        u.coffor_no_of_laborers = totalCofforLaborers;
        changed = true;
    }

    // 1. PLAIN CONCRETE
    const pcQty = u.qty_pc_m3_user !== undefined && u.qty_pc_m3_user !== null && u.qty_pc_m3_user !== '' 
        ? parseFloat(u.qty_pc_m3_user) 
        : parseFloat(u.qty_pc_total_m3) || parseFloat(u.qty_pc_m3) || parseFloat(u.qty_pc_m3_erp) || 0;

    const pcRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete',
        searchKey: u.pc_grade || u.grade_of_plain_concrete_used,
        fallbackName: '⚠️ Please select a Grade of Plain Concrete',
        baseQty: pcQty, itemsDb, rowIdFlag: '_isPcAuto'
    });
    if (pcRes.changed) changed = true;

    const pcSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete',
        searchKey: 'Subcontractor for casting and compacting plain concrete',
        fallbackName: 'Subcontractor for casting and compacting plain concrete',
        baseQty: pcQty, itemsDb, rowIdFlag: '_isPcSubAuto', responsibility: 'P.Zone',
        activityType: 'Installation', laborersPerGroup: 4, productivityRatePerDay: 300, daysToComplete: Math.ceil(pcQty / 300)
    });
    if (pcSubRes.changed) changed = true;

    const pcCarpentrySubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete',
        searchKey: 'Subcontractor for carpentry of plain concrete formwork',
        fallbackName: 'Subcontractor for carpentry of plain concrete formwork',
        baseQty: pcQty, itemsDb, rowIdFlag: '_isPcCarpentrySubAuto', responsibility: 'P.Zone',
        activityType: 'Installation', laborersPerGroup: 3, productivityRatePerDay: 50, daysToComplete: Math.ceil(pcQty / 50)
    });
    if (pcCarpentrySubRes.changed) changed = true;

    const pcTestReportRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete', activityType: 'Procurement',
        searchKey: 'Concrete slump test for plain concrete', fallbackName: 'Concrete slump test for plain concrete',
        baseQty: pcQty > 0 ? 1 : 0, itemsDb, rowIdFlag: '_isPcTestReportAuto', responsibility: 'P.Zone'
    });
    if (pcTestReportRes.changed) changed = true;

    const perimeter = Number(
        u.water_feature_perimeter_m || u.water_feature_perimeter || u.pool_perimeter_m || u.perimeter || 
        (Number(u.pc_length_m) > 0 && Number(u.pc_width_m) > 0 ? 2 * (Number(u.pc_length_m) + Number(u.pc_width_m)) : 0) ||
        parentWF?.water_feature_perimeter_m || parentWF?.water_feature_perimeter || parentWF?.pool_perimeter_m || parentWF?.perimeter || 
        phaseRecord?.water_feature_perimeter_m || phaseRecord?.water_feature_perimeter || phaseRecord?.perimeter || 
        wfRecord?.water_feature_perimeter_m || wfRecord?.perimeter || 0
    );
    const woodQty = perimeter > 0 ? Number((((perimeter / 3) / 133) * 1.1).toFixed(3)) : 0;
    const woodRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete', activityType: 'Procurement',
        searchKey: 'e0d55ddf-df78-41c0-a0d7-13100f8ebd1b',
        fallbackName: 'Supply Wood for Plain Concrete',
        baseQty: woodQty, itemsDb, rowIdFlag: '_isWoodAuto'
    });
    if (woodRes.changed) changed = true;

    const peQty = Number(u.qty_polyethylene_kg || 0);
    const peItemId = (u.polyethylene_brand === '80ac88d0-33c7-4aa8-9e53-e3f9de7ff5f4' || u.polyethylene_brand === 'cc67f864-bdf0-4091-b3f4-7db297fc35ab')
      ? 'cc67f864-bdf0-4091-b3f4-7db297fc35ab'
      : (u.polyethylene_brand === 'e1650748-60f8-429d-8c52-d6b6d9cd1bea' || u.polyethylene_brand === '8c665915-e095-4da7-9d9d-e8477e1295ec')
      ? '8c665915-e095-4da7-9d9d-e8477e1295ec'
      : (u.polyethylene_brand || 'cc67f864-bdf0-4091-b3f4-7db297fc35ab');

    const peRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete', activityType: 'Procurement',
        searchKey: peItemId,
        fallbackName: 'Shouman DPE Geomembrane 400 micron',
        baseQty: peQty, itemsDb, rowIdFlag: '_isPeAuto'
    });
    if (peRes.changed) changed = true;

    const nailsQty = Math.ceil(pcQty);
    const nailsRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete', activityType: 'Procurement',
        searchKey: 'Nails for Plain Concrete formwork',
        fallbackName: 'Nails for Plain Concrete formwork',
        baseQty: nailsQty, itemsDb, rowIdFlag: '_isNailsAuto'
    });
    if (nailsRes.changed) changed = true;

    const mkSprayerQty = pcQty > 0 ? Number((pcQty / (Number(u.pc_thickness_ground_m || u.thickness_of_plain_concrete_used) || 0.1)).toFixed(2)) : 0;
    const mkSprayerRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Plain Concrete', activityType: 'Installation',
        searchKey: 'd584f781-ae2a-4f2f-be1b-f61849a47ffd', fallbackName: 'Laborer for spraying MasterKure 102 on plain concrete',
        baseQty: mkSprayerQty, itemsDb, rowIdFlag: '_isPcMkSprayerAuto', responsibility: 'P.Zone'
    });
    if (mkSprayerRes.changed) changed = true;

    const totalPcDaysWithoutMicrobus = Math.ceil(pcRes.days + pcSubRes.days + pcCarpentrySubRes.days + pcTestReportRes.days + mkSprayerRes.days);
    const totalPcLaborersWithoutMicrobus = Math.ceil(pcRes.laborers + pcSubRes.laborers + pcCarpentrySubRes.laborers + pcTestReportRes.laborers + mkSprayerRes.laborers);

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

    const totalPcCost = pcRes.totalCost + pcSubRes.totalCost + pcCarpentrySubRes.totalCost + pcTestReportRes.totalCost + woodRes.totalCost + peRes.totalCost + nailsRes.totalCost + mkSprayerRes.totalCost + pcApartmentRes.totalCost + pcMicrobusRes.totalCost;
    const totalPcDays = Math.ceil(totalPcDaysWithoutMicrobus + pcApartmentRes.days + pcMicrobusRes.days);
    const totalPcLaborers = Math.ceil(totalPcLaborersWithoutMicrobus + pcApartmentRes.laborers + pcMicrobusRes.laborers);

    if (u.total_cost_pc !== Number(totalPcCost.toFixed(2))) {
        u.total_cost_pc = Number(totalPcCost.toFixed(2));
        u.unit_cost_pc = pcQty > 0 ? Number((totalPcCost / pcQty).toFixed(2)) : 0;
        u.days_to_complete_pc = totalPcDays;
        u.plain_concrete_no_of_laborers = totalPcLaborers;
        changed = true;
    }

    // 2. REINFORCED CONCRETE
    const rcQty = u.total_rc_qty_user !== undefined && u.total_rc_qty_user !== null && u.total_rc_qty_user !== '' 
        ? parseFloat(u.total_rc_qty_user) 
        : parseFloat(u.qty_rc_total_m3) || parseFloat(u.qty_rc_m3) || parseFloat(u.qty_rc_m3_erp) || 0;

    const rcRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete',
        searchKey: u.rc_grade || u.reinforced_concrete_type,
        fallbackName: 'RC Default',
        baseQty: rcQty, itemsDb, rowIdFlag: '_isRcAuto'
    });
    if (rcRes.changed) changed = true;

    const rcRebarDensity = parseFloat(u.rebar_density_kg_m3) || 85;
    const perimeterRc = Number(
        u.water_feature_perimeter_m || u.water_feature_perimeter || u.pool_perimeter_m || u.perimeter || 
        (u.rc_length_m && u.rc_width_m ? 2 * (Number(u.rc_length_m) + Number(u.rc_width_m)) : 0) ||
        parentWF?.water_feature_perimeter_m || parentWF?.water_feature_perimeter || parentWF?.pool_perimeter_m || parentWF?.perimeter || 
        phaseRecord?.water_feature_perimeter_m || phaseRecord?.water_feature_perimeter || phaseRecord?.perimeter || 
        wfRecord?.water_feature_perimeter_m || wfRecord?.perimeter || 0
    );

    const rcVibratorQty = Math.ceil((36 / 7000) * rcQty);
    const rcVibRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: 'Vibrator', fallbackName: 'Vibrator',
        baseQty: rcVibratorQty, itemsDb, rowIdFlag: '_isRcVibAuto', responsibility: 'P.Zone'
    });
    if (rcVibRes.changed) changed = true;

    const wireQty = Math.ceil(((rcQty * rcRebarDensity) / 1000) * (10 / 20));
    const wireRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: '58431af0-0ccb-45e8-b48e-098d857448e1', fallbackName: 'Tided Wire For Reinforced Concrete Works',
        baseQty: wireQty, itemsDb, rowIdFlag: '_isRcWireAuto', responsibility: 'P.Zone'
    });
    if (wireRes.changed) changed = true;

    const rebarQty = Math.ceil((rcQty * rcRebarDensity) / 1000);
    const rebarRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: u.rebar_diameter_mm || u.rebar_item_id || 'no-rebar', fallbackName: 'Rebar',
        baseQty: rebarQty, itemsDb, rowIdFlag: '_isRcRebarAuto', responsibility: 'P.Zone'
    });
    if (rebarRes.changed) changed = true;

    const steelSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Installation',
        searchKey: 'Subcontractor for reinforced steel fabrication works', fallbackName: 'Subcontractor for reinforced steel fabrication works',
        baseQty: rcQty, laborersPerGroup: 2, productivityRatePerDay: 30, itemsDb, rowIdFlag: '_isRcSteelSubAuto', responsibility: 'P.Zone'
    });
    if (steelSubRes.changed) changed = true;

    const expJointLength = Number(u.expansion_joint_length_m || u.expansion_joint_lengths_m || u.expansion_joint_lengths || 0);
    const expJointSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Installation',
        searchKey: '55762308-683e-4985-a775-2d459f7609b2', fallbackName: 'Subcontractor for installing expansion joints for reinforced concrete works',
        baseQty: Math.ceil(expJointLength), itemsDb, rowIdFlag: '_isRcExpJointSubAuto', responsibility: 'P.Zone'
    });
    if (expJointSubRes.changed) changed = true;

    const expJointRebarQty = expJointLength > 0 ? Math.ceil(expJointLength) : 0;
    const expJointRebarRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: '8191d1b9-9faa-4fad-8eeb-f7cfaba86791', fallbackName: 'Rebar 22 mm For Expansion Joints',
        baseQty: expJointRebarQty, itemsDb, rowIdFlag: '_isRcExpJointRebarAuto', responsibility: 'P.Zone'
    });
    if (expJointRebarRes.changed) changed = true;

    const heliArea = Number(
        u.water_feature_area_m2 || u.area_m2 || u.water_feature_area || u.area ||
        parentWF?.water_feature_area_m2 || parentWF?.water_feature_area || parentWF?.area ||
        wfRecord?.water_feature_area_m2 || wfRecord?.water_feature_area || wfRecord?.area ||
        phaseRecord?.water_feature_area_m2 || phaseRecord?.water_feature_area || phaseRecord?.area || 0
    );
    const heliSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Installation',
        searchKey: '1d591b2e-14af-4f75-b7a6-d1f25e47017d', fallbackName: 'Subcontractor for Helicopter of Reinforced Concrete Works',
        baseQty: Math.ceil(heliArea), itemsDb, rowIdFlag: '_isRcHelicopterSubAuto', responsibility: 'P.Zone'
    });
    if (heliSubRes.changed) changed = true;

    const rcCastingSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Installation',
        searchKey: 'b3ccc124-23e7-4e6f-855f-e8c247c34d71', fallbackName: 'Subcontractor for casting and compacting reinforced concrete',
        baseQty: rcQty, laborersPerGroup: 6, productivityRatePerDay: 300, itemsDb, rowIdFlag: '_isRcCastingSubAuto', responsibility: 'P.Zone'
    });
    if (rcCastingSubRes.changed) changed = true;

    const rcCarpentrySubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Installation',
        searchKey: '856f371d-e7e2-44c0-88ab-d26623672efd', fallbackName: 'Subcontractor for carpentry of reinforced concrete formwork',
        baseQty: rcQty, itemsDb, rowIdFlag: '_isRcCarpentrySubAuto', responsibility: 'P.Zone'
    });
    if (rcCarpentrySubRes.changed) changed = true;

    const pvcSleevesRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: '5a2457b5-42bd-4b18-9904-e94869e57b89', fallbackName: 'Sleeves PVC for Expansion Joints',
        baseQty: Math.ceil(expJointLength), itemsDb, rowIdFlag: '_isRcPvcSleevesAuto', responsibility: 'P.Zone'
    });
    if (pvcSleevesRes.changed) changed = true;

    const sikaWaterbarsRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: 'b976a5e4-1fb7-49f9-aeb8-deb94f17cc4c', fallbackName: 'Sika Waterbars in 24 1mm thickness for reinforced concrete',
        baseQty: Math.ceil(expJointLength / 30), itemsDb, rowIdFlag: '_isRcSikaWaterbarsAuto', responsibility: 'P.Zone'
    });
    if (sikaWaterbarsRes.changed) changed = true;

    const sikaflexRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: '4e96da84-48fa-4e17-aa9f-bce707e9121d', fallbackName: 'Sika flex For Filling the Expansion Joints',
        baseQty: Math.ceil(expJointLength / 5), itemsDb, rowIdFlag: '_isRcSikaflexAuto', responsibility: 'P.Zone'
    });
    if (sikaflexRes.changed) changed = true;

    const controlJointLength = Number(u.control_joint_length_m || u.control_joint_lengths_m || u.control_joint_lengths || 0);
    const sikaflexControlRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: 'b6333221-2043-4680-8eba-eec9c50c8cc1', fallbackName: 'Sika flex For Filling the Control Joints',
        baseQty: Math.ceil(controlJointLength / 5), itemsDb, rowIdFlag: '_isRcSikaflexControlAuto', responsibility: 'P.Zone'
    });
    if (sikaflexControlRes.changed) changed = true;

    const backingRodRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: '56672829-ce3e-4003-a664-0357f6208b6f', fallbackName: 'Sika Backing Rod® - 30mm diameter for grouting reinforced concrete joints',
        baseQty: Math.ceil(expJointLength), itemsDb, rowIdFlag: '_isRcSikaBackingRodAuto', responsibility: 'P.Zone'
    });
    if (backingRodRes.changed) changed = true;

    const rcTestReportRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: 'b97fcb98-dba9-495f-a645-6cc9e2e9d706', fallbackName: 'Reinforced Concrete test report',
        baseQty: Math.ceil((rcQty / 100) * 6), itemsDb, rowIdFlag: '_isRcTestReportAuto', responsibility: 'P.Zone'
    });
    if (rcTestReportRes.changed) changed = true;

    const rcControlJointSubRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Installation',
        searchKey: 'edde8713-4317-4abb-b4d3-241be5fd6c65', fallbackName: 'Subcontractor for cutting and assembling control joints for reinforced concrete works',
        baseQty: Math.ceil(controlJointLength), itemsDb, rowIdFlag: '_isRcControlJointSubAuto', responsibility: 'P.Zone'
    });
    if (rcControlJointSubRes.changed) changed = true;

    const metalAnglesRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: '4ce529e0-9dcc-4cf3-9753-67ff4fe88cc6', fallbackName: 'Metal angels for axises',
        baseQty: Math.ceil((1000 / 6804) * controlJointLength), itemsDb, rowIdFlag: '_isRcMetalAnglesAuto', responsibility: 'P.Zone'
    });
    if (metalAnglesRes.changed) changed = true;

    const rcWoodQty = perimeterRc > 0 ? Number((perimeterRc / 1.1 / 133).toFixed(3)) : 0;
    const rcWoodRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: 'e4be903c-63f2-4185-a908-283cb48afe03', fallbackName: 'wood for Reinforced Concrete formwork',
        baseQty: rcWoodQty, itemsDb, rowIdFlag: '_isRcWoodAuto', responsibility: 'P.Zone'
    });
    if (rcWoodRes.changed) changed = true;

    const idxNails = updatedBreakdown.findIndex(item => item['_isRcNailsAuto'] === true && item.phase_id === currentPhaseId);
    if (idxNails >= 0) updatedBreakdown.splice(idxNails, 1);
    
    const idxLab = updatedBreakdown.findIndex(item => item['_isRcGenLaborerAuto'] === true && item.phase_id === currentPhaseId);
    if (idxLab >= 0) updatedBreakdown.splice(idxLab, 1);

    const spacingQty = controlJointLength > 0 ? Math.ceil((100 / 1400) * controlJointLength) : 0;
    const spacingRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: '82488e0c-42a6-4bb1-9750-d57e9a06a48d', fallbackName: 'Concrete spacing',
        baseQty: spacingQty, itemsDb, rowIdFlag: '_isRcSpacingAuto', responsibility: 'P.Zone'
    });
    if (spacingRes.changed) changed = true;

    const mkRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Procurement',
        searchKey: '9874ca96-8908-491c-ae92-7c4852003fa0',
        fallbackName: 'MasterKure 102 For Reinforced Concrete Curing',
        baseQty: rcQty > 0 ? Math.ceil(rcQty / 200) : 0, itemsDb, rowIdFlag: '_isMkAuto'
    });
    if (mkRes.changed) changed = true;

    const sprayerRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Reinforced Concrete', activityType: 'Installation',
        searchKey: 'd4f04b31-62e0-48dc-b5bd-41930997ca98',
        fallbackName: 'Laborer for spraying concrete treatment material',
        baseQty: rcQty > 0 ? Math.ceil(rcQty / 200) : 0, itemsDb, rowIdFlag: '_isSprayerAuto', responsibility: 'P.Zone'
    });
    if (sprayerRes.changed) changed = true;

    const totalRcDaysWithoutMicrobus = Math.ceil(rcRes.days + rcVibRes.days + wireRes.days + rebarRes.days + steelSubRes.days + expJointSubRes.days + expJointRebarRes.days + heliSubRes.days + rcCastingSubRes.days + rcCarpentrySubRes.days + pvcSleevesRes.days + sikaWaterbarsRes.days + sikaflexRes.days + sikaflexControlRes.days + backingRodRes.days + rcTestReportRes.days + rcControlJointSubRes.days + metalAnglesRes.days + rcWoodRes.days + spacingRes.days + sprayerRes.days);
    const totalRcLaborersWithoutMicrobus = Math.ceil(rcRes.laborers + rcVibRes.laborers + wireRes.laborers + rebarRes.laborers + steelSubRes.laborers + expJointSubRes.laborers + expJointRebarRes.laborers + heliSubRes.laborers + rcCastingSubRes.laborers + rcCarpentrySubRes.laborers + pvcSleevesRes.laborers + sikaWaterbarsRes.laborers + sikaflexRes.laborers + sikaflexControlRes.laborers + backingRodRes.laborers + rcTestReportRes.laborers + rcControlJointSubRes.laborers + metalAnglesRes.laborers + rcWoodRes.laborers + spacingRes.laborers + sprayerRes.laborers);

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

    const totalRcCost = rcRes.totalCost + rcVibRes.totalCost + wireRes.totalCost + rebarRes.totalCost + steelSubRes.totalCost + expJointSubRes.totalCost + expJointRebarRes.totalCost + heliSubRes.totalCost + rcCastingSubRes.totalCost + rcCarpentrySubRes.totalCost + pvcSleevesRes.totalCost + sikaWaterbarsRes.totalCost + sikaflexRes.totalCost + sikaflexControlRes.totalCost + backingRodRes.totalCost + rcTestReportRes.totalCost + rcControlJointSubRes.totalCost + metalAnglesRes.totalCost + rcWoodRes.totalCost + spacingRes.totalCost + mkRes.totalCost + sprayerRes.totalCost + rcApartmentRes.totalCost + rcMicrobusRes.totalCost;
    const totalRcDays = Math.ceil(totalRcDaysWithoutMicrobus + rcApartmentRes.days + rcMicrobusRes.days);
    const totalRcLaborers = Math.ceil(totalRcLaborersWithoutMicrobus + rcApartmentRes.laborers + rcMicrobusRes.laborers);

    if (u.rc_total_cost !== Number(totalRcCost.toFixed(2))) {
        u.rc_total_cost = Number(totalRcCost.toFixed(2));
        u.rc_unit_cost = rcQty > 0 ? Number((totalRcCost / rcQty).toFixed(2)) : 0;
        u.rc_no_of_days_to_complete_installation = totalRcDays;
        u.rc_no_of_laborers = totalRcLaborers;
        changed = true;
    }

    // 7. WATERPROOFING
    let bituWpQtyRaw = u.bituminous_wp_qty_m2_user !== undefined && u.bituminous_wp_qty_m2_user !== null && u.bituminous_wp_qty_m2_user !== ''
        ? parseFloat(u.bituminous_wp_qty_m2_user)
        : parseFloat(u.qty_bituminous_waterproofing_m2) || parseFloat(u.qty_wp_bituminous_m2) || parseFloat(u.bituminous_wp_qty_m2_erp) || 0;
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

    const waterExtProtectQty = Number(u.quantity_of_water_for_protective_plastering_for_external_insulation_for_water_feature_ltr || u.water_for_protective_plaster_ext_ltr || u.qty_water_ext_protect_ltr || 0);
    const waterExtQty = Number(u.quantity_of_water_for_external_plastering_for_water_feature_ltr || u.water_for_ext_plastering_ltr || u.qty_water_ext_ltr || 0);
    const bituWaterQty = waterExtProtectQty + waterExtQty;

    const bituWaterRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Water For External water proofing',
        fallbackName: 'Water For External water proofing',
        baseQty: bituWaterQty, itemsDb, rowIdFlag: '_isBituWaterAuto', responsibility: 'P.Zone'
    });
    if (bituWaterRes.changed) changed = true;

    const sandProtectiveM3 = Number(u.quantity_of_sand_for_protective_plastering_for_external_insulation_for_water_feature_m3 || u.sand_for_protective_plaster_ext_m3 || u.qty_sand_ext_protect_m3 || 0);
    const sandExternalM3 = Number(u.quantity_of_sand_for_external_plastering_for_water_feature_m3 || u.sand_for_ext_plastering_m3 || u.qty_sand_ext_m3 || 0);
    const totalSandM3 = sandProtectiveM3 + sandExternalM3;

    const bituSandRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Sand For External waterproofing',
        fallbackName: 'Sand For External waterproofing',
        baseQty: totalSandM3, itemsDb, rowIdFlag: '_isBituSandAuto', responsibility: 'P.Zone'
    });
    if (bituSandRes.changed) changed = true;

    const groutRepairQty = Number(u.quantity_of_grout_for_repairing_external_concrete_defects || u.grout_for_ext_concrete_defects_m3 || u.qty_grout_ext_repair_m3 || 0);
    const bituSikaRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: '19236bf1-35b7-40f2-b540-7b88975aaac8',
        fallbackName: 'Bituminous Waterproofing: Sikagrout ® - 200 for waterproofing works',
        baseQty: groutRepairQty, itemsDb, rowIdFlag: '_isBituSikaAuto', responsibility: 'P.Zone'
    });
    if (bituSikaRes.changed) changed = true;

    const cementProtectiveTons = Number(u.quantity_of_cement_for_protective_plastering_for_external_insulation_for_water_feature_tons || u.cement_for_protective_plaster_ext_tons || u.qty_cement_ext_protect_tons || 0);
    const cementExternalTons = Number(u.quantity_of_cement_for_external_plastering_for_water_feature_tons || u.cement_for_ext_plastering_tons || u.qty_cement_ext_tons || 0);
    const totalCementTons = cementProtectiveTons + cementExternalTons;

    const bituCementRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        searchKey: 'Cement For External waterproofing',
        fallbackName: 'Cement For External waterproofing',
        baseQty: totalCementTons, itemsDb, rowIdFlag: '_isBituCementAuto', responsibility: 'P.Zone'
    });
    if (bituCementRes.changed) changed = true;

    const adipondLiters = Number(u.quantity_of_adipond_for_external_plastering_for_water_feature_ltr || u.adipond_for_ext_plastering_ltr || u.qty_adipond_ext_ltr || 0);
    const bituAddibondQty = Math.ceil(adipondLiters / 20);

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

    const bituApartmentQty = (bituWpQtyRaw > 0 && isAccomRequired) ? Math.ceil(totalBituLaborersWithoutMicrobus / 6) * totalBituDaysWithoutMicrobus : 0;
    const bituApartmentRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        activityType: 'Accommodation',
        searchKey: 'Apartment class C',
        fallbackName: 'Apartment class C',
        baseQty: bituApartmentQty, itemsDb, rowIdFlag: '_isBituApartmentAuto', responsibility: 'P.Zone'
    });
    if (bituApartmentRes.changed) changed = true;

    const bituMicrobusQty = (bituWpQtyRaw > 0 && isAccomRequired) ? Math.ceil(totalBituLaborersWithoutMicrobus / 14) * totalBituDaysWithoutMicrobus : 0;
    const bituMicrobusRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Bituminous Waterproofing',
        activityType: 'Accommodation',
        searchKey: 'Micro bus',
        fallbackName: 'Micro bus',
        baseQty: bituMicrobusQty, itemsDb, rowIdFlag: '_isBituMicrobusAuto', responsibility: 'P.Zone'
    });
    if (bituMicrobusRes.changed) changed = true;

    let totalBituCost = bituRes.totalCost + bituMaterialRes.totalCost + bituMembraneMaterialRes.totalCost + bituMembraneSubRes.totalCost + bituBituminousSubRes.totalCost + bituWaterRes.totalCost + bituSandRes.totalCost + bituSikaRes.totalCost + bituCementRes.totalCost + bituAddibondRes.totalCost + bituApartmentRes.totalCost + bituMicrobusRes.totalCost;
    let totalBituDays = Math.ceil(totalBituDaysWithoutMicrobus + bituApartmentRes.days + bituMicrobusRes.days);
    let totalBituLaborers = Math.ceil(totalBituLaborersWithoutMicrobus + bituApartmentRes.laborers + bituMicrobusRes.laborers);

    if (u.bituminous_wp_total_cost !== Number(totalBituCost.toFixed(2)) || u.bituminous_wp_no_of_days_to_complete_installation !== totalBituDays || u.bituminous_wp_no_of_laborers !== totalBituLaborers) {
        u.bituminous_wp_total_cost = Number(totalBituCost.toFixed(2));
        u.bituminous_wp_unit_cost = bituWpQtyRaw > 0 ? Number((totalBituCost / bituWpQtyRaw).toFixed(2)) : 0;
        u.bituminous_wp_no_of_days_to_complete_installation = totalBituDays;
        u.bituminous_wp_no_of_laborers = totalBituLaborers;
        changed = true;
    }

    // 8. CEMENTITIOUS WP
    let cemWpQtyRaw = u.cementitious_wp_qty_m2_user !== undefined && u.cementitious_wp_qty_m2_user !== null && u.cementitious_wp_qty_m2_user !== ''
        ? parseFloat(u.cementitious_wp_qty_m2_user)
        : parseFloat(u.qty_cementitious_waterproofing_m2) || parseFloat(u.qty_wp_cementitious_m2) || parseFloat(u.cementitious_wp_qty_m2_erp) || 0;
    const cemWpQty = Math.ceil(cemWpQtyRaw);

    const cemMaterialDetails = extractDropdownDetails(itemsDb, u.wp_cementitious_material || u.type_of_cementitious_waterproofing || u.cementitious_wp_boq_title, 'Cementitious Waterproofing');
    const cemMaterialSpecRate = cemMaterialDetails.specificationRate > 0 ? cemMaterialDetails.specificationRate : 1;
    const cemLayers = Number(u.wp_cementitious_layers) || 2;
    const cemMaterialQty = Math.ceil((cemWpQtyRaw * cemLayers) / cemMaterialSpecRate);

    const cemRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        searchKey: u.wp_cementitious_material || u.type_of_cementitious_waterproofing || u.cementitious_wp_boq_title,
        fallbackName: cemMaterialDetails.name,
        baseQty: cemMaterialQty, itemsDb, rowIdFlag: '_isCemAuto'
    });
    if (cemRes.changed) changed = true;

    const cemWaterQty = Number(u.qty_water_int_ltr || (u.qty_cement_int_tons ? Number((u.qty_cement_int_tons * 0.5 * 1000).toFixed(1)) : 0));
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

    const cemSikaQty = Number(u.qty_grout_int_repair_m3 || Number((cemWpQty * 0.001).toFixed(4)));
    const cemSikaRes = upsertBoqRow(updatedBreakdown, {
        phaseId: currentPhaseId, proposalId: activeProposalId, phaseComponent: phaseComponentTarget,
        workMainCategory: 'Cementitious Waterproofing',
        searchKey: 'f5fa7506-b946-4491-aa96-d0263cb23614',
        fallbackName: 'Cementitious Waterproofing: Sikagrout ® - 200',
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
        u.cementitious_wp_unit_cost = cemWpQtyRaw > 0 ? Number((totalCemCost / cemWpQtyRaw).toFixed(2)) : 0;
        u.cementitious_wp_no_of_days_to_complete_installation = totalCemDays;
        u.cementitious_wp_no_of_laborers = totalCemLaborers;
        changed = true;
    }

    const sortedBreakdown = [...updatedBreakdown].sort((a, b) => (Number(b.total_cost) || 0) - (Number(a.total_cost) || 0));
    u.proposal_breakdown_items = sortedBreakdown;
    u.items = sortedBreakdown;
    return u;
}

export function getWaterFeatureStructuralBoqDependencies(formData) {
    return [
        formData.qty_pc_total_m3, formData.qty_pc_m3, formData.qty_pc_m3_user, formData.pc_grade, formData.grade_of_plain_concrete_used,
        formData.qty_rc_total_m3, formData.qty_rc_m3, formData.qty_rc_m3_user, formData.rc_grade, formData.reinforced_concrete_type,
        formData.water_feature_perimeter_m, formData.perimeter, formData.pump_room_perimeter_m,
        formData.qty_polyethylene_kg, formData.polyethylene_brand,
        formData.area_m2, formData.water_feature_area_m2, formData.pump_room_area_m2,
        formData.qty_bituminous_waterproofing_m2, formData.type_of_bituminous_waterproofing,
        formData.wp_bituminous_brand, formData.wp_bituminous_material, formData.wp_bitumen_layers,
        formData.wp_membrane_brand, formData.wp_membrane_material,
        formData.qty_cementitious_waterproofing_m2, formData.type_of_cementitious_waterproofing,
        formData.wp_cementitious_brand, formData.wp_cementitious_material,
        formData.accommodations_required, formData.accommodations, formData.accommodation_required, formData.accommodation,
        formData.qty_excavation_m3_user, formData.total_rc_qty_user, formData.bituminous_wp_qty_m2_user, formData.membrane_wp_qty_m2_user, formData.cementitious_wp_qty_m2_user, formData.coffor_qty_m2_user
    ];
}
