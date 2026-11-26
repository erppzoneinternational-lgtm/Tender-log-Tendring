import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Table as TableIcon, 
  Key, 
  Link, 
  ArrowRight
} from 'lucide-react';
import { SCHEMA_CATEGORIES, TABLES_CONFIG } from '../lib/schemaData';

export default function DataDictionary({ onSelectTable, tableCounts }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredTables = useMemo(() => {
    return TABLES_CONFIG.filter(t => {
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
      const matchSearch = !searchQuery || 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.relations?.some(r => r.field.toLowerCase().includes(searchQuery.toLowerCase()) || r.targetTable.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Database Schema Dictionary & Data Matrix</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Comprehensive catalog of all 30+ relational tables, primary keys, foreign key constraints, and engineering purposes across the PZONE Tendering Engine.
          </p>
        </div>

        {/* Search & Domain Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tables, columns, FKs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Domains</option>
            {SCHEMA_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tables Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTables.map(t => {
          const rowCount = tableCounts?.[t.name] ?? 0;
          const cat = SCHEMA_CATEGORIES.find(c => c.id === t.category);

          return (
            <div
              key={t.id}
              className="bg-white dark:bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 p-5 shadow-lg transition duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat?.color || 'bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    {cat?.name || t.category}
                  </span>

                  <span className="text-xs font-mono font-medium text-cyan-300 bg-cyan-950/80 border border-cyan-800/50 px-2 py-0.5 rounded-full">
                    {rowCount} rows
                  </span>
                </div>

                {/* Table Name */}
                <div className="flex items-center gap-2 mb-1">
                  <TableIcon className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 group-hover:text-cyan-300 transition truncate">
                    {t.name}
                  </h3>
                </div>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  {t.displayName}
                </p>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {t.description}
                </p>

                {/* Relational Keys info */}
                <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs">
                    <Key className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="text-slate-400 font-mono text-[11px]">PK:</span>
                    <code className="text-[11px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40">
                      {t.primaryKey || 'id'}
                    </code>
                  </div>

                  {t.relations && t.relations.length > 0 && (
                    <div className="flex items-start gap-2 text-xs pt-1">
                      <Link className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                        {t.relations.map((r, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1"
                          >
                            <span className="text-amber-400">{r.field}</span>
                            <span className="text-slate-500">➔</span>
                            <span className="text-cyan-300">{r.targetTable}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-end">
                <button
                  onClick={() => onSelectTable(t.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/50 px-3 py-1.5 rounded-xl transition"
                >
                  <span>Explore Live Data</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
