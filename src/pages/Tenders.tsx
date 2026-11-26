import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  ArrowUpDown,
  Award,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FilePlus2,
  Filter,
  GitBranchPlus,
  Layers,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { startIntelligentTender } from '@/lib/erpBridge';
import {
  assignEngineersToTender,
  createTenderRevision,
  deleteSavedView,
  getAllAssignments,
  getEngineerAssignedDate,
  getEngineerWorkloadSummary,
  getLookupLabel,
  getLookupsByCategory,
  getProfileName,
  getProfiles,
  getSavedViews,
  getTenders,
  isUserAssignedToTender,
  saveUserView,
  subscribeDataStore,
  updateTender,
} from '@/lib/dataStore';
import {
  canAccessErpEngineering,
  canAssignEngineers,
  canCreateRevision,
  canCreateTender,
  canEditTenderField,
  canManageContract,
  canOpenIntelligentTender,
  canViewKanbanAndTeamManagement,
  hasFullTenderAuthority,
  isAssignableEngineerOrManager,
  isEngineerMatchingDiscipline,
} from '@/lib/permissions';
import { sanitizeSpreadsheetRow } from '@/lib/formulas';
import {
  DatePickerInput,
  formatDateDdMmYyyy,
  formatDateTimeCairo,
  todayCairoIso,
} from '@/components/ui/DatePickerInput';
import { EngineerWorkloadAdvisor } from '@/components/ui/EngineerWorkloadAdvisor';
import type {
  DisciplineType,
  SavedView,
  Tender,
  TenderAssignment,
} from '@/types/database';

type ColumnGroupKey =
  | 'all'
  | 'identity'
  | 'dates'
  | 'pricing'
  | 'contract'
  | 'audit';

export const Tenders: React.FC = () => {
  const navigate = useNavigate();
  const { user, language } = useApp();
  const isAr = language === 'ar';
  const canSeeTeam = user ? canViewKanbanAndTeamManagement(user) : false;

  const [tenders, setTenders] = useState<Tender[]>(() => getTenders());
  const [allAssignments, setAllAssignments] = useState<TenderAssignment[]>(() =>
    getAllAssignments()
  );

  // Filters & Views state
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [salesRepFilter, setSalesRepFilter] = useState<string>('ALL');
  const [engineerFilter, setEngineerFilter] = useState<string>('ALL');
  const [receivedFrom, setReceivedFrom] = useState<string>('');
  const [receivedTo, setReceivedTo] = useState<string>('');
  const [revFilter, setRevFilter] = useState<string>('LATEST');
  const [activeGroup, setActiveGroup] = useState<ColumnGroupKey>('all');
  const [compact, setCompact] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<keyof Tender>('serial_no');
  const [sortDesc, setSortDesc] = useState<boolean>(true);
  const [savedViews, setSavedViews] = useState<SavedView[]>(() =>
    getSavedViews(user?.id)
  );
  const [lookupVersion, setLookupVersion] = useState<number>(0);
  const [newViewName, setNewViewName] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);
  const [headerExpanded, setHeaderExpanded] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pzone_tender_log_header_expanded') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleHeaderExpanded = () => {
    setHeaderExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pzone_tender_log_header_expanded', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    return subscribeDataStore(() => {
      setTenders(getTenders());
      setAllAssignments(getAllAssignments());
      setSavedViews(getSavedViews(user?.id));
      setLookupVersion((v) => v + 1);
    });
  }, [user?.id]);

  const toggleSort = (key: keyof Tender) => {
    if (sortKey === key) {
      setSortDesc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  };

  // Quick New Revision Modal state
  const [revModalTender, setRevModalTender] = useState<Tender | null>(null);
  const [revReason, setRevReason] = useState('Client Scope Modification');
  const [revRequestedBy, setRevRequestedBy] = useState('');

  // Quick Assign Team Modal state
  const [assignModalTender, setAssignModalTender] = useState<Tender | null>(null);
  const [isEditingAssignModal, setIsEditingAssignModal] = useState<boolean>(false);
  const [assignDraft, setAssignDraft] = useState<
    Partial<Record<DisciplineType, string>>
  >({});
  const [elecManuallyEdited, setElecManuallyEdited] = useState<boolean>(false);
  const [assignDueDate, setAssignDueDate] = useState<string>('');

  const statuses = useMemo(
    () => getLookupsByCategory('tender_status'),
    [lookupVersion]
  );
  const priorities = useMemo(
    () => getLookupsByCategory('project_priority'),
    [lookupVersion]
  );
  const areas = useMemo(
    () => getLookupsByCategory('area'),
    [lookupVersion]
  );
  const salesReps = useMemo(
    () => getLookupsByCategory('sales_representative'),
    [lookupVersion]
  );
  const revisionReasons = useMemo(
    () => getLookupsByCategory('revision_reason'),
    [lookupVersion]
  );
  const engineers = useMemo(
    () =>
      getProfiles().filter(
        (p) => p.active && isAssignableEngineerOrManager(p)
      ),
    [lookupVersion]
  );

  const workloadSummaries = useMemo(
    () => getEngineerWorkloadSummary(),
    [tenders, allAssignments, lookupVersion]
  );
  const workloadByEngineerId = useMemo(
    () => new Map(workloadSummaries.map((w) => [w.engineer.id, w])),
    [workloadSummaries]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const availableRevNumbers = useMemo(() => {
    const set = new Set<number>();
    for (const t of tenders) {
      set.add(t.proposal_rev);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [tenders]);

  const revCountByCode = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tenders) {
      const key = t.proposal_code.trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [tenders]);

  const filteredTenders = useMemo(() => {
    const filtered = tenders.filter((t) => {
      if (revFilter === 'LATEST' && !t.is_latest_revision) return false;
      if (
        revFilter !== 'LATEST' &&
        revFilter !== 'ALL' &&
        String(t.proposal_rev) !== revFilter
      ) {
        return false;
      }
      if (yearFilter !== 'ALL' && String(t.year) !== yearFilter) return false;
      if (statusFilter !== 'ALL' && t.tender_status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.project_priority !== priorityFilter) return false;
      if (areaFilter !== 'ALL' && t.area !== areaFilter) return false;
      if (salesRepFilter !== 'ALL' && t.sales_representative_id !== salesRepFilter)
        return false;
      if (receivedFrom && t.received_date < receivedFrom) return false;
      if (receivedTo && t.received_date > receivedTo) return false;
      if (
        engineerFilter !== 'ALL' &&
        t.responsible_civil_engineer_id !== engineerFilter &&
        t.mechanical_pricing_responsible_id !== engineerFilter &&
        t.electrical_pricing_responsible_id !== engineerFilter
      ) {
        return false;
      }

      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        t.proposal_code.toLowerCase().includes(q) ||
        t.proposal_name.toLowerCase().includes(q) ||
        t.owner.toLowerCase().includes(q) ||
        (t.contractor || '').toLowerCase().includes(q) ||
        (t.country || '').toLowerCase().includes(q) ||
        (t.governorate || '').toLowerCase().includes(q) ||
        (t.area || '').toLowerCase().includes(q) ||
        (t.district || '').toLowerCase().includes(q) ||
        (t.location || '').toLowerCase().includes(q) ||
        (t.components_summary || '').toLowerCase().includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDesc ? bv - av : av - bv;
      }
      const as = String(av ?? '');
      const bs = String(bv ?? '');
      return sortDesc ? bs.localeCompare(as) : as.localeCompare(bs);
    });
  }, [
    tenders,
    revFilter,
    yearFilter,
    statusFilter,
    priorityFilter,
    areaFilter,
    salesRepFilter,
    engineerFilter,
    receivedFrom,
    receivedTo,
    search,
    sortKey,
    sortDesc,
  ]);

  const handleCopyPath = (e: React.MouseEvent, pathStr?: string | null) => {
    e.stopPropagation();
    if (!pathStr) return;
    navigator.clipboard?.writeText(pathStr);
    showToast(`Copied server path: ${pathStr}`);
  };

  const handleCreateRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !revModalTender) return;
    try {
      const created = createTenderRevision(
        revModalTender.id,
        revReason,
        revRequestedBy || revModalTender.owner,
        user
      );
      setRevModalTender(null);
      showToast(
        `Created ${created.proposal_code} Rev ${created.proposal_rev}`
      );
      navigate(`/tenders/${created.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create revision');
    }
  };

  const syncAssignDraftFromTender = (t: Tender) => {
    const initialMech = t.mechanical_pricing_responsible_id || '';
    const initialElec = t.electrical_pricing_responsible_id || initialMech;
    setAssignDraft({
      'Civil/Arch': t.responsible_civil_engineer_id || '',
      'Mechanical Pricing': initialMech,
      'Electrical Pricing': initialElec,
    });
    setElecManuallyEdited(
      Boolean(
        t.electrical_pricing_responsible_id &&
          t.electrical_pricing_responsible_id !== t.mechanical_pricing_responsible_id
      )
    );
    setAssignDueDate(t.expected_send_date || '');
  };

  const openAssignModal = (t: Tender) => {
    setAssignModalTender(t);
    setIsEditingAssignModal(false);
    syncAssignDraftFromTender(t);
  };

  const handleQuickAssignTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !assignModalTender) return;
    try {
      assignEngineersToTender(
        assignModalTender.id,
        assignDraft,
        assignDueDate || null,
        { id: user.id, full_name: user.full_name, role: user.role }
      );
      const updated =
        getTenders().find((x) => x.id === assignModalTender.id) || assignModalTender;
      setAssignModalTender(updated);
      syncAssignDraftFromTender(updated);
      setIsEditingAssignModal(false);
      showToast(`Assigned team & updated schedule for ${updated.proposal_code}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to assign team');
    }
  };

  // Excel / CSV Export of all 60 Appendix A.1 columns
  const handleExport = (format: 'xlsx' | 'csv') => {
    const rows = filteredTenders.map((t) => ({
      S: t.serial_no,
      Year: t.year,
      'Proposal Code': t.proposal_code,
      'Proposal Rev': t.proposal_rev,
      'Sales Representative': getLookupLabel(t.sales_representative_id, 'en'),
      'PZONE Role (Main Contractor-Sub Contractor)': t.pzone_role || '',
      'Main Contractor': t.contractor || '',
      'Owner / Developer': t.owner,
      Country: t.country || 'Egypt',
      Governorate: t.governorate || '',
      'Geographic Area': t.area || '',
      'District (Compound / Building)': t.district || '',
      Location: t.location || '',
      'Proposal Name': t.proposal_name,
      'Total Components Area (m²)': t.total_components_area_m2,
      'Total Components Volume (m3)': t.total_components_volume_m3,
      'Proposal Server Link Path': t.server_link_path || '',
      'Proposal Scope of Work (Multiple Options)': t.scope_of_work.join(', '),
      'Proposal Components': t.components_summary,
      'Project Priority': t.project_priority,
      'Proposal Recieved Date': formatDateDdMmYyyy(t.received_date, ''),
      'Expected to be sent': formatDateDdMmYyyy(t.expected_send_date, ''),
      Deadline: formatDateDdMmYyyy(t.deadline_date, ''),
      'Actual Proposal Sent Date': formatDateDdMmYyyy(t.actual_sent_date, ''),
      'Tender Status': t.tender_status,
      ...(canSeeTeam
        ? {
            'Responsible Engineer (Civil/Arch)': getProfileName(
              t.responsible_civil_engineer_id
            ),
            'Civil/Arch Assigned Date': formatDateDdMmYyyy(
              getEngineerAssignedDate(t, 'Civil/Arch', allAssignments),
              ''
            ),
            'Mechanical Pricing Responsible': getProfileName(
              t.mechanical_pricing_responsible_id
            ),
            'Mechanical Pricing Assigned Date': formatDateDdMmYyyy(
              getEngineerAssignedDate(t, 'Mechanical Pricing', allAssignments),
              ''
            ),
            'Electrical Pricing Responsible': getProfileName(
              t.electrical_pricing_responsible_id
            ),
            'Electrical Pricing Assigned Date': formatDateDdMmYyyy(
              getEngineerAssignedDate(t, 'Electrical Pricing', allAssignments),
              ''
            ),
          }
        : {}),
      'Tender Status Notes': t.tender_status_notes || '',
      'Delayed Days': t.delayed_days,
      'Maintenance Cost': t.maintenance_cost,
      'Supply Cost': t.supply_cost,
      'Design Cost': t.design_cost,
      'Civil Cost': t.civil_cost,
      'Mechanical Cost': t.mechanical_cost,
      'Electrical Cost': t.electrical_cost,
      'Tender Total price': t.tender_total_price,
      'Duplicates/Not Duplicate': t.is_duplicate,
      'Duplicates with': t.duplicate_of_tender_id || '',
      'Contact Name': t.contact_name || '',
      'Contact Number': t.contact_number || '',
      'Contact Job title': t.contact_job_title || '',
      'Contact E-mail': t.contact_email || '',
      'Contact Address': t.contact_address || '',
      'Exch.rate/Sent date': t.exchange_rate_on_sent_date ?? '',
      'Tender Total price in USD': t.tender_total_price_usd ?? '',
      'Project Status': t.project_status || '',
      'Contract Date': formatDateDdMmYyyy(t.contract_date, ''),
      'Project Status Note': t.project_status_note || '',
      'PR Code': t.pr_code || '',
      'Project Name': t.project_name || '',
      'PR Contract Date': formatDateDdMmYyyy(t.pr_contract_date, ''),
      'Final PR Contract Total price': t.final_pr_contract_total_price ?? '',
      'Exch.rate/Contract date': t.exchange_rate_on_contract_date ?? '',
      'PR Contract Total price in USD': t.pr_contract_total_price_usd ?? '',
      'Final Contracted Status': t.final_contracted_status || '',
      'Final Contracted Status Notes': t.final_contracted_status_notes || '',
      'Entered by': getProfileName(t.created_by),
      'Entered at (Cairo)': formatDateTimeCairo(t.created_at, ''),
      'Last updated by': getProfileName(t.updated_by),
      'Last updated at (Cairo)': formatDateTimeCairo(t.updated_at, ''),
    })).map(sanitizeSpreadsheetRow);

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PZONE_Tender_Log');
    const filename = `PZONE_Tender_Log_${todayCairoIso()}.${format}`;
    XLSX.writeFile(wb, filename, { bookType: format });
    showToast(`Exported ${rows.length} tenders to ${filename}`);
  };

  const showGroup = (group: ColumnGroupKey) =>
    activeGroup === 'all' || activeGroup === group;

  const cellPad = compact ? 'py-2 px-3 text-xs' : 'py-3 px-3.5 text-[13px]';

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

      {/* Top Header & Collapsible Views / Filters Panel */}
      <div
        className={`bg-card border border-border rounded-card shadow-soft dark:shadow-soft-dark border-ribbon-top transition-all ${
          headerExpanded ? 'p-6 space-y-5' : 'px-5 py-3.5'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1
                  className={`${
                    headerExpanded ? 'text-2xl' : 'text-lg'
                  } font-extrabold text-foreground tracking-tight transition-all`}
                >
                  {isAr ? 'سجل المناقصات والعروض (Tender Log)' : 'P.ZONE Tender Log'}
                </h1>
                {!headerExpanded && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border text-xs font-semibold text-muted-foreground">
                    <Filter className="w-3 h-3 text-pzone-teal" />
                    <strong className="text-foreground font-tabular">
                      {filteredTenders.length}
                    </strong>{' '}
                    {isAr ? 'عرض' : 'proposals'}
                  </span>
                )}
              </div>
              {headerExpanded && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {isAr
                    ? 'جدول تفاعلي يشمل كافة أعمدة السجل (60 عموداً) مع تثبيت الأعمدة الأساسية، الفلترة المتقدمة، المراجعات، والتصدير إلى Excel.'
                    : 'Complete 60-column master log with pinned identity columns, saved column groups, revision history, and live EGP/USD pricing.'}
                </p>
              )}
            </div>

            {!headerExpanded && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute top-2.5 start-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    isAr
                      ? 'بحث سريع...'
                      : 'Quick search code, project, owner...'
                  }
                  className="w-full ps-8 pe-3 py-1.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user && canCreateTender(user.role) && (
              <button
                type="button"
                onClick={() => navigate('/tenders/new')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pzone-navy hover:bg-pzone-navy/90 dark:bg-pzone-teal dark:hover:bg-pzone-teal/90 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>
                  {isAr ? 'تسجيل مناقصة جديدة' : 'Register New Tender'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-pzone-seagreen" />
              <span>Export Excel (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-pzone-teal" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={toggleHeaderExpanded}
              aria-expanded={headerExpanded}
              title={
                headerExpanded
                  ? isAr
                    ? 'طي الفلاتر والعروض'
                    : 'Collapse Views & Filters'
                  : isAr
                    ? 'توسيع الفلاتر والعروض'
                    : 'Expand Views & Filters'
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold border border-border transition-colors cursor-pointer"
            >
              {headerExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 text-pzone-teal" />
                  <span>{isAr ? 'طي' : 'Collapse'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-pzone-teal" />
                  <span>{isAr ? 'الفلاتر والعروض' : 'Filters & Views'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {headerExpanded && (
          <>
            {/* Column Group Saved Views & Density Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-muted-foreground me-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-pzone-teal" />
              <span>{isAr ? 'مجموعات الأعمدة:' : 'Column Views:'}</span>
            </span>
            {(
              [
                { key: 'all', label: isAr ? 'كافة الأعمدة (60)' : 'All 60 Columns (Full Sheet)' },
                { key: 'identity', label: isAr ? 'الهوية والعميل' : 'Identity & Client' },
                {
                  key: 'dates',
                  label: canSeeTeam
                    ? isAr
                      ? 'التواريخ والمهندسون'
                      : 'Dates & Engineers'
                    : isAr
                      ? 'التواريخ والحالة'
                      : 'Dates & Status',
                },
                { key: 'pricing', label: isAr ? 'التسعير والدولار' : 'Pricing & USD' },
                { key: 'contract', label: isAr ? 'الترسية والعقود' : 'Contract Result' },
                { key: 'audit', label: isAr ? 'سجل الإدخال والتحديث' : 'Entered / Updated By' },
              ] as { key: ColumnGroupKey; label: string }[]
            ).map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setActiveGroup(g.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeGroup === g.key
                    ? 'bg-pzone-navy dark:bg-pzone-teal text-white shadow-sm'
                    : 'bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={revFilter}
              onChange={(e) => setRevFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-muted/70 hover:bg-muted text-xs font-semibold text-foreground border border-border cursor-pointer"
            >
              <option value="LATEST">
                {isAr ? 'أحدث مراجعة فقط' : 'Latest Revision Only'}
              </option>
              <option value="ALL">
                {isAr ? 'كل المراجعات' : 'All Revisions'}
              </option>
              {availableRevNumbers.map((revNum) => (
                <option key={revNum} value={String(revNum)}>
                  Rev {String(revNum).padStart(2, '0')} Only
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setCompact(!compact)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/70 hover:bg-muted text-xs font-semibold text-foreground border border-border"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-pzone-teal" />
              <span>{compact ? 'Compact' : 'Comfortable'}</span>
            </button>
          </div>
        </div>

        {/* Saved User Views Bar (Section 4.3 & 5.1) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-muted-foreground me-1">
              Saved Views:
            </span>
            {savedViews.map((sv) => (
              <div
                key={sv.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/70 border border-border"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveGroup(sv.column_group);
                    setCompact(sv.density === 'compact');
                    if (sv.sorting) {
                      setSortKey(sv.sorting.key as keyof Tender);
                      setSortDesc(sv.sorting.desc);
                    }
                    showToast(`Applied view: ${sv.name}`);
                  }}
                  className="font-semibold text-foreground hover:text-pzone-teal"
                >
                  {sv.name}
                </button>
                {user && sv.user_id === user.id && !sv.id.startsWith('sv-default-') && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteSavedView(sv.id, user.id);
                      showToast(`Removed saved view: ${sv.name}`);
                    }}
                    className="text-muted-foreground hover:text-pzone-crimson ms-1"
                    title="Delete Saved View"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {user && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="Save current view as..."
                className="px-2.5 py-1 rounded-lg bg-background border border-border text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newViewName.trim()) return;
                  saveUserView(
                    {
                      user_id: user.id,
                      name: newViewName.trim(),
                      is_shared: hasFullTenderAuthority(user),
                      column_group: activeGroup,
                      density: compact ? 'compact' : 'comfortable',
                      sorting: { key: String(sortKey), desc: sortDesc },
                    },
                    { id: user.id, full_name: user.full_name, role: user.role }
                  );
                  setNewViewName('');
                  showToast('Saved current table view.');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pzone-teal text-white font-semibold"
              >
                <BookmarkPlus className="w-3.5 h-3.5" /> Save View
              </button>
            </div>
          )}
        </div>

        {/* Multi-Filter Strip */}
        <div
          className={`grid sm:grid-cols-2 ${
            canSeeTeam ? 'lg:grid-cols-7' : 'lg:grid-cols-6'
          } gap-2.5`}
        >
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute top-2.5 start-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isAr
                  ? 'بحث بالكود، المشروع، المالك، المقاول...'
                  : 'Search code, project, owner, contractor...'
              }
              className="w-full ps-9 pe-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
            />
          </div>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-2.5 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
          >
            <option value="ALL">{isAr ? 'كل السنوات' : 'All Years'}</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
          >
            <option value="ALL">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.label_en}>
                {isAr ? s.label_ar : s.label_en}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
          >
            <option value="ALL">{isAr ? 'كل الأولويات' : 'All Priorities'}</option>
            {priorities.map((p) => (
              <option key={p.id} value={p.label_en}>
                {isAr ? p.label_ar : p.label_en}
              </option>
            ))}
          </select>

          <select
            value={salesRepFilter}
            onChange={(e) => setSalesRepFilter(e.target.value)}
            className="px-2.5 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
          >
            <option value="ALL">{isAr ? 'كل المبيعات' : 'All Sales Reps'}</option>
            {salesReps.map((sr) => (
              <option key={sr.id} value={sr.id}>
                {isAr ? sr.label_ar : sr.label_en}
              </option>
            ))}
          </select>

          {canSeeTeam && (
            <select
              value={engineerFilter}
              onChange={(e) => setEngineerFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
            >
              <option value="ALL">{isAr ? 'كل المهندسين' : 'All Engineers'}</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {isAr && eng.full_name_ar ? eng.full_name_ar : eng.full_name}
                </option>
              ))}
            </select>
          )}

          <DatePickerInput
            value={receivedFrom}
            onChange={(iso) => setReceivedFrom(iso)}
            placeholder="Received From"
          />

          <DatePickerInput
            value={receivedTo}
            onChange={(iso) => setReceivedTo(iso)}
            placeholder="Received To"
          />
        </div>

        {/* Active Filter Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Filter className="w-3.5 h-3.5 text-pzone-teal" />
            Showing <strong className="text-foreground font-tabular">{filteredTenders.length}</strong> proposals
            {revFilter === 'ALL'
              ? ' (all revisions)'
              : revFilter !== 'LATEST'
                ? ` (Rev ${String(revFilter).padStart(2, '0')} only)`
                : ''}
          </span>
          {(search ||
            revFilter !== 'LATEST' ||
            yearFilter !== 'ALL' ||
            statusFilter !== 'ALL' ||
            priorityFilter !== 'ALL' ||
            areaFilter !== 'ALL' ||
            salesRepFilter !== 'ALL' ||
            engineerFilter !== 'ALL' ||
            receivedFrom ||
            receivedTo) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRevFilter('LATEST');
                setYearFilter('ALL');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setAreaFilter('ALL');
                setSalesRepFilter('ALL');
                setEngineerFilter('ALL');
                setReceivedFrom('');
                setReceivedTo('');
              }}
              className="text-pzone-crimson font-semibold hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>
          </>
        )}
      </div>

      {/* Main 60-Column Scrollable Table with Sticky Header & Pinned First Columns */}
      <div className="bg-card border border-border rounded-card shadow-soft dark:shadow-soft-dark overflow-hidden">
        <div
          className={`overflow-x-auto ${
            headerExpanded ? 'max-h-[680px]' : 'max-h-[calc(100vh-185px)]'
          }`}
        >
          <table className="w-full border-collapse text-start whitespace-nowrap">
            <thead className="sticky top-0 z-20 bg-pzone-navy text-white text-[11px] uppercase tracking-wider">
              <tr>
                {/* Pinned Columns (S, Proposal Code, Rev, Proposal Name) */}
                <th
                  onClick={() => toggleSort('serial_no')}
                  className="py-3 px-3 w-12 min-w-[48px] text-start font-bold sticky start-0 z-30 bg-pzone-navy border-e border-white/15 cursor-pointer hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-1">
                    S <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </span>
                </th>
                <th
                  onClick={() => toggleSort('proposal_code')}
                  className="py-3 px-3.5 text-start font-bold sticky start-12 z-30 bg-pzone-navy border-e border-white/15 cursor-pointer hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-1">
                    {isAr ? 'كود العرض' : 'Proposal Code'}{' '}
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </span>
                </th>
                <th className="py-3 px-2.5 text-center font-bold bg-pzone-navy border-e border-white/15">
                  {isAr ? 'مراجعة' : 'Rev'}
                </th>
                <th
                  onClick={() => toggleSort('proposal_name')}
                  className="py-3 px-4 text-start font-bold bg-pzone-navy border-e border-white/15 cursor-pointer hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-1">
                    {isAr ? 'اسم المشروع / العرض' : 'Proposal Name'}{' '}
                    <ArrowUpDown className="w-3 h-3 opacity-70" />
                  </span>
                </th>

                {showGroup('identity') && (
                  <>
                    <th className="py-3 px-3 text-start font-semibold">Year</th>
                    <th className="py-3 px-3 text-start font-semibold">Sales Representative</th>
                    <th className="py-3 px-3 text-start font-semibold">PZONE Role</th>
                    <th className="py-3 px-3 text-start font-semibold">Main Contractor</th>
                    <th className="py-3 px-3 text-start font-semibold">Owner / Developer</th>
                    <th className="py-3 px-3 text-start font-semibold">Country</th>
                    <th className="py-3 px-3 text-start font-semibold">Governorate</th>
                    <th className="py-3 px-3 text-start font-semibold">Geographic Area</th>
                    <th className="py-3 px-3 text-start font-semibold">District (Compound / Bldg)</th>
                    <th className="py-3 px-3 text-start font-semibold">Location</th>
                    <th className="py-3 px-3 text-end font-semibold">Total Area (m²)</th>
                    <th className="py-3 px-3 text-end font-semibold">Total Vol (m³)</th>
                    <th className="py-3 px-3 text-start font-semibold">Server Link Path</th>
                    <th className="py-3 px-3 text-start font-semibold">Scope of Work</th>
                    <th className="py-3 px-3 text-start font-semibold">Proposal Components</th>
                    <th className="py-3 px-3 text-start font-semibold">Project Priority</th>
                    <th className="py-3 px-3 text-start font-semibold">Duplicate Status</th>
                    <th className="py-3 px-3 text-start font-semibold">Duplicates With</th>
                    <th className="py-3 px-3 text-start font-semibold">Contact Name</th>
                    <th className="py-3 px-3 text-start font-semibold">Contact Number</th>
                    <th className="py-3 px-3 text-start font-semibold">Contact Job Title</th>
                    <th className="py-3 px-3 text-start font-semibold">Contact E-mail</th>
                    <th className="py-3 px-3 text-start font-semibold">Contact Address</th>
                  </>
                )}

                {showGroup('dates') && (
                  <>
                    <th className="py-3 px-3 text-start font-semibold">Proposal Received Date</th>
                    <th className="py-3 px-3 text-start font-semibold">Expected Send Date</th>
                    <th className="py-3 px-3 text-start font-semibold">Deadline</th>
                    <th className="py-3 px-3 text-start font-semibold">Actual Sent Date</th>
                    <th className="py-3 px-3 text-start font-semibold">Tender Status</th>
                    {canSeeTeam && (
                      <>
                        <th className="py-3 px-3 text-start font-semibold">Civil/Arch Eng</th>
                        <th className="py-3 px-3 text-start font-semibold">Mech Pricing</th>
                        <th className="py-3 px-3 text-start font-semibold">Elec Pricing</th>
                      </>
                    )}
                    <th className="py-3 px-3 text-start font-semibold">Tender Status Notes</th>
                    <th className="py-3 px-3 text-center font-semibold">Delayed Days</th>
                  </>
                )}

                {showGroup('pricing') && (
                  <>
                    <th className="py-3 px-3 text-end font-semibold">Maintenance Cost</th>
                    <th className="py-3 px-3 text-end font-semibold">Supply Cost</th>
                    <th className="py-3 px-3 text-end font-semibold">Design Cost</th>
                    <th className="py-3 px-3 text-end font-semibold">Civil Cost</th>
                    <th className="py-3 px-3 text-end font-semibold">Mechanical Cost</th>
                    <th className="py-3 px-3 text-end font-semibold">Electrical Cost</th>
                    <th className="py-3 px-3 text-end font-bold bg-pzone-teal/30">Tender Total (EGP)</th>
                    <th className="py-3 px-3 text-end font-semibold">Exch.rate/Sent date</th>
                    <th className="py-3 px-3 text-end font-bold bg-pzone-teal/30">Total in USD</th>
                  </>
                )}

                {showGroup('contract') && (
                  <>
                    <th className="py-3 px-3 text-start font-semibold">Project Status</th>
                    <th className="py-3 px-3 text-start font-semibold">Contract Date</th>
                    <th className="py-3 px-3 text-start font-semibold">Project Status Note</th>
                    <th className="py-3 px-3 text-start font-semibold">PR Code</th>
                    <th className="py-3 px-3 text-start font-semibold">Project Name</th>
                    <th className="py-3 px-3 text-start font-semibold">PR Contract Date</th>
                    <th className="py-3 px-3 text-end font-semibold">Final Contract (EGP)</th>
                    <th className="py-3 px-3 text-end font-semibold">Exch.rate/Contract</th>
                    <th className="py-3 px-3 text-end font-semibold">Contract Total (USD)</th>
                    <th className="py-3 px-3 text-start font-semibold">Final Contracted Status</th>
                    <th className="py-3 px-3 text-start font-semibold">Final Contract Notes</th>
                  </>
                )}

                {showGroup('audit') && (
                  <>
                    <th className="py-3 px-3 text-start font-semibold">Entered By</th>
                    <th className="py-3 px-3 text-start font-semibold">Entered At</th>
                    <th className="py-3 px-3 text-start font-semibold">Last Updated By</th>
                    <th className="py-3 px-3 text-start font-semibold">Last Updated At</th>
                  </>
                )}

                <th className="py-3 px-3 text-end font-bold sticky end-0 z-20 bg-pzone-navy">
                  Quick Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredTenders.map((t) => {
                const isOverdue = t.delayed_days > 0 && !t.actual_sent_date;
                return (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/tenders/${t.id}`)}
                    className="group hover:bg-pzone-teal/5 cursor-pointer transition-colors"
                  >
                    {/* S */}
                    <td
                      className={`${cellPad} w-12 min-w-[48px] font-tabular font-bold text-muted-foreground sticky start-0 z-10 bg-card group-hover:bg-muted/80 border-e border-border`}
                    >
                      {t.serial_no}
                    </td>

                    {/* Proposal Code */}
                    <td
                      className={`${cellPad} font-mono font-bold text-pzone-navy dark:text-pzone-teal sticky start-12 z-10 bg-card group-hover:bg-muted/80 border-e border-border`}
                    >
                      {t.proposal_code}
                    </td>

                    {/* #4 Proposal Rev */}
                    <td
                      className={`${cellPad} text-center border-e border-border`}
                      onClick={(e) => {
                        const totalRevs =
                          revCountByCode.get(t.proposal_code.trim().toLowerCase()) || 1;
                        if (totalRevs > 1 || t.proposal_rev > 0) {
                          e.stopPropagation();
                          navigate(`/tenders/${t.id}?tab=revisions`);
                        }
                      }}
                    >
                      {(() => {
                        const totalRevs =
                          revCountByCode.get(t.proposal_code.trim().toLowerCase()) || 1;
                        const hasRevs = totalRevs > 1 || t.proposal_rev > 0;
                        return (
                          <div className="inline-flex items-center gap-1">
                            <span
                              title={
                                hasRevs
                                  ? `${totalRevs} revisions — click to view revision history`
                                  : 'Initial Revision (Rev 00)'
                              }
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold font-tabular ${
                                hasRevs
                                  ? 'bg-pzone-magenta/15 text-pzone-magenta border border-pzone-magenta/30'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              R{String(t.proposal_rev).padStart(2, '0')}
                              {totalRevs > 1 && (
                                <span className="ms-1 text-[10px] opacity-85">
                                  ({totalRevs})
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* #12 Proposal Name */}
                    <td
                      className={`${cellPad} font-bold text-foreground border-e border-border max-w-xs truncate`}
                      title={t.proposal_name}
                    >
                      {t.proposal_name}
                    </td>

                    {showGroup('identity') && (
                      <>
                        <td className={`${cellPad} font-tabular`}>{t.year}</td>
                        <td className={cellPad}>
                          {getLookupLabel(t.sales_representative_id, language)}
                        </td>
                        <td className={cellPad}>{t.pzone_role || '—'}</td>
                        <td className={cellPad}>{t.contractor || '—'}</td>
                        <td className={`${cellPad} font-semibold text-foreground`}>
                          {t.owner}
                        </td>
                        <td className={cellPad}>{t.country || 'Egypt'}</td>
                        <td className={cellPad}>{t.governorate || '—'}</td>
                        <td className={cellPad}>{t.area || '—'}</td>
                        <td className={`${cellPad} font-medium text-pzone-teal`}>
                          {t.district || '—'}
                        </td>
                        <td className={cellPad}>{t.location || '—'}</td>
                        <td className={`${cellPad} text-end font-tabular font-semibold`}>
                          {t.total_components_area_m2.toLocaleString()} m²
                        </td>
                        <td className={`${cellPad} text-end font-tabular font-semibold`}>
                          {t.total_components_volume_m3.toLocaleString()} m³
                        </td>
                        <td className={cellPad}>
                          {t.server_link_path ? (
                            <button
                              type="button"
                              onClick={(e) => handleCopyPath(e, t.server_link_path)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-muted hover:bg-pzone-teal hover:text-white text-xs font-mono transition-colors"
                              title="Click to copy UNC server path"
                            >
                              <Copy className="w-3 h-3" />
                              <span className="max-w-[180px] truncate">
                                {t.server_link_path}
                              </span>
                            </button>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={cellPad}>
                          <span className="max-w-[220px] truncate inline-block">
                            {t.scope_of_work.join(', ') || '—'}
                          </span>
                        </td>
                        <td className={`${cellPad} text-pzone-teal font-medium`}>
                          {t.components_summary || '—'}
                        </td>
                        <td className={cellPad}>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              t.project_priority === 'Urgent'
                                ? 'bg-pzone-crimson/15 text-pzone-crimson'
                                : t.project_priority === 'High'
                                  ? 'bg-pzone-orange/15 text-pzone-orange'
                                  : 'bg-pzone-teal/15 text-pzone-teal'
                            }`}
                          >
                            {t.project_priority}
                          </span>
                        </td>
                        <td className={cellPad}>{t.is_duplicate}</td>
                        <td className={cellPad}>{t.duplicate_of_tender_id || '—'}</td>
                        <td className={cellPad}>{t.contact_name || '—'}</td>
                        <td className={`${cellPad} font-tabular`}>
                          {t.contact_number || '—'}
                        </td>
                        <td className={cellPad}>{t.contact_job_title || '—'}</td>
                        <td className={cellPad}>{t.contact_email || '—'}</td>
                        <td className={cellPad}>{t.contact_address || '—'}</td>
                      </>
                    )}

                    {showGroup('dates') && (
                      <>
                        <td className={`${cellPad} font-tabular`}>
                          {formatDateDdMmYyyy(t.received_date)}
                        </td>
                        <td className={`${cellPad} font-tabular`}>
                          {formatDateDdMmYyyy(t.expected_send_date)}
                        </td>
                        <td className={`${cellPad} font-tabular font-semibold text-pzone-orange`}>
                          {formatDateDdMmYyyy(t.deadline_date)}
                        </td>
                        <td className={`${cellPad} font-tabular font-semibold text-pzone-seagreen`}>
                          {formatDateDdMmYyyy(t.actual_sent_date)}
                        </td>
                        <td
                          className={cellPad}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {user &&
                          canEditTenderField(
                            user.role,
                            'tender_status',
                            isUserAssignedToTender(user.id, t.id)
                          ) ? (
                            <select
                              value={t.tender_status}
                              onChange={(e) => {
                                updateTender(
                                  t.id,
                                  { tender_status: e.target.value },
                                  {
                                    id: user.id,
                                    full_name: user.full_name,
                                    role: user.role,
                                  }
                                );
                                showToast(
                                  `Updated ${t.proposal_code} status to ${e.target.value}`
                                );
                              }}
                              className="px-2 py-1 rounded-lg bg-muted font-semibold text-xs border border-border"
                            >
                              {statuses.map((s) => (
                                <option key={s.id} value={s.label_en}>
                                  {s.label_en}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-muted font-semibold text-xs">
                              {t.tender_status}
                            </span>
                          )}
                        </td>
                        {canSeeTeam && (
                          <>
                            <td className={cellPad}>
                              {t.responsible_civil_engineer_id ? (
                                <div className="leading-tight">
                                  <div className="font-medium text-foreground">
                                    {getProfileName(
                                      t.responsible_civil_engineer_id,
                                      language
                                    )}
                                  </div>
                                  <div className="text-[11px] font-tabular text-pzone-teal mt-0.5">
                                    {isAr ? 'تاريخ التعيين:' : 'Assigned:'}{' '}
                                    {formatDateDdMmYyyy(
                                      getEngineerAssignedDate(
                                        t,
                                        'Civil/Arch',
                                        allAssignments
                                      )
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className={cellPad}>
                              {t.mechanical_pricing_responsible_id ? (
                                <div className="leading-tight">
                                  <div className="font-medium text-foreground">
                                    {getProfileName(
                                      t.mechanical_pricing_responsible_id,
                                      language
                                    )}
                                  </div>
                                  <div className="text-[11px] font-tabular text-pzone-teal mt-0.5">
                                    {isAr ? 'تاريخ التعيين:' : 'Assigned:'}{' '}
                                    {formatDateDdMmYyyy(
                                      getEngineerAssignedDate(
                                        t,
                                        'Mechanical Pricing',
                                        allAssignments
                                      )
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className={cellPad}>
                              {t.electrical_pricing_responsible_id ? (
                                <div className="leading-tight">
                                  <div className="font-medium text-foreground">
                                    {getProfileName(
                                      t.electrical_pricing_responsible_id,
                                      language
                                    )}
                                  </div>
                                  <div className="text-[11px] font-tabular text-pzone-teal mt-0.5">
                                    {isAr ? 'تاريخ التعيين:' : 'Assigned:'}{' '}
                                    {formatDateDdMmYyyy(
                                      getEngineerAssignedDate(
                                        t,
                                        'Electrical Pricing',
                                        allAssignments
                                      )
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </>
                        )}
                        <td className={`${cellPad} max-w-[220px] truncate`}>
                          {t.tender_status_notes || '—'}
                        </td>
                        <td className={`${cellPad} text-center font-tabular`}>
                          {t.delayed_days > 0 ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                isOverdue
                                  ? 'bg-pzone-crimson text-white'
                                  : 'bg-pzone-orange/15 text-pzone-orange'
                              }`}
                            >
                              {t.delayed_days}d
                            </span>
                          ) : (
                            <span className="text-pzone-seagreen font-semibold">0d</span>
                          )}
                        </td>
                      </>
                    )}

                    {showGroup('pricing') && (
                      <>
                        <td className={`${cellPad} text-end font-tabular`}>
                          {t.maintenance_cost.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={`${cellPad} text-end font-tabular`}>
                          {t.supply_cost.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={`${cellPad} text-end font-tabular`}>
                          {t.design_cost.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={`${cellPad} text-end font-tabular text-pzone-orange font-medium`}>
                          {t.civil_cost.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={`${cellPad} text-end font-tabular text-pzone-teal font-medium`}>
                          {t.mechanical_cost.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={`${cellPad} text-end font-tabular text-pzone-magenta font-medium`}>
                          {t.electrical_cost.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={`${cellPad} text-end font-tabular font-extrabold text-foreground bg-pzone-teal/5`}>
                          {t.tender_total_price.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          EGP
                        </td>
                        <td className={`${cellPad} text-end font-tabular text-xs`}>
                          {t.exchange_rate_on_sent_date
                            ? t.exchange_rate_on_sent_date.toFixed(2)
                            : '—'}
                        </td>
                        <td className={`${cellPad} text-end font-tabular font-extrabold text-pzone-teal bg-pzone-teal/5`}>
                          {t.tender_total_price_usd
                            ? `$${t.tender_total_price_usd.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : '—'}
                        </td>
                      </>
                    )}

                    {showGroup('contract') && (
                      <>
                        <td className={cellPad}>
                          {t.project_status ? (
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                t.project_status === 'Awarded'
                                  ? 'bg-pzone-seagreen/20 text-pzone-seagreen'
                                  : t.project_status === 'Lost'
                                    ? 'bg-pzone-crimson/15 text-pzone-crimson'
                                    : 'bg-pzone-teal/15 text-pzone-teal'
                              }`}
                            >
                              {t.project_status}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className={`${cellPad} font-tabular`}>
                          {formatDateDdMmYyyy(t.contract_date)}
                        </td>
                        <td className={`${cellPad} max-w-[180px] truncate`}>
                          {t.project_status_note || '—'}
                        </td>
                        <td className={`${cellPad} font-mono`}>{t.pr_code || '—'}</td>
                        <td className={cellPad}>{t.project_name || '—'}</td>
                        <td className={`${cellPad} font-tabular`}>
                          {formatDateDdMmYyyy(t.pr_contract_date)}
                        </td>
                        <td className={`${cellPad} text-end font-tabular font-bold`}>
                          {t.final_pr_contract_total_price
                            ? `${t.final_pr_contract_total_price.toLocaleString()} EGP`
                            : '—'}
                        </td>
                        <td className={`${cellPad} text-end font-tabular`}>
                          {t.exchange_rate_on_contract_date
                            ? t.exchange_rate_on_contract_date.toFixed(2)
                            : '—'}
                        </td>
                        <td className={`${cellPad} text-end font-tabular font-bold text-pzone-seagreen`}>
                          {t.pr_contract_total_price_usd
                            ? `$${t.pr_contract_total_price_usd.toLocaleString()}`
                            : '—'}
                        </td>
                        <td className={cellPad}>{t.final_contracted_status || '—'}</td>
                        <td className={`${cellPad} max-w-[180px] truncate`}>
                          {t.final_contracted_status_notes || '—'}
                        </td>
                      </>
                    )}

                    {showGroup('audit') && (
                      <>
                        <td className={cellPad}>
                          {getProfileName(t.created_by, language)}
                        </td>
                        <td className={`${cellPad} font-tabular text-xs text-muted-foreground`}>
                          {formatDateTimeCairo(t.created_at)}
                        </td>
                        <td className={cellPad}>
                          {getProfileName(t.updated_by, language)}
                        </td>
                        <td className={`${cellPad} font-tabular text-xs text-muted-foreground`}>
                          {formatDateTimeCairo(t.updated_at)}
                        </td>
                      </>
                    )}

                    {/* Quick Actions */}
                    <td
                      className={`${cellPad} text-end sticky end-0 z-10 bg-card group-hover:bg-muted/80 border-s border-border`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        {user && canOpenIntelligentTender(user) && (
                          <button
                            type="button"
                            onClick={async () => {
                              const route = await startIntelligentTender(t, user);
                              navigate(route);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pzone-teal to-pzone-seagreen hover:opacity-95 text-white text-xs font-bold shadow-sm border border-white/20 transition-all cursor-pointer"
                            title={
                              canAccessErpEngineering(user)
                                ? 'Start Intelligent Tender in ERP Estimation Engine'
                                : 'Open Commercial Overheads & Bid Price for this Tender'
                            }
                          >
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {canAccessErpEngineering(user)
                                ? isAr
                                  ? 'التسعير الذكي ERP'
                                  : 'Intelligent Tender'
                                : isAr
                                  ? 'المصاريف وسعر العطاء'
                                  : 'Commercial Overheads'}
                            </span>
                          </button>
                        )}

                        {user && canAssignEngineers(user) && (
                          <button
                            type="button"
                            onClick={() => openAssignModal(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-pzone-teal/15 hover:bg-pzone-teal text-pzone-teal hover:text-white text-xs font-semibold border border-pzone-teal/30 transition-colors"
                            title="Quick Assign Team & Expected Send Date"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تعيين الفريق' : 'Assign Team'}</span>
                          </button>
                        )}

                        {user && canManageContract(user.role) && (
                          <button
                            type="button"
                            onClick={() => navigate(`/tenders/${t.id}?tab=contract`)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                              t.project_status === 'Awarded' ||
                              t.final_contracted_status === 'Contract Signed'
                                ? 'bg-pzone-seagreen/20 text-pzone-seagreen border-pzone-seagreen/40 hover:bg-pzone-seagreen hover:text-white'
                                : 'bg-muted hover:bg-pzone-seagreen hover:text-white text-foreground border-border'
                            }`}
                            title="Switch Proposal to Contract / Fill Contract Data"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>
                              {t.project_status === 'Awarded' ||
                              t.final_contracted_status === 'Contract Signed'
                                ? isAr
                                  ? 'متعاقد'
                                  : 'Contracted'
                                : isAr
                                  ? 'تحويل لعقد'
                                  : 'Contract'}
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => navigate(`/tenders/${t.id}`)}
                          className="p-1.5 rounded-lg bg-muted hover:bg-pzone-teal hover:text-white text-foreground transition-colors"
                          title="Open Tender Detail"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>

                        {user && canCreateRevision(user.role) && (
                          <button
                            type="button"
                            onClick={() => {
                              setRevModalTender(t);
                              setRevRequestedBy(t.owner);
                            }}
                            className="p-1.5 rounded-lg bg-muted hover:bg-pzone-magenta hover:text-white text-foreground transition-colors"
                            title="Create New Revision (Rev + 1)"
                          >
                            <GitBranchPlus className="w-3.5 h-3.5" />
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

      {/* New Revision Modal (Section 5.1a) */}
      {revModalTender && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRevModalTender(null)}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-card shadow-2xl p-6 space-y-4 border-ribbon-top"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                New Revision for {revModalTender.proposal_code}
              </h3>
              <button
                type="button"
                onClick={() => setRevModalTender(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Copies <strong>{revModalTender.proposal_name}</strong> and all its
              water feature components into{' '}
              <strong>Rev {revModalTender.proposal_rev + 1}</strong>, linked to
              Rev {revModalTender.proposal_rev}.
            </p>

            <form onSubmit={handleCreateRevision} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Revision Reason *
                </label>
                <select
                  value={revReason}
                  onChange={(e) => setRevReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground"
                >
                  {revisionReasons.map((r) => (
                    <option key={r.id} value={r.label_en}>
                      {isAr ? r.label_ar : r.label_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Requested By *
                </label>
                <input
                  type="text"
                  required
                  value={revRequestedBy}
                  onChange={(e) => setRevRequestedBy(e.target.value)}
                  placeholder="Client / Consultant Name"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRevModalTender(null)}
                  className="px-4 py-2 rounded-xl bg-muted text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pzone-magenta text-white text-xs font-semibold shadow-sm"
                >
                  Create Rev {revModalTender.proposal_rev + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Assign Team Modal (View Data First -> Click Edit to Assign/Change) */}
      {assignModalTender && (() => {
        const liveTender =
          tenders.find((x) => x.id === assignModalTender.id) || assignModalTender;
        const tenderAssignments = allAssignments.filter(
          (a) => a.tender_id === liveTender.id
        );
        const canEditAssign = Boolean(user && canAssignEngineers(user));

        return (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setAssignModalTender(null)}
          >
            <div
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-card shadow-2xl p-6 space-y-4 border-ribbon-top"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-pzone-teal shrink-0" />
                      <span>{liveTender.proposal_code}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-bold font-tabular text-muted-foreground">
                      R{liveTender.proposal_rev}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-pzone-teal/15 text-pzone-teal text-[11px] font-semibold">
                      {liveTender.tender_status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-[11px] font-semibold text-foreground">
                      {liveTender.project_priority}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {liveTender.proposal_name}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!isEditingAssignModal && canEditAssign && (
                    <button
                      type="button"
                      onClick={() => {
                        syncAssignDraftFromTender(liveTender);
                        setIsEditingAssignModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pzone-teal hover:bg-pzone-teal/90 text-white text-xs font-semibold shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تعديل / تعيين' : 'Edit'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAssignModalTender(null)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tender Data Summary Card */}
              <div className="rounded-2xl bg-muted/40 border border-border p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                      {isAr ? 'المالك / المطور' : 'Owner / Developer'}
                    </span>
                    <span className="font-semibold text-foreground">
                      {liveTender.owner || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                      {isAr ? 'المقاول العام' : 'Main Contractor'}
                    </span>
                    <span className="font-semibold text-foreground">
                      {liveTender.contractor || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                      {isAr ? 'مسؤول المبيعات' : 'Sales Representative'}
                    </span>
                    <span className="font-semibold text-foreground">
                      {getLookupLabel(liveTender.sales_representative_id, language)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                      {isAr ? 'المنطقة / المشروع' : 'Location / District'}
                    </span>
                    <span className="font-semibold text-foreground">
                      {[liveTender.governorate, liveTender.area, liveTender.district]
                        .filter(Boolean)
                        .join(' • ') || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                      {isAr ? 'تاريخ الاستلام' : 'Received Date'}
                    </span>
                    <span className="font-tabular font-semibold text-foreground">
                      {formatDateDdMmYyyy(liveTender.received_date)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                      {isAr ? 'الموعد النهائي (Deadline)' : 'Deadline'}
                    </span>
                    <span className="font-tabular font-semibold text-pzone-crimson">
                      {formatDateDdMmYyyy(liveTender.deadline_date)}
                    </span>
                  </div>
                </div>

                {liveTender.scope_of_work.length > 0 && (
                  <div className="pt-2 border-t border-border/70">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1.5">
                      {isAr ? 'نطاق العمل' : 'Scope of Work'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {liveTender.scope_of_work.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-background border border-border text-[11px] font-medium text-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(liveTender.components_summary ||
                  liveTender.total_components_area_m2 > 0) && (
                  <div className="pt-2 border-t border-border/70 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {liveTender.components_summary || '—'}
                    </span>
                    <span className="font-tabular font-semibold text-pzone-teal">
                      {liveTender.total_components_area_m2.toLocaleString()} m² /{' '}
                      {liveTender.total_components_volume_m3.toLocaleString()} m³
                    </span>
                  </div>
                )}
              </div>

              {/* VIEW MODE vs EDIT MODE */}
              {!isEditingAssignModal ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {isAr
                        ? 'الفريق المعين وتاريخ الإرسال المتوقع'
                        : 'Assigned Team & Schedule'}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {(
                      [
                        'Civil/Arch',
                        'Mechanical Pricing',
                        'Electrical Pricing',
                      ] as DisciplineType[]
                    ).map((disc) => {
                      const engId =
                        disc === 'Civil/Arch'
                          ? liveTender.responsible_civil_engineer_id
                          : disc === 'Mechanical Pricing'
                            ? liveTender.mechanical_pricing_responsible_id
                            : liveTender.electrical_pricing_responsible_id;
                      const assignedAt = getEngineerAssignedDate(
                        liveTender,
                        disc,
                        tenderAssignments
                      );
                      const discAsg = tenderAssignments.find(
                        (a) => a.discipline === disc
                      );
                      const engProfile = engineers.find((p) => p.id === engId);

                      return (
                        <div
                          key={disc}
                          className="rounded-xl bg-background border border-border px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="text-[11px] font-bold text-muted-foreground block">
                              {disc} Responsible
                            </span>
                            {engId ? (
                              <span className="text-sm font-semibold text-foreground">
                                {getProfileName(engId, language)}
                                {engProfile?.team ? (
                                  <span className="text-xs font-normal text-muted-foreground">
                                    {' '}
                                    ({engProfile.team})
                                  </span>
                                ) : null}
                              </span>
                            ) : (
                              <span className="text-xs italic text-muted-foreground">
                                {isAr ? 'غير معين بعد' : 'Not assigned yet'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {engId && assignedAt ? (
                              <span className="px-2 py-0.5 rounded-full bg-pzone-teal/15 text-pzone-teal text-[11px] font-tabular font-semibold">
                                {isAr ? 'تاريخ التعيين:' : 'Assigned:'}{' '}
                                {formatDateDdMmYyyy(assignedAt)}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-semibold">
                                Unassigned
                              </span>
                            )}
                            {discAsg && (
                              <span className="text-[10px] font-semibold text-muted-foreground">
                                Status: {discAsg.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div className="rounded-xl bg-background border border-border px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-muted-foreground">
                        {isAr
                          ? 'تاريخ الإرسال المتوقع (Expected Send Date)'
                          : 'Expected Send / Due Date'}
                      </span>
                      <span className="font-tabular font-bold text-sm text-foreground">
                        {formatDateDdMmYyyy(liveTender.expected_send_date, 'Not set')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = liveTender.id;
                        setAssignModalTender(null);
                        navigate(`/tenders/${targetId}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-pzone-teal hover:bg-pzone-teal/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{isAr ? 'فتح صفحة العرض' : 'Open Full Tender'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignModalTender(null)}
                        className="px-4 py-2 rounded-xl bg-muted text-xs font-semibold text-foreground"
                      >
                        {isAr ? 'إغلاق' : 'Close'}
                      </button>
                      {canEditAssign && (
                        <button
                          type="button"
                          onClick={() => {
                            syncAssignDraftFromTender(liveTender);
                            setIsEditingAssignModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-pzone-teal hover:bg-pzone-teal/90 text-white text-xs font-semibold shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تعديل / تعيين الفريق' : 'Edit / Assign'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleQuickAssignTeam} className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-pzone-teal">
                      {isAr
                        ? 'تعديل تعيين المهندسين وتاريخ الإرسال'
                        : 'Edit Team Assignment & Due Date'}
                    </h4>
                  </div>

                  <EngineerWorkloadAdvisor
                    summaries={workloadSummaries}
                    subtitle="Click an engineer below or choose from dropdowns (NS = Not Started, IP = In Progress, Fin = Finished)"
                    onQuickSelectEngineer={(engId, role) => {
                      if (role === 'civil_tender_engineer') {
                        setAssignDraft((prev) => ({
                          ...prev,
                          'Civil/Arch': engId,
                        }));
                      } else if (role === 'mechanical_engineer') {
                        setAssignDraft((prev) => ({
                          ...prev,
                          'Mechanical Pricing': engId,
                          ...(elecManuallyEdited
                            ? {}
                            : { 'Electrical Pricing': engId }),
                        }));
                      } else if (role === 'electrical_engineer') {
                        setElecManuallyEdited(true);
                        setAssignDraft((prev) => ({
                          ...prev,
                          'Electrical Pricing': engId,
                        }));
                      }
                    }}
                  />

                  {(
                    [
                      'Civil/Arch',
                      'Mechanical Pricing',
                      'Electrical Pricing',
                    ] as DisciplineType[]
                  ).map((disc) => {
                    const currentEngId =
                      disc === 'Civil/Arch'
                        ? liveTender.responsible_civil_engineer_id
                        : disc === 'Mechanical Pricing'
                          ? liveTender.mechanical_pricing_responsible_id
                          : liveTender.electrical_pricing_responsible_id;
                    const currentAssignedAt = getEngineerAssignedDate(
                      liveTender,
                      disc,
                      tenderAssignments
                    );
                    const selectedEngId = assignDraft[disc] || '';
                    return (
                      <div key={disc}>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label className="block text-xs font-semibold text-foreground">
                            {disc} Responsible
                          </label>
                          {selectedEngId &&
                            selectedEngId === (currentEngId || '') &&
                            currentAssignedAt && (
                              <span className="px-2 py-0.5 rounded-full bg-pzone-teal/15 text-pzone-teal text-[11px] font-tabular font-semibold">
                                {isAr ? 'تاريخ التعيين:' : 'Assigned:'}{' '}
                                {formatDateDdMmYyyy(currentAssignedAt)}
                              </span>
                            )}
                          {selectedEngId && selectedEngId !== (currentEngId || '') && (
                            <span className="px-2 py-0.5 rounded-full bg-pzone-orange/15 text-pzone-orange text-[11px] font-tabular font-semibold">
                              {isAr ? 'سيتم تسجيل تاريخ اليوم:' : 'Assign Date:'}{' '}
                              {formatDateDdMmYyyy(todayCairoIso())}
                            </span>
                          )}
                        </div>
                        <select
                          value={selectedEngId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (disc === 'Mechanical Pricing') {
                              setAssignDraft((prev) => ({
                                ...prev,
                                'Mechanical Pricing': val,
                                ...(elecManuallyEdited ? {} : { 'Electrical Pricing': val }),
                              }));
                            } else if (disc === 'Electrical Pricing') {
                              setElecManuallyEdited(true);
                              setAssignDraft((prev) => ({
                                ...prev,
                                'Electrical Pricing': val,
                              }));
                            } else {
                              setAssignDraft((prev) => ({
                                ...prev,
                                [disc]: val,
                              }));
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground"
                        >
                          <option value="">— Unassigned —</option>
                          {[...engineers]
                            .sort((a, b) => {
                              const matchDiff =
                                Number(isEngineerMatchingDiscipline(b.role, disc)) -
                                Number(isEngineerMatchingDiscipline(a.role, disc));
                              if (matchDiff !== 0) return matchDiff;
                              const openA =
                                workloadByEngineerId.get(a.id)?.openCount ?? 0;
                              const openB =
                                workloadByEngineerId.get(b.id)?.openCount ?? 0;
                              return openA - openB;
                            })
                            .map((eng) => {
                              const wl = workloadByEngineerId.get(eng.id);
                              const wlLabel = wl
                                ? ` — Not Started: ${wl.notStartedCount} | In Progress: ${wl.inProgressCount} | Finished: ${wl.finishedCount}`
                                : '';
                              return (
                                <option key={eng.id} value={eng.id}>
                                  {isAr && eng.full_name_ar
                                    ? eng.full_name_ar
                                    : eng.full_name}{' '}
                                  ({eng.team}){wlLabel}
                                </option>
                              );
                            })}
                        </select>
                        {disc === 'Electrical Pricing' &&
                          !elecManuallyEdited &&
                          Boolean(assignDraft['Mechanical Pricing']) &&
                          assignDraft['Electrical Pricing'] ===
                            assignDraft['Mechanical Pricing'] && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {isAr
                                ? 'تم تعيين مهندس الكهرباء تلقائياً مثل الميكانيكا — يمكنك تغييره في أي وقت.'
                                : 'Initially matched to Mechanical Pricing — you can update it anytime.'}
                            </p>
                          )}
                      </div>
                    );
                  })}

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Expected Send / Due Date
                    </label>
                    <DatePickerInput
                      value={assignDueDate}
                      onChange={(iso) => setAssignDueDate(iso)}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => {
                        syncAssignDraftFromTender(liveTender);
                        setIsEditingAssignModal(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-muted text-xs font-semibold text-foreground"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-pzone-teal hover:bg-pzone-teal/90 text-white text-xs font-semibold shadow-sm"
                    >
                      {isAr ? 'حفظ التعيين وإرسال الإشعارات' : 'Save & Notify'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
