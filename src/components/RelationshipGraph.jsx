import React, { useState, useMemo } from 'react';
import { 
  GitFork, 
  ZoomIn, 
  ZoomOut, 
  ArrowRight,
  Database
} from 'lucide-react';
import { SCHEMA_CATEGORIES, TABLES_CONFIG } from '../lib/schemaData';

const NODE_POSITIONS = {
  // Tenders Cluster (Top Center)
  tender_log: { x: 500, y: 160 },
  phases: { x: 500, y: 310 },
  boq_items: { x: 430, y: 470 },
  proposal_breakdown_items: { x: 610, y: 470 },
  clients: { x: 260, y: 160 },

  // Master Catalog (Left)
  items: { x: 230, y: 480 },
  brands: { x: 100, y: 320 },
  item_categories: { x: 100, y: 580 },
  boq_work_type: { x: 250, y: 640 },

  // MEP Cluster (Right)
  filter_pump_types: { x: 780, y: 140 },
  filter_types: { x: 960, y: 140 },
  lighting_type: { x: 780, y: 280 },
  cable_types: { x: 960, y: 280 },
  cable_glands: { x: 960, y: 400 },
  cable_conduits: { x: 780, y: 400 },
  transformer_type: { x: 880, y: 520 },
  junction_box: { x: 1060, y: 520 },
  heaters: { x: 780, y: 640 },
  disconnect_switch_types: { x: 960, y: 640 },
  circulation_accessories: { x: 1140, y: 200 },
  main_drain: { x: 1140, y: 320 },
  tablet_chlorinator: { x: 1140, y: 440 },
  pump_room_data_entry: { x: 1140, y: 640 },

  // Civil & Finishes Cluster (Bottom)
  proposal_data_entry: { x: 220, y: 780 },
  water_feature_structural_works: { x: 220, y: 920 },
  civil_material_types: { x: 420, y: 780 },
  pump_room_structural_works: { x: 420, y: 920 },
  finishes_category: { x: 620, y: 780 },
  finishes_type: { x: 620, y: 920 },
  water_feature_categories: { x: 820, y: 780 },
  water_feature_types: { x: 820, y: 920 },
  proposal_finishes_water_feature: { x: 1020, y: 920 },
  proposal_finishes_pump_room: { x: 1140, y: 800 },
  lambda_factor: { x: 980, y: 780 },

  // Geography (Top Left)
  countries: { x: 100, y: 80 },
  governorates: { x: 260, y: 80 },
  regions: { x: 420, y: 80 },
  districts: { x: 260, y: 240 }
};

export default function RelationshipGraph({ onSelectTable, tableCounts }) {
  const [selectedNode, setSelectedNode] = useState('tender_log');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [zoomLevel, setZoomLevel] = useState(1);

  // Compute all relational links (Edges)
  const allEdges = useMemo(() => {
    const edges = [];
    TABLES_CONFIG.forEach(sourceTable => {
      if (!sourceTable.relations) return;
      sourceTable.relations.forEach(rel => {
        const targetTable = TABLES_CONFIG.find(t => t.name === rel.targetTable || t.id === rel.targetTable);
        if (targetTable && NODE_POSITIONS[sourceTable.id] && NODE_POSITIONS[targetTable.id]) {
          edges.push({
            id: sourceTable.id + '->' + targetTable.id + ':' + rel.field,
            source: sourceTable.id,
            target: targetTable.id,
            field: rel.field,
            targetField: rel.targetField,
            type: rel.type,
            label: rel.label
          });
        }
      });
    });
    return edges;
  }, []);

  const focusedTable = useMemo(() => {
    return TABLES_CONFIG.find(t => t.id === selectedNode) || TABLES_CONFIG[0];
  }, [selectedNode]);

  const nodeConnections = useMemo(() => {
    const outbound = allEdges.filter(e => e.source === selectedNode);
    const inbound = allEdges.filter(e => e.target === selectedNode);
    return { outbound, inbound };
  }, [selectedNode, allEdges]);

  const activeFocusId = hoveredNode || selectedNode;

  const isEdgeHighlighted = (edge) => {
    if (!activeFocusId) return false;
    return edge.source === activeFocusId || edge.target === activeFocusId;
  };

  const isNodeConnected = (nodeId) => {
    if (!activeFocusId) return true;
    if (nodeId === activeFocusId) return true;
    return allEdges.some(e => 
      (e.source === activeFocusId && e.target === nodeId) ||
      (e.target === activeFocusId && e.source === nodeId)
    );
  };

  const isNodeInCategory = (tableObj) => {
    if (activeCategory === 'all') return true;
    return tableObj?.category === activeCategory;
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      
      {/* Visual Canvas Main Area */}
      <div className="flex-1 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/90 shadow-xl flex flex-col relative overflow-hidden">
        
        {/* Graph Header Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 z-10">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <GitFork className="w-5 h-5 text-cyan-400" />
              <span>Interactive Database ERD & Schema Graph</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover or click any table node to highlight foreign key paths and structural dependencies.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Domains</option>
              {SCHEMA_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <div className="flex bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setZoomLevel(z => Math.max(0.6, z - 0.1))}
                className="p-1.5 text-slate-400 hover:text-slate-200 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                onClick={() => setZoomLevel(z => Math.min(1.4, z + 0.1))}
                className="p-1.5 text-slate-400 hover:text-slate-200 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive ERD SVG Canvas */}
        <div className="flex-1 relative overflow-auto border border-slate-800/80 rounded-xl bg-slate-950/80 my-4 min-h-[550px]">
          <svg 
            className="w-full h-full min-w-[1250px] min-h-[1050px]" 
            viewBox="0 0 1250 1050"
            style={{ transform: 'scale(' + zoomLevel + ')', transformOrigin: 'top left', transition: 'transform 0.15s ease-out' }}
          >
            <defs>
              <linearGradient id="edge-grad-active" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
              </marker>
              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#22d3ee" />
              </marker>
            </defs>

            {/* Render Connecting Lines */}
            {allEdges.map(edge => {
              const src = NODE_POSITIONS[edge.source];
              const tgt = NODE_POSITIONS[edge.target];
              if (!src || !tgt) return null;

              const highlighted = isEdgeHighlighted(edge);
              const dx = tgt.x - src.x;
              const dy = tgt.y - src.y;
              const cx1 = src.x + dx * 0.4;
              const cy1 = src.y;
              const cx2 = tgt.x - dx * 0.4;
              const cy2 = tgt.y;

              const pathD = 'M ' + src.x + ' ' + src.y + ' C ' + cx1 + ' ' + cy1 + ', ' + cx2 + ' ' + cy2 + ', ' + tgt.x + ' ' + tgt.y;

              return (
                <g key={edge.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={highlighted ? 'url(#edge-grad-active)' : '#334155'}
                    strokeWidth={highlighted ? 2.5 : 1.2}
                    strokeDasharray={edge.type === '1:M' ? '4 3' : 'none'}
                    markerEnd={highlighted ? 'url(#arrow-active)' : 'url(#arrow)'}
                    className="transition-all duration-300"
                    opacity={highlighted ? 1 : activeFocusId ? 0.2 : 0.6}
                  />
                  {highlighted && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 8}
                      fill="#38bdf8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {edge.field} ({edge.type})
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Table Nodes */}
            {TABLES_CONFIG.map(t => {
              const pos = NODE_POSITIONS[t.id];
              if (!pos) return null;

              const isSelected = selectedNode === t.id;
              const isHovered = hoveredNode === t.id;
              const isConnected = isNodeConnected(t.id);
              const rowCount = tableCounts?.[t.name] ?? '-';

              let nodeBg = 'fill-slate-900 stroke-slate-700';

              if (t.category === 'tenders') {
                nodeBg = isSelected ? 'fill-amber-950 stroke-amber-400' : 'fill-slate-900 stroke-amber-500/40';
              } else if (t.category === 'catalog') {
                nodeBg = isSelected ? 'fill-blue-950 stroke-cyan-400' : 'fill-slate-900 stroke-blue-500/40';
              } else if (t.category === 'mep') {
                nodeBg = isSelected ? 'fill-emerald-950 stroke-emerald-400' : 'fill-slate-900 stroke-emerald-500/40';
              } else if (t.category === 'civil') {
                nodeBg = isSelected ? 'fill-purple-950 stroke-purple-400' : 'fill-slate-900 stroke-purple-500/40';
              } else if (t.category === 'geography') {
                nodeBg = isSelected ? 'fill-sky-950 stroke-sky-400' : 'fill-slate-900 stroke-sky-500/40';
              }

              const inDomain = isNodeInCategory(t);
              const opacity = !inDomain ? 0.15 : isConnected ? 1 : 0.28;

              return (
                <g
                  key={t.id}
                  transform={'translate(' + (pos.x - 85) + ', ' + (pos.y - 30) + ')'}
                  className="cursor-pointer transition-all duration-200 select-none"
                  onClick={() => setSelectedNode(t.id)}
                  onMouseEnter={() => setHoveredNode(t.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  opacity={opacity}
                >
                  <rect
                    width="170"
                    height="60"
                    rx="10"
                    className={nodeBg + ' transition-all duration-200'}
                    strokeWidth={isSelected ? '2.5' : isHovered ? '2' : '1'}
                  />

                  <rect
                    width="170"
                    height="5"
                    rx="2"
                    fill={t.category === 'tenders' ? '#f59e0b' : t.category === 'catalog' ? '#3b82f6' : t.category === 'mep' ? '#10b981' : t.category === 'civil' ? '#a855f7' : '#0ea5e9'}
                  />

                  <text
                    x="12"
                    y="26"
                    fill="#f8fafc"
                    fontSize="12"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {t.name.length > 18 ? t.name.slice(0, 16) + '..' : t.name}
                  </text>

                  <text
                    x="12"
                    y="44"
                    fill="#94a3b8"
                    fontSize="10"
                  >
                    {t.displayName.length > 18 ? t.displayName.slice(0, 16) + '..' : t.displayName}
                  </text>

                  <rect
                    x="125"
                    y="32"
                    width="36"
                    height="18"
                    rx="4"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="1"
                  />
                  <text
                    x="143"
                    y="45"
                    fill="#38bdf8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {rowCount}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-300">Domains:</span>
            {SCHEMA_CATEGORIES.map(c => (
              <div key={c.id} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  c.id === 'tenders' ? 'bg-amber-400' : c.id === 'catalog' ? 'bg-blue-400' : c.id === 'mep' ? 'bg-emerald-400' : c.id === 'civil' ? 'bg-purple-400' : 'bg-sky-400'
                }`}></span>
                <span className="text-slate-300 text-[11px]">{c.name}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-slate-400 inline-block"></span> M:1 Foreign Key
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-b-2 border-dotted border-slate-400 inline-block"></span> 1:M Target Relation
            </span>
          </div>
        </div>

      </div>

      {/* Right Sidebar: Selected Table Details & Relations Inspector */}
      <aside className="w-full xl:w-96 bg-slate-900/60 p-6 rounded-2xl border border-slate-800/90 shadow-xl flex flex-col gap-5">
        
        {/* Table Title */}
        <div className="pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded border border-cyan-800/60">
              {focusedTable.name}
            </span>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
              {tableCounts?.[focusedTable.name] ?? 0} records
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-100">
            {focusedTable.displayName}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {focusedTable.description}
          </p>

          <button
            onClick={() => onSelectTable(focusedTable.id)}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Open in Live Table Explorer</span>
          </button>
        </div>

        {/* Outbound Relationships */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Outgoing References ({nodeConnections.outbound.length})</span>
          </h4>

          {nodeConnections.outbound.length === 0 ? (
            <p className="text-xs italic text-slate-500 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
              No foreign key references to other tables.
            </p>
          ) : (
            <div className="space-y-2">
              {nodeConnections.outbound.map(edge => (
                <div 
                  key={edge.id}
                  onClick={() => setSelectedNode(edge.target)}
                  className="p-2.5 bg-slate-950/60 hover:bg-slate-800/60 rounded-xl border border-slate-800 hover:border-cyan-500/40 transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <code className="text-xs font-mono text-amber-300">{edge.field}</code>
                      <span className="text-[10px] text-slate-500 font-mono">➔ {edge.targetField}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {edge.label || edge.target}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {edge.target}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inbound Relationships */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-emerald-400" />
            <span>Inbound Relations ({nodeConnections.inbound.length})</span>
          </h4>

          {nodeConnections.inbound.length === 0 ? (
            <p className="text-xs italic text-slate-500 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
              No other tables directly reference this table as a foreign key.
            </p>
          ) : (
            <div className="space-y-2">
              {nodeConnections.inbound.map(edge => (
                <div 
                  key={edge.id}
                  onClick={() => setSelectedNode(edge.source)}
                  className="p-2.5 bg-slate-950/60 hover:bg-slate-800/60 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-emerald-300 font-semibold">{edge.source}</span>
                      <span className="text-[10px] text-slate-500 font-mono">via {edge.field}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {edge.label || edge.source}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    {edge.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </aside>

    </div>
  );
}
