// =============================================================================
// P.ZONE Tender Log — Bidirectional Supabase Cloud Sync & Realtime Engine
// Automatically hydrates the reactive store from Supabase PostgreSQL on sign-in,
// pushes row-level INSERT / UPDATE / DELETE diffs on mutations, and listens to
// Supabase Realtime (`postgres_changes`) across all operational tables.
// =============================================================================

import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const knownRemoteProfileIds = new Set<string>();

function asValidProfileFkOrNull(value: unknown): string | null {
  if (!isValidUuid(value)) return null;
  if (knownRemoteProfileIds.size > 0 && !knownRemoteProfileIds.has(value)) {
    return null;
  }
  return value;
}

function asUuidOrNull(value: unknown): string | null {
  return isValidUuid(value) ? value : null;
}

export type SyncTableKey =
  | 'profiles'
  | 'lookup_values'
  | 'exchange_rates'
  | 'audit_log'
  | 'tenders'
  | 'proposal_components'
  | 'tender_documents'
  | 'tender_assignments'
  | 'tasks'
  | 'task_comments'
  | 'notifications'
  | 'saved_views';

function sanitizeRowForSupabase(
  table: SyncTableKey,
  raw: Record<string, unknown>
): Record<string, unknown> {
  const row: Record<string, unknown> = { ...raw };

  if (!isValidUuid(row.id)) {
    delete row.id;
  }

  if (table === 'profiles') {
    delete row.can_access_commercial_overheads;
    delete row.module_permissions;
    // Map extended 9-role presets onto the 7 PostgreSQL CHECK-allowed roles while
    // preserving full preset & 8-module matrix inside `lookup_values` (`user_access_matrix`).
    if (
      row.role === 'commercial_approver' ||
      row.role === 'procurement_cost_control'
    ) {
      row.role = 'tender_manager';
    }
  } else if (table === 'lookup_values') {
    row.parent_id = asUuidOrNull(row.parent_id);
    row.created_by = asValidProfileFkOrNull(row.created_by);
    row.updated_by = asValidProfileFkOrNull(row.updated_by);
  } else if (table === 'exchange_rates') {
    row.created_by = asValidProfileFkOrNull(row.created_by);
    row.updated_by = asValidProfileFkOrNull(row.updated_by);
  } else if (table === 'tenders') {
    row.previous_revision_id = asUuidOrNull(row.previous_revision_id);
    row.sales_representative_id = asUuidOrNull(row.sales_representative_id);
    row.responsible_civil_engineer_id = asValidProfileFkOrNull(row.responsible_civil_engineer_id);
    row.mechanical_pricing_responsible_id = asValidProfileFkOrNull(row.mechanical_pricing_responsible_id);
    row.electrical_pricing_responsible_id = asValidProfileFkOrNull(row.electrical_pricing_responsible_id);
    row.duplicate_of_tender_id = asUuidOrNull(row.duplicate_of_tender_id);
    row.created_by = asValidProfileFkOrNull(row.created_by);
    row.updated_by = asValidProfileFkOrNull(row.updated_by);
  } else if (
    table === 'proposal_components' ||
    table === 'tender_documents' ||
    table === 'tasks'
  ) {
    row.created_by = asValidProfileFkOrNull(row.created_by);
    row.updated_by = asValidProfileFkOrNull(row.updated_by);
    if (table === 'proposal_components') {
      delete row.component_title;
      delete row.component_shape;
      delete row.each_length_m;
      delete row.each_width_m;
      delete row.each_perimeter_m;
      delete row.total_perimeter_m;
      delete row.sub_zones;
    }
    if (table === 'tender_documents') {
      row.uploaded_by = asValidProfileFkOrNull(row.uploaded_by);
    }
  } else if (table === 'tender_assignments') {
    row.assigned_by = asValidProfileFkOrNull(row.assigned_by);
  } else if (table === 'task_comments') {
    if (Array.isArray(row.mentioned_user_ids)) {
      row.mentioned_user_ids = row.mentioned_user_ids.filter(isValidUuid);
    }
  } else if (table === 'notifications') {
    row.user_id = asValidProfileFkOrNull(row.user_id);
    row.tender_id = asUuidOrNull(row.tender_id);
  } else if (table === 'audit_log') {
    row.tender_id = asUuidOrNull(row.tender_id);
    row.user_id = asValidProfileFkOrNull(row.user_id);
    row.record_id = String(row.record_id ?? '');
  }

  return row;
}

let isHydrating = false;
let inFlightSyncCount = 0;
let syncQueuePromise: Promise<void> = Promise.resolve();
let realtimeChannel: RealtimeChannel | null = null;
let hydrateTimer: ReturnType<typeof setTimeout> | null = null;

function emitCloudSyncError(table: SyncTableKey, message: string): void {
  console.error(`[Supabase Sync] Cloud save error on ${table}:`, message);
  if (typeof window !== 'undefined' && table !== 'audit_log' && table !== 'notifications') {
    const hint = message.toLowerCase().includes('audit_log_user_id_fkey')
      ? `Database trigger patch needed: Please run supabase/03_fix_audit_trigger_db1.sql in Supabase SQL Editor (${table}).`
      : `Cloud sync failed on '${table}': ${message}`;
    window.dispatchEvent(new CustomEvent('pzone-cloud-sync-error', { detail: hint }));
  }
}

// Architectural safety lock: Tenders use soft-archiving (`is_archived = true`),
// Tasks are 1:1 with Tenders, and Audit Logs are immutable append-only records.
// Array-diff sync is strictly forbidden from ever issuing `DELETE` on these tables.
const PROTECTED_NO_HARD_DELETE_TABLES: ReadonlySet<SyncTableKey> = new Set([
  'tenders',
  'tasks',
  'audit_log',
]);

export function isCurrentlyHydratingFromSupabase(): boolean {
  return isHydrating;
}

/**
 * Computes row-level INSERT/UPDATE/DELETE differences between previous and next
 * arrays and persists them sequentially to Supabase PostgreSQL so parent tables
 * (`tenders`) always commit before child tables (`tasks`, `proposal_components`,
 * `tender_assignments`, `notifications`, `audit_log`).
 */
export function syncArrayDiffToSupabase(
  table: SyncTableKey,
  prevRows: Record<string, unknown>[],
  nextRows: Record<string, unknown>[]
): Promise<void> {
  if (!isSupabaseConfigured || isHydrating) return Promise.resolve();

  const prevMap = new Map<string, Record<string, unknown>>();
  for (const r of prevRows) {
    if (typeof r.id === 'string') {
      prevMap.set(r.id, r);
    }
  }

  const nextIds = new Set<string>();
  const toUpsert: Record<string, unknown>[] = [];

  for (const r of nextRows) {
    const id = typeof r.id === 'string' ? r.id : '';
    if (id) nextIds.add(id);
    const prev = id ? prevMap.get(id) : undefined;
    if (!prev || JSON.stringify(prev) !== JSON.stringify(r)) {
      const sanitized = sanitizeRowForSupabase(table, r);
      if (table === 'notifications' && !sanitized.user_id) {
        continue;
      }
      toUpsert.push(sanitized);
    }
  }

  const deletedIds: string[] = [];
  if (!PROTECTED_NO_HARD_DELETE_TABLES.has(table)) {
    for (const oldId of prevMap.keys()) {
      if (!nextIds.has(oldId) && isValidUuid(oldId)) {
        deletedIds.push(oldId);
      }
    }
  }

  if (deletedIds.length === 0 && toUpsert.length === 0) {
    return Promise.resolve();
  }

  inFlightSyncCount += 1;
  const runStep = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        return;
      }

      if (deletedIds.length > 0) {
        const { error: delErr } = await supabase
          .from(table)
          .delete()
          .in('id', deletedIds);
        if (delErr) {
          emitCloudSyncError(table, delErr.message);
        }
      }

      if (toUpsert.length > 0) {
        if (table === 'audit_log') {
          const newEntries = toUpsert.filter((e) => !e.id || !prevMap.has(String(e.id)));
          if (newEntries.length > 0) {
            const { error: insErr } = await supabase.from(table).insert(newEntries);
            if (insErr) {
              console.warn(`[Supabase Sync] Audit insert warning:`, insErr.message);
            }
          }
          return;
        }

        const rowsWithoutId = toUpsert.filter((r) => !r.id);
        const rowsWithId = toUpsert.filter((r) => Boolean(r.id));

        if (rowsWithoutId.length > 0) {
          const noIdConflict =
            table === 'lookup_values'
              ? 'category,code'
              : table === 'exchange_rates'
                ? 'currency,rate_date'
                : undefined;
          const { error: noIdErr } = noIdConflict
            ? await supabase
                .from(table)
                .upsert(rowsWithoutId, { onConflict: noIdConflict })
            : await supabase.from(table).insert(rowsWithoutId);
          if (noIdErr) {
            emitCloudSyncError(table, noIdErr.message);
          }
        }

        if (rowsWithId.length === 0) {
          return;
        }

        const { error: upsErr } = await supabase
          .from(table)
          .upsert(rowsWithId, { onConflict: 'id' });
        if (upsErr) {
          if (table === 'profiles' && upsErr.message?.toLowerCase().includes('email')) {
            for (const pRow of rowsWithId) {
              const em = typeof pRow.email === 'string' ? pRow.email.trim().toLowerCase() : '';
              if (!em) continue;
              const patchRow = { ...pRow };
              delete patchRow.id;
              await supabase.from('profiles').update(patchRow).ilike('email', em);
            }
          } else if (
            table === 'tasks' &&
            upsErr.message?.toLowerCase().includes('tasks_tender_id_key')
          ) {
            for (const tRow of rowsWithId) {
              if (!tRow.tender_id) continue;
              const patchTask = { ...tRow };
              delete patchTask.id;
              await supabase.from('tasks').update(patchTask).eq('tender_id', tRow.tender_id);
            }
          } else if (
            table === 'tenders' &&
            upsErr.code === '23503' &&
            !upsErr.message?.toLowerCase().includes('audit_log')
          ) {
            const fallbackTenders = rowsWithId.map((tRow) => ({
              ...tRow,
              sales_representative_id: null,
              created_by: null,
              updated_by: null,
            }));
            const retryRes = await supabase
              .from('tenders')
              .upsert(fallbackTenders, { onConflict: 'id' });
            if (retryRes.error) {
              emitCloudSyncError(table, retryRes.error.message);
            }
          } else if (table === 'notifications') {
            for (const nRow of rowsWithId) {
              if (!isValidUuid(nRow.user_id)) continue;
              const singleRes = await supabase
                .from('notifications')
                .upsert([nRow], { onConflict: 'id' });
              if (
                singleRes.error &&
                singleRes.error.code === '23503' &&
                singleRes.error.message?.toLowerCase().includes('tender_id')
              ) {
                await supabase
                  .from('notifications')
                  .upsert([{ ...nRow, tender_id: null }], { onConflict: 'id' });
              }
            }
          } else {
            emitCloudSyncError(table, upsErr.message);
          }
        }
      }
    } catch (err) {
      console.warn(`[Supabase Sync] Unexpected error syncing ${table}:`, err);
    } finally {
      inFlightSyncCount = Math.max(0, inFlightSyncCount - 1);
    }
  };

  syncQueuePromise = syncQueuePromise.then(runStep, runStep);
  return syncQueuePromise;
}

export interface SupabaseHydrationCallbacks {
  applyTableRows: (table: SyncTableKey, rows: unknown[]) => void;
  notifyComplete: () => void;
}

/**
 * Fetches all authorized workspace rows from Supabase PostgreSQL and populates
 * the local reactive cache without ever clobbering in-flight or unsynced rows.
 */
export async function hydrateWorkspaceFromSupabase(
  callbacks: SupabaseHydrationCallbacks,
  onlyTables?: SyncTableKey[]
): Promise<void> {
  if (!isSupabaseConfigured) return;

  // Wait for any queued/in-flight writes to commit before reading back from cloud
  if (inFlightSyncCount > 0) {
    await syncQueuePromise;
  }

  // Never hydrate when unauthenticated — RLS returns empty `[]` for `anon` which would wipe local state
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return;
  }

  // Verify RLS recognizes this session as an active authorized user (`profiles` must be non-empty)
  const { data: rlsProbe, error: probeErr } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
  if (probeErr || !Array.isArray(rlsProbe) || rlsProbe.length === 0) {
    return;
  }

  const tables: SyncTableKey[] = onlyTables ?? [
    'profiles',
    'lookup_values',
    'exchange_rates',
    'tenders',
    'proposal_components',
    'tender_documents',
    'tender_assignments',
    'tasks',
    'task_comments',
    'notifications',
    'saved_views',
    'audit_log',
  ];

  isHydrating = true;
  try {
    await Promise.all(
      tables.map(async (table) => {
        const query = supabase.from(table).select('*');
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          if (table === 'profiles' && data.length > 0) {
            knownRemoteProfileIds.clear();
            for (const p of data) {
              if (typeof p?.id === 'string' && isValidUuid(p.id)) {
                knownRemoteProfileIds.add(p.id);
              }
            }
          }
          // Do not overwrite baseline reference lookups/rates/profiles if remote table hasn't been seeded yet
          if (
            (table === 'lookup_values' ||
              table === 'exchange_rates' ||
              table === 'profiles') &&
            data.length === 0
          ) {
            return;
          }

          callbacks.applyTableRows(table, data);
        }
      })
    );
    callbacks.notifyComplete();
  } catch (err) {
    console.warn('[Supabase Sync] Hydration warning:', err);
  } finally {
    isHydrating = false;
  }
}

/**
 * Subscribes to Supabase Realtime `postgres_changes` so edits by any team member
 * appear live across all connected sessions.
 */
export function startSupabaseRealtimeSubscription(
  callbacks: SupabaseHydrationCallbacks
): () => void {
  if (!isSupabaseConfigured) return () => {};

  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  const pendingTables = new Set<SyncTableKey>();

  const scheduleRefresh = (table: SyncTableKey) => {
    pendingTables.add(table);
    if (hydrateTimer) clearTimeout(hydrateTimer);
    hydrateTimer = setTimeout(() => {
      if (inFlightSyncCount > 0 || isHydrating) {
        scheduleRefresh(table);
        return;
      }
      const batch = Array.from(pendingTables);
      pendingTables.clear();
      void hydrateWorkspaceFromSupabase(callbacks, batch);
    }, 350);
  };

  realtimeChannel = supabase
    .channel('pzone-tender-log-live')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        const tbl = payload.table as SyncTableKey;
        if (tbl) {
          scheduleRefresh(tbl);
        }
      }
    )
    .subscribe();

  return () => {
    if (hydrateTimer) clearTimeout(hydrateTimer);
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };
}
