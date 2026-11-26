import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Clock,
  Copy,
  DollarSign,
  Edit3,
  ExternalLink,
  FileCode2,
  FolderGit2,
  GitBranch,
  GitCompare,
  History,
  Layers,
  LayoutGrid,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Table as TableIcon,
  Trash2,
  UserPlus,
  Users,
  Waves,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { startIntelligentTender } from '@/lib/erpBridge';
import {
  addComponentDatabaseEntry,
  addDirectoryDatabaseEntry,
  addTaskComment,
  addTenderDocument,
  assignEngineersToTender,
  createTenderRevision,
  deleteComponent,
  duplicateComponent,
  fetchMarketUsdEgpRate,
  getAssignmentsByTender,
  getAuditLogs,
  getCommentsByTender,
  getComponentsByTender,
  getDocumentsByTender,
  getEffectiveDisciplineStage,
  getEngineerAssignedDate,
  getEngineerWorkloadSummary,
  getLookupLabel,
  getLookupsByCategory,
  getProfileName,
  getProfiles,
  getProposalStageForViewer,
  getTaskByTender,
  getTenderById,
  getTenderRevisions,
  isUserAssignedToTender,
  moveKanbanTask,
  subscribeDataStore,
  toKanbanBoardStage,
  updateDisciplineAssignmentStatus,
  updateTender,
  upsertComponent,
} from '@/lib/dataStore';
import {
  canAccessErpEngineering,
  canAddComment,
  canAssignEngineers,
  canCreateRevision,
  canEditComponentDisciplineCost,
  canEditComponents,
  canEditTenderField,
  canManageAdmin,
  canManageContract,
  canManageDocuments,
  canMoveKanbanCard,
  canOpenIntelligentTender,
  canViewKanbanAndTeamManagement,
  hasFullTenderAuthority,
  isAssignableEngineerOrManager,
  isEngineerMatchingDiscipline,
  isEngineerRole,
} from '@/lib/permissions';
import {
  computeComponentFields,
  formatCurrency,
  formatNumber,
  waterFeatureRequiresDepth,
} from '@/lib/formulas';
import type {
  AssignmentStatus,
  DisciplineType,
  KanbanBoardStage,
  ProposalComponent,
  Tender,
} from '@/types/database';
import { SearchableDbSelect } from '@/components/ui/SearchableDbSelect';
import {
  DatePickerInput,
  formatAuditValueCairo,
  formatDateDdMmYyyy,
  formatDateTimeCairo,
  todayCairoIso,
} from '@/components/ui/DatePickerInput';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { EngineerWorkloadAdvisor } from '@/components/ui/EngineerWorkloadAdvisor';
import { ComponentSubZonesEditor } from '@/components/ui/ComponentSubZonesEditor';

type DetailTab =
  | 'overview'
  | 'components'
  | 'pricing'
  | 'documents'
  | 'tasks'
  | 'contract'
  | 'revisions'
  | 'comments';

const PIPELINE_STEPS: {
  key: KanbanBoardStage;
  labelEn: string;
  labelAr: string;
}[] = [
  { key: 'Not Started', labelEn: 'Not Started', labelAr: 'لم تبدأ' },
  { key: 'In Progress', labelEn: 'In Progress', labelAr: 'قيد التنفيذ' },
  {
    key: 'Cancelled or Waiting',
    labelEn: 'Cancelled or Waiting',
    labelAr: 'ملغاة أو بالانتظار',
  },
  { key: 'Finished', labelEn: 'Finished', labelAr: 'مكتملة' },
  { key: 'Sent', labelEn: 'Sent', labelAr: 'تم الإرسال' },
];

const LINEAR_STAGE_ORDER: Record<KanbanBoardStage, number> = {
  'Not Started': 0,
  'In Progress': 1,
  'Cancelled or Waiting': -1,
  Finished: 2,
  Sent: 3,
};

export const TenderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, lang } = useApp();

  const [version, setVersion] = useState(0);
  const initialTab = useMemo<DetailTab>(() => {
    const requested = searchParams.get('tab') as DetailTab | null;
    const validTabs: DetailTab[] = [
      'overview',
      'components',
      'pricing',
      'documents',
      'tasks',
      'contract',
      'revisions',
      'comments',
    ];
    if (requested && validTabs.includes(requested)) {
      if (
        requested === 'tasks' &&
        user &&
        !canViewKanbanAndTeamManagement(user)
      ) {
        return 'overview';
      }
      return requested;
    }
    return 'overview';
  }, [searchParams, user]);
  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    return subscribeDataStore(() => setVersion((v) => v + 1));
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const tender = useMemo(() => (id ? getTenderById(id) : null), [id, version]);
  const revisions = useMemo(
    () => (tender ? getTenderRevisions(tender.proposal_code) : []),
    [tender, version]
  );
  const components = useMemo(
    () => (tender ? getComponentsByTender(tender.id) : []),
    [tender, version]
  );
  const documents = useMemo(
    () => (tender ? getDocumentsByTender(tender.id) : []),
    [tender, version]
  );
  const assignments = useMemo(
    () => (tender ? getAssignmentsByTender(tender.id) : []),
    [tender, version]
  );
  const task = useMemo(
    () => (tender ? getTaskByTender(tender.id) : undefined),
    [tender, version]
  );
  const comments = useMemo(
    () => (tender ? getCommentsByTender(tender.id) : []),
    [tender, version]
  );
  const isAppAdmin = user ? canManageAdmin(user.role) : false;
  const auditLogs = useMemo(() => {
    if (!tender || !isAppAdmin) return [];
    return getAuditLogs().filter(
      (a) => a.tender_id === tender.id || a.record_id === tender.id
    );
  }, [tender, isAppAdmin, version]);

  const profiles = useMemo(() => getProfiles(), [version]);
  const engineers = useMemo(
    () =>
      profiles.filter(
        (p) => p.active && isAssignableEngineerOrManager(p)
      ),
    [profiles]
  );
  const workloadSummaries = useMemo(
    () => getEngineerWorkloadSummary(),
    [version]
  );
  const workloadByEngineerId = useMemo(
    () => new Map(workloadSummaries.map((w) => [w.engineer.id, w])),
    [workloadSummaries]
  );

  const isAssigned = useMemo(
    () => (user && tender ? isUserAssignedToTender(user.id, tender.id) : false),
    [user, tender, version]
  );

  // Lookups
  const componentsDb = useMemo(
    () => getLookupsByCategory('water_feature'),
    [version]
  );
  const componentShapes = useMemo(
    () => getLookupsByCategory('component_shape'),
    [version]
  );
  const waterFeatureTypes = useMemo(
    () => getLookupsByCategory('water_feature_type'),
    [version]
  );
  const filtrationMethods = useMemo(
    () => getLookupsByCategory('filtration_method'),
    [version]
  );
  const finishingTypes = useMemo(
    () => getLookupsByCategory('finishing_type'),
    [version]
  );
  const tenderStatuses = useMemo(
    () => getLookupsByCategory('tender_status'),
    [version]
  );
  const projectStatuses = useMemo(
    () => getLookupsByCategory('project_status'),
    [version]
  );
  const contractedStatuses = useMemo(
    () => getLookupsByCategory('final_contracted_status'),
    [version]
  );
  const priorities = useMemo(
    () => getLookupsByCategory('project_priority'),
    [version]
  );
  const companiesDb = useMemo(
    () => getLookupsByCategory('company_directory'),
    [version]
  );
  const countriesDb = useMemo(
    () => getLookupsByCategory('country'),
    [version]
  );
  const governoratesDb = useMemo(
    () => getLookupsByCategory('governorate'),
    [version]
  );
  const areas = useMemo(() => getLookupsByCategory('area'), [version]);
  const districtsDb = useMemo(() => getLookupsByCategory('district'), [version]);
  const pzoneRoles = useMemo(
    () => getLookupsByCategory('pzone_role'),
    [version]
  );
  const salesReps = useMemo(
    () => getLookupsByCategory('sales_representative'),
    [version]
  );
  const scopesOfWork = useMemo(
    () => getLookupsByCategory('scope_of_work'),
    [version]
  );

  // Overview state — keyed by `tender?.id` and `tender?.updated_at` so background store
  // ticks (e.g. adding a Company/District lookup or Realtime pings) never clear unsaved edits
  const [overviewDraft, setOverviewDraft] = useState<Partial<Tender>>({});
  useEffect(() => {
    if (tender) {
      setOverviewDraft({
        proposal_name: tender.proposal_name,
        owner: tender.owner,
        contractor: tender.contractor,
        sales_representative_id: tender.sales_representative_id,
        pzone_role: tender.pzone_role,
        country: tender.country || 'Egypt',
        governorate: tender.governorate || 'Cairo',
        area: tender.area,
        district: tender.district || '',
        location: tender.location,
        server_link_path: tender.server_link_path,
        project_priority: tender.project_priority,
        received_date: tender.received_date,
        expected_send_date: tender.expected_send_date,
        deadline_date: tender.deadline_date,
        tender_status: tender.tender_status,
        tender_status_notes: tender.tender_status_notes,
        scope_of_work: tender.scope_of_work,
        contact_name: tender.contact_name,
        contact_number: tender.contact_number,
        contact_job_title: tender.contact_job_title,
        contact_email: tender.contact_email,
        contact_address: tender.contact_address,
      });
    }
  }, [tender?.id, tender?.updated_at]);

  // Component View & Modal state
  const [componentViewMode, setComponentViewMode] = useState<'cards' | 'sheet'>(
    'cards'
  );
  const [editingComp, setEditingComp] = useState<
    (Partial<ProposalComponent> & { water_feature: string; water_feature_type: string }) | null
  >(null);

  // Revision Modal
  const [revModalOpen, setRevModalOpen] = useState(false);
  const [revReason, setRevReason] = useState('');
  const [revRequestedBy, setRevRequestedBy] = useState('Client / Consultant');

  // Revision Diff Comparison & Audit Log filters
  const [revCompFilterId, setRevCompFilterId] = useState<string>('ALL');
  const [diffRevAId, setDiffRevAId] = useState<string>('');
  const [diffRevBId, setDiffRevBId] = useState<string>('');
  const [auditUserFilter, setAuditUserFilter] = useState<string>('ALL');
  const [auditFieldFilter, setAuditFieldFilter] = useState<string>('');
  useEffect(() => {
    if (revisions.length >= 2) {
      setDiffRevAId(revisions[0].id);
      setDiffRevBId(revisions[revisions.length - 1].id);
    } else if (revisions.length === 1) {
      setDiffRevAId(revisions[0].id);
      setDiffRevBId(revisions[0].id);
    }
  }, [revisions]);

  // Document form state
  const [docForm, setDocForm] = useState({
    file_name: '',
    doc_type: 'RFP',
    server_path: '',
    version: 'v1.0',
    notes: '',
  });

  // Team Assignment state
  const [isEditingTeam, setIsEditingTeam] = useState<boolean>(false);
  const [assignDraft, setAssignDraft] = useState<
    Partial<Record<DisciplineType, string>>
  >({});
  const [elecManuallyEdited, setElecManuallyEdited] = useState<boolean>(false);
  const [assignDueDate, setAssignDueDate] = useState<string>('');
  useEffect(() => {
    setIsEditingTeam(false);
  }, [id]);
  useEffect(() => {
    if (tender && !isEditingTeam) {
      const initialMech = tender.mechanical_pricing_responsible_id || '';
      const initialElec = tender.electrical_pricing_responsible_id || initialMech;
      setAssignDraft({
        'Civil/Arch': tender.responsible_civil_engineer_id || '',
        'Mechanical Pricing': initialMech,
        'Electrical Pricing': initialElec,
      });
      setElecManuallyEdited(
        Boolean(
          tender.electrical_pricing_responsible_id &&
            tender.electrical_pricing_responsible_id !==
              tender.mechanical_pricing_responsible_id
        )
      );
      setAssignDueDate(tender.expected_send_date || '');
    }
  }, [tender?.id, tender?.updated_at, isEditingTeam]);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [commentAttachment, setCommentAttachment] = useState('');
  const [commentMentions, setCommentMentions] = useState<string[]>([]);

  if (!tender || !user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Tender not found.</p>
        <Link
          to="/tenders"
          className="mt-4 inline-flex items-center gap-2 text-brand-500 hover:underline font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tenders
        </Link>
      </div>
    );
  }

  const actor = { id: user.id, full_name: user.full_name, role: user.role };
  const effectiveTask = task || {
    id: `virtual-${tender.id}`,
    tender_id: tender.id,
    title: `${tender.proposal_code} — ${tender.proposal_name}`,
    kanban_status: 'New' as const,
    blocked_reason: null,
    due_date: tender.expected_send_date ?? null,
    progress_note: tender.tender_status_notes || null,
    completed_at: tender.actual_sent_date ?? null,
    created_by: tender.created_by ?? null,
    created_at: tender.created_at,
    updated_by: tender.updated_by ?? null,
    updated_at: tender.updated_at,
  };
  const currentKanbanStage = getProposalStageForViewer({
    task: effectiveTask,
    tender,
    assignments,
    components,
    perspectiveUserId:
      isAssignableEngineerOrManager(user) && !hasFullTenderAuthority(user)
        ? user.id
        : null,
  });
  const allAssignedFinished =
    assignments.length > 0 &&
    assignments.every(
      (a) =>
        getEffectiveDisciplineStage(a, components, tender) === 'Finished'
    );
  const canEditComp = canEditComponents(user, isAssigned);
  const canEditCivilComp = canEditComponentDisciplineCost(
    user,
    user.id,
    'Civil/Arch',
    assignments
  );
  const canEditMechComp = canEditComponentDisciplineCost(
    user,
    user.id,
    'Mechanical Pricing',
    assignments
  );
  const canEditElecComp = canEditComponentDisciplineCost(
    user,
    user.id,
    'Electrical Pricing',
    assignments
  );
  const canSeeTeam = canViewKanbanAndTeamManagement(user);

  const handleCopyPath = (pathStr: string) => {
    navigator.clipboard?.writeText(pathStr);
    showToast('success', `Copied path to clipboard: ${pathStr}`);
  };

  const handleSaveOverview = () => {
    try {
      const allowedPatch: Partial<Tender> = {};
      for (const k of Object.keys(overviewDraft) as (keyof Tender)[]) {
        if (
          overviewDraft[k] !== tender[k] &&
          canEditTenderField(user.role, k, isAssigned)
        ) {
          (allowedPatch as Record<string, unknown>)[k] = overviewDraft[k];
        }
      }
      updateTender(tender.id, allowedPatch, actor);
      showToast('success', 'Tender overview saved and logged to audit trail.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleCreateRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revReason.trim()) return;
    try {
      const created = createTenderRevision(
        tender.id,
        revReason,
        revRequestedBy,
        actor
      );
      setRevModalOpen(false);
      setRevReason('');
      showToast(
        'success',
        `Created ${created.proposal_code} Rev ${created.proposal_rev} with all components copied.`
      );
      navigate(`/tenders/${created.id}`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error');
    }
  };

  const openNewComponentModal = () => {
    setEditingComp({
      component_title: '',
      water_feature: componentsDb[0]?.label_en || 'Swimming Pool',
      component_shape: componentShapes[0]?.label_en || 'Rectangle',
      proposal_type: 'Full Turnkey (Civil + MEP)',
      water_feature_type: waterFeatureTypes[0]?.label_en || 'Skimmer',
      filtration_method: filtrationMethods[0]?.label_en || 'Sand Filter',
      finishing_type: finishingTypes[0]?.label_en || 'Mosaic',
      pump_room_included: Boolean(tender.pump_room_included_in_water_features),
      qty_same_specs: 1,
      each_length_m: 15,
      each_width_m: 8,
      each_perimeter_m: 46,
      sub_zones: null,
      each_area_m2: 120,
      each_avg_depth_m: 1.4,
      volume_is_manual: false,
      each_volume_m3: 168,
      total_maintenance_cost: 0,
      total_supply_cost: 0,
      total_design_cost: 0,
      total_civil_cost: 0,
      total_mechanical_cost: 0,
      total_electrical_cost: 0,
      est_price_per_m2_full_scope: null,
      est_price_per_m2_civil: null,
      est_price_per_m2_mep: null,
    });
  };

  const handleSaveComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComp || !editingComp.water_feature.trim()) return;
    try {
      const payload: Partial<ProposalComponent> & {
        id?: string;
        water_feature?: string;
        water_feature_type?: string;
      } = { ...editingComp };
      if (editingComp.id) {
        if (!canEditCivilComp) delete payload.total_civil_cost;
        if (!canEditMechComp) delete payload.total_mechanical_cost;
        if (!canEditElecComp) delete payload.total_electrical_cost;
      } else {
        if (!canEditCivilComp) payload.total_civil_cost = 0;
        if (!canEditMechComp) payload.total_mechanical_cost = 0;
        if (!canEditElecComp) payload.total_electrical_cost = 0;
      }
      upsertComponent(tender.id, payload, actor);
      setEditingComp(null);
      showToast(
        'success',
        'Proposal component saved and parent tender totals synchronized.'
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error');
    }
  };

  const handleFetchSentRate = async () => {
    const targetDate = tender.actual_sent_date || todayCairoIso();
    try {
      const res = await fetchMarketUsdEgpRate(targetDate, actor);
      updateTender(
        tender.id,
        {
          actual_sent_date: targetDate,
          exchange_rate_on_sent_date: res.rate,
          sent_rate_date_used: res.dateUsed,
          sent_rate_source: res.source,
          sent_rate_is_manual: false,
        },
        actor
      );
      showToast(
        'success',
        `USD/EGP Rate ${res.rate} applied (${res.dateUsed} via ${res.source}).`
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'FX lookup failed');
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { isDuplicatePath } = addTenderDocument(tender.id, docForm, actor);
      setDocForm({
        file_name: '',
        doc_type: 'RFP',
        server_path: '',
        version: 'v1.0',
        notes: '',
      });
      showToast(
        'success',
        isDuplicatePath
          ? 'Document path linked (Warning: duplicate path detected on this tender).'
          : 'Server document path linked and team notified.'
      );
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error');
    }
  };

  const handleAssignTeam = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      assignEngineersToTender(
        tender.id,
        assignDraft,
        assignDueDate || null,
        actor
      );
      setIsEditingTeam(false);
      showToast('success', 'Engineers assigned and notifications sent.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error');
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      addTaskComment(
        tender.id,
        commentText,
        commentAttachment || null,
        commentMentions,
        actor
      );
      setCommentText('');
      setCommentAttachment('');
      setCommentMentions([]);
      showToast('success', 'Comment posted.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-700'
              : 'bg-rose-950/95 text-rose-200 border-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Awarded Celebration Banner */}
      {(tender.project_status === 'Awarded' || showCelebration) && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-900 via-teal-900 to-brand-900 border border-emerald-500/40 px-5 py-3.5 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Awarded Contract —{' '}
                {tender.pr_code || tender.proposal_code}
              </div>
              <div className="text-sm font-semibold">
                Final Contract Value:{' '}
                <span className="font-mono text-emerald-200">
                  {formatCurrency(
                    tender.final_pr_contract_total_price ||
                      tender.tender_total_price,
                    'EGP'
                  )}
                </span>{' '}
                (
                <span className="font-mono text-teal-200">
                  {formatCurrency(
                    tender.pr_contract_total_price_usd ||
                      tender.tender_total_price_usd,
                    'USD'
                  )}
                </span>
                )
              </div>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 font-mono">
            {tender.final_contracted_status}
          </span>
        </div>
      )}

      {/* Top Tender Header Card */}
      <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/tenders"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-500 mr-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Tenders
              </Link>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/30">
                {tender.proposal_code}
              </span>

              {/* Revision Dropdown Switcher */}
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-[#0B1218] px-2.5 py-1 border border-slate-200 dark:border-[#1E2D3D]">
                <GitBranch className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <select
                  aria-label="Select Proposal Revision"
                  value={tender.id}
                  onChange={(e) =>
                    navigate(`/tenders/${e.target.value}?tab=${activeTab}`)
                  }
                  className="bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer pr-1"
                >
                  {revisions.map((r) => (
                    <option
                      key={r.id}
                      value={r.id}
                      className="bg-white dark:bg-[#111C28] text-slate-900 dark:text-white"
                    >
                      Rev {String(r.proposal_rev).padStart(2, '0')}
                      {r.is_latest_revision ? ' (Latest)' : ' (Historical)'}
                    </option>
                  ))}
                </select>
              </div>

              {tender.is_latest_revision ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Latest Revision
                </span>
              ) : (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Historical Revision
                </span>
              )}

              {revisions.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('revisions')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pzone-magenta/15 text-pzone-magenta border border-pzone-magenta/30 hover:bg-pzone-magenta/25 transition-colors"
                  title="View all revisions and revision details"
                >
                  <History className="w-3 h-3" />
                  {revisions.length} Revisions
                </button>
              )}

              {canAssignEngineers(user) && (
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Assign Team
                </button>
              )}

              {canCreateRevision(user.role) && (
                <button
                  onClick={() => setRevModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-500/30 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5" /> New Revision (Rev + 1)
                </button>
              )}

              {canOpenIntelligentTender(user) && (
                <button
                  type="button"
                  onClick={async () => {
                    const route = await startIntelligentTender(tender, user);
                    navigate(route);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-pzone-teal to-pzone-seagreen hover:opacity-95 text-white shadow-sm border border-white/20 transition-all cursor-pointer"
                  title={
                    canAccessErpEngineering(user)
                      ? 'Launch Intelligent Tendering ERP (Water Features, Pump Rooms, Civil & MEP)'
                      : 'Open Commercial Overheads & Bid Price Configurator'
                  }
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {canAccessErpEngineering(user)
                      ? 'Start Intelligent Tender (ERP)'
                      : 'Decide Commercial Overheads'}
                  </span>
                </button>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {tender.proposal_name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
              <span>
                Owner: <strong className="text-slate-700 dark:text-slate-200">{tender.owner}</strong>
              </span>
              <span>•</span>
              <span>
                Contractor:{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {tender.contractor || 'Direct'}
                </strong>
              </span>
              <span>•</span>
              <span>
                Region:{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {[tender.country || 'Egypt', tender.governorate, tender.area]
                    .filter(Boolean)
                    .join(' › ')}
                </strong>
              </span>
              {tender.district && (
                <>
                  <span>•</span>
                  <span>
                    District:{' '}
                    <strong className="text-brand-600 dark:text-brand-300">
                      {tender.district}
                    </strong>
                  </span>
                </>
              )}
              <span>•</span>
              <span>
                Area / Vol:{' '}
                <strong className="font-mono text-brand-600 dark:text-brand-300">
                  {formatNumber(tender.total_components_area_m2)} m² /{' '}
                  {formatNumber(tender.total_components_volume_m3)} m³
                </strong>
              </span>
            </p>
          </div>

          {/* Right Financial Box */}
          <div className="rounded-xl bg-slate-50 dark:bg-[#0B1218] border border-slate-200 dark:border-[#1E2D3D] px-4 py-3 text-right min-w-[250px]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Proposal Total Price
            </div>
            <div className="font-mono text-lg font-bold text-slate-900 dark:text-white">
              {formatCurrency(tender.tender_total_price, 'EGP')}
            </div>
            <div className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-300 flex items-center justify-end gap-1.5">
              <span>{formatCurrency(tender.tender_total_price_usd, 'USD')}</span>
              {tender.exchange_rate_on_sent_date && (
                <span className="text-[10px] text-slate-400">
                  (@ {tender.exchange_rate_on_sent_date.toFixed(2)} EGP)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Glowing Status Pipeline Bar */}
        {canSeeTeam && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {PIPELINE_STEPS.map((step) => {
              const current = step.key === currentKanbanStage;
              const isExceptionStep = step.key === 'Cancelled or Waiting';
              const done =
                !isExceptionStep &&
                currentKanbanStage !== 'Cancelled or Waiting' &&
                LINEAR_STAGE_ORDER[step.key] <=
                  LINEAR_STAGE_ORDER[currentKanbanStage];
              const isCancelled = tender.tender_status
                .toLowerCase()
                .includes('cancel');
              return (
                <div
                  key={step.key}
                  className={`rounded-lg px-3 py-2 border text-xs font-semibold flex items-center justify-between transition-all ${
                    current && isExceptionStep
                      ? isCancelled
                        ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-300 shadow-sm'
                        : 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-300 shadow-sm'
                      : current
                        ? 'bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-300 shadow-sm'
                        : done
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-[#0B1218]/60 border-slate-200 dark:border-[#1E2D3D] text-slate-400'
                  }`}
                >
                  <span>{lang === 'ar' ? step.labelAr : step.labelEn}</span>
                  {(done || current) && <Check className="w-3.5 h-3.5 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Engineer Discipline Quick-Check Bar */}
        {canSeeTeam && assignments.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl bg-slate-50 dark:bg-[#0B1218]/80 border border-slate-200 dark:border-[#1E2D3D] px-3.5 py-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-500" /> Discipline Sign-Off:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {assignments.map((a) => {
                const canToggle =
                  hasFullTenderAuthority(user) || a.user_id === user.id;
                const effStage = getEffectiveDisciplineStage(
                  a,
                  components,
                  tender
                );
                const isDone = effStage === 'Finished';
                const isInProgress = effStage === 'In Progress';
                return (
                  <div
                    key={a.id}
                    className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${
                      isDone
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'bg-white dark:bg-[#111C28] border-slate-200 dark:border-[#1E2D3D] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="font-semibold">{a.discipline}:</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {getProfileName(a.user_id)}
                    </span>
                    <span className="text-[10px] font-mono text-brand-500">
                      ({formatDateDdMmYyyy(a.assigned_at || a.created_at)})
                    </span>
                    {isDone ? (
                      canToggle ? (
                        <button
                          type="button"
                          onClick={() => {
                            updateDisciplineAssignmentStatus(
                              a.id,
                              'In Progress',
                              '',
                              actor
                            );
                            showToast(
                              'success',
                              `${a.discipline} marked as In Progress.`
                            );
                          }}
                          className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
                        >
                          ✓ Finished
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                          ✓ Finished
                        </span>
                      )
                    ) : isInProgress ? (
                      <>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-600 dark:text-brand-300">
                          In Progress
                        </span>
                        {canToggle && (
                          <button
                            type="button"
                            onClick={() => {
                              updateDisciplineAssignmentStatus(
                                a.id,
                                'Finished',
                                `${a.discipline} completed by ${user.full_name}`,
                                actor
                              );
                              showToast(
                                'success',
                                `${a.discipline} marked as Finished.`
                              );
                            }}
                            className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            Finish
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          Not Started
                        </span>
                        {canToggle && (
                          <button
                            type="button"
                            onClick={() => {
                              updateDisciplineAssignmentStatus(
                                a.id,
                                'In Progress',
                                `Started by ${user.full_name}`,
                                actor
                              );
                              showToast(
                                'success',
                                `${a.discipline} marked as In Progress.`
                              );
                            }}
                            className="px-2 py-0.5 rounded font-bold text-[11px] bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30 hover:bg-brand-500 hover:text-white transition-all"
                          >
                            Start
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {allAssignedFinished &&
                currentKanbanStage !== 'Sent' &&
                currentKanbanStage !== 'Cancelled or Waiting' &&
                task &&
                canMoveKanbanCard(
                  user,
                  'Finished',
                  'Sent',
                  isAssigned
                ) && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        moveKanbanTask(task.id, 'Sent', {}, actor);
                        showToast(
                          'success',
                          `Confirmed ${tender.proposal_code} as Sent.`
                        );
                      } catch (err) {
                        showToast(
                          'error',
                          err instanceof Error ? err.message : 'Move failed'
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Finish & Confirm Sent
                  </button>
                )}
            </div>
          </div>
        )}

        {/* 8 Section Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-200 dark:border-[#1E2D3D] pt-3">
          {[
            { id: 'overview', label: 'Overview', icon: FileCode2 },
            {
              id: 'components',
              label: `Components (${components.length})`,
              icon: Waves,
            },
            { id: 'pricing', label: 'Pricing & FX', icon: DollarSign },
            {
              id: 'documents',
              label: `Documents (${documents.length})`,
              icon: FolderGit2,
            },
            ...(canSeeTeam
              ? [
                  {
                    id: 'tasks',
                    label: `Tasks & Team (${assignments.length})`,
                    icon: Users,
                  },
                ]
              : []),
            { id: 'contract', label: 'Contract Result', icon: Award },
            {
              id: 'revisions',
              label: `Revisions & History (${revisions.length})`,
              icon: History,
            },
            {
              id: 'comments',
              label: `Comments (${comments.length})`,
              icon: MessageSquare,
            },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as DetailTab)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182636]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Identity, Client & Schedule
              </h2>
              {user.role !== 'viewer' && (
                <button
                  onClick={handleSaveOverview}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Proposal Name
                </label>
                <input
                  type="text"
                  disabled={!canEditTenderField(user.role, 'proposal_name', isAssigned)}
                  value={overviewDraft.proposal_name || ''}
                  onChange={(e) =>
                    setOverviewDraft({ ...overviewDraft, proposal_name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Owner / Developer
                </label>
                <SearchableDbSelect
                  disabled={!canEditTenderField(user.role, 'owner', isAssigned)}
                  value={overviewDraft.owner || ''}
                  onChange={(nextVal) =>
                    setOverviewDraft({ ...overviewDraft, owner: nextVal })
                  }
                  options={companiesDb.map((o) => ({
                    id: o.id,
                    value: o.label_en,
                    label: o.label_en,
                  }))}
                  placeholder="Select Owner / Developer..."
                  addButtonLabel="Add Company, Owner"
                  onAddNew={
                    canEditTenderField(user.role, 'owner', isAssigned)
                      ? (newName) => {
                          const added = addDirectoryDatabaseEntry(
                            {
                              category: 'company_directory',
                              label_en: newName,
                            },
                            actor
                          );
                          setOverviewDraft({
                            ...overviewDraft,
                            owner: added.label_en,
                          });
                        }
                      : undefined
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Main Contractor
                </label>
                <SearchableDbSelect
                  disabled={!canEditTenderField(user.role, 'contractor', isAssigned)}
                  value={overviewDraft.contractor || ''}
                  onChange={(nextVal) =>
                    setOverviewDraft({ ...overviewDraft, contractor: nextVal })
                  }
                  options={companiesDb.map((c) => ({
                    id: c.id,
                    value: c.label_en,
                    label: c.label_en,
                  }))}
                  placeholder="Select Main Contractor..."
                  addButtonLabel="Add Company, Owner"
                  onAddNew={
                    canEditTenderField(user.role, 'contractor', isAssigned)
                      ? (newName) => {
                          const added = addDirectoryDatabaseEntry(
                            {
                              category: 'company_directory',
                              label_en: newName,
                            },
                            actor
                          );
                          setOverviewDraft({
                            ...overviewDraft,
                            contractor: added.label_en,
                          });
                        }
                      : undefined
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Sales Representative
                </label>
                <SearchableDbSelect
                  disabled={
                    !canEditTenderField(user.role, 'sales_representative_id', isAssigned)
                  }
                  value={overviewDraft.sales_representative_id || ''}
                  onChange={(nextVal) =>
                    setOverviewDraft({
                      ...overviewDraft,
                      sales_representative_id: nextVal,
                    })
                  }
                  options={salesReps.map((sr) => ({
                    id: sr.id,
                    value: sr.id,
                    label: sr.label_en,
                  }))}
                  placeholder="Select or add Sales Representative..."
                  addButtonLabel="Add Sales Representative"
                  onAddNew={
                    canEditTenderField(user.role, 'sales_representative_id', isAssigned)
                      ? (newName) => {
                          const added = addDirectoryDatabaseEntry(
                            {
                              category: 'sales_representative',
                              label_en: newName,
                            },
                            actor
                          );
                          setOverviewDraft({
                            ...overviewDraft,
                            sales_representative_id: added.id,
                          });
                        }
                      : undefined
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  P.ZONE Role
                </label>
                <select
                  disabled={!canEditTenderField(user.role, 'pzone_role', isAssigned)}
                  value={overviewDraft.pzone_role || ''}
                  onChange={(e) =>
                    setOverviewDraft({ ...overviewDraft, pzone_role: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm disabled:opacity-60"
                >
                  {pzoneRoles.map((r) => (
                    <option key={r.id} value={r.label_en}>
                      {r.label_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Country
                </label>
                <SearchableDbSelect
                  disabled={!canEditTenderField(user.role, 'country', isAssigned)}
                  value={overviewDraft.country || 'Egypt'}
                  onChange={(nextVal) =>
                    setOverviewDraft({ ...overviewDraft, country: nextVal })
                  }
                  options={countriesDb.map((c) => ({
                    id: c.id,
                    value: c.label_en,
                    label: c.label_en,
                  }))}
                  placeholder="Select Country..."
                  addButtonLabel="Add Country"
                  onAddNew={
                    canEditTenderField(user.role, 'country', isAssigned)
                      ? (newName) => {
                          const added = addDirectoryDatabaseEntry(
                            {
                              category: 'country',
                              label_en: newName,
                            },
                            actor
                          );
                          setOverviewDraft({
                            ...overviewDraft,
                            country: added.label_en,
                          });
                        }
                      : undefined
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Governorate
                </label>
                <SearchableDbSelect
                  disabled={!canEditTenderField(user.role, 'governorate', isAssigned)}
                  value={overviewDraft.governorate || 'Cairo'}
                  onChange={(nextVal) =>
                    setOverviewDraft({
                      ...overviewDraft,
                      governorate: nextVal,
                    })
                  }
                  options={governoratesDb
                    .filter(
                      (g) =>
                        !g.metadata?.country ||
                        g.metadata.country === (overviewDraft.country || 'Egypt')
                    )
                    .map((g) => ({
                      id: g.id,
                      value: g.label_en,
                      label: g.label_en,
                    }))}
                  placeholder="Select Governorate..."
                  addButtonLabel={`Add Governorate (${overviewDraft.country || 'Egypt'})`}
                  onAddNew={
                    canEditTenderField(user.role, 'governorate', isAssigned)
                      ? (newName) => {
                          const added = addDirectoryDatabaseEntry(
                            {
                              category: 'governorate',
                              label_en: newName,
                              metadata: {
                                country: overviewDraft.country || 'Egypt',
                              },
                            },
                            actor
                          );
                          setOverviewDraft({
                            ...overviewDraft,
                            governorate: added.label_en,
                          });
                        }
                      : undefined
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Geographic Area
                </label>
                <SearchableDbSelect
                  disabled={!canEditTenderField(user.role, 'area', isAssigned)}
                  value={overviewDraft.area || ''}
                  onChange={(nextVal) =>
                    setOverviewDraft({ ...overviewDraft, area: nextVal })
                  }
                  options={areas
                    .filter(
                      (a) =>
                        !a.metadata?.governorate ||
                        a.metadata.governorate === overviewDraft.governorate ||
                        !areas.some(
                          (item) =>
                            item.metadata?.governorate ===
                            overviewDraft.governorate
                        )
                    )
                    .map((a) => ({
                      id: a.id,
                      value: a.label_en,
                      label: a.label_en,
                    }))}
                  placeholder="Select Geographic Area..."
                  addButtonLabel={`Add Geographic Area (${overviewDraft.governorate || 'Cairo'})`}
                  onAddNew={
                    canEditTenderField(user.role, 'area', isAssigned)
                      ? (newName) => {
                          const added = addDirectoryDatabaseEntry(
                            {
                              category: 'area',
                              label_en: newName,
                              metadata: {
                                country: overviewDraft.country || 'Egypt',
                                governorate: overviewDraft.governorate || 'Cairo',
                              },
                            },
                            actor
                          );
                          setOverviewDraft({
                            ...overviewDraft,
                            area: added.label_en,
                          });
                        }
                      : undefined
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  District (Compound Name / Building Name)
                </label>
                <SearchableDbSelect
                  disabled={!canEditTenderField(user.role, 'district', isAssigned)}
                  value={overviewDraft.district || ''}
                  onChange={(nextVal) =>
                    setOverviewDraft({ ...overviewDraft, district: nextVal })
                  }
                  options={districtsDb.map((d) => ({
                    id: d.id,
                    value: d.label_en,
                    label: d.label_en,
                  }))}
                  placeholder="Select or add Compound / Building Name..."
                  addButtonLabel="Add District / Compound"
                  onAddNew={
                    canEditTenderField(user.role, 'district', isAssigned)
                      ? (newName) => {
                          const added = addDirectoryDatabaseEntry(
                            {
                              category: 'district',
                              label_en: newName,
                            },
                            actor
                          );
                          setOverviewDraft({
                            ...overviewDraft,
                            district: added.label_en,
                          });
                        }
                      : undefined
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Received Date
                </label>
                <DatePickerInput
                  disabled={!canEditTenderField(user.role, 'received_date', isAssigned)}
                  value={overviewDraft.received_date || ''}
                  onChange={(iso) =>
                    setOverviewDraft({ ...overviewDraft, received_date: iso })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Expected Send Date (Tender Manager)
                </label>
                <DatePickerInput
                  disabled={
                    !canEditTenderField(user.role, 'expected_send_date', isAssigned)
                  }
                  value={overviewDraft.expected_send_date || ''}
                  onChange={(iso) =>
                    setOverviewDraft({
                      ...overviewDraft,
                      expected_send_date: iso || null,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Deadline
                </label>
                <DatePickerInput
                  disabled={
                    !canEditTenderField(user.role, 'deadline_date', isAssigned)
                  }
                  value={overviewDraft.deadline_date || ''}
                  onChange={(iso) =>
                    setOverviewDraft({
                      ...overviewDraft,
                      deadline_date: iso || null,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  disabled={
                    !canEditTenderField(user.role, 'project_priority', isAssigned)
                  }
                  value={overviewDraft.project_priority || ''}
                  onChange={(e) =>
                    setOverviewDraft({
                      ...overviewDraft,
                      project_priority: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm disabled:opacity-60"
                >
                  {priorities.map((p) => (
                    <option key={p.id} value={p.label_en}>
                      {p.label_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Tender Status
                </label>
                <select
                  disabled={!canEditTenderField(user.role, 'tender_status', isAssigned)}
                  value={overviewDraft.tender_status || ''}
                  onChange={(e) =>
                    setOverviewDraft({ ...overviewDraft, tender_status: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm disabled:opacity-60"
                >
                  {tenderStatuses.map((s) => (
                    <option key={s.id} value={s.label_en}>
                      {s.label_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Location / Google Maps URL
                </label>
                <input
                  type="text"
                  disabled={!canEditTenderField(user.role, 'location', isAssigned)}
                  value={overviewDraft.location || ''}
                  onChange={(e) =>
                    setOverviewDraft({ ...overviewDraft, location: e.target.value })
                  }
                  placeholder="https://maps.google.com/..."
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Server Folder Path (UNC)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    disabled={
                      !canEditTenderField(user.role, 'server_link_path', isAssigned)
                    }
                    value={overviewDraft.server_link_path || ''}
                    onChange={(e) =>
                      setOverviewDraft({
                        ...overviewDraft,
                        server_link_path: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono disabled:opacity-60"
                  />
                  {overviewDraft.server_link_path && (
                    <button
                      type="button"
                      onClick={() => handleCopyPath(overviewDraft.server_link_path!)}
                      title="Copy UNC Path"
                      className="p-2 rounded-lg border border-slate-200 dark:border-[#1E2D3D] hover:bg-slate-100 dark:hover:bg-[#182636] text-slate-500 shrink-0"
                    >
                      <ClipboardCopy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scope of Work Checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Scope of Work
              </label>
              <div className="flex flex-wrap gap-2">
                {scopesOfWork.map((sc) => {
                  const selected = (overviewDraft.scope_of_work || []).includes(
                    sc.label_en
                  );
                  return (
                    <button
                      type="button"
                      key={sc.id}
                      disabled={
                        !canEditTenderField(user.role, 'scope_of_work', isAssigned)
                      }
                      onClick={() => {
                        const cur = overviewDraft.scope_of_work || [];
                        const next = selected
                          ? cur.filter((x) => x !== sc.label_en)
                          : [...cur, sc.label_en];
                        setOverviewDraft({ ...overviewDraft, scope_of_work: next });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                        selected
                          ? 'bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-300'
                          : 'bg-slate-50 dark:bg-[#0B1218] border-slate-200 dark:border-[#1E2D3D] text-slate-500'
                      }`}
                    >
                      {sc.label_en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Status / Engineering Notes
              </label>
              <textarea
                rows={3}
                disabled={
                  !canEditTenderField(user.role, 'tender_status_notes', isAssigned)
                }
                value={overviewDraft.tender_status_notes || ''}
                onChange={(e) =>
                  setOverviewDraft({
                    ...overviewDraft,
                    tender_status_notes: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm disabled:opacity-60"
              />
            </div>
          </div>

          {/* Client Contact & Auto-Summary Card */}
          <div className="space-y-6">
            <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Client Contact Info
              </h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block">Contact Name</span>
                  <input
                    type="text"
                    disabled={!canEditTenderField(user.role, 'contact_name', isAssigned)}
                    value={overviewDraft.contact_name || ''}
                    onChange={(e) =>
                      setOverviewDraft({ ...overviewDraft, contact_name: e.target.value })
                    }
                    className="w-full mt-0.5 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block">Job Title</span>
                  <input
                    type="text"
                    disabled={
                      !canEditTenderField(user.role, 'contact_job_title', isAssigned)
                    }
                    value={overviewDraft.contact_job_title || ''}
                    onChange={(e) =>
                      setOverviewDraft({
                        ...overviewDraft,
                        contact_job_title: e.target.value,
                      })
                    }
                    className="w-full mt-0.5 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Number</span>
                  <input
                    type="text"
                    disabled={
                      !canEditTenderField(user.role, 'contact_number', isAssigned)
                    }
                    value={overviewDraft.contact_number || ''}
                    onChange={(e) =>
                      setOverviewDraft({
                        ...overviewDraft,
                        contact_number: e.target.value,
                      })
                    }
                    className="w-full mt-0.5 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 text-xs font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block">Email</span>
                  <input
                    type="email"
                    disabled={
                      !canEditTenderField(user.role, 'contact_email', isAssigned)
                    }
                    value={overviewDraft.contact_email || ''}
                    onChange={(e) =>
                      setOverviewDraft({
                        ...overviewDraft,
                        contact_email: e.target.value,
                      })
                    }
                    className="w-full mt-0.5 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 text-xs font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Computed Schedule & Scope
              </h3>
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-[#1E2D3D]">
                <span className="text-slate-400">Delayed Days</span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded ${
                    tender.delayed_days > 0
                      ? 'bg-rose-500/15 text-rose-500'
                      : 'bg-emerald-500/15 text-emerald-500'
                  }`}
                >
                  {tender.delayed_days} days
                </span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block mb-1">
                  Auto-Synchronized Components Summary
                </span>
                <p className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0B1218] font-mono text-xs text-slate-700 dark:text-slate-300">
                  {tender.components_summary || 'No components added yet.'}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-[#1E2D3D] space-y-1 text-[11px] font-mono text-slate-500">
                <div className="flex items-center justify-between gap-2">
                  <span>Created (Cairo):</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    {formatDateTimeCairo(tender.created_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Last Updated (Cairo):</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    {formatDateTimeCairo(tender.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROPOSAL COMPONENTS (Phase 3 — 29 Columns + Cards) */}
      {activeTab === 'components' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] rounded-xl p-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Waves className="w-4 h-4 text-brand-500" />
                Water Features & Proposal Components — Rev {tender.proposal_rev} ({components.length})
              </h2>
              <p className="text-xs text-slate-500">
                Changes automatically recalculate parent tender Area, Volume, Discipline
                Costs, and Total EGP/USD Prices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canOpenIntelligentTender(user) && (
                <button
                  type="button"
                  onClick={async () => {
                    const route = await startIntelligentTender(
                      tender,
                      user,
                      canAccessErpEngineering(user.role) ? 'water-features' : 'commercial-bid'
                    );
                    navigate(route);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-pzone-teal to-pzone-seagreen hover:opacity-95 text-white shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {canAccessErpEngineering(user.role)
                      ? 'Open in Intelligent Tendering ERP'
                      : 'Open Commercial Overheads'}
                  </span>
                </button>
              )}

              {revisions.length > 1 && (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-[#0B1218] px-2.5 py-1.5 border border-slate-200 dark:border-[#1E2D3D]">
                  <GitBranch className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  <select
                    aria-label="Filter Components by Revision"
                    value={tender.id}
                    onChange={(e) =>
                      navigate(`/tenders/${e.target.value}?tab=components`)
                    }
                    className="bg-transparent text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                  >
                    {revisions.map((r) => {
                      const revCompCount = getComponentsByTender(r.id).length;
                      return (
                        <option
                          key={r.id}
                          value={r.id}
                          className="bg-white dark:bg-[#111C28] text-slate-900 dark:text-white"
                        >
                          Rev {String(r.proposal_rev).padStart(2, '0')}
                          {r.is_latest_revision ? ' (Latest)' : ''} — {revCompCount} component{revCompCount === 1 ? '' : 's'}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div className="inline-flex rounded-lg bg-slate-100 dark:bg-[#0B1218] p-1 border border-slate-200 dark:border-[#1E2D3D]">
                <button
                  onClick={() => setComponentViewMode('cards')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    componentViewMode === 'cards'
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Cards
                </button>
                <button
                  onClick={() => setComponentViewMode('sheet')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${
                    componentViewMode === 'sheet'
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-500'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" /> 29-Column Sheet
                </button>
              </div>

              {canEditComp && (
                <button
                  onClick={openNewComponentModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Component
                </button>
              )}
            </div>
          </div>

          {componentViewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {components.map((comp) => {
                const reqDepth = waterFeatureRequiresDepth(
                  comp.water_feature_type,
                  [...componentsDb, ...waterFeatureTypes],
                  comp.water_feature
                );
                return (
                  <div
                    key={comp.id}
                    className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {comp.water_feature_type && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20">
                              {comp.water_feature_type}
                            </span>
                          )}
                          {comp.component_shape && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20">
                              {comp.component_shape}
                            </span>
                          )}
                          {comp.sub_zones && comp.sub_zones.length > 0 && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">
                              {comp.sub_zones.length} Pieces / Zones
                            </span>
                          )}
                          {comp.pump_room_included && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <Check className="w-3 h-3" />
                              Pump Room pricing included in water feature pricing
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                          {comp.component_title?.trim() || comp.water_feature}
                        </h3>
                        {(() => {
                          const subParts = [
                            comp.component_title?.trim() ? comp.water_feature : null,
                            comp.filtration_method,
                            comp.finishing_type,
                          ].filter(Boolean);
                          return subParts.length > 0 ? (
                            <p className="text-xs text-slate-500">
                              {subParts.join(' • ')}
                            </p>
                          ) : null;
                        })()}
                        {comp.created_by && (
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Added by{' '}
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {getProfileName(comp.created_by, lang)}
                            </span>
                          </p>
                        )}
                      </div>

                      {canEditComp && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingComp({ ...comp })}
                            title="Enter Discipline Price / Edit Component"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-[11px] font-bold"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Price / Edit
                          </button>
                          <button
                            onClick={() => {
                              duplicateComponent(comp.id, actor);
                              showToast('success', 'Component duplicated.');
                            }}
                            title="Duplicate Component"
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#182636] text-slate-500"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const label = comp.component_title?.trim()
                                ? `${comp.component_title} (${comp.water_feature})`
                                : comp.water_feature;
                              if (
                                window.confirm(
                                  `Remove component "${label}"? Parent tender totals will recalculate automatically.`
                                )
                              ) {
                                deleteComponent(comp.id, actor);
                                showToast('success', 'Component removed.');
                              }
                            }}
                            title="Delete Component"
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dimensions Chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-lg bg-slate-50 dark:bg-[#0B1218] p-3 border border-slate-200/70 dark:border-[#1E2D3D]">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Qty
                        </span>
                        <span className="font-mono text-xs font-bold">
                          {comp.qty_same_specs}x
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Total Area
                        </span>
                        <span className="font-mono text-xs font-bold">
                          {formatNumber(comp.total_area_m2)} m²
                        </span>
                        {comp.each_length_m && comp.each_width_m ? (
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {comp.each_length_m}×{comp.each_width_m} m
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Perimeter
                        </span>
                        <span className="font-mono text-xs font-bold">
                          {comp.total_perimeter_m
                            ? `${formatNumber(comp.total_perimeter_m)} m`
                            : comp.each_perimeter_m
                              ? `${formatNumber(comp.each_perimeter_m * comp.qty_same_specs)} m`
                              : '0 m'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Avg Depth
                        </span>
                        <span className="font-mono text-xs font-bold">
                          {reqDepth && comp.each_avg_depth_m !== null
                            ? `${comp.each_avg_depth_m} m`
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block">
                          Total Volume
                        </span>
                        <span className="font-mono text-xs font-bold">
                          {formatNumber(comp.total_volume_m3)} m³
                        </span>
                      </div>
                    </div>

                    {comp.sub_zones && comp.sub_zones.length > 0 && (
                      <div className="rounded-lg border border-slate-200/70 dark:border-[#1E2D3D] bg-slate-50/60 dark:bg-[#0B1218]/60 px-3 py-2 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Pieces / Sub-Zones Breakdown (Σ Area &amp; Σ Volume • Avg Depth)
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {comp.sub_zones.map((z, zIdx) => (
                            <span
                              key={z.id || zIdx}
                              className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] text-slate-600 dark:text-slate-300"
                            >
                              <strong className="font-sans text-slate-800 dark:text-slate-100">
                                {z.label || `Piece ${zIdx + 1}`}:
                              </strong>
                              <span>
                                {formatNumber(z.area_m2)}m² × {formatNumber(z.depth_m, 2)}m ={' '}
                                <strong className="text-brand-600 dark:text-brand-300">
                                  {formatNumber(z.volume_m3)}m³
                                </strong>
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discipline Cost Breakdown + Mini Donut Chart */}
                    <div className="flex items-center gap-3">
                      {(() => {
                        const total = Math.max(1, comp.total_price || 1);
                        const civilPct = Math.round((comp.total_civil_cost / total) * 100);
                        const mechPct = Math.round((comp.total_mechanical_cost / total) * 100);
                        const elecPct = Math.max(0, 100 - civilPct - mechPct);
                        return (
                          <div
                            className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center relative"
                            style={{
                              background: `conic-gradient(#D4741A 0% ${civilPct}%, #1E9090 ${civilPct}% ${
                                civilPct + mechPct
                              }%, #D81E78 ${civilPct + mechPct}% 100%)`,
                            }}
                            title={`Civil ${civilPct}% • Mech ${mechPct}% • Elec/Other ${elecPct}%`}
                          >
                            <div className="w-6 h-6 rounded-full bg-white dark:bg-[#111C28]" />
                          </div>
                        );
                      })()}
                      <div className="grid grid-cols-3 gap-2 text-xs flex-1">
                        <div className="p-2 rounded bg-slate-50 dark:bg-[#0B1218]/60">
                          <span className="text-[10px] text-slate-400 block">Civil</span>
                          <span className="font-mono font-semibold">
                            {formatCurrency(comp.total_civil_cost, 'EGP')}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-50 dark:bg-[#0B1218]/60">
                          <span className="text-[10px] text-slate-400 block">
                            Mechanical
                          </span>
                          <span className="font-mono font-semibold">
                            {formatCurrency(comp.total_mechanical_cost, 'EGP')}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-50 dark:bg-[#0B1218]/60">
                          <span className="text-[10px] text-slate-400 block">
                            Electrical
                          </span>
                          <span className="font-mono font-semibold">
                            {formatCurrency(comp.total_electrical_cost, 'EGP')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Total & Unit Benchmarks */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1E2D3D]">
                      <div className="text-xs text-slate-500 font-mono">
                        <span>
                          {comp.avg_cost_per_m2
                            ? `${formatNumber(comp.avg_cost_per_m2, 2)} EGP/m²`
                            : '—'}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          {comp.avg_cost_per_m3
                            ? `${formatNumber(comp.avg_cost_per_m3, 2)} EGP/m³`
                            : '—'}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-bold text-brand-600 dark:text-brand-300">
                        {formatCurrency(comp.total_price, 'EGP')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 29-Column Full Sheet View (Appendix A.2) */
            <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0B1218] border-b border-slate-200 dark:border-[#1E2D3D] text-[11px] font-bold uppercase text-slate-500">
                    <th className="p-2.5 sticky left-0 bg-slate-50 dark:bg-[#0B1218]">
                      Proposal Code
                    </th>
                    <th className="p-2.5 min-w-[160px]">Project Name</th>
                    <th className="p-2.5 min-w-[180px]">Component Title</th>
                    <th className="p-2.5 min-w-[180px]">Component</th>
                    <th className="p-2.5 min-w-[140px]">Component Shape</th>
                    <th className="p-2.5 min-w-[160px]">Proposal Type</th>
                    <th className="p-2.5 min-w-[160px]">Component Type</th>
                    <th className="p-2.5 min-w-[160px]">Filtration Method</th>
                    <th className="p-2.5 min-w-[160px]">Finishing Type</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Each Area m²</th>
                    <th className="p-2.5 text-right">Each Perim m</th>
                    <th className="p-2.5 text-right">Avg Depth m</th>
                    <th className="p-2.5 text-right">Each Vol m³</th>
                    <th className="p-2.5 text-right">Total Area m²</th>
                    <th className="p-2.5 text-right">Total Perim m</th>
                    <th className="p-2.5 text-right">Total Vol m³</th>
                    <th className="p-2.5 text-right">Maintenance</th>
                    <th className="p-2.5 text-right">Supply</th>
                    <th className="p-2.5 text-right">Design</th>
                    <th className="p-2.5 text-right">Civil</th>
                    <th className="p-2.5 text-right">Mechanical</th>
                    <th className="p-2.5 text-right">Electrical</th>
                    <th className="p-2.5 text-right font-bold text-brand-500">
                      Total Price (EGP)
                    </th>
                    <th className="p-2.5 text-right">Est Full / m²</th>
                    <th className="p-2.5 text-right">Est Cost Full</th>
                    <th className="p-2.5 text-right">Est Civil / m²</th>
                    <th className="p-2.5 text-right">Est Total Civil</th>
                    <th className="p-2.5 text-right">Est MEP / m²</th>
                    <th className="p-2.5 text-right">Est Total MEP</th>
                    <th className="p-2.5 text-right">Est Total Tender</th>
                    <th className="p-2.5 text-right">Avg Cost / m²</th>
                    <th className="p-2.5 text-right">Avg Cost / m³</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D] font-mono">
                  {components.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#162332]"
                    >
                      <td className="p-2.5 sticky left-0 bg-white dark:bg-[#111C28] font-bold text-brand-500">
                        {tender.proposal_code}
                      </td>
                      <td className="p-2.5 font-sans">
                        {tender.project_name || tender.proposal_name}
                      </td>
                      <td className="p-2.5 font-sans font-semibold text-slate-900 dark:text-white">
                        {canEditComp ? (
                          <input
                            type="text"
                            placeholder={c.water_feature}
                            value={c.component_title || ''}
                            onChange={(e) =>
                              upsertComponent(
                                tender.id,
                                { ...c, component_title: e.target.value },
                                actor
                              )
                            }
                            className="w-40 rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2 py-1 text-xs font-sans"
                          />
                        ) : (
                          c.component_title || '—'
                        )}
                      </td>
                      <td className="p-2.5 font-sans font-semibold text-slate-900 dark:text-white">
                        {canEditComp ? (
                          <input
                            type="text"
                            value={c.water_feature}
                            onChange={(e) =>
                              upsertComponent(
                                tender.id,
                                { ...c, water_feature: e.target.value },
                                actor
                              )
                            }
                            className="w-40 rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2 py-1 text-xs font-sans"
                          />
                        ) : (
                          c.water_feature
                        )}
                      </td>
                      <td className="p-2.5 font-sans">
                        {canEditComp ? (
                          <select
                            value={c.component_shape || ''}
                            onChange={(e) =>
                              upsertComponent(
                                tender.id,
                                { ...c, component_shape: e.target.value || null },
                                actor
                              )
                            }
                            className="w-32 rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2 py-1 text-xs font-sans"
                          >
                            <option value="">—</option>
                            {componentShapes.map((sh) => (
                              <option key={sh.id} value={sh.label_en}>
                                {sh.label_en}
                              </option>
                            ))}
                          </select>
                        ) : (
                          c.component_shape || '—'
                        )}
                      </td>
                      <td className="p-2.5 font-sans">{c.proposal_type}</td>
                      <td className="p-2.5 font-sans">{c.water_feature_type}</td>
                      <td className="p-2.5 font-sans">{c.filtration_method}</td>
                      <td className="p-2.5 font-sans">{c.finishing_type}</td>
                      <td className="p-2.5 text-right">
                        {canEditComp ? (
                          <input
                            type="number"
                            min={1}
                            value={c.qty_same_specs}
                            onChange={(e) =>
                              upsertComponent(
                                tender.id,
                                {
                                  ...c,
                                  qty_same_specs: Math.max(1, Number(e.target.value) || 1),
                                },
                                actor
                              )
                            }
                            className="w-16 text-right rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          c.qty_same_specs
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {canEditComp ? (
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={c.each_area_m2}
                            onChange={(e) =>
                              upsertComponent(
                                tender.id,
                                {
                                  ...c,
                                  each_area_m2: Math.max(0, Number(e.target.value) || 0),
                                },
                                actor
                              )
                            }
                            className="w-20 text-right rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          formatNumber(c.each_area_m2)
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {canEditComp ? (
                          <input
                            type="number"
                            min={0}
                            step="any"
                            value={c.each_perimeter_m ?? 0}
                            onChange={(e) =>
                              upsertComponent(
                                tender.id,
                                {
                                  ...c,
                                  each_perimeter_m: Math.max(0, Number(e.target.value) || 0),
                                },
                                actor
                              )
                            }
                            className="w-20 text-right rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          formatNumber(c.each_perimeter_m ?? 0)
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {canEditComp &&
                        waterFeatureRequiresDepth(
                          c.water_feature_type,
                          [...componentsDb, ...waterFeatureTypes],
                          c.water_feature
                        ) ? (
                          <input
                            type="number"
                            min={0}
                            step="0.05"
                            value={c.each_avg_depth_m ?? 0}
                            onChange={(e) =>
                              upsertComponent(
                                tender.id,
                                {
                                  ...c,
                                  each_avg_depth_m:
                                    e.target.value === ''
                                      ? undefined
                                      : Math.max(0, Number(e.target.value)),
                                },
                                actor
                              )
                            }
                            className="w-16 text-right rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          c.each_avg_depth_m ?? '—'
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {formatNumber(c.each_volume_m3)}
                      </td>
                      <td className="p-2.5 text-right font-semibold">
                        {formatNumber(c.total_area_m2)}
                      </td>
                      <td className="p-2.5 text-right font-semibold">
                        {formatNumber(
                          c.total_perimeter_m ??
                            (c.each_perimeter_m
                              ? c.each_perimeter_m * c.qty_same_specs
                              : 0)
                        )}
                      </td>
                      <td className="p-2.5 text-right font-semibold">
                        {formatNumber(c.total_volume_m3)}
                      </td>
                      <td className="p-2.5 text-right">
                        {canEditComp ? (
                          <FormattedNumberInput
                            min={0}
                            value={c.total_maintenance_cost}
                            onValueChange={(val) =>
                              upsertComponent(
                                tender.id,
                                {
                                  id: c.id,
                                  total_maintenance_cost: val,
                                },
                                actor
                              )
                            }
                            className="w-28 text-right rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          formatNumber(c.total_maintenance_cost, 2)
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {canEditComp ? (
                          <FormattedNumberInput
                            min={0}
                            value={c.total_supply_cost}
                            onValueChange={(val) =>
                              upsertComponent(
                                tender.id,
                                {
                                  id: c.id,
                                  total_supply_cost: val,
                                },
                                actor
                              )
                            }
                            className="w-28 text-right rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          formatNumber(c.total_supply_cost, 2)
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {canEditComp ? (
                          <FormattedNumberInput
                            min={0}
                            value={c.total_design_cost}
                            onValueChange={(val) =>
                              upsertComponent(
                                tender.id,
                                {
                                  id: c.id,
                                  total_design_cost: val,
                                },
                                actor
                              )
                            }
                            className="w-28 text-right rounded border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          formatNumber(c.total_design_cost, 2)
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {canEditCivilComp ? (
                          <FormattedNumberInput
                            min={0}
                            value={c.total_civil_cost}
                            onValueChange={(val) =>
                              upsertComponent(
                                tender.id,
                                {
                                  id: c.id,
                                  total_civil_cost: val,
                                },
                                actor
                              )
                            }
                            className="w-32 text-right rounded border border-brand-500/40 bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          formatNumber(c.total_civil_cost, 2)
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {canEditMechComp ? (
                          <FormattedNumberInput
                            min={0}
                            value={c.total_mechanical_cost}
                            onValueChange={(val) =>
                              upsertComponent(
                                tender.id,
                                {
                                  id: c.id,
                                  total_mechanical_cost: val,
                                },
                                actor
                              )
                            }
                            className="w-32 text-right rounded border border-brand-500/40 bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          formatNumber(c.total_mechanical_cost, 2)
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        {canEditElecComp ? (
                          <FormattedNumberInput
                            min={0}
                            value={c.total_electrical_cost}
                            onValueChange={(val) =>
                              upsertComponent(
                                tender.id,
                                {
                                  id: c.id,
                                  total_electrical_cost: val,
                                },
                                actor
                              )
                            }
                            className="w-32 text-right rounded border border-brand-500/40 bg-slate-50 dark:bg-[#0B1218] px-1.5 py-1 text-xs font-mono"
                          />
                        ) : (
                          formatNumber(c.total_electrical_cost, 2)
                        )}
                      </td>
                      <td className="p-2.5 text-right font-bold text-brand-600 dark:text-brand-300">
                        {formatNumber(c.total_price, 2)}
                      </td>
                      <td className="p-2.5 text-right">
                        {c.est_price_per_m2_full_scope ?? '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        {c.est_cost_full_scope ?? '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        {c.est_price_per_m2_civil ?? '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        {c.est_total_civil ?? '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        {c.est_price_per_m2_mep ?? '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        {c.est_total_mep ?? '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        {c.est_total_tender ?? '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        {c.avg_cost_per_m2 ? formatNumber(c.avg_cost_per_m2, 2) : '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        {c.avg_cost_per_m3 ? formatNumber(c.avg_cost_per_m3, 2) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Live Totals Footer Bar */}
          <div className="rounded-xl bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div>
                <span className="text-slate-400 block">Total Area</span>
                <span className="font-mono text-sm font-bold text-teal-300">
                  {formatNumber(tender.total_components_area_m2)} m²
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Total Volume</span>
                <span className="font-mono text-sm font-bold text-teal-300">
                  {formatNumber(tender.total_components_volume_m3)} m³
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Civil Sum</span>
                <span className="font-mono text-sm font-semibold">
                  {formatCurrency(tender.civil_cost, 'EGP')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Mechanical Sum</span>
                <span className="font-mono text-sm font-semibold">
                  {formatCurrency(tender.mechanical_cost, 'EGP')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Electrical Sum</span>
                <span className="font-mono text-sm font-semibold">
                  {formatCurrency(tender.electrical_cost, 'EGP')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Synchronized Tender Price
              </span>
              <span className="font-mono text-base font-bold text-emerald-300">
                {formatCurrency(tender.tender_total_price, 'EGP')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRICING & FX (Phase 3) */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Discipline Cost Breakdown (EGP)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  ['maintenance_cost', 'Maintenance Cost'],
                  ['supply_cost', 'Supply Cost'],
                  ['design_cost', 'Design Cost'],
                  ['civil_cost', 'Civil Cost'],
                  ['mechanical_cost', 'Mechanical Cost'],
                  ['electrical_cost', 'Electrical Cost'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {label}
                  </label>
                  <FormattedNumberInput
                    min={0}
                    disabled={!canEditTenderField(user.role, field, isAssigned)}
                    value={tender[field] || 0}
                    onValueChange={(val) =>
                      updateTender(
                        tender.id,
                        { [field]: val },
                        actor
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm font-mono disabled:opacity-80"
                  />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#1E2D3D] space-y-3">
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={
                      !canEditTenderField(user.role, 'total_price_is_manual', isAssigned)
                    }
                    checked={Boolean(tender.total_price_is_manual)}
                    onChange={(e) =>
                      updateTender(
                        tender.id,
                        { total_price_is_manual: e.target.checked },
                        actor
                      )
                    }
                    className="rounded border-slate-300 text-brand-500"
                  />
                  <span>Manual Override Total Proposal Price</span>
                </label>
                <span className="font-mono text-lg font-bold text-brand-600 dark:text-brand-300">
                  {formatCurrency(tender.tender_total_price, 'EGP')}
                </span>
              </div>

              {tender.total_price_is_manual && (
                <div>
                  <label className="block text-xs font-semibold text-amber-500 mb-1">
                    Manual Override Total Price (EGP)
                  </label>
                  <FormattedNumberInput
                    min={0}
                    disabled={
                      !canEditTenderField(user.role, 'tender_total_price', isAssigned)
                    }
                    value={tender.tender_total_price || 0}
                    onValueChange={(val) =>
                      updateTender(
                        tender.id,
                        {
                          total_price_is_manual: true,
                          tender_total_price: val,
                        },
                        actor
                      )
                    }
                    className="w-full rounded-lg border border-amber-500/40 bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Sent Date & Historical USD/EGP Conversion
              </h2>
              {canEditTenderField(user.role, 'actual_sent_date', isAssigned) && (
                <button
                  onClick={handleFetchSentRate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Fetch Market Rate
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Actual Sent Date
                </label>
                <input
                  type="date"
                  disabled={
                    !canEditTenderField(user.role, 'actual_sent_date', isAssigned)
                  }
                  value={tender.actual_sent_date || ''}
                  onChange={(e) =>
                    updateTender(
                      tender.id,
                      { actual_sent_date: e.target.value || null },
                      actor
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  USD/EGP Rate Used
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={!hasFullTenderAuthority(user)}
                  value={tender.exchange_rate_on_sent_date || ''}
                  onChange={(e) =>
                    updateTender(
                      tender.id,
                      {
                        exchange_rate_on_sent_date: Number(e.target.value) || null,
                        sent_rate_is_manual: true,
                        sent_rate_source: 'Manual Override',
                      },
                      actor
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-[#0B1218] p-4 border border-slate-200 dark:border-[#1E2D3D] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Rate Date Used:</span>
                <span className="font-mono font-semibold">
                  {tender.sent_rate_date_used || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rate Source:</span>
                <span className="font-mono">{tender.sent_rate_source || '—'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-[#1E2D3D]">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Converted Price in USD:
                </span>
                <span className="font-mono text-base font-bold text-emerald-500">
                  {formatCurrency(tender.tender_total_price_usd, 'USD')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTS — SERVER LINK PATHS ONLY (Phase 2) */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Company File Server & SharePoint Paths
                </h2>
                <p className="text-xs text-slate-500">
                  Per Section 5.2, files stay on your internal file server; only UNC /
                  drive / SharePoint paths are stored here.
                </p>
              </div>
            </div>

            {/* Primary Tender Folder Path */}
            <div className="rounded-lg bg-slate-50 dark:bg-[#0B1218] p-3.5 border border-slate-200 dark:border-[#1E2D3D] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-brand-500 block">
                  Master Tender Server Folder
                </span>
                <code className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all">
                  {tender.server_link_path || 'No master server folder set'}
                </code>
              </div>
              {tender.server_link_path && (
                <button
                  onClick={() => handleCopyPath(tender.server_link_path || '')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white shrink-0"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" /> Copy Path
                </button>
              )}
            </div>

            {/* Document Rows */}
            <div className="divide-y divide-slate-200 dark:divide-[#1E2D3D]">
              {documents.map((doc) => {
                const isUrl = /^https?:\/\//i.test(doc.server_path);
                return (
                  <div
                    key={doc.id}
                    className="py-3 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-300">
                          {doc.doc_type}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {doc.file_name}
                        </span>
                        <span className="font-mono text-xs text-slate-400">
                          ({doc.version})
                        </span>
                      </div>
                      <div className="font-mono text-xs text-slate-500 break-all">
                        {doc.server_path}
                      </div>
                      {doc.notes && (
                        <div className="text-xs text-slate-400">{doc.notes}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyPath(doc.server_path)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#182636] hover:bg-brand-500 hover:text-white transition-colors"
                      >
                        <ClipboardCopy className="w-3.5 h-3.5" /> Copy Path
                      </button>
                      {isUrl && (
                        <a
                          href={doc.server_path}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-500/10 text-brand-500"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Open
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Server Link Form */}
          {canManageDocuments(user.role) && (
            <form
              onSubmit={handleAddDocument}
              className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3 h-fit"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Link Server Document Path
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Document Title
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Architectural Layout CAD"
                  value={docForm.file_name}
                  onChange={(e) =>
                    setDocForm({ ...docForm, file_name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Type
                  </label>
                  <select
                    value={docForm.doc_type}
                    onChange={(e) =>
                      setDocForm({ ...docForm, doc_type: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-2 text-xs"
                  >
                    {['RFP', 'BOQ', 'Drawings', 'Specs', 'Addendum', 'Final Offer', 'Contract'].map(
                      (t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={docForm.version}
                    onChange={(e) =>
                      setDocForm({ ...docForm, version: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Server Path / UNC / SharePoint URL
                </label>
                <input
                  required
                  type="text"
                  placeholder="\\PZONE-SRV\Tenders\2026\..."
                  value={docForm.server_path}
                  onChange={(e) =>
                    setDocForm({ ...docForm, server_path: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold"
              >
                Add Server Link & Notify Team
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 5: TASKS & TEAM ASSIGNMENTS (Phase 4) */}
      {activeTab === 'tasks' && canSeeTeam && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Discipline Checklist */}
          <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Discipline Checklist (Auto-Advances Kanban)
                </h2>
                <p className="text-xs text-slate-500">
                  When all assigned disciplines mark their part Finished, the tender
                  automatically moves to Finished!
                </p>
              </div>
              {task && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500/15 text-brand-500">
                  Kanban:{' '}
                  {toKanbanBoardStage(
                    task.kanban_status,
                    tender.tender_status,
                    components.length
                  )}
                </span>
              )}
            </div>

            {assignments.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No engineers assigned yet. Use the Assignment Panel to assign the team.
              </p>
            ) : (
              <div className="space-y-3">
                {assignments.map((asg) => {
                  const canUpdateThis =
                    hasFullTenderAuthority(user) || asg.user_id === user.id;
                  return (
                    <div
                      key={asg.id}
                      className="rounded-lg bg-slate-50 dark:bg-[#0B1218] p-3.5 border border-slate-200 dark:border-[#1E2D3D] flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-[11px] font-bold uppercase text-brand-500 block">
                          {asg.discipline}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {getProfileName(asg.user_id, lang)}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span>
                            Assigned: {formatDateDdMmYyyy(asg.assigned_at || asg.created_at)}
                          </span>
                          {asg.finished_at && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              • Finished: {formatDateDdMmYyyy(asg.finished_at)}
                            </span>
                          )}
                        </div>
                        {asg.finished_note && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Note: {asg.finished_note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {(['Assigned', 'In Progress', 'Waiting', 'Finished'] as AssignmentStatus[]).map(
                          (st) => {
                            const eff = getEffectiveDisciplineStage(
                              asg,
                              components,
                              tender
                            );
                            const isSelected =
                              (st === 'Assigned' && eff === 'Not Started') ||
                              (st === 'In Progress' && eff === 'In Progress') ||
                              (st === 'Waiting' && eff === 'Cancelled or Waiting') ||
                              (st === 'Finished' && eff === 'Finished');
                            const label =
                              st === 'Assigned'
                                ? 'Not Started'
                                : st === 'Waiting'
                                  ? 'Cancelled or Waiting'
                                  : st;
                            return (
                              <button
                                key={st}
                                disabled={!canUpdateThis}
                                onClick={() => {
                                  updateDisciplineAssignmentStatus(
                                    asg.id,
                                    st,
                                    st === 'Finished'
                                      ? `${asg.discipline} completed by ${user.full_name}`
                                      : '',
                                    actor
                                  );
                                  showToast(
                                    'success',
                                    `${asg.discipline} marked as ${label}.`
                                  );
                                }}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                                  isSelected
                                    ? st === 'Finished'
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-brand-500 text-white'
                                    : 'bg-white dark:bg-[#111C28] text-slate-500 border border-slate-200 dark:border-[#1E2D3D]'
                                } disabled:opacity-50`}
                              >
                                {label}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tender Manager Team View / Edit Panel */}
          <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Tender Manager — Team & Due Date
              </h2>
              {!isEditingTeam && canAssignEngineers(user) && (
                <button
                  type="button"
                  onClick={() => setIsEditingTeam(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {!isEditingTeam ? (
              <div className="space-y-3">
                {(
                  [
                    'Civil/Arch',
                    'Mechanical Pricing',
                    'Electrical Pricing',
                  ] as DisciplineType[]
                ).map((disc) => {
                  const engId =
                    disc === 'Civil/Arch'
                      ? tender.responsible_civil_engineer_id
                      : disc === 'Mechanical Pricing'
                        ? tender.mechanical_pricing_responsible_id
                        : tender.electrical_pricing_responsible_id;
                  const assignedAt = getEngineerAssignedDate(
                    tender,
                    disc,
                    assignments
                  );
                  return (
                    <div
                      key={disc}
                      className="rounded-lg bg-slate-50 dark:bg-[#0B1218] p-3 border border-slate-200 dark:border-[#1E2D3D] flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block">
                          {disc} Responsible
                        </span>
                        {engId ? (
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {getProfileName(engId, lang)}
                          </span>
                        ) : (
                          <span className="italic text-slate-400">
                            Not assigned yet
                          </span>
                        )}
                      </div>
                      {engId && assignedAt ? (
                        <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 text-[11px] font-mono font-semibold">
                          Assigned: {formatDateDdMmYyyy(assignedAt)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 text-[11px] font-semibold">
                          Unassigned
                        </span>
                      )}
                    </div>
                  );
                })}

                <div className="rounded-lg bg-slate-50 dark:bg-[#0B1218] p-3 border border-slate-200 dark:border-[#1E2D3D] flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-400">
                    Expected Send / Due Date
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatDateDdMmYyyy(tender.expected_send_date, 'Not set')}
                  </span>
                </div>

                {canAssignEngineers(user) && (
                  <>
                    <EngineerWorkloadAdvisor summaries={workloadSummaries} />
                    <button
                      type="button"
                      onClick={() => setIsEditingTeam(true)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit / Assign Team</span>
                    </button>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleAssignTeam} className="space-y-4">
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
                      ? tender.responsible_civil_engineer_id
                      : disc === 'Mechanical Pricing'
                        ? tender.mechanical_pricing_responsible_id
                        : tender.electrical_pricing_responsible_id;
                  const currentAssignedAt = getEngineerAssignedDate(
                    tender,
                    disc,
                    assignments
                  );
                  const selectedEngId = assignDraft[disc] || '';
                  return (
                    <div key={disc}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="block text-xs font-semibold text-slate-500">
                          {disc} Responsible
                        </label>
                        {selectedEngId &&
                          selectedEngId === (currentEngId || '') &&
                          currentAssignedAt && (
                            <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 text-[11px] font-mono font-semibold">
                              Assigned: {formatDateDdMmYyyy(currentAssignedAt)}
                            </span>
                          )}
                        {selectedEngId && selectedEngId !== (currentEngId || '') && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[11px] font-mono font-semibold">
                            Assign Date: {formatDateDdMmYyyy(todayCairoIso())}
                          </span>
                        )}
                      </div>
                      <select
                        disabled={!canAssignEngineers(user)}
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
                        className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs"
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
                                {eng.full_name} ({eng.team}){wlLabel}
                              </option>
                            );
                          })}
                      </select>
                      {disc === 'Electrical Pricing' &&
                        !elecManuallyEdited &&
                        Boolean(assignDraft['Mechanical Pricing']) &&
                        assignDraft['Electrical Pricing'] ===
                          assignDraft['Mechanical Pricing'] && (
                          <p className="text-[11px] text-slate-400 mt-1">
                            Initially matched to Mechanical Pricing — you can update it anytime.
                          </p>
                        )}
                    </div>
                  );
                })}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Expected Send / Due Date
                  </label>
                  <DatePickerInput
                    disabled={!canAssignEngineers(user)}
                    value={assignDueDate}
                    onChange={(iso) => setAssignDueDate(iso)}
                  />
                </div>

                {canAssignEngineers(user) && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#1E2D3D]">
                    <button
                      type="button"
                      onClick={() => {
                        const initialMech =
                          tender.mechanical_pricing_responsible_id || '';
                        const initialElec =
                          tender.electrical_pricing_responsible_id || initialMech;
                        setAssignDraft({
                          'Civil/Arch': tender.responsible_civil_engineer_id || '',
                          'Mechanical Pricing': initialMech,
                          'Electrical Pricing': initialElec,
                        });
                        setElecManuallyEdited(
                          Boolean(
                            tender.electrical_pricing_responsible_id &&
                              tender.electrical_pricing_responsible_id !==
                                tender.mechanical_pricing_responsible_id
                          )
                        );
                        setAssignDueDate(tender.expected_send_date || '');
                        setIsEditingTeam(false);
                      }}
                      className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-[#0B1218] text-xs font-semibold text-slate-600 dark:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-sm"
                    >
                      Save & Notify
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: CONTRACT RESULT */}
      {activeTab === 'contract' &&
        (() => {
          const canEditContract = canManageContract(user.role);
          const isContracted =
            tender.project_status === 'Awarded' ||
            tender.final_contracted_status === 'Contract Signed';

          return (
            <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1E2D3D]">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Proposal-to-Contract Switch & Contract Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {canEditContract
                      ? 'Confirm whether this proposal switched to a contract and enter the official contract data below.'
                      : 'Managed by Document Control — read-only view for engineering and tender management.'}
                  </p>
                </div>

                {canEditContract ? (
                  isContracted ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4" />
                        Switched to Contract
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateTender(
                            tender.id,
                            {
                              project_status: null,
                              final_contracted_status: 'Not Contracted',
                            },
                            actor
                          );
                          showToast(
                            'success',
                            'Reverted contract status back to pending proposal.'
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#1E2D3D] hover:bg-slate-100 dark:hover:bg-[#182636] text-slate-600 dark:text-slate-300"
                      >
                        Revert Switch
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const todayIso = todayCairoIso();
                        updateTender(
                          tender.id,
                          {
                            project_status: 'Awarded',
                            final_contracted_status: 'Contract Signed',
                            contract_date: tender.contract_date || todayIso,
                            pr_contract_date:
                              tender.pr_contract_date ||
                              tender.contract_date ||
                              todayIso,
                            project_name:
                              tender.project_name || tender.proposal_name,
                            final_pr_contract_total_price:
                              tender.final_pr_contract_total_price ||
                              tender.tender_total_price,
                          },
                          actor
                        );
                        setShowCelebration(true);
                        showToast(
                          'success',
                          'Proposal switched to Contract — fill or adjust contract details below.'
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                    >
                      <Award className="w-4 h-4" /> Switch Proposal to Contract
                    </button>
                  )
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isContracted
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-[#0B1218] text-slate-500 border-slate-200 dark:border-[#1E2D3D]'
                    }`}
                  >
                    {isContracted ? 'Switched to Contract' : 'Not Switched to Contract'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Project / Award Status
                  </label>
                  <select
                    disabled={!canEditContract}
                    value={tender.project_status || ''}
                    onChange={(e) =>
                      updateTender(
                        tender.id,
                        { project_status: e.target.value || null },
                        actor
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs disabled:opacity-70"
                  >
                    <option value="">— Pending Client Decision —</option>
                    {projectStatuses.map((ps) => (
                      <option key={ps.id} value={ps.label_en}>
                        {ps.label_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    PR Contract Code
                  </label>
                  <input
                    type="text"
                    disabled={!canEditContract}
                    placeholder="e.g. PR-2026-014"
                    value={tender.pr_code || ''}
                    onChange={(e) =>
                      updateTender(
                        tender.id,
                        { pr_code: e.target.value || null },
                        actor
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Contract Project Name
                  </label>
                  <input
                    type="text"
                    disabled={!canEditContract}
                    placeholder="Official contracted project name..."
                    value={tender.project_name || ''}
                    onChange={(e) =>
                      updateTender(
                        tender.id,
                        { project_name: e.target.value || null },
                        actor
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Final Contracted Status
                  </label>
                  <select
                    disabled={!canEditContract}
                    value={tender.final_contracted_status || ''}
                    onChange={(e) =>
                      updateTender(
                        tender.id,
                        { final_contracted_status: e.target.value || null },
                        actor
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs disabled:opacity-70"
                  >
                    {contractedStatuses.map((cs) => (
                      <option key={cs.id} value={cs.label_en}>
                        {cs.label_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Contract Date
                  </label>
                  <DatePickerInput
                    disabled={!canEditContract}
                    value={tender.pr_contract_date || tender.contract_date || ''}
                    onChange={(iso) =>
                      updateTender(
                        tender.id,
                        {
                          contract_date: iso || null,
                          pr_contract_date: iso || null,
                        },
                        actor
                      )
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Final Contract Price (EGP)
                  </label>
                  <FormattedNumberInput
                    min={0}
                    allowEmptyNull
                    disabled={!canEditContract}
                    value={tender.final_pr_contract_total_price}
                    onEmptyChange={() =>
                      updateTender(
                        tender.id,
                        { final_pr_contract_total_price: null },
                        actor
                      )
                    }
                    onValueChange={(val) =>
                      updateTender(
                        tender.id,
                        { final_pr_contract_total_price: val || null },
                        actor
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Contract Date Exchange Rate (EGP/USD)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      disabled={!canEditContract}
                      value={tender.exchange_rate_on_contract_date ?? ''}
                      onChange={(e) =>
                        updateTender(
                          tender.id,
                          {
                            exchange_rate_on_contract_date:
                              e.target.value === ''
                                ? null
                                : Number(e.target.value),
                            contract_rate_is_manual: true,
                            contract_rate_source: 'Manual Override',
                          },
                          actor
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono disabled:opacity-70"
                    />
                    {canEditContract && (
                      <button
                        type="button"
                        onClick={async () => {
                          const target =
                            tender.pr_contract_date ||
                            tender.contract_date ||
                            todayCairoIso();
                          try {
                            const res = await fetchMarketUsdEgpRate(
                              target,
                              actor
                            );
                            updateTender(
                              tender.id,
                              {
                                exchange_rate_on_contract_date: res.rate,
                                contract_rate_date_used: res.dateUsed,
                                contract_rate_source: res.source,
                                contract_rate_is_manual: false,
                              },
                              actor
                            );
                            showToast(
                              'success',
                              `Contract rate ${res.rate} applied (${res.dateUsed}).`
                            );
                          } catch (err) {
                            showToast(
                              'error',
                              err instanceof Error
                                ? err.message
                                : 'Rate fetch failed'
                            );
                          }
                        }}
                        className="px-2.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shrink-0"
                        title="Fetch Contract Date Market Rate"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Final Contract Price (USD)
                  </label>
                  <div className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-100 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono font-bold text-emerald-500">
                    {formatCurrency(tender.pr_contract_total_price_usd, 'USD')}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Project Status Note
                  </label>
                  <input
                    type="text"
                    disabled={!canEditContract}
                    placeholder="Negotiation or client evaluation note..."
                    value={tender.project_status_note || ''}
                    onChange={(e) =>
                      updateTender(
                        tender.id,
                        { project_status_note: e.target.value || null },
                        actor
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Final Contracted Status Notes
                  </label>
                  <input
                    type="text"
                    disabled={!canEditContract}
                    placeholder="LOI / Payment terms / Contract note..."
                    value={tender.final_contracted_status_notes || ''}
                    onChange={(e) =>
                      updateTender(
                        tender.id,
                        {
                          final_contracted_status_notes: e.target.value || null,
                        },
                        actor
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs disabled:opacity-70"
                  />
                </div>
              </div>
            </div>
          );
        })()}

      {/* TAB 7: REVISIONS & CHANGE LOG (Section 5.1a) */}
      {activeTab === 'revisions' && (
        <div className="space-y-6">
          {/* Revisions Table */}
          <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-brand-500" />
              All Revisions for {tender.proposal_code}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1E2D3D] text-slate-400 uppercase text-[11px]">
                    <th className="py-2 px-3">Rev</th>
                    <th className="py-2 px-3">Received</th>
                    <th className="py-2 px-3">Sent</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Reason / Requested By</th>
                    <th className="py-2 px-3 text-right">Area (m²)</th>
                    <th className="py-2 px-3 text-right">Total EGP</th>
                    <th className="py-2 px-3 text-right">Total USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D]">
                  {revisions.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/tenders/${r.id}?tab=revisions`)}
                      className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-[#182636] ${
                        r.id === tender.id ? 'bg-brand-500/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold">
                        Rev {r.proposal_rev}{' '}
                        {r.is_latest_revision && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">
                            Latest
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {formatDateDdMmYyyy(r.received_date)}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {formatDateDdMmYyyy(r.actual_sent_date)}
                      </td>
                      <td className="py-2.5 px-3">{r.tender_status}</td>
                      <td className="py-2.5 px-3">
                        {r.revision_reason
                          ? `${r.revision_reason} (${r.revision_requested_by})`
                          : 'Initial Registration'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatNumber(r.total_components_area_m2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {formatCurrency(r.tender_total_price, 'EGP')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-brand-500">
                        {formatCurrency(r.tender_total_price_usd, 'USD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Components Details for Each Revision */}
          <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Waves className="w-4 h-4 text-brand-500" />
                  Water Feature Components Details by Revision ({revisions.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Full specs, dimensions, and discipline pricing recorded on each revision
                </span>
              </div>

              <div className="inline-flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">
                  Filter Revision:
                </span>
                <select
                  value={revCompFilterId}
                  onChange={(e) => setRevCompFilterId(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-1.5 font-mono font-semibold text-xs"
                >
                  <option value="ALL">
                    All Revisions ({revisions.length})
                  </option>
                  {revisions.map((r) => (
                    <option key={r.id} value={r.id}>
                      Rev {String(r.proposal_rev).padStart(2, '0')}
                      {r.is_latest_revision ? ' (Latest)' : ' (Historical)'} —{' '}
                      {formatCurrency(r.tender_total_price, 'EGP')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {revisions
                .filter((r) => revCompFilterId === 'ALL' || r.id === revCompFilterId)
                .map((r) => {
                const revComps = getComponentsByTender(r.id);
                const isCurrentRev = r.id === tender.id;
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-4 space-y-3 ${
                      isCurrentRev
                        ? 'border-brand-500/50 bg-brand-500/[0.03]'
                        : 'border-slate-200 dark:border-[#1E2D3D] bg-slate-50/50 dark:bg-[#0B1218]/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-brand-500 text-white">
                          Rev {r.proposal_rev}
                        </span>
                        {r.is_latest_revision ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                            Latest Revision
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                            Historical Snapshot
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {r.tender_status}
                        </span>
                        {r.pump_room_included_in_water_features && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            Pump Room pricing included in water feature pricing
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                        <span className="text-slate-500">
                          Area:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {formatNumber(r.total_components_area_m2)} m²
                          </strong>
                        </span>
                        <span className="text-slate-500">
                          Vol:{' '}
                          <strong className="text-slate-800 dark:text-slate-200">
                            {formatNumber(r.total_components_volume_m3)} m³
                          </strong>
                        </span>
                        <span className="font-bold text-brand-600 dark:text-brand-300">
                          {formatCurrency(r.tender_total_price, 'EGP')}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/tenders/${r.id}?tab=components`)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] hover:border-brand-500 font-sans text-[11px] font-semibold text-brand-600 dark:text-brand-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Rev {r.proposal_rev} Components
                        </button>
                      </div>
                    </div>

                    {revComps.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No water feature components recorded in Rev {r.proposal_rev}.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-[#0B1218] border-b border-slate-200 dark:border-[#1E2D3D] text-[10px] font-bold uppercase text-slate-500">
                              <th className="py-2 px-2.5">#</th>
                              <th className="py-2 px-2.5">Component</th>
                              <th className="py-2 px-2.5">Specs</th>
                              <th className="py-2 px-2.5 text-right">Qty</th>
                              <th className="py-2 px-2.5 text-right">Area (m²)</th>
                              <th className="py-2 px-2.5 text-right">Depth (m)</th>
                              <th className="py-2 px-2.5 text-right">Volume (m³)</th>
                              <th className="py-2 px-2.5 text-right">Civil</th>
                              <th className="py-2 px-2.5 text-right">Mechanical</th>
                              <th className="py-2 px-2.5 text-right">Electrical</th>
                              <th className="py-2 px-2.5 text-right">Other</th>
                              <th className="py-2 px-2.5 text-right font-bold text-brand-600 dark:text-brand-300">
                                Total (EGP)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D]">
                            {revComps.map((c, idx) => {
                              const specsLabel = [
                                c.component_shape,
                                c.water_feature_type,
                                c.filtration_method,
                                c.finishing_type,
                              ]
                                .filter(Boolean)
                                .join(' • ');
                              const otherCost =
                                (c.total_design_cost || 0) +
                                (c.total_supply_cost || 0) +
                                (c.total_maintenance_cost || 0);
                              return (
                                <tr
                                  key={c.id}
                                  className="hover:bg-slate-50/70 dark:hover:bg-[#162332]/70"
                                >
                                  <td className="py-2 px-2.5 font-mono text-slate-400">
                                    #{idx + 1}
                                  </td>
                                  <td className="py-2 px-2.5 font-semibold text-slate-900 dark:text-white">
                                    <div>
                                      {c.component_title?.trim() || c.water_feature}
                                    </div>
                                    {c.component_title?.trim() && (
                                      <div className="text-[10px] font-normal text-slate-500">
                                        {c.water_feature}
                                      </div>
                                    )}
                                    {c.pump_room_included && (
                                      <span className="inline-block mt-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-300">
                                        ✓ Pump Room pricing included
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2.5 text-slate-500">
                                    {specsLabel || '—'}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono">
                                    {c.qty_same_specs}x
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono">
                                    {formatNumber(c.total_area_m2)}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono">
                                    {c.each_avg_depth_m ? formatNumber(c.each_avg_depth_m) : '—'}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono">
                                    {formatNumber(c.total_volume_m3)}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono">
                                    {formatCurrency(c.total_civil_cost, 'EGP')}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono">
                                    {formatCurrency(c.total_mechanical_cost, 'EGP')}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono">
                                    {formatCurrency(c.total_electrical_cost, 'EGP')}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono text-slate-500">
                                    {otherCost > 0
                                      ? formatCurrency(otherCost, 'EGP')
                                      : '—'}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono font-bold text-brand-600 dark:text-brand-300">
                                    {formatCurrency(c.total_price, 'EGP')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 dark:bg-[#0B1218] border-t border-slate-200 dark:border-[#1E2D3D] font-mono font-bold text-[11px]">
                              <td colSpan={4} className="py-2 px-2.5 font-sans text-slate-600 dark:text-slate-300">
                                Rev {r.proposal_rev} Totals ({revComps.length} component{revComps.length === 1 ? '' : 's'})
                              </td>
                              <td className="py-2 px-2.5 text-right">
                                {formatNumber(r.total_components_area_m2)} m²
                              </td>
                              <td className="py-2 px-2.5 text-right">—</td>
                              <td className="py-2 px-2.5 text-right">
                                {formatNumber(r.total_components_volume_m3)} m³
                              </td>
                              <td className="py-2 px-2.5 text-right">
                                {formatCurrency(r.civil_cost, 'EGP')}
                              </td>
                              <td className="py-2 px-2.5 text-right">
                                {formatCurrency(r.mechanical_cost, 'EGP')}
                              </td>
                              <td className="py-2 px-2.5 text-right">
                                {formatCurrency(r.electrical_cost, 'EGP')}
                              </td>
                              <td className="py-2 px-2.5 text-right text-slate-500">
                                {formatCurrency(
                                  r.design_cost + r.supply_cost + r.maintenance_cost,
                                  'EGP'
                                )}
                              </td>
                              <td className="py-2 px-2.5 text-right text-brand-600 dark:text-brand-300">
                                {formatCurrency(r.tender_total_price, 'EGP')}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side-by-Side Revision Diff */}
          {revisions.length >= 2 && (
            <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Side-by-Side Revision Comparison
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={diffRevAId}
                    onChange={(e) => setDiffRevAId(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 font-mono"
                  >
                    {revisions.map((r) => (
                      <option key={r.id} value={r.id}>
                        Rev {r.proposal_rev}
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400">vs</span>
                  <select
                    value={diffRevBId}
                    onChange={(e) => setDiffRevBId(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 font-mono"
                  >
                    {revisions.map((r) => (
                      <option key={r.id} value={r.id}>
                        Rev {r.proposal_rev}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(() => {
                const revA = revisions.find((r) => r.id === diffRevAId);
                const revB = revisions.find((r) => r.id === diffRevBId);
                if (!revA || !revB) return null;
                const compsA = getComponentsByTender(revA.id);
                const compsB = getComponentsByTender(revB.id);
                const maxRows = Math.max(compsA.length, compsB.length);
                const priceDiff =
                  revB.tender_total_price - revA.tender_total_price;
                const areaDiff =
                  revB.total_components_area_m2 - revA.total_components_area_m2;
                return (
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1218] border border-slate-200 dark:border-[#1E2D3D]">
                        <span className="text-slate-400 block">
                          Price Delta (Rev {revA.proposal_rev} → Rev{' '}
                          {revB.proposal_rev})
                        </span>
                        <span
                          className={`font-mono text-base font-bold ${
                            priceDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {priceDiff >= 0 ? '+' : ''}
                          {formatCurrency(priceDiff, 'EGP')}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1218] border border-slate-200 dark:border-[#1E2D3D]">
                        <span className="text-slate-400 block">Area Delta</span>
                        <span className="font-mono text-base font-bold text-brand-500">
                          {areaDiff >= 0 ? '+' : ''}
                          {formatNumber(areaDiff)} m²
                        </span>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B1218] border border-slate-200 dark:border-[#1E2D3D]">
                        <span className="text-slate-400 block">Scope Summary</span>
                        <div className="font-mono text-[11px] mt-1">
                          <div>
                            Rev {revA.proposal_rev}: {revA.components_summary || '—'}
                          </div>
                          <div className="text-brand-500">
                            Rev {revB.proposal_rev}: {revB.components_summary || '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {maxRows > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-[#1E2D3D]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-[#0B1218] border-b border-slate-200 dark:border-[#1E2D3D] text-[10px] font-bold uppercase text-slate-500">
                              <th className="py-2 px-2.5">#</th>
                              <th className="py-2 px-2.5">
                                Rev {revA.proposal_rev} Component
                              </th>
                              <th className="py-2 px-2.5 text-right">
                                Rev {revA.proposal_rev} Price
                              </th>
                              <th className="py-2 px-2.5">
                                Rev {revB.proposal_rev} Component
                              </th>
                              <th className="py-2 px-2.5 text-right">
                                Rev {revB.proposal_rev} Price
                              </th>
                              <th className="py-2 px-2.5 text-right">Delta</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-[#1E2D3D]">
                            {Array.from({ length: maxRows }).map((_, idx) => {
                              const a = compsA[idx];
                              const b = compsB[idx];
                              const delta =
                                (b?.total_price || 0) - (a?.total_price || 0);
                              return (
                                <tr key={idx}>
                                  <td className="py-2 px-2.5 font-mono text-slate-400">
                                    #{idx + 1}
                                  </td>
                                  <td className="py-2 px-2.5">
                                    {a ? (
                                      <div>
                                        <span className="font-semibold">
                                          {a.water_feature}
                                        </span>{' '}
                                        <span className="text-slate-400 font-mono text-[11px]">
                                          ({formatNumber(a.total_area_m2)} m² •{' '}
                                          {formatNumber(a.total_volume_m3)} m³)
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">
                                        Not in Rev {revA.proposal_rev}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono">
                                    {a ? formatCurrency(a.total_price, 'EGP') : '—'}
                                  </td>
                                  <td className="py-2 px-2.5">
                                    {b ? (
                                      <div>
                                        <span className="font-semibold">
                                          {b.water_feature}
                                        </span>{' '}
                                        <span className="text-slate-400 font-mono text-[11px]">
                                          ({formatNumber(b.total_area_m2)} m² •{' '}
                                          {formatNumber(b.total_volume_m3)} m³)
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic">
                                        Removed in Rev {revB.proposal_rev}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2.5 text-right font-mono font-semibold">
                                    {b ? formatCurrency(b.total_price, 'EGP') : '—'}
                                  </td>
                                  <td
                                    className={`py-2 px-2.5 text-right font-mono font-bold ${
                                      delta > 0
                                        ? 'text-emerald-500'
                                        : delta < 0
                                          ? 'text-rose-500'
                                          : 'text-slate-400'
                                    }`}
                                  >
                                    {delta === 0
                                      ? '0.00 EGP'
                                      : `${delta > 0 ? '+' : ''}${formatCurrency(delta, 'EGP')}`}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Field-Level Change Log (audit_log) — App Admin Only */}
          {isAppAdmin && (
            <div className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Audit Trail & Field Diffs ({auditLogs.length})
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <select
                    value={auditUserFilter}
                    onChange={(e) => setAuditUserFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5"
                  >
                    <option value="ALL">All Users</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Filter by field name..."
                    value={auditFieldFilter}
                    onChange={(e) => setAuditFieldFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-[#1E2D3D] text-xs">
                {auditLogs
                  .filter((log) => {
                    if (auditUserFilter !== 'ALL' && log.user_id !== auditUserFilter) {
                      return false;
                    }
                    if (auditFieldFilter.trim()) {
                      const q = auditFieldFilter.trim().toLowerCase();
                      return log.changed_fields.some((f) =>
                        f.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((log) => (
                    <div key={log.id} className="py-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {log.user_name}
                          </span>{' '}
                          <span className="text-slate-400">({log.user_role})</span>{' '}
                          <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-mono text-[11px]">
                            {log.action}
                          </span>{' '}
                          on <code className="font-mono">{log.table_name}</code> — fields:{' '}
                          <code className="font-mono text-slate-500">
                            {log.changed_fields.join(', ')}
                          </code>
                        </div>
                        <span className="font-mono text-slate-400 shrink-0">
                          {formatDateTimeCairo(log.timestamp)}
                        </span>
                      </div>

                      {log.action === 'UPDATE' &&
                        log.old_data &&
                        log.new_data &&
                        log.changed_fields.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {log.changed_fields
                              .filter((f) => f !== '*')
                              .map((field) => (
                                <div
                                  key={field}
                                  className="px-2.5 py-1 rounded bg-slate-50 dark:bg-[#0B1218] border border-slate-200/70 dark:border-[#1E2D3D] font-mono text-[11px] flex items-center justify-between gap-2"
                                >
                                  <span className="text-slate-400">{field}:</span>
                                  <span className="truncate">
                                    <span className="text-rose-400 line-through mr-1.5">
                                      {formatAuditValueCairo(log.old_data?.[field])}
                                    </span>
                                    →
                                    <span className="text-emerald-400 ml-1.5 font-semibold">
                                      {formatAuditValueCairo(log.new_data?.[field])}
                                    </span>
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 8: COMMENTS & @MENTIONS (Phase 4) */}
      {activeTab === 'comments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Engineering & Commercial Thread ({comments.length})
            </h2>
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg bg-slate-50 dark:bg-[#0B1218] p-3.5 border border-slate-200 dark:border-[#1E2D3D] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {getProfileName(c.user_id, lang)}
                    </span>
                    <span className="font-mono text-slate-400">
                      {formatDateTimeCairo(c.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {c.text}
                  </p>
                  {c.attachment_path && (
                    <div className="flex items-center justify-between pt-1">
                      <code className="font-mono text-[11px] text-brand-500">
                        {c.attachment_path}
                      </code>
                      <button
                        onClick={() => handleCopyPath(c.attachment_path!)}
                        className="text-[11px] text-brand-500 hover:underline"
                      >
                        Copy Path
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {canAddComment(user) && (
            <form
              onSubmit={handlePostComment}
              className="rounded-xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-5 space-y-3 h-fit"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Post Comment & @Mention
              </h3>
              <textarea
                required
                rows={3}
                placeholder="Write a note or question for the team..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs"
              />
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Notify (@Mention) Team Members
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {profiles
                    .filter((p) => p.role !== 'viewer' && p.active)
                    .map((p) => {
                      const sel = commentMentions.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() =>
                            setCommentMentions(
                              sel
                                ? commentMentions.filter((x) => x !== p.id)
                                : [...commentMentions, p.id]
                            )
                          }
                          className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                            sel
                              ? 'bg-brand-500 text-white border-brand-500'
                              : 'bg-slate-50 dark:bg-[#0B1218] border-slate-200 dark:border-[#1E2D3D] text-slate-500'
                          }`}
                        >
                          @{p.full_name.split(' ')[1] || p.full_name}
                        </button>
                      );
                    })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Optional Server Attachment Path
                </label>
                <input
                  type="text"
                  placeholder="\\PZONE-SRV\..."
                  value={commentAttachment}
                  onChange={(e) => setCommentAttachment(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-1.5 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold"
              >
                <Send className="w-3.5 h-3.5" /> Post Comment
              </button>
            </form>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT COMPONENT */}
      {editingComp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveComponent}
            className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingComp.id ? 'Edit Proposal Component' : 'Add Proposal Component'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingComp(null)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
            </div>

            {(() => {
              const reqDepth = waterFeatureRequiresDepth(
                editingComp.water_feature_type,
                [...componentsDb, ...waterFeatureTypes],
                editingComp.water_feature
              );
              const isPumpRoomComp = Boolean(
                editingComp.water_feature?.toLowerCase().includes('pump room') ||
                  editingComp.water_feature?.toLowerCase().includes('plant room')
              );
              const isRectangle =
                isPumpRoomComp ||
                (editingComp.component_shape || 'Rectangle')
                  .trim()
                  .toLowerCase() === 'rectangle';
              const isBalanceTankRoom = Boolean(
                editingComp.water_feature?.toLowerCase().includes('balance tank')
              );
              const preview = computeComponentFields({
                ...editingComp,
                each_avg_depth_m: reqDepth ? editingComp.each_avg_depth_m : 0,
                volume_is_manual: Boolean(editingComp.volume_is_manual) || !reqDepth,
              });

              const applyComponentSelection = (selectedLabel: string) => {
                const lower = selectedLabel.toLowerCase();
                const isPump =
                  lower.includes('pump room') || lower.includes('plant room');
                setEditingComp((prev) => {
                  if (!prev) return prev;
                  const isNewModal = !prev.id;
                  const nextLen =
                    isPump && isNewModal && prev.each_area_m2 === 120
                      ? 5
                      : prev.each_length_m ?? null;
                  const nextWid =
                    isPump && isNewModal && prev.each_area_m2 === 120
                      ? 5
                      : prev.each_width_m ?? null;
                  const nextArea =
                    isPump && isNewModal && prev.each_area_m2 === 120
                      ? 25
                      : prev.each_area_m2;
                  const nextPerim =
                    isPump && isNewModal && prev.each_area_m2 === 120
                      ? 20
                      : prev.each_perimeter_m ??
                        (nextLen && nextWid
                          ? Number((2 * (nextLen + nextWid)).toFixed(2))
                          : 0);
                  return {
                    ...prev,
                    water_feature: selectedLabel,
                    component_shape: isPump
                      ? 'Rectangle'
                      : prev.component_shape || 'Rectangle',
                    water_feature_type: isPump
                      ? isNewModal
                        ? ''
                        : prev.water_feature_type
                      : prev.water_feature_type ||
                        waterFeatureTypes[0]?.label_en ||
                        'Skimmer',
                    filtration_method: isPump
                      ? isNewModal
                        ? ''
                        : prev.filtration_method
                      : prev.filtration_method ||
                        filtrationMethods[0]?.label_en ||
                        'Sand Filter',
                    finishing_type: isPump
                      ? isNewModal
                        ? ''
                        : prev.finishing_type
                      : prev.finishing_type ||
                        finishingTypes[0]?.label_en ||
                        'Mosaic',
                    pump_room_included: isPump
                      ? false
                      : Boolean(prev.pump_room_included),
                    volume_is_manual: isPump
                      ? true
                      : Boolean(prev.volume_is_manual),
                    each_length_m: nextLen,
                    each_width_m: nextWid,
                    each_perimeter_m: nextPerim,
                    each_volume_m3:
                      isPump && isNewModal && prev.each_volume_m3 === 168
                        ? 0
                        : prev.each_volume_m3,
                    each_area_m2: nextArea,
                  };
                });
              };

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Component Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Main Clubhouse Pool 01, Kids Pool, Main Pump Room..."
                        value={editingComp.component_title || ''}
                        onChange={(e) =>
                          setEditingComp({
                            ...editingComp,
                            component_title: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Component *
                      </label>
                      <SearchableDbSelect
                        required
                        value={editingComp.water_feature}
                        onChange={applyComponentSelection}
                        options={componentsDb.map((w) => ({
                          id: w.id,
                          value: w.label_en,
                          label: w.label_en,
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
                          applyComponentSelection(added.label_en);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Component Shape *
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] p-1">
                        {(['Rectangle', 'Free Form'] as const).map((shapeOpt) => {
                          const selected =
                            (isPumpRoomComp
                              ? 'Rectangle'
                              : editingComp.component_shape || 'Rectangle') === shapeOpt;
                          const disabledOpt = isPumpRoomComp && shapeOpt === 'Free Form';
                          return (
                            <button
                              key={shapeOpt}
                              type="button"
                              disabled={disabledOpt}
                              onClick={() => {
                                if (shapeOpt === 'Free Form') {
                                  setEditingComp({
                                    ...editingComp,
                                    component_shape: 'Free Form',
                                    each_length_m: null,
                                    each_width_m: null,
                                  });
                                } else {
                                  setEditingComp({
                                    ...editingComp,
                                    component_shape: 'Rectangle',
                                  });
                                }
                              }}
                              className={`py-1.5 px-2.5 rounded-md text-xs font-bold transition-colors ${
                                selected
                                  ? 'bg-brand-500 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#162332] disabled:opacity-40 disabled:cursor-not-allowed'
                              }`}
                            >
                              {shapeOpt}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Component Type
                      </label>
                      <SearchableDbSelect
                        value={editingComp.water_feature_type}
                        onChange={(nextVal) =>
                          setEditingComp({
                            ...editingComp,
                            water_feature_type: nextVal,
                          })
                        }
                        options={waterFeatureTypes.map((w) => ({
                          id: w.id,
                          value: w.label_en,
                          label: w.label_en,
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
                          setEditingComp({
                            ...editingComp,
                            water_feature_type: added.label_en,
                          });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Filtration Method
                      </label>
                      <SearchableDbSelect
                        value={editingComp.filtration_method || ''}
                        onChange={(nextVal) =>
                          setEditingComp({
                            ...editingComp,
                            filtration_method: nextVal,
                          })
                        }
                        options={filtrationMethods.map((f) => ({
                          id: f.id,
                          value: f.label_en,
                          label: f.label_en,
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
                          setEditingComp({
                            ...editingComp,
                            filtration_method: added.label_en,
                          });
                        }}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Finishing Type
                      </label>
                      <SearchableDbSelect
                        value={editingComp.finishing_type || ''}
                        onChange={(nextVal) =>
                          setEditingComp({
                            ...editingComp,
                            finishing_type: nextVal,
                          })
                        }
                        options={finishingTypes.map((fn) => ({
                          id: fn.id,
                          value: fn.label_en,
                          label: fn.label_en,
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
                          setEditingComp({
                            ...editingComp,
                            finishing_type: added.label_en,
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* Pump Room Included Checkbox */}
                  {!(
                    editingComp.water_feature
                      ?.toLowerCase()
                      .includes('pump room') ||
                    editingComp.water_feature
                      ?.toLowerCase()
                      .includes('plant room') ||
                    editingComp.water_feature_type
                      ?.toLowerCase()
                      .includes('pump room') ||
                    editingComp.water_feature_type
                      ?.toLowerCase()
                      .includes('plant room')
                  ) && (
                    <label
                      className={`inline-flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer select-none transition-colors ${
                        editingComp.pump_room_included
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-50 dark:bg-[#0B1218] border-slate-200 dark:border-[#1E2D3D] text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(editingComp.pump_room_included)}
                        onChange={(e) =>
                          setEditingComp({
                            ...editingComp,
                            pump_room_included: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded accent-brand-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold">
                        Pump Room pricing included in water feature pricing
                      </span>
                    </label>
                  )}

                  {/* Optional Multi-Piece / Sub-Zone Calculator (Lagoons, Lakes, Multi-Depth Basins) */}
                  {reqDepth && (
                    <ComponentSubZonesEditor
                      subZones={editingComp.sub_zones}
                      currentAreaM2={editingComp.each_area_m2}
                      currentAvgDepthM={editingComp.each_avg_depth_m}
                      onChange={(zUpdate) =>
                        setEditingComp({
                          ...editingComp,
                          ...zUpdate,
                        })
                      }
                    />
                  )}

                  {/* Rectangle & Pump Room Length × Width → Auto Area, Perimeter & Volume */}
                  {isRectangle &&
                    !(editingComp.sub_zones && editingComp.sub_zones.length > 0) && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          {isPumpRoomComp ? 'Pump Room Length (m)' : 'Length (m)'}{' '}
                          <span className="text-[10px] font-normal text-brand-500">
                            (Auto Area &amp; Perimeter)
                          </span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.05"
                          placeholder="e.g. 15"
                          value={editingComp.each_length_m ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const len = raw === '' ? null : Math.max(0, Number(raw) || 0);
                            const wid = editingComp.each_width_m ?? null;
                            const hasBoth = len !== null && wid !== null && len > 0 && wid > 0;
                            setEditingComp({
                              ...editingComp,
                              each_length_m: len,
                              ...(hasBoth
                                ? {
                                    each_area_m2: Number((len * wid).toFixed(2)),
                                    each_perimeter_m: Number((2 * (len + wid)).toFixed(2)),
                                  }
                                : {}),
                            });
                          }}
                          className="w-full rounded-lg border border-brand-500/35 bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono focus:border-brand-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          {isPumpRoomComp ? 'Pump Room Width (m)' : 'Width (m)'}{' '}
                          <span className="text-[10px] font-normal text-brand-500">
                            (Auto Area &amp; Perimeter)
                          </span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.05"
                          placeholder="e.g. 8"
                          value={editingComp.each_width_m ?? ''}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const wid = raw === '' ? null : Math.max(0, Number(raw) || 0);
                            const len = editingComp.each_length_m ?? null;
                            const hasBoth = len !== null && wid !== null && len > 0 && wid > 0;
                            setEditingComp({
                              ...editingComp,
                              each_width_m: wid,
                              ...(hasBoth
                                ? {
                                    each_area_m2: Number((len * wid).toFixed(2)),
                                    each_perimeter_m: Number((2 * (len + wid)).toFixed(2)),
                                  }
                                : {}),
                            });
                          }}
                          className="w-full rounded-lg border border-brand-500/35 bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono focus:border-brand-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dimensions */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editingComp.qty_same_specs ?? 1}
                        onChange={(e) =>
                          setEditingComp({
                            ...editingComp,
                            qty_same_specs: Number(e.target.value) || 1,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Each Area (m²)
                        {editingComp.sub_zones && editingComp.sub_zones.length > 0 && (
                          <span className="ml-1 text-[10px] font-bold text-brand-500">
                            (Σ Pieces)
                          </span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingComp.each_area_m2 ?? 0}
                        onChange={(e) =>
                          setEditingComp({
                            ...editingComp,
                            each_area_m2: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Perimeter (m)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={preview.each_perimeter_m ?? 0}
                        onChange={(e) =>
                          setEditingComp({
                            ...editingComp,
                            each_perimeter_m: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    {reqDepth ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Avg Depth (m)
                          {editingComp.sub_zones && editingComp.sub_zones.length > 0 && (
                            <span className="ml-1 text-[10px] font-bold text-brand-500">
                              (Avg)
                            </span>
                          )}
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={editingComp.each_avg_depth_m ?? 1.4}
                          onChange={(e) =>
                            setEditingComp({
                              ...editingComp,
                              each_avg_depth_m: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-semibold text-amber-500 mb-1">
                          {isBalanceTankRoom
                            ? 'Balance Tank Vol (m³)'
                            : 'Each Volume m³'}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingComp.each_volume_m3 ?? 0}
                          onChange={(e) =>
                            setEditingComp({
                              ...editingComp,
                              volume_is_manual: true,
                              each_volume_m3: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-lg border border-amber-500/40 bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    )}

                    <div className="rounded-lg bg-slate-100 dark:bg-[#0B1218] p-2 text-[11px] font-mono leading-tight">
                      <span className="text-[10px] text-slate-400 block mb-0.5">
                        Computed Total
                      </span>
                      <div>{preview.total_area_m2} m²</div>
                      <div className="text-indigo-500 dark:text-indigo-300">
                        {preview.total_perimeter_m} m perim
                      </div>
                      <div className="text-brand-500">{preview.total_volume_m3} m³</div>
                    </div>
                  </div>

                  {/* Discipline Costs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {(
                      [
                        ['total_civil_cost', 'Civil Cost (EGP)', canEditCivilComp],
                        [
                          'total_mechanical_cost',
                          'Mechanical Cost (EGP)',
                          canEditMechComp,
                        ],
                        [
                          'total_electrical_cost',
                          'Electrical Cost (EGP)',
                          canEditElecComp,
                        ],
                        ['total_supply_cost', 'Supply Cost (EGP)', canEditComp],
                        ['total_design_cost', 'Design Cost (EGP)', canEditComp],
                        [
                          'total_maintenance_cost',
                          'Maintenance Cost (EGP)',
                          canEditComp,
                        ],
                      ] as const
                    ).map(([field, label, fieldEditable]) => (
                      <div key={field}>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          {label}
                          {!fieldEditable && ' (Teammate)'}
                        </label>
                        <FormattedNumberInput
                          min={0}
                          disabled={!fieldEditable}
                          value={editingComp[field] ?? 0}
                          onValueChange={(val) =>
                            setEditingComp({
                              ...editingComp,
                              [field]: val,
                            })
                          }
                          className={`w-full rounded-lg border px-3 py-2 text-xs font-mono disabled:opacity-60 disabled:cursor-not-allowed ${
                            fieldEditable
                              ? 'border-brand-500/40 bg-slate-50 dark:bg-[#0B1218]'
                              : 'border-slate-200 dark:border-[#1E2D3D] bg-slate-100 dark:bg-[#0B1218]/60'
                          }`}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Estimator Benchmark Fields (Appendix A.2) */}
                  <div className="pt-2 border-t border-slate-200 dark:border-[#1E2D3D]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Estimator Benchmark Fields (Optional)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(
                        [
                          ['est_price_per_m2_full_scope', 'Est Full / m²'],
                          ['est_cost_full_scope', 'Est Cost Full'],
                          ['est_price_per_m2_civil', 'Est Civil / m²'],
                          ['est_total_civil', 'Est Total Civil'],
                          ['est_price_per_m2_mep', 'Est MEP / m²'],
                          ['est_total_mep', 'Est Total MEP'],
                          ['est_total_tender', 'Est Total Tender'],
                        ] as const
                      ).map(([field, label]) => (
                        <div key={field}>
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            {label}
                          </label>
                          <input
                            type="number"
                            value={editingComp[field] ?? ''}
                            onChange={(e) =>
                              setEditingComp({
                                ...editingComp,
                                [field]:
                                  e.target.value === ''
                                    ? null
                                    : Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-2.5 py-1.5 text-xs font-mono"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg bg-brand-500/10 border border-brand-500/30 p-3 flex items-center justify-between text-xs font-mono">
                    <span>
                      Unit Cost: {formatNumber(preview.avg_cost_per_m2, 2)} EGP/m² •{' '}
                      {formatNumber(preview.avg_cost_per_m3, 2)} EGP/m³
                    </span>
                    <span className="text-sm font-bold text-brand-500">
                      Total: {formatCurrency(preview.total_price, 'EGP')}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingComp(null)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#1E2D3D]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 text-white"
                    >
                      Save Component
                    </button>
                  </div>
                </>
              );
            })()}
          </form>
        </div>
      )}

      {/* MODAL: NEW REVISION */}
      {revModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRevision}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111C28] border border-slate-200 dark:border-[#1E2D3D] p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create New Revision ({tender.proposal_code} Rev {tender.proposal_rev + 1})
            </h3>
            <p className="text-xs text-slate-500">
              All components and server document paths will be cloned into the new
              revision, and Rev {tender.proposal_rev} will remain in history.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Reason for Revision
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Client requested adding heated hydrotherapy jets and Value Engineering on filtration."
                value={revReason}
                onChange={(e) => setRevReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Requested By
              </label>
              <input
                required
                type="text"
                value={revRequestedBy}
                onChange={(e) => setRevRequestedBy(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1E2D3D] bg-slate-50 dark:bg-[#0B1218] px-3 py-2 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-[#1E2D3D]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-500 text-white"
              >
                Create Rev {tender.proposal_rev + 1}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TenderDetail;
