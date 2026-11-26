import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  BarChart3,
  Clock,
  DollarSign,
  Filter,
  Send,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  getAllComponents,
  getLookupLabel,
  getLookupsByCategory,
  getProfileName,
  getProfiles,
  getTenders,
  isUserAssignedToTender,
  subscribeDataStore,
} from '@/lib/dataStore';
import { formatCurrency, formatNumber } from '@/lib/formulas';
import {
  canViewKanbanAndTeamManagement,
  isAssignableEngineerOrManager,
} from '@/lib/permissions';

const CHART_COLORS = [
  '#1E9090',
  '#45B5AA',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#EC4899',
];

export const ExecutiveDashboard: React.FC = () => {
  const { user, lang } = useApp();
  const canSeeTeam = user ? canViewKanbanAndTeamManagement(user) : false;
  const [version, setVersion] = useState(0);

  const [yearFilter, setYearFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('');
  const [salesRepFilter, setSalesRepFilter] = useState<string>('');
  const [engineerFilter, setEngineerFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [latestOnly, setLatestOnly] = useState<boolean>(true);

  useEffect(() => {
    return subscribeDataStore(() => setVersion((v) => v + 1));
  }, []);

  const allTenders = useMemo(() => getTenders(), [version]);
  const allComponents = useMemo(() => getAllComponents(), [version]);
  const areas = useMemo(() => getLookupsByCategory('area'), [version]);
  const salesReps = useMemo(
    () => getLookupsByCategory('sales_representative'),
    [version]
  );
  const engineers = useMemo(
    () =>
      getProfiles().filter(
        (p) => p.active && isAssignableEngineerOrManager(p)
      ),
    [version]
  );

  const filteredTenders = useMemo(() => {
    return allTenders.filter((t) => {
      if (latestOnly && !t.is_latest_revision) return false;
      if (yearFilter !== 'all' && String(t.year) !== yearFilter) return false;
      if (areaFilter && t.area !== areaFilter) return false;
      if (salesRepFilter && t.sales_representative_id !== salesRepFilter) {
        return false;
      }
      if (engineerFilter && !isUserAssignedToTender(engineerFilter, t.id)) {
        return false;
      }
      if (statusFilter && t.tender_status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [
    allTenders,
    latestOnly,
    yearFilter,
    areaFilter,
    salesRepFilter,
    engineerFilter,
    statusFilter,
  ]);

  // Core KPIs
  const kpis = useMemo(() => {
    const totalReceived = filteredTenders.length;
    const sentTenders = filteredTenders.filter(
      (t) => t.actual_sent_date || t.tender_status === 'Sent to Client'
    );
    const awardedTenders = filteredTenders.filter(
      (t) => t.project_status === 'Awarded'
    );
    const lostTenders = filteredTenders.filter(
      (t) => t.project_status === 'Lost'
    );

    const totalPipelineEgp = filteredTenders.reduce(
      (s, t) => s + (t.tender_total_price || 0),
      0
    );
    const totalPipelineUsd = filteredTenders.reduce(
      (s, t) => s + (t.tender_total_price_usd || 0),
      0
    );

    const awardedEgp = awardedTenders.reduce(
      (s, t) =>
        s + (t.final_pr_contract_total_price || t.tender_total_price || 0),
      0
    );
    const awardedUsd = awardedTenders.reduce(
      (s, t) =>
        s + (t.pr_contract_total_price_usd || t.tender_total_price_usd || 0),
      0
    );

    const lostEgp = lostTenders.reduce(
      (s, t) => s + (t.tender_total_price || 0),
      0
    );
    const decidedCount = awardedTenders.length + lostTenders.length;
    const decidedEgp = awardedEgp + lostEgp;
    const winRateByCount =
      decidedCount > 0 ? (awardedTenders.length / decidedCount) * 100 : 0;
    const winRateByValue =
      decidedEgp > 0 ? (awardedEgp / decidedEgp) * 100 : 0;

    const avgDelayDays =
      filteredTenders.length > 0
        ? filteredTenders.reduce((s, t) => s + (t.delayed_days || 0), 0) /
          filteredTenders.length
        : 0;

    return {
      totalReceived,
      sentCount: sentTenders.length,
      awardedCount: awardedTenders.length,
      lostCount: lostTenders.length,
      totalPipelineEgp,
      totalPipelineUsd,
      awardedEgp,
      awardedUsd,
      winRateByCount,
      winRateByValue,
      avgDelayDays,
    };
  }, [filteredTenders]);

  // Monthly distribution chart data
  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      { month: string; count: number; valueMnEgp: number; valueKUsd: number }
    >();
    for (const t of filteredTenders) {
      const ym = (t.received_date || '2026-01').slice(0, 7);
      const cur = map.get(ym) || {
        month: ym,
        count: 0,
        valueMnEgp: 0,
        valueKUsd: 0,
      };
      cur.count += 1;
      cur.valueMnEgp = Number(
        (cur.valueMnEgp + (t.tender_total_price || 0) / 1_000_000).toFixed(2)
      );
      cur.valueKUsd = Number(
        (cur.valueKUsd + (t.tender_total_price_usd || 0) / 1_000).toFixed(1)
      );
      map.set(ym, cur);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }, [filteredTenders]);

  // Area distribution data
  const areaChartData = useMemo(() => {
    const map = new Map<string, { name: string; valueMnEgp: number; count: number }>();
    for (const t of filteredTenders) {
      const areaName = t.area || 'Other';
      const cur = map.get(areaName) || {
        name: areaName,
        valueMnEgp: 0,
        count: 0,
      };
      cur.count += 1;
      cur.valueMnEgp = Number(
        (cur.valueMnEgp + (t.tender_total_price || 0) / 1_000_000).toFixed(2)
      );
      map.set(areaName, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.valueMnEgp - a.valueMnEgp);
  }, [filteredTenders]);

  // Status Funnel Data (Section 5.6)
  const funnelData = useMemo(() => {
    const received = filteredTenders.length;
    const assigned = filteredTenders.filter(
      (t) =>
        t.tender_status !== 'New / Registered' &&
        t.tender_status !== 'New / Unassigned' &&
        t.tender_status !== 'Cancelled / Apologized'
    ).length;
    const inProgress = filteredTenders.filter((t) =>
      [
        'In Progress',
        'Waiting for Info / Blocked',
        'Waiting on Info',
        'Finished (Ready to Send)',
        'Sent to Client',
      ].includes(t.tender_status)
    ).length;
    const finished = filteredTenders.filter((t) =>
      ['Finished (Ready to Send)', 'Sent to Client'].includes(t.tender_status)
    ).length;
    const sent = filteredTenders.filter(
      (t) => t.actual_sent_date || t.tender_status === 'Sent to Client'
    ).length;
    const awarded = filteredTenders.filter(
      (t) => t.project_status === 'Awarded'
    ).length;

    return [
      { stage: 'Received', count: received },
      { stage: 'Assigned', count: assigned },
      { stage: 'In Progress', count: inProgress },
      { stage: 'Finished', count: finished },
      { stage: 'Sent', count: sent },
      { stage: 'Awarded', count: awarded },
    ];
  }, [filteredTenders]);

  // Engineer Workload & Delay Analytics (Section 5.6)
  const engineerStats = useMemo(() => {
    return engineers.map((eng) => {
      const rows = filteredTenders.filter((t) =>
        isUserAssignedToTender(eng.id, t.id)
      );
      const active = rows.filter(
        (t) => !t.actual_sent_date && t.tender_status !== 'Sent to Client'
      ).length;
      const completed = rows.filter(
        (t) => t.actual_sent_date || t.tender_status === 'Sent to Client'
      ).length;
      const avgDelay =
        rows.length > 0
          ? Number(
              (
                rows.reduce((s, t) => s + (t.delayed_days || 0), 0) /
                rows.length
              ).toFixed(1)
            )
          : 0;
      const totalEgp = rows.reduce(
        (s, t) => s + (t.tender_total_price || 0),
        0
      );
      return {
        name: eng.full_name.replace(/^Eng\.\s*/i, ''),
        fullName: eng.full_name,
        team: eng.team,
        active,
        completed,
        avgDelay,
        totalEgp,
      };
    });
  }, [engineers, filteredTenders]);

  // Pipeline Value by Owner / Developer (Section 5.6)
  const ownerChartData = useMemo(() => {
    const map = new Map<
      string,
      { owner: string; count: number; valueMnEgp: number; awardedCount: number }
    >();
    for (const t of filteredTenders) {
      const cur = map.get(t.owner) || {
        owner: t.owner,
        count: 0,
        valueMnEgp: 0,
        awardedCount: 0,
      };
      cur.count += 1;
      cur.valueMnEgp = Number(
        (cur.valueMnEgp + (t.tender_total_price || 0) / 1_000_000).toFixed(2)
      );
      if (t.project_status === 'Awarded') cur.awardedCount += 1;
      map.set(t.owner, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.valueMnEgp - a.valueMnEgp);
  }, [filteredTenders]);

  // Water Feature Unit Cost Benchmarks (Section 5.6)
  const benchmarks = useMemo(() => {
    const validTenderIds = new Set(filteredTenders.map((t) => t.id));
    const comps = allComponents.filter((c) => validTenderIds.has(c.tender_id));

    const groups = new Map<
      string,
      {
        waterFeatureType: string;
        proposalType: string;
        count: number;
        totalArea: number;
        totalVol: number;
        totalPriceEgp: number;
      }
    >();

    for (const c of comps) {
      const pType = c.proposal_type || 'Full Turnkey (Civil + MEP)';
      const compLabel = (c.water_feature || c.water_feature_type || 'Unspecified').trim();
      const key = `${compLabel}__${pType}`;
      const existing = groups.get(key) || {
        waterFeatureType: compLabel,
        proposalType: pType,
        count: 0,
        totalArea: 0,
        totalVol: 0,
        totalPriceEgp: 0,
      };
      existing.count += c.qty_same_specs || 1;
      existing.totalArea += c.total_area_m2 || 0;
      existing.totalVol += c.total_volume_m3 || 0;
      existing.totalPriceEgp += c.total_price || 0;
      groups.set(key, existing);
    }

    return Array.from(groups.values()).map((g) => ({
      ...g,
      avgPerM2: g.totalArea > 0 ? g.totalPriceEgp / g.totalArea : null,
      avgPerM3: g.totalVol > 0 ? g.totalPriceEgp / g.totalVol : null,
    }));
  }, [filteredTenders, allComponents]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter Bar */}
      <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-500" />
              Executive Analytics & Water Feature Benchmarks
            </h1>
            <p className="text-xs text-slate-500">
              {canSeeTeam
                ? 'Live EGP & USD pipeline KPIs, conversion rates, engineer workload, and unit cost benchmarks per m² and m³.'
                : 'Live EGP & USD pipeline KPIs, conversion rates, and unit cost benchmarks per m² and m³.'}
            </p>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20">
            <input
              type="checkbox"
              checked={latestOnly}
              onChange={(e) => setLatestOnly(e.target.checked)}
              className="rounded text-brand-500"
            />
            Latest Revision Only (Prevent Double Counting)
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-[#1E2D3D]">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-1.5 text-xs font-mono"
          >
            <option value="all">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-1.5 text-xs"
          >
            <option value="">All Geographic Areas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.label_en}>
                {a.label_en}
              </option>
            ))}
          </select>

          <select
            value={salesRepFilter}
            onChange={(e) => setSalesRepFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-1.5 text-xs"
          >
            <option value="">All Sales Representatives</option>
            {salesReps.map((sr) => (
              <option key={sr.id} value={sr.id}>
                {sr.label_en}
              </option>
            ))}
          </select>

          {canSeeTeam && (
            <select
              value={engineerFilter}
              onChange={(e) => setEngineerFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-1.5 text-xs"
            >
              <option value="">All Engineers</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.full_name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-1.5 text-xs"
          >
            <option value="">All Statuses</option>
            {[
              'New / Unassigned',
              'Assigned',
              'In Progress',
              'Waiting on Info',
              'Finished (Ready to Send)',
              'Sent to Client',
              'On Hold',
              'Cancelled',
            ].map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tenders Received</span>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {kpis.totalReceived}
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Sent: {kpis.sentCount}Proposals
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-brand-500" />
          </div>
          <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
            {formatCurrency(kpis.totalPipelineEgp, 'EGP')}
          </div>
          <div className="font-mono text-xs font-semibold text-brand-500">
            {formatCurrency(kpis.totalPipelineUsd, 'USD')}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Awarded Contracts ({kpis.awardedCount})</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-mono text-base font-bold text-emerald-500">
            {formatCurrency(kpis.awardedEgp, 'EGP')}
          </div>
          <div className="font-mono text-xs text-emerald-400">
            {formatCurrency(kpis.awardedUsd, 'USD')}
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Win Rate (Count / Value)</span>
            <Send className="w-4 h-4 text-teal-400" />
          </div>
          <div className="font-mono text-xl font-bold text-slate-900 dark:text-white">
            {kpis.winRateByCount.toFixed(1)}%{' '}
            <span className="text-xs font-normal text-brand-500">
              ({kpis.winRateByValue.toFixed(1)}% val)
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            {kpis.awardedCount} Won vs {kpis.lostCount} Lost
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Turnaround Delay</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
            {kpis.avgDelayDays.toFixed(1)} d
          </div>
          <div className="text-[11px] text-slate-500">
            Across {filteredTenders.length} tenders
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Monthly Pipeline Value (Million EGP & Thousand USD)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="valueMnEgp"
                  name="Value (Mn EGP)"
                  fill="#1E9090"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="count"
                  name="Tender Count"
                  fill="#45B5AA"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Pipeline Value by Geographic Area (Million EGP)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={areaChartData}
                  dataKey="valueMnEgp"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  label={({ name, value }) => `${name}: ${value}M`}
                >
                  {areaChartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Water Feature Unit Cost Benchmarks Table (Section 5.6) */}
      <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Waves className="w-4 h-4 text-brand-500" />
              Water Feature Unit Price Benchmarks (per m² and per m³)
            </h2>
            <p className="text-xs text-slate-500">
              Calculated live from Proposal Components across matching tenders.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B1218] border-b border-slate-200 dark:border-[#1E2D3D] text-[11px] font-bold uppercase text-slate-500">
                <th className="p-3">Water Feature Type</th>
                <th className="p-3">Proposal Scope</th>
                <th className="p-3 text-right">Units Count</th>
                <th className="p-3 text-right">Total Area (m²)</th>
                <th className="p-3 text-right">Total Volume (m³)</th>
                <th className="p-3 text-right">Avg Price / m² (EGP)</th>
                <th className="p-3 text-right">Avg Price / m³ (EGP)</th>
                <th className="p-3 text-right">Total Value (EGP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D] font-mono">
              {benchmarks.map((b, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50 dark:hover:bg-[#162332]"
                >
                  <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">
                    {b.waterFeatureType}
                  </td>
                  <td className="p-3 font-sans">{b.proposalType}</td>
                  <td className="p-3 text-right">{b.count}</td>
                  <td className="p-3 text-right">{formatNumber(b.totalArea)}</td>
                  <td className="p-3 text-right">{formatNumber(b.totalVol)}</td>
                  <td className="p-3 text-right font-bold text-brand-500">
                    {b.avgPerM2 ? `${formatNumber(b.avgPerM2, 0)} EGP/m²` : '—'}
                  </td>
                  <td className="p-3 text-right font-bold text-teal-400">
                    {b.avgPerM3 ? `${formatNumber(b.avgPerM3, 0)} EGP/m³` : '—'}
                  </td>
                  <td className="p-3 text-right font-bold">
                    {formatCurrency(b.totalPriceEgp, 'EGP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Funnel & Engineer Workload Charts Row */}
      <div
        className={`grid grid-cols-1 ${
          canSeeTeam ? 'lg:grid-cols-2' : ''
        } gap-6`}
      >
        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Tender Conversion Funnel (Received → Sent → Awarded)
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" />
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  stroke="#94A3B8"
                  fontSize={11}
                  width={80}
                />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Tenders"
                  fill="#1E9090"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {canSeeTeam && (
          <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Workload & Avg Delay per Engineer
            </h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engineerStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D3D" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="active"
                    name="Active Tenders"
                    fill="#1E9090"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed / Sent"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="avgDelay"
                    name="Avg Delay (Days)"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Value by Owner / Client & Sales Rep Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Pipeline Value by Owner / Developer
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B1218] border-b border-slate-200 dark:border-[#1E2D3D] text-[11px] font-bold uppercase text-slate-500">
                  <th className="p-3">Owner / Developer</th>
                  <th className="p-3 text-right">Tenders</th>
                  <th className="p-3 text-right">Awarded</th>
                  <th className="p-3 text-right">Value (Mn EGP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D] font-mono">
                {ownerChartData.map((o) => (
                  <tr key={o.owner}>
                    <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">
                      {o.owner}
                    </td>
                    <td className="p-3 text-right">{o.count}</td>
                    <td className="p-3 text-right text-emerald-500 font-bold">
                      {o.awardedCount}
                    </td>
                    <td className="p-3 text-right font-bold text-brand-500">
                      {o.valueMnEgp.toFixed(2)}M EGP
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sales Rep & Engineer Performance Breakdown */}
        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Sales Representative Pipeline Summary
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0B1218] border-b border-slate-200 dark:border-[#1E2D3D] text-[11px] font-bold uppercase text-slate-500">
                  <th className="p-3">Sales Representative</th>
                  <th className="p-3 text-right">Tenders</th>
                  <th className="p-3 text-right">Awarded</th>
                  <th className="p-3 text-right">Total Pipeline (EGP)</th>
                  <th className="p-3 text-right">Total Pipeline (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D] font-mono">
                {salesReps.map((sr) => {
                  const rows = filteredTenders.filter(
                    (t) => t.sales_representative_id === sr.id
                  );
                  const won = rows.filter(
                    (t) => t.project_status === 'Awarded'
                  ).length;
                  const sumEgp = rows.reduce(
                    (s, t) => s + (t.tender_total_price || 0),
                    0
                  );
                  const sumUsd = rows.reduce(
                    (s, t) => s + (t.tender_total_price_usd || 0),
                    0
                  );
                  return (
                    <tr key={sr.id}>
                      <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">
                        {getLookupLabel(sr.id, lang)}
                      </td>
                      <td className="p-3 text-right">{rows.length}</td>
                      <td className="p-3 text-right text-emerald-500 font-bold">
                        {won}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(sumEgp, 'EGP')}
                      </td>
                      <td className="p-3 text-right text-brand-500">
                        {formatCurrency(sumUsd, 'USD')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
