import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  RefreshCw, 
  Server,
  Zap,
  HardDrive
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SCHEMA_CATEGORIES, TABLES_CONFIG } from '../lib/schemaData';

export default function DatabaseHealth({ tableCounts, onRefreshAll, isRefreshing }) {
  const [latency, setLatency] = useState(null);
  const [lastChecked, setLastChecked] = useState(new Date());
  const [hasErpJwt, setHasErpJwt] = useState(false);

  const pingDatabase = async () => {
    const start = performance.now();
    try {
      const [{ data: sessionData }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('items').select('id', { head: true, count: 'exact' }),
      ]);
      const end = performance.now();
      setHasErpJwt(Boolean(sessionData?.session?.access_token));
      setLatency(Math.round(end - start));
      setLastChecked(new Date());
    } catch (e) {
      setLatency(-1);
    }
  };

  useEffect(() => {
    pingDatabase();
  }, []);

  const totalRecords = Object.values(tableCounts || {}).reduce((acc, curr) => acc + (typeof curr === 'number' ? curr : 0), 0);
  const totalTables = TABLES_CONFIG.length;
  const totalRelationships = TABLES_CONFIG.reduce((acc, t) => acc + (t.relations?.length || 0), 0);

  const largestTables = [...TABLES_CONFIG]
    .map(t => ({ ...t, count: tableCounts?.[t.name] || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="space-y-6 w-full">
      
      {/* Top Diagnostics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Status */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Database Status</p>
            <p className="text-lg font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
              <span>Operational</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">PostgREST v12 Live</p>
          </div>
        </div>

        {/* Latency */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Live Latency</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {latency !== null ? `${latency} ms` : 'Testing...'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Direct API Ping</p>
          </div>
        </div>

        {/* Total Tables */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Cataloged Tables</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {totalTables} Tables
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{totalRelationships} Relational Keys</p>
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Live Records</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
              {totalRecords.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Across all schemas</p>
          </div>
        </div>

      </div>

      {/* Database Connection & Endpoint Information */}
      <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Supabase Cloud Instance Details</h3>
          </div>

          <button
            onClick={() => {
              pingDatabase();
              if (onRefreshAll) onRefreshAll();
            }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 rounded-xl border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Re-Ping & Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Project URL</p>
            <p className="text-slate-800 dark:text-slate-200 truncate select-all">{import.meta.env.VITE_SUPABASE_URL}</p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Authentication Mode</p>
            <p className="text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>{hasErpJwt ? 'Google JWT Session (RLS Active)' : 'Anon Client (Google JWT Bridge Ready)'}</span>
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Last Health Check (Cairo)</p>
            <p className="text-slate-700 dark:text-slate-300">{lastChecked.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour12: true })}</p>
          </div>
        </div>
      </div>

      {/* Top Tables by Records Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Largest Tables */}
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Primary Core Catalogs</span>
          </h3>

          <div className="space-y-3">
            {largestTables.map((t) => {
              const maxCount = largestTables[0].count || 1;
              const pct = Math.max(5, Math.round((t.count / maxCount) * 100));

              return (
                <div key={t.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{t.name}</span>
                    <span className="font-mono text-cyan-400 font-semibold">{t.count.toLocaleString()} rows</span>
                  </div>
                  <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: pct + '%' }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Domain Distribution */}
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Domain Architecture Breakdown</span>
          </h3>

          <div className="space-y-3">
            {SCHEMA_CATEGORIES.map(cat => {
              const catTables = TABLES_CONFIG.filter(t => t.category === cat.id);
              const catRows = catTables.reduce((acc, t) => acc + (tableCounts?.[t.name] || 0), 0);

              return (
                <div key={cat.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${cat.color}`}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{cat.name}</p>
                      <p className="text-[10px] text-slate-400">{catTables.length} tables in domain</p>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800">
                    {catRows.toLocaleString()} rows
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
