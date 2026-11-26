import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';

interface LiveNotifToast {
  id: string;
  title: string;
  body: string;
  url: string;
  proposalCode?: string | null;
}

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const [syncError, setSyncError] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<LiveNotifToast | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        setSyncError(detail);
      }
    };
    window.addEventListener('pzone-cloud-sync-error', handler);
    return () => window.removeEventListener('pzone-cloud-sync-error', handler);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onNotif = (e: Event) => {
      const detail = (e as CustomEvent<LiveNotifToast>).detail;
      if (!detail) return;
      setLiveToast(detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setLiveToast(null), 7000);
    };
    window.addEventListener('pzone-live-notif-toast', onNotif);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('pzone-live-notif-toast', onNotif);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex bg-background text-foreground overflow-x-clip">
      {/* Ambient Aquatic Caustic Canvas & Bioluminescent Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-hydro-grid">
        <div className="absolute -top-36 -start-36 w-[540px] h-[540px] rounded-full bg-pzone-teal/15 dark:bg-pzone-cyan/10 blur-[130px] animate-float-slow" />
        <div
          className="absolute top-1/3 -end-40 w-[480px] h-[480px] rounded-full bg-pzone-magenta/10 dark:bg-pzone-magenta/12 blur-[140px] animate-float-slow"
          style={{ animationDelay: '-5s' }}
        />
        <div
          className="absolute -bottom-32 start-1/3 w-[520px] h-[520px] rounded-full bg-pzone-seagreen/12 dark:bg-pzone-navy/40 blur-[130px] animate-float-slow"
          style={{ animationDelay: '-9s' }}
        />

        {/* Subtle Flowing Water Caustic SVG Wave at Bottom */}
        <svg
          className="absolute bottom-0 inset-x-0 w-full h-32 opacity-20 dark:opacity-25 text-pzone-teal"
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
        >
          <path
            fill="currentColor"
            d="M0,96L60,90.7C120,85,240,75,360,80C480,85,600,107,720,117.3C840,128,960,128,1080,112C1200,96,1320,64,1380,48L1440,32L1440,160L1380,160C1320,160,1200,160,1080,160C960,160,840,160,720,160C600,160,480,160,360,160C240,160,120,160,60,160L0,160Z"
          />
        </svg>
      </div>

      <Sidebar />
      <div className="relative flex-1 flex flex-col min-w-0">
        <Topbar />
        {syncError && (
          <div
            role="alert"
            className="mx-3 sm:mx-6 lg:mx-7 mt-3 px-4 py-3 rounded-2xl bg-rose-950/95 border border-rose-500/50 text-rose-100 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{syncError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-rose-200 cursor-pointer"
              aria-label="Dismiss sync error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <main className="relative z-10 flex-1 p-3 sm:p-6 lg:p-7 pb-24 lg:pb-7 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      {liveToast && (
        <div
          role="status"
          className="fixed bottom-5 end-5 z-50 w-[min(92vw,380px)] rounded-2xl bg-slate-900/95 dark:bg-[#0D162B]/95 border border-pzone-teal/50 text-white p-4 shadow-2xl backdrop-blur-md flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-pzone-teal/20 border border-pzone-teal/40 flex items-center justify-center shrink-0 mt-0.5">
            <Bell className="w-4 h-4 text-pzone-cyan animate-bounce" />
          </div>
          <div
            onClick={() => {
              const dest = liveToast.url || '/notifications';
              setLiveToast(null);
              navigate(dest);
            }}
            className="flex-1 min-w-0 cursor-pointer space-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">
                {liveToast.title}
              </span>
              {liveToast.proposalCode && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-pzone-teal/25 text-pzone-cyan shrink-0">
                  {liveToast.proposalCode}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-2">
              {liveToast.body}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLiveToast(null)}
            aria-label="Dismiss notification"
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <CommandPalette />
    </div>
  );
};
