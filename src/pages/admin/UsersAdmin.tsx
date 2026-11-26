import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  ExternalLink,
  Mail,
  Phone,
  Save,
  Search,
  ShieldCheck,
  Sliders,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { PORTAL_URL, supabase } from '@/lib/supabaseClient';
import {
  getProfiles,
  hydrateStoreFromCloud,
  subscribeDataStore,
} from '@/lib/dataStore';
import {
  getEffectiveModulePermissions,
  hasCustomModuleOverrides,
  isAppAdmin,
  SYSTEM_MODULES_META,
} from '@/lib/permissions';
import {
  ALL_USER_ROLES,
  type AccessLevel,
  type Profile,
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

const ACCESS_CHIP_STYLES: Record<AccessLevel, string> = {
  edit: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  view: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40',
  hidden: 'bg-muted/60 text-muted-foreground/70 border-border',
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
  const [teamDrafts, setTeamDrafts] = useState<Record<string, string>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    void hydrateStoreFromCloud(['profiles']);
    return subscribeDataStore(() => {
      setProfiles(getProfiles());
    });
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

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
        (p.team || '').toLowerCase().includes(q) ||
        t(`roles.${p.role}`).toLowerCase().includes(q)
      );
    });
  }, [profiles, roleFilter, search, t]);

  const handleSaveTeam = async (target: Profile) => {
    if (!actorIsAppAdmin) return;
    const rawDraft =
      teamDrafts[target.id] !== undefined
        ? teamDrafts[target.id]
        : target.team || '';
    const team = rawDraft.trim() || null;

    setSavingUserId(target.id);
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ team })
        .eq('id', target.id);
      if (error) {
        throw new Error(error.message);
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === target.id ? { ...p, team } : p))
      );
      setTeamDrafts((prev) => {
        const next = { ...prev };
        delete next[target.id];
        return next;
      });
      await hydrateStoreFromCloud(['profiles']);
      showToast(t('admin.users.teamSaved', { name: target.full_name }));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSavingUserId(null);
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

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-pzone-crimson/10 border border-pzone-crimson/30 text-pzone-crimson text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Portal Console Notice Banner */}
      <div className="p-4 rounded-card bg-pzone-teal/10 border border-pzone-teal/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-pzone-teal/20 text-pzone-teal flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {t('admin.users.portalConsoleNotice')}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
              <a
                href={`${PORTAL_URL}/admin/users`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-pzone-teal hover:underline"
              >
                <span>{t('admin.users.openPortalConsole')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs font-mono font-semibold">
          <span className="px-3 py-1 rounded-full bg-pzone-seagreen/15 text-pzone-seagreen border border-pzone-seagreen/30">
            {activeCount} {t('admin.users.active')}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            {profiles.length - activeCount} {t('admin.users.inactive')}
          </span>
        </div>
      </div>

      <div className="bg-card border border-border rounded-card p-6 shadow-soft dark:shadow-soft-dark space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {t('admin.users.title')}
          </h2>
        </div>

        {/* Search & Role Filter + Read-Only Matrix Legend */}
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
              aria-label={t('admin.users.allRoles')}
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
                  {t('admin.users.colRole')}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.users.colTeam')}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.users.colContact')}
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  8-Module Access Matrix
                </th>
                <th className="py-3 px-4 text-start font-semibold">
                  {t('admin.users.colStatus')}
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
                const effectiveMatrix = getEffectiveModulePermissions(p);
                const isCustomized = hasCustomModuleOverrides(p);
                const currentTeamValue =
                  teamDrafts[p.id] !== undefined ? teamDrafts[p.id] : p.team || '';
                const isTeamDirty =
                  teamDrafts[p.id] !== undefined &&
                  teamDrafts[p.id].trim() !== (p.team || '').trim();

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
                    </td>

                    <td className="py-3.5 px-4">
                      {actorIsAppAdmin ? (
                        <div className="flex items-center gap-1.5 min-w-[200px]">
                          <input
                            type="text"
                            value={currentTeamValue}
                            placeholder={t('admin.users.teamPlaceholder')}
                            onChange={(e) =>
                              setTeamDrafts((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && isTeamDirty) {
                                e.preventDefault();
                                void handleSaveTeam(p);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                          />
                          {isTeamDirty && (
                            <button
                              type="button"
                              disabled={savingUserId === p.id}
                              onClick={() => void handleSaveTeam(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pzone-teal hover:bg-pzone-teal/90 text-white text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-60"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{t('admin.users.saveTeam')}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-foreground">
                          {p.team || '—'}
                        </span>
                      )}
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
                            <span
                              key={mod.key}
                              title={`${mod.labelEn}: ${ACCESS_LABELS[lvl]}`}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono font-bold border ${
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
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          p.active
                            ? 'bg-pzone-seagreen/15 text-pzone-seagreen'
                            : 'bg-pzone-crimson/15 text-pzone-crimson'
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
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
