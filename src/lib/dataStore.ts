// =============================================================================
// P.ZONE Tender Log — Reactive Data Store & Business Logic Engine (Phases 1–6)
// Connects to Supabase when configured and maintains a persistent local store
// with strict Section 3 Role-Based Access Control, Computed Triggers,
// Revision Cloning, Kanban Auto-Advance, and Automatic Audit Logging.
// =============================================================================

import type {
  AssignmentStatus,
  AuditLogEntry,
  DisciplineType,
  ExchangeRate,
  KanbanBoardStage,
  KanbanStatus,
  LookupCategory,
  LookupValue,
  ModulePermissions,
  NotificationEventType,
  NotificationItem,
  NotificationPreferences,
  Profile,
  ProposalComponent,
  SavedView,
  Task,
  TaskComment,
  Tender,
  TenderAssignment,
  TenderDocument,
  UserRole,
} from '@/types/database';
import { ALL_USER_ROLES } from '@/types/database';
import {
  DEFAULT_EXCHANGE_RATES,
  DEFAULT_LOOKUP_VALUES,
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabaseClient';
import {
  SEEDED_ASSIGNMENTS,
  SEEDED_COMMENTS,
  SEEDED_COMPONENTS,
  SEEDED_DOCUMENTS,
  SEEDED_NOTIFICATIONS,
  SEEDED_TASKS,
  SEEDED_TENDERS,
} from '@/lib/seedTenders';
import {
  canAccessCommercialOverheads,
  canAddComment,
  canAssignEngineers,
  canCreateRevision,
  canCreateTender,
  canEditComponents,
  canEditTenderField,
  canManageAdmin,
  canManageDocuments,
  canManageFxAndCatalog,
  canManageUsers,
  canMoveKanbanCard,
  canViewKanbanAndTeamManagement,
  getEffectiveModulePermissions,
  hasFullTenderAuthority,
  isAssignableEngineerOrManager,
  isEngineerRole,
} from '@/lib/permissions';
import { nowCairoIso, todayCairoIso } from '@/components/ui/DatePickerInput';
import {
  computeComponentFields,
  computeDelayedDays,
  computePriceUsd,
  computeTenderTotalPrice,
  findNearestExchangeRate,
  summarizeTenderComponents,
} from '@/lib/formulas';
import {
  generateUuid,
  hydrateWorkspaceFromSupabase,
  startSupabaseRealtimeSubscription,
  syncArrayDiffToSupabase,
  type SyncTableKey,
} from '@/lib/supabaseSync';

const STORAGE_KEYS = {
  PROFILES: 'pzone_prod_v1_profiles',
  LOOKUPS: 'pzone_prod_v1_lookups',
  FX_RATES: 'pzone_prod_v1_fx_rates',
  AUDIT_LOG: 'pzone_prod_v1_audit_log',
  TENDERS: 'pzone_prod_v1_tenders',
  COMPONENTS: 'pzone_prod_v1_components',
  DOCUMENTS: 'pzone_prod_v1_documents',
  ASSIGNMENTS: 'pzone_prod_v1_assignments',
  TASKS: 'pzone_prod_v1_tasks',
  COMMENTS: 'pzone_prod_v1_comments',
  NOTIFICATIONS: 'pzone_prod_v1_notifications',
  NOTIF_PREFS: 'pzone_prod_v1_notif_prefs',
  SAVED_VIEWS: 'pzone_prod_v1_saved_views',
} as const;

const STORAGE_KEY_TO_SUPABASE_TABLE: Partial<Record<string, SyncTableKey>> = {
  [STORAGE_KEYS.LOOKUPS]: 'lookup_values',
  [STORAGE_KEYS.FX_RATES]: 'exchange_rates',
  [STORAGE_KEYS.AUDIT_LOG]: 'audit_log',
  [STORAGE_KEYS.TENDERS]: 'tenders',
  [STORAGE_KEYS.COMPONENTS]: 'proposal_components',
  [STORAGE_KEYS.DOCUMENTS]: 'tender_documents',
  [STORAGE_KEYS.ASSIGNMENTS]: 'tender_assignments',
  [STORAGE_KEYS.TASKS]: 'tasks',
  [STORAGE_KEYS.COMMENTS]: 'task_comments',
  [STORAGE_KEYS.NOTIFICATIONS]: 'notifications',
  [STORAGE_KEYS.SAVED_VIEWS]: 'saved_views',
};

const SUPABASE_TABLE_TO_STORAGE_KEY: Record<SyncTableKey, string> = {
  profiles: STORAGE_KEYS.PROFILES,
  lookup_values: STORAGE_KEYS.LOOKUPS,
  exchange_rates: STORAGE_KEYS.FX_RATES,
  audit_log: STORAGE_KEYS.AUDIT_LOG,
  tenders: STORAGE_KEYS.TENDERS,
  proposal_components: STORAGE_KEYS.COMPONENTS,
  tender_documents: STORAGE_KEYS.DOCUMENTS,
  tender_assignments: STORAGE_KEYS.ASSIGNMENTS,
  tasks: STORAGE_KEYS.TASKS,
  task_comments: STORAGE_KEYS.COMMENTS,
  notifications: STORAGE_KEYS.NOTIFICATIONS,
  saved_views: STORAGE_KEYS.SAVED_VIEWS,
};

// One-time clean slate purge of transactional localStorage records
const CLEAN_SLATE_MARKER = 'pzone_prod_clean_slate_v2_empty';
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(CLEAN_SLATE_MARKER) !== 'done') {
      const preservedTheme = localStorage.getItem('pzone_theme');
      const preservedLang = localStorage.getItem('pzone_lang');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('pzone_')) {
          keysToRemove.push(k);
        }
      }
      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }
      if (preservedTheme) localStorage.setItem('pzone_theme', preservedTheme);
      if (preservedLang) localStorage.setItem('pzone_lang', preservedLang);
      localStorage.setItem(CLEAN_SLATE_MARKER, 'done');
    }
  } catch {
    // ignore storage errors
  }
}

const EMPTY_TENDERS: Tender[] = [];
const EMPTY_COMPONENTS: ProposalComponent[] = [];
const EMPTY_DOCUMENTS: TenderDocument[] = [];
const EMPTY_ASSIGNMENTS: TenderAssignment[] = [];
const EMPTY_TASKS: Task[] = [];
const EMPTY_COMMENTS: TaskComment[] = [];
const EMPTY_NOTIFICATIONS: NotificationItem[] = [];
const EMPTY_AUDIT_LOGS: AuditLogEntry[] = [];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

// Listeners so UI components can subscribe to store changes
const listeners = new Set<() => void>();
export function subscribeDataStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function notifyListeners(): void {
  for (const fn of listeners) {
    fn();
  }
}

const memoryCache = new Map<string, unknown>();

if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function'
) {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (!event.key) {
      memoryCache.clear();
      notifyListeners();
      return;
    }
    if (event.key.startsWith('pzone_')) {
      memoryCache.delete(event.key);
      notifyListeners();
    }
  });
}

function readStorage<T>(key: string, fallback: T): T {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) as T;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      memoryCache.set(key, fallback);
      return fallback;
    }
    const parsed = JSON.parse(raw) as T;
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      memoryCache.set(key, fallback);
      return fallback;
    }
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

/**
 * Persists migrated/normalized read data to memoryCache and localStorage
 * WITHOUT calling `notifyListeners()`, so read getters remain safe during React render.
 */
function persistCacheOnly<T>(key: string, data: T): void {
  memoryCache.set(key, data);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage quota errors in test environments
  }
}

function writeStorage<T>(key: string, data: T): void {
  const syncTable = STORAGE_KEY_TO_SUPABASE_TABLE[key];
  const prevRows =
    syncTable && Array.isArray(data)
      ? (readStorage<Record<string, unknown>[]>(key, []) ?? [])
      : null;

  persistCacheOnly(key, data);
  notifyListeners();

  if (syncTable && prevRows && Array.isArray(data)) {
    void syncArrayDiffToSupabase(
      syncTable,
      prevRows,
      data as unknown as Record<string, unknown>[]
    );
  }
}

export async function hydrateStoreFromCloud(
  onlyTables?: SyncTableKey[]
): Promise<void> {
  await hydrateWorkspaceFromSupabase(
    {
      applyTableRows: (table, rows) => {
        const storageKey = SUPABASE_TABLE_TO_STORAGE_KEY[table];
        if (storageKey) {
          persistCacheOnly(storageKey, rows);
        }
      },
      notifyComplete: () => {
        notifyListeners();
      },
    },
    onlyTables
  );
}

export function connectRealtimeCloudSync(): () => void {
  return startSupabaseRealtimeSubscription({
    applyTableRows: (table, rows) => {
      const storageKey = SUPABASE_TABLE_TO_STORAGE_KEY[table];
      if (storageKey) {
        persistCacheOnly(storageKey, rows);
      }
    },
    notifyComplete: () => {
      notifyListeners();
    },
  });
}

export interface ActorContext {
  id: string;
  full_name: string;
  role: UserRole;
}

function assertAdminPermission(actor: ActorContext, operationLabel: string): void {
  if (!canManageAdmin(actor.role)) {
    throw new Error(
      `Permission denied: Role '${actor.role}' cannot perform '${operationLabel}'. Only an App Admin is permitted.`
    );
  }
}

function assertUserManagementPermission(actor: ActorContext, operationLabel: string): void {
  if (!canManageUsers(actor.role)) {
    throw new Error(
      `Permission denied: Role '${actor.role}' cannot perform '${operationLabel}'. Only an App Admin is permitted.`
    );
  }
}

export function isUserAssignedToTender(userId: string, tenderId: string): boolean {
  const tender = getTenders().find((t) => t.id === tenderId);
  if (
    tender &&
    (tender.responsible_civil_engineer_id === userId ||
      tender.mechanical_pricing_responsible_id === userId ||
      tender.electrical_pricing_responsible_id === userId)
  ) {
    return true;
  }
  const assignments = getAssignmentsByTender(tenderId);
  return assignments.some((a) => a.user_id === userId);
}

export function computeChangedFields(
  oldObj: Record<string, unknown> | null,
  newObj: Record<string, unknown> | null
): string[] {
  if (!oldObj && newObj) return Object.keys(newObj);
  if (oldObj && !newObj) return Object.keys(oldObj);
  if (!oldObj || !newObj) return [];

  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (key === 'updated_at' || key === 'updated_by') continue;
    if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
      changed.push(key);
    }
  }
  return changed;
}

export function recordAuditEntry(params: {
  table_name: string;
  record_id: string;
  tender_id?: string | null;
  actor: ActorContext;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}): AuditLogEntry | null {
  const changed_fields =
    params.action === 'UPDATE'
      ? computeChangedFields(params.old_data, params.new_data)
      : ['*'];

  if (params.action === 'UPDATE' && changed_fields.length === 0) {
    return null;
  }

  const entry: AuditLogEntry = {
    id: generateUuid(),
    table_name: params.table_name,
    record_id: params.record_id,
    tender_id: params.tender_id ?? null,
    user_id: params.actor.id,
    user_name: params.actor.full_name,
    user_role: params.actor.role,
    action: params.action,
    changed_fields,
    old_data: params.old_data,
    new_data: params.new_data,
    timestamp: nowCairoIso(),
  };

  const current = getAuditLogs();
  const updated = [entry, ...current];
  writeStorage(STORAGE_KEYS.AUDIT_LOG, updated);
  return entry;
}

const AUDIT_CLEARED_STORAGE_KEY = 'pzone_audit_cleared_before_v1';
const AUDIT_CONFIG_LOOKUP_CATEGORY = 'system_audit_config';
const AUDIT_CONFIG_LOOKUP_CODE = 'audit_cleared_before';
// Baseline reset clearing pre-existing setup audit entries (prior to 2026-11-22 01:58 Cairo)
const BASELINE_AUDIT_CLEARED_BEFORE = '2026-11-22T01:58:00+02:00';

function getAuditClearedBeforeTimestamp(): number {
  let maxMs = new Date(BASELINE_AUDIT_CLEARED_BEFORE).getTime();
  try {
    const localIso = localStorage.getItem(AUDIT_CLEARED_STORAGE_KEY);
    if (localIso) {
      const parsed = new Date(localIso).getTime();
      if (!Number.isNaN(parsed) && parsed > maxMs) {
        maxMs = parsed;
      }
    }
  } catch {
    // ignore storage read error
  }

  const lookups = readStorage<LookupValue[]>(STORAGE_KEYS.LOOKUPS, DEFAULT_LOOKUP_VALUES);
  for (const lv of lookups) {
    if (lv.category === AUDIT_CONFIG_LOOKUP_CATEGORY && lv.code === AUDIT_CONFIG_LOOKUP_CODE) {
      const parsed = new Date(lv.label_en).getTime();
      if (!Number.isNaN(parsed) && parsed > maxMs) {
        maxMs = parsed;
      }
    }
  }
  return maxMs;
}

export function getAuditLogs(): AuditLogEntry[] {
  const cutoffMs = getAuditClearedBeforeTimestamp();
  return [...readStorage<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOG, EMPTY_AUDIT_LOGS)]
    .filter((entry) => {
      const ts = new Date(entry.timestamp).getTime();
      return !Number.isNaN(ts) && ts > cutoffMs;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function clearAuditLogs(): void {
  const cutoffIso = nowCairoIso();
  try {
    localStorage.setItem(AUDIT_CLEARED_STORAGE_KEY, cutoffIso);
  } catch {
    // ignore storage error
  }

  const allLookups = readStorage<LookupValue[]>(STORAGE_KEYS.LOOKUPS, DEFAULT_LOOKUP_VALUES);
  const idx = allLookups.findIndex(
    (lv) => lv.category === AUDIT_CONFIG_LOOKUP_CATEGORY && lv.code === AUDIT_CONFIG_LOOKUP_CODE
  );
  if (idx >= 0) {
    const nextLookups = [...allLookups];
    nextLookups[idx] = {
      ...nextLookups[idx],
      label_en: cutoffIso,
      label_ar: cutoffIso,
      updated_at: cutoffIso,
    };
    writeStorage(STORAGE_KEYS.LOOKUPS, nextLookups);
  } else {
    const created: LookupValue = {
      id: generateUuid(),
      category: AUDIT_CONFIG_LOOKUP_CATEGORY,
      code: AUDIT_CONFIG_LOOKUP_CODE,
      label_en: cutoffIso,
      label_ar: cutoffIso,
      color: '#64748b',
      sort_order: 9999,
      active: true,
      created_at: cutoffIso,
      updated_at: cutoffIso,
    };
    writeStorage(STORAGE_KEYS.LOOKUPS, [...allLookups, created]);
  }

  writeStorage(STORAGE_KEYS.AUDIT_LOG, []);
}

// =============================================================================
// 1. PROFILES / USERS READ & ALLOWED SELF / TEAM UPDATES
// Users, roles, active status, and module permissions are managed in the Portal Console
// and read from the `tender.profiles` view.
// =============================================================================

let currentSessionUser: Profile | null = null;

export function setCurrentSessionUser(profile: Profile | null): void {
  currentSessionUser = profile;
}

export function getCurrentSessionUser(): Profile | null {
  return currentSessionUser;
}

function normalizeStoredRole(rawRole: string, team?: string | null): UserRole {
  if ((ALL_USER_ROLES as readonly string[]).includes(rawRole)) {
    return rawRole as UserRole;
  }
  if (rawRole === 'tender_engineer') {
    const t = (team || '').toLowerCase();
    if (t.includes('mech') || t.includes('mep')) return 'mechanical_engineer';
    if (t.includes('elec')) return 'electrical_engineer';
    return 'civil_tender_engineer';
  }
  return 'viewer';
}

export function normalizeProfileRow(p: Profile): Profile {
  const role = normalizeStoredRole(p.role as unknown as string, p.team);
  const effective = getEffectiveModulePermissions({
    role,
    module_permissions: p.module_permissions,
    can_access_commercial_overheads: p.can_access_commercial_overheads,
  });

  return {
    ...p,
    role,
    module_permissions: p.module_permissions ?? effective,
    can_access_commercial_overheads:
      typeof p.can_access_commercial_overheads === 'boolean'
        ? p.can_access_commercial_overheads
        : effective.erp_overheads !== 'hidden',
  };
}

export function getProfiles(): Profile[] {
  const raw = readStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  return raw.map(normalizeProfileRow);
}

export function getProfileName(userId?: string | null, lang: 'en' | 'ar' = 'en'): string {
  if (!userId) return '—';
  const clean = userId.trim();
  if (!clean || clean === 'system_user' || clean === 'system_seed') return '—';
  const lower = clean.toLowerCase();
  const p = getProfiles().find(
    (u) =>
      u.id === clean ||
      u.email.toLowerCase() === lower ||
      u.full_name.toLowerCase() === lower ||
      (u.full_name_ar && u.full_name_ar.trim() === clean)
  );
  if (p) return lang === 'ar' && p.full_name_ar ? p.full_name_ar : p.full_name;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
    return clean;
  }
  return '—';
}

export type EditableProfilePatch = Partial<
  Pick<
    Profile,
    | 'team'
    | 'full_name'
    | 'full_name_ar'
    | 'phone'
    | 'avatar_url'
    | 'preferred_theme'
    | 'preferred_lang'
  >
>;

export async function updateUserProfile(
  userId: string,
  patch: EditableProfilePatch,
  actor: ActorContext
): Promise<Profile> {
  const isSelf = actor.id === userId;
  if (!isSelf) {
    assertUserManagementPermission(actor, 'updateUserProfile');
  }
  if (
    !isSelf &&
    (patch.preferred_theme !== undefined || patch.preferred_lang !== undefined)
  ) {
    throw new Error(
      'Permission denied: preferred_theme and preferred_lang may only be updated on your own row.'
    );
  }

  const profiles = getProfiles();
  const idx = profiles.findIndex((p) => p.id === userId);
  if (idx === -1) {
    throw new Error('User profile not found');
  }

  const existing = profiles[idx];
  const dbPatch: EditableProfilePatch = {};

  if (patch.team !== undefined) {
    dbPatch.team = patch.team ? patch.team.trim() : null;
  }
  if (patch.full_name !== undefined) {
    const cleanName = patch.full_name.trim();
    if (!cleanName) {
      throw new Error('Full Name is required.');
    }
    dbPatch.full_name = cleanName;
  }
  if (patch.full_name_ar !== undefined) {
    dbPatch.full_name_ar = patch.full_name_ar ? patch.full_name_ar.trim() : null;
  }
  if (patch.phone !== undefined) {
    dbPatch.phone = patch.phone ? patch.phone.trim() : null;
  }
  if (patch.avatar_url !== undefined) {
    dbPatch.avatar_url = patch.avatar_url ?? null;
  }
  if (isSelf && patch.preferred_theme !== undefined) {
    dbPatch.preferred_theme = patch.preferred_theme;
  }
  if (isSelf && patch.preferred_lang !== undefined) {
    dbPatch.preferred_lang = patch.preferred_lang;
  }

  if (isSupabaseConfigured && Object.keys(dbPatch).length > 0) {
    const { error } = await supabase
      .from('profiles')
      .update(dbPatch)
      .eq('id', userId);
    if (error) {
      throw new Error(error.message);
    }
  }

  const updatedProfile: Profile = {
    ...existing,
    ...dbPatch,
    updated_at: nowCairoIso(),
  };

  const next = [...profiles];
  next[idx] = updatedProfile;
  persistCacheOnly(STORAGE_KEYS.PROFILES, next);
  notifyListeners();

  recordAuditEntry({
    table_name: 'profiles',
    record_id: userId,
    actor,
    action: 'UPDATE',
    old_data: existing as unknown as Record<string, unknown>,
    new_data: updatedProfile as unknown as Record<string, unknown>,
  });

  return updatedProfile;
}

// =============================================================================
// 2. LOOKUP VALUES CRUD (Section 4.3, 5.7 & Section 9)
// =============================================================================

const LEGACY_PLACEHOLDER_COMPONENT_LOOKUP_IDS = new Set([
  'lv-wft-1',
  'lv-wft-2',
  'lv-wft-3',
  'lv-wft-4',
  'lv-wft-5',
  'lv-wft-6',
  'lv-wft-7',
  'lv-wft-8',
  'lv-filt-1',
  'lv-filt-2',
  'lv-filt-3',
  'lv-filt-4',
  'lv-filt-5',
  'lv-filt-6',
  'lv-fin-1',
  'lv-fin-2',
  'lv-fin-3',
  'lv-fin-4',
  'lv-fin-5',
  'lv-fin-6',
  // Merged water feature options & standalone Balance Tank removed
  'lv-wf-16',
  'lv-wf-19',
  'lv-wf-20',
  'lv-wf-21',
  'lv-wf-22',
  'lv-wf-23',
  'lv-wf-24',
]);

const REMOVED_MERGED_WATER_FEATURE_CODES = new Set([
  'SWIMMING_POOL_AND_LAGOON',
  'SWIMMING_POOL_AND_WATER_FOUNTAIN',
  'JACUZZI_AND_SWIMMING_POOL',
  'WATER_FALL_AND_WATER_FOUNTAIN',
  'WATER_FALL_AND_SWIMMING_POOLS',
  'BALANCE_TANK',
  'LAGOON_AND_FOUNTAIN',
]);

export function getLookupValues(): LookupValue[] {
  const raw = readStorage<LookupValue[]>(STORAGE_KEYS.LOOKUPS, DEFAULT_LOOKUP_VALUES);
  let migrated = false;

  const filtered = raw.filter((lv) => {
    if (
      LEGACY_PLACEHOLDER_COMPONENT_LOOKUP_IDS.has(lv.id) ||
      (lv.category === 'water_feature' &&
        REMOVED_MERGED_WATER_FEATURE_CODES.has(lv.code)) ||
      (lv.category === 'component_shape' &&
        lv.code !== 'RECTANGLE' &&
        lv.code !== 'FREE_FORM' &&
        lv.label_en.trim().toLowerCase() !== 'rectangle' &&
        lv.label_en.trim().toLowerCase() !== 'free form')
    ) {
      migrated = true;
      return false;
    }
    return true;
  });

  const officialCompSeeds = DEFAULT_LOOKUP_VALUES.filter(
    (lv) =>
      !LEGACY_PLACEHOLDER_COMPONENT_LOOKUP_IDS.has(lv.id) &&
      (lv.category === 'water_feature' ||
        lv.category === 'component_shape' ||
        lv.category === 'water_feature_type' ||
        lv.category === 'filtration_method' ||
        lv.category === 'finishing_type')
  );

  const seedByCatCode = new Map(
    officialCompSeeds.map((lv) => [
      `${lv.category}::${lv.code.trim().toUpperCase()}`,
      lv,
    ])
  );

  // Deduplicate static `lv-*` entries when Supabase UUID rows already exist for the same
  // `(category, code)` or `(category, label_en)` so dropdown lists never show duplicates.
  const buildLabelDedupKey = (lv: LookupValue): string | null => {
    if (lv.category === COMPONENT_EXTENDED_META_CATEGORY) {
      return null;
    }
    const meta = (lv.metadata || {}) as Record<string, unknown>;
    const parentScope = [
      meta.country || meta.parent_country,
      meta.governorate || meta.parent_governorate,
      meta.area || meta.parent_area,
    ]
      .filter(Boolean)
      .map((v) => String(v).trim().toLowerCase())
      .join('|');
    return `${lv.category}::LBL::${parentScope}::${lv.label_en.trim().toLowerCase()}`;
  };

  const hasRealUuidForKey = new Set<string>();
  for (const lv of filtered) {
    if (!lv.id.startsWith('lv-')) {
      hasRealUuidForKey.add(`${lv.category}::CODE::${lv.code.trim().toUpperCase()}`);
      const lblKey = buildLabelDedupKey(lv);
      if (lblKey) hasRealUuidForKey.add(lblKey);
    }
  }

  const seenCanonicalKeys = new Set<string>();
  const normalized: LookupValue[] = [];

  for (const lv of filtered) {
    const codeKey = `${lv.category}::CODE::${lv.code.trim().toUpperCase()}`;
    const labelKey = buildLabelDedupKey(lv);

    if (
      lv.id.startsWith('lv-') &&
      (hasRealUuidForKey.has(codeKey) || (labelKey ? hasRealUuidForKey.has(labelKey) : false))
    ) {
      migrated = true;
      continue;
    }

    if (
      seenCanonicalKeys.has(codeKey) ||
      (labelKey ? seenCanonicalKeys.has(labelKey) : false)
    ) {
      migrated = true;
      continue;
    }
    seenCanonicalKeys.add(codeKey);
    if (labelKey) seenCanonicalKeys.add(labelKey);

    let nextLv = lv;
    if (nextLv.category === 'scope_of_work' && nextLv.label_en === 'Mechanical Works (MEP)') {
      migrated = true;
      nextLv = { ...nextLv, label_en: 'Mechanical Works' };
    }

    const matchedSeed = seedByCatCode.get(
      `${nextLv.category}::${nextLv.code.trim().toUpperCase()}`
    );
    if (matchedSeed) {
      if (nextLv.sort_order !== matchedSeed.sort_order) {
        migrated = true;
        nextLv = { ...nextLv, sort_order: matchedSeed.sort_order };
      }
      if (
        nextLv.label_en.trim().toLowerCase() === matchedSeed.label_en.trim().toLowerCase() &&
        nextLv.label_en !== matchedSeed.label_en
      ) {
        migrated = true;
        nextLv = { ...nextLv, label_en: matchedSeed.label_en };
      }
    }

    normalized.push(nextLv);
  }

  for (const seed of officialCompSeeds) {
    const codeKey = `${seed.category}::CODE::${seed.code.trim().toUpperCase()}`;
    const labelKey = buildLabelDedupKey(seed);
    if (
      !seenCanonicalKeys.has(codeKey) &&
      (!labelKey || !seenCanonicalKeys.has(labelKey))
    ) {
      normalized.push(seed);
      seenCanonicalKeys.add(codeKey);
      if (labelKey) seenCanonicalKeys.add(labelKey);
      migrated = true;
    }
  }

  if (migrated) {
    persistCacheOnly(STORAGE_KEYS.LOOKUPS, normalized);
  }
  return normalized;
}

export function getLookupsByCategory(
  category: LookupCategory | string,
  includeInactive = false
): LookupValue[] {
  const isUnifiedCompanyCat =
    category === 'company_directory' ||
    category === 'owner_developer' ||
    category === 'main_contractor';

  const matches = getLookupValues()
    .filter((lv) => {
      const catMatch = isUnifiedCompanyCat
        ? lv.category === 'company_directory' ||
          lv.category === 'owner_developer' ||
          lv.category === 'main_contractor'
        : lv.category === category;
      return catMatch && (includeInactive || lv.active);
    })
    .sort((a, b) => {
      // Prefer real cloud UUID rows before static `lv-*` fallbacks on ties
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      const aStatic = a.id.startsWith('lv-') ? 1 : 0;
      const bStatic = b.id.startsWith('lv-') ? 1 : 0;
      return aStatic - bStatic;
    });

  const seenLabels = new Set<string>();
  const deduped: LookupValue[] = [];
  for (const item of matches) {
    const normLabel = item.label_en.trim().toLowerCase();
    if (!normLabel || seenLabels.has(normLabel)) continue;
    seenLabels.add(normLabel);
    deduped.push(item);
  }
  return deduped;
}

export function getLookupLabel(
  idOrLabel?: string | null,
  lang: 'en' | 'ar' = 'en'
): string {
  if (!idOrLabel) return '—';
  const found = getLookupValues().find(
    (lv) =>
      lv.id === idOrLabel ||
      lv.code === idOrLabel ||
      lv.label_en === idOrLabel
  );
  if (!found) return idOrLabel;
  return lang === 'ar' ? found.label_ar : found.label_en;
}

export function createLookupValue(
  input: {
    category: LookupCategory | string;
    code: string;
    label_en: string;
    label_ar: string;
    color?: string;
    metadata?: Record<string, unknown>;
  },
  actor: ActorContext
): LookupValue {
  assertAdminPermission(actor, 'createLookupValue');

  const all = getLookupValues();
  const cleanCode = input.code.trim().toUpperCase().replace(/\s+/g, '_');

  if (
    all.some(
      (lv) =>
        lv.category === input.category &&
        lv.code.toUpperCase() === cleanCode
    )
  ) {
    throw new Error(
      `Lookup code '${cleanCode}' already exists in category '${input.category}'.`
    );
  }

  const sameCat = all.filter((lv) => lv.category === input.category);
  const maxOrder = sameCat.reduce((max, lv) => Math.max(max, lv.sort_order), 0);

  const now = nowCairoIso();
  const created: LookupValue = {
    id: generateUuid(),
    category: input.category,
    code: cleanCode,
    label_en: input.label_en.trim(),
    label_ar: input.label_ar.trim(),
    color: input.color || '#1E9090',
    sort_order: maxOrder + 1,
    metadata: input.metadata || {},
    active: true,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  };

  const next = [...all, created];
  writeStorage(STORAGE_KEYS.LOOKUPS, next);

  recordAuditEntry({
    table_name: 'lookup_values',
    record_id: created.id,
    actor,
    action: 'INSERT',
    old_data: null,
    new_data: created as unknown as Record<string, unknown>,
  });

  return created;
}

/**
 * Allows Document Control or Tender Manager to add a new entry to the Client/Geography
 * Databases (company_directory, country, governorate, area, district) directly
 * from the Tender Registration or Tender Detail screen.
 */
export function addDirectoryDatabaseEntry(
  input: {
    category:
      | 'company_directory'
      | 'owner_developer'
      | 'main_contractor'
      | 'sales_representative'
      | 'country'
      | 'governorate'
      | 'area'
      | 'district';
    label_en: string;
    label_ar?: string;
    metadata?: Record<string, unknown>;
  },
  actor: ActorContext
): LookupValue {
  if (!canCreateTender(actor.role)) {
    throw new Error(
      `Permission denied: Role '${actor.role}' cannot add directory database entries.`
    );
  }

  const normalizedCategory =
    input.category === 'owner_developer' || input.category === 'main_contractor'
      ? 'company_directory'
      : input.category;

  const all = getLookupValues();
  const cleanLabel = input.label_en.trim();
  const existing = all.find(
    (lv) =>
      (normalizedCategory === 'company_directory'
        ? lv.category === 'company_directory' ||
          lv.category === 'owner_developer' ||
          lv.category === 'main_contractor'
        : lv.category === normalizedCategory) &&
      lv.label_en.trim().toLowerCase() === cleanLabel.toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const cleanCode = cleanLabel
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32) || `DIR_${Date.now()}`;

  const sameCat = all.filter((lv) => lv.category === normalizedCategory);
  const maxOrder = sameCat.reduce((max, lv) => Math.max(max, lv.sort_order), 0);
  const now = nowCairoIso();

  // Resolve parent_id UUID when creating a child Governorate or Area (District is standalone)
  const metaCountry =
    normalizedCategory !== 'district' &&
    typeof input.metadata?.country === 'string'
      ? input.metadata.country
      : undefined;
  const metaGovernorate =
    normalizedCategory !== 'district' &&
    typeof input.metadata?.governorate === 'string'
      ? input.metadata.governorate
      : undefined;

  const parentCountryObj = metaCountry
    ? all.find(
        (lv) => lv.category === 'country' && lv.label_en === metaCountry
      )
    : undefined;
  const parentGovObj = metaGovernorate
    ? all.find(
        (lv) => lv.category === 'governorate' && lv.label_en === metaGovernorate
      )
    : undefined;

  const resolvedParentId =
    normalizedCategory === 'governorate'
      ? parentCountryObj?.id ?? null
      : normalizedCategory === 'area'
      ? parentGovObj?.id ?? parentCountryObj?.id ?? null
      : null;

  const newUuid = generateUuid();

  const created: LookupValue = {
    id: newUuid,
    parent_id: resolvedParentId,
    category: normalizedCategory,
    code: `${cleanCode}_${maxOrder + 1}`,
    label_en: cleanLabel,
    label_ar: input.label_ar?.trim() || cleanLabel,
    color: '#1E9090',
    sort_order: maxOrder + 1,
    metadata:
      normalizedCategory === 'district'
        ? {}
        : {
            ...(input.metadata || {}),
            ...(parentCountryObj ? { country_id: parentCountryObj.id } : {}),
            ...(parentGovObj ? { governorate_id: parentGovObj.id } : {}),
          },
    active: true,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  };

  writeStorage(STORAGE_KEYS.LOOKUPS, [...all, created]);
  recordAuditEntry({
    table_name: 'lookup_values',
    record_id: created.id,
    actor,
    action: 'INSERT',
    old_data: null,
    new_data: created as unknown as Record<string, unknown>,
  });

  return created;
}

/**
 * Allows Tender Engineers, Tender Managers, Document Control, and App Admins
 * to add new options directly to the 4 Component Databases (`water_feature`,
 * `water_feature_type`, `filtration_method`, `finishing_type`, plus `proposal_type`)
 * from Component & Pricing forms, persisting immediately for reuse across proposals.
 */
export function addComponentDatabaseEntry(
  input: {
    category:
      | 'water_feature'
      | 'component_shape'
      | 'water_feature_type'
      | 'filtration_method'
      | 'finishing_type'
      | 'proposal_type';
    label_en: string;
    label_ar?: string;
    metadata?: Record<string, unknown>;
  },
  actor: ActorContext
): LookupValue {
  const actorProfile = getProfiles().find((p) => p.id === actor.id) || actor;
  if (
    !hasFullTenderAuthority(actorProfile) &&
    !isAssignableEngineerOrManager(actorProfile) &&
    !canCreateTender(actor.role)
  ) {
    throw new Error(
      `Permission denied: Role '${actor.role}' cannot add component database entries.`
    );
  }

  const cleanLabel = input.label_en.trim();
  if (!cleanLabel) {
    throw new Error('Option label is required.');
  }

  const all = getLookupValues();
  const existingIdx = all.findIndex(
    (lv) =>
      lv.category === input.category &&
      lv.label_en.trim().toLowerCase() === cleanLabel.toLowerCase()
  );
  if (existingIdx >= 0) {
    const found = all[existingIdx];
    if (!found.active) {
      const reactivated: LookupValue = {
        ...found,
        active: true,
        updated_by: actor.id,
        updated_at: nowCairoIso(),
      };
      const next = [...all];
      next[existingIdx] = reactivated;
      writeStorage(STORAGE_KEYS.LOOKUPS, next);
      return reactivated;
    }
    return found;
  }

  const cleanCode =
    cleanLabel
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 32) || `COMP_${Date.now()}`;

  const sameCat = all.filter((lv) => lv.category === input.category);
  const maxOrder = sameCat.reduce((max, lv) => Math.max(max, lv.sort_order), 0);
  const now = nowCairoIso();

  const lower = cleanLabel.toLowerCase();
  const autoNoDepth =
    lower.includes('pump room') ||
    lower.includes('plant room') ||
    lower.includes('splash pad') ||
    lower.includes('sauna') ||
    lower.includes('steam room') ||
    lower.includes('desalination');

  const defaultMetadata =
    input.category === 'water_feature'
      ? { requires_depth: !autoNoDepth, ...(input.metadata || {}) }
      : input.metadata || {};

  const newUuid = generateUuid();

  const created: LookupValue = {
    id: newUuid,
    category: input.category,
    code: `${cleanCode}_${maxOrder + 1}`,
    label_en: cleanLabel,
    label_ar: input.label_ar?.trim() || cleanLabel,
    color: '#1E9090',
    sort_order: maxOrder + 1,
    metadata: defaultMetadata,
    active: true,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  };

  writeStorage(STORAGE_KEYS.LOOKUPS, [...all, created]);
  recordAuditEntry({
    table_name: 'lookup_values',
    record_id: created.id,
    actor,
    action: 'INSERT',
    old_data: null,
    new_data: created as unknown as Record<string, unknown>,
  });

  return created;
}

export function updateLookupValue(
  id: string,
  patch: Partial<
    Pick<
      LookupValue,
      'label_en' | 'label_ar' | 'color' | 'sort_order' | 'active' | 'metadata'
    >
  >,
  actor: ActorContext
): LookupValue {
  assertAdminPermission(actor, 'updateLookupValue');

  const all = getLookupValues();
  const idx = all.findIndex((lv) => lv.id === id);
  if (idx === -1) {
    throw new Error('Lookup value not found');
  }

  const existing = all[idx];
  const updated: LookupValue = {
    ...existing,
    ...patch,
    metadata: patch.metadata
      ? { ...(existing.metadata || {}), ...patch.metadata }
      : existing.metadata,
    updated_by: actor.id,
    updated_at: nowCairoIso(),
  };

  const next = [...all];
  next[idx] = updated;
  writeStorage(STORAGE_KEYS.LOOKUPS, next);

  recordAuditEntry({
    table_name: 'lookup_values',
    record_id: id,
    actor,
    action: 'UPDATE',
    old_data: existing as unknown as Record<string, unknown>,
    new_data: updated as unknown as Record<string, unknown>,
  });

  return updated;
}

// =============================================================================
// 3. EXCHANGE RATES & HISTORICAL MARKET RATE FETCHER (Section 5.7 & 5.8)
// =============================================================================

export function getExchangeRates(): ExchangeRate[] {
  return readStorage<ExchangeRate[]>(
    STORAGE_KEYS.FX_RATES,
    DEFAULT_EXCHANGE_RATES
  ).sort((a, b) => b.rate_date.localeCompare(a.rate_date));
}

export function upsertExchangeRate(
  input: {
    rate_date: string;
    rate_to_usd: number;
    source?: string;
    is_manual?: boolean;
    currency?: string;
  },
  actor: ActorContext
): ExchangeRate {
  const actorProfile = getProfiles().find((p) => p.id === actor.id) || {
    role: actor.role,
  };
  if (!canManageFxAndCatalog(actorProfile)) {
    assertAdminPermission(actor, 'upsertExchangeRate');
  }

  if (!input.rate_date || !/^\d{4}-\d{2}-\d{2}$/.test(input.rate_date)) {
    throw new Error('Valid YYYY-MM-DD date is required');
  }
  if (typeof input.rate_to_usd !== 'number' || input.rate_to_usd <= 0) {
    throw new Error('Exchange rate must be a positive number');
  }

  const currency = input.currency || 'EGP';
  const all = getExchangeRates();
  const existingIdx = all.findIndex(
    (r) => r.currency === currency && r.rate_date === input.rate_date
  );

  const now = nowCairoIso();

  if (existingIdx >= 0) {
    const existing = all[existingIdx];
    const updated: ExchangeRate = {
      ...existing,
      rate_to_usd: Number(input.rate_to_usd.toFixed(6)),
      source: input.source ?? existing.source,
      is_manual: input.is_manual ?? true,
      fetched_at: now,
      updated_by: actor.id,
    };
    const next = [...all];
    next[existingIdx] = updated;
    writeStorage(STORAGE_KEYS.FX_RATES, next);

    recordAuditEntry({
      table_name: 'exchange_rates',
      record_id: updated.id,
      actor,
      action: 'UPDATE',
      old_data: existing as unknown as Record<string, unknown>,
      new_data: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  const created: ExchangeRate = {
    id: generateUuid(),
    currency,
    rate_date: input.rate_date,
    rate_to_usd: Number(input.rate_to_usd.toFixed(6)),
    source: input.source || (input.is_manual ? 'Manual Entry' : 'currency-api (jsDelivr)'),
    is_manual: input.is_manual ?? true,
    fetched_at: now,
    created_by: actor.id,
    updated_by: actor.id,
  };

  const next = [created, ...all].sort((a, b) =>
    b.rate_date.localeCompare(a.rate_date)
  );
  writeStorage(STORAGE_KEYS.FX_RATES, next);

  recordAuditEntry({
    table_name: 'exchange_rates',
    record_id: created.id,
    actor,
    action: 'INSERT',
    old_data: null,
    new_data: created as unknown as Record<string, unknown>,
  });

  return created;
}

function subtractDaysIso(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export async function fetchMarketUsdEgpRate(
  targetDate: string,
  actor?: ActorContext
): Promise<{
  rate: number;
  requestedDate: string;
  dateUsed: string;
  source: string;
  cached: boolean;
}> {
  const cleanDate = targetDate.slice(0, 10);
  const allRates = getExchangeRates();

  const exactMatch = allRates.find(
    (r) => r.currency === 'EGP' && r.rate_date === cleanDate
  );
  if (exactMatch) {
    return {
      rate: exactMatch.rate_to_usd,
      requestedDate: cleanDate,
      dateUsed: exactMatch.rate_date,
      source: exactMatch.source,
      cached: true,
    };
  }

  if (typeof fetch !== 'undefined') {
    for (let offset = 0; offset <= 5; offset++) {
      const candidateDate = subtractDaysIso(cleanDate, offset);
      try {
        const res = await fetch(
          `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${candidateDate}/v1/currencies/usd.json`
        );
        if (res.ok) {
          const data = await res.json();
          const egp = data?.usd?.egp;
          if (typeof egp === 'number' && egp > 0) {
            const roundedRate = Number(egp.toFixed(6));
            const source = 'currency-api (jsDelivr)';

            const current = getExchangeRates();
            if (!current.some((r) => r.rate_date === candidateDate)) {
              const saved: ExchangeRate = {
                id: generateUuid(),
                currency: 'EGP',
                rate_date: candidateDate,
                rate_to_usd: roundedRate,
                source,
                is_manual: false,
                fetched_at: nowCairoIso(),
                created_by: actor?.id ?? null,
              };
              writeStorage(
                STORAGE_KEYS.FX_RATES,
                [saved, ...current].sort((a, b) =>
                  b.rate_date.localeCompare(a.rate_date)
                )
              );
              if (actor) {
                recordAuditEntry({
                  table_name: 'exchange_rates',
                  record_id: saved.id,
                  actor,
                  action: 'INSERT',
                  old_data: null,
                  new_data: saved as unknown as Record<string, unknown>,
                });
              }
            }

            return {
              rate: roundedRate,
              requestedDate: cleanDate,
              dateUsed: candidateDate,
              source,
              cached: false,
            };
          }
        }
      } catch {
        // Fallback if offline
      }
    }
  }

  const fallback = findNearestExchangeRate(cleanDate, allRates, 'EGP');
  if (fallback) {
    return {
      rate: fallback.rate,
      requestedDate: cleanDate,
      dateUsed: fallback.dateUsed,
      source: `${fallback.source} (nearest earlier)`,
      cached: true,
    };
  }

  throw new Error(`No USD/EGP exchange rate found on or before ${cleanDate}`);
}

// =============================================================================
// 4. NOTIFICATIONS & MUTE PREFERENCES (Section 5.5)
// =============================================================================

export function getAllNotifications(): NotificationItem[] {
  return [...readStorage<NotificationItem[]>(
    STORAGE_KEYS.NOTIFICATIONS,
    EMPTY_NOTIFICATIONS
  )].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getNotificationPreferences(userId: string): NotificationPreferences {
  const allPrefs = readStorage<Record<string, NotificationPreferences>>(
    STORAGE_KEYS.NOTIF_PREFS,
    {}
  );
  return (
    allPrefs[userId] || {
      user_id: userId,
      in_app: true,
      muted_event_types: [],
    }
  );
}

export function updateNotificationPreferences(
  userId: string,
  patch: Partial<Pick<NotificationPreferences, 'in_app' | 'muted_event_types'>>
): NotificationPreferences {
  const allPrefs = readStorage<Record<string, NotificationPreferences>>(
    STORAGE_KEYS.NOTIF_PREFS,
    {}
  );
  const current = getNotificationPreferences(userId);
  const updated: NotificationPreferences = {
    ...current,
    ...patch,
  };
  allPrefs[userId] = updated;
  writeStorage(STORAGE_KEYS.NOTIF_PREFS, allPrefs);
  return updated;
}

export function getNotificationsForUser(userId: string): NotificationItem[] {
  const userProfile = getProfiles().find((p) => p.id === userId);
  // Section 3: Viewers get no task notifications unless explicitly granted Commercial Overheads authority
  if (userProfile?.role === 'viewer' && !canAccessCommercialOverheads(userProfile)) {
    return [];
  }
  const prefs = getNotificationPreferences(userId);
  if (!prefs.in_app) return [];

  if (userProfile?.role === 'viewer' && canAccessCommercialOverheads(userProfile)) {
    return getAllNotifications().filter(
      (n) =>
        n.user_id === userId &&
        !prefs.muted_event_types.includes(n.type) &&
        (n.type === 'erp_ready_for_commercial' || n.type === 'erp_commercial_bid_set')
    );
  }

  const hideTeamEvents = userProfile
    ? !canViewKanbanAndTeamManagement(userProfile)
    : false;
  const teamEventTypes = new Set<NotificationEventType>([
    'tender_assigned',
    'task_finished',
    'task_blocked',
  ]);

  return getAllNotifications().filter(
    (n) =>
      n.user_id === userId &&
      !prefs.muted_event_types.includes(n.type) &&
      (!hideTeamEvents || !teamEventTypes.has(n.type))
  );
}

export function dispatchNotification(params: {
  recipientIds: string[];
  type: NotificationEventType;
  tender_id?: string | null;
  proposal_code?: string | null;
  title_en: string;
  title_ar: string;
  message_en: string;
  message_ar: string;
}): void {
  const uniqueIds = Array.from(new Set(params.recipientIds.filter(Boolean)));
  if (uniqueIds.length === 0) return;

  const profiles = getProfiles();
  const current = getAllNotifications();
  const now = nowCairoIso();
  const newItems: NotificationItem[] = [];

  for (const uid of uniqueIds) {
    const profile = profiles.find((p) => p.id === uid);
    // Viewers get no task notifications (Section 3)
    if (!profile || profile.role === 'viewer') continue;

    const prefs = getNotificationPreferences(uid);
    if (!prefs.in_app || prefs.muted_event_types.includes(params.type)) {
      continue;
    }

    // Avoid duplicate unread notification for the same user + type + tender + title
    const isDuplicate = current.some(
      (n) =>
        n.user_id === uid &&
        n.type === params.type &&
        n.tender_id === (params.tender_id ?? null) &&
        n.title_en === params.title_en &&
        !n.read_at
    );
    if (isDuplicate) continue;

    newItems.push({
      id: generateUuid(),
      user_id: uid,
      type: params.type,
      tender_id: params.tender_id ?? null,
      proposal_code: params.proposal_code ?? null,
      title_en: params.title_en,
      title_ar: params.title_ar,
      message_en: params.message_en,
      message_ar: params.message_ar,
      read_at: null,
      created_at: now,
    });
  }

  if (newItems.length > 0) {
    writeStorage(STORAGE_KEYS.NOTIFICATIONS, [...newItems, ...current]);
  }
}

export function markNotificationRead(id: string): void {
  const all = getAllNotifications();
  const next = all.map((n) =>
    n.id === id && !n.read_at ? { ...n, read_at: nowCairoIso() } : n
  );
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, next);
}

export function markAllNotificationsRead(userId: string): void {
  const all = getAllNotifications();
  const now = nowCairoIso();
  const next = all.map((n) =>
    n.user_id === userId && !n.read_at ? { ...n, read_at: now } : n
  );
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, next);
}

/**
 * Ensures any tender registered within the last 48 hours has its `new_tender`
 * notification delivered to active team members even if an earlier client session
 * failed to flush the batch before cloud sync hardening.
 */
export function backfillRecentMissedNewTenderNotifications(
  userId: string
): number {
  const userProfile = getProfiles().find((p) => p.id === userId);
  if (!userProfile || !userProfile.active || userProfile.role === 'viewer') {
    return 0;
  }
  const prefs = getNotificationPreferences(userId);
  if (!prefs.in_app || prefs.muted_event_types.includes('new_tender')) {
    return 0;
  }

  const allTenders = getTenders();
  const allNotifications = getAllNotifications();
  const cutoffMs = Date.now() - 48 * 60 * 60 * 1000;
  const now = nowCairoIso();
  const missingItems: NotificationItem[] = [];

  for (const t of allTenders) {
    if (t.is_archived || t.proposal_rev !== 0) continue;
    if (t.created_by && t.created_by === userId) continue;
    const createdMs = Date.parse(t.created_at);
    if (Number.isNaN(createdMs) || createdMs < cutoffMs) continue;

    const alreadyExists = allNotifications.some(
      (n) =>
        n.user_id === userId &&
        n.type === 'new_tender' &&
        (n.tender_id === t.id ||
          (Boolean(t.proposal_code) && n.proposal_code === t.proposal_code))
    );
    if (alreadyExists) continue;

    const creatorName = getProfileName(t.created_by, 'en');
    const actorLabel =
      creatorName && creatorName !== '—' ? creatorName : 'Document Control';
    missingItems.push({
      id: generateUuid(),
      user_id: userId,
      type: 'new_tender',
      tender_id: t.id,
      proposal_code: t.proposal_code,
      title_en: `New Tender Registered: ${t.proposal_code}`,
      title_ar: `تم تسجيل مناقصة جديدة: ${t.proposal_code}`,
      message_en: `${actorLabel} registered "${t.proposal_name}" for ${t.owner}.`,
      message_ar: `قام ${actorLabel} بتسجيل المناقصة "${t.proposal_name}" للمالك ${t.owner}.`,
      read_at: null,
      created_at: now,
    });
  }

  if (missingItems.length > 0) {
    writeStorage(STORAGE_KEYS.NOTIFICATIONS, [
      ...missingItems,
      ...allNotifications,
    ]);
  }
  return missingItems.length;
}

/**
 * Section 5.5: Scheduled daily scan for tenders due in <= 2 days, due today, or overdue.
 */
function toDdMmYyyy(iso?: string | null): string {
  if (!iso) return 'TBD';
  const m = iso.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function runDueAndOverdueScan(): number {
  const tenders = getTenders().filter(
    (t) =>
      t.is_latest_revision &&
      !t.actual_sent_date &&
      (t.expected_send_date || t.deadline_date) &&
      t.tender_status !== 'Sent to Client' &&
      t.tender_status !== 'Cancelled / Apologized'
  );
  const managers = getProfiles()
    .filter((p) => p.role === 'tender_manager' && p.active)
    .map((p) => p.id);

  let createdCount = 0;
  const todayStr = nowCairoIso().slice(0, 10);
  const todayMs = new Date(`${todayStr}T00:00:00Z`).getTime();

  for (const t of tenders) {
    const assignees = [
      t.responsible_civil_engineer_id,
      t.mechanical_pricing_responsible_id,
      t.electrical_pricing_responsible_id,
    ].filter(Boolean) as string[];

    const recipients = [...managers, ...assignees];

    if (t.expected_send_date) {
      const expMs = new Date(`${t.expected_send_date}T00:00:00Z`).getTime();
      const daysUntilDue = Math.round((expMs - todayMs) / (1000 * 60 * 60 * 24));
      const formattedExpected = toDdMmYyyy(t.expected_send_date);

      if (daysUntilDue < 0) {
        const overdueDays = Math.abs(daysUntilDue);
        dispatchNotification({
          recipientIds: recipients,
          type: 'due_reminder',
          tender_id: t.id,
          proposal_code: t.proposal_code,
          title_en: `Overdue Tender: ${t.proposal_code} (${overdueDays}d late)`,
          title_ar: `مناقصة متأخرة: ${t.proposal_code} (${overdueDays} يوم)`,
          message_en: `${t.proposal_name} (${t.owner}) was expected on ${formattedExpected}.`,
          message_ar: `المناقصة ${t.proposal_name} (${t.owner}) تجاوزت تاريخ الإرسال المتوقع ${formattedExpected}.`,
        });
        createdCount++;
      } else if (daysUntilDue <= 2) {
        dispatchNotification({
          recipientIds: recipients,
          type: 'due_reminder',
          tender_id: t.id,
          proposal_code: t.proposal_code,
          title_en: `Due Soon: ${t.proposal_code} (in ${daysUntilDue}d)`,
          title_ar: `تقترب من الاستحقاق: ${t.proposal_code} (خلال ${daysUntilDue} يوم)`,
          message_en: `${t.proposal_name} is due to be sent on ${formattedExpected}.`,
          message_ar: `المناقصة ${t.proposal_name} مستحقة للإرسال بتاريخ ${formattedExpected}.`,
        });
        createdCount++;
      }
    }

    if (t.deadline_date && t.deadline_date !== t.expected_send_date) {
      const dlMs = new Date(`${t.deadline_date}T00:00:00Z`).getTime();
      const daysUntilDeadline = Math.round((dlMs - todayMs) / (1000 * 60 * 60 * 24));
      const formattedDeadline = toDdMmYyyy(t.deadline_date);

      if (daysUntilDeadline < 0) {
        const overdueDays = Math.abs(daysUntilDeadline);
        dispatchNotification({
          recipientIds: recipients,
          type: 'due_reminder',
          tender_id: t.id,
          proposal_code: t.proposal_code,
          title_en: `Client Deadline Passed: ${t.proposal_code} (${overdueDays}d ago)`,
          title_ar: `تجاوز الموعد النهائي للعميل: ${t.proposal_code} (${overdueDays} يوم)`,
          message_en: `Hard client deadline for ${t.proposal_name} (${t.owner}) passed on ${formattedDeadline}.`,
          message_ar: `الموعد النهائي لتسليم ${t.proposal_name} للعميل انتهى بتاريخ ${formattedDeadline}.`,
        });
        createdCount++;
      } else if (daysUntilDeadline <= 2) {
        dispatchNotification({
          recipientIds: recipients,
          type: 'due_reminder',
          tender_id: t.id,
          proposal_code: t.proposal_code,
          title_en: `Client Hard Deadline Soon: ${t.proposal_code} (in ${daysUntilDeadline}d)`,
          title_ar: `يقترب الموعد النهائي للعميل: ${t.proposal_code} (خلال ${daysUntilDeadline} يوم)`,
          message_en: `Hard client submission deadline for ${t.proposal_name} is ${formattedDeadline}.`,
          message_ar: `الموعد النهائي لتسليم المناقصة ${t.proposal_name} للعميل هو ${formattedDeadline}.`,
        });
        createdCount++;
      }
    }
  }

  return createdCount;
}

// =============================================================================
// 5. TENDERS, REVISIONS & COMPUTED TRIGGERS (Section 4.1, 4.4, 5.1, 5.1a)
// =============================================================================

function applyComputedTenderFields(tender: Tender): Tender {
  const rates = getExchangeRates();
  const delayed_days = computeDelayedDays(
    tender.expected_send_date,
    tender.actual_sent_date
  );

  const tender_total_price = computeTenderTotalPrice({
    maintenance_cost: tender.maintenance_cost,
    supply_cost: tender.supply_cost,
    design_cost: tender.design_cost,
    civil_cost: tender.civil_cost,
    mechanical_cost: tender.mechanical_cost,
    electrical_cost: tender.electrical_cost,
    total_price_is_manual: tender.total_price_is_manual,
    manual_total_price: tender.tender_total_price,
  });

  let exchange_rate_on_sent_date = tender.exchange_rate_on_sent_date ?? null;
  let sent_rate_date_used = tender.sent_rate_date_used ?? null;
  let sent_rate_source = tender.sent_rate_source ?? null;

  if (tender.actual_sent_date && !tender.sent_rate_is_manual) {
    const fx = findNearestExchangeRate(tender.actual_sent_date, rates, 'EGP');
    if (fx) {
      exchange_rate_on_sent_date = fx.rate;
      sent_rate_date_used = fx.dateUsed;
      sent_rate_source = fx.source;
    }
  } else if (!exchange_rate_on_sent_date && tender_total_price > 0) {
    const latestFx = rates[0];
    if (latestFx) {
      exchange_rate_on_sent_date = latestFx.rate_to_usd;
      sent_rate_date_used = latestFx.rate_date;
      sent_rate_source = latestFx.source;
    }
  }

  const tender_total_price_usd = computePriceUsd(
    tender_total_price,
    exchange_rate_on_sent_date
  );

  let exchange_rate_on_contract_date =
    tender.exchange_rate_on_contract_date ?? null;
  let contract_rate_date_used = tender.contract_rate_date_used ?? null;
  let contract_rate_source = tender.contract_rate_source ?? null;

  const contractTargetDate = tender.pr_contract_date || tender.contract_date;
  if (contractTargetDate && !tender.contract_rate_is_manual) {
    const fxC = findNearestExchangeRate(contractTargetDate, rates, 'EGP');
    if (fxC) {
      exchange_rate_on_contract_date = fxC.rate;
      contract_rate_date_used = fxC.dateUsed;
      contract_rate_source = fxC.source;
    }
  }

  const pr_contract_total_price_usd = computePriceUsd(
    tender.final_pr_contract_total_price,
    exchange_rate_on_contract_date
  );

  const normalizedScope = Array.isArray(tender.scope_of_work)
    ? tender.scope_of_work.map((s) =>
        s === 'Mechanical Works (MEP)' ? 'Mechanical Works' : s
      )
    : [];

  return {
    ...tender,
    scope_of_work: normalizedScope,
    delayed_days,
    tender_total_price,
    exchange_rate_on_sent_date,
    sent_rate_date_used,
    sent_rate_source,
    tender_total_price_usd,
    exchange_rate_on_contract_date,
    contract_rate_date_used,
    contract_rate_source,
    pr_contract_total_price_usd,
  };
}

export function getTenders(): Tender[] {
  const raw = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
  return raw
    .filter((t) => !t.is_archived)
    .map(applyComputedTenderFields)
    .sort((a, b) => b.serial_no - a.serial_no);
}

export function getTenderById(id: string): Tender | null {
  return getTenders().find((t) => t.id === id) || null;
}

export function getTenderRevisions(proposalCode: string): Tender[] {
  const norm = proposalCode.trim().toLowerCase();
  return getTenders()
    .filter((t) => t.proposal_code.trim().toLowerCase() === norm)
    .sort((a, b) => a.proposal_rev - b.proposal_rev);
}

export function suggestNextProposalCode(year = new Date().getFullYear()): string {
  const tenders = getTenders().filter((t) => t.year === year);
  let maxSeq = 0;
  for (const t of tenders) {
    const match = t.proposal_code.match(/(\d+)$/);
    if (match) {
      maxSeq = Math.max(maxSeq, Number(match[1]));
    }
  }
  const nextNum = String(maxSeq + 1).padStart(3, '0');
  return `PZ-${year}-${nextNum}`;
}

export function createTender(
  input: Partial<Tender> & {
    proposal_code: string;
    proposal_name: string;
    owner: string;
  },
  actor: ActorContext
): Tender {
  if (!canCreateTender(actor.role)) {
    throw new Error(
      `Permission denied: Role '${actor.role}' cannot register new tenders.`
    );
  }

  const all = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
  const maxSerial = all.reduce((max, t) => Math.max(max, t.serial_no), 0);
  const now = nowCairoIso();
  const today = now.slice(0, 10);

  const baseTender: Tender = applyComputedTenderFields({
    id: generateUuid(),
    serial_no: maxSerial + 1,
    year: input.year || new Date().getFullYear(),
    proposal_code: input.proposal_code.trim(),
    proposal_rev: input.proposal_rev ?? 0,
    previous_revision_id: input.previous_revision_id ?? null,
    revision_reason: input.revision_reason ?? null,
    revision_requested_by: input.revision_requested_by ?? null,
    is_latest_revision: true,
    sales_representative_id: input.sales_representative_id || '',
    pzone_role: input.pzone_role || 'Sub Contractor',
    contractor: input.contractor || '',
    owner: input.owner.trim(),
    country: input.country || 'Egypt',
    governorate: input.governorate || 'Cairo',
    area: input.area || 'New Cairo & Fifth Settlement',
    district: input.district || '',
    location: input.location || '',
    proposal_origin: input.proposal_origin ?? '',
    proposal_name: input.proposal_name.trim(),
    total_components_area_m2: 0,
    total_components_volume_m3: 0,
    server_link_path: input.server_link_path || '',
    scope_of_work: input.scope_of_work || ['Civil & Structural Works', 'Mechanical Works'],
    components_summary: '',
    project_priority: input.project_priority || 'Medium',
    received_date: input.received_date || today,
    expected_send_date: hasFullTenderAuthority(
      getProfiles().find((p) => p.id === actor.id) || actor
    )
      ? input.expected_send_date || null
      : null,
    deadline_date: input.deadline_date || null,
    actual_sent_date: null,
    tender_status: 'New / Registered',
    responsible_civil_engineer_id: null,
    civil_assigned_at: null,
    mechanical_pricing_responsible_id: null,
    mechanical_assigned_at: null,
    electrical_pricing_responsible_id: null,
    electrical_assigned_at: null,
    tender_status_notes: input.tender_status_notes || '',
    delayed_days: 0,
    currency: 'EGP',
    maintenance_cost: 0,
    supply_cost: 0,
    design_cost: 0,
    civil_cost: 0,
    mechanical_cost: 0,
    electrical_cost: 0,
    total_price_is_manual: false,
    tender_total_price: 0,
    estimated_price_if_not_sent: input.estimated_price_if_not_sent ?? null,
    is_duplicate: input.is_duplicate || 'Not Duplicate',
    duplicate_of_tender_id: input.duplicate_of_tender_id ?? null,
    contact_name: input.contact_name || '',
    contact_number: input.contact_number || '',
    contact_job_title: input.contact_job_title || '',
    contact_email: input.contact_email || '',
    contact_address: input.contact_address || '',
    exchange_rate_on_sent_date: null,
    sent_rate_date_used: null,
    sent_rate_source: null,
    sent_rate_is_manual: false,
    tender_total_price_usd: null,
    project_status: null,
    contract_date: null,
    project_status_note: null,
    pr_code: null,
    project_name: input.project_name || input.proposal_name.trim(),
    pr_contract_date: null,
    final_pr_contract_total_price: null,
    exchange_rate_on_contract_date: null,
    contract_rate_date_used: null,
    contract_rate_source: null,
    contract_rate_is_manual: false,
    pr_contract_total_price_usd: null,
    final_contracted_status: 'Not Contracted',
    final_contracted_status_notes: null,
    is_archived: false,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  });

  // Automatically persist any new District (Compound / Building Name) into the standalone `district` database table for reuse
  if (input.district?.trim()) {
    addDirectoryDatabaseEntry(
      {
        category: 'district',
        label_en: input.district.trim(),
      },
      actor
    );
  }

  writeStorage(STORAGE_KEYS.TENDERS, [baseTender, ...all]);

  // Create initial Kanban card in 'New' column
  const tasks = getTasks();
  const newTask: Task = {
    id: generateUuid(),
    tender_id: baseTender.id,
    title: `${baseTender.proposal_code} — ${baseTender.proposal_name}`,
    kanban_status: 'New',
    blocked_reason: null,
    due_date: baseTender.expected_send_date ?? null,
    progress_note: 'Registered by Document Control',
    completed_at: null,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  };
  writeStorage(STORAGE_KEYS.TASKS, [newTask, ...tasks]);

  // Section 5.5 Notification: New tender registered -> All active team members (except creator & pure viewers)
  const teamRecipients = getProfiles()
    .filter(
      (p) => p.active && p.role !== 'viewer' && p.id !== actor.id
    )
    .map((p) => p.id);

  dispatchNotification({
    recipientIds: teamRecipients,
    type: 'new_tender',
    tender_id: baseTender.id,
    proposal_code: baseTender.proposal_code,
    title_en: `New Tender Registered: ${baseTender.proposal_code}`,
    title_ar: `تم تسجيل مناقصة جديدة: ${baseTender.proposal_code}`,
    message_en: `${actor.full_name} registered "${baseTender.proposal_name}" for ${baseTender.owner}.`,
    message_ar: `قام ${actor.full_name} بتسجيل المناقصة "${baseTender.proposal_name}" للمالك ${baseTender.owner}.`,
  });

  recordAuditEntry({
    table_name: 'tenders',
    record_id: baseTender.id,
    tender_id: baseTender.id,
    actor,
    action: 'INSERT',
    old_data: null,
    new_data: baseTender as unknown as Record<string, unknown>,
  });

  return baseTender;
}

export function updateTender(
  tenderId: string,
  patch: Partial<Tender>,
  actor: ActorContext
): Tender {
  const all = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
  const idx = all.findIndex((t) => t.id === tenderId);
  if (idx === -1) {
    throw new Error('Tender not found');
  }

  const existing = all[idx];
  const assigned = isUserAssignedToTender(actor.id, tenderId);

  // Verify field-level permissions (Section 3)
  for (const key of Object.keys(patch) as (keyof Tender)[]) {
    if (patch[key] !== existing[key]) {
      if (!canEditTenderField(actor.role, key, assigned)) {
        throw new Error(
          `Permission denied: Role '${actor.role}' cannot edit field '${String(key)}'.`
        );
      }
    }
  }

  const merged: Tender = applyComputedTenderFields({
    ...existing,
    ...patch,
    updated_by: actor.id,
    updated_at: nowCairoIso(),
  });

  // Automatically persist any new District (Compound / Building Name) into the standalone `district` database table for reuse
  if (patch.district?.trim() && canCreateTender(actor.role)) {
    addDirectoryDatabaseEntry(
      {
        category: 'district',
        label_en: patch.district.trim(),
      },
      actor
    );
  }

  const next = [...all];
  next[idx] = merged;
  writeStorage(STORAGE_KEYS.TENDERS, next);

  if (
    patch.civil_cost !== undefined ||
    patch.mechanical_cost !== undefined ||
    patch.electrical_cost !== undefined
  ) {
    syncDisciplineAssignmentsFromPricing(tenderId, actor);
  }

  if (patch.tender_status !== undefined || patch.actual_sent_date !== undefined) {
    const allTasks = getTasks();
    const taskIdx = allTasks.findIndex((tk) => tk.tender_id === tenderId);
    if (taskIdx >= 0) {
      const nextStage = toKanbanBoardStage(
        'New',
        merged.actual_sent_date ? 'Sent to Client' : merged.tender_status
      );
      const nextKanbanStatus: KanbanStatus =
        nextStage === 'Not Started' &&
        (allTasks[taskIdx].kanban_status === 'New' ||
          allTasks[taskIdx].kanban_status === 'Assigned')
          ? allTasks[taskIdx].kanban_status
          : nextStage;
      if (allTasks[taskIdx].kanban_status !== nextKanbanStatus) {
        const nextTasks = [...allTasks];
        nextTasks[taskIdx] = {
          ...nextTasks[taskIdx],
          kanban_status: nextKanbanStatus,
          blocked_reason:
            nextStage === 'Cancelled or Waiting'
              ? nextTasks[taskIdx].blocked_reason ||
                merged.tender_status_notes ||
                merged.tender_status
              : null,
          updated_by: actor.id,
          updated_at: merged.updated_at,
        };
        writeStorage(STORAGE_KEYS.TASKS, nextTasks);
      }
    }
  }

  // Check for status notifications (Section 5.5)
  const recipients = [
    merged.created_by,
    merged.responsible_civil_engineer_id,
    merged.mechanical_pricing_responsible_id,
    merged.electrical_pricing_responsible_id,
    ...getProfiles()
      .filter((p) => hasFullTenderAuthority(p))
      .map((p) => p.id),
  ].filter(Boolean) as string[];

  if (
    merged.project_status !== existing.project_status &&
    (merged.project_status === 'Awarded' || merged.project_status === 'Lost')
  ) {
    dispatchNotification({
      recipientIds: recipients,
      type: 'status_awarded_lost',
      tender_id: merged.id,
      proposal_code: merged.proposal_code,
      title_en: `Tender ${merged.project_status}: ${merged.proposal_code}`,
      title_ar: `تحديث حالة الترسية (${merged.project_status}): ${merged.proposal_code}`,
      message_en: `${merged.proposal_name} (${merged.owner}) was marked as ${merged.project_status}.`,
      message_ar: `تم تحديث حالة المناقصة ${merged.proposal_name} إلى ${merged.project_status}.`,
    });
  }

  // Dispatch pricing_updated notification when pricing fields change (Section 5.5)
  const pricingChanged =
    merged.maintenance_cost !== existing.maintenance_cost ||
    merged.supply_cost !== existing.supply_cost ||
    merged.design_cost !== existing.design_cost ||
    merged.civil_cost !== existing.civil_cost ||
    merged.mechanical_cost !== existing.mechanical_cost ||
    merged.electrical_cost !== existing.electrical_cost ||
    merged.tender_total_price !== existing.tender_total_price;

  if (pricingChanged) {
    dispatchNotification({
      recipientIds: recipients,
      type: 'pricing_updated',
      tender_id: merged.id,
      proposal_code: merged.proposal_code,
      title_en: `Pricing Updated: ${merged.proposal_code}`,
      title_ar: `تم تحديث التسعير: ${merged.proposal_code}`,
      message_en: `${actor.full_name} updated pricing on "${merged.proposal_name}" (Total: ${merged.tender_total_price.toLocaleString()} EGP).`,
      message_ar: `قام ${actor.full_name} بتحديث أسعار المناقصة "${merged.proposal_name}".`,
    });
  }

  recordAuditEntry({
    table_name: 'tenders',
    record_id: tenderId,
    tender_id: tenderId,
    actor,
    action: 'UPDATE',
    old_data: existing as unknown as Record<string, unknown>,
    new_data: merged as unknown as Record<string, unknown>,
  });

  return merged;
}

/**
 * Section 5.1a:
 * Creates Rev + 1 linked to the previous revision, copies all components and documents,
 * marks the previous revision `is_latest_revision = false`, and logs to `audit_log`.
 */
export function createTenderRevision(
  sourceTenderId: string,
  reason: string,
  requestedBy: string,
  actor: ActorContext
): Tender {
  if (!canCreateRevision(actor.role)) {
    throw new Error(
      `Permission denied: Role '${actor.role}' cannot create tender revisions.`
    );
  }

  const all = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
  const source = all.find((t) => t.id === sourceTenderId);
  if (!source) {
    throw new Error('Source tender not found');
  }

  const sameCodeRevs = all.filter(
    (t) => t.proposal_code.toLowerCase() === source.proposal_code.toLowerCase()
  );
  const nextRevNum =
    sameCodeRevs.reduce((max, t) => Math.max(max, t.proposal_rev), 0) + 1;
  const maxSerial = all.reduce((max, t) => Math.max(max, t.serial_no), 0);
  const now = nowCairoIso();

  // Mark previous revisions of this code as is_latest_revision = false
  const updatedAll = all.map((t) =>
    t.proposal_code.toLowerCase() === source.proposal_code.toLowerCase()
      ? { ...t, is_latest_revision: false }
      : t
  );

  const newTenderId = generateUuid();
  // Copy components from source tender to new revision
  const allComponents = readStorage<ProposalComponent[]>(
    STORAGE_KEYS.COMPONENTS,
    EMPTY_COMPONENTS
  );
  const sourceComponents = allComponents.filter(
    (c) => c.tender_id === source.id
  );
  const hasSourceTeam = Boolean(
    source.responsible_civil_engineer_id ||
      source.mechanical_pricing_responsible_id ||
      source.electrical_pricing_responsible_id
  );

  const newRevTender: Tender = applyComputedTenderFields({
    ...source,
    id: newTenderId,
    serial_no: maxSerial + 1,
    proposal_rev: nextRevNum,
    previous_revision_id: source.id,
    revision_reason: reason.trim(),
    revision_requested_by: requestedBy.trim(),
    is_latest_revision: true,
    received_date: now.slice(0, 10),
    actual_sent_date: null,
    tender_status:
      sourceComponents.length > 0
        ? 'In Progress'
        : hasSourceTeam
          ? 'Assigned'
          : 'New / Registered',
    project_status: null,
    contract_date: null,
    pr_contract_date: null,
    final_pr_contract_total_price: null,
    final_contracted_status: 'Not Contracted',
    final_contracted_status_notes: null,
    civil_assigned_at: source.responsible_civil_engineer_id ? now : null,
    mechanical_assigned_at: source.mechanical_pricing_responsible_id ? now : null,
    electrical_assigned_at: source.electrical_pricing_responsible_id ? now : null,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  });

  writeStorage(STORAGE_KEYS.TENDERS, [newRevTender, ...updatedAll]);

  const copiedComponents: ProposalComponent[] = sourceComponents.map((c) => ({
    ...c,
    id: generateUuid(),
    tender_id: newTenderId,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  }));
  writeStorage(STORAGE_KEYS.COMPONENTS, [...allComponents, ...copiedComponents]);
  for (const copied of copiedComponents) {
    if (
      copied.component_title ||
      copied.component_shape ||
      copied.each_length_m ||
      copied.each_width_m ||
      copied.each_perimeter_m ||
      (copied.sub_zones && copied.sub_zones.length > 0)
    ) {
      syncComponentExtendedMetadata(
        copied.id,
        {
          component_title: copied.component_title,
          component_shape: copied.component_shape,
          each_length_m: copied.each_length_m,
          each_width_m: copied.each_width_m,
          each_perimeter_m: copied.each_perimeter_m,
          sub_zones: copied.sub_zones,
        },
        actor.id
      );
    }
  }

  // Copy documents from source tender
  const allDocs = readStorage<TenderDocument[]>(
    STORAGE_KEYS.DOCUMENTS,
    EMPTY_DOCUMENTS
  );
  const sourceDocs = allDocs.filter((d) => d.tender_id === source.id);
  const copiedDocs: TenderDocument[] = sourceDocs.map((d) => ({
    ...d,
    id: generateUuid(),
    tender_id: newTenderId,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  }));
  writeStorage(STORAGE_KEYS.DOCUMENTS, [...allDocs, ...copiedDocs]);

  // Clone and reset discipline assignments so the team carries over cleanly into Rev + 1
  const allAssignments = getAllAssignments();
  const sourceAssignments = allAssignments.filter(
    (a) => a.tender_id === source.id
  );
  if (sourceAssignments.length > 0) {
    const copiedAssignments: TenderAssignment[] = sourceAssignments.map((a) => ({
      ...a,
      id: generateUuid(),
      tender_id: newTenderId,
      assigned_at: now,
      status: 'Assigned',
      due_date: newRevTender.expected_send_date ?? a.due_date,
      finished_note: null,
      finished_at: null,
      created_at: now,
      updated_at: now,
    }));
    writeStorage(STORAGE_KEYS.ASSIGNMENTS, [
      ...allAssignments,
      ...copiedAssignments,
    ]);
  }

  // Create Kanban task for the new revision
  const tasks = getTasks();
  const revTask: Task = {
    id: generateUuid(),
    tender_id: newTenderId,
    title: `${newRevTender.proposal_code} (Rev ${nextRevNum}) — ${newRevTender.proposal_name}`,
    kanban_status: sourceComponents.length > 0 ? 'In Progress' : 'Not Started',
    blocked_reason: null,
    due_date: newRevTender.expected_send_date ?? null,
    progress_note: `Revision ${nextRevNum}: ${reason}`,
    completed_at: null,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  };
  writeStorage(STORAGE_KEYS.TASKS, [revTask, ...tasks]);

  // Notify assigned engineers + Tender Manager + Document Control (Section 5.5)
  const recipients = [
    source.responsible_civil_engineer_id,
    source.mechanical_pricing_responsible_id,
    source.electrical_pricing_responsible_id,
    ...getProfiles()
      .filter(
        (p) =>
          p.active &&
          (hasFullTenderAuthority(p) || p.role === 'document_control')
      )
      .map((p) => p.id),
  ].filter(Boolean) as string[];

  dispatchNotification({
    recipientIds: recipients,
    type: 'new_revision',
    tender_id: newTenderId,
    proposal_code: newRevTender.proposal_code,
    title_en: `New Revision Created: ${newRevTender.proposal_code} Rev ${nextRevNum}`,
    title_ar: `تم إنشاء مراجعة جديدة: ${newRevTender.proposal_code} مراجعة ${nextRevNum}`,
    message_en: `Reason: ${reason} (Requested by: ${requestedBy}).`,
    message_ar: `السبب: ${reason} (بطلب من: ${requestedBy}).`,
  });

  recordAuditEntry({
    table_name: 'tenders',
    record_id: newTenderId,
    tender_id: newTenderId,
    actor,
    action: 'INSERT',
    old_data: null,
    new_data: newRevTender as unknown as Record<string, unknown>,
  });

  return newRevTender;
}

// =============================================================================
// 6. PROPOSAL COMPONENTS CRUD & TENDER SYNC (Section 4.2, 5.3 & Appendix A.2)
// =============================================================================

const COMPONENT_EXTENDED_META_CATEGORY = 'component_extended_meta';

function syncComponentExtendedMetadata(
  compId: string,
  meta: {
    component_title?: string | null;
    component_shape?: string | null;
    each_length_m?: number | null;
    each_width_m?: number | null;
    each_perimeter_m?: number | null;
    sub_zones?: ProposalComponent['sub_zones'];
  },
  actorId: string
): void {
  if (!compId) return;
  const cleanTitle = (meta.component_title || '').trim() || null;
  const cleanShape = (meta.component_shape || '').trim() || null;
  const cleanLen =
    meta.each_length_m !== undefined && meta.each_length_m !== null && Number(meta.each_length_m) > 0
      ? Number(meta.each_length_m)
      : null;
  const cleanWid =
    meta.each_width_m !== undefined && meta.each_width_m !== null && Number(meta.each_width_m) > 0
      ? Number(meta.each_width_m)
      : null;
  const cleanPerim =
    meta.each_perimeter_m !== undefined &&
    meta.each_perimeter_m !== null &&
    Number(meta.each_perimeter_m) > 0
      ? Number(Number(meta.each_perimeter_m).toFixed(2))
      : cleanLen && cleanWid
        ? Number((2 * (cleanLen + cleanWid)).toFixed(2))
        : null;
  const cleanZones =
    Array.isArray(meta.sub_zones) && meta.sub_zones.length > 0
      ? meta.sub_zones.map((z, idx) => {
          const area = Math.max(0, Number(z.area_m2) || 0);
          const depth = Math.max(0, Number(z.depth_m) || 0);
          return {
            id: z.id || `zone-${idx + 1}`,
            label: (z.label || `Piece ${idx + 1}`).trim(),
            area_m2: Number(area.toFixed(2)),
            depth_m: Number(depth.toFixed(2)),
            volume_m3: Number((area * depth).toFixed(2)),
          };
        })
      : null;

  const allLookups = readStorage<LookupValue[]>(
    STORAGE_KEYS.LOOKUPS,
    DEFAULT_LOOKUP_VALUES
  );
  const idx = allLookups.findIndex(
    (lv) => lv.category === COMPONENT_EXTENDED_META_CATEGORY && lv.code === compId
  );

  if (
    !cleanTitle &&
    !cleanShape &&
    cleanLen === null &&
    cleanWid === null &&
    cleanPerim === null &&
    !cleanZones
  ) {
    if (idx >= 0) {
      writeStorage(
        STORAGE_KEYS.LOOKUPS,
        allLookups.filter((_, i) => i !== idx)
      );
    }
    return;
  }

  const now = nowCairoIso();
  const payloadMeta = {
    component_title: cleanTitle,
    component_shape: cleanShape,
    each_length_m: cleanLen,
    each_width_m: cleanWid,
    each_perimeter_m: cleanPerim,
    sub_zones: cleanZones,
  } as unknown as LookupValue['metadata'];

  if (idx >= 0) {
    const next = [...allLookups];
    next[idx] = {
      ...next[idx],
      label_en: cleanTitle || compId,
      label_ar: cleanTitle || compId,
      metadata: payloadMeta,
      active: true,
      updated_by: actorId,
      updated_at: now,
    };
    writeStorage(STORAGE_KEYS.LOOKUPS, next);
  } else {
    const created: LookupValue = {
      id: generateUuid(),
      category: COMPONENT_EXTENDED_META_CATEGORY,
      code: compId,
      label_en: cleanTitle || compId,
      label_ar: cleanTitle || compId,
      color: '#1E9090',
      sort_order: 1,
      metadata: payloadMeta,
      active: true,
      created_by: actorId,
      created_at: now,
      updated_by: actorId,
      updated_at: now,
    };
    writeStorage(STORAGE_KEYS.LOOKUPS, [...allLookups, created]);
  }
}

function deleteComponentExtendedMetadata(compId: string): void {
  if (!compId) return;
  const allLookups = readStorage<LookupValue[]>(
    STORAGE_KEYS.LOOKUPS,
    DEFAULT_LOOKUP_VALUES
  );
  const filtered = allLookups.filter(
    (lv) => !(lv.category === COMPONENT_EXTENDED_META_CATEGORY && lv.code === compId)
  );
  if (filtered.length !== allLookups.length) {
    writeStorage(STORAGE_KEYS.LOOKUPS, filtered);
  }
}

export function getAllComponents(): ProposalComponent[] {
  const rawComponents = readStorage<ProposalComponent[]>(
    STORAGE_KEYS.COMPONENTS,
    EMPTY_COMPONENTS
  );
  if (rawComponents.length === 0) return rawComponents;

  const allLookups = readStorage<LookupValue[]>(
    STORAGE_KEYS.LOOKUPS,
    DEFAULT_LOOKUP_VALUES
  );
  const metaByCompId = new Map<string, Record<string, unknown>>();
  for (const lv of allLookups) {
    if (lv.category === COMPONENT_EXTENDED_META_CATEGORY && lv.code && lv.metadata) {
      metaByCompId.set(lv.code, lv.metadata as Record<string, unknown>);
    }
  }
  if (metaByCompId.size === 0) return rawComponents;

  return rawComponents.map((c) => {
    const ext = metaByCompId.get(c.id);
    if (!ext) return c;
    const effLen =
      (ext.each_length_m as number | null | undefined) ?? c.each_length_m ?? null;
    const effWid =
      (ext.each_width_m as number | null | undefined) ?? c.each_width_m ?? null;
    const rawPerim =
      (ext.each_perimeter_m as number | null | undefined) ??
      c.each_perimeter_m ??
      (effLen && effWid ? Number((2 * (effLen + effWid)).toFixed(2)) : null);
    const effQty = Math.max(1, Number(c.qty_same_specs) || 1);
    const effTotalPerim =
      rawPerim !== null ? Number((effQty * Number(rawPerim)).toFixed(2)) : null;
    return {
      ...c,
      component_title:
        (ext.component_title as string | null | undefined) ?? c.component_title ?? null,
      component_shape:
        (ext.component_shape as string | null | undefined) ?? c.component_shape ?? null,
      each_length_m: effLen,
      each_width_m: effWid,
      each_perimeter_m: rawPerim,
      total_perimeter_m: effTotalPerim,
      sub_zones:
        (ext.sub_zones as ProposalComponent['sub_zones'] | undefined) ??
        c.sub_zones ??
        null,
    };
  });
}

export function getComponentsByTender(tenderId: string): ProposalComponent[] {
  return getAllComponents()
    .filter((c) => c.tender_id === tenderId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function hasDisciplineEnteredData(
  discipline: DisciplineType,
  components: ProposalComponent[],
  tender?: Tender | null
): boolean {
  if (discipline === 'Civil/Arch') {
    return (
      components.some(
        (c) =>
          c.total_civil_cost > 0 ||
          (c.est_price_per_m2_civil ?? 0) > 0 ||
          (c.est_total_civil ?? 0) > 0
      ) || (tender?.civil_cost ?? 0) > 0
    );
  }
  if (discipline === 'Mechanical Pricing') {
    return (
      components.some(
        (c) =>
          c.total_mechanical_cost > 0 ||
          (c.est_price_per_m2_mep ?? 0) > 0 ||
          (c.est_total_mep ?? 0) > 0
      ) || (tender?.mechanical_cost ?? 0) > 0
    );
  }
  return (
    components.some((c) => c.total_electrical_cost > 0) ||
    (tender?.electrical_cost ?? 0) > 0
  );
}

export function getEffectiveDisciplineStage(
  assignment: TenderAssignment,
  components: ProposalComponent[],
  tender?: Tender | null
): 'Not Started' | 'In Progress' | 'Cancelled or Waiting' | 'Finished' {
  if (assignment.status === 'Finished') return 'Finished';
  if (assignment.status === 'Waiting') return 'Cancelled or Waiting';
  if (assignment.status === 'In Progress') return 'In Progress';
  if (hasDisciplineEnteredData(assignment.discipline, components, tender)) {
    return 'In Progress';
  }
  return 'Not Started';
}

export function getProposalStageForViewer(params: {
  task: Task;
  tender: Tender;
  assignments: TenderAssignment[];
  components: ProposalComponent[];
  perspectiveUserId?: string | null;
}): KanbanBoardStage {
  const { task, tender, assignments, components, perspectiveUserId } = params;
  const effectiveWorkUnits =
    components.length +
    (tender.civil_cost > 0 ||
    tender.mechanical_cost > 0 ||
    tender.electrical_cost > 0 ||
    tender.total_components_area_m2 > 0
      ? 1
      : 0);
  const baseStage = toKanbanBoardStage(
    task.kanban_status,
    tender.actual_sent_date ? 'Sent to Client' : tender.tender_status,
    effectiveWorkUnits
  );
  if (baseStage === 'Sent' || baseStage === 'Cancelled or Waiting') {
    return baseStage;
  }

  if (assignments.length === 0) {
    if (baseStage === 'Finished') return 'Finished';
    if (
      task.kanban_status === 'In Progress' ||
      components.length > 0 ||
      tender.civil_cost > 0 ||
      tender.mechanical_cost > 0 ||
      tender.electrical_cost > 0 ||
      tender.total_components_area_m2 > 0
    ) {
      return 'In Progress';
    }
    return 'Not Started';
  }

  if (perspectiveUserId) {
    const myAsgs = assignments.filter((a) => a.user_id === perspectiveUserId);
    if (myAsgs.length > 0) {
      const myStages = myAsgs.map((a) =>
        getEffectiveDisciplineStage(a, components, tender)
      );
      if (myStages.every((s) => s === 'Finished')) return 'Finished';
      if (myStages.some((s) => s === 'In Progress' || s === 'Finished')) {
        return 'In Progress';
      }
      if (myStages.some((s) => s === 'Cancelled or Waiting')) {
        return 'Cancelled or Waiting';
      }
      return 'Not Started';
    }
  }

  const allStages = assignments.map((a) =>
    getEffectiveDisciplineStage(a, components, tender)
  );
  if (allStages.every((s) => s === 'Finished')) return 'Finished';
  if (allStages.some((s) => s === 'In Progress' || s === 'Finished')) {
    return 'In Progress';
  }
  return 'Not Started';
}

function syncDisciplineAssignmentsFromPricing(
  tenderId: string,
  actor: ActorContext,
  startedDisciplinesHint?: DisciplineType[]
): void {
  const components = getComponentsByTender(tenderId);
  const allTenders = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
  const tIdx = allTenders.findIndex((t) => t.id === tenderId);
  if (tIdx === -1) return;
  const tender = allTenders[tIdx];
  const nowIso = nowCairoIso();

  const allAssignments = getAllAssignments();
  let assignmentsChanged = false;
  const nextAssignments = allAssignments.map((asg) => {
    if (asg.tender_id !== tenderId) return asg;
    const hasData = hasDisciplineEnteredData(asg.discipline, components, tender);
    const hinted = Boolean(startedDisciplinesHint?.includes(asg.discipline));
    if (asg.status === 'Assigned' && (hasData || hinted)) {
      assignmentsChanged = true;
      return {
        ...asg,
        status: 'In Progress' as AssignmentStatus,
        updated_at: nowIso,
      };
    }
    if (asg.status === 'In Progress' && components.length === 0 && !hasData) {
      assignmentsChanged = true;
      return {
        ...asg,
        status: 'Assigned' as AssignmentStatus,
        updated_at: nowIso,
      };
    }
    return asg;
  });

  if (assignmentsChanged) {
    writeStorage(STORAGE_KEYS.ASSIGNMENTS, nextAssignments);
  }

  const tenderAssignments = nextAssignments.filter(
    (a) => a.tender_id === tenderId
  );
  const hasAssignedTeam = Boolean(
    tender.responsible_civil_engineer_id ||
      tender.mechanical_pricing_responsible_id ||
      tender.electrical_pricing_responsible_id
  );

  let anyStarted = false;
  let allFinished = false;
  if (tenderAssignments.length > 0) {
    allFinished = tenderAssignments.every((a) => a.status === 'Finished');
    anyStarted = tenderAssignments.some(
      (a) =>
        a.status === 'In Progress' ||
        a.status === 'Finished' ||
        hasDisciplineEnteredData(a.discipline, components, tender)
    );
  } else {
    anyStarted =
      components.length > 0 ||
      tender.civil_cost > 0 ||
      tender.mechanical_cost > 0 ||
      tender.electrical_cost > 0;
  }

  const allTasks = getTasks();
  const taskIdx = allTasks.findIndex((t) => t.tender_id === tenderId);
  if (taskIdx >= 0) {
    const task = allTasks[taskIdx];
    if (
      task.kanban_status !== 'Sent' &&
      task.kanban_status !== 'Cancelled or Waiting' &&
      task.kanban_status !== 'Waiting'
    ) {
      let nextKanban: KanbanStatus = task.kanban_status;
      if (allFinished) {
        nextKanban = 'Finished';
      } else if (anyStarted) {
        nextKanban = 'In Progress';
      } else if (task.kanban_status === 'In Progress') {
        nextKanban = 'Not Started';
      }

      if (nextKanban !== task.kanban_status) {
        const nextTasks = [...allTasks];
        nextTasks[taskIdx] = {
          ...task,
          kanban_status: nextKanban,
          updated_by: actor.id,
          updated_at: nowIso,
        };
        writeStorage(STORAGE_KEYS.TASKS, nextTasks);
      }
    }
  }

  if (
    tender.tender_status !== 'Sent to Client' &&
    !tender.tender_status.toLowerCase().includes('cancel') &&
    !tender.tender_status.toLowerCase().includes('waiting') &&
    !tender.tender_status.toLowerCase().includes('hold')
  ) {
    let nextTenderStatus = tender.tender_status;
    if (allFinished) {
      nextTenderStatus = 'Finished (Ready to Send)';
    } else if (anyStarted) {
      nextTenderStatus = 'In Progress';
    } else if (tender.tender_status === 'In Progress') {
      nextTenderStatus = hasAssignedTeam ? 'Assigned' : 'New / Registered';
    }
    if (nextTenderStatus !== tender.tender_status) {
      const nextTenders = [...allTenders];
      nextTenders[tIdx] = {
        ...tender,
        tender_status: nextTenderStatus,
        updated_by: actor.id,
        updated_at: nowIso,
      };
      writeStorage(STORAGE_KEYS.TENDERS, nextTenders);
    }
  }
}

function syncTenderTotalsFromComponents(
  tenderId: string,
  actor: ActorContext,
  startedDisciplinesHint?: DisciplineType[]
): void {
  const components = getComponentsByTender(tenderId);
  const summary = summarizeTenderComponents(components);

  const allTenders = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
  const idx = allTenders.findIndex((t) => t.id === tenderId);
  if (idx === -1) return;

  const existing = allTenders[idx];
  const hadComponentsPreviously =
    existing.total_components_area_m2 > 0 || existing.components_summary !== '';
  const resetWhenEmpty = components.length === 0 && hadComponentsPreviously;
  const nowIso = nowCairoIso();

  const updated = applyComputedTenderFields({
    ...existing,
    total_components_area_m2: summary.total_components_area_m2,
    total_components_volume_m3: summary.total_components_volume_m3,
    components_summary: summary.components_summary,
    pump_room_included_in_water_features:
      components.length > 0
        ? components.some((c) => Boolean(c.pump_room_included))
        : Boolean(existing.pump_room_included_in_water_features),
    maintenance_cost:
      components.length > 0
        ? summary.maintenance_cost
        : resetWhenEmpty
          ? 0
          : existing.maintenance_cost,
    supply_cost:
      components.length > 0
        ? summary.supply_cost
        : resetWhenEmpty
          ? 0
          : existing.supply_cost,
    design_cost:
      components.length > 0
        ? summary.design_cost
        : resetWhenEmpty
          ? 0
          : existing.design_cost,
    civil_cost:
      components.length > 0
        ? summary.civil_cost
        : resetWhenEmpty
          ? 0
          : existing.civil_cost,
    mechanical_cost:
      components.length > 0
        ? summary.mechanical_cost
        : resetWhenEmpty
          ? 0
          : existing.mechanical_cost,
    electrical_cost:
      components.length > 0
        ? summary.electrical_cost
        : resetWhenEmpty
          ? 0
          : existing.electrical_cost,
    updated_by: actor.id,
    updated_at: nowIso,
  });

  const next = [...allTenders];
  next[idx] = updated;
  writeStorage(STORAGE_KEYS.TENDERS, next);

  syncDisciplineAssignmentsFromPricing(tenderId, actor, startedDisciplinesHint);

  if (updated.tender_total_price !== existing.tender_total_price) {
    const recipients = [
      updated.responsible_civil_engineer_id,
      updated.mechanical_pricing_responsible_id,
      updated.electrical_pricing_responsible_id,
      ...getProfiles()
        .filter((p) => p.role === 'tender_manager')
        .map((p) => p.id),
    ].filter(Boolean) as string[];

    dispatchNotification({
      recipientIds: recipients,
      type: 'pricing_updated',
      tender_id: updated.id,
      proposal_code: updated.proposal_code,
      title_en: `Component Pricing Updated: ${updated.proposal_code}`,
      title_ar: `تم تحديث تسعير المكونات: ${updated.proposal_code}`,
      message_en: `${actor.full_name} updated component costs on "${updated.proposal_name}" (Total: ${updated.tender_total_price.toLocaleString()} EGP).`,
      message_ar: `قام ${actor.full_name} بتحديث تكلفة المكونات في "${updated.proposal_name}".`,
    });
  }
}

export function upsertComponent(
  tenderId: string,
  input: Partial<ProposalComponent> & {
    water_feature?: string;
    water_feature_type?: string;
  },
  actor: ActorContext
): ProposalComponent {
  const assigned = isUserAssignedToTender(actor.id, tenderId);
  const actorProfile = getProfiles().find((p) => p.id === actor.id) || actor;
  if (!canEditComponents(actorProfile, assigned)) {
    throw new Error(
      `Permission denied: Role '${actor.role}' cannot edit components on this tender.`
    );
  }

  const all = getAllComponents();
  const now = nowCairoIso();
  const existingIdx = input.id ? all.findIndex((c) => c.id === input.id) : -1;
  const existing = existingIdx >= 0 ? all[existingIdx] : undefined;

  const mergedSource = existing ? { ...existing, ...input } : input;
  const effectiveWaterFeature = (
    mergedSource.water_feature || 'Swimming Pool'
  ).trim();
  const isSeparatePumpRoom =
    effectiveWaterFeature.toLowerCase().includes('pump room') ||
    effectiveWaterFeature.toLowerCase().includes('plant room') ||
    (mergedSource.water_feature_type || '').toLowerCase().includes('pump room') ||
    (mergedSource.water_feature_type || '').toLowerCase().includes('plant room');
  const effectiveWaterFeatureType =
    mergedSource.water_feature_type !== undefined &&
    (mergedSource.water_feature_type !== '' || isSeparatePumpRoom)
      ? mergedSource.water_feature_type
      : isSeparatePumpRoom
        ? ''
        : 'Skimmer';

  const computed = computeComponentFields({
    water_feature_type: effectiveWaterFeatureType,
    qty_same_specs: mergedSource.qty_same_specs,
    each_length_m: mergedSource.each_length_m,
    each_width_m: mergedSource.each_width_m,
    each_perimeter_m: mergedSource.each_perimeter_m,
    each_area_m2: mergedSource.each_area_m2,
    each_avg_depth_m: mergedSource.each_avg_depth_m,
    volume_is_manual: mergedSource.volume_is_manual,
    each_volume_m3: mergedSource.each_volume_m3,
    total_maintenance_cost: mergedSource.total_maintenance_cost,
    total_supply_cost: mergedSource.total_supply_cost,
    total_design_cost: mergedSource.total_design_cost,
    total_civil_cost: mergedSource.total_civil_cost,
    total_mechanical_cost: mergedSource.total_mechanical_cost,
    total_electrical_cost: mergedSource.total_electrical_cost,
  });

  let actorDisciplineHint: DisciplineType[] = [];
  if (isEngineerRole(actor.role)) {
    const actorAsgs = getAssignmentsByTender(tenderId).filter(
      (a) => a.user_id === actor.id
    );
    const actorEnteredOwnDisciplineCost = actorAsgs.some((a) => {
      if (a.discipline === 'Civil/Arch') {
        return (
          (Number(mergedSource.total_civil_cost) || 0) > 0 ||
          (Number(mergedSource.est_price_per_m2_civil) || 0) > 0 ||
          (Number(mergedSource.est_total_civil) || 0) > 0
        );
      }
      if (a.discipline === 'Mechanical Pricing') {
        return (
          (Number(mergedSource.total_mechanical_cost) || 0) > 0 ||
          (Number(mergedSource.est_price_per_m2_mep) || 0) > 0 ||
          (Number(mergedSource.est_total_mep) || 0) > 0
        );
      }
      return (Number(mergedSource.total_electrical_cost) || 0) > 0;
    });

    if (!actorEnteredOwnDisciplineCost && actorAsgs.length > 0) {
      const roleDisciplineMap: Partial<Record<UserRole, DisciplineType>> = {
        civil_tender_engineer: 'Civil/Arch',
        mechanical_engineer: 'Mechanical Pricing',
        electrical_engineer: 'Electrical Pricing',
      };
      const primaryDisc = roleDisciplineMap[actor.role];
      if (primaryDisc && actorAsgs.some((a) => a.discipline === primaryDisc)) {
        actorDisciplineHint = [primaryDisc];
      } else {
        actorDisciplineHint = [actorAsgs[0].discipline];
      }
    }
  }

  if (existing && existingIdx >= 0) {
    const updated: ProposalComponent = {
      ...existing,
      ...input,
      component_title:
        input.component_title !== undefined
          ? input.component_title?.trim() || null
          : existing.component_title ?? null,
      component_shape:
        input.component_shape !== undefined
          ? input.component_shape?.trim() || null
          : existing.component_shape ?? null,
      each_length_m:
        input.each_length_m !== undefined ? input.each_length_m : existing.each_length_m ?? null,
      each_width_m:
        input.each_width_m !== undefined ? input.each_width_m : existing.each_width_m ?? null,
      sub_zones:
        input.sub_zones !== undefined ? input.sub_zones : existing.sub_zones ?? null,
      water_feature: effectiveWaterFeature,
      water_feature_type: effectiveWaterFeatureType,
      ...computed,
      total_maintenance_cost: Number(mergedSource.total_maintenance_cost) || 0,
      total_supply_cost: Number(mergedSource.total_supply_cost) || 0,
      total_design_cost: Number(mergedSource.total_design_cost) || 0,
      total_civil_cost: Number(mergedSource.total_civil_cost) || 0,
      total_mechanical_cost: Number(mergedSource.total_mechanical_cost) || 0,
      total_electrical_cost: Number(mergedSource.total_electrical_cost) || 0,
      updated_by: actor.id,
      updated_at: now,
    };
    const next = [...all];
    next[existingIdx] = updated;
    writeStorage(STORAGE_KEYS.COMPONENTS, next);
    syncComponentExtendedMetadata(
      updated.id,
      {
        component_title: updated.component_title,
        component_shape: updated.component_shape,
        each_length_m: updated.each_length_m,
        each_width_m: updated.each_width_m,
        each_perimeter_m: updated.each_perimeter_m,
        sub_zones: updated.sub_zones,
      },
      actor.id
    );
    syncTenderTotalsFromComponents(tenderId, actor, actorDisciplineHint);

    recordAuditEntry({
      table_name: 'proposal_components',
      record_id: updated.id,
      tender_id: tenderId,
      actor,
      action: 'UPDATE',
      old_data: existing as unknown as Record<string, unknown>,
      new_data: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  const sameTender = all.filter((c) => c.tender_id === tenderId);
  const maxOrder = sameTender.reduce((max, c) => Math.max(max, c.sort_order), 0);
  const parentTender = getTenderById(tenderId);

  const created: ProposalComponent = {
    id: generateUuid(),
    tender_id: tenderId,
    sort_order: maxOrder + 1,
    component_title: input.component_title?.trim() || null,
    water_feature: effectiveWaterFeature,
    component_shape:
      input.component_shape !== undefined
        ? input.component_shape?.trim() || null
        : isSeparatePumpRoom
          ? 'Rectangle'
          : 'Rectangle',
    proposal_type: input.proposal_type || 'Full Turnkey (Civil + MEP)',
    water_feature_type: effectiveWaterFeatureType,
    pump_room_included: isSeparatePumpRoom
      ? false
      : input.pump_room_included !== undefined
        ? Boolean(input.pump_room_included)
        : Boolean(parentTender?.pump_room_included_in_water_features),
    filtration_method:
      input.filtration_method !== undefined &&
      (input.filtration_method !== '' || isSeparatePumpRoom)
        ? input.filtration_method
        : isSeparatePumpRoom
          ? ''
          : 'Sand Filter',
    finishing_type:
      input.finishing_type !== undefined &&
      (input.finishing_type !== '' || isSeparatePumpRoom)
        ? input.finishing_type
        : isSeparatePumpRoom
          ? ''
          : 'Mosaic',
    qty_same_specs: computed.qty_same_specs,
    each_length_m: input.each_length_m ?? null,
    each_width_m: input.each_width_m ?? null,
    each_perimeter_m: computed.each_perimeter_m,
    sub_zones: input.sub_zones ?? null,
    each_area_m2: computed.each_area_m2,
    each_avg_depth_m: computed.each_avg_depth_m,
    volume_is_manual: Boolean(input.volume_is_manual),
    each_volume_m3: computed.each_volume_m3,
    total_area_m2: computed.total_area_m2,
    total_perimeter_m: computed.total_perimeter_m,
    total_volume_m3: computed.total_volume_m3,
    currency: 'EGP',
    total_maintenance_cost: Number(input.total_maintenance_cost) || 0,
    total_supply_cost: Number(input.total_supply_cost) || 0,
    total_design_cost: Number(input.total_design_cost) || 0,
    total_civil_cost: Number(input.total_civil_cost) || 0,
    total_mechanical_cost: Number(input.total_mechanical_cost) || 0,
    total_electrical_cost: Number(input.total_electrical_cost) || 0,
    total_price: computed.total_price,
    est_price_per_m2_full_scope: input.est_price_per_m2_full_scope ?? null,
    est_cost_full_scope: input.est_cost_full_scope ?? null,
    est_price_per_m2_civil: input.est_price_per_m2_civil ?? null,
    est_total_civil: input.est_total_civil ?? null,
    est_price_per_m2_mep: input.est_price_per_m2_mep ?? null,
    est_total_mep: input.est_total_mep ?? null,
    est_total_tender: input.est_total_tender ?? null,
    avg_cost_per_m2: computed.avg_cost_per_m2,
    avg_cost_per_m3: computed.avg_cost_per_m3,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  };

  writeStorage(STORAGE_KEYS.COMPONENTS, [...all, created]);
  syncComponentExtendedMetadata(
    created.id,
    {
      component_title: created.component_title,
      component_shape: created.component_shape,
      each_length_m: created.each_length_m,
      each_width_m: created.each_width_m,
      each_perimeter_m: created.each_perimeter_m,
      sub_zones: created.sub_zones,
    },
    actor.id
  );
  syncTenderTotalsFromComponents(tenderId, actor, actorDisciplineHint);

  if (parentTender && computed.total_price === 0) {
    const recipients = [
      parentTender.responsible_civil_engineer_id,
      parentTender.mechanical_pricing_responsible_id,
      parentTender.electrical_pricing_responsible_id,
      ...getProfiles()
        .filter((p) => p.role === 'tender_manager')
        .map((p) => p.id),
    ].filter((uid): uid is string => Boolean(uid && uid !== actor.id));

    if (recipients.length > 0) {
      dispatchNotification({
        recipientIds: recipients,
        type: 'pricing_updated',
        tender_id: parentTender.id,
        proposal_code: parentTender.proposal_code,
        title_en: `Water Feature Added: ${parentTender.proposal_code}`,
        title_ar: `تمت إضافة مكون مائي: ${parentTender.proposal_code}`,
        message_en: `${actor.full_name} added "${created.water_feature}" on "${parentTender.proposal_name}" — ready for discipline pricing.`,
        message_ar: `قام ${actor.full_name} بإضافة "${created.water_feature}" في "${parentTender.proposal_name}" لتسعير التخصصات.`,
      });
    }
  }

  recordAuditEntry({
    table_name: 'proposal_components',
    record_id: created.id,
    tender_id: tenderId,
    actor,
    action: 'INSERT',
    old_data: null,
    new_data: created as unknown as Record<string, unknown>,
  });

  return created;
}

export function duplicateComponent(
  componentId: string,
  actor: ActorContext
): ProposalComponent {
  const existing = getAllComponents().find((c) => c.id === componentId);
  if (!existing) {
    throw new Error('Component not found');
  }
  const { id: _ignoreId, ...rest } = existing;
  const baseTitle = (existing.component_title || existing.water_feature || 'Component').trim();
  return upsertComponent(
    existing.tender_id,
    {
      ...rest,
      component_title: `${baseTitle} (Copy)`,
      water_feature: existing.water_feature,
    },
    actor
  );
}

export function deleteComponent(componentId: string, actor: ActorContext): void {
  const all = getAllComponents();
  const target = all.find((c) => c.id === componentId);
  if (!target) return;

  const assigned = isUserAssignedToTender(actor.id, target.tender_id);
  const actorProfile = getProfiles().find((p) => p.id === actor.id) || actor;
  if (!canEditComponents(actorProfile, assigned)) {
    throw new Error('Permission denied');
  }

  writeStorage(
    STORAGE_KEYS.COMPONENTS,
    all.filter((c) => c.id !== componentId)
  );
  deleteComponentExtendedMetadata(componentId);
  syncTenderTotalsFromComponents(target.tender_id, actor);

  recordAuditEntry({
    table_name: 'proposal_components',
    record_id: componentId,
    tender_id: target.tender_id,
    actor,
    action: 'DELETE',
    old_data: target as unknown as Record<string, unknown>,
    new_data: null,
  });
}

export function setTenderPumpRoomIncluded(
  tenderId: string,
  included: boolean,
  actor: ActorContext
): void {
  const assigned = isUserAssignedToTender(actor.id, tenderId);
  const actorProfile = getProfiles().find((p) => p.id === actor.id) || actor;
  if (!canEditComponents(actorProfile, assigned)) {
    throw new Error(
      `Permission denied: Role '${actor.role}' cannot update component settings on this tender.`
    );
  }

  const now = nowCairoIso();
  const allComps = getAllComponents();
  let updatedAnyComp = false;
  const nextComps = allComps.map((c) => {
    if (c.tender_id !== tenderId) return c;
    const isSeparatePumpRoom =
      c.water_feature.toLowerCase().includes('pump room') ||
      c.water_feature.toLowerCase().includes('plant room') ||
      c.water_feature_type.toLowerCase().includes('pump room') ||
      c.water_feature_type.toLowerCase().includes('plant room');
    const nextVal = isSeparatePumpRoom ? false : included;
    if (Boolean(c.pump_room_included) !== nextVal) {
      updatedAnyComp = true;
      return {
        ...c,
        pump_room_included: nextVal,
        updated_by: actor.id,
        updated_at: now,
      };
    }
    return c;
  });

  if (updatedAnyComp) {
    writeStorage(STORAGE_KEYS.COMPONENTS, nextComps);
  }

  const tenderComps = nextComps.filter((c) => c.tender_id === tenderId);
  const summary = summarizeTenderComponents(tenderComps);
  const allTenders = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
  const idx = allTenders.findIndex((t) => t.id === tenderId);
  if (idx >= 0) {
    const existing = allTenders[idx];
    const nextTenders = [...allTenders];
    nextTenders[idx] = {
      ...existing,
      pump_room_included_in_water_features: included,
      components_summary:
        tenderComps.length > 0
          ? summary.components_summary
          : existing.components_summary,
      updated_by: actor.id,
      updated_at: now,
    };
    writeStorage(STORAGE_KEYS.TENDERS, nextTenders);
  }
}

// =============================================================================
// 7. TENDER DOCUMENTS — SERVER PATHS ONLY (Section 5.2)
// =============================================================================

export function getDocumentsByTender(tenderId: string): TenderDocument[] {
  return readStorage<TenderDocument[]>(
    STORAGE_KEYS.DOCUMENTS,
    EMPTY_DOCUMENTS
  ).filter((d) => d.tender_id === tenderId);
}

export function addTenderDocument(
  tenderId: string,
  input: {
    file_name: string;
    doc_type: string;
    server_path: string;
    version?: string;
    notes?: string;
  },
  actor: ActorContext
): { doc: TenderDocument; isDuplicatePath: boolean } {
  if (!canManageDocuments(actor.role)) {
    throw new Error('Permission denied: Only Document Control or an App Admin can add document paths.');
  }

  const cleanPath = input.server_path.trim();
  if (!cleanPath) {
    throw new Error('Server path or URL cannot be empty.');
  }

  const all = readStorage<TenderDocument[]>(
    STORAGE_KEYS.DOCUMENTS,
    EMPTY_DOCUMENTS
  );
  const isDuplicatePath = all.some(
    (d) =>
      d.tender_id === tenderId &&
      d.server_path.trim().toLowerCase() === cleanPath.toLowerCase()
  );

  const now = nowCairoIso();
  const doc: TenderDocument = {
    id: generateUuid(),
    tender_id: tenderId,
    file_name: input.file_name.trim(),
    doc_type: input.doc_type || 'RFP',
    server_path: cleanPath,
    version: input.version?.trim() || 'v1.0',
    notes: input.notes?.trim() || null,
    uploaded_by: actor.id,
    uploaded_at: now,
    created_by: actor.id,
    created_at: now,
    updated_by: actor.id,
    updated_at: now,
  };

  writeStorage(STORAGE_KEYS.DOCUMENTS, [doc, ...all]);

  const tender = getTenderById(tenderId);
  if (tender) {
    const recipients = [
      tender.responsible_civil_engineer_id,
      tender.mechanical_pricing_responsible_id,
      tender.electrical_pricing_responsible_id,
      ...getProfiles()
        .filter((p) => p.role === 'tender_manager')
        .map((p) => p.id),
    ].filter(Boolean) as string[];

    dispatchNotification({
      recipientIds: recipients,
      type: 'new_documents',
      tender_id: tenderId,
      proposal_code: tender.proposal_code,
      title_en: `New Document Path Added: ${tender.proposal_code}`,
      title_ar: `تم إضافة مسار مستندات جديد: ${tender.proposal_code}`,
      message_en: `${actor.full_name} linked ${doc.doc_type} "${doc.file_name}" (${doc.version}).`,
      message_ar: `قام ${actor.full_name} بإضافة مسار ${doc.doc_type} "${doc.file_name}".`,
    });
  }

  recordAuditEntry({
    table_name: 'tender_documents',
    record_id: doc.id,
    tender_id: tenderId,
    actor,
    action: 'INSERT',
    old_data: null,
    new_data: doc as unknown as Record<string, unknown>,
  });

  return { doc, isDuplicatePath };
}

// =============================================================================
// 8. ASSIGNMENTS, KANBAN TASKS & COMMENTS (Section 5.4)
// =============================================================================

export function getAllAssignments(): TenderAssignment[] {
  const raw = readStorage<TenderAssignment[]>(
    STORAGE_KEYS.ASSIGNMENTS,
    EMPTY_ASSIGNMENTS
  );
  const cleaned = raw.filter((a) => (a.discipline as string) !== 'MEP');
  if (cleaned.length !== raw.length) {
    persistCacheOnly(STORAGE_KEYS.ASSIGNMENTS, cleaned);
  }

  // Reconcile any direct engineer fields on `tenders` so Kanban & Workload always display assigned engineers
  const tenders = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
  const byTenderAndDisc = new Set(
    cleaned.map((a) => `${a.tender_id}::${a.discipline}`)
  );
  const derived: TenderAssignment[] = [];

  for (const t of tenders) {
    const pairs: Array<{
      disc: DisciplineType;
      uid?: string | null;
      at?: string | null;
    }> = [
      {
        disc: 'Civil/Arch',
        uid: t.responsible_civil_engineer_id,
        at: t.civil_assigned_at,
      },
      {
        disc: 'Mechanical Pricing',
        uid: t.mechanical_pricing_responsible_id,
        at: t.mechanical_assigned_at,
      },
      {
        disc: 'Electrical Pricing',
        uid: t.electrical_pricing_responsible_id,
        at: t.electrical_assigned_at,
      },
    ];
    for (const p of pairs) {
      if (!p.uid) continue;
      const key = `${t.id}::${p.disc}`;
      if (byTenderAndDisc.has(key)) continue;
      byTenderAndDisc.add(key);
      const isSentOrDone =
        Boolean(t.actual_sent_date) ||
        t.tender_status === 'Sent to Client' ||
        t.tender_status.startsWith('Finished');
      derived.push({
        id: `derived-${t.id}-${p.disc.replace(/[^a-zA-Z]/g, '')}`,
        tender_id: t.id,
        user_id: p.uid,
        discipline: p.disc,
        assigned_by: t.updated_by || t.created_by || null,
        assigned_at: p.at || t.created_at,
        due_date: t.expected_send_date || null,
        status: isSentOrDone ? 'Finished' : 'Assigned',
        finished_note: null,
        finished_at: isSentOrDone ? t.updated_at : null,
        created_at: p.at || t.created_at,
        updated_at: t.updated_at,
      });
    }
  }

  return derived.length > 0 ? [...cleaned, ...derived] : cleaned;
}

export function getAssignmentsByTender(tenderId: string): TenderAssignment[] {
  return getAllAssignments().filter((a) => a.tender_id === tenderId);
}

/**
 * Resolves the ISO date/timestamp when an engineer was assigned to a specific discipline
 * on `tender`. Returns `null` when that discipline is unassigned.
 */
export function getEngineerAssignedDate(
  tender: Tender,
  discipline: DisciplineType,
  assignments?: TenderAssignment[]
): string | null {
  const engineerId =
    discipline === 'Civil/Arch'
      ? tender.responsible_civil_engineer_id
      : discipline === 'Mechanical Pricing'
        ? tender.mechanical_pricing_responsible_id
        : tender.electrical_pricing_responsible_id;

  if (!engineerId) return null;

  const directDate =
    discipline === 'Civil/Arch'
      ? tender.civil_assigned_at
      : discipline === 'Mechanical Pricing'
        ? tender.mechanical_assigned_at
        : tender.electrical_assigned_at;

  if (directDate) return directDate;

  const list = assignments ?? getAssignmentsByTender(tender.id);
  const matching = list.find(
    (a) => a.discipline === discipline && a.user_id === engineerId
  );
  if (matching) {
    return matching.assigned_at || matching.created_at;
  }

  return tender.received_date || null;
}

export function getTasks(): Task[] {
  return readStorage<Task[]>(STORAGE_KEYS.TASKS, EMPTY_TASKS);
}

export function getTaskByTender(tenderId: string): Task | undefined {
  return getTasks().find((t) => t.tender_id === tenderId);
}

/**
 * Normalizes any stored KanbanStatus (including legacy 'New', 'Assigned', 'Waiting')
 * and optional parent tender_status / componentCount into one of the 5 canonical Kanban Board stages:
 * 'Not Started' | 'In Progress' | 'Cancelled or Waiting' | 'Finished' | 'Sent'.
 */
export function toKanbanBoardStage(
  status: KanbanStatus,
  tenderStatus?: string | null,
  componentCount?: number
): KanbanBoardStage {
  if (status === 'Sent') return 'Sent';
  if (status === 'Finished') return 'Finished';
  if (status === 'Cancelled or Waiting' || status === 'Waiting') {
    return 'Cancelled or Waiting';
  }
  if (status === 'In Progress') {
    if (componentCount !== undefined && componentCount === 0) {
      return 'Not Started';
    }
    return 'In Progress';
  }
  if (status === 'Not Started') {
    if (componentCount !== undefined && componentCount > 0) {
      return 'In Progress';
    }
    return 'Not Started';
  }

  if (tenderStatus) {
    const ts = tenderStatus.toLowerCase();
    if (ts.includes('sent')) return 'Sent';
    if (ts.startsWith('finished')) return 'Finished';
    if (
      ts.includes('cancel') ||
      ts.includes('apologiz') ||
      ts.includes('waiting') ||
      ts.includes('blocked') ||
      ts.includes('hold')
    ) {
      return 'Cancelled or Waiting';
    }
    if (ts === 'in progress') {
      return componentCount !== undefined && componentCount === 0
        ? 'Not Started'
        : 'In Progress';
    }
  }

  if (componentCount !== undefined && componentCount > 0) {
    return 'In Progress';
  }

  return 'Not Started';
}

/**
 * Section 5.4:
 * Tender Manager assigns Civil/Arch, Mechanical Pricing, and Electrical Pricing
 * responsible engineers and sets due date. Updates tender, creates discipline checklist
 * rows, moves Kanban card from New -> Assigned, and notifies each engineer.
 */
export function assignEngineersToTender(
  tenderId: string,
  assignmentsMap: Partial<Record<DisciplineType, string>>,
  dueDate: string | null,
  actor: ActorContext
): void {
  const allProfiles = getProfiles();
  const actorProfile = allProfiles.find((p) => p.id === actor.id) || actor;
  if (!canAssignEngineers(actorProfile)) {
    throw new Error('Permission denied: Only Tender Manager or authorized Kanban Lead can assign engineers.');
  }

  const tender = getTenderById(tenderId);
  if (!tender) throw new Error('Tender not found');

  for (const [, uid] of Object.entries(assignmentsMap)) {
    if (!uid) continue;
    const assignedProfile = allProfiles.find((p) => p.id === uid);
    if (!assignedProfile || !isAssignableEngineerOrManager(assignedProfile)) {
      throw new Error(
        'Permission denied: Selected user does not have engineering discipline permissions.'
      );
    }
  }

  const now = nowCairoIso();
  const prevAssignments = getAssignmentsByTender(tenderId);

  const nextCivilId =
    assignmentsMap['Civil/Arch'] !== undefined
      ? assignmentsMap['Civil/Arch'] || null
      : tender.responsible_civil_engineer_id || null;
  const nextMechId =
    assignmentsMap['Mechanical Pricing'] !== undefined
      ? assignmentsMap['Mechanical Pricing'] || null
      : tender.mechanical_pricing_responsible_id || null;
  const nextElecId =
    assignmentsMap['Electrical Pricing'] !== undefined
      ? assignmentsMap['Electrical Pricing'] || null
      : tender.electrical_pricing_responsible_id || null;

  const resolveAssignedTimestamp = (
    nextId: string | null,
    prevId: string | null | undefined,
    prevDate: string | null | undefined,
    disc: DisciplineType
  ): string | null => {
    if (!nextId) return null;
    if (nextId !== prevId) return now;
    if (prevDate) return prevDate;
    const existingAsg = prevAssignments.find(
      (a) => a.discipline === disc && a.user_id === nextId
    );
    return existingAsg?.assigned_at || existingAsg?.created_at || now;
  };

  updateTender(
    tenderId,
    {
      responsible_civil_engineer_id: nextCivilId,
      civil_assigned_at: resolveAssignedTimestamp(
        nextCivilId,
        tender.responsible_civil_engineer_id,
        tender.civil_assigned_at,
        'Civil/Arch'
      ),
      mechanical_pricing_responsible_id: nextMechId,
      mechanical_assigned_at: resolveAssignedTimestamp(
        nextMechId,
        tender.mechanical_pricing_responsible_id,
        tender.mechanical_assigned_at,
        'Mechanical Pricing'
      ),
      electrical_pricing_responsible_id: nextElecId,
      electrical_assigned_at: resolveAssignedTimestamp(
        nextElecId,
        tender.electrical_pricing_responsible_id,
        tender.electrical_assigned_at,
        'Electrical Pricing'
      ),
      expected_send_date: dueDate || tender.expected_send_date,
      tender_status:
        tender.tender_status === 'New / Registered'
          ? 'Assigned'
          : tender.tender_status,
    },
    actor
  );

  const allAssignments = getAllAssignments().filter(
    (a) => a.tender_id !== tenderId
  );
  const effectiveMap: Record<DisciplineType, string | null> = {
    'Civil/Arch': nextCivilId,
    'Mechanical Pricing': nextMechId,
    'Electrical Pricing': nextElecId,
  };
  const disciplines: DisciplineType[] = [
    'Civil/Arch',
    'Mechanical Pricing',
    'Electrical Pricing',
  ];

  const createdAssignments: TenderAssignment[] = [];
  const recipientIds: string[] = [];

  for (const disc of disciplines) {
    const uid = effectiveMap[disc];
    if (!uid) continue;
    recipientIds.push(uid);

    const existingForDisc = prevAssignments.find((a) => a.discipline === disc);
    const sameEngineer = Boolean(
      existingForDisc && existingForDisc.user_id === uid
    );

    createdAssignments.push({
      id:
        sameEngineer && existingForDisc
          ? existingForDisc.id
          : generateUuid(),
      tender_id: tenderId,
      user_id: uid,
      discipline: disc,
      assigned_by: actor.id,
      assigned_at:
        sameEngineer && existingForDisc
          ? existingForDisc.assigned_at || existingForDisc.created_at
          : now,
      due_date: dueDate || tender.expected_send_date || null,
      status: sameEngineer && existingForDisc ? existingForDisc.status : 'Assigned',
      finished_note:
        sameEngineer && existingForDisc ? existingForDisc.finished_note || null : null,
      finished_at:
        sameEngineer && existingForDisc ? existingForDisc.finished_at || null : null,
      created_at:
        sameEngineer && existingForDisc ? existingForDisc.created_at : now,
      updated_at: now,
    });
  }

  writeStorage(STORAGE_KEYS.ASSIGNMENTS, [
    ...allAssignments,
    ...createdAssignments,
  ]);

  // Ensure Kanban card exists and moves from New -> Assigned
  const allTasks = getTasks();
  const existingTaskIdx = allTasks.findIndex((t) => t.tender_id === tenderId);
  if (existingTaskIdx >= 0) {
    const task = allTasks[existingTaskIdx];
    const nextStatus: KanbanStatus =
      task.kanban_status === 'New' ? 'Assigned' : task.kanban_status;
    allTasks[existingTaskIdx] = {
      ...task,
      kanban_status: nextStatus,
      due_date: dueDate || task.due_date,
      updated_by: actor.id,
      updated_at: now,
    };
    writeStorage(STORAGE_KEYS.TASKS, [...allTasks]);
  } else {
    const newTask: Task = {
      id: generateUuid(),
      tender_id: tenderId,
      title: `${tender.proposal_code} — ${tender.proposal_name}`,
      kanban_status: createdAssignments.length > 0 ? 'Assigned' : 'Not Started',
      blocked_reason: null,
      due_date: dueDate || tender.expected_send_date || null,
      progress_note: tender.tender_status_notes || null,
      completed_at: tender.actual_sent_date || null,
      created_by: tender.created_by || actor.id,
      created_at: tender.created_at || now,
      updated_by: actor.id,
      updated_at: now,
    };
    writeStorage(STORAGE_KEYS.TASKS, [...allTasks, newTask]);
  }

  dispatchNotification({
    recipientIds,
    type: 'tender_assigned',
    tender_id: tenderId,
    proposal_code: tender.proposal_code,
    title_en: `Tender Assigned to You: ${tender.proposal_code}`,
    title_ar: `تم إسناد مناقصة إليك: ${tender.proposal_code}`,
    message_en: `${actor.full_name} assigned you to "${tender.proposal_name}" (Due: ${toDdMmYyyy(dueDate || tender.expected_send_date)}).`,
    message_ar: `قام ${actor.full_name} بإسناد المناقصة "${tender.proposal_name}" إليك (تاريخ الاستحقاق: ${toDdMmYyyy(dueDate || tender.expected_send_date)}).`,
  });
}

/**
 * Section 5.4:
 * Each engineer ticks their own discipline part with a note, and the card
 * moves to Finished automatically when all assigned parts are done!
 */
export function updateDisciplineAssignmentStatus(
  assignmentId: string,
  status: AssignmentStatus,
  note: string,
  actor: ActorContext
): void {
  const all = getAllAssignments();
  const idx = all.findIndex((a) => a.id === assignmentId);
  if (idx === -1) throw new Error('Assignment not found');

  const target = all[idx];
  const actorProfile = getProfiles().find((p) => p.id === actor.id) || actor;
  if (!hasFullTenderAuthority(actorProfile) && target.user_id !== actor.id) {
    throw new Error('Permission denied: You can only update your own discipline part.');
  }

  const now = nowCairoIso();
  const updated: TenderAssignment = {
    ...target,
    id: target.id.startsWith('derived-') ? generateUuid() : target.id,
    status,
    finished_note: note.trim() || target.finished_note,
    finished_at: status === 'Finished' ? now : null,
    updated_at: now,
  };

  const persistedNext = all.map((a, i) =>
    i === idx
      ? updated
      : a.id.startsWith('derived-')
        ? { ...a, id: generateUuid() }
        : a
  );
  writeStorage(STORAGE_KEYS.ASSIGNMENTS, persistedNext);

  // Check if all disciplines on this tender are now Finished
  const tenderAssignments = persistedNext.filter(
    (a) => a.tender_id === target.tender_id
  );
  const allFinished =
    tenderAssignments.length > 0 &&
    tenderAssignments.every((a) => a.status === 'Finished');

  const allTasks = getTasks();
  const taskIdx = allTasks.findIndex((t) => t.tender_id === target.tender_id);
  const tender = getTenderById(target.tender_id);

  if (taskIdx >= 0) {
    const task = allTasks[taskIdx];
    let nextKanban: KanbanStatus = task.kanban_status;
    if (allFinished && task.kanban_status !== 'Sent') {
      nextKanban = 'Finished';
    } else if (
      status === 'In Progress' &&
      (task.kanban_status === 'Assigned' ||
        task.kanban_status === 'New' ||
        task.kanban_status === 'Not Started' ||
        task.kanban_status === 'Finished')
    ) {
      nextKanban = 'In Progress';
    } else if (status === 'Waiting' && task.kanban_status !== 'Sent') {
      nextKanban = 'Cancelled or Waiting';
    }

    allTasks[taskIdx] = {
      ...task,
      kanban_status: nextKanban,
      progress_note: note.trim() || task.progress_note,
      completed_at: allFinished ? now : task.completed_at,
      updated_by: actor.id,
      updated_at: now,
    };
    writeStorage(STORAGE_KEYS.TASKS, [...allTasks]);

    // Sync parent tender status with Kanban progress so Master Tender Log stays accurate
    const rawTenders = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
    const tIdx = rawTenders.findIndex((t) => t.id === target.tender_id);
    if (tIdx >= 0 && rawTenders[tIdx].tender_status !== 'Sent to Client') {
      let nextTenderStatus = rawTenders[tIdx].tender_status;
      if (allFinished) {
        nextTenderStatus = 'Finished (Ready to Send)';
      } else if (status === 'Waiting') {
        nextTenderStatus = 'Waiting for Info / Blocked';
      } else if (
        status === 'In Progress' &&
        (nextTenderStatus === 'Assigned' ||
          nextTenderStatus === 'New / Registered' ||
          nextTenderStatus.startsWith('Finished'))
      ) {
        nextTenderStatus = 'In Progress';
      }

      if (nextTenderStatus !== rawTenders[tIdx].tender_status) {
        const oldTender = rawTenders[tIdx];
        const updatedTender: Tender = {
          ...oldTender,
          tender_status: nextTenderStatus,
          updated_by: actor.id,
          updated_at: now,
        };
        const nextTenders = [...rawTenders];
        nextTenders[tIdx] = updatedTender;
        writeStorage(STORAGE_KEYS.TENDERS, nextTenders);

        recordAuditEntry({
          table_name: 'tenders',
          record_id: updatedTender.id,
          tender_id: updatedTender.id,
          actor,
          action: 'UPDATE',
          old_data: oldTender as unknown as Record<string, unknown>,
          new_data: updatedTender as unknown as Record<string, unknown>,
        });
      }
    }

    if (allFinished && tender) {
      const managers = getProfiles()
        .filter((p) => hasFullTenderAuthority(p))
        .map((p) => p.id);
      dispatchNotification({
        recipientIds: managers,
        type: 'task_finished',
        tender_id: tender.id,
        proposal_code: tender.proposal_code,
        title_en: `All Disciplines Finished: ${tender.proposal_code}`,
        title_ar: `اكتملت جميع التخصصات: ${tender.proposal_code}`,
        message_en: `${actor.full_name} completed ${target.discipline}. All disciplines are done and ready for Tender Manager review.`,
        message_ar: `أنهى ${actor.full_name} جزء ${target.discipline}. جميع الأجزاء مكتملة وجاهزة للإرسال.`,
      });
    }
  }
}

export function moveKanbanTask(
  taskId: string,
  toStatus: KanbanStatus,
  options: { blockedReason?: string; progressNote?: string; isCancelled?: boolean },
  actor: ActorContext
): Task {
  const allTasks = getTasks();
  let idx = allTasks.findIndex((t) => t.id === taskId);
  if (idx === -1 && taskId.startsWith('virtual-')) {
    const virtualTenderId = taskId.slice('virtual-'.length);
    const virtualTender = getTenderById(virtualTenderId);
    if (virtualTender) {
      const materialized: Task = {
        id: generateUuid(),
        tender_id: virtualTender.id,
        title: `${virtualTender.proposal_code} — ${virtualTender.proposal_name}`,
        kanban_status: toKanbanBoardStage('New', virtualTender.tender_status),
        blocked_reason: null,
        due_date: virtualTender.expected_send_date ?? null,
        progress_note: virtualTender.tender_status_notes || null,
        completed_at: virtualTender.actual_sent_date ?? null,
        created_by: virtualTender.created_by ?? actor.id,
        created_at: virtualTender.created_at,
        updated_by: actor.id,
        updated_at: virtualTender.updated_at,
      };
      allTasks.push(materialized);
      idx = allTasks.length - 1;
    }
  }
  if (idx === -1) throw new Error('Task card not found');

  const task = allTasks[idx];
  const assigned = isUserAssignedToTender(actor.id, task.tender_id);
  const tenderAssignments = getAssignmentsByTender(task.tender_id);
  const allAssignmentsFinished =
    tenderAssignments.length > 0 &&
    tenderAssignments.every((a) => a.status === 'Finished');
  const effectiveFromStatus: KanbanStatus =
    toStatus === 'Sent' &&
    allAssignmentsFinished &&
    task.kanban_status !== 'Cancelled or Waiting' &&
    task.kanban_status !== 'Waiting'
      ? 'Finished'
      : task.kanban_status;

  const actorProfile = getProfiles().find((p) => p.id === actor.id) || actor;

  if (
    toStatus === 'Sent' &&
    !hasFullTenderAuthority(actorProfile) &&
    tenderAssignments.length > 0 &&
    !allAssignmentsFinished
  ) {
    throw new Error(
      'Permission denied: All assigned disciplines must be marked Finished before confirming Sent.'
    );
  }

  if (!canMoveKanbanCard(actorProfile, effectiveFromStatus, toStatus, assigned)) {
    throw new Error(
      `Permission denied: Role '${actor.role}' cannot move card to '${toStatus}'.`
    );
  }

  const isWaitingOrCancelled =
    toStatus === 'Waiting' || toStatus === 'Cancelled or Waiting';

  if (isWaitingOrCancelled && !options.blockedReason?.trim()) {
    throw new Error(
      'A reason is required when moving a tender to Cancelled or Waiting.'
    );
  }

  const now = nowCairoIso();
  const isFullManager = hasFullTenderAuthority(actorProfile);
  let resolvedTaskStatus: KanbanStatus = toStatus;

  if (tenderAssignments.length > 0) {
    const rawAssignments = readStorage<TenderAssignment[]>(
      STORAGE_KEYS.ASSIGNMENTS,
      EMPTY_ASSIGNMENTS
    );
    const nextAssignments = [...rawAssignments];
    let assignmentsMutated = false;

    for (const asg of tenderAssignments) {
      let aIdx = nextAssignments.findIndex((r) => r.id === asg.id);
      if (aIdx === -1 && asg.id.startsWith('derived-')) {
        aIdx = nextAssignments.findIndex(
          (r) => r.tender_id === asg.tender_id && r.discipline === asg.discipline
        );
        if (aIdx === -1) {
          nextAssignments.push({ ...asg, id: generateUuid() });
          aIdx = nextAssignments.length - 1;
          assignmentsMutated = true;
        }
      }
      if (aIdx === -1) continue;

      const row = nextAssignments[aIdx];
      const isTargetRow = isFullManager || row.user_id === actor.id;

      if (toStatus === 'In Progress' && isTargetRow) {
        if (row.status === 'Assigned' || row.status === 'Waiting') {
          nextAssignments[aIdx] = {
            ...row,
            status: 'In Progress',
            updated_at: now,
          };
          assignmentsMutated = true;
        }
      } else if (toStatus === 'Finished' && isTargetRow) {
        if (row.status !== 'Finished') {
          nextAssignments[aIdx] = {
            ...row,
            status: 'Finished',
            finished_at: row.finished_at || now,
            finished_note:
              row.finished_note || `Completed by ${actor.full_name}`,
            updated_at: now,
          };
          assignmentsMutated = true;
        }
      } else if (toStatus === 'Not Started' && isTargetRow) {
        if (row.status !== 'Assigned') {
          nextAssignments[aIdx] = {
            ...row,
            status: 'Assigned',
            finished_at: null,
            updated_at: now,
          };
          assignmentsMutated = true;
        }
      } else if (toStatus === 'Sent' && isFullManager) {
        if (row.status !== 'Finished') {
          nextAssignments[aIdx] = {
            ...row,
            status: 'Finished',
            finished_at: row.finished_at || now,
            updated_at: now,
          };
          assignmentsMutated = true;
        }
      }
    }

    if (assignmentsMutated) {
      writeStorage(STORAGE_KEYS.ASSIGNMENTS, nextAssignments);
    }

    if (toStatus === 'Finished' && !isFullManager) {
      const updatedTenderAsgs = nextAssignments.filter(
        (r) => r.tender_id === task.tender_id
      );
      const everyoneFinished =
        updatedTenderAsgs.length > 0 &&
        updatedTenderAsgs.every((r) => r.status === 'Finished');
      if (!everyoneFinished) {
        resolvedTaskStatus = 'In Progress';
      }
    }
  }

  const updatedTask: Task = {
    ...task,
    kanban_status: resolvedTaskStatus,
    blocked_reason: isWaitingOrCancelled
      ? options.blockedReason?.trim() || null
      : null,
    progress_note: options.progressNote?.trim() || task.progress_note,
    completed_at:
      resolvedTaskStatus === 'Finished' || resolvedTaskStatus === 'Sent'
        ? now
        : task.completed_at,
    updated_by: actor.id,
    updated_at: now,
  };

  const nextTasks = [...allTasks];
  nextTasks[idx] = updatedTask;
  writeStorage(STORAGE_KEYS.TASKS, nextTasks);

  // Sync Tender status & Sent Date when moved across Kanban columns
  const tender = getTenderById(task.tender_id);
  if (tender) {
    const hasAssignedTeam = Boolean(
      tender.responsible_civil_engineer_id ||
        tender.mechanical_pricing_responsible_id ||
        tender.electrical_pricing_responsible_id
    );
    const statusMap: Record<KanbanStatus, string> = {
      'Not Started': hasAssignedTeam ? 'Assigned' : 'New / Registered',
      New: 'New / Registered',
      Assigned: 'Assigned',
      'In Progress': 'In Progress',
      'Cancelled or Waiting': options.isCancelled
        ? 'Cancelled / Apologized'
        : 'Waiting for Info / Blocked',
      Waiting: 'Waiting for Info / Blocked',
      Finished: 'Finished (Ready to Send)',
      Sent: 'Sent to Client',
    };

    const allTenders = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
    const tIdx = allTenders.findIndex((t) => t.id === tender.id);
    if (tIdx >= 0) {
      const updatedTender = applyComputedTenderFields({
        ...allTenders[tIdx],
        tender_status: statusMap[resolvedTaskStatus],
        tender_status_notes: isWaitingOrCancelled
          ? options.blockedReason?.trim() || allTenders[tIdx].tender_status_notes
          : allTenders[tIdx].tender_status_notes,
        actual_sent_date:
          resolvedTaskStatus === 'Sent' && !allTenders[tIdx].actual_sent_date
            ? now.slice(0, 10)
            : allTenders[tIdx].actual_sent_date,
        updated_by: actor.id,
        updated_at: now,
      });
      allTenders[tIdx] = updatedTender;
      writeStorage(STORAGE_KEYS.TENDERS, [...allTenders]);
    }

    const managers = getProfiles()
      .filter((p) => hasFullTenderAuthority(p))
      .map((p) => p.id);

    if (toStatus === 'Finished' || isWaitingOrCancelled) {
      dispatchNotification({
        recipientIds: managers,
        type: toStatus === 'Finished' ? 'task_finished' : 'task_blocked',
        tender_id: tender.id,
        proposal_code: tender.proposal_code,
        title_en:
          toStatus === 'Finished'
            ? `Task Marked Finished: ${tender.proposal_code}`
            : options.isCancelled
              ? `Tender Cancelled: ${tender.proposal_code}`
              : `Task Cancelled or Waiting: ${tender.proposal_code}`,
        title_ar:
          toStatus === 'Finished'
            ? `تم إنهاء المهمة: ${tender.proposal_code}`
            : options.isCancelled
              ? `تم إلغاء المناقصة: ${tender.proposal_code}`
              : `مهمة ملغاة أو بالانتظار: ${tender.proposal_code}`,
        message_en:
          options.blockedReason ||
          options.progressNote ||
          `Updated by ${actor.full_name}`,
        message_ar:
          options.blockedReason ||
          options.progressNote ||
          `تم التحديث بواسطة ${actor.full_name}`,
      });
    } else if (toStatus === 'Sent') {
      const docControl = getProfiles()
        .filter((p) => p.role === 'document_control')
        .map((p) => p.id);
      const assignees = [
        tender.responsible_civil_engineer_id,
        tender.mechanical_pricing_responsible_id,
        tender.electrical_pricing_responsible_id,
      ].filter(Boolean) as string[];

      dispatchNotification({
        recipientIds: [...managers, ...docControl, ...assignees],
        type: 'tender_sent',
        tender_id: tender.id,
        proposal_code: tender.proposal_code,
        title_en: `Proposal Sent to Client: ${tender.proposal_code}`,
        title_ar: `تم إرسال العرض للعميل: ${tender.proposal_code}`,
        message_en: `${tender.proposal_name} has been marked as Sent by ${actor.full_name}.`,
        message_ar: `تم اعتماد إرسال العرض ${tender.proposal_name} للعميل.`,
      });
    }
  }

  recordAuditEntry({
    table_name: 'tasks',
    record_id: taskId,
    tender_id: task.tender_id,
    actor,
    action: 'UPDATE',
    old_data: task as unknown as Record<string, unknown>,
    new_data: updatedTask as unknown as Record<string, unknown>,
  });

  return updatedTask;
}

export function getCommentsByTender(tenderId: string): TaskComment[] {
  return readStorage<TaskComment[]>(STORAGE_KEYS.COMMENTS, EMPTY_COMMENTS)
    .filter((c) => c.tender_id === tenderId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function addTaskComment(
  tenderId: string,
  text: string,
  attachmentPath: string | null,
  mentionedUserIds: string[],
  actor: ActorContext
): TaskComment {
  const actorProfile = getProfiles().find((p) => p.id === actor.id) || actor;
  if (!canAddComment(actorProfile)) {
    throw new Error('Permission denied: Viewers cannot post comments.');
  }

  let task = getTaskByTender(tenderId);
  const now = nowCairoIso();
  if (!task) {
    const parentTender = getTenderById(tenderId);
    const createdTask: Task = {
      id: generateUuid(),
      tender_id: tenderId,
      title: parentTender
        ? `${parentTender.proposal_code} — ${parentTender.proposal_name}`
        : tenderId,
      kanban_status: parentTender
        ? toKanbanBoardStage('New', parentTender.tender_status)
        : 'New',
      blocked_reason: null,
      due_date: parentTender?.expected_send_date ?? null,
      progress_note: null,
      completed_at: parentTender?.actual_sent_date ?? null,
      created_by: actor.id,
      created_at: now,
      updated_by: actor.id,
      updated_at: now,
    };
    writeStorage(STORAGE_KEYS.TASKS, [createdTask, ...getTasks()]);
    task = createdTask;
  }
  const comment: TaskComment = {
    id: generateUuid(),
    task_id: task.id,
    tender_id: tenderId,
    user_id: actor.id,
    text: text.trim(),
    attachment_path: attachmentPath?.trim() || null,
    mentioned_user_ids: mentionedUserIds,
    created_at: now,
    updated_at: now,
  };

  const all = readStorage<TaskComment[]>(STORAGE_KEYS.COMMENTS, EMPTY_COMMENTS);
  writeStorage(STORAGE_KEYS.COMMENTS, [...all, comment]);

  const tender = getTenderById(tenderId);
  if (mentionedUserIds.length > 0 && tender) {
    dispatchNotification({
      recipientIds: mentionedUserIds,
      type: 'comment_mention',
      tender_id: tenderId,
      proposal_code: tender.proposal_code,
      title_en: `${actor.full_name} mentioned you on ${tender.proposal_code}`,
      title_ar: `أشار إليك ${actor.full_name} في تعليق على ${tender.proposal_code}`,
      message_en: text.trim(),
      message_ar: text.trim(),
    });
  }

  return comment;
}

// =============================================================================
// 9. SAVED VIEWS (Section 4.3 & Section 5.1)
// =============================================================================

const DEFAULT_SAVED_VIEWS: SavedView[] = [];

export function getSavedViews(userId?: string | null): SavedView[] {
  const all = readStorage<SavedView[]>(
    STORAGE_KEYS.SAVED_VIEWS,
    DEFAULT_SAVED_VIEWS
  );
  if (!userId) return all.filter((v) => v.is_shared);
  return all.filter((v) => v.user_id === userId || v.is_shared);
}

export function saveUserView(
  input: Omit<SavedView, 'id'>,
  actor: ActorContext
): SavedView {
  const all = readStorage<SavedView[]>(
    STORAGE_KEYS.SAVED_VIEWS,
    DEFAULT_SAVED_VIEWS
  );
  const created: SavedView = {
    ...input,
    id: generateUuid(),
    user_id: actor.id,
  };
  writeStorage(STORAGE_KEYS.SAVED_VIEWS, [...all, created]);
  return created;
}

export function deleteSavedView(viewId: string, userId: string): void {
  const all = readStorage<SavedView[]>(
    STORAGE_KEYS.SAVED_VIEWS,
    DEFAULT_SAVED_VIEWS
  );
  writeStorage(
    STORAGE_KEYS.SAVED_VIEWS,
    all.filter((v) => !(v.id === viewId && v.user_id === userId))
  );
}

export function clearAllTransactionalData(actor?: ActorContext): void {
  if (actor) {
    assertAdminPermission(actor, 'clearAllTransactionalData');
  }
  const clearedCount = readStorage<Tender[]>(
    STORAGE_KEYS.TENDERS,
    EMPTY_TENDERS
  ).length;

  writeStorage(STORAGE_KEYS.TENDERS, []);
  writeStorage(STORAGE_KEYS.COMPONENTS, []);
  writeStorage(STORAGE_KEYS.DOCUMENTS, []);
  writeStorage(STORAGE_KEYS.ASSIGNMENTS, []);
  writeStorage(STORAGE_KEYS.TASKS, []);
  writeStorage(STORAGE_KEYS.COMMENTS, []);
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, []);
  try {
    localStorage.removeItem('pzone_wizard_draft_v3_geo');
    localStorage.removeItem('pzone_wizard_draft_v1');
  } catch {
    // ignore
  }

  if (actor) {
    recordAuditEntry({
      table_name: 'tenders',
      record_id: 'WORKSPACE_CLEAR',
      actor,
      action: 'DELETE',
      old_data: { cleared_tenders_count: clearedCount },
      new_data: { cleared_tenders_count: 0 },
    });
  }
}

export function loadDemoSampleData(actor?: ActorContext): void {
  if (actor) {
    assertAdminPermission(actor, 'loadDemoSampleData');
  }
  writeStorage(STORAGE_KEYS.TENDERS, SEEDED_TENDERS);
  writeStorage(STORAGE_KEYS.COMPONENTS, SEEDED_COMPONENTS);
  writeStorage(STORAGE_KEYS.DOCUMENTS, SEEDED_DOCUMENTS);
  writeStorage(STORAGE_KEYS.ASSIGNMENTS, SEEDED_ASSIGNMENTS);
  writeStorage(STORAGE_KEYS.TASKS, SEEDED_TASKS);
  writeStorage(STORAGE_KEYS.COMMENTS, SEEDED_COMMENTS);
  writeStorage(STORAGE_KEYS.NOTIFICATIONS, SEEDED_NOTIFICATIONS);
  const existingLogs = readStorage<AuditLogEntry[]>(STORAGE_KEYS.AUDIT_LOG, []);
  if (existingLogs.length === 0) {
    writeStorage(STORAGE_KEYS.AUDIT_LOG, INITIAL_AUDIT_LOGS);
  }
}

export interface EngineerWorkloadSummary {
  engineer: Profile;
  notStartedCount: number;
  inProgressCount: number;
  finishedCount: number;
  waitingCount: number;
  openCount: number;
  overdueCount: number;
  activePipelineEgp: number;
}

/**
 * Computes per-engineer proposal counts (`Not Started`, `In Progress`, `Finished`,
 * `Waiting`, and `openCount = Not Started + In Progress`) across all latest-revision
 * non-cancelled proposals so the Tender Manager can decide who should receive the next proposal.
 */
export function getEngineerWorkloadSummary(): EngineerWorkloadSummary[] {
  const engineers = getProfiles().filter(
    (p) => p.active && isAssignableEngineerOrManager(p)
  );
  const latestTenders = getTenders().filter((t) => t.is_latest_revision);
  const tasks = getTasks();
  const allAsgs = getAllAssignments();
  const allComps = getAllComponents();
  const todayStr = todayCairoIso();

  return engineers.map((engineer) => {
    let notStartedCount = 0;
    let inProgressCount = 0;
    let finishedCount = 0;
    let waitingCount = 0;
    let overdueCount = 0;
    let activePipelineEgp = 0;

    for (const tender of latestTenders) {
      if (tender.tender_status.toLowerCase().includes('cancel')) {
        continue;
      }

      const myAsgs = allAsgs.filter(
        (a) => a.tender_id === tender.id && a.user_id === engineer.id
      );
      const isDirectAssigned =
        myAsgs.length > 0 ||
        tender.responsible_civil_engineer_id === engineer.id ||
        tender.mechanical_pricing_responsible_id === engineer.id ||
        tender.electrical_pricing_responsible_id === engineer.id;

      if (!isDirectAssigned) continue;

      const tenderComps = allComps.filter((c) => c.tender_id === tender.id);
      const effectiveWorkUnits =
        tenderComps.length +
        ((tender.civil_cost || 0) > 0 ||
        (tender.mechanical_cost || 0) > 0 ||
        (tender.electrical_cost || 0) > 0 ||
        (tender.total_components_area_m2 || 0) > 0
          ? 1
          : 0);
      const existingTask = tasks.find((tk) => tk.tender_id === tender.id);
      const taskStage = existingTask
        ? toKanbanBoardStage(
            existingTask.kanban_status,
            tender.actual_sent_date ? 'Sent to Client' : tender.tender_status,
            effectiveWorkUnits
          )
        : toKanbanBoardStage(
            'New',
            tender.actual_sent_date ? 'Sent to Client' : tender.tender_status,
            effectiveWorkUnits
          );

      if (taskStage === 'Sent') {
        finishedCount++;
        continue;
      }
      if (taskStage === 'Cancelled or Waiting') {
        waitingCount++;
        continue;
      }

      let engStage: KanbanBoardStage = 'Not Started';
      if (myAsgs.length > 0) {
        const stages = myAsgs.map((a) =>
          getEffectiveDisciplineStage(a, tenderComps, tender)
        );
        if (stages.every((s) => s === 'Finished')) {
          engStage = 'Finished';
        } else if (stages.some((s) => s === 'In Progress' || s === 'Finished')) {
          engStage = 'In Progress';
        } else if (stages.some((s) => s === 'Cancelled or Waiting')) {
          engStage = 'Cancelled or Waiting';
        } else {
          engStage = 'Not Started';
        }
      } else {
        engStage = taskStage;
      }

      if (engStage === 'Finished') {
        finishedCount++;
      } else if (engStage === 'In Progress') {
        inProgressCount++;
        activePipelineEgp += tender.tender_total_price || 0;
        if (
          !tender.actual_sent_date &&
          tender.expected_send_date &&
          tender.expected_send_date < todayStr
        ) {
          overdueCount++;
        }
      } else if (engStage === 'Cancelled or Waiting') {
        waitingCount++;
      } else {
        notStartedCount++;
        activePipelineEgp += tender.tender_total_price || 0;
        if (
          !tender.actual_sent_date &&
          tender.expected_send_date &&
          tender.expected_send_date < todayStr
        ) {
          overdueCount++;
        }
      }
    }

    return {
      engineer,
      notStartedCount,
      inProgressCount,
      finishedCount,
      waitingCount,
      openCount: notStartedCount + inProgressCount,
      overdueCount,
      activePipelineEgp,
    };
  });
}

export function resetDataStoreForTests(): void {
  memoryCache.clear();
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
  loadDemoSampleData();
}

export interface ErpSyncedTenderCostPayload {
  erpTenderId: string;
  proposalCode: string;
  proposalName: string;
  owner: string;
  contractor?: string | null;
  pzoneRole?: string | null;
  receivedDate?: string | null;
  expectedSendDate?: string | null;
  status?: string | null;
  civilCost: number;
  mechanicalCost: number;
  electricalCost: number;
  finalBidPrice: number;
  totalAreaM2?: number;
  totalVolumeM3?: number;
  componentsSummary?: string;
}

/**
 * Two-Way ERP Bridge Updater:
 * Updates existing PZ.Tender Log tenders (matched by ID or proposal_code) with
 * calculated Civil, Mechanical, Electrical, and Final Bid Price from the
 * Intelligent Tendering ERP, and imports any ERP tender_log records not yet present.
 */
export function syncErpTendersAndCostsIntoStore(
  items: ErpSyncedTenderCostPayload[]
): { updatedCount: number; importedCount: number } {
  if (!items || items.length === 0) return { updatedCount: 0, importedCount: 0 };

  const currentTenders = readStorage<Tender[]>(STORAGE_KEYS.TENDERS, EMPTY_TENDERS);
  const currentComponents = readStorage<ProposalComponent[]>(
    STORAGE_KEYS.COMPONENTS,
    EMPTY_COMPONENTS
  );
  const rates = getExchangeRates();
  const now = nowCairoIso();

  let updatedCount = 0;
  let importedCount = 0;
  let changed = false;

  const nextTenders = [...currentTenders];
  const nextComponents = [...currentComponents];

  const maxSerial = nextTenders.reduce((m, t) => Math.max(m, t.serial_no || 0), 0);
  let nextSerial = maxSerial + 1;

  const activeSessionUser = getCurrentSessionUser();
  const activeActorId: string | null = activeSessionUser?.id || null;

  for (const item of items) {
    const cleanCode = (item.proposalCode || '').trim();
    if (!cleanCode) continue;

    const existingIdx = nextTenders.findIndex(
      (t) =>
        t.id === item.erpTenderId ||
        (t.proposal_code.toLowerCase() === cleanCode.toLowerCase() && t.is_latest_revision)
    );

    const civil = Number((item.civilCost || 0).toFixed(2));
    const mech = Number((item.mechanicalCost || 0).toFixed(2));
    const elec = Number((item.electricalCost || 0).toFixed(2));
    const totalBid =
      item.finalBidPrice > 0
        ? Number(item.finalBidPrice.toFixed(2))
        : Number((civil + mech + elec).toFixed(2));

    if (existingIdx >= 0) {
      const existing = nextTenders[existingIdx];
      const hasErpCosts = civil > 0 || mech > 0 || elec > 0 || totalBid > 0;
      if (!hasErpCosts) continue;

      const rateMatch = findNearestExchangeRate(
        existing.actual_sent_date || existing.received_date || todayCairoIso(),
        rates
      );
      const fxRate = existing.exchange_rate_on_sent_date || rateMatch?.rate || 50;
      const totalUsd = computePriceUsd(totalBid, fxRate);

      const wasReadyAllThree =
        (existing.civil_cost || 0) > 0 &&
        (existing.mechanical_cost || 0) > 0 &&
        (existing.electrical_cost || 0) > 0;
      const isNowReadyAllThree = civil > 0 && mech > 0 && elec > 0;

      const priceDiff =
        Math.abs((existing.civil_cost || 0) - civil) > 0.5 ||
        Math.abs((existing.mechanical_cost || 0) - mech) > 0.5 ||
        Math.abs((existing.electrical_cost || 0) - elec) > 0.5 ||
        Math.abs((existing.tender_total_price || 0) - totalBid) > 0.5;

      const areaDiff =
        (item.totalAreaM2 && item.totalAreaM2 > 0 && existing.total_components_area_m2 === 0) ||
        (item.totalVolumeM3 && item.totalVolumeM3 > 0 && existing.total_components_volume_m3 === 0);

      if (priceDiff || areaDiff) {
        const shouldAdvanceStatus =
          (existing.tender_status === 'New / Registered' ||
            existing.tender_status === 'Assigned') &&
          (civil > 0 || mech > 0 || elec > 0);
        nextTenders[existingIdx] = {
          ...existing,
          tender_status: shouldAdvanceStatus
            ? 'In Progress'
            : existing.tender_status,
          civil_cost: civil,
          mechanical_cost: mech,
          electrical_cost: elec,
          tender_total_price: totalBid,
          total_price_is_manual: Math.abs(totalBid - (civil + mech + elec)) > 1,
          tender_total_price_usd: totalUsd,
          total_components_area_m2:
            item.totalAreaM2 && item.totalAreaM2 > 0
              ? item.totalAreaM2
              : existing.total_components_area_m2,
          total_components_volume_m3:
            item.totalVolumeM3 && item.totalVolumeM3 > 0
              ? item.totalVolumeM3
              : existing.total_components_volume_m3,
          components_summary:
            item.componentsSummary && !existing.components_summary
              ? item.componentsSummary
              : existing.components_summary,
          updated_by: activeActorId,
          updated_at: now,
        };

        // Also update the components' discipline costs proportionally while preserving all component fields
        const tComps = nextComponents.filter((c) => c.tender_id === existing.id);
        if (tComps.length > 0) {
          const share = 1 / tComps.length;
          for (const comp of tComps) {
            const cIdx = nextComponents.findIndex((c) => c.id === comp.id);
            if (cIdx >= 0) {
              const patchedComp = {
                ...nextComponents[cIdx],
                total_civil_cost: Number((civil * share).toFixed(2)),
                total_mechanical_cost: Number((mech * share).toFixed(2)),
                total_electrical_cost: Number((elec * share).toFixed(2)),
                updated_at: now,
              };
              const computed = computeComponentFields(patchedComp);
              nextComponents[cIdx] = {
                ...patchedComp,
                ...computed,
                total_price: Number((totalBid * share).toFixed(2)),
              };
            }
          }
        }

        if (!wasReadyAllThree && isNowReadyAllThree) {
          const managerAndOverheadsIds = getProfiles()
            .filter(
              (p) =>
                p.active &&
                (p.role === 'app_admin' ||
                  p.role === 'tender_manager' ||
                  canAccessCommercialOverheads(p))
            )
            .map((p) => p.id);
          dispatchNotification({
            recipientIds: managerAndOverheadsIds,
            type: 'erp_ready_for_commercial',
            tender_id: existing.id,
            proposal_code: existing.proposal_code,
            title_en: `All 3 Trades Priced — ${existing.proposal_code} Ready for Commercial Bid`,
            title_ar: `اكتمال تسعير الأقسام الثلاثة — ${existing.proposal_code} جاهز للتسعير التجاري`,
            message_en: `Civil (${civil.toLocaleString()} EGP), Mechanical (${mech.toLocaleString()} EGP), and Electrical (${elec.toLocaleString()} EGP) BOQs are complete. Ready to finalize Commercial Overheads & Bid Price.`,
            message_ar: `تم الانتهاء من تسعير المدني والميكانيكا والكهرباء للمناقصة ${existing.proposal_code}. جاهزة الآن لاعتماد المصاريف غير المباشرة وسعر العطاء النهائي.`,
          });
        }

        updatedCount++;
        changed = true;
      }
    } else {
      // Import ERP proposal into PZ.Tender Log so both registries stay 100% unified
      const yearMatch = cleanCode.match(/20\d{2}/);
      const parsedYear = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();
      const recDate = item.receivedDate || todayCairoIso();
      const rateMatch = findNearestExchangeRate(recDate, rates);
      const fxRate = rateMatch?.rate || 50;

      const newTender: Tender = {
        id: item.erpTenderId || generateUuid(),
        serial_no: nextSerial++,
        year: parsedYear,
        proposal_code: cleanCode,
        proposal_rev: 0,
        previous_revision_id: null,
        revision_reason: null,
        revision_requested_by: null,
        is_latest_revision: true,
        sales_representative_id: null,
        pzone_role: item.pzoneRole || 'Sub Contractor',
        contractor: item.contractor || null,
        owner: item.owner || 'Direct Client',
        country: 'Egypt',
        governorate: 'Cairo',
        area: null,
        district: null,
        location: null,
        proposal_origin: 'Direct Client Inquiry',
        proposal_name: item.proposalName || cleanCode,
        total_components_area_m2: item.totalAreaM2 || 0,
        total_components_volume_m3: item.totalVolumeM3 || 0,
        server_link_path: null,
        scope_of_work: [
          'Civil & Structural Works',
          'Mechanical Works',
          'Electrical & Automation',
          'Waterproofing & Finishing',
        ],
        components_summary: item.componentsSummary || '',
        pump_room_included_in_water_features: true,
        project_priority: 'High',
        received_date: recDate,
        expected_send_date: item.expectedSendDate || null,
        deadline_date: item.expectedSendDate || null,
        actual_sent_date: null,
        tender_status: item.status || 'In Progress',
        responsible_civil_engineer_id: null,
        civil_assigned_at: null,
        mechanical_pricing_responsible_id: null,
        mechanical_assigned_at: null,
        electrical_pricing_responsible_id: null,
        electrical_assigned_at: null,
        tender_status_notes: 'Synced with P.ZONE Intelligent Tendering ERP',
        delayed_days: 0,
        currency: 'EGP',
        maintenance_cost: 0,
        supply_cost: 0,
        design_cost: 0,
        civil_cost: civil,
        mechanical_cost: mech,
        electrical_cost: elec,
        total_price_is_manual: totalBid > civil + mech + elec,
        tender_total_price: totalBid,
        estimated_price_if_not_sent: null,
        is_duplicate: 'Not Duplicate',
        duplicate_of_tender_id: null,
        contact_name: null,
        contact_number: null,
        contact_job_title: null,
        contact_email: null,
        contact_address: null,
        exchange_rate_on_sent_date: fxRate,
        sent_rate_date_used: rateMatch?.dateUsed || todayCairoIso(),
        sent_rate_source: rateMatch?.source || 'CBE',
        sent_rate_is_manual: false,
        tender_total_price_usd: computePriceUsd(totalBid, fxRate),
        project_status: 'Under Client Evaluation',
        contract_date: null,
        project_status_note: null,
        pr_code: null,
        project_name: null,
        pr_contract_date: null,
        final_pr_contract_total_price: null,
        exchange_rate_on_contract_date: null,
        contract_rate_date_used: null,
        contract_rate_source: null,
        contract_rate_is_manual: false,
        pr_contract_total_price_usd: null,
        final_contracted_status: null,
        final_contracted_status_notes: null,
        is_archived: false,
        created_by: activeActorId,
        created_at: now,
        updated_by: activeActorId,
        updated_at: now,
      };

      nextTenders.push(newTender);
      importedCount++;
      changed = true;
    }
  }

  if (changed) {
    writeStorage(STORAGE_KEYS.TENDERS, nextTenders);
    writeStorage(STORAGE_KEYS.COMPONENTS, nextComponents);
  }

  return { updatedCount, importedCount };
}
