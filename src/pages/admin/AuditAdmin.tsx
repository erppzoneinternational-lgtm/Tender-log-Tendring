import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  History,
  Search,
  Trash2,
} from 'lucide-react';
import {
  clearAuditLogs,
  getAuditLogs,
  getTenders,
  subscribeDataStore,
} from '@/lib/dataStore';
import { sanitizeSpreadsheetCell } from '@/lib/formulas';
import {
  formatAuditValueCairo,
  formatDateTimeCairo,
  todayCairoIso,
} from '@/components/ui/DatePickerInput';
import type { AuditLogEntry } from '@/types/database';

const ACTION_BADGES: Record<AuditLogEntry['action'], string> = {
  INSERT: 'bg-pzone-seagreen/15 text-pzone-seagreen border-pzone-seagreen/30',
  UPDATE: 'bg-pzone-teal/15 text-pzone-teal border-pzone-teal/30',
  DELETE: 'bg-pzone-crimson/15 text-pzone-crimson border-pzone-crimson/30',
};

type AuditCategory =
  | 'ALL'
  | 'TENDER_LOG'
  | 'ERP_CIVIL'
  | 'ERP_MEP'
  | 'COMMERCIAL'
  | 'USERS_CATALOG';

const TABLE_METADATA: Record<
  string,
  { label: string; category: Exclude<AuditCategory, 'ALL'>; badge: string }
> = {
  tenders: {
    label: 'Tender Log — Tenders',
    category: 'TENDER_LOG',
    badge: 'bg-brand-500/15 text-brand-500',
  },
  proposal_components: {
    label: 'Tender Log — Proposal Components',
    category: 'TENDER_LOG',
    badge: 'bg-brand-500/15 text-brand-500',
  },
  tender_assignments: {
    label: 'Tender Log — Team Assignments',
    category: 'TENDER_LOG',
    badge: 'bg-teal-500/15 text-teal-400',
  },
  tasks: {
    label: 'Tender Log — Kanban Tasks',
    category: 'TENDER_LOG',
    badge: 'bg-teal-500/15 text-teal-400',
  },
  tender_documents: {
    label: 'Tender Log — Document Paths',
    category: 'TENDER_LOG',
    badge: 'bg-sky-500/15 text-sky-400',
  },
  proposal_data_entry: {
    label: 'ERP — Water Feature Geometry',
    category: 'ERP_CIVIL',
    badge: 'bg-sky-500/15 text-sky-400',
  },
  pump_room_data_entry: {
    label: 'ERP — Pump Room Geometry',
    category: 'ERP_CIVIL',
    badge: 'bg-sky-500/15 text-sky-400',
  },
  water_feature_structural_works: {
    label: 'ERP — WF Structural BOQ',
    category: 'ERP_CIVIL',
    badge: 'bg-amber-500/15 text-amber-400',
  },
  pump_room_structural_works: {
    label: 'ERP — PR Structural BOQ',
    category: 'ERP_CIVIL',
    badge: 'bg-amber-500/15 text-amber-400',
  },
  proposal_finishes_water_feature: {
    label: 'ERP — WF Finishes BOQ',
    category: 'ERP_CIVIL',
    badge: 'bg-amber-500/15 text-amber-400',
  },
  proposal_finishes_pump_room: {
    label: 'ERP — PR Finishes BOQ',
    category: 'ERP_CIVIL',
    badge: 'bg-amber-500/15 text-amber-400',
  },
  proposal_breakdown_items: {
    label: 'ERP — Electromechanical (MEP) BOQ',
    category: 'ERP_MEP',
    badge: 'bg-violet-500/15 text-violet-400',
  },
  commercial_bid_overheads: {
    label: 'ERP — Commercial Overheads & Final Bid',
    category: 'COMMERCIAL',
    badge: 'bg-emerald-500/15 text-emerald-400',
  },
  items: {
    label: 'Master Catalog — Equipment & Materials',
    category: 'USERS_CATALOG',
    badge: 'bg-orange-500/15 text-orange-400',
  },
  pumps: {
    label: 'Master Catalog — Pumps',
    category: 'USERS_CATALOG',
    badge: 'bg-orange-500/15 text-orange-400',
  },
  filters: {
    label: 'Master Catalog — Filters',
    category: 'USERS_CATALOG',
    badge: 'bg-orange-500/15 text-orange-400',
  },
  cables: {
    label: 'Master Catalog — Cables',
    category: 'USERS_CATALOG',
    badge: 'bg-orange-500/15 text-orange-400',
  },
  profiles: {
    label: 'Admin — User Profiles & Gmail Allowlist',
    category: 'USERS_CATALOG',
    badge: 'bg-purple-500/15 text-purple-400',
  },
  lookup_values: {
    label: 'Admin — Lookup Values',
    category: 'USERS_CATALOG',
    badge: 'bg-purple-500/15 text-purple-400',
  },
  exchange_rates: {
    label: 'Admin — Exchange Rates',
    category: 'COMMERCIAL',
    badge: 'bg-emerald-500/15 text-emerald-400',
  },
};

const CATEGORY_TABS: { id: AuditCategory; label: string }[] = [
  { id: 'ALL', label: 'All Activity' },
  { id: 'TENDER_LOG', label: 'Tender Log' },
  { id: 'ERP_CIVIL', label: 'ERP Geometry & Civil' },
  { id: 'ERP_MEP', label: 'ERP Electromechanical' },
  { id: 'COMMERCIAL', label: 'Commercial & FX' },
  { id: 'USERS_CATALOG', label: 'Users & Master Catalog' },
];

function resolveCategoryForTable(tableName: string): Exclude<AuditCategory, 'ALL'> {
  if (TABLE_METADATA[tableName]) return TABLE_METADATA[tableName].category;
  if (tableName.includes('structural') || tableName.includes('finishes')) return 'ERP_CIVIL';
  if (tableName.includes('breakdown') || tableName.includes('electromech')) return 'ERP_MEP';
  if (tableName.includes('commercial')) return 'COMMERCIAL';
  if (tableName.includes('tender')) return 'TENDER_LOG';
  return 'USERS_CATALOG';
}

export const AuditAdmin: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [version, setVersion] = useState(0);
  useEffect(() => {
    return subscribeDataStore(() => setVersion((v) => v + 1));
  }, []);

  const logs = useMemo<AuditLogEntry[]>(() => getAuditLogs(), [version]);
  const tenderCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const td of getTenders()) {
      map.set(td.id, td.proposal_code);
    }
    return map;
  }, [version]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory>('ALL');
  const [tableFilter, setTableFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(
    logs[0]?.id || null
  );
  const [confirmClear, setConfirmClear] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (
        categoryFilter !== 'ALL' &&
        resolveCategoryForTable(entry.table_name) !== categoryFilter
      ) {
        return false;
      }
      if (tableFilter !== 'ALL' && entry.table_name !== tableFilter) {
        return false;
      }
      if (actionFilter !== 'ALL' && entry.action !== actionFilter) {
        return false;
      }
      const q = search.trim().toLowerCase();
      if (!q) return true;

      const proposalCode = entry.tender_id
        ? tenderCodeMap.get(entry.tender_id) || ''
        : '';

      return (
        entry.table_name.toLowerCase().includes(q) ||
        (TABLE_METADATA[entry.table_name]?.label || '').toLowerCase().includes(q) ||
        (entry.user_name || '').toLowerCase().includes(q) ||
        entry.record_id.toLowerCase().includes(q) ||
        proposalCode.toLowerCase().includes(q) ||
        entry.changed_fields.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [logs, categoryFilter, tableFilter, actionFilter, search, tenderCodeMap]);

  const kpis = useMemo(() => {
    let inserts = 0;
    let updates = 0;
    let deletes = 0;
    let erpEvents = 0;
    for (const entry of filteredLogs) {
      if (entry.action === 'INSERT') inserts += 1;
      else if (entry.action === 'UPDATE') updates += 1;
      else if (entry.action === 'DELETE') deletes += 1;

      const cat = resolveCategoryForTable(entry.table_name);
      if (cat === 'ERP_CIVIL' || cat === 'ERP_MEP' || cat === 'COMMERCIAL') {
        erpEvents += 1;
      }
    }
    return { total: filteredLogs.length, inserts, updates, deletes, erpEvents };
  }, [filteredLogs]);

  const handleExportCsv = () => {
    const headers = [
      'Timestamp (Cairo)',
      'Actor',
      'Role',
      'Action',
      'Module / Table',
      'Proposal Code',
      'Record ID',
      'Changed Fields',
    ];
    const rows = filteredLogs.map((entry) => {
      const code = entry.tender_id ? tenderCodeMap.get(entry.tender_id) || '' : '';
      return [
        formatDateTimeCairo(entry.timestamp),
        entry.user_name || 'System Trigger',
        entry.user_role || '',
        entry.action,
        TABLE_METADATA[entry.table_name]?.label || entry.table_name,
        code,
        entry.record_id,
        entry.changed_fields.join('; '),
      ]
        .map((v) => `"${String(sanitizeSpreadsheetCell(v)).replace(/"/g, '""')}"`)
        .join(',');
    });
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PZONE_Unified_Audit_Log_${todayCairoIso()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-border rounded-card p-6 shadow-soft dark:shadow-soft-dark space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-pzone-teal" />
            <span>{t('admin.audit.title')} — Unified Tender Log & ERP</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable audit trail tracking Tender Log registration, ERP geometry, Civil & MEP BOQ saves, Commercial Bid overheads, and Master Catalog pricing updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            confirmClear ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs">
                <span className="font-bold text-rose-600 dark:text-rose-300">Clear all {logs.length} logs?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearAuditLogs();
                    setConfirmClear(false);
                  }}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-0.5 rounded bg-muted text-foreground font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Audit Log</span>
              </button>
            )
          )}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pzone-teal hover:bg-pzone-teal/90 disabled:opacity-40 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit CSV</span>
          </button>
          <span className="px-3 py-1 rounded-full bg-muted text-xs font-bold font-tabular text-foreground">
            {kpis.total} events
          </span>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-2.5">
          <div className="text-[11px] text-muted-foreground font-medium">Total Filtered</div>
          <div className="text-lg font-bold font-tabular text-foreground">{kpis.total}</div>
        </div>
        <div className="rounded-xl border border-pzone-seagreen/30 bg-pzone-seagreen/5 px-3.5 py-2.5">
          <div className="text-[11px] text-pzone-seagreen font-medium">Inserts (Created)</div>
          <div className="text-lg font-bold font-tabular text-pzone-seagreen">{kpis.inserts}</div>
        </div>
        <div className="rounded-xl border border-pzone-teal/30 bg-pzone-teal/5 px-3.5 py-2.5">
          <div className="text-[11px] text-pzone-teal font-medium">Updates (Modified)</div>
          <div className="text-lg font-bold font-tabular text-pzone-teal">{kpis.updates}</div>
        </div>
        <div className="rounded-xl border border-pzone-crimson/30 bg-pzone-crimson/5 px-3.5 py-2.5">
          <div className="text-[11px] text-pzone-crimson font-medium">Deletes (Removed)</div>
          <div className="text-lg font-bold font-tabular text-pzone-crimson">{kpis.deletes}</div>
        </div>
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 px-3.5 py-2.5">
          <div className="text-[11px] text-violet-500 font-medium">ERP & Pricing Events</div>
          <div className="text-lg font-bold font-tabular text-violet-500">{kpis.erpEvents}</div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              categoryFilter === tab.id
                ? 'bg-pzone-teal text-white'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute top-3 start-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, proposal code, table, or field..."
            className="w-full ps-9 pe-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
          />
        </div>

        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
        >
          <option value="ALL">{t('admin.audit.allTables')}</option>
          {Object.entries(TABLE_METADATA).map(([tableKey, meta]) => (
            <option key={tableKey} value={tableKey}>
              {meta.label} ({tableKey})
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
        >
          <option value="ALL">{t('admin.audit.allActions')}</option>
          <option value="INSERT">INSERT</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-start border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60 text-muted-foreground text-xs uppercase border-b border-border">
              <th className="py-3 px-4 text-start font-semibold">
                {t('admin.audit.colTimestamp')} (Cairo)
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t('admin.audit.colUser')}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t('admin.audit.colAction')}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                Module / {t('admin.audit.colTable')}
              </th>
              <th className="py-3 px-4 text-start font-semibold">
                {t('admin.audit.colFields')}
              </th>
              <th className="py-3 px-4 text-end font-semibold">
                {t('admin.audit.colDetails')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-[13px]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                  No audit events recorded yet for the current filter. Actions in Tender Log and Intelligent Tender ERP appear here automatically.
                </td>
              </tr>
            ) : (
              filteredLogs.map((entry) => {
                const isExpanded = expandedId === entry.id;
                const diffFields =
                  entry.changed_fields[0] === '*'
                    ? Object.keys(entry.new_data || entry.old_data || {})
                    : entry.changed_fields;
                const meta = TABLE_METADATA[entry.table_name];
                const proposalCode = entry.tender_id
                  ? tenderCodeMap.get(entry.tender_id)
                  : undefined;

                return (
                  <React.Fragment key={entry.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-tabular text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTimeCairo(entry.timestamp)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">
                          {entry.user_name || 'System Trigger'}
                        </div>
                        {entry.user_role && (
                          <div className="text-[11px] text-muted-foreground">
                            {t(`roles.${entry.user_role}`)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                            ACTION_BADGES[entry.action]
                          }`}
                        >
                          {entry.action}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {meta && (
                            <span
                              className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[11px] font-semibold ${meta.badge}`}
                            >
                              {meta.label}
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {entry.table_name}
                            </span>
                            {entry.tender_id && (
                              <button
                                type="button"
                                onClick={() => navigate(`/tenders/${entry.tender_id}`)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-pzone-teal/10 text-pzone-teal text-[11px] font-mono font-semibold hover:underline"
                              >
                                <span>{proposalCode || 'Open Tender'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {entry.changed_fields.slice(0, 6).map((f) => (
                            <span
                              key={f}
                              className="px-2 py-0.5 rounded bg-muted text-foreground font-mono text-[11px]"
                            >
                              {f}
                            </span>
                          ))}
                          {entry.changed_fields.length > 6 && (
                            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[11px]">
                              +{entry.changed_fields.length - 6} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-end">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(isExpanded ? null : entry.id)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-pzone-teal hover:text-white text-foreground text-xs font-medium transition-colors"
                        >
                          <span>
                            {isExpanded
                              ? t('admin.audit.hideDiff')
                              : t('admin.audit.inspectDiff')}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-muted/25">
                        <td colSpan={6} className="p-4">
                          <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-muted/60 text-muted-foreground border-b border-border">
                                  <th className="py-2 px-3 text-start font-semibold">
                                    {t('admin.audit.field')}
                                  </th>
                                  <th className="py-2 px-3 text-start font-semibold">
                                    {t('admin.audit.oldValue')}
                                  </th>
                                  <th className="py-2 px-3 text-start font-semibold">
                                    {t('admin.audit.newValue')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border font-mono">
                                {diffFields.map((fieldKey) => {
                                  const oldVal = entry.old_data?.[fieldKey];
                                  const newVal = entry.new_data?.[fieldKey];
                                  return (
                                    <tr key={fieldKey}>
                                      <td className="py-2 px-3 font-semibold text-foreground">
                                        {fieldKey}
                                      </td>
                                      <td className="py-2 px-3 text-pzone-crimson bg-pzone-crimson/5">
                                        {formatAuditValueCairo(oldVal)}
                                      </td>
                                      <td className="py-2 px-3 text-pzone-seagreen bg-pzone-seagreen/5">
                                        {formatAuditValueCairo(newVal)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
