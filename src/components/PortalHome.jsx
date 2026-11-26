import React from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Waves,
  HardHat,
  ArrowRight,
  Sparkles,
  Layers,
  Cpu,
  TrendingUp,
  Ruler,
  ShieldCheck,
  Truck
} from 'lucide-react';
import { useLookup } from '../lib/lookupContext';

export default function PortalHome({ onSelectTable, onNavigate }) {
  const { totalCachedRecords = 0, isConnected = true } = useLookup() || {};

  return (
    <div className="space-y-8 w-full">
      
      {/* P.ZONE Executive Brand Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-8 sm:p-10 text-white shadow-xl border border-slate-800">
        
        {/* Subtle Brand Logo Ambient Gradients */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            ENTERPRISE TENDERING & ENGINEERING SUITE • v2.0
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            P.ZONE <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">Intelligent Tendering</span> System
          </h1>
          
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            A comprehensive, enterprise-grade engineering estimation platform. Seamlessly compute hydraulic flow rates, filtration specs, electrical cable sizing, civil mosaics, structural reinforcement, and automatic BOQ rollups.
          </p>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            
            <button
              onClick={() => onNavigate('/tenders')}
              className="flex items-center gap-2.5 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-950/40 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-slate-950" />
              <span>Tender Creation</span>
            </button>

            <button
              onClick={() => onNavigate('/water-features')}
              className="flex items-center gap-2.5 px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-950/40 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Waves className="w-4 h-4 text-slate-950" />
              <span>WF & Pump Rooms</span>
            </button>

            <button
              onClick={() => onNavigate('/structural-works')}
              className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-950/40 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <HardHat className="w-4 h-4 text-slate-950" />
              <span>Civil & Finishes</span>
            </button>

            <button
              onClick={() => onNavigate('/wf-electromechanical')}
              className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-teal-950/40 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-slate-950" />
              <span>WF Electromechanical</span>
            </button>

            <button
              onClick={() => onNavigate('/commercial-bid')}
              className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-slate-950" />
              <span>Commercial & Bid Price</span>
            </button>

            <button
              onClick={() => onNavigate('/database/explorer')}
              className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl border border-white/20 transition cursor-pointer backdrop-blur-sm"
            >
              <Database className="w-4 h-4 text-slate-300" />
              <span>Database Architecture</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main Workspace Cards (6 Dedicated Portals Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
        
        {/* Portal 1: Tender Log & Creation */}
        <div 
          onClick={() => onNavigate('/tenders')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/60 dark:hover:border-cyan-500/50 p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 rounded-2xl text-cyan-600 dark:text-cyan-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition">
                Tender Creation & Proposals
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                Auto-code sequencing (SP.YYYY.NN), geography, client lookups, and multi-trade child phases.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-500 text-[10px]">Naming</span>
                <strong className="text-cyan-900 dark:text-cyan-300 font-mono font-bold text-[11px]">SP.2026.NN</strong>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-500 text-[10px]">Scope</span>
                <strong className="text-purple-700 dark:text-purple-300 font-bold text-[11px]">4 Trades</strong>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-cyan-700 dark:text-cyan-400 font-black">
            <span>Open Tenders</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Portal 2: Water Feature & Pump Room Technical Data Entry */}
        <div 
          onClick={() => onNavigate('/water-features')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-900/90 rounded-3xl border border-cyan-200 dark:border-cyan-500/30 hover:border-cyan-500 p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-300 dark:border-cyan-500/40 rounded-2xl text-cyan-700 dark:text-cyan-300">
                <Waves className="w-6 h-6" />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition">
                Water Features & Pump Rooms
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                Geometric dimensions, flow/turnover rates, deep wall parameters, beaches & sump pits.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-xs">
              <div className="bg-cyan-50/60 dark:bg-cyan-950/40 p-2 rounded-xl border border-cyan-200 dark:border-cyan-800/60 flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-[10px]">proposal_data_entry</span>
                <strong className="text-cyan-950 dark:text-cyan-300 font-mono font-bold text-[11px]">Pools & Lagoons</strong>
              </div>
              <div className="bg-teal-50/60 dark:bg-teal-950/40 p-2 rounded-xl border border-teal-200 dark:border-teal-800/60 flex justify-between">
                <span className="text-slate-600 dark:text-slate-400 text-[10px]">pump_room_data_entry</span>
                <strong className="text-teal-950 dark:text-teal-300 font-mono font-bold text-[11px]">Pits & Tanks</strong>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-cyan-700 dark:text-cyan-400 font-black">
            <span>Enter Geometry</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Portal 3: Civil Structural and Finishes Works */}
        <div 
          onClick={() => onNavigate('/structural-works')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-900/90 rounded-3xl border border-amber-300 dark:border-amber-500/40 hover:border-amber-500 dark:hover:border-amber-400 p-5 shadow-sm hover:shadow-lg shadow-amber-900/10 transition cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-300 dark:border-amber-500/40 rounded-2xl text-amber-700 dark:text-amber-300">
                <HardHat className="w-6 h-6" />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                Civil Structural & Finishes
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                Excavation, PC/RC concrete, formwork, waterproofing, plaster, epoxy, ceramic & BOQ sync.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-xs">
              <div className="bg-amber-50/60 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800/60 flex justify-between">
                <span className="text-amber-800 dark:text-amber-400 text-[10px]">wf_structural / wf_finishes</span>
                <strong className="text-amber-950 dark:text-amber-300 font-mono font-bold text-[11px]">Water Features</strong>
              </div>
              <div className="bg-teal-50/60 dark:bg-teal-950/40 p-2 rounded-xl border border-teal-200 dark:border-teal-800/60 flex justify-between">
                <span className="text-teal-800 dark:text-teal-400 text-[10px]">pr_structural / pr_finishes</span>
                <strong className="text-teal-950 dark:text-teal-300 font-mono font-bold text-[11px]">Pump Rooms</strong>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-black">
            <span>Open Civil Suite</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Portal 4: Water Feature Electromechanical (MEP) */}
        <div 
          onClick={() => onNavigate('/wf-electromechanical')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-900/90 rounded-3xl border border-teal-300 dark:border-teal-500/40 hover:border-teal-500 dark:hover:border-teal-400 p-5 shadow-sm hover:shadow-lg shadow-teal-900/10 transition cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 border border-teal-300 dark:border-teal-500/40 rounded-2xl text-teal-700 dark:text-teal-300">
                <Cpu className="w-6 h-6" />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition">
                WF Electromechanical (MEP)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                Pumps, sand filters, LED underwater lights, power cables, chlorinators, heaters & MEP BOQ.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-xs">
              <div className="bg-teal-50/60 dark:bg-teal-950/40 p-2 rounded-xl border border-teal-200 dark:border-teal-800/60 flex justify-between">
                <span className="text-teal-800 dark:text-teal-400 text-[10px]">Mechanical</span>
                <strong className="text-teal-950 dark:text-teal-300 font-mono font-bold text-[11px]">Hydraulics & Filters</strong>
              </div>
              <div className="bg-amber-50/60 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800/60 flex justify-between">
                <span className="text-amber-800 dark:text-amber-400 text-[10px]">Electrical</span>
                <strong className="text-amber-950 dark:text-amber-300 font-mono font-bold text-[11px]">LED & Transformers</strong>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-teal-700 dark:text-teal-400 font-black">
            <span>Open MEP Suite</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Portal 5: Commercial Overheads & Setting Bid Price */}
        <div 
          onClick={() => onNavigate('/commercial-bid')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-900/90 rounded-3xl border border-emerald-300 dark:border-emerald-500/40 hover:border-emerald-500 dark:hover:border-emerald-400 p-5 shadow-sm hover:shadow-lg shadow-emerald-900/10 transition cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl text-emerald-700 dark:text-emerald-300">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition">
                Commercial & Bid Pricing
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                Corporate G&A overheads, profit margins, bank guarantee fees, contingency reserves & marked-up BOQ offer sheets.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-xs">
              <div className="bg-amber-50/60 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800/60 flex justify-between">
                <span className="text-amber-800 dark:text-amber-400 text-[10px]">Overheads</span>
                <strong className="text-amber-950 dark:text-amber-300 font-mono font-bold text-[11px]">G&A + Site + Risk</strong>
              </div>
              <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex justify-between">
                <span className="text-emerald-800 dark:text-emerald-400 text-[10px]">Target Profit</span>
                <strong className="text-emerald-950 dark:text-emerald-300 font-mono font-bold text-[11px]">Markup Multipliers</strong>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-black">
            <span>Set Bid Price</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Portal 6: Database Explorer & Architecture */}
        <div 
          onClick={() => onNavigate('/database/explorer')}
          className="bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-700 dark:text-slate-300">
                <Database className="w-6 h-6" />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition">
                Database & Schema
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
                Live browser across all 32 tables with schema dictionary, ERD graph & cached records.
              </p>
            </div>

            <div className="space-y-1.5 pt-2 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-500 text-[10px]">Cached Records</span>
                <strong className="text-slate-900 dark:text-slate-100 font-mono font-bold text-[11px]">{(Number(totalCachedRecords) || 0).toLocaleString()}</strong>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between">
                <span className="text-slate-500 text-[10px]">Engine</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-[11px]">PostgreSQL</strong>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-400 font-black">
            <span>Explore Database</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

    </div>
  );
}
