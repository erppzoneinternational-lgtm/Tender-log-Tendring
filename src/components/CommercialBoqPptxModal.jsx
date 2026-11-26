import React, { useMemo, useState } from 'react';
import {
  X,
  Download,
  Presentation,
  Layers,
  CheckCircle2,
  Table as TableIcon,
  SlidersHorizontal,
  Boxes,
  Sparkles,
  RefreshCw,
  Palette,
  LayoutTemplate,
} from 'lucide-react';
import {
  PPTX_TEMPLATE_THEMES,
  buildCommercialBoqPresentationModel,
  generateCommercialBoqPptx,
} from '../lib/commercialPptxGenerator';

const TABLE_MODE_OPTIONS = [
  {
    id: 'full_boq',
    title: 'Full BOQ Table',
    desc: 'BOQ Title, Discipline, QTY, Unit, Unit Selling Price & Total Selling Price',
  },
  {
    id: 'all_lumpsum',
    title: 'All Quantities as Lump Sum (L.S)',
    desc: 'Shows every BOQ line with QTY = 1, Unit = L.S, Unit Selling Price & Total Selling Price',
  },
  {
    id: 'qty_and_total',
    title: 'Quantity & Total Selling Price Only',
    desc: 'Shows BOQ Title, Discipline, QTY, Unit & Total Selling Price (hides Unit Price)',
  },
  {
    id: 'title_and_total',
    title: 'BOQ Title & Selling Price Only',
    desc: 'Shows BOQ Title, Discipline & Total Selling Price only (hides QTY, Unit & Unit Price)',
  },
];

const TEMPLATE_OPTIONS = Object.values(PPTX_TEMPLATE_THEMES);

function fmtMoney(val) {
  return Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtQty(val) {
  const num = Number(val || 0);
  if (Number.isInteger(num)) return num.toLocaleString('en-US');
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function CommercialBoqPptxModal({
  isOpen,
  onClose,
  tender,
  phases = [],
  breakdownItems = [],
  calculatedFinancials = {},
  boqWorkTypes = [],
  catalogItems = [],
  templateId: controlledTemplateId,
  setTemplateId: setControlledTemplateId,
  tableMode: controlledTableMode,
  setTableMode: setControlledTableMode,
  pumpRoomSeparate: controlledPumpRoomSeparate,
  setPumpRoomSeparate: setControlledPumpRoomSeparate,
  granularity: controlledGranularity,
  setGranularity: setControlledGranularity,
  includeCoverSlide: controlledIncludeCoverSlide,
  setIncludeCoverSlide: setControlledIncludeCoverSlide,
  includeSummarySlide: controlledIncludeSummarySlide,
  setIncludeSummarySlide: setControlledIncludeSummarySlide,
}) {
  const [localTemplateId, setLocalTemplateId] = useState('executive_navy');
  const [localTableMode, setLocalTableMode] = useState('full_boq');
  const [localPumpRoomSeparate, setLocalPumpRoomSeparate] = useState(true);
  const [localGranularity, setLocalGranularity] = useState('work_types');
  const [localIncludeCoverSlide, setLocalIncludeCoverSlide] = useState(true);
  const [localIncludeSummarySlide, setLocalIncludeSummarySlide] = useState(true);
  const [activeSlideTab, setActiveSlideTab] = useState('summary'); // 'cover' | 'summary' | component.key
  const [isExporting, setIsExporting] = useState(false);

  const templateId = controlledTemplateId ?? localTemplateId;
  const setTemplateId = setControlledTemplateId ?? setLocalTemplateId;
  const tableMode = controlledTableMode ?? localTableMode;
  const setTableMode = setControlledTableMode ?? setLocalTableMode;
  const pumpRoomSeparate = controlledPumpRoomSeparate ?? localPumpRoomSeparate;
  const setPumpRoomSeparate = setControlledPumpRoomSeparate ?? setLocalPumpRoomSeparate;
  const granularity = controlledGranularity ?? localGranularity;
  const setGranularity = setControlledGranularity ?? setLocalGranularity;
  const includeCoverSlide = controlledIncludeCoverSlide ?? localIncludeCoverSlide;
  const setIncludeCoverSlide = setControlledIncludeCoverSlide ?? setLocalIncludeCoverSlide;
  const includeSummarySlide = controlledIncludeSummarySlide ?? localIncludeSummarySlide;
  const setIncludeSummarySlide = setControlledIncludeSummarySlide ?? setLocalIncludeSummarySlide;

  const activeTheme =
    PPTX_TEMPLATE_THEMES[templateId] || PPTX_TEMPLATE_THEMES.executive_navy;

  const model = useMemo(
    () =>
      buildCommercialBoqPresentationModel({
        tender,
        phases,
        breakdownItems,
        calculatedFinancials,
        boqWorkTypes,
        catalogItems,
        options: {
          tableMode,
          pumpRoomSeparate,
          granularity,
          currency: 'EGP',
        },
      }),
    [
      tender,
      phases,
      breakdownItems,
      calculatedFinancials,
      boqWorkTypes,
      catalogItems,
      tableMode,
      pumpRoomSeparate,
      granularity,
    ]
  );

  if (!isOpen) return null;

  const selectedComponent =
    activeSlideTab === 'cover' || activeSlideTab === 'summary'
      ? null
      : model.components.find((c) => c.key === activeSlideTab) ||
        model.components[0] ||
        null;

  const effectiveTab =
    activeSlideTab === 'cover'
      ? 'cover'
      : activeSlideTab === 'summary'
        ? 'summary'
        : selectedComponent?.key || 'summary';

  const headerBgHex = `#${activeTheme.headerBgOverride || activeTheme.navy}`;
  const headerTextHex = `#${activeTheme.headerText || 'FFFFFF'}`;
  const headerSubHex = `#${activeTheme.headerSub || '94A3B8'}`;
  const headerBadgeHex = `#${activeTheme.headerBadge || '5EEAD4'}`;
  const tableHeadHex = `#${activeTheme.navy}`;
  const ribbonHex = `#${activeTheme.teal}`;
  const totalAccentHex = `#${activeTheme.emerald}`;

  const handleDownloadPptx = async () => {
    setIsExporting(true);
    try {
      await generateCommercialBoqPptx(model, {
        includeCoverSlide,
        includeSummarySlide,
        templateId,
        download: true,
      });
    } catch (err) {
      console.error('Failed to generate Commercial BOQ PPTX:', err);
      alert('Failed to generate PowerPoint file. Please check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const modeLabelMap = {
    full_boq: 'Full BOQ Table (Title, Discipline, QTY, Unit, Unit Price & Total)',
    all_lumpsum: 'Lump Sum BOQ Table (All Quantities as 1 L.S)',
    qty_and_total: 'Quantity & Total Selling Price Table',
    title_and_total: 'BOQ Title & Total Selling Price Table',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-7xl max-h-[94vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border-b border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <Presentation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Master Breakdown Sync
                </span>
                <span className="text-[11px] font-mono text-slate-300">
                  {model.totalMasterBreakdownItems} Master Breakdown Rows (`proposal_breakdown_items`)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Commercial BOQ Presentation Studio (.PPTX) — {model.proposalCode}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPptx}
              disabled={isExporting || model.totalMasterBreakdownItems === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-900/40 transition cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Download PowerPoint (.PPTX)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body: Left Options Sidebar + Right Live Slide Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* LEFT 4 COLS: TEMPLATE DESIGN & BOQ OPTIONS */}
          <div className="lg:col-span-4 p-5 space-y-5 bg-slate-50/70 dark:bg-slate-950/40 overflow-y-auto">
            {/* 1. Slide Template Design Theme */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-teal-500" />
                <span>1. PPTX Slide Template Design</span>
              </label>
              <div className="space-y-2">
                {TEMPLATE_OPTIONS.map((tpl) => {
                  const active = templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setTemplateId(tpl.id)}
                      className={`w-full text-left p-2.5 rounded-2xl border transition cursor-pointer ${
                        active
                          ? 'bg-teal-500/10 border-teal-500 ring-1 ring-teal-500/50'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center -space-x-1">
                            {tpl.swatches.map((sw, idx) => (
                              <span
                                key={idx}
                                className="w-3.5 h-3.5 rounded-full border border-white dark:border-slate-800 shadow-2xs"
                                style={{ backgroundColor: sw }}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {tpl.name}
                          </span>
                        </div>
                        {active && (
                          <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 pl-9">
                        {tpl.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Table Display Mode */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                <span>2. BOQ Table Display Option</span>
              </label>
              <div className="space-y-2">
                {TABLE_MODE_OPTIONS.map((opt) => {
                  const active = tableMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTableMode(opt.id)}
                      className={`w-full text-left p-2.5 rounded-2xl border transition cursor-pointer ${
                        active
                          ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {opt.title}
                        </span>
                        {active && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Pump Room Separation Option */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-500" />
                <span>3. Pump Room BOQs Option</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPumpRoomSeparate(true)}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                    pumpRoomSeparate
                      ? 'bg-teal-500/10 border-teal-500 ring-1 ring-teal-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Show Separately
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Dedicated Pump Room slide & summary row
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPumpRoomSeparate(false)}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                    !pumpRoomSeparate
                      ? 'bg-teal-500/10 border-teal-500 ring-1 ring-teal-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Include in Feature
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Merge Pump Room into Water Feature BOQs
                  </span>
                </button>
              </div>
            </div>

            {/* 4. BOQ Row Granularity */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                <span>4. BOQ Row Granularity</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGranularity('work_types')}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                    granularity === 'work_types'
                      ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Client BOQ Titles
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    44 Official Work Types
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setGranularity('line_items')}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                    granularity === 'line_items'
                      ? 'bg-indigo-500/10 border-indigo-500 ring-1 ring-indigo-500/50'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Detailed Breakdown
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    All Master Line Items
                  </span>
                </button>
              </div>
            </div>

            {/* 5. Slide Inclusion Toggles */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Included Deck Slides
              </span>
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCoverSlide}
                  onChange={(e) => setIncludeCoverSlide(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span>Slide 1: Executive Cover Slide</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSummarySlide}
                  onChange={(e) => setIncludeSummarySlide(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span>Slide 2: Components & Disciplines Summary</span>
              </label>
            </div>
          </div>

          {/* RIGHT 8 COLS: LIVE SLIDE PREVIEW CANVAS */}
          <div className="lg:col-span-8 p-5 sm:p-6 space-y-4 bg-white dark:bg-slate-900 overflow-y-auto">
            {/* Slide Selector Tabs */}
            <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveSlideTab('cover')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    effectiveTab === 'cover'
                      ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Cover Slide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSlideTab('summary')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    effectiveTab === 'summary'
                      ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Summary Table ({model.summaryRows.length})</span>
                </button>

                {model.components.map((comp) => (
                  <button
                    key={comp.key}
                    type="button"
                    onClick={() => setActiveSlideTab(comp.key)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      effectiveTab === comp.key
                        ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 text-teal-500" />
                    <span>{comp.title}</span>
                    <span className="text-[10px] font-mono opacity-75">
                      ({comp.rows.length})
                    </span>
                  </button>
                ))}
              </div>

              <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                Total Offer: {fmtMoney(model.totals.grandTotal)} {model.currency}
              </span>
            </div>

            {model.totalMasterBreakdownItems === 0 ? (
              <div className="py-16 text-center space-y-2 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  No breakdown items found in <code className="font-mono">proposal_breakdown_items</code> for this proposal yet.
                </p>
                <p className="text-xs text-slate-400">
                  Save Civil, Finishes, or Electromechanical BOQs first to generate the commercial presentation.
                </p>
              </div>
            ) : effectiveTab === 'cover' ? (
              /* SLIDE PREVIEW 0: COVER SLIDE */
              <div
                className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg"
                style={{ backgroundColor: `#${activeTheme.coverBg}` }}
              >
                <div className="h-2" style={{ backgroundColor: ribbonHex }} />
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
                  <div className="md:col-span-8 p-7 sm:p-9 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <span
                        className="text-[11px] font-black uppercase tracking-widest block"
                        style={{ color: ribbonHex }}
                      >
                        P.ZONE COMMERCIAL BILL OF QUANTITIES
                      </span>
                      <h3
                        className="text-xl sm:text-2xl font-black leading-tight"
                        style={{ color: `#${activeTheme.coverText}` }}
                      >
                        {model.proposalTitle}
                      </h3>
                      <div
                        className="font-mono text-sm font-black"
                        style={{ color: ribbonHex }}
                      >
                        Proposal Ref: {model.proposalCode}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      {[
                        ['Client / Stakeholders:', model.clientName],
                        ['Presentation Mode:', modeLabelMap[tableMode]],
                        [
                          'Pump Room Structure:',
                          pumpRoomSeparate
                            ? 'Shown as Separate Component BOQ(s)'
                            : 'Included Inside Water Feature BOQ(s)',
                        ],
                        ['Date Issued:', model.dateStr],
                      ].map(([k, v]) => (
                        <div key={k} className="grid grid-cols-12 gap-2">
                          <span
                            className="col-span-4 font-bold"
                            style={{ color: `#${activeTheme.coverSub}` }}
                          >
                            {k}
                          </span>
                          <span
                            className="col-span-8 font-black"
                            style={{ color: `#${activeTheme.coverText}` }}
                          >
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div
                    className="md:col-span-4 p-6 space-y-3 border-t md:border-t-0 md:border-l"
                    style={{
                      backgroundColor: `#${activeTheme.coverPanel}`,
                      borderColor: ribbonHex,
                    }}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                      COMMERCIAL OFFER SUMMARY
                    </span>
                    {[
                      {
                        label: 'TOTAL COMMERCIAL OFFER',
                        val: `${fmtMoney(model.totals.grandTotal)} ${model.currency}`,
                        border: '#10B981',
                        highlight: true,
                      },
                      {
                        label: 'CIVIL & FINISHES SCOPE',
                        val: `${fmtMoney(model.totals.civil)} ${model.currency}`,
                        border: '#F59E0B',
                      },
                      {
                        label: 'MECHANICAL SCOPE',
                        val: `${fmtMoney(model.totals.mechanical)} ${model.currency}`,
                        border: '#14B8A6',
                      },
                      {
                        label: 'ELECTRICAL SCOPE',
                        val: `${fmtMoney(model.totals.electrical)} ${model.currency}`,
                        border: '#818CF8',
                      },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="p-3 rounded-xl border"
                        style={{
                          backgroundColor: `#${activeTheme.navy}`,
                          borderColor: kpi.border,
                        }}
                      >
                        <span className="text-[10px] font-bold text-slate-400 block">
                          {kpi.label}
                        </span>
                        <span
                          className={`font-mono text-sm font-black block mt-0.5 ${
                            kpi.highlight ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {kpi.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : effectiveTab === 'summary' ? (
              /* SLIDE PREVIEW 1: EXECUTIVE SUMMARY TABLE */
              <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg bg-white">
                {/* Simulated 16:9 Slide Top Chrome */}
                <div className="h-1.5" style={{ backgroundColor: ribbonHex }} />
                <div
                  className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200"
                  style={{ backgroundColor: headerBgHex }}
                >
                  <div>
                    <div
                      className="text-xs font-black tracking-wide"
                      style={{ color: headerTextHex }}
                    >
                      P.ZONE COMMERCIAL BOQ OFFER | {model.proposalCode} — {model.proposalTitle}
                    </div>
                    <div className="text-[11px]" style={{ color: headerSubHex }}>
                      Client: {model.clientName} • Currency: {model.currency} • Date: {model.dateStr}
                    </div>
                  </div>
                  <span
                    className="text-xs font-mono font-bold"
                    style={{ color: headerBadgeHex }}
                  >
                    {model.summaryRows.length} Component(s) Summary
                  </span>
                </div>

                <div className="p-5 space-y-3 bg-white text-slate-900">
                  <div>
                    <h3
                      className="text-sm font-black"
                      style={{ color: tableHeadHex }}
                    >
                      Executive Commercial Summary by Component & Discipline
                    </h3>
                    <p className="text-xs text-slate-500">
                      {pumpRoomSeparate
                        ? 'Pump Room BOQs are itemized as separate component row(s) — click any component row to inspect its BOQ slide'
                        : 'Pump Room BOQs are included within Water Feature component row(s) — click any component row to inspect its BOQ slide'}
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr
                          className="text-white text-[10px] uppercase tracking-wider font-black"
                          style={{ backgroundColor: tableHeadHex }}
                        >
                          <th className="py-2.5 px-3 text-center w-10">#</th>
                          <th className="py-2.5 px-4">Component / Phase</th>
                          <th className="py-2.5 px-3 text-right">Civil Selling ({model.currency})</th>
                          <th className="py-2.5 px-3 text-right">Mechanical Selling ({model.currency})</th>
                          <th className="py-2.5 px-3 text-right">Electrical Selling ({model.currency})</th>
                          <th className="py-2.5 px-4 text-right">Total Selling ({model.currency})</th>
                          <th className="py-2.5 px-3 text-center">Share %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {model.summaryRows.map((r, i) => (
                          <tr
                            key={r.index}
                            onClick={() => {
                              const target = model.components[r.index - 1];
                              if (target) setActiveSlideTab(target.key);
                            }}
                            style={{
                              backgroundColor:
                                i % 2 === 0 ? '#FFFFFF' : `#${activeTheme.rowAlt}`,
                            }}
                            className="hover:opacity-90 cursor-pointer transition"
                            title="Click to preview this component's BOQ slide"
                          >
                            <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                              {r.index}
                            </td>
                            <td className="py-2.5 px-4 font-black text-slate-900">
                              {r.componentTitle}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                              {r.civilSelling > 0 ? fmtMoney(r.civilSelling) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-700">
                              {r.mechanicalSelling > 0 ? fmtMoney(r.mechanicalSelling) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                              {r.electricalSelling > 0 ? fmtMoney(r.electricalSelling) : '—'}
                            </td>
                            <td
                              className="py-2.5 px-4 text-right font-mono font-black"
                              style={{
                                backgroundColor: `#${activeTheme.emeraldLight}`,
                                color: totalAccentHex,
                              }}
                            >
                              {fmtMoney(r.totalSelling)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600">
                              {r.sharePct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr
                          className="text-white font-black text-xs"
                          style={{ backgroundColor: tableHeadHex }}
                        >
                          <td className="py-3 px-3 text-center text-teal-300">Σ</td>
                          <td className="py-3 px-4 uppercase">TOTAL COMMERCIAL OFFER</td>
                          <td className="py-3 px-3 text-right font-mono text-amber-300">
                            {fmtMoney(model.totals.civil)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-teal-300">
                            {fmtMoney(model.totals.mechanical)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-indigo-300">
                            {fmtMoney(model.totals.electrical)}
                          </td>
                          <td
                            className="py-3 px-4 text-right font-mono text-white"
                            style={{ backgroundColor: totalAccentHex }}
                          >
                            {fmtMoney(model.totals.grandTotal)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono">100.0%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* SLIDE PREVIEW 2..N: SELECTED COMPONENT DISCIPLINE BOQ SLIDE */
              selectedComponent && (
                <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg bg-white">
                  <div className="h-1.5" style={{ backgroundColor: ribbonHex }} />
                  <div
                    className="px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200"
                    style={{ backgroundColor: headerBgHex }}
                  >
                    <div>
                      <div
                        className="text-xs font-black tracking-wide"
                        style={{ color: headerTextHex }}
                      >
                        P.ZONE COMMERCIAL BOQ OFFER | {model.proposalCode} — {model.proposalTitle}
                      </div>
                      <div className="text-[11px]" style={{ color: headerSubHex }}>
                        Client: {model.clientName} • Currency: {model.currency} • Date: {model.dateStr}
                      </div>
                    </div>
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: headerBadgeHex }}
                    >
                      Component {selectedComponent.index} of {model.components.length}
                    </span>
                  </div>

                  <div className="p-5 space-y-3 bg-white text-slate-900">
                    {/* Component Header Banner */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3
                          className="text-sm font-black"
                          style={{ color: tableHeadHex }}
                        >
                          {selectedComponent.title}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500">
                          Civil: {fmtMoney(selectedComponent.civilSelling)} | Mechanical:{' '}
                          {fmtMoney(selectedComponent.mechanicalSelling)} | Electrical:{' '}
                          {fmtMoney(selectedComponent.electricalSelling)} {model.currency}
                        </p>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Component Total Selling Price
                        </span>
                        <span
                          className="text-sm font-black"
                          style={{ color: totalAccentHex }}
                        >
                          {fmtMoney(selectedComponent.totalSelling)} {model.currency}
                        </span>
                      </div>
                    </div>

                    {/* Component BOQ Table matching active `tableMode` */}
                    <div className="overflow-x-auto max-h-[430px] rounded-xl border border-slate-200">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 z-10">
                          <tr
                            className="text-white text-[10px] uppercase tracking-wider font-black"
                            style={{ backgroundColor: tableHeadHex }}
                          >
                            <th className="py-2.5 px-3 text-center w-10">#</th>
                            <th className="py-2.5 px-4">BOQ Title</th>
                            <th className="py-2.5 px-3 text-center">Discipline</th>
                            {tableMode !== 'title_and_total' && (
                              <>
                                <th className="py-2.5 px-3 text-right">QTY</th>
                                <th className="py-2.5 px-3 text-center">Unit</th>
                              </>
                            )}
                            {(tableMode === 'full_boq' || tableMode === 'all_lumpsum') && (
                              <th className="py-2.5 px-3 text-right">
                                Unit Selling ({model.currency})
                              </th>
                            )}
                            <th className="py-2.5 px-4 text-right">
                              Total Selling ({model.currency})
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedComponent.rows.map((r, idx) => (
                            <tr
                              key={`${r.boqTitle}-${idx}`}
                              style={{
                                backgroundColor:
                                  idx % 2 === 0 ? '#FFFFFF' : `#${activeTheme.rowAlt}`,
                              }}
                            >
                              <td className="py-2 px-3 text-center font-mono text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-4 font-bold text-slate-900">
                                {r.boqTitle}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    r.discipline === 'Electrical'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : r.discipline === 'Mechanical'
                                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}
                                >
                                  {r.discipline}
                                </span>
                              </td>
                              {tableMode !== 'title_and_total' && (
                                <>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">
                                    {fmtQty(r.qty)}
                                  </td>
                                  <td className="py-2 px-3 text-center font-mono text-slate-500">
                                    {r.unit}
                                  </td>
                                </>
                              )}
                              {(tableMode === 'full_boq' || tableMode === 'all_lumpsum') && (
                                <td className="py-2 px-3 text-right font-mono text-slate-700">
                                  {fmtMoney(r.unitSellingPrice)}
                                </td>
                              )}
                              <td
                                className="py-2 px-4 text-right font-mono font-black"
                                style={{
                                  backgroundColor: `#${activeTheme.emeraldLight}`,
                                  color: totalAccentHex,
                                }}
                              >
                                {fmtMoney(r.totalSellingPrice)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr
                            className="text-white font-black text-xs"
                            style={{ backgroundColor: tableHeadHex }}
                          >
                            <td
                              colSpan={
                                tableMode === 'full_boq' || tableMode === 'all_lumpsum'
                                  ? 6
                                  : tableMode === 'qty_and_total'
                                    ? 5
                                    : 3
                              }
                              className="py-2.5 px-4 text-right uppercase"
                            >
                              TOTAL — {selectedComponent.title}
                            </td>
                            <td
                              className="py-2.5 px-4 text-right font-mono text-white"
                              style={{ backgroundColor: totalAccentHex }}
                            >
                              {fmtMoney(selectedComponent.totalSelling)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
