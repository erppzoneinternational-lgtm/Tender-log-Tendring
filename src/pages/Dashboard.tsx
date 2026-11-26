import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Droplets,
  FilePlus2,
  FileSpreadsheet,
  FolderKanban,
  Layers,
  Lock,
  Shield,
  Sparkles,
  TrendingUp,
  UserPlus,
  Waves,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  startIntelligentTender,
  syncAllErpTendersAndCostsToTenderLog,
} from '@/lib/erpBridge';
import {
  canAccessErpEngineering,
  canAssignEngineers,
  canCreateTender,
  canEditComponents,
  canManageAdmin,
  canOpenIntelligentTender,
  canViewKanbanAndTeamManagement,
  canViewPrices,
} from '@/lib/permissions';
import {
  getAllAssignments,
  getAllComponents,
  getEngineerWorkloadSummary,
  getTenders,
  subscribeDataStore,
} from '@/lib/dataStore';
import { formatCurrency, formatNumber } from '@/lib/formulas';
import {
  CAIRO_TIMEZONE,
  formatDateDdMmYyyy,
  todayCairoIso,
} from '@/components/ui/DatePickerInput';
import { EngineerWorkloadAdvisor } from '@/components/ui/EngineerWorkloadAdvisor';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, language, resolvedDark } = useApp();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    void syncAllErpTendersAndCostsToTenderLog();
    return subscribeDataStore(() => setVersion((v) => v + 1));
  }, []);

  const latestTenders = useMemo(
    () => getTenders().filter((item) => item.is_latest_revision),
    [version]
  );
  const allAssignments = useMemo(() => getAllAssignments(), [version]);
  const allComponents = useMemo(() => getAllComponents(), [version]);
  const workloadSummaries = useMemo(
    () => getEngineerWorkloadSummary(),
    [version]
  );

  if (!user) return null;

  const todayStr = todayCairoIso();
  const todayMs = new Date(`${todayStr}T00:00:00Z`).getTime();

  const overdueTenders = latestTenders.filter(
    (item) =>
      !item.actual_sent_date &&
      item.expected_send_date &&
      item.expected_send_date < todayStr &&
      item.tender_status !== 'Sent to Client'
  );

  const dueSoonTenders = latestTenders.filter((item) => {
    if (
      item.actual_sent_date ||
      !item.expected_send_date ||
      item.tender_status === 'Sent to Client'
    ) {
      return false;
    }
    const expMs = new Date(`${item.expected_send_date}T00:00:00Z`).getTime();
    const diffDays = Math.round((expMs - todayMs) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  });

  const unassignedTenders = latestTenders.filter(
    (item) =>
      item.tender_status === 'New / Registered' ||
      (!item.responsible_civil_engineer_id &&
        !item.mechanical_pricing_responsible_id &&
        !item.electrical_pricing_responsible_id)
  );

  const myAssignments = allAssignments.filter((a) => a.user_id === user.id);

  // Live Pipeline & Hydro-Spec Telemetry
  const totalPipelineEgp = latestTenders.reduce(
    (s, item) => s + (item.tender_total_price || 0),
    0
  );
  const totalPipelineUsd = latestTenders.reduce(
    (s, item) => s + (item.tender_total_price_usd || 0),
    0
  );
  const totalWaterAreaM2 = latestTenders.reduce(
    (s, item) => s + (item.total_components_area_m2 || 0),
    0
  );
  const totalWaterVolumeM3 = latestTenders.reduce(
    (s, item) => s + (item.total_components_volume_m3 || 0),
    0
  );
  const awardedCount = latestTenders.filter(
    (item) => item.project_status === 'Awarded'
  ).length;

  const cairoHour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: CAIRO_TIMEZONE,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date())
  );
  const greeting =
    cairoHour < 12
      ? t('home.greetingMorning')
      : cairoHour < 18
      ? t('home.greetingAfternoon')
      : t('home.greetingEvening');

  const displayName =
    language === 'ar' && user.full_name_ar ? user.full_name_ar : user.full_name;

  const formattedDate = new Intl.DateTimeFormat(
    language === 'ar' ? 'ar-EG' : 'en-US',
    {
      timeZone: CAIRO_TIMEZONE,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  ).format(new Date());

  const roleCapabilities = [
    {
      label: t('home.canViewPrices'),
      allowed: canViewPrices(user.role),
    },
    {
      label: t('home.canCreateTender'),
      allowed: canCreateTender(user),
    },
    {
      label: t('home.canEditComponents'),
      allowed: canEditComponents(user, true),
    },
    {
      label: t('home.canAssignTasks'),
      allowed: canAssignEngineers(user),
    },
    {
      label: t('home.canManageAdmin'),
      allowed: canManageAdmin(user.role),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Bioluminescent Hydro-Command Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16234E] via-[#0B152C] to-[#070D1D] text-white border border-cyan-400/20 shadow-2xl p-6 sm:p-8 lg:p-10">
        {/* Top Iridescent 4-Ribbon Crown */}
        <div className="absolute inset-x-0 top-0 h-1 bg-ribbon-gradient" />

        {/* Ambient Bioluminescent Glows */}
        <div className="pointer-events-none absolute -top-24 -end-24 w-96 h-96 rounded-full bg-pzone-teal/30 blur-3xl animate-float-slow" />
        <div
          className="pointer-events-none absolute -bottom-28 start-1/4 w-80 h-80 rounded-full bg-pzone-magenta/20 blur-3xl animate-float-slow"
          style={{ animationDelay: '-4s' }}
        />

        {/* Kinetic Flowing Water SVG Wave Backdrop */}
        <svg
          className="pointer-events-none absolute bottom-0 inset-x-0 w-full h-36 opacity-20 text-cyan-300"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,128L48,122.7C96,117,192,107,288,112C384,117,480,139,576,149.3C672,160,768,160,864,138.7C960,117,1056,75,1152,69.3C1248,64,1344,96,1392,112L1440,128L1440,200L0,200Z"
          />
        </svg>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-cyan-100/80">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md font-mono text-[11px]">
                <Waves className="w-3.5 h-3.5 text-pzone-cyan" />
                {formattedDate}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pzone-teal/25 text-cyan-200 border border-cyan-400/30 font-semibold">
                <Shield className="w-3.5 h-3.5 text-pzone-cyan" />
                {t(`roles.${user.role}`)}
              </span>
              {user.role === 'viewer' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-semibold">
                  <Lock className="w-3 h-3" />
                  {t('topbar.readOnlyBadge')}
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              {greeting}،{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-amber-200 bg-clip-text text-transparent">
                {displayName}
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed">
              {t(`roleDescriptions.${user.role}`)}
            </p>

            {/* Action Deck Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {canCreateTender(user) && (
                <button
                  type="button"
                  onClick={() => navigate('/tenders/new')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-pzone-teal via-pzone-seagreen to-pzone-teal text-white font-bold text-xs sm:text-sm shadow-lg shadow-pzone-teal/35 hover:shadow-pzone-teal/55 hover:-translate-y-0.5 border border-white/25 transition-all"
                >
                  <FilePlus2 className="w-4 h-4" />
                  <span>{t('home.registerNewTender')}</span>
                </button>
              )}

              {canViewKanbanAndTeamManagement(user) && (
                <button
                  type="button"
                  onClick={() => navigate('/board')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md hover:-translate-y-0.5 transition-all"
                >
                  <FolderKanban className="w-4 h-4 text-pzone-cyan" />
                  <span>{t('home.openKanbanBoard')}</span>
                </button>
              )}

              {canOpenIntelligentTender(user) && (
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      canAccessErpEngineering(user)
                        ? '/erp/water-features'
                        : '/erp/commercial-bid'
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/30 border border-white/25 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>
                    {canAccessErpEngineering(user)
                      ? language === 'ar'
                        ? 'فتح محرك التسعير الذكي ERP'
                        : 'Intelligent Tendering ERP'
                      : language === 'ar'
                        ? 'المصاريف وسعر العطاء'
                        : 'Commercial Overheads'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-pzone-magenta/20 hover:bg-pzone-magenta/30 text-pink-100 font-bold text-xs sm:text-sm border border-pzone-magenta/40 backdrop-blur-md hover:-translate-y-0.5 transition-all"
              >
                <BarChart3 className="w-4 h-4 text-pink-300" />
                <span>{t('home.viewAnalytics')}</span>
              </button>
            </div>
          </div>

          {/* Right Live Hydro-Engineering Telemetry Reactor */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 shrink-0 xl:w-[410px]">
            <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-cyan-200/75 font-mono uppercase">
                <span>Pipeline (EGP)</span>
                <TrendingUp className="w-3.5 h-3.5 text-pzone-cyan" />
              </div>
              <div className="font-mono text-base sm:text-lg font-extrabold text-white truncate">
                {formatCurrency(totalPipelineEgp, 'EGP')}
              </div>
              <div className="font-mono text-xs text-cyan-300 font-semibold">
                {formatCurrency(totalPipelineUsd, 'USD')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-cyan-200/75 font-mono uppercase">
                <span>Water Surface</span>
                <Droplets className="w-3.5 h-3.5 text-pzone-cyan" />
              </div>
              <div className="font-mono text-base sm:text-lg font-extrabold text-white">
                {formatNumber(totalWaterAreaM2, 0)} m²
              </div>
              <div className="font-mono text-xs text-emerald-300 font-semibold">
                {formatNumber(totalWaterVolumeM3, 0)} m³ Volume
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-cyan-200/75 font-mono uppercase">
                <span>Hydro-Features</span>
                <Layers className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div className="font-mono text-lg font-extrabold text-white">
                {allComponents.length} Units
              </div>
              <div className="text-[11px] text-slate-300">
                Pools • Lagoons • Fountains
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl space-y-1">
              <div className="flex items-center justify-between text-[11px] text-cyan-200/75 font-mono uppercase">
                <span>Awarded Wins</span>
                <Award className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="font-mono text-lg font-extrabold text-emerald-300">
                {awardedCount} / {latestTenders.length}
              </div>
              <div className="text-[11px] text-slate-300">
                Active Proposals
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live "Needs Attention" Telemetry Pods */}
      <div
        className={`grid ${
          canViewKanbanAndTeamManagement(user) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
        } gap-4`}
      >
        <div
          onClick={() =>
            navigate(canViewKanbanAndTeamManagement(user) ? '/board' : '/tenders')
          }
          className="group cursor-pointer bg-card border border-border rounded-2xl p-5 flex items-center justify-between hover:border-rose-500/50 hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-pzone-crimson/20 border border-rose-500/30 text-rose-500 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                {t('home.overdueItems')}
              </div>
              <div className="text-2xl font-extrabold text-foreground font-mono">
                {overdueTenders.length}
              </div>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              overdueTenders.length > 0
                ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {overdueTenders.length > 0 ? 'Needs Action' : 'On Track'}
          </span>
        </div>

        <div
          onClick={() =>
            navigate(canViewKanbanAndTeamManagement(user) ? '/board' : '/tenders')
          }
          className="group cursor-pointer bg-card border border-border rounded-2xl p-5 flex items-center justify-between hover:border-pzone-orange/50 hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-pzone-orange/20 border border-pzone-orange/30 text-pzone-orange flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground">
                {t('home.dueSoonItems')}
              </div>
              <div className="text-2xl font-extrabold text-foreground font-mono">
                {dueSoonTenders.length}
              </div>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-pzone-orange/15 text-pzone-orange border border-pzone-orange/30">
            Next 48h
          </span>
        </div>

        {canViewKanbanAndTeamManagement(user) && (
          <div
            onClick={() => navigate('/tenders')}
            className="group cursor-pointer bg-card border border-border rounded-2xl p-5 flex items-center justify-between hover:border-pzone-teal/60 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pzone-teal/25 to-pzone-seagreen/20 border border-pzone-teal/35 text-pzone-teal flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground">
                  {t('home.unassignedItems')}
                </div>
                <div className="text-2xl font-extrabold text-foreground font-mono">
                  {unassignedTenders.length}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-pzone-teal/15 text-pzone-teal border border-pzone-teal/30">
              Assign Queue
            </span>
          </div>
        )}
      </div>

      {/* Main Content Grid: Recent Tenders + Role & My Tasks */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Recent Active Tenders */}
        <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-5 sm:p-6 space-y-4 border-ribbon-top">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-pzone-teal shrink-0" />
                <span>Active Tenders & Hydro-Proposals ({latestTenders.length})</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click any tender to inspect its 29-column Proposal Components, FX
                conversion, server document paths, and revision diff.
              </p>
            </div>
            <Link
              to="/tenders"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-pzone-teal/15 hover:bg-pzone-teal/25 border border-pzone-teal/30 text-xs font-bold text-pzone-teal transition-colors shrink-0 whitespace-nowrap self-start"
            >
              <span>Open Full 60-Column Log</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 pe-3 text-start whitespace-nowrap">Code</th>
                  <th className="py-3 px-3 text-start min-w-[200px] whitespace-nowrap">
                    Proposal & Water Features
                  </th>
                  <th className="py-3 px-3 text-start min-w-[140px] whitespace-nowrap">
                    Client / Owner
                  </th>
                  <th className="py-3 px-3 text-start whitespace-nowrap">Stage</th>
                  <th className="py-3 ps-3 text-end whitespace-nowrap">
                    Total EGP / USD
                  </th>
                  <th className="py-3 ps-3 text-end whitespace-nowrap">
                    Quick Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {latestTenders.slice(0, 6).map((item) => {
                  const statusLower = item.tender_status.toLowerCase();
                  const stageBadgeStyle = statusLower.includes('sent')
                    ? 'bg-indigo-500/15 text-indigo-500 dark:text-indigo-300 border-indigo-500/30'
                    : statusLower.startsWith('finished')
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                      : statusLower.includes('cancel') ||
                          statusLower.includes('waiting') ||
                          statusLower.includes('block')
                        ? 'bg-rose-500/15 text-rose-500 dark:text-rose-300 border-rose-500/30'
                        : statusLower === 'in progress'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                          : 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30';
                  const stageDotStyle = statusLower.includes('sent')
                    ? 'bg-indigo-500'
                    : statusLower.startsWith('finished')
                      ? 'bg-emerald-500'
                      : statusLower.includes('cancel') ||
                          statusLower.includes('waiting') ||
                          statusLower.includes('block')
                        ? 'bg-rose-500'
                        : statusLower === 'in progress'
                          ? 'bg-amber-500'
                          : 'bg-sky-500';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/tenders/${item.id}`)}
                      className="group align-middle cursor-pointer hover:bg-pzone-teal/[0.06] transition-colors"
                    >
                      <td className="py-3.5 pe-3 font-mono font-bold text-pzone-teal whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="group-hover:underline">
                            {item.proposal_code}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                            R{String(item.proposal_rev).padStart(2, '0')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="group-hover:text-pzone-teal transition-colors">
                            {item.proposal_name}
                          </span>
                          {item.project_status === 'Awarded' && (
                            <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          )}
                        </div>
                        {item.components_summary && (
                          <span className="block text-[11px] font-mono text-muted-foreground mt-0.5 leading-relaxed">
                            {item.components_summary}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-muted-foreground font-medium">
                        {item.owner}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${stageBadgeStyle}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${stageDotStyle}`}
                          />
                          {item.tender_status}
                        </span>
                      </td>
                      <td className="py-3.5 ps-3 text-end font-mono whitespace-nowrap">
                        <div className="font-bold text-foreground">
                          {formatCurrency(item.tender_total_price, 'EGP')}
                        </div>
                        <div className="text-[11px] font-semibold text-pzone-teal mt-0.5">
                          {formatCurrency(item.tender_total_price_usd, 'USD')}
                        </div>
                      </td>
                      <td
                        className="py-3.5 ps-3 text-end whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          {canOpenIntelligentTender(user) && (
                            <button
                              type="button"
                              onClick={async () => {
                                const route = await startIntelligentTender(item, user);
                                navigate(route);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pzone-teal to-pzone-seagreen hover:opacity-95 text-white text-[11px] font-bold shadow-xs border border-white/20 transition-all whitespace-nowrap cursor-pointer"
                              title={
                                canAccessErpEngineering(user)
                                  ? 'Start Intelligent Tender in ERP Engine'
                                  : 'Open Commercial Overheads & Bid Price'
                              }
                            >
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span>
                                {canAccessErpEngineering(user)
                                  ? language === 'ar'
                                    ? 'التسعير الذكي'
                                    : 'Intelligent Tender'
                                  : language === 'ar'
                                    ? 'المصاريف وسعر العطاء'
                                    : 'Overheads'}
                              </span>
                            </button>
                          )}

                          {canAssignEngineers(user) && (
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/tenders/${item.id}?tab=tasks`)
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pzone-teal/15 hover:bg-pzone-teal text-pzone-teal hover:text-white text-[11px] font-bold border border-pzone-teal/30 transition-colors whitespace-nowrap"
                            >
                              <UserPlus className="w-3.5 h-3.5 shrink-0" />
                              <span>Assign Team</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 cols: Engineer Workload Advisor (for Tender Manager) / My Discipline Tasks & Role Matrix */}
        <div className="lg:col-span-4 space-y-5">
          {canAssignEngineers(user) && (
            <div className="bg-card border border-border rounded-3xl p-5 space-y-3 border-ribbon-top">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-pzone-teal" />
                  Engineer Workload Overview
                </h3>
                <Link
                  to="/board"
                  className="text-xs font-bold text-pzone-teal hover:underline"
                >
                  Tasks & Pricing →
                </Link>
              </div>
              <EngineerWorkloadAdvisor
                summaries={workloadSummaries}
                title="Proposals per Engineer"
                subtitle="Compare Not Started, In Progress, and Finished loads before assigning."
              />
            </div>
          )}

          {canViewKanbanAndTeamManagement(user) && myAssignments.length > 0 && (
            <div className="bg-card border border-border rounded-3xl p-5 space-y-3 border-ribbon-top">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pzone-teal" />
                  My Discipline Assignments ({myAssignments.length})
                </h3>
                <Link
                  to="/board"
                  className="text-xs font-bold text-pzone-teal hover:underline"
                >
                  Kanban Board
                </Link>
              </div>
              <div className="space-y-2">
                {myAssignments.map((asg) => {
                  const tnd = latestTenders.find((x) => x.id === asg.tender_id);
                  if (!tnd) return null;
                  return (
                    <Link
                      key={asg.id}
                      to={`/tenders/${tnd.id}`}
                      className="block p-3.5 rounded-2xl bg-muted/40 border border-border hover:border-pzone-teal/50 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-pzone-teal">
                          {tnd.proposal_code}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pzone-teal/15 text-pzone-teal border border-pzone-teal/30">
                          {asg.discipline}: {asg.status}
                        </span>
                      </div>
                      <div className="font-semibold text-foreground mt-1 truncate">
                        {tnd.proposal_name}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] font-tabular text-muted-foreground">
                        <span>
                          Assigned: {formatDateDdMmYyyy(asg.assigned_at || asg.created_at)}
                        </span>
                        {tnd.expected_send_date && (
                          <span>Due: {formatDateDdMmYyyy(tnd.expected_send_date)}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role Capabilities Hologram Card */}
          <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold text-foreground">
                {t('home.roleAccessMatrix')}
              </h2>
              <img
                src={
                  resolvedDark
                    ? '/brand/Company_Horizontal_Logo_Logo__White_.png'
                    : '/brand/Horizontal_Logo__black_.png'
                }
                alt="P.ZONE"
                className="h-6 w-auto object-contain"
              />
            </div>
            <div className="space-y-2">
              {roleCapabilities.map((cap) => (
                <div
                  key={cap.label}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border text-xs"
                >
                  <span className="font-medium text-foreground">{cap.label}</span>
                  {cap.allowed ? (
                    <CheckCircle2 className="w-4 h-4 text-pzone-seagreen shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
