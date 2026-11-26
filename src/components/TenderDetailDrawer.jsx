import React from 'react';
import { Layers, X, Edit3 } from 'lucide-react';
import { formatDateTimeCairo } from '../lib/erpBridge';

export default function TenderDetailDrawer({
  tender,
  phases = [],
  onClose,
  onEdit,
  getResolvedLabel
}) {
  if (!tender) return null;

  const tenderPhases = phases.filter(p => p.tender_log_id === tender.id);
  const clientName = getResolvedLabel('clients', tender.client_id) || tender.owner || '—';
  const govName = getResolvedLabel('governorates', tender.governorate) || '';
  const regName = getResolvedLabel('regions', tender.region) || '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800/60 px-2.5 py-0.5 rounded-md">
                {tender.proposal_number || `SP.${tender.proposal_year}.01`}
              </span>
              <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                {tender.proposal_status}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-md">
              {tender.proposal_title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(tender)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Proposal</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 block mb-0.5">Client / Owner</span>
              <strong className="text-slate-800 dark:text-slate-200">{clientName}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">P.ZONE Role</span>
              <strong className="text-indigo-700 dark:text-indigo-300">{tender.pzone_role || 'Sub Contractor'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Main Contractor</span>
              <strong className="text-slate-800 dark:text-slate-200">{tender.main_contractor || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Governorate & Region</span>
              <strong className="text-cyan-700 dark:text-cyan-300">
                {[govName, regName].filter(Boolean).join(' • ') || 'Egypt'}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Request Date</span>
              <strong className="text-slate-700 dark:text-slate-300 font-mono">{tender.proposal_request_date || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Target Submittal Date</span>
              <strong className="text-amber-700 dark:text-amber-400 font-mono">{tender.proposal_submittal_date || '—'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Created By (Egypt Time)</span>
              <strong className="text-slate-800 dark:text-slate-200 block">{tender.created_by || '—'}</strong>
              <span className="text-[10px] font-mono text-slate-500">{tender.created_at ? formatDateTimeCairo(tender.created_at) : '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-0.5">Updated By (Egypt Time)</span>
              <strong className="text-slate-800 dark:text-slate-200 block">{tender.updated_by || tender.created_by || '—'}</strong>
              <span className="text-[10px] font-mono text-slate-500">{tender.updated_at ? formatDateTimeCairo(tender.updated_at) : (tender.created_at ? formatDateTimeCairo(tender.created_at) : '—')}</span>
            </div>
          </div>

          {/* Project Scopes & Phases (Clean Read-Only Inspection) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Project Scopes & Phases ({tenderPhases.length})</span>
              </h3>
            </div>

            {/* List of existing phases formatted as clean cards */}
            <div className="space-y-2.5">
              {tenderPhases.map((phase, pIdx) => {
                const phaseScopes = (phase.scope_of_work || '').split(',').map(s => s.trim()).filter(Boolean);

                return (
                  <div key={phase.id} className="p-4 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800/90 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-mono text-[11px] font-bold flex items-center justify-center">
                          {pIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{phase.phase_title}</span>
                        <span className="text-[10px] font-mono text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-300 dark:border-cyan-800/40 font-semibold">
                          {phase.phase_full_title}
                        </span>
                      </div>

                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800">
                        {phase.component_type || 'Phase'}
                      </span>
                    </div>

                    {/* Trade Scope Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {phaseScopes.length > 0 ? (
                        phaseScopes.map((sc, scIdx) => {
                          let badgeColor = 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';
                          if (sc.includes('Civil')) badgeColor = 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/60 dark:text-blue-300';
                          else if (sc.includes('Finishes')) badgeColor = 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300';
                          else if (sc.includes('Mechanical')) badgeColor = 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-950/60 dark:text-cyan-300';
                          else if (sc.includes('Electrical')) badgeColor = 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-300';

                          return (
                            <span
                              key={scIdx}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${badgeColor}`}
                            >
                              ✓ {sc}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] italic text-slate-400">No scope specified</span>
                      )}
                    </div>
                  </div>
                );
              })}

              {tenderPhases.length === 0 && (
                <p className="text-xs italic text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  No phases defined for this proposal.
                </p>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-500">ID: {tender.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl transition cursor-pointer font-semibold"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
