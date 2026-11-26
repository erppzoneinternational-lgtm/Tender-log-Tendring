import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Pencil,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Sliders,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  deleteUserProfile,
  getProfiles,
  hydrateStoreFromCloud,
  inviteOrCreateUser,
  subscribeDataStore,
  updateUserProfile,
} from '@/lib/dataStore';
import {
  canManageTargetUser,
  getAssignableRoles,
  getEffectiveModulePermissions,
  hasCustomModuleOverrides,
  isAppAdmin,
  ROLE_DEFAULT_MODULE_PERMISSIONS,
  SYSTEM_MODULES_META,
} from '@/lib/permissions';
import {
  ALL_USER_ROLES,
  type AccessLevel,
  type ModulePermissions,
  type Profile,
  type SystemModuleKey,
  type UserRole,
} from '@/types/database';

const ROLE_COLORS: Record<UserRole, string> = {
  app_admin:
    'bg-pzone-magenta/15 text-pzone-magenta border-pzone-magenta/35',
  commercial_approver:
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/35',
  tender_manager:
    'bg-pzone-navy/10 text-pzone-navy dark:bg-pzone-teal/20 dark:text-pzone-teal border-pzone-navy/20',
  civil_tender_engineer:
    'bg-pzone-teal/15 text-pzone-teal border-pzone-teal/30',
  mechanical_engineer:
    'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  electrical_engineer:
    'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  procurement_cost_control:
    'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/35',
  document_control:
    'bg-pzone-orange/15 text-pzone-orange border-pzone-orange/30',
  viewer: 'bg-pzone-slate/20 text-muted-foreground border-border',
};

const ACCESS_CYCLE: Record<AccessLevel, AccessLevel> = {
  hidden: 'view',
  view: 'edit',
  edit: 'hidden',
};

const ACCESS_CHIP_STYLES: Record<AccessLevel, string> = {
  edit: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25',
  view: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40 hover:bg-sky-500/25',
  hidden:
    'bg-muted/60 text-muted-foreground/70 border-border hover:border-pzone-teal hover:text-foreground',
};

const ACCESS_LABELS: Record<AccessLevel, string> = {
  hidden: 'Hidden',
  view: 'View',
  edit: 'Edit',
};

export const UsersAdmin: React.FC = () => {
  const { t } = useTranslation();
  const { user, language } = useApp();

  const [profiles, setProfiles] = useState<Profile[]>(() => getProfiles());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [fullNameEn, setFullNameEn] = useState('');
  const [fullNameAr, setFullNameAr] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('civil_tender_engineer');
  const [matrixDraft, setMatrixDraft] = useState<ModulePermissions>(() => ({
    ...ROLE_DEFAULT_MODULE_PERMISSIONS.civil_tender_engineer,
  }));

  useEffect(() => {
    void hydrateStoreFromCloud();
    return subscribeDataStore(() => {
      setProfiles(getProfiles());
    });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const assignableRoles = useMemo(
    () => (user ? getAssignableRoles(user.role) : []),
    [user]
  );

  const actorIsAppAdmin = Boolean(user && isAppAdmin(user.role));

  const activeCount = useMemo(
    () => profiles.filter((p) => p.active).length,
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.full_name.toLowerCase().includes(q) ||
        (p.full_name_ar || '').toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        t(`roles.${p.role}`).toLowerCase().includes(q)
      );
    });
  }, [profiles, roleFilter, search, t]);

  const isDraftCustomized = useMemo(() => {
    if (role === 'app_admin') return false;
    const base = ROLE_DEFAULT_MODULE_PERMISSIONS[role];
    return SYSTEM_MODULES_META.some((m) => matrixDraft[m.key] !== base[m.key]);
  }, [role, matrixDraft]);

  const computeOverridesFromDraft = (
    selectedRole: UserRole,
    draft: ModulePermissions
  ): Partial<ModulePermissions> => {
    if (selectedRole === 'app_admin') return {};
    const base = ROLE_DEFAULT_MODULE_PERMISSIONS[selectedRole];
    const diff: Partial<ModulePermissions> = {};
    for (const m of SYSTEM_MODULES_META) {
      if (draft[m.key] !== base[m.key]) {
        diff[m.key] = draft[m.key];
      }
    }
    return diff;
  };

  const openInviteModal = () => {
    setEditingUser(null);
    setFullNameEn('');
    setFullNameAr('');
    setEmail('');
    setPhone('+20 100 ');
    setRole('civil_tender_engineer');
    setMatrixDraft({ ...ROLE_DEFAULT_MODULE_PERMISSIONS.civil_tender_engineer });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (target: Profile) => {
    if (!user || !canManageTargetUser(user.role, target.role)) {
      setErrorMsg('You have no authority to modify an App Admin account.');
      return;
    }
    setEditingUser(target);
    setFullNameEn(target.full_name);
    setFullNameAr(target.full_name_ar || '');
    setEmail(target.email);
    setPhone(target.phone || '');
    setRole(target.role);
    setMatrixDraft(getEffectiveModulePermissions(target));
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSelectRolePresetInModal = (nextRole: UserRole) => {
    setRole(nextRole);
    setMatrixDraft({ ...ROLE_DEFAULT_MODULE_PERMISSIONS[nextRole] });
  };

  const handleAppendGmailDomain = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmail('@gmail.com');
      return;
    }
    if (!trimmed.includes('@')) {
      setEmail(`${trimmed}@gmail.com`);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);

    const overrides = computeOverridesFromDraft(role, matrixDraft);
    const overheadsAllowed =
      role === 'app_admin' ? true : matrixDraft.erp_overheads !== 'hidden';

    try {
      if (editingUser) {
        const updated = updateUserProfile(
          editingUser.id,
          {
            full_name: fullNameEn,
            full_name_ar: fullNameAr || null,
            email,
            phone: phone || null,
            role,
            module_permissions: overrides,
            can_access_commercial_overheads: overheadsAllowed,
          },
          user
        );
        showToast(
          `Updated ${updated.full_name} — ${t(`roles.${updated.role}`)}${
            hasCustomModuleOverrides(updated) ? ' (+ Custom Matrix)' : ''
          }`
        );
      } else {
        const created = inviteOrCreateUser(
          {
            full_name: fullNameEn,
            full_name_ar: fullNameAr,
            email,
            phone,
            role,
            module_permissions: overrides,
            can_access_commercial_overheads: overheadsAllowed,
          },
          user
        );
        showToast(
          `Added ${created.email} as ${t(`roles.${created.role}`)}${
            hasCustomModuleOverrides(created) ? ' (+ Custom Matrix)' : ''
          } — Google Sign-In enabled`
        );
      }
      setProfiles(getProfiles());
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleQuickCycleModuleInTable = (
    target: Profile,
    moduleKey: SystemModuleKey
  ) => {
    if (!user) return;
    if (!canManageTargetUser(user.role, target.role)) {
      setErrorMsg('Only an App Admin can modify module permissions.');
      return;
    }
    if (target.role === 'app_admin') {
      showToast('App Admins always retain full Edit access across all modules.');
      return;
    }
    setErrorMsg(null);
    try {
      const currentEffective = getEffectiveModulePermissions(target);
      const nextLevel =
        moduleKey === 'analytics_reports'
          ? currentEffective[moduleKey] === 'hidden'
            ? 'view'
            : 'hidden'
          : ACCESS_CYCLE[currentEffective[moduleKey]];

      const nextDraft: ModulePermissions = {
        ...currentEffective,
        [moduleKey]: nextLevel,
      };
      const overrides = computeOverridesFromDraft(target.role, nextDraft);
      updateUserProfile(
        target.id,
        {
          module_permissions: overrides,
          can_access_commercial_overheads: nextDraft.erp_overheads !== 'hidden',
        },
        user
      );
      setProfiles(getProfiles());
      const modMeta = SYSTEM_MODULES_META.find((m) => m.key === moduleKey);
      showToast(
        `${target.full_name}: ${modMeta?.labelEn || moduleKey} → ${ACCESS_LABELS[nextLevel]}`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleResetToPresetInTable = (target: Profile) => {
    if (!user || target.role === 'app_admin') return;
    try {
      const base = ROLE_DEFAULT_MODULE_PERMISSIONS[target.role];
      updateUserProfile(
        target.id,
        {
          module_permissions: {},
          can_access_commercial_overheads: base.erp_overheads !== 'hidden',
        },
        user
      );
      setProfiles(getProfiles());
      showToast(
        `Reset ${target.full_name} to default '${t(`roles.${target.role}`)}' permissions`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleToggleActive = (target: Profile) => {
    if (!user) return;
    if (!canManageTargetUser(user.role, target.role)) {
      setErrorMsg('You have no authority over App Admin accounts.');
      return;
    }
    if (target.id === user.id && target.active) {
      setErrorMsg('You cannot block your own currently signed-in account.');
      return;
    }
    setErrorMsg(null);
    try {
      updateUserProfile(target.id, { active: !target.active }, user);
      setProfiles(getProfiles());
      showToast(
        `${target.email} is now ${
          !target.active
            ? 'Allowed to Sign in with Google'
            : 'Blocked from Signing in'
        }`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleRemoveUser = (target: Profile) => {
    if (!user) return;
    if (!canManageTargetUser(user.role, target.role)) {
      setErrorMsg('You have no authority to remove an App Admin account.');
      return;
    }
    if (target.id === user.id) {
      setErrorMsg('You cannot remove your own currently signed-in account.');
      return;
    }
    const confirmed = window.confirm(
      `Remove '${target.email}' (${target.full_name} — ${t(`roles.${target.role}`)}) from the authorized Google Sign-In list?\n\nThey will no longer be able to sign in.`
    );
    if (!confirmed) return;

    setErrorMsg(null);
    try {
      deleteUserProfile(target.id, user);
      setProfiles(getProfiles());
      showToast(`Removed ${target.email} from authorized Gmail list`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="p-3.5 rounded-xl bg-pzone-seagreen/15 border border-pzone-seagreen/30 text-pzone-seagreen text-xs font-semibold flex items-center justify-between">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && !modalOpen && (
        <div className="p-3.5 rounded-xl bg-pzone-crimson/10 border border-pzone-crimson/30 text-pzone-crimson text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Google / Gmail Allowlist & Role + Matrix Banner */}
      <div className="p-4 rounded-card bg-pzone-teal/10 border border-pzone-teal/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-pzone-teal/20 text-pzone-teal flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              9-Role Presets + Per-User Module Permission Matrix
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {actorIsAppAdmin
                ? 'Choose a 1-click Role Preset when adding a Gmail user, then click any module chip (TL · KB · GEO · CIV · MEP · OVH · CAT · RPT) to customize Hidden / View / Edit for that person.'
                : 'Restricted to App Admins only.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-mono font-semibold">
          <span className="px-3 py-1 rounded-full bg-pzone-seagreen/15 text-pzone-seagreen border border-pzone-seagreen/30">
            {activeCount} Allowed
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            {profiles.length - activeCount} Blocked
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-card p-6 shadow-soft dark:shadow-soft-dark space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {t('admin.users.title')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('admin.users.subtitle')}
            </p>
          </div>

          <button
            type="button"
            onClick={openInviteModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pzone-navy hover:bg-pzone-navy/90 dark:bg-pzone-teal dark:hover:bg-pzone-teal/90 text-white text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('admin.users.inviteButton')}</span>
          </button>
        </div>

        {/* Search & 9-Role Filter + Matrix Legend */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute top-3 start-3.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin.users.searchPlaceholder')}
                className="w-full ps-9 pe-4 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by role"
              className="px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
            >
              <option value="ALL">{t('admin.users.allRoles')}</option>
              {ALL_USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="px-2 py-0.5 rounded border bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40">
              Edit
            </span>
            <span className="px-2 py-0.5 rounded border bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40">
              View Only
            </span>
            <span className="px-2 py-0.5 rounded border bg-muted/60 text-muted-foreground border-border">
              Hidden
            </span>
            <span className="text-muted-foreground font-normal">
              (Click any chip to cycle)
            </span>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-start border-collapse text-sm">
            <thead>
              <tr className="bg-muted/60 text-muted-foreground text-xs uppercase border-b border-border">
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.users.colName')}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  Role Preset
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.users.colContact')}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  8-Module Access Matrix (Click to Customize)
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.users.colStatus')}
                </th>
                <th className="py-3 px-4 text-end font-semibold">
                  {t('admin.users.colActions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-[13px]">
              {filteredProfiles.map((p) => {
                const primaryName =
                  language === 'ar' && p.full_name_ar
                    ? p.full_name_ar
                    : p.full_name;
                const secondaryName =
                  language === 'ar' ? p.full_name : p.full_name_ar;
                const isSelf = user?.id === p.id;
                const canManageRow = user
                  ? canManageTargetUser(user.role, p.role)
                  : false;
                const effectiveMatrix = getEffectiveModulePermissions(p);
                const isCustomized = hasCustomModuleOverrides(p);

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                            p.role === 'app_admin'
                              ? 'bg-gradient-to-br from-pzone-magenta to-pzone-navy'
                              : 'bg-pzone-navy'
                          }`}
                        >
                          {p.full_name
                            .split(' ')
                            .slice(0, 2)
                            .map((w) => w[0])
                            .join('')}
                        </div>
                        <div>
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <span>{primaryName}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded bg-pzone-teal/15 text-pzone-teal text-[10px] font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          {secondaryName && (
                            <div className="text-xs text-muted-foreground">
                              {secondaryName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                              ROLE_COLORS[p.role]
                            }`}
                          >
                            {t(`roles.${p.role}`)}
                          </span>
                          {isCustomized && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                              <Sliders className="w-2.5 h-2.5" />
                              Custom
                            </span>
                          )}
                        </div>
                        {isCustomized && canManageRow && (
                          <button
                            type="button"
                            onClick={() => handleResetToPresetInTable(p)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-pzone-teal hover:underline cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset to preset</span>
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5 text-foreground font-mono font-medium">
                        <Mail className="w-3.5 h-3.5 text-pzone-teal shrink-0" />
                        <span>{p.email}</span>
                      </div>
                      {p.phone && (
                        <div className="flex items-center gap-1.5 font-tabular">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{p.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                        {SYSTEM_MODULES_META.map((mod) => {
                          const lvl = effectiveMatrix[mod.key];
                          return (
                            <button
                              key={mod.key}
                              type="button"
                              disabled={!canManageRow || p.role === 'app_admin'}
                              onClick={() =>
                                handleQuickCycleModuleInTable(p, mod.key)
                              }
                              title={`${mod.labelEn}: ${ACCESS_LABELS[lvl]}${
                                p.role === 'app_admin'
                                  ? ' (App Admin has full access)'
                                  : ' — Click to cycle Hidden / View / Edit'
                              }`}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-bold border transition-colors disabled:cursor-default ${
                                ACCESS_CHIP_STYLES[lvl]
                              }`}
                            >
                              <span>{mod.shortCode}</span>
                              <span className="text-[9px] font-sans uppercase opacity-80">
                                {lvl === 'edit'
                                  ? 'Edit'
                                  : lvl === 'view'
                                    ? 'View'
                                    : 'Off'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        disabled={isSelf || !canManageRow}
                        onClick={() => handleToggleActive(p)}
                        title={
                          !canManageRow
                            ? 'Protected: Only an App Admin can change an App Admin status'
                            : isSelf
                              ? 'Your active session cannot be deactivated'
                              : 'Click to toggle Google Sign-In access'
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-75 disabled:cursor-not-allowed ${
                          p.active
                            ? 'bg-pzone-seagreen/15 text-pzone-seagreen hover:bg-pzone-seagreen/25'
                            : 'bg-pzone-crimson/15 text-pzone-crimson hover:bg-pzone-crimson/25'
                        }`}
                      >
                        {p.active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('admin.users.active')}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t('admin.users.inactive')}</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-end">
                      {canManageRow ? (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-pzone-teal hover:text-white text-foreground text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Matrix & Edit</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleRemoveUser(p)}
                            title={
                              isSelf
                                ? 'Cannot remove your own currently signed-in account'
                                : 'Remove from Gmail allowlist'
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-pzone-crimson hover:text-white text-muted-foreground text-xs font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{t('admin.users.removeUser')}</span>
                          </button>
                        </div>
                      ) : (
                        <span
                          title="Only App Admins have authority over App Admin accounts"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pzone-magenta/10 border border-pzone-magenta/25 text-pzone-magenta text-[11px] font-semibold"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Protected · App Admin</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Authorized Gmail User + 8-Module Permission Matrix Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-card shadow-2xl p-6 space-y-5 border-ribbon-top"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {editingUser
                    ? `${t('admin.users.editUser')} & Permission Matrix`
                    : `${t('admin.users.inviteButton')} & Permission Matrix`}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Step 1: Pick a 1-click Role Preset • Step 2: Customize any module (Hidden / View / Edit) if needed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-pzone-crimson/10 border border-pzone-crimson/30 text-pzone-crimson text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {t('admin.users.fullNameEn')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullNameEn}
                    onChange={(e) => setFullNameEn(e.target.value)}
                    placeholder="Eng. Sherif Adel"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {t('admin.users.fullNameAr')}
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={fullNameAr}
                    onChange={(e) => setFullNameAr(e.target.value)}
                    placeholder="م. شريف عادل"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-foreground">
                      {t('admin.users.email')} *
                    </label>
                    {!email.includes('@') && (
                      <button
                        type="button"
                        onClick={handleAppendGmailDomain}
                        className="text-[11px] font-mono font-semibold text-pzone-teal hover:underline cursor-pointer"
                      >
                        + @gmail.com
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sherif.adel@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {t('admin.users.phone')}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+20 100 000 0000"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground font-tabular focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                  />
                </div>
              </div>

              {/* STEP 1: 1-Click Role Preset */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-foreground">
                    Step 1 — Role Preset (1-Click Auto-Fill) *
                  </label>
                  {isDraftCustomized && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                      <Sliders className="w-3 h-3" />
                      Custom Matrix Overrides Active
                    </span>
                  )}
                </div>
                <select
                  value={role}
                  onChange={(e) =>
                    handleSelectRolePresetInModal(e.target.value as UserRole)
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {t(`roles.${r}`)}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {t(`roleDescriptions.${role}`)}
                </p>
              </div>

              {/* STEP 2: Interactive 8-Module Visual Permission Matrix */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-2.5 bg-muted/60 border-b border-border flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-pzone-teal" />
                    <span>Step 2 — Customize Module Access (Optional)</span>
                  </div>
                  {isDraftCustomized && (
                    <button
                      type="button"
                      onClick={() =>
                        setMatrixDraft({
                          ...ROLE_DEFAULT_MODULE_PERMISSIONS[role],
                        })
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-pzone-teal hover:underline cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Role Preset</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-border bg-background">
                  {SYSTEM_MODULES_META.map((mod) => {
                    const currentLvl =
                      role === 'app_admin' ? 'edit' : matrixDraft[mod.key];
                    const baseLvl = ROLE_DEFAULT_MODULE_PERMISSIONS[role][mod.key];
                    const isOverridden =
                      role !== 'app_admin' && currentLvl !== baseLvl;
                    const levels: AccessLevel[] =
                      mod.key === 'analytics_reports'
                        ? ['hidden', 'view']
                        : ['hidden', 'view', 'edit'];

                    return (
                      <div
                        key={mod.key}
                        className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/25"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground">
                              {mod.shortCode}
                            </span>
                            <span className="text-xs font-bold text-foreground">
                              {language === 'ar' ? mod.labelAr : mod.labelEn}
                            </span>
                            {isOverridden && (
                              <span className="text-[10px] font-bold text-purple-500">
                                • Customized
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {mod.descEn}
                          </p>
                        </div>

                        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 shrink-0">
                          {levels.map((lvl) => {
                            const active = currentLvl === lvl;
                            return (
                              <button
                                key={lvl}
                                type="button"
                                disabled={role === 'app_admin'}
                                onClick={() =>
                                  setMatrixDraft((prev) => ({
                                    ...prev,
                                    [mod.key]: lvl,
                                  }))
                                }
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
                                  active
                                    ? lvl === 'edit'
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : lvl === 'view'
                                        ? 'bg-sky-600 text-white shadow-2xs'
                                        : 'bg-slate-600 text-white shadow-2xs'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {lvl === 'hidden' && (
                                  <EyeOff className="w-3 h-3" />
                                )}
                                {lvl === 'view' && <Eye className="w-3 h-3" />}
                                {lvl === 'edit' && (
                                  <Pencil className="w-3 h-3" />
                                )}
                                <span>
                                  {lvl === 'hidden'
                                    ? 'Hidden'
                                    : lvl === 'view'
                                      ? 'View'
                                      : 'Edit'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/60 border border-border text-[11px] text-muted-foreground">
                Once saved as <strong className="text-foreground">Allowed (Active)</strong>, this user can immediately sign in via <strong className="text-foreground">Sign in with Google</strong> using <span className="font-mono text-pzone-teal">{email || 'their Gmail'}</span>.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold cursor-pointer"
                >
                  {t('admin.users.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pzone-navy dark:bg-pzone-teal text-white text-xs font-semibold shadow-sm hover:opacity-90 cursor-pointer"
                >
                  {t('admin.users.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
