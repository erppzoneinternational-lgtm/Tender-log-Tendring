import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Download,
  FileSpreadsheet,
  History,
  Printer,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  clearAuditLogs,
  getAllComponents,
  getAuditLogs,
  getLookupLabel,
  getLookupsByCategory,
  getProfileName,
  getProfiles,
  getTenders,
  isUserAssignedToTender,
  subscribeDataStore,
} from '@/lib/dataStore';
import {
  formatCurrency,
  formatNumber,
  sanitizeSpreadsheetRow,
} from '@/lib/formulas';
import {
  canManageAdmin,
  canViewKanbanAndTeamManagement,
  isAssignableEngineerOrManager,
} from '@/lib/permissions';
import {
  DatePickerInput,
  formatDateDdMmYyyy,
  formatDateTimeCairo,
  nowCairoIso,
  todayCairoIso,
} from '@/components/ui/DatePickerInput';
import type { Tender } from '@/types/database';

type DateFieldType =
  | 'received_date'
  | 'actual_sent_date'
  | 'contract_date'
  | 'created_at';

function getTenderDateValue(t: Tender, field: DateFieldType): string | null {
  if (field === 'received_date') return t.received_date || null;
  if (field === 'actual_sent_date') return t.actual_sent_date || null;
  if (field === 'contract_date') {
    return t.pr_contract_date || t.contract_date || null;
  }
  if (!t.created_at) return null;
  const parsed = new Date(t.created_at);
  return Number.isNaN(parsed.getTime())
    ? t.created_at.slice(0, 10)
    : nowCairoIso(parsed).slice(0, 10);
}

export const PeriodReports: React.FC = () => {
  const { user, lang } = useApp();
  const isAppAdmin = user ? canManageAdmin(user.role) : false;
  const canSeeTeam = user ? canViewKanbanAndTeamManagement(user) : false;
  const [version, setVersion] = useState(0);

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [dateField, setDateField] = useState<DateFieldType>('received_date');

  useEffect(() => {
    return subscribeDataStore(() => setVersion((v) => v + 1));
  }, []);

  const allTenders = useMemo(
    () => getTenders().filter((t) => t.is_latest_revision),
    [version]
  );
  const allComponents = useMemo(() => getAllComponents(), [version]);
  const allLogs = useMemo(() => getAuditLogs(), [version]);

  // Compute current period and previous period of equal length
  const { currentTenders, prevTenders, daysSpan } = useMemo(() => {
    const sMs = new Date(`${startDate}T00:00:00Z`).getTime();
    const eMs = new Date(`${endDate}T23:59:59Z`).getTime();
    const spanMs = Math.max(eMs - sMs, 24 * 60 * 60 * 1000);
    const days = Math.max(1, Math.round(spanMs / (1000 * 60 * 60 * 24)));

    const prevEndMs = sMs - 1000;
    const prevStartMs = prevEndMs - spanMs;
    const prevStartStr = new Date(prevStartMs).toISOString().slice(0, 10);
    const prevEndStr = new Date(prevEndMs).toISOString().slice(0, 10);

    const cur = allTenders.filter((t) => {
      const d = getTenderDateValue(t, dateField);
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });

    const prev = allTenders.filter((t) => {
      const d = getTenderDateValue(t, dateField);
      if (!d) return false;
      return d >= prevStartStr && d <= prevEndStr;
    });

    return { currentTenders: cur, prevTenders: prev, daysSpan: days };
  }, [allTenders, startDate, endDate, dateField]);

  const metrics = useMemo(() => {
    const sumEgp = currentTenders.reduce(
      (s, t) => s + (t.tender_total_price || 0),
      0
    );
    const sumUsd = currentTenders.reduce(
      (s, t) => s + (t.tender_total_price_usd || 0),
      0
    );
    const prevEgp = prevTenders.reduce(
      (s, t) => s + (t.tender_total_price || 0),
      0
    );

    const countDeltaPct =
      prevTenders.length > 0
        ? ((currentTenders.length - prevTenders.length) / prevTenders.length) *
          100
        : 100;

    const valueDeltaPct =
      prevEgp > 0 ? ((sumEgp - prevEgp) / prevEgp) * 100 : 100;

    const awarded = currentTenders.filter(
      (t) => t.project_status === 'Awarded'
    );
    const lost = currentTenders.filter((t) => t.project_status === 'Lost');
    const pending = currentTenders.filter(
      (t) =>
        !t.project_status ||
        t.project_status === 'Under Client Evaluation' ||
        t.project_status === 'Under Evaluation'
    );
    const sent = currentTenders.filter(
      (t) => t.actual_sent_date || t.tender_status === 'Sent to Client'
    );
    const avgDelayDays =
      currentTenders.length > 0
        ? currentTenders.reduce((s, t) => s + (t.delayed_days || 0), 0) /
          currentTenders.length
        : 0;
    const revisionsIssued = currentTenders.filter(
      (t) => t.proposal_rev > 0
    ).length;

    return {
      count: currentTenders.length,
      prevCount: prevTenders.length,
      countDeltaPct,
      sumEgp,
      sumUsd,
      prevEgp,
      valueDeltaPct,
      awardedCount: awarded.length,
      lostCount: lost.length,
      pendingCount: pending.length,
      sentCount: sent.length,
      avgDelayDays,
      revisionsIssued,
    };
  }, [currentTenders, prevTenders]);

  // Breakdown by Owner
  const ownerBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { owner: string; count: number; totalEgp: number; totalUsd: number }
    >();
    for (const t of currentTenders) {
      const cur = map.get(t.owner) || {
        owner: t.owner,
        count: 0,
        totalEgp: 0,
        totalUsd: 0,
      };
      cur.count += 1;
      cur.totalEgp += t.tender_total_price || 0;
      cur.totalUsd += t.tender_total_price_usd || 0;
      map.set(t.owner, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.totalEgp - a.totalEgp);
  }, [currentTenders]);

  // Breakdown by Water Feature Type
  const waterFeatureBreakdown = useMemo(() => {
    const validIds = new Set(currentTenders.map((t) => t.id));
    const comps = allComponents.filter((c) => validIds.has(c.tender_id));
    const map = new Map<
      string,
      { type: string; qty: number; area: number; totalEgp: number }
    >();
    for (const c of comps) {
      const compLabel = (c.water_feature || c.water_feature_type || 'Unspecified').trim();
      const cur = map.get(compLabel) || {
        type: compLabel,
        qty: 0,
        area: 0,
        totalEgp: 0,
      };
      cur.qty += c.qty_same_specs || 1;
      cur.area += c.total_area_m2 || 0;
      cur.totalEgp += c.total_price || 0;
      map.set(compLabel, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.totalEgp - a.totalEgp);
  }, [currentTenders, allComponents]);

  // Period Audit Timeline (App Admin Only)
  const periodLogs = useMemo(() => {
    if (!isAppAdmin) return [];
    return allLogs.filter((l) => {
      const d = l.timestamp.slice(0, 10);
      return d >= startDate && d <= endDate;
    });
  }, [allLogs, startDate, endDate, isAppAdmin]);

  const handleExportExcel = () => {
    const rows = currentTenders.map((t) =>
      sanitizeSpreadsheetRow({
        'Proposal Code': t.proposal_code,
        Rev: t.proposal_rev,
        'Proposal Name': t.proposal_name,
        Owner: t.owner,
        Contractor: t.contractor,
        Country: t.country || '',
        Governorate: t.governorate || '',
        Area: t.area || '',
        District: t.district || '',
        'Sales Rep': getLookupLabel(t.sales_representative_id, 'en'),
        'Received Date': formatDateDdMmYyyy(t.received_date, ''),
        'Expected Send Date': formatDateDdMmYyyy(t.expected_send_date, ''),
        Deadline: formatDateDdMmYyyy(t.deadline_date, ''),
        'Sent Date': formatDateDdMmYyyy(t.actual_sent_date, ''),
        Status: t.tender_status,
        'Project Decision': t.project_status || '',
        'Total Area m2': t.total_components_area_m2,
        'Total Volume m3': t.total_components_volume_m3,
        'Total Price EGP': t.tender_total_price,
        'FX Rate': t.exchange_rate_on_sent_date || '',
        'Total Price USD': t.tender_total_price_usd || '',
        ...(canSeeTeam
          ? {
              'Civil Responsible': getProfileName(
                t.responsible_civil_engineer_id,
                'en'
              ),
              'Mechanical Pricing Responsible': getProfileName(
                t.mechanical_pricing_responsible_id,
                'en'
              ),
              'Electrical Pricing Responsible': getProfileName(
                t.electrical_pricing_responsible_id,
                'en'
              ),
            }
          : {}),
      })
    );

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Period Report');
    XLSX.writeFile(
      wb,
      `PZONE_Period_Report_${startDate}_to_${endDate}.xlsx`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Print-Only Header with Black Horizontal Logo (Section 2.1) */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
        <img
          src="/brand/Horizontal_Logo__black_.png"
          alt="P.ZONE"
          className="h-10 object-contain"
        />
        <div className="text-right">
          <h1 className="text-lg font-bold text-slate-900">
            Tender Log Period Report ({formatDateDdMmYyyy(startDate)} to{' '}
            {formatDateDdMmYyyy(endDate)})
          </h1>
          <p className="text-xs text-slate-600">
            Generated on {formatDateDdMmYyyy(todayCairoIso())}
          </p>
        </div>
      </div>

      {/* Interactive Controls Header */}
      <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-brand-500" />
              Period Reports & Executive Export (Start Date → End Date)
            </h1>
            <p className="text-xs text-slate-500">
              Compare any date range against the previous period of equal length ({daysSpan}{' '}
              days), inspect breakdowns, and export to Excel or PDF.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel (.xlsx)
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xs"
            >
              <Printer className="w-4 h-4" /> Print / PDF Report
            </button>
          </div>
        </div>

        {/* Date Pickers & Presets */}
        <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-slate-100 dark:border-[#1E2D3D]">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Date Basis Field
            </label>
            <select
              value={dateField}
              onChange={(e) => setDateField(e.target.value as DateFieldType)}
              className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-1.5 text-xs"
            >
              <option value="received_date">Received Date</option>
              <option value="actual_sent_date">Actual Sent Date</option>
              <option value="contract_date">Contract Date</option>
              <option value="created_at">Entered / Created Date</option>
            </select>
          </div>

          <div className="w-40">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Start Date
            </label>
            <DatePickerInput
              value={startDate}
              onChange={(iso) => iso && setStartDate(iso)}
            />
          </div>

          <div className="w-40">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              End Date
            </label>
            <DatePickerInput
              value={endDate}
              onChange={(iso) => iso && setEndDate(iso)}
            />
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => {
                setStartDate('2026-10-01');
                setEndDate('2026-11-30');
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#0B1218] hover:bg-brand-500/15 hover:text-brand-500"
            >
              Q4 2026
            </button>
            <button
              onClick={() => {
                setStartDate('2026-01-01');
                setEndDate('2026-12-31');
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#0B1218] hover:bg-brand-500/15 hover:text-brand-500"
            >
              Full Year 2026
            </button>
            <button
              onClick={() => {
                setStartDate('2024-01-01');
                setEndDate('2026-12-31');
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#0B1218] hover:bg-brand-500/15 hover:text-brand-500"
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* Period Summary KPIs with Previous-Period Delta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-1">
          <span className="text-xs text-slate-400">Tenders in Period</span>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
              {metrics.count}
            </span>
            <span
              className={`inline-flex items-center text-xs font-mono font-bold ${
                metrics.countDeltaPct >= 0
                  ? 'text-emerald-500'
                  : 'text-rose-500'
              }`}
            >
              {metrics.countDeltaPct >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {Math.abs(metrics.countDeltaPct).toFixed(0)}% vs prev ({metrics.prevCount})
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-1">
          <span className="text-xs text-slate-400">Period Value (EGP)</span>
          <div className="font-mono text-base font-bold text-slate-900 dark:text-white">
            {formatCurrency(metrics.sumEgp, 'EGP')}
          </div>
          <span
            className={`inline-flex items-center text-[11px] font-mono font-semibold ${
              metrics.valueDeltaPct >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {metrics.valueDeltaPct >= 0 ? '+' : ''}
            {metrics.valueDeltaPct.toFixed(1)}% vs previous period
          </span>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-1">
          <span className="text-xs text-slate-400">Period Value (USD)</span>
          <div className="font-mono text-base font-bold text-brand-500">
            {formatCurrency(metrics.sumUsd, 'USD')}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Sent: {metrics.sentCount} Proposals
          </span>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-1">
          <span className="text-xs text-slate-400">
            Outcomes (Won / Lost / Pending)
          </span>
          <div className="font-mono text-lg font-bold text-emerald-500">
            {metrics.awardedCount} Won{' '}
            <span className="text-xs text-rose-500">
              / {metrics.lostCount} Lost
            </span>{' '}
            <span className="text-xs text-amber-500">
              / {metrics.pendingCount} Pend.
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block font-mono">
            Avg Delay: {metrics.avgDelayDays.toFixed(1)}d · Revs:{' '}
            {metrics.revisionsIssued} · Logs: {periodLogs.length}
          </span>
        </div>
      </div>

      {/* Breakdown by Engineer & Sales Representative (Section 5.7) */}
      <div
        className={`grid grid-cols-1 ${
          canSeeTeam ? 'lg:grid-cols-2' : ''
        } gap-6`}
      >
        {canSeeTeam && (
          <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Breakdown by Engineer
            </h2>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#1E2D3D] text-[11px] uppercase text-slate-400">
                  <th className="py-2">Engineer</th>
                  <th className="py-2 text-right">Assigned</th>
                  <th className="py-2 text-right">Sent</th>
                  <th className="py-2 text-right">Value (EGP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D] font-mono">
                {getProfiles()
                  .filter(
                    (p) => p.active && isAssignableEngineerOrManager(p)
                  )
                  .map((eng) => {
                    const rows = currentTenders.filter((t) =>
                      isUserAssignedToTender(eng.id, t.id)
                    );
                    const sent = rows.filter(
                      (t) =>
                        t.actual_sent_date || t.tender_status === 'Sent to Client'
                    ).length;
                    const valEgp = rows.reduce(
                      (s, t) => s + (t.tender_total_price || 0),
                      0
                    );
                    return (
                      <tr key={eng.id}>
                        <td className="py-2 font-sans font-semibold text-slate-900 dark:text-white">
                          {eng.full_name}
                        </td>
                        <td className="py-2 text-right">{rows.length}</td>
                        <td className="py-2 text-right text-emerald-500">
                          {sent}
                        </td>
                        <td className="py-2 text-right">
                          {formatCurrency(valEgp, 'EGP')}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Breakdown by Sales Representative
          </h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1E2D3D] text-[11px] uppercase text-slate-400">
                <th className="py-2">Sales Representative</th>
                <th className="py-2 text-right">Tenders</th>
                <th className="py-2 text-right">Awarded</th>
                <th className="py-2 text-right">Value (EGP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D] font-mono">
              {getLookupsByCategory('sales_representative').map((sr) => {
                const rows = currentTenders.filter(
                  (t) => t.sales_representative_id === sr.id
                );
                const won = rows.filter(
                  (t) => t.project_status === 'Awarded'
                ).length;
                const valEgp = rows.reduce(
                  (s, t) => s + (t.tender_total_price || 0),
                  0
                );
                return (
                  <tr key={sr.id}>
                    <td className="py-2 font-sans font-semibold text-slate-900 dark:text-white">
                      {getLookupLabel(sr.id, lang)}
                    </td>
                    <td className="py-2 text-right">{rows.length}</td>
                    <td className="py-2 text-right text-emerald-500 font-bold">
                      {won}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrency(valEgp, 'EGP')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakdown by Owner & Water Feature Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Breakdown by Client / Developer
          </h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1E2D3D] text-[11px] uppercase text-slate-400">
                <th className="py-2">Owner</th>
                <th className="py-2 text-right">Tenders</th>
                <th className="py-2 text-right">Value (EGP)</th>
                <th className="py-2 text-right">Value (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D] font-mono">
              {ownerBreakdown.map((o) => (
                <tr key={o.owner}>
                  <td className="py-2 font-sans font-semibold text-slate-900 dark:text-white">
                    {o.owner}
                  </td>
                  <td className="py-2 text-right">{o.count}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(o.totalEgp, 'EGP')}
                  </td>
                  <td className="py-2 text-right text-brand-500">
                    {formatCurrency(o.totalUsd, 'USD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Breakdown by Water Feature Type
          </h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#1E2D3D] text-[11px] uppercase text-slate-400">
                <th className="py-2">Water Feature Type</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Area (m²)</th>
                <th className="py-2 text-right">Total Value (EGP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D] font-mono">
              {waterFeatureBreakdown.map((w) => (
                <tr key={w.type}>
                  <td className="py-2 font-sans font-semibold text-slate-900 dark:text-white">
                    {w.type}
                  </td>
                  <td className="py-2 text-right">{w.qty}</td>
                  <td className="py-2 text-right">{formatNumber(w.area)}</td>
                  <td className="py-2 text-right font-bold">
                    {formatCurrency(w.totalEgp, 'EGP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full List of Tenders in Period */}
      <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Tenders Included in Period ({currentTenders.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0B1218] border-b border-slate-200 dark:border-[#1E2D3D] text-[11px] font-bold uppercase text-slate-500">
                <th className="p-2.5">Code</th>
                <th className="p-2.5">Proposal Name</th>
                <th className="p-2.5">Owner</th>
                <th className="p-2.5">Received</th>
                <th className="p-2.5">Sent</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Total EGP</th>
                <th className="p-2.5 text-right">Total USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D] font-mono">
              {currentTenders.map((t) => (
                <tr key={t.id}>
                  <td className="p-2.5 font-bold text-brand-500">
                    <Link to={`/tenders/${t.id}`}>
                      {t.proposal_code} (R{t.proposal_rev})
                    </Link>
                  </td>
                  <td className="p-2.5 font-sans font-semibold text-slate-900 dark:text-white">
                    {t.proposal_name}
                  </td>
                  <td className="p-2.5 font-sans">{t.owner}</td>
                  <td className="p-2.5">{formatDateDdMmYyyy(t.received_date)}</td>
                  <td className="p-2.5">{formatDateDdMmYyyy(t.actual_sent_date)}</td>
                  <td className="p-2.5 font-sans">{t.tender_status}</td>
                  <td className="p-2.5 text-right font-bold">
                    {formatCurrency(t.tender_total_price, 'EGP')}
                  </td>
                  <td className="p-2.5 text-right text-brand-500">
                    {formatCurrency(t.tender_total_price_usd, 'USD')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Period Audit Activity Timeline — App Admin Only */}
      {isAppAdmin && (
        <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-brand-500" />
              Audit Activity Timeline in Period ({periodLogs.length})
            </h2>
            {periodLogs.length > 0 && (
              <button
                type="button"
                onClick={() => clearAuditLogs()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
          {periodLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No audit activity recorded in this period.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-[#1E2D3D] text-xs">
              {periodLogs.slice(0, 15).map((log) => (
                <div
                  key={log.id}
                  className="py-2 flex items-center justify-between gap-4"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {log.user_name}
                    </span>{' '}
                    <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-mono text-[10px]">
                      {log.action}
                    </span>{' '}
                    on <code className="font-mono">{log.table_name}</code> (
                    {log.changed_fields.join(', ')})
                  </div>
                  <span className="font-mono text-slate-400">
                    {formatDateTimeCairo(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PeriodReports;
