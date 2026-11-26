import React from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Home, 
  Waves, 
  HardHat, 
  Cpu, 
  TrendingUp,
  Sun, 
  Moon,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { useLookup } from '../lib/lookupContext';
import { useTheme } from '../lib/themeContext';

export default function Navbar({ activePath = '/', onNavigate }) {
  const { isConnected } = useLookup() || {};
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const isLight = theme === 'light';
  const isDatabaseActive = activePath.startsWith('/database');
  const isWaterFeaturesActive = activePath === '/water-features' || activePath === '/technical-data';
  const isStructuralActive = activePath === '/structural-works' || activePath === '/structural' || activePath === '/civil-and-finishes' || activePath === '/civil-structural-and-finishes';
  const isWfMepActive = activePath === '/wf-electromechanical' || activePath === '/water-feature-electromechanical' || activePath === '/wf-mep' || activePath === '/mep-works';
  const isCommercialBidActive = activePath === '/commercial-bid' || activePath === '/overheads-and-bid-price' || activePath === '/bid-pricing' || activePath === '/commercial';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md shadow-xs transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Official Company Brand Logo */}
        <div 
          className="flex items-center gap-3.5 cursor-pointer py-1 group" 
          onClick={() => onNavigate('/')}
        >
          <img 
            src={isLight ? "/logo-black.png" : "/logo-white.png"} 
            alt="P.ZONE Logo" 
            className="h-9 sm:h-10 w-auto object-contain max-w-[170px] sm:max-w-[210px] transition-transform duration-200 group-hover:scale-[1.02]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/logo-icon.png";
            }}
          />
          <div className="hidden xl:block pl-3 border-l border-slate-200 dark:border-slate-800">
            <h1 className="text-xs font-black tracking-tight text-slate-900 dark:text-slate-100">
              Intelligent Tendering System
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              ERP Engineering Estimation Engine
            </p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto">
          
          {/* 1. Launchpad */}
          <button
            onClick={() => onNavigate('/')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activePath === '/'
                ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 font-black shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Launchpad</span>
          </button>

          {/* 2. Tender Log */}
          <button
            onClick={() => onNavigate('/tenders')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
              activePath === '/tenders'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-black shadow-md shadow-cyan-900/20'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Tender Log</span>
          </button>

          {/* 3. Water Features & Pump Rooms Portal */}
          <button
            onClick={() => onNavigate('/water-features')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
              isWaterFeaturesActive
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-black shadow-md shadow-cyan-900/20'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Waves className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span>Water Features & PR</span>
          </button>

          {/* 4. Civil Structural and Finishes Works Portal */}
          <button
            onClick={() => onNavigate('/structural-works')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
              isStructuralActive
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black shadow-md shadow-amber-900/20'
                : 'text-slate-700 dark:text-slate-300 hover:text-amber-900 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <HardHat className="w-4 h-4 text-amber-500" />
            <span className="font-bold">Civil & Finishes</span>
          </button>

          {/* 5. Water Feature Electromechanical Portal */}
          <button
            onClick={() => onNavigate('/wf-electromechanical')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
              isWfMepActive
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black shadow-md shadow-teal-900/20'
                : 'text-slate-700 dark:text-slate-300 hover:text-teal-900 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40'
            }`}
          >
            <Cpu className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            <span className="font-bold">WF Electromechanical</span>
          </button>

          {/* 6. Commercial Overheads & Bid Price Setting Portal */}
          <button
            onClick={() => onNavigate('/commercial-bid')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
              isCommercialBidActive
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black shadow-md shadow-emerald-900/20'
                : 'text-slate-700 dark:text-slate-300 hover:text-emerald-900 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="font-bold">Commercial & Bid Price</span>
          </button>

          {/* 7. Database Architecture (Admin Only) */}
          {user?.isAdmin && (
            <>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
              <button
                onClick={() => onNavigate('/database/explorer')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isDatabaseActive
                    ? 'bg-cyan-50 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-300 font-black border border-cyan-200 dark:border-cyan-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
                title="Database Architecture Workspace (Admin Only)"
              >
                <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="hidden xl:inline">Database</span>
              </button>
            </>
          )}

        </nav>

        {/* Right Controls: Theme Switcher, Status, User Profile & Logout */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition cursor-pointer shadow-xs"
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-cyan-400" />}
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono shadow-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-slate-700 dark:text-slate-400 font-bold">{isConnected ? 'Supabase Live' : 'Connecting'}</span>
          </div>

          {/* User Profile Pill & Logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-600 text-white font-mono text-[10px] font-black flex items-center justify-center shadow-xs">
                  {user.avatar || 'PZ'}
                </span>
                <div className="text-left">
                  <span className="text-xs font-black text-slate-900 dark:text-slate-100 block leading-tight truncate max-w-[100px]">
                    {user.name || user.username}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold block leading-tight">
                    {user.badge || 'USER'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  logout();
                  if (onNavigate) onNavigate('/');
                }}
                className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer shadow-xs"
                title="Log Out of Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
}
