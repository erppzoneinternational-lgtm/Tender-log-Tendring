import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { TABLES_CONFIG } from './schemaData';
import { STATIC_ITEMS_LOOKUP, STATIC_CABLES_LOOKUP } from './staticLookup';

const LookupContext = createContext(null);

export function formatRecordTitle(tableName, row) {
  if (!row) return null;

  switch (tableName) {
    case 'countries':
    case 'governorates':
    case 'regions':
    case 'districts':
    case 'clients':
    case 'brands':
      return row.title || row.name;

    case 'item_categories':
    case 'finishes_category':
      return row.category_name || row.title || row.name;

    case 'items':
      return row.item_name || row.i_axiom_description || row.title;

    case 'cable_types': {
      const cores = row.no_of_cores;
      const area = row.nominal_cross_sectional_area_mm_2;
      const type = row.cable_type || 'Cu Cable';
      const volt = row.voltage ? ' (' + row.voltage + ')' : '';
      if (cores && area) {
        return type + ' (' + cores + 'x' + area + ' mm²)' + volt;
      }
      return row.cable_type || row.item_name || 'Power Cable';
    }

    case 'cable_glands': {
      const size = row.size ? 'Size: ' + row.size : '';
      const code = row.code ? 'Code: ' + row.code : '';
      return ['Cable Gland', size, code].filter(Boolean).join(' - ');
    }

    case 'cable_conduits': {
      const type = row.conduit_type || 'Conduit';
      const size = row.size ? row.size : '';
      const code = row.conduit_code ? '(' + row.conduit_code + ')' : '';
      return (type + ' ' + size + ' ' + code).trim();
    }

    case 'filter_pump_types': {
      const code = row.filter_pump_code ? 'Code: ' + row.filter_pump_code : '';
      const brandId = row.pump_brand || row.brand_id;
      const isUUID = brandId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandId);
      const brand = isUUID ? '' : (brandId || '');
      const hp = row.filter_pump_hp ? row.filter_pump_hp + ' HP' : '';
      const kw = row.p_kw ? '(' + row.p_kw + ' kW)' : '';
      const volt = row.operating_voltage ? row.operating_voltage + 'V' : '';
      return [brand, hp, kw, volt, code].filter(Boolean).join(' • ') || row.item_name || 'Filter Pump';
    }

    case 'filter_types': {
      const brandId = row.filter_brand || row.brand_id;
      const isUUID = brandId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brandId);
      const brand = isUUID ? '' : (brandId || '');
      const dia = row.filter_dia ? 'Ø' + row.filter_dia + 'mm' : '';
      const flow = row.min_flow_rate ? row.min_flow_rate + ' m³/h' : '';
      const code = row.filter_code ? 'Code: ' + row.filter_code : '';
      return [brand, dia, flow, code].filter(Boolean).join(' • ') || row.item_name || 'Media Filter';
    }

    case 'lighting_type': {
      return row.item_code || row.item_name || 'Pool Lighting Fixture';
    }

    case 'transformer_type': {
      return row.item_code || row.item_name || 'Safety Transformer';
    }

    case 'junction_box': {
      const code = row.code ? 'Code: ' + row.code : '';
      const size = row.size_mm ? row.size_mm : '';
      return ['Junction Box', code, size].filter(Boolean).join(' ');
    }

    case 'heaters': {
      const type = row.heater_type || 'Pool Heater';
      const kw = row.output_kw ? row.output_kw + ' kW' : '';
      return (type + ' ' + kw).trim();
    }

    case 'disconnect_switch_types': {
      const mat = row.material || '';
      const poles = row.no_of_poles ? row.no_of_poles + 'P' : '';
      const amp = row.ampere_rating ? row.ampere_rating + 'A' : '';
      const code = row.code ? '(' + row.code + ')' : '';
      return ('Disconnect Switch ' + mat + ' ' + poles + ' ' + amp + ' ' + code).trim();
    }

    case 'water_feature_categories':
    case 'water_feature_types':
      return row.name || row.title;

    case 'finishes_type':
      return [row.item_type, row.color].filter(Boolean).join(' - ') || row.item_name;

    case 'civil_material_types': {
      const itmName = STATIC_ITEMS_LOOKUP[row.item_id] || STATIC_ITEMS_LOOKUP[row.id] || row.item_name;
      const rate = row.specification_rate ? `(${row.specification_rate} ${row.specification_unit || ''})` : '';
      if (itmName) {
        return [itmName, rate].filter(Boolean).join(' ');
      }
      return [row.item_name || 'Civil Material', rate].filter(Boolean).join(' ');
    }

    case 'tender_log':
      return row.proposal_full_title || row.proposal_title || (row.proposal_year ? row.proposal_year + '.' + row.proposal_number : 'Tender');

    case 'phases':
      return row.phase_full_title || row.phase_title || 'Phase Scope';

    case 'proposal_data_entry':
      return (row.water_feature_category || 'Pool') + ' (' + (row.water_feature_type || 'Overflow') + ')';

    case 'pump_room_data_entry':
      return 'Pump Room (' + (row.pump_room_length_m || 0) + 'x' + (row.pump_room_width_m || 0) + 'm)';

    default:
      return row.title || row.name || row.category_name || row.item_name || row.code || row.id;
  }
}

export function LookupProvider({ children }) {
  const [lookupCache, setLookupCache] = useState({});
  const [isPreloading, setIsPreloading] = useState(false);

  const ALL_REFERENCE_TABLES = [
    'countries',
    'governorates',
    'regions',
    'districts',
    'clients',
    'brands',
    'item_categories',
    'cable_types',
    'cable_glands',
    'cable_conduits',
    'filter_pump_types',
    'filter_types',
    'lighting_type',
    'transformer_type',
    'junction_box',
    'heaters',
    'disconnect_switch_types',
    'finishes_category',
    'finishes_type',
    'civil_material_types',
    'water_feature_categories',
    'water_feature_types',
    'phases',
    'tender_log',
    'items'
  ];

  const preloadLookups = useCallback(async () => {
    setIsPreloading(true);
    const newCache = {};

    await Promise.all(
      ALL_REFERENCE_TABLES.map(async (tableName) => {
        try {
          const limit = tableName === 'items' ? 2000 : 1000;
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(limit);

          if (!error && data) {
            newCache[tableName] = {};
            data.forEach(row => {
              const label = formatRecordTitle(tableName, row);
              newCache[tableName][row.id] = {
                id: row.id,
                label: String(label || row.id),
                raw: row
              };
            });
          }
        } catch (e) {
          console.warn('Lookup preload error for ' + tableName + ':', e.message);
        }
      })
    );

    setLookupCache(prev => ({ ...prev, ...newCache }));
    setIsPreloading(false);
  }, []);

  useEffect(() => {
    preloadLookups();
  }, [preloadLookups]);

  // Master Resolver
  const getResolvedLabel = useCallback((targetTableName, rawId) => {
    if (!rawId) return null;
    const cleanId = String(rawId).toLowerCase().trim();

    // 1. Check static item dictionary
    if (STATIC_ITEMS_LOOKUP[cleanId]) {
      return STATIC_ITEMS_LOOKUP[cleanId];
    }

    // 2. Check static cable dictionary
    if (STATIC_CABLES_LOOKUP[cleanId]) {
      return STATIC_CABLES_LOOKUP[cleanId];
    }

    // 3. Check target table cache
    if (targetTableName && lookupCache[targetTableName]?.[rawId]) {
      return lookupCache[targetTableName][rawId].label;
    }

    // 4. Search across all table caches in memory
    for (const tbl of Object.keys(lookupCache)) {
      if (lookupCache[tbl]?.[rawId]) {
        return lookupCache[tbl][rawId].label;
      }
    }

    return null;
  }, [lookupCache]);

  const totalCachedRecords = Object.values(lookupCache).reduce((sum, tbl) => sum + Object.keys(tbl || {}).length, 0) 
    + Object.keys(STATIC_ITEMS_LOOKUP || {}).length 
    + Object.keys(STATIC_CABLES_LOOKUP || {}).length;

  const isConnected = !isPreloading && Object.keys(lookupCache).length > 0;

  return (
    <LookupContext.Provider value={{
      lookupCache,
      isPreloading,
      isReloading: isPreloading,
      isConnected,
      totalCachedRecords,
      getResolvedLabel,
      formatRecordTitle,
      reloadLookups: preloadLookups
    }}>
      {children}
    </LookupContext.Provider>
  );
}

export function useLookup() {
  const context = useContext(LookupContext);
  if (!context) {
    throw new Error('useLookup must be used within a LookupProvider');
  }
  return context;
}
