import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Database,
  Eye,
  FileSpreadsheet,
  HardHat,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getTenders, subscribeDataStore } from '@/lib/dataStore';
import {
  canViewModule,
  getModuleAccess,
} from '@/lib/permissions';
import type { SystemModuleKey } from '@/types/database';
import {
  getActiveErpTenderContext,
  startIntelligentTender,
  subscribeActiveErpTender,
  syncAllErpTendersAndCostsToTenderLog,
  type ActiveErpTenderContext,
} from '@/lib/erpBridge';
import { LookupProvider } from '@/lib/lookupContext';
import WaterFeaturePortal from '@/components/WaterFeaturePortal';
import StructuralPortal from '@/components/StructuralPortal';
import WaterFeatureElectromechanicalPortal from '@/components/WaterFeatureElectromechanicalPortal';
import CommercialBidPricePortal from '@/components/CommercialBidPricePortal';
import DatabaseWorkspace from '@/components/DatabaseWorkspace';
import TenderPortal from '@/components/TenderPortal';

type ErpModuleStep =
  | 'water-features'
  | 'structural-works'
  | 'wf-electromechanical'
  | 'commercial-bid'
  | 'database'
  | 'proposals';

export const ErpWorkspacePage: React.FC<{ activeStep?: ErpModuleStep }> = ({
  activeStep = 'water-features',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, language } = useApp();
  const isAr = language === 'ar';

  const [activeCtx, setActiveCtx] = useState<ActiveErpTenderContext | null>(() =>
    getActiveErpTenderContext()
  );
  const [tendersVersion, setTendersVersion] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubStore = subscribeDataStore(() => setTendersVersion((v) => v + 1));
    const unsubCtx = subscribeActiveErpTender((ctx) => setActiveCtx(ctx));
    return () => {
      unsubStore();
      unsubCtx();
    };
  }, []);

  // Automatically sync ERP costs with PZ.Tender Log when entering or switching ERP modules
  useEffect(() => {
    void syncAllErpTendersAndCostsToTenderLog();
  }, [activeStep]);

  const latestTenders = useMemo(() => {
    void tendersVersion;
    return getTenders().filter((t) => t.is_latest_revision);
  }, [tendersVersion]);

  const matchedLogTender = useMemo(() => {
    if (!activeCtx) return latestTenders[0] || null;
    return (
      latestTenders.find(
        (t) =>
          t.id === activeCtx.tenderLogId ||
          t.id === activeCtx.erpTenderId ||
          t.proposal_code.toLowerCase() === activeCtx.proposalCode.toLowerCase()
      ) ||
      latestTenders[0] ||
      null
    );
  }, [activeCtx, latestTenders]);

  const handleSelectLogTender = async (tenderId: string) => {
    const found = latestTenders.find((t) => t.id === tenderId);
    if (!found) return;
    setIsSyncing(true);
    try {
      const nextStep =
        activeStep === 'proposals'
          ? user && canViewModule(user, 'erp_geometry')
            ? 'water-features'
            : user && canViewModule(user, 'erp_overheads')
              ? 'commercial-bid'
              : 'structural-works'
          : activeStep;
      await startIntelligentTender(found, user, nextStep);
      setSyncToast(
        isAr
          ? `تم ربط المناقصة ${found.proposal_code} بمحرك التسعير الذكي`
          : `Linked ${found.proposal_code} (${found.proposal_name}) to Intelligent Tendering ERP`
      );
      setTimeout(() => setSyncToast(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualTwoWaySync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllErpTendersAndCostsToTenderLog();
      if (res.activeSummary && res.activeSummary.finalBidPrice > 0) {
        setSyncToast(
          isAr
            ? `تمت مزامنة الأسعار مع سجل المناقصات: إجمالي العرض ${res.activeSummary.finalBidPrice.toLocaleString()} ج.م`
            : `Synced ERP BOQ & Bid Price to Tender Log: Civil ${res.activeSummary.civilCost.toLocaleString()} | Mech ${res.activeSummary.mechanicalCost.toLocaleString()} | Elec ${res.activeSummary.electricalCost.toLocaleString()} | Total Bid ${res.activeSummary.finalBidPrice.toLocaleString()} EGP`
        );
      } else {
        setSyncToast(
          isAr
            ? 'تمت مزامنة بيانات المناقصة بين سجل المناقصات ومحرك التسعير الذكي بنجاح'
            : `Two-way sync complete (${res.updatedCount} updated, ${res.importedCount} linked with PZ.Tender Log).`
        );
      }
      setTimeout(() => setSyncToast(null), 4500);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleErpNavigate = (targetPath: string) => {
    if (!targetPath) return;
    if (targetPath.startsWith('/database')) {
      navigate(`/erp${targetPath}`);
      return;
    }
    if (targetPath === '/water-features' || targetPath === '/technical-data') {
      navigate('/erp/water-features');
      return;
    }
    if (
      targetPath === '/structural-works' ||
      targetPath === '/structural' ||
      targetPath === '/civil-and-finishes'
    ) {
      navigate('/erp/structural-works');
      return;
    }
    if (
      targetPath === '/wf-electromechanical' ||
      targetPath === '/water-feature-electromechanical' ||
      targetPath === '/wf-mep'
    ) {
      navigate('/erp/wf-electromechanical');
      return;
    }
    if (
      targetPath === '/commercial-bid' ||
      targetPath === '/overheads-and-bid-price' ||
      targetPath === '/bid-pricing'
    ) {
      navigate('/erp/commercial-bid');
      return;
    }
    if (targetPath === '/tenders') {
      navigate('/tenders');
      return;
    }
    navigate(targetPath);
  };

  const handleOpenDatabaseTable = (tableName: string) => {
    navigate(`/erp/database?table=${encodeURIComponent(tableName)}`);
  };

  const activeTable = searchParams.get('table') || 'items';

  const stepToModuleMap: Record<ErpModuleStep, SystemModuleKey> = {
    'water-features': 'erp_geometry',
    'structural-works': 'erp_civil',
    'wf-electromechanical': 'erp_mep',
    'commercial-bid': 'erp_overheads',
    proposals: 'erp_geometry',
    database: 'catalog_fx',
  };

  const activeModuleKey = stepToModuleMap[activeStep];
  const activeStepAccess = getModuleAccess(user, activeModuleKey);
  const isCurrentStepReadOnly = activeStepAccess === 'view';

  const handleReadOnlyCapture = (e: React.SyntheticEvent<HTMLDivElement>) => {
    if (!isCurrentStepReadOnly) return;
    if (e.type === 'submit') {
      e.preventDefault();
      e.stopPropagation();
      setSyncToast(
        isAr
          ? 'وضع العرض والتنسيق فقط: التعديل والحفظ مغلقان لدورك على هذه الوحدة.'
          : 'View-Only Coordination Mode: Editing & saving on this module is locked for your role.'
      );
      setTimeout(() => setSyncToast(null), 3500);
      return;
    }
    const target = e.target as HTMLElement | null;
    const btn = target?.closest('button');
    if (!btn) return;
    const label = `${btn.textContent || ''} ${btn.getAttribute('title') || ''}`
      .trim()
      .toLowerCase();
    const isMutatingButton =
      btn.getAttribute('type') === 'submit' ||
      label.includes('add new') ||
      label.includes('+ add') ||
      label.includes('save') ||
      label.includes('synchronize') ||
      label.includes('delete') ||
      label.includes('remove') ||
      label.includes('create bid') ||
      label.includes('apply ');

    if (isMutatingButton) {
      e.preventDefault();
      e.stopPropagation();
      setSyncToast(
        isAr
          ? 'وضع العرض والتنسيق فقط: التعديل والحفظ مغلقان لدورك على هذه الوحدة.'
          : 'View-Only Coordination Mode: You have View access on this module — editing/saving is locked.'
      );
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  const erpSteps = useMemo(() => {
    const all: {
      key: ErpModuleStep;
      moduleKey: SystemModuleKey;
      path: string;
      stepNum: string;
      labelEn: string;
      labelAr: string;
      icon: typeof Waves;
      accent: string;
    }[] = [
      {
        key: 'water-features',
        moduleKey: 'erp_geometry',
        path: '/erp/water-features',
        stepNum: '1',
        labelEn: '1. Water Features & Pump Rooms',
        labelAr: '١. المسطحات المائية وغرف الطلمبات',
        icon: Waves,
        accent: 'from-cyan-500 to-teal-600',
      },
      {
        key: 'structural-works',
        moduleKey: 'erp_civil',
        path: '/erp/structural-works',
        stepNum: '2',
        labelEn: '2. Civil Structural & Finishes',
        labelAr: '٢. الأعمال المدنية والتشطيبات',
        icon: HardHat,
        accent: 'from-amber-500 to-orange-600',
      },
      {
        key: 'wf-electromechanical',
        moduleKey: 'erp_mep',
        path: '/erp/wf-electromechanical',
        stepNum: '3',
        labelEn: '3. WF Electromechanical (MEP)',
        labelAr: '٣. الأعمال الكهروميكانيكية MEP',
        icon: Cpu,
        accent: 'from-teal-500 to-emerald-600',
      },
      {
        key: 'commercial-bid',
        moduleKey: 'erp_overheads',
        path: '/erp/commercial-bid',
        stepNum: '4',
        labelEn: '4. Commercial Overheads & Bid Price',
        labelAr: '٤. المصاريف غير المباشرة وسعر العطاء',
        icon: TrendingUp,
        accent: 'from-emerald-600 to-teal-700',
      },
      {
        key: 'proposals',
        moduleKey: 'erp_geometry',
        path: '/erp/proposals',
        stepNum: '5',
        labelEn: '5. ERP Proposals & Phases Setup',
        labelAr: '٥. إعداد مراحل المناقصة',
        icon: FileSpreadsheet,
        accent: 'from-pzone-navy to-pzone-teal',
      },
      {
        key: 'database',
        moduleKey: 'catalog_fx',
        path: '/erp/database',
        stepNum: '6',
        labelEn: '6. Master Catalog & Database',
        labelAr: '٦. الكتالوج وقاعدة البيانات',
        icon: Database,
        accent: 'from-slate-700 to-slate-900',
      },
    ];
    return all.filter((s) => canViewModule(user, s.moduleKey));
  }, [user]);

  return (
    <LookupProvider>
      <div className="space-y-4 pb-12" dir="ltr">
        {/* Top Unified Tender Log <-> Intelligent Tendering ERP Context & Two-Way Sync Bar */}
        <div className="rounded-3xl bg-gradient-to-r from-[#16234E] via-[#0B152C] to-[#070D1D] text-white border border-cyan-400/25 shadow-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
            {/* Left: Active Tender Selector & Back to Tender Log */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  navigate(matchedLogTender ? `/tenders/${matchedLogTender.id}` : '/tenders')
                }
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-pzone-cyan" />
                <span>{isAr ? 'العودة لسجل المناقصات' : 'Back to Tender Log'}</span>
              </button>

              <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-pzone-teal/20 border border-cyan-400/30">
                <Sparkles className="w-4 h-4 text-pzone-cyan shrink-0" />
                <div className="text-xs">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-200/80 block">
                    {isAr ? 'محرك التسعير الهندسي الذكي (ERP)' : 'Active Intelligent Tendering Proposal'}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Select Active Tender for Intelligent Tendering"
                      value={matchedLogTender?.id || ''}
                      onChange={(e) => void handleSelectLogTender(e.target.value)}
                      className="bg-transparent text-white font-mono font-black text-xs sm:text-sm focus:outline-none cursor-pointer max-w-[260px] sm:max-w-[380px] truncate"
                    >
                      {latestTenders.length === 0 ? (
                        <option value="" className="bg-slate-900 text-white">
                          {activeCtx
                            ? `${activeCtx.proposalCode} — ${activeCtx.proposalName}`
                            : 'Select Proposal...'}
                        </option>
                      ) : (
                        latestTenders.map((t) => (
                          <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                            {t.proposal_code} — {t.proposal_name} ({t.owner})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Live Cost Telemetry & Two-Way Sync Button */}
            <div className="flex flex-wrap items-center gap-2.5">
              {matchedLogTender && (
                <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-white/[0.07] border border-white/15 font-mono text-xs">
                  <div>
                    <span className="text-[9px] uppercase text-amber-300 block">Civil</span>
                    <strong className="text-white">
                      {(matchedLogTender.civil_cost || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="h-6 w-px bg-white/15" />
                  <div>
                    <span className="text-[9px] uppercase text-teal-300 block">Mech</span>
                    <strong className="text-white">
                      {(matchedLogTender.mechanical_cost || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="h-6 w-px bg-white/15" />
                  <div>
                    <span className="text-[9px] uppercase text-pink-300 block">Elec</span>
                    <strong className="text-white">
                      {(matchedLogTender.electrical_cost || 0).toLocaleString()}
                    </strong>
                  </div>
                  <div className="h-6 w-px bg-white/15" />
                  <div>
                    <span className="text-[9px] uppercase text-emerald-300 block">Total Bid</span>
                    <strong className="text-emerald-300 font-black">
                      {(matchedLogTender.tender_total_price || 0).toLocaleString()} EGP
                    </strong>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={isSyncing}
                onClick={() => void handleManualTwoWaySync()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pzone-teal to-pzone-seagreen hover:opacity-95 text-white text-xs font-black shadow-lg shadow-pzone-teal/30 border border-white/20 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isAr ? 'مزامنة الأسعار مع سجل المناقصات' : 'Sync BOQ Prices to Tender Log'}
                </span>
              </button>
            </div>
          </div>

          {/* Intelligent Tendering Stepper Bar */}
          <div className="pt-3 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-1">
            {erpSteps.map((step) => {
              const Icon = step.icon;
              const isCurrent = activeStep === step.key;
              const stepAccess = getModuleAccess(user, step.moduleKey);
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => navigate(step.path)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
                    isCurrent
                      ? `bg-gradient-to-r ${step.accent} text-white shadow-md border border-white/25`
                      : 'bg-white/5 hover:bg-white/12 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{isAr ? step.labelAr : step.labelEn}</span>
                  {stepAccess === 'view' && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/25 text-sky-200 border border-sky-400/30 text-[9px] font-mono uppercase">
                      View
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* View-Only Coordination Banner */}
        {isCurrentStepReadOnly && (
          <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/35 text-sky-900 dark:text-sky-200 text-xs font-bold flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-sky-500 shrink-0" />
            <span>
              {isAr
                ? 'وضع العرض والتنسيق فقط: يمكنك استعراض المواصفات والمقايسات وتصدير الملفات للتنسيق الهندسي، بينما التعديل والحفظ مغلقان لدورك على هذه الوحدة.'
                : 'View-Only Coordination Mode: You can inspect specifications, BOQ items, and export sheets for coordination, while editing & saving are locked on this module.'}
            </span>
          </div>
        )}

        {/* Live Sync Toast Notification */}
        {syncToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{syncToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncToast(null)}
              className="px-2 py-0.5 rounded-lg hover:bg-black/10 text-[11px] font-black"
            >
              OK
            </button>
          </div>
        )}

        {/* Active Intelligent Tendering ERP Module */}
        <div
          className="w-full"
          onClickCapture={handleReadOnlyCapture}
          onSubmitCapture={handleReadOnlyCapture}
        >
          {activeStep === 'water-features' && (
            <WaterFeaturePortal onOpenDatabaseTable={handleOpenDatabaseTable} />
          )}

          {activeStep === 'structural-works' && (
            <StructuralPortal onOpenDatabaseTable={handleOpenDatabaseTable} />
          )}

          {activeStep === 'wf-electromechanical' && (
            <WaterFeatureElectromechanicalPortal onOpenDatabaseTable={handleOpenDatabaseTable} />
          )}

          {activeStep === 'commercial-bid' && (
            <CommercialBidPricePortal
              onOpenDatabaseTable={handleOpenDatabaseTable}
              onNavigate={handleErpNavigate}
            />
          )}

          {activeStep === 'proposals' && (
            <TenderPortal
              onOpenDatabaseTable={handleOpenDatabaseTable}
              onNavigate={handleErpNavigate}
            />
          )}

          {activeStep === 'database' && (
            <DatabaseWorkspace
              subPath={location.pathname.replace('/erp', '')}
              activeTable={activeTable}
              onNavigate={handleErpNavigate}
              onSelectTable={(tbl: string) => setSearchParams({ table: tbl })}
            />
          )}
        </div>
      </div>
    </LookupProvider>
  );
};

export default ErpWorkspacePage;
