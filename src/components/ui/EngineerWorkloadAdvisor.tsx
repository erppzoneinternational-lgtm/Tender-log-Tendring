import React from 'react';
import { BarChart3, Sparkles } from 'lucide-react';
import type { EngineerWorkloadSummary } from '@/lib/dataStore';
import type { UserRole } from '@/types/database';

export interface EngineerWorkloadAdvisorProps {
  summaries: EngineerWorkloadSummary[];
  title?: string;
  subtitle?: string;
  onQuickSelectEngineer?: (engineerId: string, role: UserRole) => void;
}

export const EngineerWorkloadAdvisor: React.FC<EngineerWorkloadAdvisorProps> = ({
  summaries,
  title = 'Engineer Workload & Next-Assignment Guide',
  subtitle = 'Live proposal counts per engineer to help assign the next proposal fairly.',
  onQuickSelectEngineer,
}) => {
  if (summaries.length === 0) return null;

  // Find lowest open load (Not Started + In Progress) per engineer role
  const minOpenByRole = new Map<UserRole, number>();
  for (const s of summaries) {
    const prev = minOpenByRole.get(s.engineer.role);
    if (prev === undefined || s.openCount < prev) {
      minOpenByRole.set(s.engineer.role, s.openCount);
    }
  }

  const sorted = [...summaries].sort((a, b) => {
    if (a.engineer.role !== b.engineer.role) {
      return a.engineer.role.localeCompare(b.engineer.role);
    }
    return a.openCount - b.openCount;
  });

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#1E2D3D] bg-slate-50/70 dark:bg-[#0B1218]/80 p-3.5 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-brand-500" />
            {title}
          </h4>
          {subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30">
            Not Started
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            In Progress
          </span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            Finished
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {sorted.map((s) => {
          const isLeastBusyInRole =
            minOpenByRole.get(s.engineer.role) === s.openCount;
          return (
            <div
              key={s.engineer.id}
              onClick={
                onQuickSelectEngineer
                  ? () => onQuickSelectEngineer(s.engineer.id, s.engineer.role)
                  : undefined
              }
              title={
                onQuickSelectEngineer
                  ? `Click to assign ${s.engineer.full_name} to their discipline`
                  : undefined
              }
              className={`rounded-lg border border-slate-200/80 dark:border-[#1E2D3D] bg-white dark:bg-[#111C28] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
                onQuickSelectEngineer
                  ? 'cursor-pointer hover:border-brand-500/60 hover:bg-brand-500/[0.03]'
                  : ''
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {s.engineer.full_name}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#0B1218] text-slate-500 dark:text-slate-400">
                    {s.engineer.team}
                  </span>
                  {isLeastBusyInRole && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      <Sparkles className="w-2.5 h-2.5" />
                      Recommended
                    </span>
                  )}
                  {s.overdueCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300">
                      {s.overdueCount} Overdue
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold shrink-0">
                <span
                  title="Not Started Proposals"
                  className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                >
                  NS: {s.notStartedCount}
                </span>
                <span
                  title="In Progress Proposals"
                  className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                >
                  IP: {s.inProgressCount}
                </span>
                <span
                  title="Finished Proposals"
                  className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                >
                  Fin: {s.finishedCount}
                </span>
                <span
                  title="Total Active Open Proposals (Not Started + In Progress)"
                  className={`px-2 py-0.5 rounded border ${
                    s.openCount === 0
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : s.openCount <= 2
                        ? 'bg-slate-100 dark:bg-[#0B1218] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#1E2D3D]'
                        : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  }`}
                >
                  Open: {s.openCount}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
