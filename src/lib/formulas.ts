// =============================================================================
// P.ZONE Tender Log — Core Formulas & Computed Fields (Section 4.4, 5.3, 5.8)
// Tested by /tests/formulas.test.ts
// =============================================================================

import type { ExchangeRate, LookupValue, ProposalComponent, Tender } from '@/types/database';
import { todayCairoIso } from '@/components/ui/DatePickerInput';

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatNumber(
  value?: number | null,
  decimals = 2
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(Number(value));
}

export function formatCurrency(
  value?: number | null,
  currency: 'EGP' | 'USD' | string = 'EGP',
  decimals = 2
): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    const zero = (0).toFixed(decimals);
    return currency === 'USD' ? `$${zero} USD` : `${zero} ${currency}`;
  }
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(value));
  return currency === 'USD' ? `$${formatted} USD` : `${formatted} ${currency}`;
}

export function waterFeatureRequiresDepth(
  waterFeatureType?: string | null,
  lookupValues?: LookupValue[],
  componentName?: string | null
): boolean {
  const candidates = [componentName, waterFeatureType].filter(
    (v): v is string => Boolean(v && v.trim())
  );
  if (candidates.length === 0) return true;

  if (lookupValues && lookupValues.length > 0) {
    for (const candidate of candidates) {
      const match = lookupValues.find(
        (lv) =>
          lv.label_en === candidate ||
          lv.code === candidate ||
          lv.id === candidate
      );
      if (match && match.metadata && typeof match.metadata.requires_depth === 'boolean') {
        return match.metadata.requires_depth;
      }
    }
  }

  for (const candidate of candidates) {
    const lower = candidate.toLowerCase();
    if (
      lower.includes('pump room') ||
      lower.includes('plant room') ||
      lower.includes('splash pad') ||
      lower.includes('sauna') ||
      lower.includes('steam room') ||
      lower.includes('desalination')
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Section 4.4:
 * `delayed_days` = (actual sent date, or today if not yet sent) - expected send date, minimum 0.
 */
export function computeDelayedDays(
  expectedSendDate?: string | null,
  actualSentDate?: string | null,
  referenceToday: string = todayCairoIso()
): number {
  if (!expectedSendDate) return 0;

  const expected = new Date(`${expectedSendDate.slice(0, 10)}T00:00:00Z`);
  const endStr = actualSentDate ? actualSentDate.slice(0, 10) : referenceToday.slice(0, 10);
  const actualOrToday = new Date(`${endStr}T00:00:00Z`);

  if (Number.isNaN(expected.getTime()) || Number.isNaN(actualOrToday.getTime())) {
    return 0;
  }

  const diffMs = actualOrToday.getTime() - expected.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export interface TenderCostBreakdown {
  maintenance_cost?: number | null;
  supply_cost?: number | null;
  design_cost?: number | null;
  civil_cost?: number | null;
  mechanical_cost?: number | null;
  electrical_cost?: number | null;
  total_price_is_manual?: boolean;
  manual_total_price?: number | null;
}

/**
 * Section 4.1 D & 4.4:
 * `tender_total_price` = maintenance + supply + design + civil + mechanical + electrical
 * (with optional manual override flag).
 */
export function computeTenderTotalPrice(costs: TenderCostBreakdown): number {
  if (costs.total_price_is_manual && typeof costs.manual_total_price === 'number') {
    return round2(Math.max(0, costs.manual_total_price));
  }
  const sum =
    (Number(costs.maintenance_cost) || 0) +
    (Number(costs.supply_cost) || 0) +
    (Number(costs.design_cost) || 0) +
    (Number(costs.civil_cost) || 0) +
    (Number(costs.mechanical_cost) || 0) +
    (Number(costs.electrical_cost) || 0);
  return round2(sum);
}

/**
 * Section 4.4 & 5.8:
 * `tender_total_price_usd` = tender_total_price (EGP) ÷ exchange_rate_on_sent_date (EGP per 1 USD).
 */
export function computePriceUsd(
  amountEgp?: number | null,
  rateToUsd?: number | null
): number | null {
  if (typeof amountEgp !== 'number' || Number.isNaN(amountEgp)) return null;
  if (typeof rateToUsd !== 'number' || Number.isNaN(rateToUsd) || rateToUsd <= 0) {
    return null;
  }
  return round2(amountEgp / rateToUsd);
}

/**
 * Section 5.8:
 * Finds the exchange rate for `targetDate` or the nearest earlier available date
 * (for weekends/missing dates).
 */
export function findNearestExchangeRate(
  targetDate: string | null | undefined,
  rates: Pick<ExchangeRate, 'rate_date' | 'rate_to_usd' | 'source' | 'currency'>[],
  currency = 'EGP'
): { rate: number; dateUsed: string; source: string } | null {
  if (!targetDate) return null;
  const cleanTarget = targetDate.slice(0, 10);

  const eligible = rates
    .filter((r) => r.currency === currency && r.rate_date <= cleanTarget && r.rate_to_usd > 0)
    .sort((a, b) => b.rate_date.localeCompare(a.rate_date));

  if (eligible.length === 0) return null;

  const best = eligible[0];
  return {
    rate: best.rate_to_usd,
    dateUsed: best.rate_date,
    source: best.source,
  };
}

export interface SubZoneInput {
  id: string;
  label: string;
  area_m2?: number | null;
  depth_m?: number | null;
}

export interface SubZonesRollup {
  zones: Array<{
    id: string;
    label: string;
    area_m2: number;
    depth_m: number;
    volume_m3: number;
  }>;
  sum_area_m2: number;
  sum_volume_m3: number;
  weighted_avg_depth_m: number;
  simple_avg_depth_m: number;
}

/**
 * Optional multi-piece / sub-zone calculator for Lagoons, Lakes & multi-depth basins:
 * - Each piece volume = area_m2 * depth_m
 * - Main component area = sum of piece areas
 * - Main component volume = sum of piece volumes
 * - Main component depth = weighted average depth (sum_volume / sum_area) or simple average depth
 */
export function summarizeComponentSubZones(
  zones: SubZoneInput[]
): SubZonesRollup {
  const normalized = (zones || []).map((z, idx) => {
    const area = round2(Math.max(0, Number(z.area_m2) || 0));
    const depth = round2(Math.max(0, Number(z.depth_m) || 0));
    const vol = round2(area * depth);
    return {
      id: z.id || `zone-${idx + 1}`,
      label: z.label ?? `Piece ${idx + 1}`,
      area_m2: area,
      depth_m: depth,
      volume_m3: vol,
    };
  });

  const sumArea = round2(
    normalized.reduce((acc, z) => acc + z.area_m2, 0)
  );
  const sumVolume = round2(
    normalized.reduce((acc, z) => acc + z.volume_m3, 0)
  );
  const activeDepthZones = normalized.filter(
    (z) => z.depth_m > 0 || z.area_m2 > 0
  );
  const simpleAvgDepth =
    activeDepthZones.length > 0
      ? round2(
          activeDepthZones.reduce((acc, z) => acc + z.depth_m, 0) /
            activeDepthZones.length
        )
      : 0;
  const weightedAvgDepth =
    sumArea > 0 ? round2(sumVolume / sumArea) : simpleAvgDepth;

  return {
    zones: normalized,
    sum_area_m2: sumArea,
    sum_volume_m3: sumVolume,
    weighted_avg_depth_m: weightedAvgDepth,
    simple_avg_depth_m: simpleAvgDepth,
  };
}

export interface ComponentInput {
  water_feature_type: string;
  qty_same_specs?: number | null;
  each_length_m?: number | null;
  each_width_m?: number | null;
  each_perimeter_m?: number | null;
  each_area_m2?: number | null;
  each_avg_depth_m?: number | null;
  volume_is_manual?: boolean;
  each_volume_m3?: number | null;
  total_maintenance_cost?: number | null;
  total_supply_cost?: number | null;
  total_design_cost?: number | null;
  total_civil_cost?: number | null;
  total_mechanical_cost?: number | null;
  total_electrical_cost?: number | null;
}

export interface ComputedComponentResult {
  qty_same_specs: number;
  each_area_m2: number;
  each_perimeter_m: number;
  each_avg_depth_m: number;
  each_volume_m3: number;
  total_area_m2: number;
  total_perimeter_m: number;
  total_volume_m3: number;
  total_price: number;
  avg_cost_per_m2: number | null;
  avg_cost_per_m3: number | null;
}

/**
 * Section 4.2 & Appendix A.2:
 * Computes component perimeter, volume, total area, total perimeter, total volume, total price, and avg cost per m² / m³.
 */
export function computeComponentFields(input: ComponentInput): ComputedComponentResult {
  const qty = Math.max(1, Math.floor(Number(input.qty_same_specs) || 1));
  const len = Math.max(0, Number(input.each_length_m) || 0);
  const wid = Math.max(0, Number(input.each_width_m) || 0);
  const eachArea = round2(Math.max(0, Number(input.each_area_m2) || 0));
  const autoPerim = len > 0 && wid > 0 ? round2(2 * (len + wid)) : 0;
  const eachPerimeter =
    input.each_perimeter_m !== undefined && input.each_perimeter_m !== null
      ? round2(Math.max(0, Number(input.each_perimeter_m) || 0))
      : autoPerim;
  const eachDepth = round2(Math.max(0, Number(input.each_avg_depth_m) || 0));

  const eachVolume = input.volume_is_manual
    ? round2(Math.max(0, Number(input.each_volume_m3) || 0))
    : round2(eachArea * eachDepth);

  const totalArea = round2(qty * eachArea);
  const totalPerimeter = round2(qty * eachPerimeter);
  const totalVolume = round2(qty * eachVolume);

  const totalPrice = round2(
    (Number(input.total_maintenance_cost) || 0) +
      (Number(input.total_supply_cost) || 0) +
      (Number(input.total_design_cost) || 0) +
      (Number(input.total_civil_cost) || 0) +
      (Number(input.total_mechanical_cost) || 0) +
      (Number(input.total_electrical_cost) || 0)
  );

  const avgCostPerM2 = totalArea > 0 ? round2(totalPrice / totalArea) : null;
  const avgCostPerM3 = totalVolume > 0 ? round2(totalPrice / totalVolume) : null;

  return {
    qty_same_specs: qty,
    each_area_m2: eachArea,
    each_perimeter_m: eachPerimeter,
    each_avg_depth_m: eachDepth,
    each_volume_m3: eachVolume,
    total_area_m2: totalArea,
    total_perimeter_m: totalPerimeter,
    total_volume_m3: totalVolume,
    total_price: totalPrice,
    avg_cost_per_m2: avgCostPerM2,
    avg_cost_per_m3: avgCostPerM3,
  };
}

export interface TenderComponentsSummary {
  total_components_area_m2: number;
  total_components_volume_m3: number;
  components_summary: string;
  maintenance_cost: number;
  supply_cost: number;
  design_cost: number;
  civil_cost: number;
  mechanical_cost: number;
  electrical_cost: number;
  tender_total_price: number;
}

/**
 * Section 4.2 & 5.3:
 * Aggregates all components of a tender into total area, total volume,
 * human-readable summary ("2 x Swimming Pool, 1 x Lagoon"), and discipline totals.
 */
export function summarizeTenderComponents(
  components: Array<
    Pick<
      ProposalComponent,
      | 'water_feature_type'
      | 'qty_same_specs'
      | 'total_area_m2'
      | 'total_volume_m3'
      | 'total_maintenance_cost'
      | 'total_supply_cost'
      | 'total_design_cost'
      | 'total_civil_cost'
      | 'total_mechanical_cost'
      | 'total_electrical_cost'
    > & {
      component_title?: string | null;
      component_shape?: string | null;
      water_feature?: string;
      pump_room_included?: boolean;
    }
  >
): TenderComponentsSummary {
  let totalArea = 0;
  let totalVolume = 0;
  let maintenance = 0;
  let supply = 0;
  let design = 0;
  let civil = 0;
  let mechanical = 0;
  let electrical = 0;

  const groupedCounts = new Map<string, number>();

  for (const c of components) {
    totalArea += Number(c.total_area_m2) || 0;
    totalVolume += Number(c.total_volume_m3) || 0;
    maintenance += Number(c.total_maintenance_cost) || 0;
    supply += Number(c.total_supply_cost) || 0;
    design += Number(c.total_design_cost) || 0;
    civil += Number(c.total_civil_cost) || 0;
    mechanical += Number(c.total_mechanical_cost) || 0;
    electrical += Number(c.total_electrical_cost) || 0;

    const qty = Math.max(1, Number(c.qty_same_specs) || 1);
    const compTitle = (c.component_title || '').trim();
    const compName = (c.water_feature || '').trim();
    const compType = (c.water_feature_type || '').trim();
    const baseName = compName
      ? compType && compType.toLowerCase() !== compName.toLowerCase()
        ? `${compName} (${compType})`
        : compName
      : compType;
    const groupLabel = compTitle ? `${compTitle} [${baseName}]` : baseName;
    groupedCounts.set(groupLabel, (groupedCounts.get(groupLabel) || 0) + qty);
  }

  const summaryParts: string[] = [];
  for (const [type, count] of groupedCounts.entries()) {
    summaryParts.push(`${count} x ${type}`);
  }

  const hasPumpRoomIncluded = components.some((c) => Boolean(c.pump_room_included));
  const hasSeparatePumpRoom = components.some((c) => {
    const lowerName = (c.water_feature || '').toLowerCase();
    const lowerType = (c.water_feature_type || '').toLowerCase();
    return (
      lowerName.includes('pump room') ||
      lowerName.includes('plant room') ||
      lowerType.includes('pump room') ||
      lowerType.includes('plant room')
    );
  });
  const baseSummary = summaryParts.join(', ');
  const finalSummary =
    baseSummary && hasPumpRoomIncluded && !hasSeparatePumpRoom
      ? `${baseSummary} (Pump Room Included)`
      : baseSummary;

  const tenderTotal = round2(maintenance + supply + design + civil + mechanical + electrical);

  return {
    total_components_area_m2: round2(totalArea),
    total_components_volume_m3: round2(totalVolume),
    components_summary: finalSummary,
    maintenance_cost: round2(maintenance),
    supply_cost: round2(supply),
    design_cost: round2(design),
    civil_cost: round2(civil),
    mechanical_cost: round2(mechanical),
    electrical_cost: round2(electrical),
    tender_total_price: tenderTotal,
  };
}

/**
 * Section 4.1 C & 5.1:
 * Warn automatically when a new tender has the same owner + name or same proposal_code.
 */
export function detectDuplicateTender(
  candidate: { proposal_code?: string; owner?: string; proposal_name?: string; id?: string },
  existingTenders: Array<Pick<Tender, 'id' | 'proposal_code' | 'owner' | 'proposal_name'>>
): Pick<Tender, 'id' | 'proposal_code' | 'owner' | 'proposal_name'> | null {
  const codeNorm = (candidate.proposal_code || '').trim().toLowerCase();
  const ownerNorm = (candidate.owner || '').trim().toLowerCase();
  const nameNorm = (candidate.proposal_name || '').trim().toLowerCase();

  for (const existing of existingTenders) {
    if (candidate.id && existing.id === candidate.id) continue;

    if (codeNorm && existing.proposal_code.trim().toLowerCase() === codeNorm) {
      return existing;
    }

    if (
      ownerNorm &&
      nameNorm &&
      existing.owner.trim().toLowerCase() === ownerNorm &&
      existing.proposal_name.trim().toLowerCase() === nameNorm
    ) {
      return existing;
    }
  }

  return null;
}

/**
 * Security helper (S5): Neutralizes CSV / Excel formula injection on string cells
 * beginning with '=', '+', '-', or '@'.
 */
export function sanitizeSpreadsheetCell<T>(val: T): T {
  if (typeof val === 'string' && /^[=+\-@]/.test(val.trimStart())) {
    return `'${val}` as unknown as T;
  }
  return val;
}

export function sanitizeSpreadsheetRow<T extends Record<string, unknown>>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = sanitizeSpreadsheetCell(v);
  }
  return out as T;
}
