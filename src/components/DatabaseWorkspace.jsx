import React, { useState, useEffect, useCallback } from 'react';
import { Database, GitFork, BookOpen, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TABLES_CONFIG } from '../lib/schemaData';
import TableBrowser from './TableBrowser';
import RelationshipGraph from './RelationshipGraph';
import DataDictionary from './DataDictionary';
import DatabaseHealth from './DatabaseHealth';

export default function DatabaseWorkspace({ 
  subPath = '/database/explorer', 
  activeTable = 'items', 
  onNavigate, 
  onSelectTable 
}) {
  const [tableCounts, setTableCounts] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAllCounts = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const counts = {};
      await Promise.all(
        TABLES_CONFIG.map(async (t) => {
          try {
            const { count, error } = await supabase
              .from(t.name)
              .select('*', { count: 'exact', head: true });
            if (!error && count !== null) {
              counts[t.name] = count;
            }
          } catch {
            // Ignore single table count failure
          }
        })
      );
      setTableCounts(counts);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCounts();
  }, [fetchAllCounts]);

  const currentSubTab = subPath.startsWith('/database/graph') 
    ? 'graph' 
    : subPath.startsWith('/database/dictionary') 
    ? 'dictionary' 
    : subPath.startsWith('/database/health') 
    ? 'health' 
    : 'explorer';

  return (
    <div className="space-y-6 w-full">
      
      {/* Top Database Suite Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm w-full">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800/60 px-2.5 py-0.5 rounded-full">
              Architecture Suite
            </span>
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>Database Architecture & Relational Engine</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            30+ relational PostgreSQL tables, UUID-to-Title foreign key resolver, visual ERD diagram & health monitoring.
          </p>
        </div>

        {/* Clean Sub-Navigation Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto overflow-x-auto">
          
          <button
            onClick={() => onNavigate('/database/explorer?table=' + activeTable)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              currentSubTab === 'explorer'
                ? 'bg-white dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 shadow-xs border border-slate-200/80 dark:border-cyan-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Explorer</span>
          </button>

          <button
            onClick={() => onNavigate('/database/graph')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              currentSubTab === 'graph'
                ? 'bg-white dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 shadow-xs border border-slate-200/80 dark:border-purple-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>ERD Graph</span>
          </button>

          <button
            onClick={() => onNavigate('/database/dictionary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              currentSubTab === 'dictionary'
                ? 'bg-white dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-xs border border-slate-200/80 dark:border-emerald-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dictionary</span>
          </button>

          <button
            onClick={() => onNavigate('/database/health')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
              currentSubTab === 'health'
                ? 'bg-white dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 shadow-xs border border-slate-200/80 dark:border-rose-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Health</span>
          </button>

        </div>
      </div>

      {/* Sub-Workspace Views */}
      <div className="w-full">
        {currentSubTab === 'explorer' && (
          <TableBrowser 
            activeTable={activeTable} 
            onSelectTable={onSelectTable}
            onOpenGraph={() => onNavigate('/database/graph')}
          />
        )}

        {currentSubTab === 'graph' && (
          <RelationshipGraph 
            tableCounts={tableCounts}
            onSelectTable={(tbl) => onNavigate('/database/explorer?table=' + tbl)} 
          />
        )}

        {currentSubTab === 'dictionary' && (
          <DataDictionary 
            tableCounts={tableCounts}
            onSelectTable={(tbl) => onNavigate('/database/explorer?table=' + tbl)} 
          />
        )}

        {currentSubTab === 'health' && (
          <DatabaseHealth 
            tableCounts={tableCounts}
            onRefreshAll={fetchAllCounts}
            isRefreshing={isRefreshing}
          />
        )}
      </div>

    </div>
  );
}
