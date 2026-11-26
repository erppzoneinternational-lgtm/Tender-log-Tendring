import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Database, 
  Hash,
  Link2
} from 'lucide-react';
import { useLookup } from '../lib/lookupContext';
import { formatDateTimeCairo } from '../lib/erpBridge';

export default function RecordDrawer({ 
  record, 
  tableConfig, 
  onClose, 
  onNavigateToRelation 
}) {
  const { getResolvedLabel } = useLookup();
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTab, setActiveTab] = useState('fields');

  if (!record) return null;

  const copyToClipboard = (key, value) => {
    navigator.clipboard.writeText(String(value));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getRelationForField = (fieldName) => {
    return tableConfig?.relations?.find(r => r.field === fieldName);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 rounded-xl text-cyan-700 dark:text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-900 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-300 dark:border-cyan-800/50">
                  {tableConfig?.name || 'Table'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Record Details</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-md mt-0.5">
                {record.item_name || record.title || record.name || record.proposal_full_title || record.id || 'Selected Record'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('fields')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'fields' ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Attributes
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'raw' ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Raw JSON
              </button>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {activeTab === 'fields' ? (
            <div className="space-y-4">
              {/* Primary Key */}
              {record.id && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Hash className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Primary Key (ID)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                      {record.id}
                    </code>
                    <button
                      onClick={() => copyToClipboard('id', record.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                      title="Copy ID"
                    >
                      {copiedKey === 'id' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* All Attributes Table */}
              <div className="space-y-2">
                {Object.entries(record).map(([key, val]) => {
                  if (key === 'id') return null;
                  const relation = getRelationForField(key);
                  const isNull = val === null || val === undefined;
                  const isObj = typeof val === 'object' && val !== null;
                  const resolvedLabel = !isNull && !isObj ? getResolvedLabel(relation?.targetTable, val) : null;

                  return (
                    <div 
                      key={key}
                      className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-[180px]">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300 font-mono">
                          {key}
                        </span>
                        {relation && (
                          <span className="text-[9px] bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-300 dark:border-cyan-800 flex items-center gap-0.5">
                            <Link2 className="w-2.5 h-2.5" />
                            <span>{relation.targetTable}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 max-w-md justify-end flex-wrap">
                        {isNull ? (
                          <span className="text-slate-400 italic text-xs font-mono">null</span>
                        ) : resolvedLabel ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-cyan-900 dark:text-cyan-200 bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-800 px-2 py-0.5 rounded-md">
                              {resolvedLabel}
                            </span>
                            {onNavigateToRelation && (
                              <button
                                onClick={() => onNavigateToRelation(relation.targetTable, val)}
                                className="p-1 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition"
                                title={`Open ${relation.targetTable} table`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : isObj ? (
                          <pre className="text-[11px] font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full text-slate-800 dark:text-slate-200">
                            {JSON.stringify(val, null, 2)}
                          </pre>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-800 dark:text-slate-200 select-all break-all">
                              {typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)
                                ? formatDateTimeCairo(val)
                                : String(val)}
                            </span>
                            <button
                              onClick={() => copyToClipboard(key, val)}
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition flex-shrink-0"
                            >
                              {copiedKey === key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="relative">
              <pre className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-cyan-900 dark:text-cyan-300 overflow-x-auto">
                {JSON.stringify(record, null, 2)}
              </pre>
              <button
                onClick={() => copyToClipboard('raw', JSON.stringify(record, null, 2))}
                className="absolute top-3 right-3 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-slate-900 transition"
                title="Copy JSON"
              >
                {copiedKey === 'raw' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
