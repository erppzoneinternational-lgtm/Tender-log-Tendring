// =============================================================================
// P.ZONE Two-Way Intelligent Tendering ERP <-> PZ.Tender Log Bridge
// Connects the 60-Column Tender Log & Kanban Workflow with the 36-Table
// Intelligent Tendering Engineering & BOQ Engine.
// =============================================================================

import { supabase } from './supabaseClient';
import { resolveCategoryName } from './staticLookup';
import {
  dispatchNotification,
  getAssignmentsByTender,
  getComponentsByTender,
  getCurrentSessionUser,
  getProfiles,
  getTenders,
  recordAuditEntry,
  syncErpTendersAndCostsIntoStore,
  type ActorContext,
  type ErpSyncedTenderCostPayload,
} from './dataStore';
import {
  canAccessCommercialOverheads,
  canEditModule,
  canViewModule,
} from './permissions';
import {
  formatDateTimeCairo,
  nowCairoIso,
  todayCairoIso,
} from '@/components/ui/DatePickerInput';
import type { NotificationEventType, Profile, Tender, UserRole } from '@/types/database';

export { formatDateTimeCairo, nowCairoIso, todayCairoIso };

/**
 * Builds Egypt Cairo Timezone (`Africa/Cairo`) `created_by`/`created_at` & `updated_by`/`updated_at`
 * metadata stamped with the real signed-in user's full name.
 * - On INSERT (`isUpdate = false`): sets `created_by`, `created_at`, `updated_by`, `updated_at`.
 * - On UPDATE (`isUpdate = true`): sets ONLY `updated_by` and `updated_at` (preserving original creator & creation time).
 */
export function buildErpAuditFields(isUpdate = false): Record<string, string> {
  const actor = resolveCurrentErpActor();
  const actorLabel = actor.full_name;
  const cairoNow = nowCairoIso();
  if (isUpdate) {
    return {
      updated_by: actorLabel,
      updated_at: cairoNow,
    };
  }
  return {
    created_by: actorLabel,
    created_at: cairoNow,
    updated_by: actorLabel,
    updated_at: cairoNow,
  };
}

export interface ActiveErpTenderContext {
  tenderLogId: string;
  erpTenderId: string;
  proposalCode: string;
  proposalName: string;
  owner: string;
  contractor?: string | null;
}

const ACTIVE_ERP_TENDER_KEY = 'pzone_active_erp_tender_v1';
const erpContextListeners = new Set<(ctx: ActiveErpTenderContext | null) => void>();

export function getActiveErpTenderContext(): ActiveErpTenderContext | null {
  try {
    const raw = localStorage.getItem(ACTIVE_ERP_TENDER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveErpTenderContext;
  } catch {
    return null;
  }
}

export function setActiveErpTenderContext(ctx: ActiveErpTenderContext | null): void {
  try {
    if (ctx) {
      localStorage.setItem(ACTIVE_ERP_TENDER_KEY, JSON.stringify(ctx));
    } else {
      localStorage.removeItem(ACTIVE_ERP_TENDER_KEY);
    }
  } catch {
    // ignore storage errors
  }
  for (const fn of erpContextListeners) {
    fn(ctx);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pzone-erp-tender-change', { detail: ctx }));
  }
}

export function subscribeActiveErpTender(
  listener: (ctx: ActiveErpTenderContext | null) => void
): () => void {
  erpContextListeners.add(listener);
  return () => erpContextListeners.delete(listener);
}

function getItemDirectCost(item: Record<string, unknown>): number {
  if (item?.activity_responsibility === 'Client') return 0;
  if (
    item?.total_cost !== undefined &&
    item?.total_cost !== null &&
    !isNaN(Number(item?.total_cost))
  ) {
    return Number(item.total_cost);
  }
  const qty = Number(item?.final_quantity ?? item?.quantity ?? 0);
  const unitCost = Number(item?.unit_cost ?? 0);
  return Number((qty * unitCost).toFixed(2));
}

function getItemDiscipline(item: Record<string, unknown>): 'Civil' | 'Mechanical' | 'Electrical' {
  const directWt = String(item?.work_type || '')
    .toLowerCase()
    .trim();
  if (directWt === 'electrical') return 'Electrical';
  if (directWt === 'mechanical') return 'Mechanical';
  if (directWt === 'civil' || directWt === 'finishing works' || directWt === 'finishes') {
    return 'Civil';
  }

  const resolvedName = resolveCategoryName(item);
  if (
    resolvedName === 'Control Panel' ||
    resolvedName === 'Electrical' ||
    resolvedName === 'Water Feature Earthing' ||
    resolvedName === 'Water Feature Lighting' ||
    resolvedName === 'Main Cable Tray' ||
    resolvedName === 'Pump Room Lighting' ||
    resolvedName === 'Service Sockets'
  ) {
    return 'Electrical';
  }

  if (
    resolvedName === 'Water Filter' ||
    resolvedName === 'Vacuum Filtration Pump' ||
    resolvedName === 'Vacuum Filter' ||
    resolvedName === 'Ventilation' ||
    resolvedName === 'Automatic Makeup System' ||
    resolvedName === 'Chemical Dosing System' ||
    resolvedName === 'Skimmer' ||
    resolvedName === 'Wall Inlets' ||
    resolvedName === 'Floor Inlets' ||
    resolvedName === 'Vacuum Points' ||
    resolvedName === 'Main Drain' ||
    resolvedName === 'Gutter Drain' ||
    resolvedName === 'Fire Extinguisher' ||
    resolvedName === 'Water Feature UPVC Pipes, Fittings & Valves' ||
    resolvedName === 'Drainage Chamber' ||
    resolvedName === 'Pump Room UPVC Pipes, Fittings & Valves' ||
    resolvedName === 'Submersible Pumps' ||
    resolvedName === 'Tablet Chlorinator' ||
    resolvedName === 'Water Filtration Pump' ||
    resolvedName === 'Heating System' ||
    resolvedName === 'Water Feature HDPE Pipes, Fittings & Valves' ||
    resolvedName === 'Mechanical'
  ) {
    return 'Mechanical';
  }

  return 'Civil';
}

async function fetchAllErpBreakdownItems(): Promise<Record<string, unknown>[]> {
  let allItems: Record<string, unknown>[] = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('proposal_breakdown_items')
      .select('*')
      .range(from, from + step - 1);
    if (error || !data || data.length === 0) break;
    allItems = allItems.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return allItems;
}

/**
 * Ensures the given PZ.Tender Log tender exists in the ERP `tender_log` and `phases`
 * tables, sets it as the active ERP tender context, and returns the target ERP route.
 */
const SAFE_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function startIntelligentTender(
  tender: Tender,
  userOrRole?:
    | UserRole
    | Pick<Profile, 'role' | 'module_permissions' | 'can_access_commercial_overheads'>
    | null,
  targetStep?: 'water-features' | 'structural-works' | 'wf-electromechanical' | 'commercial-bid' | 'database'
): Promise<string> {
  const userRole: UserRole | undefined =
    typeof userOrRole === 'string' ? userOrRole : userOrRole?.role;
  const userProfileObj: Pick<
    Profile,
    'role' | 'module_permissions' | 'can_access_commercial_overheads'
  > | null =
    typeof userOrRole === 'object' && userOrRole !== null
      ? userOrRole
      : userRole
        ? { role: userRole, can_access_commercial_overheads: userRole === 'app_admin' }
        : null;
  const cleanCode = (tender.proposal_code || '').trim();
  const cleanTitle = (tender.proposal_name || cleanCode).trim();

  let erpTenderId = tender.id;
  let hasExistingGeometry = false;

  try {
    // 1. Check if tender already exists in ERP `tender_log` using safe parameterized filters
    let matchedErpTender: Record<string, unknown> | null = null;
    if (SAFE_UUID_REGEX.test(String(tender.id || ''))) {
      const { data: byId } = await supabase
        .from('tender_log')
        .select('*')
        .eq('id', tender.id)
        .limit(1);
      if (byId && byId.length > 0) {
        matchedErpTender = byId[0];
      }
    }
    if (!matchedErpTender && cleanCode) {
      const { data: byCode } = await supabase
        .from('tender_log')
        .select('*')
        .ilike('proposal_number', cleanCode)
        .limit(1);
      if (byCode && byCode.length > 0) {
        matchedErpTender = byCode[0];
      }
    }

    if (matchedErpTender) {
      erpTenderId = String(matchedErpTender.id);
    } else {
      // Create new record in ERP `tender_log`
      const DEFAULT_SCOPE =
        'Design , Supply , Execute , Installation , Testing , Commissioning , Start Up and Handing Over';
      const auditInsert = buildErpAuditFields(false);
      const cairoYear = Number(todayCairoIso().slice(0, 4));
      const payload: Record<string, unknown> = {
        proposal_year: tender.year || cairoYear,
        proposal_number: cleanCode,
        proposal_title: cleanTitle,
        proposal_full_title: `${cleanCode} - ${cleanTitle}`,
        country: '1b89deb5-a904-41d8-b185-555e4fc69380', // Egypt
        pzone_role: tender.pzone_role || 'Sub Contractor',
        owner: tender.owner || 'Direct Client',
        main_contractor: tender.contractor || null,
        proposal_request_date: tender.received_date || todayCairoIso(),
        proposal_submittal_date: tender.expected_send_date || tender.deadline_date || null,
        proposal_status: 'In Progress',
        commercial_overheads: 18,
        notes: tender.tender_status_notes || null,
        ...auditInsert,
      };

      const { data: insertedTender, error: insertErr } = await supabase
        .from('tender_log')
        .insert(payload)
        .select()
        .single();

      if (!insertErr && insertedTender?.id) {
        erpTenderId = String(insertedTender.id);
      }

      // 2. Seed initial Water Feature + Pump Room phases in ERP `phases`
      const components = getComponentsByTender(tender.id);
      const phasesToInsert: Record<string, unknown>[] = [];

      if (components.length > 0) {
        let wfIndex = 1;
        let prIndex = 1;
        for (const comp of components) {
          const wfName = comp.water_feature || 'Swimming Pool';
          const isPr =
            wfName.toLowerCase().includes('pump room') ||
            wfName.toLowerCase().includes('plant room');
          const customTitle = (comp.component_title || '').trim();
          const phaseTitle = customTitle
            ? customTitle
            : isPr
              ? `${wfName} ${String(prIndex++).padStart(2, '0')}`
              : `${wfName} ${String(wfIndex++).padStart(2, '0')}`;

          phasesToInsert.push({
            tender_log_id: erpTenderId,
            phase_title: phaseTitle,
            phase_full_title: `${cleanCode}.${phaseTitle}`,
            scope_of_work: DEFAULT_SCOPE,
            component_type: isPr ? 'Pump Room' : 'Water Feature',
            ...auditInsert,
          });

          if (!isPr && (comp.pump_room_included || tender.pump_room_included_in_water_features)) {
            const prTitle = `Pump Room ${String(prIndex++).padStart(2, '0')}`;
            phasesToInsert.push({
              tender_log_id: erpTenderId,
              phase_title: prTitle,
              phase_full_title: `${cleanCode}.${prTitle}`,
              scope_of_work: DEFAULT_SCOPE,
              component_type: 'Pump Room',
              ...auditInsert,
            });
          }
        }
      } else {
        phasesToInsert.push(
          {
            tender_log_id: erpTenderId,
            phase_title: 'Swimming Pool 01',
            phase_full_title: `${cleanCode}.Swimming Pool 01`,
            scope_of_work: DEFAULT_SCOPE,
            component_type: 'Water Feature',
            ...auditInsert,
          },
          {
            tender_log_id: erpTenderId,
            phase_title: 'Pump Room 01',
            phase_full_title: `${cleanCode}.Pump Room 01`,
            scope_of_work: DEFAULT_SCOPE,
            component_type: 'Pump Room',
            ...auditInsert,
          }
        );
      }

      if (phasesToInsert.length > 0) {
        await supabase.from('phases').insert(phasesToInsert);
      }
    }

    // 3. Check if Water Feature / Pump Room geometry already exists for this tender
    if (SAFE_UUID_REGEX.test(erpTenderId)) {
      const { data: wfData } = await supabase
        .from('proposal_data_entry')
        .select('id')
        .eq('tender_log_id', erpTenderId)
        .limit(1);
      hasExistingGeometry = Boolean(wfData && wfData.length > 0);
    }
  } catch (err) {
    console.warn('[ERP Bridge] Notice while syncing tender to ERP:', err);
  }

  setActiveErpTenderContext({
    tenderLogId: tender.id,
    erpTenderId,
    proposalCode: cleanCode,
    proposalName: cleanTitle,
    owner: tender.owner || 'Direct Client',
    contractor: tender.contractor || null,
  });

  const stepModuleMap = {
    'water-features': 'erp_geometry',
    'structural-works': 'erp_civil',
    'wf-electromechanical': 'erp_mep',
    'commercial-bid': 'erp_overheads',
    database: 'catalog_fx',
  } as const;

  if (targetStep && canViewModule(userProfileObj, stepModuleMap[targetStep])) {
    return `/erp/${targetStep}`;
  }

  // Commercial Approver or any user whose primary editable ERP module is Overheads goes straight to Commercial Bid
  if (
    canEditModule(userProfileObj, 'erp_overheads') &&
    !canEditModule(userProfileObj, 'erp_geometry') &&
    !canEditModule(userProfileObj, 'erp_civil') &&
    !canEditModule(userProfileObj, 'erp_mep')
  ) {
    return '/erp/commercial-bid';
  }

  // Procurement / Cost Control goes to Master Catalog or first viewable BOQ
  if (
    canEditModule(userProfileObj, 'catalog_fx') &&
    !canEditModule(userProfileObj, 'erp_geometry')
  ) {
    return canViewModule(userProfileObj, 'erp_civil')
      ? '/erp/structural-works'
      : '/erp/database';
  }

  // If no Water Feature / Pump Room geometry entered yet and user can view geometry, start at Step 1
  if (!hasExistingGeometry && canViewModule(userProfileObj, 'erp_geometry')) {
    return '/erp/water-features';
  }

  // Otherwise route by engineer discipline / editable module
  if (userRole === 'civil_tender_engineer' && canViewModule(userProfileObj, 'erp_civil')) {
    return '/erp/structural-works';
  }
  if (
    (userRole === 'mechanical_engineer' || userRole === 'electrical_engineer') &&
    canViewModule(userProfileObj, 'erp_mep')
  ) {
    return '/erp/wf-electromechanical';
  }

  if (canViewModule(userProfileObj, 'erp_geometry')) return '/erp/water-features';
  if (canViewModule(userProfileObj, 'erp_civil')) return '/erp/structural-works';
  if (canViewModule(userProfileObj, 'erp_mep')) return '/erp/wf-electromechanical';
  if (canViewModule(userProfileObj, 'erp_overheads')) return '/erp/commercial-bid';
  if (canViewModule(userProfileObj, 'catalog_fx')) return '/erp/database';

  return '/tenders';
}

/**
 * Bidirectional Sync: Reads all ERP `tender_log` proposals, phases, geometry,
 * and `proposal_breakdown_items`, computes discipline costs & commercial bid prices,
 * and pushes them back into PZ.Tender Log's reactive store.
 */
export async function syncAllErpTendersAndCostsToTenderLog(): Promise<{
  updatedCount: number;
  importedCount: number;
  activeSummary: ErpSyncedTenderCostPayload | null;
}> {
  try {
    const [
      { data: erpTenders },
      { data: erpPhases },
      { data: erpClients },
      { data: wfEntries },
      { data: prEntries },
      { data: wfFinEntries },
      { data: prFinEntries },
      boqItems,
    ] = await Promise.all([
      supabase.from('tender_log').select('*').order('created_at', { ascending: false }),
      supabase.from('phases').select('*'),
      supabase.from('clients').select('*'),
      supabase
        .from('proposal_data_entry')
        .select('id, phase_id, linked_phase, project_title, proposal_id, tender_log_id, water_feature_area_m2, water_feature_volume_m3'),
      supabase
        .from('pump_room_data_entry')
        .select('id, phase_id, linked_phase, project_title, proposal_id, tender_log_id'),
      supabase
        .from('proposal_finishes_water_feature')
        .select('id, phase_id, linked_phase, project_title, proposal_id'),
      supabase
        .from('proposal_finishes_pump_room')
        .select('id, phase_id, linked_phase, project_title, proposal_id'),
      fetchAllErpBreakdownItems(),
    ]);

    if (!erpTenders || erpTenders.length === 0) {
      return { updatedCount: 0, importedCount: 0, activeSummary: null };
    }

    const phasesArr = erpPhases || [];
    const phaseIdsSet = new Set(phasesArr.map((p) => String(p.id)));
    const phaseToProposalMap = new Map<string, string>();
    phasesArr.forEach((p) => {
      const propId = p.tender_log_id || p.linked_proposal || p.proposal_id;
      if (p.id && propId) phaseToProposalMap.set(String(p.id), String(propId));
    });

    const recordToPhaseMap = new Map<string, string>();
    const recordToProposalMap = new Map<string, string>();
    [
      ...(wfEntries || []),
      ...(prEntries || []),
      ...(wfFinEntries || []),
      ...(prFinEntries || []),
    ].forEach((rec) => {
      if (!rec?.id) return;
      const pId = rec.phase_id || rec.linked_phase;
      const propId =
        rec.tender_log_id ||
        rec.project_title ||
        rec.proposal_id ||
        (pId && phaseToProposalMap.get(String(pId)));
      if (pId) recordToPhaseMap.set(String(rec.id), String(pId));
      if (propId) recordToProposalMap.set(String(rec.id), String(propId));
    });

    const normalizedBoq = (boqItems || []).map((item) => {
      let resolvedPhaseId = item.phase_id ? String(item.phase_id) : '';
      let resolvedProposalId = String(item.proposal_id || item.tender_log_id || '');

      if (resolvedPhaseId && !phaseIdsSet.has(resolvedPhaseId)) {
        const mappedPhase = recordToPhaseMap.get(resolvedPhaseId);
        if (mappedPhase) {
          if (!resolvedProposalId) {
            resolvedProposalId =
              recordToProposalMap.get(resolvedPhaseId) ||
              phaseToProposalMap.get(mappedPhase) ||
              '';
          }
          resolvedPhaseId = mappedPhase;
        }
      }

      if (!resolvedProposalId && resolvedPhaseId && phaseToProposalMap.has(resolvedPhaseId)) {
        resolvedProposalId = phaseToProposalMap.get(resolvedPhaseId) || '';
      }

      return {
        ...item,
        phase_id: resolvedPhaseId || item.phase_id,
        proposal_id: resolvedProposalId || item.proposal_id,
      };
    });

    const payloads: ErpSyncedTenderCostPayload[] = erpTenders.map((t) => {
      const pId = String(t.id);
      const tPhases = phasesArr.filter(
        (p) => String(p.tender_log_id || p.linked_proposal || p.proposal_id) === pId
      );
      const tPhaseIds = new Set(tPhases.map((p) => String(p.id)));

      const tItems = normalizedBoq.filter((item) => {
        const matchTender = String(item.tender_log_id || item.proposal_id) === pId;
        const matchPhase = item.phase_id && tPhaseIds.has(String(item.phase_id));
        return matchTender || matchPhase;
      });

      let civilDirect = 0;
      let mechDirect = 0;
      let elecDirect = 0;

      tItems.forEach((item) => {
        const cost = getItemDirectCost(item);
        const disc = getItemDiscipline(item);
        if (disc === 'Civil') civilDirect += cost;
        else if (disc === 'Mechanical') mechDirect += cost;
        else if (disc === 'Electrical') elecDirect += cost;
      });

      const directTotal = civilDirect + mechDirect + elecDirect;

      // Check if CommercialBidPricePortal saved an exact custom bid snapshot for this tender
      const savedSnapshot = getCommercialBidSnapshotForTender(pId);
      let civilSelling = 0;
      let mechSelling = 0;
      let elecSelling = 0;
      let finalBidPrice = 0;

      if (
        savedSnapshot &&
        directTotal > 0 &&
        Math.abs(savedSnapshot.directTotal - directTotal) < 1
      ) {
        civilSelling = savedSnapshot.civilBidPrice;
        mechSelling = savedSnapshot.mechBidPrice;
        elecSelling = savedSnapshot.elecBidPrice;
        finalBidPrice = savedSnapshot.finalBidPrice;
      } else if (directTotal > 0) {
        // Exact match with CommercialBidPricePortal default 24-line formula:
        // All 12 percentage indirects = 2.00 + 1.56 + 1.39 + 0.11 + 0.14 + 0.31 + 0.29 + 0.23 + 0.44 + 3.61 + 0.18 + 9.00 = 19.26%
        const totalIndirectCost = Number((directTotal * 0.1926).toFixed(2));
        const totalDirectAndIndirect = Number((directTotal + totalIndirectCost).toFixed(2));
        const totalReserves = Number((totalDirectAndIndirect * 0.05).toFixed(2)); // 2.5% + 1.5% + 1.0% = 5.0%

        const civilShare = civilDirect / directTotal;
        const mechShare = mechDirect / directTotal;
        const elecShare = elecDirect / directTotal;

        const civilBase = civilDirect + civilShare * (totalIndirectCost + totalReserves);
        const mechBase = mechDirect + mechShare * (totalIndirectCost + totalReserves);
        const elecBase = elecDirect + elecShare * (totalIndirectCost + totalReserves);

        const civilWithProfit = civilBase * 1.15; // 15% default Civil margin
        const mechWithProfit = mechBase * 1.20;   // 20% default Mechanical margin
        const elecWithProfit = elecBase * 1.22;   // 22% default Electrical margin
        const totalWithProfit = civilWithProfit + mechWithProfit + elecWithProfit;

        const divisor = 1 - 0.065; // 0.96% + 0.12% + 1.22% + 2.70% + 1.50% = 6.50%
        finalBidPrice = Number((totalWithProfit / divisor).toFixed(2));

        civilSelling = Number((finalBidPrice * (civilWithProfit / totalWithProfit)).toFixed(2));
        mechSelling = Number((finalBidPrice * (mechWithProfit / totalWithProfit)).toFixed(2));
        elecSelling = Number((finalBidPrice * (elecWithProfit / totalWithProfit)).toFixed(2));
      }

      // Compute total area & volume from Water Feature entries
      const tWfEntries = (wfEntries || []).filter(
        (w) =>
          String(w.tender_log_id || w.project_title || w.proposal_id) === pId ||
          (w.phase_id && tPhaseIds.has(String(w.phase_id))) ||
          (w.linked_phase && tPhaseIds.has(String(w.linked_phase)))
      );

      let totalAreaM2 = 0;
      let totalVolumeM3 = 0;
      tWfEntries.forEach((w) => {
        totalAreaM2 += Number(w.water_feature_area_m2 || 0);
        totalVolumeM3 += Number(w.water_feature_volume_m3 || 0);
      });

      const clientObj = (erpClients || []).find((c) => String(c.id) === String(t.client_id));
      const ownerName = clientObj?.title || clientObj?.name || t.owner || 'Direct Client';

      const phaseNames = tPhases
        .map((p) => p.phase_title || p.phase_full_title)
        .filter(Boolean)
        .join(' • ');

      return {
        erpTenderId: pId,
        proposalCode: String(t.proposal_number || '').trim(),
        proposalName: String(t.proposal_title || t.proposal_full_title || t.proposal_number || '').trim(),
        owner: String(ownerName),
        contractor: t.main_contractor ? String(t.main_contractor) : null,
        pzoneRole: t.pzone_role ? String(t.pzone_role) : 'Sub Contractor',
        receivedDate: t.proposal_request_date ? String(t.proposal_request_date) : null,
        expectedSendDate: t.proposal_submittal_date ? String(t.proposal_submittal_date) : null,
        status: t.proposal_status ? String(t.proposal_status) : 'In Progress',
        civilCost: civilSelling,
        mechanicalCost: mechSelling,
        electricalCost: elecSelling,
        finalBidPrice,
        totalAreaM2: Number(totalAreaM2.toFixed(2)),
        totalVolumeM3: Number(totalVolumeM3.toFixed(2)),
        componentsSummary: phaseNames,
      };
    });

    const { updatedCount, importedCount } = syncErpTendersAndCostsIntoStore(payloads);

    const activeCtx = getActiveErpTenderContext();
    const activeSummary = activeCtx
      ? payloads.find(
          (p) =>
            p.erpTenderId === activeCtx.erpTenderId ||
            p.proposalCode.toLowerCase() === activeCtx.proposalCode.toLowerCase()
        ) || null
      : payloads[0] || null;

    return { updatedCount, importedCount, activeSummary };
  } catch (err) {
    console.warn('[ERP Bridge] Error syncing ERP costs to Tender Log:', err);
    return { updatedCount: 0, importedCount: 0, activeSummary: null };
  }
}

/**
 * Helper to resolve a PZ.Tender Log tender by ID or active context, or return the most recent tender.
 */
export function resolveActiveLogTender(): Tender | null {
  const all = getTenders().filter((t) => t.is_latest_revision);
  const ctx = getActiveErpTenderContext();
  if (ctx) {
    const byId = all.find(
      (t) =>
        t.id === ctx.tenderLogId ||
        t.id === ctx.erpTenderId ||
        t.proposal_code.toLowerCase() === ctx.proposalCode.toLowerCase()
    );
    if (byId) return byId;
  }
  return all[0] || null;
}

export interface CommercialBidSnapshot {
  directTotal: number;
  civilBidPrice: number;
  mechBidPrice: number;
  elecBidPrice: number;
  finalBidPrice: number;
  weightedAvgMarginPct: number;
  updatedAt: string;
}

const COMMERCIAL_SNAPSHOTS_KEY = 'pzone_commercial_saved_bids_v1';

export function saveCommercialBidSnapshotForTender(
  erpTenderId: string,
  snapshot: CommercialBidSnapshot
): void {
  if (!erpTenderId) return;
  try {
    const raw = localStorage.getItem(COMMERCIAL_SNAPSHOTS_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, CommercialBidSnapshot>) : {};
    map[String(erpTenderId)] = snapshot;
    localStorage.setItem(COMMERCIAL_SNAPSHOTS_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function getCommercialBidSnapshotForTender(
  erpTenderId: string
): CommercialBidSnapshot | null {
  if (!erpTenderId) return null;
  try {
    const raw = localStorage.getItem(COMMERCIAL_SNAPSHOTS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, CommercialBidSnapshot>;
    return map[String(erpTenderId)] || null;
  } catch {
    return null;
  }
}

/**
 * Resolves the currently active signed-in user profile from context for ERP Audit Logs.
 */
export function resolveCurrentErpActor(): ActorContext {
  const current = getCurrentSessionUser();
  if (current) {
    return {
      id: current.id,
      full_name: current.full_name,
      role: current.role,
    };
  }
  return {
    id: '',
    full_name: '',
    role: 'viewer',
  };
}

/**
 * Records an immutable Audit Log entry and dispatches bilingual EN/AR team notifications
 * whenever an engineer saves geometry, Civil BOQ, MEP BOQ, Commercial Bid Price, or Catalog edits.
 */
export function recordErpAuditAndNotification(params: {
  table_name: string;
  record_id: string;
  erp_tender_id?: string | null;
  proposal_code?: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  notification?: {
    type: NotificationEventType;
    targetRoles?: UserRole[];
    includeAssignedEngineers?: boolean;
    title_en: string;
    title_ar: string;
    message_en: string;
    message_ar: string;
  };
}): void {
  try {
    const actor = resolveCurrentErpActor();
    const allTenders = getTenders();
    const matchedLogTender = params.erp_tender_id
      ? allTenders.find(
          (t) =>
            t.id === params.erp_tender_id ||
            (params.proposal_code &&
              t.proposal_code.toLowerCase() === params.proposal_code.toLowerCase() &&
              t.is_latest_revision)
        )
      : params.proposal_code
        ? allTenders.find(
            (t) =>
              t.proposal_code.toLowerCase() === params.proposal_code!.toLowerCase() &&
              t.is_latest_revision
          )
        : null;

    const resolvedTenderId = matchedLogTender?.id || params.erp_tender_id || null;
    const resolvedProposalCode =
      matchedLogTender?.proposal_code || params.proposal_code || null;

    recordAuditEntry({
      table_name: params.table_name,
      record_id: String(params.record_id || 'erp_record'),
      tender_id: resolvedTenderId,
      actor,
      action: params.action,
      old_data: params.old_data ?? null,
      new_data: params.new_data ?? null,
    });

    if (params.notification) {
      const profiles = getProfiles().filter((p) => p.active);
      const targetRoles = params.notification.targetRoles || [
        'app_admin',
        'tender_manager',
      ];
      const recipientSet = new Set<string>(
        profiles.filter((p) => targetRoles.includes(p.role)).map((p) => p.id)
      );

      if (
        params.notification.type === 'erp_ready_for_commercial' ||
        params.notification.type === 'erp_commercial_bid_set'
      ) {
        for (const p of profiles) {
          if (canAccessCommercialOverheads(p)) {
            recipientSet.add(p.id);
          }
        }
      }

      if (params.notification.includeAssignedEngineers && matchedLogTender) {
        if (matchedLogTender.responsible_civil_engineer_id) {
          recipientSet.add(matchedLogTender.responsible_civil_engineer_id);
        }
        if (matchedLogTender.mechanical_pricing_responsible_id) {
          recipientSet.add(matchedLogTender.mechanical_pricing_responsible_id);
        }
        if (matchedLogTender.electrical_pricing_responsible_id) {
          recipientSet.add(matchedLogTender.electrical_pricing_responsible_id);
        }
        for (const asg of getAssignmentsByTender(matchedLogTender.id)) {
          recipientSet.add(asg.user_id);
        }
      }

      // Always include the acting user if they are an admin/manager testing, otherwise exclude self-spam for engineers
      if (actor.role !== 'app_admin' && actor.role !== 'tender_manager') {
        recipientSet.delete(actor.id);
      }

      dispatchNotification({
        recipientIds: Array.from(recipientSet),
        type: params.notification.type,
        tender_id: resolvedTenderId,
        proposal_code: resolvedProposalCode,
        title_en: params.notification.title_en,
        title_ar: params.notification.title_ar,
        message_en: params.notification.message_en,
        message_ar: params.notification.message_ar,
      });
    }
  } catch (err) {
    console.warn('[ERP Audit/Notification] Warning:', err);
  }
}
