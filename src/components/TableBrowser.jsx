import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Database,
  Eye
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TABLES_CONFIG, SCHEMA_CATEGORIES } from '../lib/schemaData';
import { useLookup } from '../lib/lookupContext';
import { formatDateTimeCairo } from '../lib/erpBridge';
import RecordDrawer from './RecordDrawer';

export default function TableBrowser({ activeTable = 'items', onSelectTable, onOpenGraph }) {
  const { getResolvedLabel, reloadLookups } = useLookup();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTableQuery, setSearchTableQuery] = useState('');
  
  // Table Data State
  const [rows, setRows] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [tableCounts, setTableCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchRowQuery, setSearchRowQuery] = useState('');

  const currentTableConfig = useMemo(() => {
    return TABLES_CONFIG.find(t => t.id === activeTable || t.name === activeTable) || TABLES_CONFIG[0];
  }, [activeTable]);

  // Fetch count for all tables
  useEffect(() => {
    const fetchAllCounts = async () => {
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
    };
    fetchAllCounts();
  }, []);

  // Fetch records for active table
  const fetchTableData = useCallback(async () => {
    if (!currentTableConfig) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from(currentTableConfig.name)
        .select('*', { count: 'exact' });

      // Apply sorting if column exists in table
      if (sortColumn) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc', nullsFirst: false });
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error: fetchErr } = await query;

      if (fetchErr) {
        if (sortColumn !== 'id') {
          // Fallback sort by ID or no sort if column doesn't exist
          const { data: fbData, count: fbCount, error: fbErr } = await supabase
            .from(currentTableConfig.name)
            .select('*', { count: 'exact' })
            .range(from, to);
          
          if (fbErr) throw fbErr;
          setRows(fbData || []);
          setTotalRows(fbCount || 0);
        } else {
          throw fetchErr;
        }
      } else {
        setRows(data || []);
        setTotalRows(count || 0);
      }
    } catch (err) {
      console.error('Error fetching table data:', err);
      setError(err.message || 'Failed to load records from Supabase');
      setRows([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }, [currentTableConfig, page, pageSize, sortColumn, sortDirection]);

  useEffect(() => {
    setPage(1);
    setSearchRowQuery('');
    fetchTableData();
  }, [currentTableConfig.name, fetchTableData]);

  useEffect(() => {
    fetchTableData();
  }, [page, pageSize, sortColumn, sortDirection, fetchTableData]);

  // Filter tables in sidebar
  const filteredTables = useMemo(() => {
    return TABLES_CONFIG.filter(t => {
      const matchCat = activeCategory === 'all' || t.category === activeCategory;
      const matchQuery = !searchTableQuery || 
        t.name.toLowerCase().includes(searchTableQuery.toLowerCase()) ||
        t.displayName.toLowerCase().includes(searchTableQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [activeCategory, searchTableQuery]);

  // Dynamic Columns
  const columns = useMemo(() => {
    if (rows.length === 0) return currentTableConfig.fields || ['id'];
    const keys = new Set();
    // Prioritize id and title/name columns first
    if (rows[0].id !== undefined) keys.add('id');
    rows.forEach(r => Object.keys(r).forEach(k => keys.add(k)));
    return Array.from(keys);
  }, [rows, currentTableConfig]);

  // Client-side row search filter
  const displayRows = useMemo(() => {
    if (!searchRowQuery) return rows;
    const q = searchRowQuery.toLowerCase();
    return rows.filter(row => {
      return Object.entries(row).some(([col, val]) => {
        if (val === null || val === undefined) return false;
        if (String(val).toLowerCase().includes(q)) return true;
        // Search resolved label if relation exists
        const rel = currentTableConfig.relations?.find(r => r.field === col);
        if (rel) {
          const resolved = getResolvedLabel(rel.targetTable, val);
          if (resolved && resolved.toLowerCase().includes(q)) return true;
        }
        return false;
      });
    });
  }, [rows, searchRowQuery, currentTableConfig, getResolvedLabel]);

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleInspectRecord = (row) => {
    setSelectedRecord(row);
  };

  const exportToCSV = () => {
    if (displayRows.length === 0) return;
    const headers = columns.join(',');
    const csvContent = [
      headers,
      ...displayRows.map(row => 
        columns.map(col => {
          let val = row[col] ?? '';
          const rel = currentTableConfig.relations?.find(r => r.field === col);
          const resolved = getResolvedLabel(rel?.targetTable, val);
          if (resolved) val = resolved;
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentTableConfig.name}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(totalRows / pageSize) || 1;

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-10rem)] w-full">
      
      {/* Left Sidebar */}
      <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Database Domain
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                activeCategory === 'all' 
                  ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/40 shadow-xs' 
                  : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800'
              }`}
            >
              All Tables ({TABLES_CONFIG.length})
            </button>
            {SCHEMA_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold text-left truncate transition cursor-pointer ${
                  activeCategory === cat.id 
                    ? 'bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/40' 
                    : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat.name.split('&')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search database tables..."
            value={searchTableQuery}
            onChange={(e) => setSearchTableQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[60vh] lg:max-h-none">
          {filteredTables.map(t => {
            const isSelected = t.id === currentTableConfig.id;
            const rowCount = tableCounts?.[t.name] ?? '-';

            return (
              <button
                key={t.id}
                onClick={() => onSelectTable(t.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition cursor-pointer group ${
                  isSelected
                    ? 'bg-cyan-100 text-cyan-950 dark:bg-cyan-500/20 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-cyan-200 text-cyan-900 dark:bg-cyan-500/30 dark:text-cyan-200' : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 border border-slate-200 dark:border-slate-800'}`}>
                    <TableIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold truncate leading-tight font-mono text-slate-900 dark:text-slate-100">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
                      {t.displayName}
                    </p>
                  </div>
                </div>

                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-cyan-200 text-cyan-950 dark:bg-cyan-950/90 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}>
                  {rowCount}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Table Title Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-black text-cyan-900 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-300 dark:border-cyan-800/60">
                {currentTableConfig.name}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {currentTableConfig.displayName}
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                {totalRows} records
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
              {currentTableConfig.description}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={exportToCSV}
              disabled={displayRows.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Export current view to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                fetchTableData();
                reloadLookups();
              }}
              disabled={loading}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh Table & Lookups"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter & Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search in ${currentTableConfig.name} by name or value...`}
              value={searchRowQuery}
              onChange={(e) => setSearchRowQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>rows / page</span>
          </div>
        </div>

        {/* Data Table Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 relative min-h-[300px]">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-xs z-10">
              <RefreshCw className="w-8 h-8 text-cyan-600 dark:text-cyan-400 animate-spin mb-2" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono font-bold">Loading records & resolving references...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Failed to load table records</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md font-mono">{error}</p>
            </div>
          ) : displayRows.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full text-slate-500">
              <Database className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No records found</p>
              <p className="text-xs text-slate-500 mt-1">This table is empty or no records match your filter.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono text-[11px]">
                <tr>
                  <th className="p-3 w-12 text-center text-slate-500 font-mono">#</th>
                  {columns.map(col => {
                    const isSorted = sortColumn === col;
                    const isFK = currentTableConfig.relations?.some(r => r.field === col);

                    return (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="p-3 font-bold cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-800 transition select-none whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col}</span>
                          {isFK && (
                            <span className="text-[9px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-300 dark:border-cyan-800">
                              REF
                            </span>
                          )}
                          <span className="text-slate-400">
                            {isSorted ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-30" />
                            )}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-3 w-16 text-center text-slate-500 font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
                {displayRows.map((row, idx) => {
                  const rowNum = (page - 1) * pageSize + idx + 1;
                  return (
                    <tr 
                      key={row.id || idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition group cursor-pointer"
                      onClick={() => handleInspectRecord(row)}
                    >
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">
                        {rowNum}
                      </td>

                      {columns.map(col => {
                        const val = row[col];
                        const isNull = val === null || val === undefined || val === '';
                        const isObj = typeof val === 'object' && val !== null;
                        const relation = currentTableConfig.relations?.find(r => r.field === col);

                        // Try to resolve human title from foreign key relation or general resolver
                        const isUUIDVal = typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
                        const resolvedTitle = !isNull && !isObj ? (getResolvedLabel(relation?.targetTable, val) || (isUUIDVal ? getResolvedLabel(null, val) : null)) : null;

                        return (
                          <td 
                            key={col} 
                            className="p-3 text-slate-800 dark:text-slate-200 max-w-xs truncate text-[12px]"
                          >
                            {isNull ? (
                              <span className="text-slate-400 italic text-[11px] font-mono">null</span>
                            ) : isObj ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800" title={JSON.stringify(val)}>
                                JSON Breakdown
                              </span>
                            ) : resolvedTitle ? (
                              <span 
                                className="inline-flex items-center gap-1.5 text-cyan-900 dark:text-cyan-200 font-bold bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 hover:border-cyan-500 px-2.5 py-1 rounded-lg transition"
                                title={"UUID: " + val}
                              >
                                <span className="truncate max-w-[220px]">
                                  {resolvedTitle}
                                </span>
                                <ExternalLink className="w-3 h-3 text-cyan-600 dark:text-cyan-400 opacity-70 group-hover:opacity-100 flex-shrink-0" />
                              </span>
                            ) : typeof val === 'boolean' ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                val ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {val ? 'TRUE' : 'FALSE'}
                              </span>
                            ) : typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val) ? (
                              <span className="font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {formatDateTimeCairo(val)}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-800 dark:text-slate-200">{String(val)}</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleInspectRecord(row)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-cyan-100 text-slate-600 hover:text-cyan-900 dark:bg-slate-800 dark:hover:bg-cyan-500/20 dark:text-slate-400 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                          title="Inspect Record"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <div>
            Showing <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">{displayRows.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
            <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">{Math.min(page * pageSize, totalRows)}</span> of{' '}
            <span className="text-slate-900 dark:text-slate-100 font-mono font-bold">{totalRows}</span> records
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg font-mono font-bold text-slate-800 dark:text-slate-200">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </main>

      {/* Record Inspection Slide-Over */}
      {selectedRecord && (
        <RecordDrawer 
          record={selectedRecord} 
          tableConfig={currentTableConfig} 
          onClose={() => setSelectedRecord(null)}
          onNavigateToRelation={(tbl, val) => {
            setSelectedRecord(null);
            onSelectTable(tbl);
          }}
        />
      )}

    </div>
  );
}
