import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ClipboardCopy,
  ExternalLink,
  Eye,
  Filter,
  Layers,
  PauseCircle,
  Plus,
  RotateCcw,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Table as TableIcon,
  Trash2,
  UserCheck,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { startIntelligentTender } from '@/lib/erpBridge';
import {
  addComponentDatabaseEntry,
  assignEngineersToTender,
  deleteComponent,
  getAllAssignments,
  getAllComponents,
  getComponentsByTender,
  getDocumentsByTender,
  getEffectiveDisciplineStage,
  getEngineerWorkloadSummary,
  getLookupLabel,
  getLookupsByCategory,
  getProfileName,
  getProfiles,
  getProposalStageForViewer,
  getTasks,
  getTenderRevisions,
  getTenders,
  isUserAssignedToTender,
  moveKanbanTask,
  setTenderPumpRoomIncluded,
  subscribeDataStore,
  toKanbanBoardStage,
  updateDisciplineAssignmentStatus,
  upsertComponent,
} from '@/lib/dataStore';
import {
  canAccessErpEngineering,
  canAssignEngineers,
  canEditComponentDisciplineCost,
  canEditComponents,
  canMoveKanbanCard,
  canOpenIntelligentTender,
  hasFullTenderAuthority,
  isAssignableEngineerOrManager,
  isEngineerRole,
} from '@/lib/permissions';
import {
  computeComponentFields,
  formatCurrency,
  formatNumber,
  waterFeatureRequiresDepth,
} from '@/lib/formulas';
import { SearchableDbSelect } from '@/components/ui/SearchableDbSelect';
import {
  DatePickerInput,
  formatDateDdMmYyyy,
  todayCairoIso,
} from '@/components/ui/DatePickerInput';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { ComponentSubZonesEditor } from '@/components/ui/ComponentSubZonesEditor';
import type {
  AssignmentStatus,
  ComponentSubZone,
  DisciplineType,
  KanbanBoardStage,
  ProposalComponent,
  Task,
  Tender,
  TenderAssignment,
} from '@/types/database';

type BoardViewMode = 'table' | 'calendar' | 'workload';

const STAGE_TABS: {
  status: KanbanBoardStage;
  labelEn: string;
  labelAr: string;
  dotClass: string;
  badgeClass: string;
  idleTabClass: string;
  activeTabClass: string;
  rowAccentClass: string;
}[] = [
  {
    status: 'Not Started',
    labelEn: 'Not Started',
    labelAr: 'لم تبدأ',
    dotClass: 'bg-sky-500',
    badgeClass:
      'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/40',
    idleTabClass:
      'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/35 hover:bg-sky-500/20',
    activeTabClass: 'bg-sky-600 text-white border-sky-600',
    rowAccentClass: 'border-l-4 border-l-sky-500',
  },
  {
    status: 'In Progress',
    labelEn: 'In Progress',
    labelAr: 'قيد التنفيذ',
    dotClass: 'bg-amber-500 animate-pulse',
    badgeClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/45',
    idleTabClass:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/35 hover:bg-amber-500/20',
    activeTabClass: 'bg-amber-500 text-white border-amber-500',
    rowAccentClass: 'border-l-4 border-l-amber-500',
  },
  {
    status: 'Cancelled or Waiting',
    labelEn: 'Cancelled or Waiting',
    labelAr: 'ملغاة أو بالانتظار',
    dotClass: 'bg-rose-500',
    badgeClass:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40',
    idleTabClass:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/35 hover:bg-rose-500/20',
    activeTabClass: 'bg-rose-600 text-white border-rose-600',
    rowAccentClass: 'border-l-4 border-l-rose-500',
  },
  {
    status: 'Finished',
    labelEn: 'Finished',
    labelAr: 'مكتملة',
    dotClass: 'bg-emerald-500',
    badgeClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    idleTabClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/20',
    activeTabClass: 'bg-emerald-600 text-white border-emerald-600',
    rowAccentClass: 'border-l-4 border-l-emerald-500',
  },
  {
    status: 'Sent',
    labelEn: 'Sent',
    labelAr: 'تم الإرسال',
    dotClass: 'bg-indigo-500',
    badgeClass:
      'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/40',
    idleTabClass:
      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/35 hover:bg-indigo-500/20',
    activeTabClass: 'bg-indigo-600 text-white border-indigo-600',
    rowAccentClass: 'border-l-4 border-l-indigo-500',
  },
];

interface EnrichedBoardItem {
  task: Task;
  stage: KanbanBoardStage;
  tender: Tender;
  assignments: TenderAssignment[];
  components: ProposalComponent[];
  componentCount: number;
  isOverdue: boolean;
  isDueThisWeek: boolean;
}

export const Board: React.FC = () => {
  const navigate = useNavigate();
  const { user, lang } = useApp();
  const [version, setVersion] = useState(0);
  const [viewMode, setViewMode] = useState<BoardViewMode>('table');
  const [stageFilter, setStageFilter] = useState<'all' | KanbanBoardStage>(
    'all'
  );
  const [scopeMode, setScopeMode] = useState<'team' | 'mine'>('team');
  const [search, setSearch] = useState('');
  const [engineerFilter, setEngineerFilter] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dueThisWeekOnly, setDueThisWeekOnly] = useState(false);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Cancelled or Waiting Modal when moving to Cancelled or Waiting
  const [waitingPrompt, setWaitingPrompt] = useState<{
    taskId: string;
    proposalCode: string;
    reason: string;
    isCancelled: boolean;
  } | null>(null);

  // Proposal Details Modal, Inline Assign Team Modal & Quick Components / Pricing Modal
  const [assignModal, setAssignModal] = useState<{
    tenderId: string;
    proposalCode: string;
    proposalName: string;
    civilId: string;
    mechId: string;
    elecId: string;
    dueDate: string;
  } | null>(null);
  const [detailsTenderId, setDetailsTenderId] = useState<string | null>(null);
  const [detailsRevFilter, setDetailsRevFilter] = useState<string>('ALL');
  const [pricingTenderId, setPricingTenderId] = useState<string | null>(null);
  const [compDrafts, setCompDrafts] = useState<
    Record<string, Partial<ProposalComponent>>
  >({});
  const [expandedSpecIds, setExpandedSpecIds] = useState<
    Record<string, boolean>
  >({});
  const [showAddCompForm, setShowAddCompForm] = useState(false);
  const [newCompForm, setNewCompForm] = useState<{
    component_title: string;
    water_feature: string;
    component_shape: string;
    water_feature_type: string;
    filtration_method: string;
    finishing_type: string;
    pump_room_included: boolean;
    proposal_type: string;
    qty_same_specs: number;
    each_length_m: number | null;
    each_width_m: number | null;
    each_perimeter_m: number;
    sub_zones: ComponentSubZone[] | null;
    each_area_m2: number;
    each_avg_depth_m: number;
    volume_is_manual: boolean;
    each_volume_m3: number;
    total_civil_cost: number;
    total_mechanical_cost: number;
    total_electrical_cost: number;
    total_design_cost: number;
    total_supply_cost: number;
    total_maintenance_cost: number;
  }>({
    component_title: '',
    water_feature: '',
    component_shape: 'Rectangle',
    water_feature_type: 'Skimmer',
    filtration_method: 'Sand Filter',
    finishing_type: 'Mosaic',
    pump_room_included: false,
    proposal_type: 'Full Turnkey (Civil + MEP)',
    qty_same_specs: 1,
    each_length_m: null,
    each_width_m: null,
    each_perimeter_m: 0,
    sub_zones: null,
    each_area_m2: 0,
    each_avg_depth_m: 1.4,
    volume_is_manual: false,
    each_volume_m3: 0,
    total_civil_cost: 0,
    total_mechanical_cost: 0,
    total_electrical_cost: 0,
    total_design_cost: 0,
    total_supply_cost: 0,
    total_maintenance_cost: 0,
  });

  useEffect(() => {
    return subscribeDataStore(() => setVersion((v) => v + 1));
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const profiles = useMemo(() => getProfiles(), [version]);
  const componentsDb = useMemo(
    () => getLookupsByCategory('water_feature'),
    [version]
  );
  const componentShapesDb = useMemo(
    () => getLookupsByCategory('component_shape'),
    [version]
  );
  const waterFeatureTypes = useMemo(
    () => getLookupsByCategory('water_feature_type'),
    [version]
  );
  const filtrationMethodsDb = useMemo(
    () => getLookupsByCategory('filtration_method'),
    [version]
  );
  const finishingTypesDb = useMemo(
    () => getLookupsByCategory('finishing_type'),
    [version]
  );
  const engineers = useMemo(
    () =>
      profiles.filter(
        (p) => p.active && isAssignableEngineerOrManager(p)
      ),
    [profiles]
  );

  const allBoardItems = useMemo<EnrichedBoardItem[]>(() => {
    const tenders = getTenders().filter((t) => t.is_latest_revision);
    const tasks = getTasks();
    const allAsg = getAllAssignments();
    const allComps = getAllComponents();
    const todayStr = todayCairoIso();
    const weekLaterStr = new Date(
      new Date(`${todayStr}T00:00:00Z`).getTime() + 7 * 86400 * 1000
    )
      .toISOString()
      .slice(0, 10);

    const perspectiveUserId = engineerFilter
      ? engineerFilter
      : user &&
          (scopeMode === 'mine' ||
            (isAssignableEngineerOrManager(user) &&
              !hasFullTenderAuthority(user)))
        ? user.id
        : null;

    return tenders.map((tender) => {
      const assignments = allAsg.filter((a) => a.tender_id === tender.id);
      const tenderComps = allComps.filter((c) => c.tender_id === tender.id);
      const componentCount = tenderComps.length;
      const existingTask = tasks.find((tk) => tk.tender_id === tender.id);
      const hasAnyPricingData =
        componentCount > 0 ||
        tender.civil_cost > 0 ||
        tender.mechanical_cost > 0 ||
        tender.electrical_cost > 0 ||
        tender.total_components_area_m2 > 0;
      const fallbackStage = toKanbanBoardStage(
        'New',
        tender.actual_sent_date ? 'Sent to Client' : tender.tender_status,
        hasAnyPricingData ? Math.max(1, componentCount) : 0
      );
      const task: Task = existingTask || {
        id: `virtual-${tender.id}`,
        tender_id: tender.id,
        title: `${tender.proposal_code} — ${tender.proposal_name}`,
        kanban_status: fallbackStage,
        blocked_reason: null,
        due_date: tender.expected_send_date ?? null,
        progress_note: tender.tender_status_notes || null,
        completed_at: tender.actual_sent_date ?? null,
        created_by: tender.created_by ?? null,
        created_at: tender.created_at,
        updated_by: tender.updated_by ?? null,
        updated_at: tender.updated_at,
      };

      const stage = getProposalStageForViewer({
        task,
        tender,
        assignments,
        components: tenderComps,
        perspectiveUserId,
      });
      const isCancelled = tender.tender_status
        .toLowerCase()
        .includes('cancel');

      const isOverdue = Boolean(
        !tender.actual_sent_date &&
          tender.expected_send_date &&
          tender.expected_send_date < todayStr &&
          stage !== 'Sent' &&
          !isCancelled
      );
      const isDueThisWeek = Boolean(
        !tender.actual_sent_date &&
          tender.expected_send_date &&
          tender.expected_send_date >= todayStr &&
          tender.expected_send_date <= weekLaterStr &&
          stage !== 'Sent' &&
          !isCancelled
      );

      return {
        task,
        stage,
        tender,
        assignments,
        components: tenderComps,
        componentCount,
        isOverdue,
        isDueThisWeek,
      };
    });
  }, [version, scopeMode, user, engineerFilter]);

  const boardItems = useMemo<EnrichedBoardItem[]>(() => {
    return allBoardItems.filter((item) => {
      if (scopeMode === 'mine' && user) {
        if (!isUserAssignedToTender(user.id, item.tender.id)) return false;
      }
      if (engineerFilter) {
        if (!isUserAssignedToTender(engineerFilter, item.tender.id)) {
          return false;
        }
      }
      if (disciplineFilter) {
        if (
          !item.assignments.some((a) => a.discipline === disciplineFilter)
        ) {
          return false;
        }
      }
      if (priorityFilter && item.tender.project_priority !== priorityFilter) {
        return false;
      }
      if (overdueOnly && !item.isOverdue) return false;
      if (dueThisWeekOnly && !item.isDueThisWeek) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${item.tender.proposal_code} ${item.tender.proposal_name} ${item.tender.owner}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allBoardItems,
    scopeMode,
    user,
    engineerFilter,
    disciplineFilter,
    priorityFilter,
    overdueOnly,
    dueThisWeekOnly,
    search,
  ]);

  if (!user) return null;
  const actor = { id: user.id, full_name: user.full_name, role: user.role };

  const attemptMoveCard = (
    item: EnrichedBoardItem,
    target: KanbanBoardStage
  ) => {
    if (item.stage === target) return;
    const assigned = isUserAssignedToTender(user.id, item.tender.id);

    const hasStartedScope =
      item.componentCount > 0 ||
      item.assignments.length > 0 ||
      item.tender.civil_cost > 0 ||
      item.tender.mechanical_cost > 0 ||
      item.tender.electrical_cost > 0 ||
      item.tender.total_components_area_m2 > 0 ||
      hasFullTenderAuthority(user);

    if (target === 'In Progress' && !hasStartedScope) {
      showToast(
        'error',
        'Assign an engineer or start pricing (via Components or Intelligent ERP) to move to In Progress.'
      );
      return;
    }

    const allDoneNow =
      item.assignments.length > 0
        ? item.assignments.every(
            (a) =>
              getEffectiveDisciplineStage(a, item.components, item.tender) ===
              'Finished'
          )
        : item.stage === 'Finished';

    if (
      target === 'Sent' &&
      item.assignments.length > 0 &&
      !allDoneNow
    ) {
      showToast(
        'error',
        'All assigned engineers must be marked Finished before confirming Sent.'
      );
      return;
    }

    const effectiveFromStatus =
      target === 'Sent' && allDoneNow && item.stage !== 'Cancelled or Waiting'
        ? 'Finished'
        : item.task.kanban_status;

    if (
      !canMoveKanbanCard(
        user,
        effectiveFromStatus,
        target,
        assigned
      )
    ) {
      showToast(
        'error',
        target === 'Sent'
          ? 'Only assigned engineers or the Tender Manager can confirm Sent once all disciplines are finished.'
          : `Role '${user.role}' cannot move this card to '${target}'.`
      );
      return;
    }

    if (target === 'Cancelled or Waiting') {
      setWaitingPrompt({
        taskId: item.task.id,
        proposalCode: item.tender.proposal_code,
        reason: item.task.blocked_reason || '',
        isCancelled: item.tender.tender_status
          .toLowerCase()
          .includes('cancel'),
      });
      return;
    }

    try {
      moveKanbanTask(item.task.id, target, {}, actor);
      showToast(
        'success',
        target === 'Sent'
          ? `Confirmed ${item.tender.proposal_code} as Sent.`
          : `Moved ${item.tender.proposal_code} to ${target}.`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Move failed');
    }
  };

  const handleUpdateDiscipline = (
    asg: TenderAssignment,
    nextStatus: AssignmentStatus
  ) => {
    try {
      updateDisciplineAssignmentStatus(
        asg.id,
        nextStatus,
        nextStatus === 'Finished'
          ? `Completed by ${user.full_name}`
          : nextStatus === 'In Progress'
            ? `Started by ${user.full_name}`
            : '',
        actor
      );
      showToast(
        'success',
        `${asg.discipline} marked as ${
          nextStatus === 'Assigned' ? 'Not Started' : nextStatus
        }.`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error');
    }
  };

  const openPricingModal = (tenderId: string) => {
    const existingItem = allBoardItems.find((i) => i.tender.id === tenderId);
    const existingPumpIncluded = Boolean(
      existingItem &&
        existingItem.components.length > 0 &&
        (existingItem.tender.pump_room_included_in_water_features ||
          existingItem.components.some((c) => Boolean(c.pump_room_included)))
    );
    setCompDrafts({});
    setExpandedSpecIds({});
    setShowAddCompForm(!existingItem || existingItem.components.length === 0);
    setNewCompForm({
      component_title: '',
      water_feature: '',
      component_shape: componentShapesDb[0]?.label_en || 'Rectangle',
      water_feature_type: waterFeatureTypes[0]?.label_en || 'Skimmer',
      filtration_method: filtrationMethodsDb[0]?.label_en || 'Sand Filter',
      finishing_type: finishingTypesDb[0]?.label_en || 'Mosaic',
      pump_room_included: existingPumpIncluded,
      proposal_type: 'Full Turnkey (Civil + MEP)',
      qty_same_specs: 1,
      each_length_m: null,
      each_width_m: null,
      each_perimeter_m: 0,
      sub_zones: null,
      each_area_m2: 0,
      each_avg_depth_m: 1.4,
      volume_is_manual: false,
      each_volume_m3: 0,
      total_civil_cost: 0,
      total_mechanical_cost: 0,
      total_electrical_cost: 0,
      total_design_cost: 0,
      total_supply_cost: 0,
      total_maintenance_cost: 0,
    });
    setPricingTenderId(tenderId);
  };

  const openAssignModal = (tender: Tender) => {
    setAssignModal({
      tenderId: tender.id,
      proposalCode: tender.proposal_code,
      proposalName: tender.proposal_name,
      civilId: tender.responsible_civil_engineer_id || '',
      mechId: tender.mechanical_pricing_responsible_id || '',
      elecId: tender.electrical_pricing_responsible_id || '',
      dueDate: tender.expected_send_date || '',
    });
  };

  const handleSaveAssignModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal) return;
    try {
      assignEngineersToTender(
        assignModal.tenderId,
        {
          'Civil/Arch': assignModal.civilId,
          'Mechanical Pricing': assignModal.mechId,
          'Electrical Pricing': assignModal.elecId,
        },
        assignModal.dueDate || null,
        actor
      );
      showToast(
        'success',
        `Assigned engineering team on ${assignModal.proposalCode} and notified assignees.`
      );
      setAssignModal(null);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Failed to save assignments'
      );
    }
  };

  const handleCopyPath = (pathStr: string) => {
    if (!pathStr) return;
    navigator.clipboard
      ?.writeText(pathStr)
      .then(() => showToast('success', 'Server path copied to clipboard.'))
      .catch(() => showToast('error', 'Unable to copy path automatically.'));
  };

  const detailsItem = detailsTenderId
    ? allBoardItems.find((i) => i.tender.id === detailsTenderId) || null
    : null;
  const pricingItem = pricingTenderId
    ? allBoardItems.find((i) => i.tender.id === pricingTenderId) || null
    : null;

  return (
    <div className="space-y-5 pb-10">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-700'
              : 'bg-rose-950/95 text-rose-200 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header & View Switchers */}
      <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-brand-500" />
              Engineering Tasks & Discipline Pricing Table
            </h1>
            <p className="text-xs text-slate-500">
              Starts in Not Started. Entering water feature pricing moves your discipline to In Progress; each assigned engineer clicks Finish, and once all are Finished, any assigned engineer or the Tender Manager can click Finish & Confirm Sent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Team vs My Tasks */}
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-[#0B1218] p-1 border border-slate-200 dark:border-[#1E2D3D]">
              <button
                onClick={() => setScopeMode('team')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                  scopeMode === 'team'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> All Team Tasks
              </button>
              <button
                onClick={() => setScopeMode('mine')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold ${
                  scopeMode === 'mine'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" /> My Tasks
              </button>
            </div>

            {/* View Modes (Table Primary) */}
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-[#0B1218] p-1 border border-slate-200 dark:border-[#1E2D3D]">
              {(
                [
                  { id: 'table', label: 'Table', icon: TableIcon },
                  { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
                  { id: 'workload', label: 'Workload', icon: BarChart3 },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setViewMode(m.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold ${
                      viewMode === m.id
                        ? 'bg-brand-500 text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-[#1E2D3D]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search code, tender name, owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={engineerFilter}
              onChange={(e) => setEngineerFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 text-xs"
            >
              <option value="">All Engineers</option>
              {engineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.full_name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={disciplineFilter}
            onChange={(e) => setDisciplineFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 text-xs"
          >
            <option value="">All Disciplines</option>
            {(
              [
                'Civil/Arch',
                'Mechanical Pricing',
                'Electrical Pricing',
              ] as DisciplineType[]
            ).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 text-xs"
          >
            <option value="">All Priorities</option>
            {['Critical / VIP', 'High', 'Medium', 'Low'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <button
            onClick={() => setDueThisWeekOnly(!dueThisWeekOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              dueThisWeekOnly
                ? 'bg-amber-500/15 border-amber-500 text-amber-500'
                : 'border-slate-200 dark:border-[#1E2D3D] text-slate-500'
            }`}
          >
            Due This Week
          </button>

          <button
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              overdueOnly
                ? 'bg-rose-500/15 border-rose-500 text-rose-500'
                : 'border-slate-200 dark:border-[#1E2D3D] text-slate-500'
            }`}
          >
            Overdue Only
          </button>
        </div>

        {/* 5-Stage Filter Tabs */}
        {viewMode === 'table' && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-[#1E2D3D]">
            <button
              type="button"
              onClick={() => setStageFilter('all')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                stageFilter === 'all'
                  ? 'bg-brand-500 text-white border-brand-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-[#0B1218] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#1E2D3D] hover:border-brand-500/50'
              }`}
            >
              <span>{lang === 'ar' ? 'الكل' : 'All Stages'}</span>
              <span
                className={`font-mono px-1.5 py-0.2 rounded-full text-[11px] ${
                  stageFilter === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {boardItems.length}
              </span>
            </button>

            {STAGE_TABS.map((tab) => {
              const count = boardItems.filter(
                (i) => i.stage === tab.status
              ).length;
              const isActive = stageFilter === tab.status;
              return (
                <button
                  key={tab.status}
                  type="button"
                  onClick={() => setStageFilter(tab.status)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    isActive ? `${tab.activeTabClass} shadow-xs` : tab.idleTabClass
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? 'bg-white' : tab.dotClass
                    }`}
                  />
                  <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
                  <span
                    className={`font-mono px-1.5 py-0.2 rounded-full text-[11px] ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-white/70 dark:bg-slate-900/60 text-current'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* PRIMARY VIEW: ENGINEERING TASKS & PRICING TABLE */}
      {viewMode === 'table' &&
        (() => {
          const visibleRows =
            stageFilter === 'all'
              ? boardItems
              : boardItems.filter((i) => i.stage === stageFilter);

          return (
            <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] overflow-x-auto shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0B1218] border-b border-slate-200 dark:border-[#1E2D3D] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-2.5 py-3 whitespace-nowrap">Proposal #</th>
                    <th className="px-2.5 py-3 whitespace-nowrap">Received</th>
                    <th className="px-2.5 py-3 whitespace-nowrap">Deadline</th>
                    <th className="px-2.5 py-3 whitespace-nowrap">
                      Expected Sent
                    </th>
                    <th className="px-2.5 py-3 whitespace-nowrap">Status</th>
                    <th className="px-2.5 py-3 min-w-[215px]">
                      Assigned Team
                    </th>
                    <th className="px-2.5 py-3 min-w-[175px]">
                      Water Features
                    </th>
                    <th className="px-2.5 py-3 text-right whitespace-nowrap sticky right-0 bg-slate-50 dark:bg-[#0B1218] border-l border-slate-200/70 dark:border-[#1E2D3D]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D]">
                  {visibleRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-10 text-center text-slate-400 text-xs"
                      >
                        No proposals match the selected stage or filters.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((item) => {
                      const {
                        task,
                        stage,
                        tender,
                        assignments,
                        components,
                        componentCount,
                        isOverdue,
                      } = item;

                      const disciplineRows = assignments.map((asg) => ({
                        asg,
                        effStage: getEffectiveDisciplineStage(
                          asg,
                          components,
                          tender
                        ),
                      }));
                      const doneCount = disciplineRows.filter(
                        (r) => r.effStage === 'Finished'
                      ).length;
                      const allAssignedFinished =
                        disciplineRows.length > 0
                          ? disciplineRows.every(
                              (r) => r.effStage === 'Finished'
                            )
                          : stage === 'Finished';
                      const isAssignedToUser = assignments.some(
                        (a) => a.user_id === user.id
                      );
                      const canEditComp = canEditComponents(
                        user,
                        isAssignedToUser
                      );
                      const effectiveFromForSent =
                        allAssignedFinished && stage !== 'Cancelled or Waiting'
                          ? 'Finished'
                          : task.kanban_status;
                      const canMoveToSent = canMoveKanbanCard(
                        user,
                        effectiveFromForSent,
                        'Sent',
                        isAssignedToUser
                      );
                      const canHoldOrCancel =
                        stage !== 'Sent' &&
                        stage !== 'Cancelled or Waiting' &&
                        canMoveKanbanCard(
                          user,
                          task.kanban_status,
                          'Cancelled or Waiting',
                          isAssignedToUser
                        );
                      const resumeTarget: KanbanBoardStage =
                        componentCount > 0 ||
                        tender.civil_cost > 0 ||
                        tender.mechanical_cost > 0 ||
                        tender.electrical_cost > 0
                          ? 'In Progress'
                          : 'Not Started';
                      const canResumeFromWaiting =
                        stage === 'Cancelled or Waiting' &&
                        canMoveKanbanCard(
                          user,
                          task.kanban_status,
                          resumeTarget,
                          isAssignedToUser
                        );

                      const isCancelledTender = tender.tender_status
                        .toLowerCase()
                        .includes('cancel');
                      const blockedOrCancelledNote =
                        task.blocked_reason ||
                        (isCancelledTender
                          ? tender.tender_status_notes || tender.tender_status
                          : '');

                      const stageMeta =
                        STAGE_TABS.find((s) => s.status === stage) ||
                        STAGE_TABS[0];

                      return (
                        <tr
                          key={task.id}
                          className={`group align-top transition-colors hover:bg-slate-50/80 dark:hover:bg-[#162332]/70 ${
                            isOverdue ? 'bg-rose-500/[0.02]' : ''
                          }`}
                        >
                          {/* 1. Proposal Number */}
                          <td
                            className={`px-2.5 py-3 whitespace-nowrap ${stageMeta.rowAccentClass}`}
                          >
                            <div className="flex flex-col items-start gap-1">
                              <Link
                                to={`/tenders/${tender.id}`}
                                className="font-mono text-xs font-bold text-brand-600 dark:text-brand-300 hover:underline"
                              >
                                {tender.proposal_code}
                                {tender.proposal_rev > 0
                                  ? ` (R${tender.proposal_rev})`
                                  : ''}
                              </Link>
                              {canOpenIntelligentTender(user) && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const route = await startIntelligentTender(tender, user);
                                    navigate(route);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-pzone-teal to-pzone-seagreen text-white text-[10px] font-bold shadow-2xs hover:opacity-95 transition cursor-pointer"
                                  title={
                                    canAccessErpEngineering(user.role)
                                      ? 'Launch Intelligent Tendering ERP for this Proposal'
                                      : 'Open Commercial Overheads & Bid Price'
                                  }
                                >
                                  <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                  <span>
                                    {canAccessErpEngineering(user.role)
                                      ? lang === 'ar'
                                        ? 'التسعير الذكي'
                                        : 'Intelligent ERP'
                                      : lang === 'ar'
                                        ? 'المصاريف'
                                        : 'Overheads'}
                                  </span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* 2. Received */}
                          <td className="px-2.5 py-3 font-mono text-[11px] text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {formatDateDdMmYyyy(tender.received_date, '—')}
                          </td>

                          {/* 3. Deadline */}
                          <td className="px-2.5 py-3 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-300 whitespace-nowrap">
                            {formatDateDdMmYyyy(tender.deadline_date, '—')}
                          </td>

                          {/* 4. Expected Sent Date */}
                          <td className="px-2.5 py-3 font-mono text-[11px] whitespace-nowrap">
                            <span
                              className={
                                isOverdue
                                  ? 'text-rose-500 font-bold'
                                  : 'text-slate-700 dark:text-slate-200 font-semibold'
                              }
                            >
                              {formatDateDdMmYyyy(
                                tender.expected_send_date,
                                '—'
                              )}
                            </span>
                            {isOverdue && (
                              <span className="ml-1 px-1 py-0.2 rounded text-[9px] font-sans font-bold uppercase bg-rose-500/15 text-rose-500">
                                Overdue
                              </span>
                            )}
                          </td>

                          {/* 5. Stage / Status */}
                          <td className="px-2.5 py-3">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${stageMeta.badgeClass}`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${stageMeta.dotClass}`}
                                  />
                                  {lang === 'ar'
                                    ? stageMeta.labelAr
                                    : stageMeta.labelEn}
                                </span>

                                {canHoldOrCancel && (
                                  <button
                                    type="button"
                                    title="Mark Waiting / Blocked or Cancelled"
                                    onClick={() =>
                                      attemptMoveCard(
                                        item,
                                        'Cancelled or Waiting'
                                      )
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#1E2D3D] text-[10px] font-semibold text-slate-500 hover:text-amber-600 hover:border-amber-500/50 transition-colors"
                                  >
                                    <PauseCircle className="w-3 h-3" />
                                    Hold
                                  </button>
                                )}

                                {canResumeFromWaiting && (
                                  <button
                                    type="button"
                                    title={`Resume to ${resumeTarget}`}
                                    onClick={() =>
                                      attemptMoveCard(item, resumeTarget)
                                    }
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-brand-500/40 bg-brand-500/10 text-[10px] font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-500 hover:text-white transition-colors"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Resume
                                  </button>
                                )}
                              </div>

                              {stage === 'Cancelled or Waiting' &&
                                blockedOrCancelledNote && (
                                  <div
                                    className={`rounded-lg p-2 text-[10px] flex items-start gap-1.5 border max-w-[220px] ${
                                      isCancelledTender
                                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-300'
                                        : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300'
                                    }`}
                                  >
                                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="font-bold uppercase text-[9px] block">
                                        {isCancelledTender
                                          ? 'Cancelled'
                                          : 'Waiting / Blocked'}
                                      </span>
                                      <span>{blockedOrCancelledNote}</span>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </td>

                          {/* 6. Assigned Team & Discipline Status */}
                          <td className="px-2.5 py-3">
                            {disciplineRows.length > 0 ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-brand-500" />
                                    Team
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <span className="font-mono">
                                      {doneCount}/{disciplineRows.length} Finished
                                    </span>
                                    {canAssignEngineers(user) && (
                                      <button
                                        type="button"
                                        onClick={() => openAssignModal(tender)}
                                        className="font-sans font-bold text-brand-500 hover:underline normal-case cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                    )}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {disciplineRows.map(({ asg, effStage }) => {
                                    const isMe = asg.user_id === user.id;
                                    const isDone = effStage === 'Finished';
                                    const isInProgress =
                                      effStage === 'In Progress';
                                    const canTick =
                                      stage !== 'Sent' &&
                                      (hasFullTenderAuthority(user) ||
                                        isMe);

                                    return (
                                      <div
                                        key={asg.id}
                                        className={`flex items-center justify-between gap-2 py-1 px-2 rounded-md border text-[11px] ${
                                          isMe
                                            ? 'bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/30'
                                            : 'bg-slate-50/80 dark:bg-[#0B1218]/70 border-slate-200/70 dark:border-[#1E2D3D]'
                                        }`}
                                      >
                                        <div className="min-w-0 flex-1">
                                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                                            {asg.discipline}:
                                          </span>{' '}
                                          <span className="text-slate-600 dark:text-slate-300">
                                            {getProfileName(asg.user_id, lang)}
                                          </span>
                                          {isMe && (
                                            <span className="ml-1 px-1 py-0.2 rounded text-[9px] font-bold bg-brand-500/15 text-brand-600 dark:text-brand-300">
                                              You
                                            </span>
                                          )}
                                        </div>

                                        <div className="shrink-0 flex items-center gap-1">
                                          {isDone ? (
                                            canTick ? (
                                              <button
                                                type="button"
                                                title="Click to reopen to In Progress"
                                                onClick={() =>
                                                  handleUpdateDiscipline(
                                                    asg,
                                                    'In Progress'
                                                  )
                                                }
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                                              >
                                                <Check className="w-3 h-3" />
                                                Finished
                                              </button>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                                                <Check className="w-3 h-3" />
                                                Finished
                                              </span>
                                            )
                                          ) : isInProgress ? (
                                            <>
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                In Progress
                                              </span>
                                              {canTick && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleUpdateDiscipline(
                                                      asg,
                                                      'Finished'
                                                    )
                                                  }
                                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-white transition-colors"
                                                >
                                                  Finish
                                                </button>
                                              )}
                                            </>
                                          ) : canTick ? (
                                            <button
                                              type="button"
                                              title="Enters In Progress automatically when pricing is entered (or click to start manually)"
                                              onClick={() =>
                                                handleUpdateDiscipline(
                                                  asg,
                                                  'In Progress'
                                                )
                                              }
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/35 hover:bg-sky-500/25 transition-colors"
                                            >
                                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                              Not Started
                                            </button>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/35">
                                              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                              Not Started
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>No engineers assigned yet</span>
                                {canAssignEngineers(user) && (
                                  <button
                                    type="button"
                                    onClick={() => openAssignModal(tender)}
                                    className="px-2 py-0.5 rounded-md bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 font-semibold text-brand-600 dark:text-brand-300 ml-2 cursor-pointer"
                                  >
                                    + Assign
                                  </button>
                                )}
                              </div>
                            )}
                          </td>

                          {/* 7. Shared Water Features & Discipline Price Status */}
                          <td className="px-2.5 py-3">
                            {components.length > 0 ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <Waves className="w-3 h-3 text-brand-500" />
                                    Water Features ({components.length})
                                  </span>
                                  {tender.tender_total_price > 0 && (
                                    <span className="font-mono font-bold text-brand-600 dark:text-brand-300">
                                      {formatCurrency(
                                        tender.tender_total_price,
                                        'EGP'
                                      )}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  {components.slice(0, 3).map((comp) => {
                                    const myDisciplines = assignments
                                      .filter((a) => a.user_id === user.id)
                                      .map((a) => a.discipline);
                                    const civilDone = comp.total_civil_cost > 0;
                                    const mechDone =
                                      comp.total_mechanical_cost > 0;
                                    const elecDone =
                                      comp.total_electrical_cost > 0;
                                    return (
                                      <div
                                        key={comp.id}
                                        className="flex items-center justify-between gap-1.5 py-1 px-2 rounded bg-slate-50/80 dark:bg-[#0B1218]/70 border border-slate-200/70 dark:border-[#1E2D3D] text-[10px]"
                                      >
                                        <span
                                          className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]"
                                          title={`${comp.water_feature} (${comp.water_feature_type})`}
                                        >
                                          {comp.water_feature}
                                        </span>
                                        <div className="shrink-0 inline-flex items-center gap-1 font-mono text-[9px] font-bold">
                                          <span
                                            title={`Civil: ${formatCurrency(comp.total_civil_cost, 'EGP')}`}
                                            className={`px-1 py-0.2 rounded ${
                                              civilDone
                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                                : myDisciplines.includes(
                                                      'Civil/Arch'
                                                    )
                                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/40'
                                                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-400'
                                            }`}
                                          >
                                            C{civilDone ? '✓' : '·'}
                                          </span>
                                          <span
                                            title={`Mechanical: ${formatCurrency(comp.total_mechanical_cost, 'EGP')}`}
                                            className={`px-1 py-0.2 rounded ${
                                              mechDone
                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                                : myDisciplines.includes(
                                                      'Mechanical Pricing'
                                                    )
                                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/40'
                                                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-400'
                                            }`}
                                          >
                                            M{mechDone ? '✓' : '·'}
                                          </span>
                                          <span
                                            title={`Electrical: ${formatCurrency(comp.total_electrical_cost, 'EGP')}`}
                                            className={`px-1 py-0.2 rounded ${
                                              elecDone
                                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                                : myDisciplines.includes(
                                                      'Electrical Pricing'
                                                    )
                                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/40'
                                                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-400'
                                            }`}
                                          >
                                            E{elecDone ? '✓' : '·'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {components.length > 3 && (
                                    <div className="text-[10px] text-slate-400 font-mono">
                                      +{components.length - 3} more water
                                      feature(s)
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                No water features added yet
                              </span>
                            )}
                          </td>

                          {/* 8. Actions */}
                          <td className="px-2.5 py-3 text-right sticky right-0 bg-white dark:bg-[#111C28] group-hover:bg-slate-50 dark:group-hover:bg-[#162332] border-l border-slate-100 dark:border-[#1E2D3D]">
                            <div className="flex flex-col items-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailsRevFilter('ALL');
                                  setDetailsTenderId(tender.id);
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50/80 dark:bg-[#0B1218] hover:bg-slate-100 dark:hover:bg-[#162332] text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5 text-brand-500" />
                                View Proposal Details
                              </button>

                              {stage !== 'Sent' && canEditComp && (
                                <button
                                  type="button"
                                  onClick={() => openPricingModal(tender.id)}
                                  className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-500/15 hover:bg-brand-500 text-brand-700 dark:text-brand-300 hover:text-white border border-brand-500/30 text-[11px] font-bold transition-colors whitespace-nowrap"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  {componentCount > 0
                                    ? `Add / Price Water Features (${componentCount})`
                                    : 'Add Components & Pricing'}
                                </button>
                              )}

                              {stage === 'In Progress' &&
                                !allAssignedFinished &&
                                hasFullTenderAuthority(user) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      attemptMoveCard(item, 'Finished')
                                    }
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] font-bold transition-colors whitespace-nowrap"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Finish
                                  </button>
                                )}

                              {stage !== 'Sent' &&
                                stage !== 'Cancelled or Waiting' &&
                                allAssignedFinished &&
                                (canMoveToSent ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      attemptMoveCard(item, 'Sent')
                                    }
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition-colors whitespace-nowrap"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Finish & Confirm Sent
                                  </button>
                                ) : (
                                  <span className="inline-block rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300 whitespace-nowrap">
                                    All finished — ready to send
                                  </span>
                                ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}

      {/* VIEW 3: CALENDAR (DUE DATE SCHEDULE) */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boardItems
            .slice()
            .sort((a, b) =>
              (a.tender.expected_send_date || '9999').localeCompare(
                b.tender.expected_send_date || '9999'
              )
            )
            .map((item) => (
              <div
                key={item.task.id}
                className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-4 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-500">
                      {item.tender.proposal_code}
                    </span>
                    {(() => {
                      const sm =
                        STAGE_TABS.find((s) => s.status === item.stage) ||
                        STAGE_TABS[0];
                      return (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sm.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sm.dotClass}`}
                          />
                          {item.stage}
                        </span>
                      );
                    })()}
                  </div>
                  <Link
                    to={`/tenders/${item.tender.id}`}
                    className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-500 block"
                  >
                    {item.tender.proposal_name}
                  </Link>
                  <span className="text-xs text-slate-500">
                    {item.tender.owner}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] uppercase text-slate-400 block">
                    Expected Send
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      item.isOverdue ? 'text-rose-500' : 'text-emerald-500'
                    }`}
                  >
                    {item.tender.expected_send_date || 'TBD'}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* VIEW 4: ENGINEER WORKLOAD */}
      {viewMode === 'workload' &&
        (() => {
          const workloadSummaries = getEngineerWorkloadSummary();
          const minOpenByRole = new Map<string, number>();
          for (const ws of workloadSummaries) {
            const prev = minOpenByRole.get(ws.engineer.role);
            if (prev === undefined || ws.openCount < prev) {
              minOpenByRole.set(ws.engineer.role, ws.openCount);
            }
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workloadSummaries.map((ws) => {
                const eng = ws.engineer;
                const isRecommended =
                  minOpenByRole.get(eng.role) === ws.openCount;
                const assignedItems = allBoardItems.filter((item) =>
                  isUserAssignedToTender(eng.id, item.tender.id)
                );
                const activeItems = assignedItems.filter(
                  (i) => !i.tender.tender_status.toLowerCase().includes('cancel')
                );

                return (
                  <div
                    key={eng.id}
                    className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {eng.full_name}
                          </h3>
                          {isRecommended && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              ★ Least Busy ({eng.team})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{eng.team}</p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-xs font-bold text-brand-600 dark:text-brand-300">
                          {ws.openCount} Open Queue
                        </span>
                        {ws.overdueCount > 0 && (
                          <span className="block text-[11px] text-rose-500 font-bold">
                            {ws.overdueCount} Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Not Started / In Progress / Finished Decision Counters */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2.5">
                        <span className="block font-mono text-lg font-extrabold text-sky-700 dark:text-sky-300">
                          {ws.notStartedCount}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700/80 dark:text-sky-300/80">
                          Not Started
                        </span>
                      </div>
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
                        <span className="block font-mono text-lg font-extrabold text-amber-700 dark:text-amber-300">
                          {ws.inProgressCount}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80">
                          In Progress
                        </span>
                      </div>
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                        <span className="block font-mono text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                          {ws.finishedCount}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80">
                          Finished
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1218] flex items-center justify-between text-xs">
                      <span className="text-slate-400">Active Open Pipeline</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(ws.activePipelineEgp, 'EGP')}
                      </span>
                    </div>

                    {activeItems.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {activeItems.map((i) => {
                          const myAsgs = i.assignments.filter(
                            (a) => a.user_id === eng.id
                          );
                          const engAsg = myAsgs[0];
                          const assignedDate = engAsg
                            ? engAsg.assigned_at || engAsg.created_at
                            : i.tender.responsible_civil_engineer_id === eng.id
                              ? i.tender.civil_assigned_at || i.tender.received_date
                              : i.tender.mechanical_pricing_responsible_id === eng.id
                                ? i.tender.mechanical_assigned_at ||
                                  i.tender.received_date
                                : i.tender.electrical_assigned_at ||
                                  i.tender.received_date;
                          const engItemStage =
                            i.stage === 'Sent'
                              ? 'Finished'
                              : myAsgs.length > 0
                                ? getEffectiveDisciplineStage(
                                    myAsgs[0],
                                    i.components,
                                    i.tender
                                  )
                                : i.stage;
                          return (
                            <Link
                              key={i.tender.id}
                              to={`/tenders/${i.tender.id}`}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-slate-50 dark:hover:bg-[#162332]"
                            >
                              <span className="font-mono font-semibold text-brand-500">
                                {i.tender.proposal_code}
                              </span>
                              <span className="truncate mx-2 flex-1 text-slate-700 dark:text-slate-300">
                                {i.tender.proposal_name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400 shrink-0">
                                Assigned {formatDateDdMmYyyy(assignedDate)} •{' '}
                                {engItemStage}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

      {/* MODAL: CANCELLED OR WAITING REASON */}
      {waitingPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                moveKanbanTask(
                  waitingPrompt.taskId,
                  'Cancelled or Waiting',
                  {
                    blockedReason: waitingPrompt.reason,
                    isCancelled: waitingPrompt.isCancelled,
                  },
                  actor
                );
                setWaitingPrompt(null);
                showToast(
                  'success',
                  waitingPrompt.isCancelled
                    ? 'Tender marked as Cancelled in Cancelled or Waiting.'
                    : 'Card moved to Cancelled or Waiting.'
                );
              } catch (err) {
                showToast(
                  'error',
                  err instanceof Error ? err.message : 'Error'
                );
              }
            }}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-6 space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Move {waitingPrompt.proposalCode} to Cancelled or Waiting
            </h3>
            {hasFullTenderAuthority(user) && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setWaitingPrompt({ ...waitingPrompt, isCancelled: false })
                  }
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    !waitingPrompt.isCancelled
                      ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-300'
                      : 'border-slate-200 dark:border-[#1E2D3D] text-slate-500'
                  }`}
                >
                  Waiting / Blocked
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWaitingPrompt({ ...waitingPrompt, isCancelled: true })
                  }
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    waitingPrompt.isCancelled
                      ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-300'
                      : 'border-slate-200 dark:border-[#1E2D3D] text-slate-500'
                  }`}
                >
                  Cancelled / Apologized
                </button>
              </div>
            )}
            <p className="text-xs text-slate-500">
              {waitingPrompt.isCancelled
                ? 'Specify the reason for cancelling / apologizing on this tender.'
                : 'Specify what information or file is blocking progress. The Tender Manager will be notified immediately.'}
            </p>
            <textarea
              required
              rows={3}
              placeholder={
                waitingPrompt.isCancelled
                  ? 'e.g. Client cancelled tender package / apologized due to scope change.'
                  : 'e.g. Awaiting architectural CAD section for lagoon edge detail from consultant.'
              }
              value={waitingPrompt.reason}
              onChange={(e) =>
                setWaitingPrompt({ ...waitingPrompt, reason: e.target.value })
              }
              className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setWaitingPrompt(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#1E2D3D]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white ${
                  waitingPrompt.isCancelled ? 'bg-rose-500' : 'bg-amber-500'
                }`}
              >
                {waitingPrompt.isCancelled
                  ? 'Confirm Cancelled'
                  : 'Confirm Waiting'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: VIEW PROPOSAL DETAILS */}
      {detailsItem &&
        (() => {
          const { tender, assignments, components, stage } = detailsItem;
          const docs = getDocumentsByTender(tender.id);
          const isAssignedHere = assignments.some((a) => a.user_id === user.id);
          const canOpenPricingFromDetails =
            stage !== 'Sent' && canEditComponents(user, isAssignedHere);
          const detailsAllFinished =
            assignments.length > 0
              ? assignments.every(
                  (a) =>
                    getEffectiveDisciplineStage(a, components, tender) ===
                    'Finished'
                )
              : stage === 'Finished';
          const canConfirmSentFromDetails =
            stage !== 'Sent' &&
            stage !== 'Cancelled or Waiting' &&
            detailsAllFinished &&
            canMoveKanbanCard(user, 'Finished', 'Sent', isAssignedHere);
          const locationText =
            [
              tender.country,
              tender.governorate,
              tender.area,
              tender.district,
              tender.location,
            ]
              .filter(Boolean)
              .join(' • ') || '—';

          return (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-[#1E2D3D] flex flex-wrap items-start justify-between gap-3 bg-slate-50/70 dark:bg-[#0B1218]/70">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-300">
                        {tender.proposal_code}
                        {tender.proposal_rev > 0
                          ? ` (R${tender.proposal_rev})`
                          : ' (R0)'}
                      </span>
                      {(() => {
                        const sm =
                          STAGE_TABS.find((s) => s.status === stage) ||
                          STAGE_TABS[0];
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${sm.badgeClass}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${sm.dotClass}`}
                            />
                            {stage}
                          </span>
                        );
                      })()}
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {tender.project_priority}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {tender.proposal_name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/tenders/${tender.id}?tab=overview`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Full Proposal Page
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDetailsTenderId(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-5 text-xs">
                  {/* Grid: Client & Schedule */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3.5 space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Client & Project Info
                      </h4>
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                        <span className="text-slate-500">Owner / Developer</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                          {tender.owner || '—'}
                        </span>
                        <span className="text-slate-500">Main Contractor</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                          {tender.contractor || '—'}
                        </span>
                        <span className="text-slate-500">P.ZONE Role</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                          {tender.pzone_role || '—'}
                        </span>
                        <span className="text-slate-500">Sales Rep</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                          {getLookupLabel(tender.sales_representative_id, lang)}
                        </span>
                        <span className="text-slate-500">Location</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                          {locationText}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3.5 space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Schedule & Dates
                      </h4>
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                        <span className="text-slate-500">Received Date</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-100 text-right">
                          {formatDateDdMmYyyy(tender.received_date, '—')}
                        </span>
                        <span className="text-slate-500">Client Deadline</span>
                        <span className="font-mono font-semibold text-amber-600 dark:text-amber-300 text-right">
                          {formatDateDdMmYyyy(tender.deadline_date, '—')}
                        </span>
                        <span className="text-slate-500">Expected Sent Date</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-100 text-right">
                          {formatDateDdMmYyyy(tender.expected_send_date, '—')}
                        </span>
                        <span className="text-slate-500">Actual Sent Date</span>
                        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-300 text-right">
                          {formatDateDdMmYyyy(tender.actual_sent_date, '—')}
                        </span>
                        <span className="text-slate-500">Tender Status</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 text-right">
                          {tender.tender_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Team */}
                  <div className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-brand-500" />
                        Assigned Team on This Proposal
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {assignments.length} Discipline(s)
                      </span>
                    </div>
                    {assignments.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {assignments.map((a) => {
                          const eff = getEffectiveDisciplineStage(
                            a,
                            components,
                            tender
                          );
                          const isMe = a.user_id === user.id;
                          return (
                            <div
                              key={a.id}
                              className={`rounded-lg p-2.5 border ${
                                isMe
                                  ? 'bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/40'
                                  : 'bg-slate-50 dark:bg-[#0B1218] border-slate-200 dark:border-[#1E2D3D]'
                              } space-y-1`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                  {a.discipline}
                                </span>
                                {isMe && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500/15 text-brand-600 dark:text-brand-300">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-600 dark:text-slate-300 font-medium">
                                {getProfileName(a.user_id, lang)}
                              </div>
                              <div className="flex items-center justify-between pt-1 text-[10px] font-mono">
                                <span className="text-slate-400">
                                  Assigned{' '}
                                  {formatDateDdMmYyyy(
                                    a.assigned_at || a.created_at,
                                    '—'
                                  )}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border ${
                                    eff === 'Finished'
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                      : eff === 'In Progress'
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                        : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/35'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      eff === 'Finished'
                                        ? 'bg-emerald-500'
                                        : eff === 'In Progress'
                                          ? 'bg-amber-500 animate-pulse'
                                          : 'bg-sky-500'
                                    }`}
                                  />
                                  {eff}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-400">No engineers assigned yet.</p>
                    )}
                  </div>

                  {/* Scope, Server Folder Path & Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3.5 space-y-2.5">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Scope of Work & Server Folder Path
                      </h4>
                      {tender.scope_of_work?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {tender.scope_of_work.map((sc) => (
                            <span
                              key={sc}
                              className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-300 font-semibold text-[11px]"
                            >
                              {sc}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">No scope specified</span>
                      )}

                      {tender.server_link_path && (
                        <div className="pt-1 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Server Folder Path
                          </span>
                          <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#0B1218] border border-slate-200 dark:border-[#1E2D3D]">
                            <code className="text-[11px] font-mono truncate text-slate-700 dark:text-slate-200">
                              {tender.server_link_path}
                            </code>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyPath(tender.server_link_path || '')
                              }
                              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] hover:border-brand-500 text-[10px] font-semibold"
                            >
                              <ClipboardCopy className="w-3 h-3" />
                              Copy
                            </button>
                          </div>
                        </div>
                      )}

                      {docs.length > 0 && (
                        <div className="pt-1 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Document Control Paths ({docs.length})
                          </span>
                          {docs.map((d) => (
                            <div
                              key={d.id}
                              className="flex items-center justify-between gap-2 p-1.5 rounded bg-slate-50 dark:bg-[#0B1218] text-[11px]"
                            >
                              <span className="truncate">
                                <strong>{d.doc_type}:</strong> {d.file_name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyPath(d.server_path)}
                                className="shrink-0 text-brand-500 hover:underline font-semibold text-[10px]"
                              >
                                Copy Path
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3.5 space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Client Contact & Notes
                      </h4>
                      <div className="grid grid-cols-2 gap-y-1.5 gap-x-2">
                        <span className="text-slate-500">Contact Name</span>
                        <span className="font-semibold text-right">
                          {tender.contact_name || '—'}
                        </span>
                        <span className="text-slate-500">Job Title</span>
                        <span className="font-semibold text-right">
                          {tender.contact_job_title || '—'}
                        </span>
                        <span className="text-slate-500">Phone</span>
                        <span className="font-mono font-semibold text-right">
                          {tender.contact_number || '—'}
                        </span>
                        <span className="text-slate-500">Email</span>
                        <span className="font-mono text-right truncate">
                          {tender.contact_email || '—'}
                        </span>
                      </div>
                      {tender.tender_status_notes && (
                        <div className="pt-2 border-t border-slate-100 dark:border-[#1E2D3D]">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Notes
                          </span>
                          <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                            {tender.tender_status_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Components & Pricing Summary */}
                  <div className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3.5 space-y-2.5 bg-slate-50/50 dark:bg-[#0B1218]/60">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Components & Discipline Pricing Summary
                        </h4>
                        {(tender.pump_room_included_in_water_features ||
                          components.some((c) => Boolean(c.pump_room_included))) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            Pump Room pricing included in water feature pricing
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-300">
                        Total: {formatCurrency(tender.tender_total_price, 'EGP')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111C28] border border-slate-200/70 dark:border-[#1E2D3D]">
                        <span className="text-slate-400 block text-[10px]">
                          Components (Area • Vol)
                        </span>
                        <span className="font-mono font-bold">
                          {components.length} ({formatNumber(tender.total_components_area_m2, 1)} m² • {formatNumber(tender.total_components_volume_m3, 1)} m³)
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111C28] border border-slate-200/70 dark:border-[#1E2D3D]">
                        <span className="text-slate-400 block text-[10px]">
                          Civil Cost
                        </span>
                        <span className="font-mono font-bold">
                          {formatCurrency(tender.civil_cost, 'EGP')}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111C28] border border-slate-200/70 dark:border-[#1E2D3D]">
                        <span className="text-slate-400 block text-[10px]">
                          Mechanical Cost
                        </span>
                        <span className="font-mono font-bold">
                          {formatCurrency(tender.mechanical_cost, 'EGP')}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111C28] border border-slate-200/70 dark:border-[#1E2D3D]">
                        <span className="text-slate-400 block text-[10px]">
                          Electrical Cost
                        </span>
                        <span className="font-mono font-bold">
                          {formatCurrency(tender.electrical_cost, 'EGP')}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-white dark:bg-[#111C28] border border-slate-200/70 dark:border-[#1E2D3D]">
                        <span className="text-slate-400 block text-[10px]">
                          Design / Supply / Maint
                        </span>
                        <span className="font-mono font-bold">
                          {formatCurrency(
                            tender.design_cost +
                              tender.supply_cost +
                              tender.maintenance_cost,
                            'EGP'
                          )}
                        </span>
                      </div>
                    </div>

                    {components.length > 0 && (
                      <div className="pt-2 overflow-x-auto">
                        <table className="w-full text-left text-[11px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-[#1E2D3D] text-[10px] uppercase text-slate-400">
                              <th className="py-1.5 pr-2">Water Feature</th>
                              <th className="py-1.5 px-2">Specs</th>
                              <th className="py-1.5 px-2 text-right">Civil</th>
                              <th className="py-1.5 px-2 text-right">Mechanical</th>
                              <th className="py-1.5 px-2 text-right">Electrical</th>
                              <th className="py-1.5 pl-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/70 dark:divide-[#1E2D3D]">
                            {components.map((c) => (
                              <tr key={c.id}>
                                <td className="py-1.5 pr-2 font-semibold text-slate-800 dark:text-slate-100">
                                  <div>{c.water_feature}</div>
                                  {c.created_by && (
                                    <span className="text-[10px] font-normal text-slate-400">
                                      Added by {getProfileName(c.created_by, lang)}
                                    </span>
                                  )}
                                </td>
                                <td className="py-1.5 px-2 text-slate-500 font-mono text-[10px]">
                                  {c.water_feature_type ? `${c.water_feature_type} • ` : ''}Qty {c.qty_same_specs} ({formatNumber(c.total_area_m2, 1)} m² • {formatNumber(c.total_volume_m3, 1)} m³)
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {c.total_civil_cost > 0
                                    ? formatCurrency(c.total_civil_cost, 'EGP')
                                    : '—'}
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {c.total_mechanical_cost > 0
                                    ? formatCurrency(c.total_mechanical_cost, 'EGP')
                                    : '—'}
                                </td>
                                <td className="py-1.5 px-2 text-right font-mono">
                                  {c.total_electrical_cost > 0
                                    ? formatCurrency(c.total_electrical_cost, 'EGP')
                                    : '—'}
                                </td>
                                <td className="py-1.5 pl-2 text-right font-mono font-bold text-brand-600 dark:text-brand-300">
                                  {formatCurrency(c.total_price, 'EGP')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Components Details Across All Revisions (when Rev > 0 exists) */}
                  {(() => {
                    const allRevs = getTenderRevisions(tender.proposal_code);
                    if (allRevs.length <= 1) return null;
                    return (
                      <div className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3.5 space-y-3 bg-slate-50/50 dark:bg-[#0B1218]/60">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Components Details by Revision ({allRevs.length} Revisions)
                          </h4>
                          <div className="flex items-center gap-2">
                            <select
                              value={detailsRevFilter}
                              onChange={(e) =>
                                setDetailsRevFilter(e.target.value)
                              }
                              className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1 text-[11px] font-mono font-semibold"
                            >
                              <option value="ALL">
                                All Revisions ({allRevs.length})
                              </option>
                              {allRevs.map((rev) => (
                                <option key={rev.id} value={rev.id}>
                                  Rev {String(rev.proposal_rev).padStart(2, '0')}
                                  {rev.is_latest_revision ? ' (Latest)' : ' (Historical)'}
                                </option>
                              ))}
                            </select>
                            <Link
                              to={`/tenders/${tender.id}?tab=revisions`}
                              onClick={() => setDetailsTenderId(null)}
                              className="text-[11px] font-semibold text-brand-600 dark:text-brand-300 hover:underline"
                            >
                              Compare Revisions →
                            </Link>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {allRevs
                            .filter(
                              (rev) =>
                                detailsRevFilter === 'ALL' ||
                                rev.id === detailsRevFilter
                            )
                            .map((rev) => {
                            const revComps = getComponentsByTender(rev.id);
                            return (
                              <div
                                key={rev.id}
                                className="rounded-lg border border-slate-200/80 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] p-2.5 space-y-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-brand-500/15 text-brand-600 dark:text-brand-300">
                                      Rev {rev.proposal_rev}
                                    </span>
                                    {rev.is_latest_revision ? (
                                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                                        Latest
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                                        Historical
                                      </span>
                                    )}
                                    <span className="text-slate-500 text-[11px]">
                                      {rev.tender_status}
                                    </span>
                                  </div>
                                  <span className="font-mono font-bold text-brand-600 dark:text-brand-300">
                                    {formatCurrency(rev.tender_total_price, 'EGP')}
                                  </span>
                                </div>

                                {revComps.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-[10px] border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-100 dark:border-[#1E2D3D] uppercase text-slate-400">
                                          <th className="py-1 pr-2">Component</th>
                                          <th className="py-1 px-2">Specs & Area/Vol</th>
                                          <th className="py-1 px-2 text-right">Civil</th>
                                          <th className="py-1 px-2 text-right">Mech</th>
                                          <th className="py-1 px-2 text-right">Elec</th>
                                          <th className="py-1 pl-2 text-right">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 dark:divide-[#1E2D3D] font-mono">
                                        {revComps.map((rc) => (
                                          <tr key={rc.id}>
                                            <td className="py-1 pr-2 font-sans font-semibold text-slate-800 dark:text-slate-200">
                                              {rc.water_feature}
                                            </td>
                                            <td className="py-1 px-2 text-slate-500">
                                              {rc.water_feature_type ? `${rc.water_feature_type} • ` : ''}
                                              {rc.qty_same_specs}x ({formatNumber(rc.total_area_m2, 1)} m² • {formatNumber(rc.total_volume_m3, 1)} m³)
                                            </td>
                                            <td className="py-1 px-2 text-right">
                                              {formatCurrency(rc.total_civil_cost, 'EGP')}
                                            </td>
                                            <td className="py-1 px-2 text-right">
                                              {formatCurrency(rc.total_mechanical_cost, 'EGP')}
                                            </td>
                                            <td className="py-1 px-2 text-right">
                                              {formatCurrency(rc.total_electrical_cost, 'EGP')}
                                            </td>
                                            <td className="py-1 pl-2 text-right font-bold text-brand-600 dark:text-brand-300">
                                              {formatCurrency(rc.total_price, 'EGP')}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-slate-400 italic">
                                    No components recorded in Rev {rev.proposal_rev}.
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-[#1E2D3D] flex flex-wrap items-center justify-end gap-2 bg-slate-50/70 dark:bg-[#0B1218]/70">
                  {canConfirmSentFromDetails && (
                    <button
                      type="button"
                      onClick={() => {
                        attemptMoveCard(detailsItem, 'Sent');
                        setDetailsTenderId(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Finish & Confirm Sent
                    </button>
                  )}
                  {canOpenPricingFromDetails && (
                    <button
                      type="button"
                      onClick={() => {
                        const tid = tender.id;
                        setDetailsTenderId(null);
                        openPricingModal(tid);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-colors"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Components & Pricing
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDetailsTenderId(null)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#1E2D3D]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* MODAL: ADD COMPONENTS & DISCIPLINE PRICING */}
      {pricingItem &&
        (() => {
          const { tender, assignments, components } = pricingItem;
          const myAsgs = assignments.filter((a) => a.user_id === user.id);

          const canEditCivil = canEditComponentDisciplineCost(
            user,
            user.id,
            'Civil/Arch',
            assignments
          );
          const canEditMech = canEditComponentDisciplineCost(
            user,
            user.id,
            'Mechanical Pricing',
            assignments
          );
          const canEditElec = canEditComponentDisciplineCost(
            user,
            user.id,
            'Electrical Pricing',
            assignments
          );

          const civilAsg = assignments.find((a) => a.discipline === 'Civil/Arch');
          const mechAsg = assignments.find(
            (a) => a.discipline === 'Mechanical Pricing'
          );
          const elecAsg = assignments.find(
            (a) => a.discipline === 'Electrical Pricing'
          );
          const civilOwnerLabel = civilAsg
            ? getProfileName(civilAsg.user_id, lang)
            : 'Unassigned';
          const mechOwnerLabel = mechAsg
            ? getProfileName(mechAsg.user_id, lang)
            : 'Unassigned';
          const elecOwnerLabel = elecAsg
            ? getProfileName(elecAsg.user_id, lang)
            : 'Unassigned';

          const effectiveComponents: ProposalComponent[] = components.map(
            (c) => {
              const d = compDrafts[c.id];
              if (!d) return c;
              const m = { ...c, ...d };
              const calc = computeComponentFields({
                water_feature_type: m.water_feature_type,
                qty_same_specs: m.qty_same_specs,
                each_area_m2: m.each_area_m2,
                each_avg_depth_m: m.each_avg_depth_m,
                volume_is_manual: m.volume_is_manual,
                each_volume_m3: m.each_volume_m3,
                total_maintenance_cost: m.total_maintenance_cost,
                total_supply_cost: m.total_supply_cost,
                total_design_cost: m.total_design_cost,
                total_civil_cost: m.total_civil_cost,
                total_mechanical_cost: m.total_mechanical_cost,
                total_electrical_cost: m.total_electrical_cost,
              });
              return { ...m, ...calc };
            }
          );

          const liveCivilTotal = effectiveComponents.reduce(
            (sum, c) => sum + (Number(c.total_civil_cost) || 0),
            0
          );
          const liveMechTotal = effectiveComponents.reduce(
            (sum, c) => sum + (Number(c.total_mechanical_cost) || 0),
            0
          );
          const liveElecTotal = effectiveComponents.reduce(
            (sum, c) => sum + (Number(c.total_electrical_cost) || 0),
            0
          );
          const liveGrandTotal = effectiveComponents.reduce(
            (sum, c) => sum + (Number(c.total_price) || 0),
            0
          );
          const liveAreaTotal = effectiveComponents.reduce(
            (sum, c) => sum + (Number(c.total_area_m2) || 0),
            0
          );
          const liveVolumeTotal = effectiveComponents.reduce(
            (sum, c) => sum + (Number(c.total_volume_m3) || 0),
            0
          );

          const reqDepthNew = waterFeatureRequiresDepth(
            newCompForm.water_feature_type,
            [...componentsDb, ...waterFeatureTypes],
            newCompForm.water_feature
          );
          const newCompPreview = computeComponentFields({
            water_feature_type: newCompForm.water_feature_type,
            qty_same_specs: newCompForm.qty_same_specs,
            each_length_m: newCompForm.each_length_m,
            each_width_m: newCompForm.each_width_m,
            each_perimeter_m: newCompForm.each_perimeter_m,
            each_area_m2: newCompForm.each_area_m2,
            each_avg_depth_m: reqDepthNew ? newCompForm.each_avg_depth_m : 0,
            volume_is_manual: newCompForm.volume_is_manual || !reqDepthNew,
            each_volume_m3: newCompForm.each_volume_m3,
            total_civil_cost: canEditCivil ? newCompForm.total_civil_cost : 0,
            total_mechanical_cost: canEditMech
              ? newCompForm.total_mechanical_cost
              : 0,
            total_electrical_cost: canEditElec
              ? newCompForm.total_electrical_cost
              : 0,
            total_design_cost: newCompForm.total_design_cost,
            total_supply_cost: newCompForm.total_supply_cost,
            total_maintenance_cost: newCompForm.total_maintenance_cost,
          });
          const hasDraftEdits = Object.keys(compDrafts).length > 0;
          const hasPendingNewComp = Boolean(newCompForm.water_feature.trim());
          const hasUnsavedChanges = hasDraftEdits || hasPendingNewComp;

          const pendingCivilAdd = hasPendingNewComp && canEditCivil
            ? Math.max(0, Number(newCompForm.total_civil_cost) || 0)
            : 0;
          const pendingMechAdd = hasPendingNewComp && canEditMech
            ? Math.max(0, Number(newCompForm.total_mechanical_cost) || 0)
            : 0;
          const pendingElecAdd = hasPendingNewComp && canEditElec
            ? Math.max(0, Number(newCompForm.total_electrical_cost) || 0)
            : 0;

          const displayAreaTotal =
            liveAreaTotal + (hasPendingNewComp ? newCompPreview.total_area_m2 : 0);
          const displayVolumeTotal =
            liveVolumeTotal +
            (hasPendingNewComp ? newCompPreview.total_volume_m3 : 0);
          const displayCivilTotal = liveCivilTotal + pendingCivilAdd;
          const displayMechTotal = liveMechTotal + pendingMechAdd;
          const displayElecTotal = liveElecTotal + pendingElecAdd;
          const displayGrandTotal =
            liveGrandTotal + (hasPendingNewComp ? newCompPreview.total_price : 0);

          const myInProgressAsgs = myAsgs.filter(
            (a) =>
              getEffectiveDisciplineStage(a, effectiveComponents, tender) ===
              'In Progress'
          );
          const canFinishMyDiscipline =
            myInProgressAsgs.length > 0 ||
            (myAsgs.some((a) => a.status !== 'Finished') &&
              (effectiveComponents.length > 0 || hasPendingNewComp));
          const allModalAssignedFinished =
            assignments.length > 0
              ? assignments.every(
                  (a) =>
                    getEffectiveDisciplineStage(
                      a,
                      effectiveComponents,
                      tender
                    ) === 'Finished'
                )
              : pricingItem.stage === 'Finished';
          const canConfirmSentFromModal =
            !canFinishMyDiscipline &&
            pricingItem.stage !== 'Sent' &&
            pricingItem.stage !== 'Cancelled or Waiting' &&
            allModalAssignedFinished &&
            canMoveKanbanCard(
              user,
              'Finished',
              'Sent',
              myAsgs.length > 0
            );

          const submitPendingNewComponent = (silent = false): boolean => {
            const trimmedComp = newCompForm.water_feature.trim();
            if (!trimmedComp) return false;
            try {
              upsertComponent(
                tender.id,
                {
                  component_title: newCompForm.component_title.trim() || null,
                  water_feature: trimmedComp,
                  component_shape: newCompForm.component_shape.trim() || null,
                  water_feature_type: newCompForm.water_feature_type,
                  filtration_method: newCompForm.filtration_method,
                  finishing_type: newCompForm.finishing_type,
                  pump_room_included: Boolean(newCompForm.pump_room_included),
                  proposal_type: newCompForm.proposal_type,
                  qty_same_specs: Math.max(
                    1,
                    Number(newCompForm.qty_same_specs) || 1
                  ),
                  each_length_m: newCompForm.each_length_m,
                  each_width_m: newCompForm.each_width_m,
                  each_perimeter_m: newCompPreview.each_perimeter_m,
                  sub_zones: newCompForm.sub_zones,
                  each_area_m2: Math.max(
                    0,
                    Number(newCompForm.each_area_m2) || 0
                  ),
                  each_avg_depth_m: reqDepthNew
                    ? Math.max(0, Number(newCompForm.each_avg_depth_m) || 0)
                    : 0,
                  volume_is_manual:
                    Boolean(newCompForm.volume_is_manual) || !reqDepthNew,
                  each_volume_m3: newCompPreview.each_volume_m3,
                  total_civil_cost: canEditCivil
                    ? Math.max(0, Number(newCompForm.total_civil_cost) || 0)
                    : 0,
                  total_mechanical_cost: canEditMech
                    ? Math.max(
                        0,
                        Number(newCompForm.total_mechanical_cost) || 0
                      )
                    : 0,
                  total_electrical_cost: canEditElec
                    ? Math.max(
                        0,
                        Number(newCompForm.total_electrical_cost) || 0
                      )
                    : 0,
                  total_design_cost: Math.max(
                    0,
                    Number(newCompForm.total_design_cost) || 0
                  ),
                  total_supply_cost: Math.max(
                    0,
                    Number(newCompForm.total_supply_cost) || 0
                  ),
                  total_maintenance_cost: Math.max(
                    0,
                    Number(newCompForm.total_maintenance_cost) || 0
                  ),
                },
                actor
              );
              setNewCompForm((prev) => ({
                ...prev,
                component_title: '',
                water_feature: '',
                component_shape: componentShapesDb[0]?.label_en || 'Rectangle',
                water_feature_type: waterFeatureTypes[0]?.label_en || 'Skimmer',
                filtration_method:
                  filtrationMethodsDb[0]?.label_en || 'Sand Filter',
                finishing_type: finishingTypesDb[0]?.label_en || 'Mosaic',
                qty_same_specs: 1,
                each_length_m: null,
                each_width_m: null,
                each_perimeter_m: 0,
                sub_zones: null,
                each_area_m2: 0,
                volume_is_manual: false,
                each_volume_m3: 0,
                total_civil_cost: 0,
                total_mechanical_cost: 0,
                total_electrical_cost: 0,
                total_design_cost: 0,
                total_supply_cost: 0,
                total_maintenance_cost: 0,
              }));
              setShowAddCompForm(false);
              if (!silent) {
                showToast(
                  'success',
                  `Added "${trimmedComp}" — shared immediately with all assigned engineers.`
                );
              }
              return true;
            } catch (err) {
              showToast(
                'error',
                err instanceof Error ? err.message : 'Failed to add component'
              );
              return false;
            }
          };

          const saveSingleDraft = (comp: ProposalComponent) => {
            const draft = compDrafts[comp.id];
            if (!draft || Object.keys(draft).length === 0) {
              showToast('success', 'All changes on this water feature are already saved.');
              return;
            }
            try {
              upsertComponent(
                tender.id,
                {
                  id: comp.id,
                  ...draft,
                },
                actor
              );
              setCompDrafts((prev) => {
                const next = { ...prev };
                delete next[comp.id];
                return next;
              });
              showToast(
                'success',
                `Saved pricing for "${draft.water_feature || comp.water_feature}".`
              );
            } catch (err) {
              showToast(
                'error',
                err instanceof Error ? err.message : 'Failed to save component'
              );
            }
          };

          const flushPendingDrafts = (silent = false): boolean => {
            try {
              for (const comp of components) {
                const draft = compDrafts[comp.id];
                if (draft && Object.keys(draft).length > 0) {
                  upsertComponent(
                    tender.id,
                    {
                      id: comp.id,
                      ...draft,
                    },
                    actor
                  );
                }
              }
              setCompDrafts({});
              setExpandedSpecIds({});
              if (hasPendingNewComp && !submitPendingNewComponent(true)) {
                return false;
              }
              if (!silent) {
                showToast('success', 'All components and pricing changes saved.');
              }
              return true;
            } catch (err) {
              showToast(
                'error',
                err instanceof Error ? err.message : 'Failed to save changes'
              );
              return false;
            }
          };

          return (
            <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-slate-200 dark:border-[#1E2D3D] space-y-3 bg-slate-50/70 dark:bg-[#0B1218]/70">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-brand-600 dark:text-brand-300">
                          {tender.proposal_code}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {tender.owner}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Water Features & Multi-Discipline Pricing — {tender.proposal_name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {components.length > 0 && !showAddCompForm && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCompForm(true);
                            setTimeout(() => {
                              document
                                .getElementById('add-water-feature-form')
                                ?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'center',
                                });
                            }, 30);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white shadow-xs text-xs font-bold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Another Component
                        </button>
                      )}
                      {canOpenIntelligentTender(user) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const route = await startIntelligentTender(tender, user);
                            navigate(route);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pzone-teal to-pzone-seagreen text-white text-xs font-bold shadow-xs hover:opacity-95 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {canAccessErpEngineering(user.role)
                              ? lang === 'ar'
                                ? 'التسعير الذكي ERP'
                                : 'Intelligent Tender (ERP)'
                              : lang === 'ar'
                                ? 'المصاريف وسعر العطاء'
                                : 'Commercial Overheads'}
                          </span>
                        </button>
                      )}
                      <Link
                        to={`/tenders/${tender.id}?tab=components`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] hover:border-brand-500 text-xs font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-brand-500" />
                        Open Full Sheet
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (hasUnsavedChanges && !flushPendingDrafts(false)) return;
                          setPricingTenderId(null);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Shared Team Live Bar */}
                  {assignments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-brand-500" />
                        Shared Team:
                      </span>
                      {assignments.map((a) => {
                        const eff = getEffectiveDisciplineStage(
                          a,
                          effectiveComponents,
                          tender
                        );
                        const isMe = a.user_id === user.id;
                        return (
                          <span
                            key={a.id}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] ${
                              isMe
                                ? 'bg-brand-500/10 border-brand-500/40 text-brand-700 dark:text-brand-200 font-semibold'
                                : 'bg-white dark:bg-[#111C28] border-slate-200 dark:border-[#1E2D3D] text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <span>{a.discipline}:</span>
                            <span>{getProfileName(a.user_id, lang)}</span>
                            {isMe && (
                              <span className="text-[9px] font-bold uppercase text-brand-500">
                                (You)
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                eff === 'Finished'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                                  : eff === 'In Progress'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                    : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/35'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  eff === 'Finished'
                                    ? 'bg-emerald-500'
                                    : eff === 'In Progress'
                                      ? 'bg-amber-500 animate-pulse'
                                      : 'bg-sky-500'
                                }`}
                              />
                              {eff}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto space-y-6 text-xs">
                  {/* Existing Shared Proposal Water Features */}
                  {components.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <Waves className="w-3.5 h-3.5 text-brand-500" />
                          Shared Water Features ({components.length}) — Enter Your Discipline Price per Water Feature
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          All assigned engineers share these water features. Your assigned discipline fields are unlocked; teammates&apos; prices are shown live.
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        {components.map((comp, idx) => {
                          const draft = compDrafts[comp.id] || {};
                          const merged = { ...comp, ...draft };
                          const reqDepthRow = waterFeatureRequiresDepth(
                            merged.water_feature_type,
                            [...componentsDb, ...waterFeatureTypes],
                            merged.water_feature
                          );
                          const computedRow = computeComponentFields({
                            water_feature_type: merged.water_feature_type,
                            qty_same_specs: merged.qty_same_specs,
                            each_length_m: merged.each_length_m,
                            each_width_m: merged.each_width_m,
                            each_perimeter_m: merged.each_perimeter_m,
                            each_area_m2: merged.each_area_m2,
                            each_avg_depth_m: merged.each_avg_depth_m,
                            volume_is_manual: merged.volume_is_manual,
                            each_volume_m3: merged.each_volume_m3,
                            total_maintenance_cost:
                              merged.total_maintenance_cost,
                            total_supply_cost: merged.total_supply_cost,
                            total_design_cost: merged.total_design_cost,
                            total_civil_cost: merged.total_civil_cost,
                            total_mechanical_cost: merged.total_mechanical_cost,
                            total_electrical_cost: merged.total_electrical_cost,
                          });
                          const isDirty = Boolean(compDrafts[comp.id]);
                          const isSpecsExpanded = Boolean(
                            expandedSpecIds[comp.id]
                          );

                          const updateDraft = (
                            patch: Partial<ProposalComponent>
                          ) => {
                            setCompDrafts((prev) => ({
                              ...prev,
                              [comp.id]: {
                                ...(prev[comp.id] || {}),
                                ...patch,
                              },
                            }));
                          };

                          const civilPriced =
                            (Number(merged.total_civil_cost) || 0) > 0;
                          const mechPriced =
                            (Number(merged.total_mechanical_cost) || 0) > 0;
                          const elecPriced =
                            (Number(merged.total_electrical_cost) || 0) > 0;

                          return (
                            <div
                              key={comp.id}
                              className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] p-3.5 bg-slate-50/50 dark:bg-[#0B1218]/60 space-y-3"
                            >
                              {/* Top bar: Water Feature Name + Specs Summary + Actions */}
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[220px]">
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    #{idx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="Component Title (optional)..."
                                    value={merged.component_title || ''}
                                    onChange={(e) =>
                                      updateDraft({
                                        component_title: e.target.value,
                                      })
                                    }
                                    className="w-44 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                                  />
                                  <div className="min-w-[200px]">
                                    <SearchableDbSelect
                                      value={merged.water_feature}
                                      onChange={(nextVal) =>
                                        updateDraft({
                                          water_feature: nextVal,
                                        })
                                      }
                                      options={componentsDb.map((lv) => ({
                                        id: lv.id,
                                        value: lv.label_en,
                                        label: lv.label_en,
                                      }))}
                                      placeholder="Select Component..."
                                      addButtonLabel="Add Component"
                                      onAddNew={(newLabel) => {
                                        const added = addComponentDatabaseEntry(
                                          {
                                            category: 'water_feature',
                                            label_en: newLabel,
                                          },
                                          actor
                                        );
                                        updateDraft({
                                          water_feature: added.label_en,
                                        });
                                      }}
                                    />
                                  </div>
                                  {merged.component_shape && (
                                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-semibold text-[11px]">
                                      {merged.component_shape}
                                    </span>
                                  )}
                                  {merged.sub_zones && merged.sub_zones.length > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold text-[10px]">
                                      {merged.sub_zones.length} Pieces
                                    </span>
                                  )}
                                  {merged.water_feature_type && (
                                    <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-300 font-semibold text-[11px]">
                                      {merged.water_feature_type}
                                    </span>
                                  )}
                                  {merged.filtration_method && (
                                    <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                                      {merged.filtration_method}
                                    </span>
                                  )}
                                  {merged.finishing_type && (
                                    <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-[11px]">
                                      {merged.finishing_type}
                                    </span>
                                  )}
                                  {merged.pump_room_included && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                                      <Check className="w-3 h-3" />
                                      Pump Room pricing included in water feature pricing
                                    </span>
                                  )}
                                  <span className="font-mono text-[11px] text-slate-500">
                                    Qty {merged.qty_same_specs} •{' '}
                                    {formatNumber(computedRow.total_area_m2, 1)} m² •{' '}
                                    {formatNumber(computedRow.total_perimeter_m, 1)} m perim •{' '}
                                    {formatNumber(computedRow.total_volume_m3, 1)} m³
                                  </span>
                                  {comp.created_by && (
                                    <span className="text-[10px] text-slate-400">
                                      • Added by{' '}
                                      <strong className="font-semibold text-slate-600 dark:text-slate-300">
                                        {getProfileName(comp.created_by, lang)}
                                      </strong>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-brand-600 dark:text-brand-300">
                                    {formatCurrency(
                                      computedRow.total_price,
                                      'EGP'
                                    )}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedSpecIds((prev) => ({
                                        ...prev,
                                        [comp.id]: !prev[comp.id],
                                      }))
                                    }
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                                      isSpecsExpanded
                                        ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                                        : 'border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] text-slate-600 dark:text-slate-300 hover:border-brand-500/50'
                                    }`}
                                  >
                                    <SlidersHorizontal className="w-3 h-3" />
                                    Specs
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => saveSingleDraft(comp)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                                      isDirty
                                        ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-xs'
                                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-500 hover:text-white'
                                    }`}
                                  >
                                    <Save className="w-3 h-3" />
                                    Save Price
                                  </button>
                                  <button
                                    type="button"
                                    title="Remove Component"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Remove component "${comp.water_feature}"?`
                                        )
                                      ) {
                                        deleteComponent(comp.id, actor);
                                        showToast(
                                          'success',
                                          'Component removed.'
                                        );
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Expandable Technical Specs Editor (shared across engineers) */}
                              {isSpecsExpanded && (
                                <div className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] p-3 space-y-2.5">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                        Component Shape
                                      </label>
                                      <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] p-0.5">
                                        {(['Rectangle', 'Free Form'] as const).map(
                                          (shOpt) => {
                                            const isRowPump = Boolean(
                                              merged.water_feature
                                                ?.toLowerCase()
                                                .includes('pump room') ||
                                                merged.water_feature
                                                  ?.toLowerCase()
                                                  .includes('plant room')
                                            );
                                            const activeShape = isRowPump
                                              ? 'Rectangle'
                                              : merged.component_shape ||
                                                'Rectangle';
                                            return (
                                              <button
                                                key={shOpt}
                                                type="button"
                                                disabled={
                                                  isRowPump && shOpt === 'Free Form'
                                                }
                                                onClick={() =>
                                                  updateDraft(
                                                    shOpt === 'Free Form'
                                                      ? {
                                                          component_shape:
                                                            'Free Form',
                                                          each_length_m: null,
                                                          each_width_m: null,
                                                        }
                                                      : {
                                                          component_shape:
                                                            'Rectangle',
                                                        }
                                                  )
                                                }
                                                className={`py-1 px-2 rounded text-[11px] font-bold transition-colors ${
                                                  activeShape === shOpt
                                                    ? 'bg-brand-500 text-white'
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#162332] disabled:opacity-40'
                                                }`}
                                              >
                                                {shOpt}
                                              </button>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                        Component Type
                                      </label>
                                      <SearchableDbSelect
                                        value={merged.water_feature_type}
                                        onChange={(val) =>
                                          updateDraft({
                                            water_feature_type: val,
                                          })
                                        }
                                        options={waterFeatureTypes.map((lv) => ({
                                          id: lv.id,
                                          value: lv.label_en,
                                          label: lv.label_en,
                                        }))}
                                        placeholder="Select Component Type..."
                                        addButtonLabel="Add Component Type"
                                        onAddNew={(newLabel) => {
                                          const added =
                                            addComponentDatabaseEntry(
                                              {
                                                category: 'water_feature_type',
                                                label_en: newLabel,
                                              },
                                              actor
                                            );
                                          updateDraft({
                                            water_feature_type: added.label_en,
                                          });
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                        Filtration Method
                                      </label>
                                      <SearchableDbSelect
                                        value={merged.filtration_method || ''}
                                        onChange={(val) =>
                                          updateDraft({
                                            filtration_method: val,
                                          })
                                        }
                                        options={filtrationMethodsDb.map(
                                          (lv) => ({
                                            id: lv.id,
                                            value: lv.label_en,
                                            label: lv.label_en,
                                          })
                                        )}
                                        placeholder="Select Filtration..."
                                        addButtonLabel="Add Filtration Method"
                                        onAddNew={(newLabel) => {
                                          const added =
                                            addComponentDatabaseEntry(
                                              {
                                                category: 'filtration_method',
                                                label_en: newLabel,
                                              },
                                              actor
                                            );
                                          updateDraft({
                                            filtration_method: added.label_en,
                                          });
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                        Finishing Type
                                      </label>
                                      <SearchableDbSelect
                                        value={merged.finishing_type || ''}
                                        onChange={(val) =>
                                          updateDraft({
                                            finishing_type: val,
                                          })
                                        }
                                        options={finishingTypesDb.map((lv) => ({
                                          id: lv.id,
                                          value: lv.label_en,
                                          label: lv.label_en,
                                        }))}
                                        placeholder="Select Finishing..."
                                        addButtonLabel="Add Finishing Type"
                                        onAddNew={(newLabel) => {
                                          const added =
                                            addComponentDatabaseEntry(
                                              {
                                                category: 'finishing_type',
                                                label_en: newLabel,
                                              },
                                              actor
                                            );
                                          updateDraft({
                                            finishing_type: added.label_en,
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                        Qty
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        value={merged.qty_same_specs}
                                        onChange={(e) =>
                                          updateDraft({
                                            qty_same_specs: Math.max(
                                              1,
                                              Number(e.target.value) || 1
                                            ),
                                          })
                                        }
                                        className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 font-mono text-xs"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                        Avg Depth (m)
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        disabled={!reqDepthRow}
                                        value={
                                          reqDepthRow
                                            ? (merged.each_avg_depth_m ?? 0)
                                            : 0
                                        }
                                        onChange={(e) =>
                                          updateDraft({
                                            each_avg_depth_m: Math.max(
                                              0,
                                              Number(e.target.value) || 0
                                            ),
                                          })
                                        }
                                        className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 font-mono text-xs disabled:opacity-50"
                                      />
                                    </div>
                                    {!(
                                      merged.water_feature
                                        ?.toLowerCase()
                                        .includes('pump room') ||
                                      merged.water_feature
                                        ?.toLowerCase()
                                        .includes('plant room')
                                    ) && (
                                      <div className="col-span-2">
                                        <label className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={Boolean(
                                              merged.pump_room_included
                                            )}
                                            onChange={(e) =>
                                              updateDraft({
                                                pump_room_included:
                                                  e.target.checked,
                                              })
                                            }
                                            className="w-3.5 h-3.5 rounded accent-brand-500"
                                          />
                                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                            Pump Room pricing included in water feature pricing
                                          </span>
                                        </label>
                                      </div>
                                    )}
                                  </div>

                                  {(Boolean(
                                    merged.water_feature
                                      ?.toLowerCase()
                                      .includes('pump room') ||
                                      merged.water_feature
                                        ?.toLowerCase()
                                        .includes('plant room')
                                  ) ||
                                    (merged.component_shape || 'Rectangle')
                                      .trim()
                                      .toLowerCase() === 'rectangle') &&
                                    !(merged.sub_zones && merged.sub_zones.length > 0) && (
                                    <div className="grid grid-cols-3 gap-2.5">
                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                          Length (m)
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step="0.05"
                                          value={merged.each_length_m ?? ''}
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            const len =
                                              raw === ''
                                                ? null
                                                : Math.max(0, Number(raw) || 0);
                                            const wid = merged.each_width_m ?? null;
                                            const hasBoth =
                                              len !== null &&
                                              wid !== null &&
                                              len > 0 &&
                                              wid > 0;
                                            updateDraft({
                                              each_length_m: len,
                                              ...(hasBoth
                                                ? {
                                                    each_area_m2: Number(
                                                      (len * wid).toFixed(2)
                                                    ),
                                                    each_perimeter_m: Number(
                                                      (2 * (len + wid)).toFixed(2)
                                                    ),
                                                  }
                                                : {}),
                                            });
                                          }}
                                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 font-mono text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                          Width (m)
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step="0.05"
                                          value={merged.each_width_m ?? ''}
                                          onChange={(e) => {
                                            const raw = e.target.value;
                                            const wid =
                                              raw === ''
                                                ? null
                                                : Math.max(0, Number(raw) || 0);
                                            const len = merged.each_length_m ?? null;
                                            const hasBoth =
                                              len !== null &&
                                              wid !== null &&
                                              len > 0 &&
                                              wid > 0;
                                            updateDraft({
                                              each_width_m: wid,
                                              ...(hasBoth
                                                ? {
                                                    each_area_m2: Number(
                                                      (len * wid).toFixed(2)
                                                    ),
                                                    each_perimeter_m: Number(
                                                      (2 * (len + wid)).toFixed(2)
                                                    ),
                                                  }
                                                : {}),
                                            });
                                          }}
                                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 font-mono text-xs"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                          Perimeter (m)
                                        </label>
                                        <input
                                          type="number"
                                          min={0}
                                          step="0.1"
                                          value={computedRow.each_perimeter_m}
                                          onChange={(e) =>
                                            updateDraft({
                                              each_perimeter_m: Math.max(
                                                0,
                                                Number(e.target.value) || 0
                                              ),
                                            })
                                          }
                                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 font-mono text-xs"
                                        />
                                      </div>
                                    </div>
                                  )}
                                  {!(
                                    Boolean(
                                      merged.water_feature
                                        ?.toLowerCase()
                                        .includes('pump room') ||
                                        merged.water_feature
                                          ?.toLowerCase()
                                          .includes('plant room')
                                    ) ||
                                    (merged.component_shape || 'Rectangle')
                                      .trim()
                                      .toLowerCase() === 'rectangle'
                                  ) && (
                                    <div className="max-w-[200px]">
                                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                        Perimeter (m)
                                      </label>
                                      <input
                                        type="number"
                                        min={0}
                                        step="0.1"
                                        value={computedRow.each_perimeter_m}
                                        onChange={(e) =>
                                          updateDraft({
                                            each_perimeter_m: Math.max(
                                              0,
                                              Number(e.target.value) || 0
                                            ),
                                          })
                                        }
                                        className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 font-mono text-xs"
                                      />
                                    </div>
                                  )}

                                  {reqDepthRow && (
                                    <ComponentSubZonesEditor
                                      subZones={merged.sub_zones}
                                      currentAreaM2={merged.each_area_m2}
                                      currentAvgDepthM={merged.each_avg_depth_m}
                                      onChange={(zUpdate) => updateDraft(zUpdate)}
                                    />
                                  )}
                                </div>
                              )}

                              {/* Per-Water-Feature Discipline Pricing Cards + Area/Volume/Supply */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                    Each Area (m²)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={merged.each_area_m2}
                                    onChange={(e) =>
                                      updateDraft({
                                        each_area_m2: Math.max(
                                          0,
                                          Number(e.target.value) || 0
                                        ),
                                      })
                                    }
                                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <label className="block text-[10px] font-semibold text-slate-500">
                                      Each Vol (m³)
                                    </label>
                                    {merged.volume_is_manual && reqDepthRow && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateDraft({
                                            volume_is_manual: false,
                                          })
                                        }
                                        className="text-[9px] font-bold text-brand-500 hover:underline"
                                      >
                                        Auto
                                      </button>
                                    )}
                                  </div>
                                  <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    value={computedRow.each_volume_m3}
                                    onChange={(e) =>
                                      updateDraft({
                                        volume_is_manual: true,
                                        each_volume_m3: Math.max(
                                          0,
                                          Number(e.target.value) || 0
                                        ),
                                      })
                                    }
                                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs"
                                  />
                                  {merged.qty_same_specs > 1 && (
                                    <span className="block text-[9px] font-mono text-slate-400 mt-0.5">
                                      Total: {formatNumber(computedRow.total_volume_m3, 1)} m³
                                    </span>
                                  )}
                                </div>

                                {/* Civil/Arch Price */}
                                <div
                                  className={`rounded-lg p-2 border ${
                                    canEditCivil
                                      ? 'bg-brand-500/5 border-brand-500/40'
                                      : 'bg-slate-100/70 dark:bg-[#111C28]/70 border-slate-200 dark:border-[#1E2D3D]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                      Civil Cost (EGP)
                                      {canEditCivil &&
                                        isEngineerRole(user.role) &&
                                        ' ★'}
                                    </label>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                        civilPriced
                                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                          : canEditCivil &&
                                              isEngineerRole(user.role)
                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500'
                                      }`}
                                    >
                                      {civilPriced ? '✓ Priced' : 'Pending'}
                                    </span>
                                  </div>
                                  {canEditCivil ? (
                                    <FormattedNumberInput
                                      min={0}
                                      value={merged.total_civil_cost}
                                      onValueChange={(val) =>
                                        updateDraft({
                                          total_civil_cost: val,
                                        })
                                      }
                                      className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1 font-mono text-xs font-semibold"
                                    />
                                  ) : (
                                    <div
                                      title={`Assigned to ${civilOwnerLabel} (read-only for your role)`}
                                      className="w-full rounded-lg border border-slate-200/70 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 select-all"
                                    >
                                      {formatCurrency(
                                        merged.total_civil_cost,
                                        'EGP'
                                      )}
                                    </div>
                                  )}
                                  <div className="text-[9px] text-slate-400 truncate mt-0.5">
                                    {civilOwnerLabel}
                                  </div>
                                </div>

                                {/* Mechanical Price */}
                                <div
                                  className={`rounded-lg p-2 border ${
                                    canEditMech
                                      ? 'bg-brand-500/5 border-brand-500/40'
                                      : 'bg-slate-100/70 dark:bg-[#111C28]/70 border-slate-200 dark:border-[#1E2D3D]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                      Mechanical (EGP)
                                      {canEditMech &&
                                        isEngineerRole(user.role) &&
                                        ' ★'}
                                    </label>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                        mechPriced
                                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                          : canEditMech &&
                                              isEngineerRole(user.role)
                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500'
                                      }`}
                                    >
                                      {mechPriced ? '✓ Priced' : 'Pending'}
                                    </span>
                                  </div>
                                  {canEditMech ? (
                                    <FormattedNumberInput
                                      min={0}
                                      value={merged.total_mechanical_cost}
                                      onValueChange={(val) =>
                                        updateDraft({
                                          total_mechanical_cost: val,
                                        })
                                      }
                                      className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1 font-mono text-xs font-semibold"
                                    />
                                  ) : (
                                    <div
                                      title={`Assigned to ${mechOwnerLabel} (read-only for your role)`}
                                      className="w-full rounded-lg border border-slate-200/70 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 select-all"
                                    >
                                      {formatCurrency(
                                        merged.total_mechanical_cost,
                                        'EGP'
                                      )}
                                    </div>
                                  )}
                                  <div className="text-[9px] text-slate-400 truncate mt-0.5">
                                    {mechOwnerLabel}
                                  </div>
                                </div>

                                {/* Electrical Price */}
                                <div
                                  className={`rounded-lg p-2 border ${
                                    canEditElec
                                      ? 'bg-brand-500/5 border-brand-500/40'
                                      : 'bg-slate-100/70 dark:bg-[#111C28]/70 border-slate-200 dark:border-[#1E2D3D]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <label className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">
                                      Electrical (EGP)
                                      {canEditElec &&
                                        isEngineerRole(user.role) &&
                                        ' ★'}
                                    </label>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                                        elecPriced
                                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                          : canEditElec &&
                                              isEngineerRole(user.role)
                                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500'
                                      }`}
                                    >
                                      {elecPriced ? '✓ Priced' : 'Pending'}
                                    </span>
                                  </div>
                                  {canEditElec ? (
                                    <FormattedNumberInput
                                      min={0}
                                      value={merged.total_electrical_cost}
                                      onValueChange={(val) =>
                                        updateDraft({
                                          total_electrical_cost: val,
                                        })
                                      }
                                      className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1 font-mono text-xs font-semibold"
                                    />
                                  ) : (
                                    <div
                                      title={`Assigned to ${elecOwnerLabel} (read-only for your role)`}
                                      className="w-full rounded-lg border border-slate-200/70 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1 font-mono text-xs font-semibold text-slate-600 dark:text-slate-300 select-all"
                                    >
                                      {formatCurrency(
                                        merged.total_electrical_cost,
                                        'EGP'
                                      )}
                                    </div>
                                  )}
                                  <div className="text-[9px] text-slate-400 truncate mt-0.5">
                                    {elecOwnerLabel}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                                    Supply Cost (EGP)
                                  </label>
                                  <FormattedNumberInput
                                    min={0}
                                    value={merged.total_supply_cost}
                                    onValueChange={(val) =>
                                      updateDraft({
                                        total_supply_cost: val,
                                      })
                                    }
                                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add New / Additional Water Feature Component & Pricing Form */}
                  {components.length > 0 && !showAddCompForm ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCompForm(true);
                        setTimeout(() => {
                          document
                            .getElementById('add-water-feature-form')
                            ?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center',
                            });
                        }, 30);
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white text-xs font-bold shadow-sm shadow-brand-500/25 flex items-center justify-center gap-2 transition-all"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      Add Another Component
                    </button>
                  ) : (
                  <form
                    id="add-water-feature-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newCompForm.water_feature.trim()) {
                        showToast(
                          'error',
                          'Please select or add a Component.'
                        );
                        return;
                      }
                      if (hasDraftEdits && !flushPendingDrafts(true)) {
                        return;
                      }
                      submitPendingNewComponent(false);
                    }}
                    className="rounded-xl border border-dashed border-brand-500/40 bg-brand-500/[0.03] p-4 space-y-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" />
                          {components.length > 0
                            ? 'Add Another Water Feature Component & Your Discipline Pricing'
                            : 'Add New Water Feature Component & Discipline Pricing'}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Any assigned engineer can add water features; teammates will enter their own discipline prices.
                        </span>
                      </div>
                      {components.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCompForm(false);
                            setNewCompForm((prev) => ({
                              ...prev,
                              water_feature: '',
                              qty_same_specs: 1,
                              each_area_m2: 0,
                              volume_is_manual: false,
                              each_volume_m3: 0,
                              total_civil_cost: 0,
                              total_mechanical_cost: 0,
                              total_electrical_cost: 0,
                            }));
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] font-semibold"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Component Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Main Pool 01, Kids Pool, Pump Room A..."
                          value={newCompForm.component_title}
                          onChange={(e) =>
                            setNewCompForm({
                              ...newCompForm,
                              component_title: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Component *
                        </label>
                        <SearchableDbSelect
                          required
                          value={newCompForm.water_feature}
                          onChange={(selectedComp) => {
                            const isPump =
                              selectedComp.toLowerCase().includes('pump room') ||
                              selectedComp.toLowerCase().includes('plant room');
                            setNewCompForm((prev) => ({
                              ...prev,
                              water_feature: selectedComp,
                              water_feature_type: isPump
                                ? ''
                                : prev.water_feature_type ||
                                  waterFeatureTypes[0]?.label_en ||
                                  'Skimmer',
                              filtration_method: isPump
                                ? ''
                                : prev.filtration_method ||
                                  filtrationMethodsDb[0]?.label_en ||
                                  'Sand Filter',
                              finishing_type: isPump
                                ? ''
                                : prev.finishing_type ||
                                  finishingTypesDb[0]?.label_en ||
                                  'Mosaic',
                              pump_room_included: isPump
                                ? false
                                : prev.pump_room_included,
                            }));
                          }}
                          options={componentsDb.map((lv) => ({
                            id: lv.id,
                            value: lv.label_en,
                            label: lv.label_en,
                          }))}
                          placeholder="Select Component..."
                          addButtonLabel="Add Component"
                          onAddNew={(newLabel) => {
                            const added = addComponentDatabaseEntry(
                              {
                                category: 'water_feature',
                                label_en: newLabel,
                              },
                              actor
                            );
                            const isPump =
                              added.label_en
                                .toLowerCase()
                                .includes('pump room') ||
                              added.label_en
                                .toLowerCase()
                                .includes('plant room');
                            setNewCompForm((prev) => ({
                              ...prev,
                              water_feature: added.label_en,
                              water_feature_type: isPump
                                ? ''
                                : prev.water_feature_type ||
                                  waterFeatureTypes[0]?.label_en ||
                                  'Skimmer',
                              filtration_method: isPump
                                ? ''
                                : prev.filtration_method ||
                                  filtrationMethodsDb[0]?.label_en ||
                                  'Sand Filter',
                              finishing_type: isPump
                                ? ''
                                : prev.finishing_type ||
                                  finishingTypesDb[0]?.label_en ||
                                  'Mosaic',
                              pump_room_included: isPump
                                ? false
                                : prev.pump_room_included,
                            }));
                            showToast(
                              'success',
                              `Added "${added.label_en}" to Component database.`
                            );
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Component Shape *
                        </label>
                        <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] p-1">
                          {(['Rectangle', 'Free Form'] as const).map((shOpt) => {
                            const isNewPump = Boolean(
                              newCompForm.water_feature
                                .toLowerCase()
                                .includes('pump room') ||
                                newCompForm.water_feature
                                  .toLowerCase()
                                  .includes('plant room')
                            );
                            const activeShape = isNewPump
                              ? 'Rectangle'
                              : newCompForm.component_shape || 'Rectangle';
                            return (
                              <button
                                key={shOpt}
                                type="button"
                                disabled={isNewPump && shOpt === 'Free Form'}
                                onClick={() =>
                                  setNewCompForm((prev) =>
                                    shOpt === 'Free Form'
                                      ? {
                                          ...prev,
                                          component_shape: 'Free Form',
                                          each_length_m: null,
                                          each_width_m: null,
                                        }
                                      : {
                                          ...prev,
                                          component_shape: 'Rectangle',
                                        }
                                  )
                                }
                                className={`py-1.5 px-2.5 rounded-md text-xs font-bold transition-colors ${
                                  activeShape === shOpt
                                    ? 'bg-brand-500 text-white shadow-xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162332] disabled:opacity-40'
                                }`}
                              >
                                {shOpt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Component Type
                        </label>
                        <SearchableDbSelect
                          value={newCompForm.water_feature_type}
                          onChange={(selectedType) =>
                            setNewCompForm({
                              ...newCompForm,
                              water_feature_type: selectedType,
                            })
                          }
                          options={waterFeatureTypes.map((lv) => ({
                            id: lv.id,
                            value: lv.label_en,
                            label: lv.label_en,
                          }))}
                          placeholder="Select Component Type..."
                          addButtonLabel="Add Component Type"
                          onAddNew={(newLabel) => {
                            const added = addComponentDatabaseEntry(
                              {
                                category: 'water_feature_type',
                                label_en: newLabel,
                              },
                              actor
                            );
                            setNewCompForm({
                              ...newCompForm,
                              water_feature_type: added.label_en,
                            });
                            showToast(
                              'success',
                              `Added "${added.label_en}" to Component Type database.`
                            );
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Filtration Method
                        </label>
                        <SearchableDbSelect
                          value={newCompForm.filtration_method}
                          onChange={(selectedMethod) =>
                            setNewCompForm({
                              ...newCompForm,
                              filtration_method: selectedMethod,
                            })
                          }
                          options={filtrationMethodsDb.map((lv) => ({
                            id: lv.id,
                            value: lv.label_en,
                            label: lv.label_en,
                          }))}
                          placeholder="Select Filtration Method..."
                          addButtonLabel="Add Filtration Method"
                          onAddNew={(newLabel) => {
                            const added = addComponentDatabaseEntry(
                              {
                                category: 'filtration_method',
                                label_en: newLabel,
                              },
                              actor
                            );
                            setNewCompForm({
                              ...newCompForm,
                              filtration_method: added.label_en,
                            });
                            showToast(
                              'success',
                              `Added "${added.label_en}" to Filtration Methods database.`
                            );
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Finishing Type
                        </label>
                        <SearchableDbSelect
                          value={newCompForm.finishing_type}
                          onChange={(selectedFinish) =>
                            setNewCompForm({
                              ...newCompForm,
                              finishing_type: selectedFinish,
                            })
                          }
                          options={finishingTypesDb.map((lv) => ({
                            id: lv.id,
                            value: lv.label_en,
                            label: lv.label_en,
                          }))}
                          placeholder="Select Finishing Type..."
                          addButtonLabel="Add Finishing Type"
                          onAddNew={(newLabel) => {
                            const added = addComponentDatabaseEntry(
                              {
                                category: 'finishing_type',
                                label_en: newLabel,
                              },
                              actor
                            );
                            setNewCompForm({
                              ...newCompForm,
                              finishing_type: added.label_en,
                            });
                            showToast(
                              'success',
                              `Added "${added.label_en}" to Finishing Types database.`
                            );
                          }}
                        />
                      </div>
                    </div>

                    {/* Optional Multi-Piece / Sub-Zone Calculator */}
                    {reqDepthNew && (
                      <ComponentSubZonesEditor
                        subZones={newCompForm.sub_zones}
                        currentAreaM2={newCompForm.each_area_m2}
                        currentAvgDepthM={newCompForm.each_avg_depth_m}
                        onChange={(zUpdate) =>
                          setNewCompForm((prev) => ({
                            ...prev,
                            ...zUpdate,
                          }))
                        }
                      />
                    )}

                    {/* Rectangle & Pump Room Length × Width → Auto Area, Perimeter & Volume */}
                    {(Boolean(
                      newCompForm.water_feature
                        .toLowerCase()
                        .includes('pump room') ||
                        newCompForm.water_feature
                          .toLowerCase()
                          .includes('plant room')
                    ) ||
                      (newCompForm.component_shape || 'Rectangle')
                        .trim()
                        .toLowerCase() === 'rectangle') &&
                      !(newCompForm.sub_zones && newCompForm.sub_zones.length > 0) && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                            Length (m){' '}
                            <span className="text-[9px] font-normal text-brand-500">
                              (Auto Area &amp; Perimeter)
                            </span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.05"
                            placeholder="e.g. 15"
                            value={newCompForm.each_length_m ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const len =
                                raw === '' ? null : Math.max(0, Number(raw) || 0);
                              const wid = newCompForm.each_width_m;
                              const hasBoth =
                                len !== null && wid !== null && len > 0 && wid > 0;
                              setNewCompForm((prev) => ({
                                ...prev,
                                each_length_m: len,
                                ...(hasBoth
                                  ? {
                                      each_area_m2: Number(
                                        (len * wid).toFixed(2)
                                      ),
                                      each_perimeter_m: Number(
                                        (2 * (len + wid)).toFixed(2)
                                      ),
                                    }
                                  : {}),
                              }));
                            }}
                            className="w-full rounded-lg border border-brand-500/35 bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                            Width (m){' '}
                            <span className="text-[9px] font-normal text-brand-500">
                              (Auto Area &amp; Perimeter)
                            </span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.05"
                            placeholder="e.g. 8"
                            value={newCompForm.each_width_m ?? ''}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const wid =
                                raw === '' ? null : Math.max(0, Number(raw) || 0);
                              const len = newCompForm.each_length_m;
                              const hasBoth =
                                len !== null && wid !== null && len > 0 && wid > 0;
                              setNewCompForm((prev) => ({
                                ...prev,
                                each_width_m: wid,
                                ...(hasBoth
                                  ? {
                                      each_area_m2: Number(
                                        (len * wid).toFixed(2)
                                      ),
                                      each_perimeter_m: Number(
                                        (2 * (len + wid)).toFixed(2)
                                      ),
                                    }
                                  : {}),
                              }));
                            }}
                            className="w-full rounded-lg border border-brand-500/35 bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Dimensions Row: Qty, Area, Perimeter, Avg Depth, Volume */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newCompForm.qty_same_specs}
                          onChange={(e) =>
                            setNewCompForm({
                              ...newCompForm,
                              qty_same_specs: Math.max(
                                1,
                                Number(e.target.value) || 1
                              ),
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Each Area (m²)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={newCompForm.each_area_m2}
                          onChange={(e) =>
                            setNewCompForm({
                              ...newCompForm,
                              each_area_m2: Math.max(
                                0,
                                Number(e.target.value) || 0
                              ),
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs"
                        />
                        {newCompForm.qty_same_specs > 1 && (
                          <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                            Total Area: {formatNumber(newCompPreview.total_area_m2, 1)} m²
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Perimeter (m)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={newCompPreview.each_perimeter_m}
                          onChange={(e) =>
                            setNewCompForm({
                              ...newCompForm,
                              each_perimeter_m: Math.max(
                                0,
                                Number(e.target.value) || 0
                              ),
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs"
                        />
                        {newCompForm.qty_same_specs > 1 && (
                          <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                            Total Perim: {formatNumber(newCompPreview.total_perimeter_m, 1)} m
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                          Avg Depth (m)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          disabled={!reqDepthNew}
                          value={reqDepthNew ? newCompForm.each_avg_depth_m : 0}
                          onChange={(e) =>
                            setNewCompForm({
                              ...newCompForm,
                              each_avg_depth_m: Math.max(
                                0,
                                Number(e.target.value) || 0
                              ),
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <label className="block text-[10px] font-bold text-brand-700 dark:text-brand-300">
                            Each Volume (m³)
                          </label>
                          {newCompForm.volume_is_manual && reqDepthNew ? (
                            <button
                              type="button"
                              onClick={() =>
                                setNewCompForm({
                                  ...newCompForm,
                                  volume_is_manual: false,
                                })
                              }
                              className="text-[9px] font-bold text-brand-500 hover:underline"
                            >
                              Reset Auto
                            </button>
                          ) : (
                            reqDepthNew && (
                              <span className="text-[9px] font-mono text-slate-400">
                                Area × Depth
                              </span>
                            )
                          )}
                        </div>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={newCompPreview.each_volume_m3}
                          onChange={(e) =>
                            setNewCompForm({
                              ...newCompForm,
                              volume_is_manual: true,
                              each_volume_m3: Math.max(
                                0,
                                Number(e.target.value) || 0
                              ),
                            })
                          }
                          className="w-full rounded-lg border border-brand-500/40 bg-brand-500/[0.04] dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs font-bold text-brand-700 dark:text-brand-300"
                        />
                        {newCompForm.qty_same_specs > 1 && (
                          <span className="block text-[10px] font-mono text-brand-600 dark:text-brand-300 mt-0.5">
                            Total Volume: {formatNumber(newCompPreview.total_volume_m3, 1)} m³
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Discipline Pricing Row: Civil, Mechanical, Electrical */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">

                      <div
                        className={`rounded-lg p-1.5 -m-1.5 ${
                          canEditCivil
                            ? 'bg-brand-500/5 ring-1 ring-brand-500/40'
                            : 'opacity-75'
                        }`}
                      >
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1 truncate">
                          Civil Cost (EGP)
                          {canEditCivil && isEngineerRole(user.role) && ' ★'}
                        </label>
                        <FormattedNumberInput
                          min={0}
                          disabled={!canEditCivil}
                          title={
                            canEditCivil
                              ? 'Enter Civil/Arch cost for this water feature'
                              : `Pending ${civilOwnerLabel}`
                          }
                          value={canEditCivil ? newCompForm.total_civil_cost : 0}
                          onValueChange={(val) =>
                            setNewCompForm({
                              ...newCompForm,
                              total_civil_cost: val,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {!canEditCivil && (
                          <span className="block text-[9px] text-slate-400 truncate mt-0.5">
                            By {civilOwnerLabel}
                          </span>
                        )}
                      </div>

                      <div
                        className={`rounded-lg p-1.5 -m-1.5 ${
                          canEditMech
                            ? 'bg-brand-500/5 ring-1 ring-brand-500/40'
                            : 'opacity-75'
                        }`}
                      >
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1 truncate">
                          Mech Cost (EGP)
                          {canEditMech && isEngineerRole(user.role) && ' ★'}
                        </label>
                        <FormattedNumberInput
                          min={0}
                          disabled={!canEditMech}
                          title={
                            canEditMech
                              ? 'Enter Mechanical cost for this water feature'
                              : `Pending ${mechOwnerLabel}`
                          }
                          value={
                            canEditMech ? newCompForm.total_mechanical_cost : 0
                          }
                          onValueChange={(val) =>
                            setNewCompForm({
                              ...newCompForm,
                              total_mechanical_cost: val,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {!canEditMech && (
                          <span className="block text-[9px] text-slate-400 truncate mt-0.5">
                            By {mechOwnerLabel}
                          </span>
                        )}
                      </div>

                      <div
                        className={`rounded-lg p-1.5 -m-1.5 ${
                          canEditElec
                            ? 'bg-brand-500/5 ring-1 ring-brand-500/40'
                            : 'opacity-75'
                        }`}
                      >
                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1 truncate">
                          Elec Cost (EGP)
                          {canEditElec && isEngineerRole(user.role) && ' ★'}
                        </label>
                        <FormattedNumberInput
                          min={0}
                          disabled={!canEditElec}
                          title={
                            canEditElec
                              ? 'Enter Electrical cost for this water feature'
                              : `Pending ${elecOwnerLabel}`
                          }
                          value={
                            canEditElec ? newCompForm.total_electrical_cost : 0
                          }
                          onValueChange={(val) =>
                            setNewCompForm({
                              ...newCompForm,
                              total_electrical_cost: val,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-2.5 py-1.5 font-mono text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                        {!canEditElec && (
                          <span className="block text-[9px] text-slate-400 truncate mt-0.5">
                            By {elecOwnerLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      {!(
                        newCompForm.water_feature
                          .toLowerCase()
                          .includes('pump room') ||
                        newCompForm.water_feature
                          .toLowerCase()
                          .includes('plant room') ||
                        newCompForm.water_feature_type
                          .toLowerCase()
                          .includes('pump room') ||
                        newCompForm.water_feature_type
                          .toLowerCase()
                          .includes('plant room')
                      ) ? (
                        <label
                          className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer select-none transition-colors ${
                            newCompForm.pump_room_included
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-white dark:bg-[#111C28] border-slate-200 dark:border-[#1E2D3D] hover:border-brand-500/50 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(newCompForm.pump_room_included)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setNewCompForm((prev) => ({
                                ...prev,
                                pump_room_included: checked,
                              }));
                              try {
                                setTenderPumpRoomIncluded(
                                  tender.id,
                                  checked,
                                  actor
                                );
                              } catch {
                                // Handled by form submit if needed
                              }
                            }}
                            className="w-4 h-4 rounded accent-brand-500 cursor-pointer"
                          />
                          <span className="text-xs font-semibold">
                            Pump Room pricing included in water feature pricing
                          </span>
                        </label>
                      ) : (
                        <div />
                      )}

                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {components.length > 0
                          ? 'Add Another Component & Save Pricing'
                          : 'Add Component & Save Pricing'}
                      </button>
                    </div>
                  </form>
                  )}
                </div>

                {/* Footer Summary */}
                <div className="p-4 border-t border-slate-200 dark:border-[#1E2D3D] flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#0B1218]/70">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                    <span className="text-slate-500">
                      Area:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatNumber(displayAreaTotal, 1)} m²
                      </strong>
                    </span>
                    <span className="text-slate-500">
                      Vol:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatNumber(displayVolumeTotal, 1)} m³
                      </strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-slate-500">
                      Civil:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatCurrency(displayCivilTotal, 'EGP')}
                      </strong>
                    </span>
                    <span className="text-slate-500">
                      Mech:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatCurrency(displayMechTotal, 'EGP')}
                      </strong>
                    </span>
                    <span className="text-slate-500">
                      Elec:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {formatCurrency(displayElecTotal, 'EGP')}
                      </strong>
                    </span>
                    <span className="text-brand-600 dark:text-brand-300 font-bold">
                      Total: {formatCurrency(displayGrandTotal, 'EGP')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                      <button
                        type="button"
                        onClick={() => flushPendingDrafts(false)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save All Pricing Changes
                      </button>
                    )}

                    {canFinishMyDiscipline && (
                      <button
                        type="button"
                        onClick={() => {
                          if (hasUnsavedChanges && !flushPendingDrafts(true)) {
                            return;
                          }
                          const latestMyOpenAsgs = getAllAssignments().filter(
                            (a) =>
                              a.tender_id === tender.id &&
                              a.user_id === user.id &&
                              a.status !== 'Finished'
                          );
                          const targets =
                            latestMyOpenAsgs.length > 0
                              ? latestMyOpenAsgs
                              : myInProgressAsgs;
                          for (const asg of targets) {
                            handleUpdateDiscipline(asg, 'Finished');
                          }
                          setCompDrafts({});
                          setExpandedSpecIds({});
                          setPricingTenderId(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Finish & Done
                      </button>
                    )}

                    {canConfirmSentFromModal && (
                      <button
                        type="button"
                        onClick={() => {
                          if (hasUnsavedChanges && !flushPendingDrafts(true)) {
                            return;
                          }
                          attemptMoveCard(pricingItem, 'Sent');
                          setCompDrafts({});
                          setExpandedSpecIds({});
                          setPricingTenderId(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Finish & Confirm Sent
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (hasUnsavedChanges && !flushPendingDrafts(false)) return;
                        setCompDrafts({});
                        setExpandedSpecIds({});
                        setPricingTenderId(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold border ${
                        hasUnsavedChanges
                          ? 'bg-brand-500/10 border-brand-500 text-brand-700 dark:text-brand-300 font-bold'
                          : 'border-slate-200 dark:border-[#1E2D3D]'
                      }`}
                    >
                      {hasUnsavedChanges ? 'Save & Done' : 'Done'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Inline Assign / Edit Engineering Team Modal */}
      {assignModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setAssignModal(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1E2D3D] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-500" />
                  <span>Assign Engineering Team — {assignModal.proposalCode}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                  {assignModal.proposalName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#182636] text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignModal} className="p-5 space-y-4">
              {engineers.length === 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                  No active engineer profiles found yet. Add Civil, Mechanical, or Electrical engineers in Admin → Users first.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Civil / Structural & Finishes Engineer
                </label>
                <select
                  value={assignModal.civilId}
                  onChange={(e) =>
                    setAssignModal((prev) =>
                      prev ? { ...prev, civilId: e.target.value } : null
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">— Unassigned —</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.full_name} ({eng.team || eng.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mechanical Pricing Engineer
                </label>
                <select
                  value={assignModal.mechId}
                  onChange={(e) =>
                    setAssignModal((prev) =>
                      prev ? { ...prev, mechId: e.target.value } : null
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">— Unassigned —</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.full_name} ({eng.team || eng.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Electrical Pricing Engineer
                </label>
                <select
                  value={assignModal.elecId}
                  onChange={(e) =>
                    setAssignModal((prev) =>
                      prev ? { ...prev, elecId: e.target.value } : null
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="">— Unassigned —</option>
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.full_name} ({eng.team || eng.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Send / Internal Target Date
                </label>
                <DatePickerInput
                  value={assignModal.dueDate}
                  onChange={(val) =>
                    setAssignModal((prev) =>
                      prev ? { ...prev, dueDate: val } : null
                    )
                  }
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-[#1E2D3D]">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1E2D3D] text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Notify Engineers</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
