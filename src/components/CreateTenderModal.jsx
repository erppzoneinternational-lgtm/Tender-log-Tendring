import React from 'react';
import { 
  FileSpreadsheet, 
  X, 
  MapPin, 
  Building, 
  Calendar, 
  Layers, 
  Sparkles, 
  Waves, 
  Cpu, 
  RefreshCw 
} from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { formatDateTimeCairo } from '../lib/erpBridge';

export const AVAILABLE_SCOPES = [
  { id: 'Civil Structural Works', label: 'Civil Structural', color: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/60 dark:text-blue-300' },
  { id: 'Finishes Works', label: 'Finishes', color: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'Mechanical Works', label: 'Mechanical', color: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/60 dark:bg-cyan-950/60 dark:text-cyan-300' },
  { id: 'Electrical Works', label: 'Electrical', color: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/60 dark:bg-amber-950/60 dark:text-amber-300' }
];

export default function CreateTenderModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  computedFullTitle,
  handleInputChange,
  handleCountryChange,
  handleGovernorateChange,
  handleRegionChange,
  handleClientChange,
  handleAddWaterFeaturePhase,
  handleAddPumpRoomPhase,
  handleRemovePhase,
  handlePhaseFieldChange,
  togglePhaseScope,
  countries = [],
  governorates = [],
  regions = [],
  districts = [],
  clients = [],
  onOpenQuickAdd,
  onResetAutoCode,
  isSubmitting,
  onSave
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-2xl text-amber-700 dark:text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Create New Tender Proposal</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Basic Identification, 4-Tier Geolocation, Stakeholders & Child Phases</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECTION 1: Basic Identification & Auto-Naming */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/90 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                1. Basic Identification & Auto-Naming
              </span>
              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                Fully Editable & Auto-Scanned
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Proposal Year</label>
                <input
                  type="number"
                  value={formData.proposal_year}
                  onChange={(e) => handleInputChange('proposal_year', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 font-mono shadow-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Proposal Code *</label>
                  <button
                    type="button"
                    onClick={onResetAutoCode}
                    className="text-[10px] text-amber-700 dark:text-amber-400 hover:text-amber-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    title="Recalculate next serial"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Reset to Auto</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. SP.2026.04"
                  value={formData.proposal_number}
                  onChange={(e) => handleInputChange('proposal_number', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-500/60 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-amber-900 dark:text-amber-300 font-mono font-bold focus:outline-none shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marassi Beach Club"
                  value={formData.proposal_title}
                  onChange={(e) => handleInputChange('proposal_title', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 shadow-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-amber-300 dark:border-amber-500/30 flex items-center justify-between shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400">Full Proposal Title:</span>
              <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300 truncate max-w-lg">{computedFullTitle}</span>
            </div>
          </div>

          {/* SECTION 2: 4-Tier Cascading Geolocation Engine */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/90 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                2. 4-Tier Cascading Geolocation Engine
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Searchable & Add New Enabled</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SearchableSelect
                label="Country"
                placeholder="Select Country"
                value={formData.country}
                options={countries}
                onChange={handleCountryChange}
                addNewLabel="Add Country"
                onAddNew={(q) => onOpenQuickAdd('country', q)}
              />

              <SearchableSelect
                label="Governorate"
                placeholder="Select Governorate"
                value={formData.governorate}
                options={governorates}
                onChange={handleGovernorateChange}
                addNewLabel="Add Governorate"
                onAddNew={(q) => onOpenQuickAdd('governorate', q)}
              />

              <SearchableSelect
                label="Region / City"
                placeholder="Select Region"
                value={formData.region}
                options={regions}
                onChange={handleRegionChange}
                addNewLabel="Add Region"
                onAddNew={(q) => onOpenQuickAdd('region', q)}
              />

              <SearchableSelect
                label="District"
                placeholder="Select District"
                value={formData.district}
                options={districts}
                onChange={(val) => handleInputChange('district', val)}
                addNewLabel="Add District"
                onAddNew={(q) => onOpenQuickAdd('district', q)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 block mb-1">Postal / Site Address</label>
                <input
                  type="text"
                  placeholder="Street, Plot No, or Compound Name"
                  value={formData.postal_address}
                  onChange={(e) => handleInputChange('postal_address', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500 shadow-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 block mb-1">GPS Location / Coordinates</label>
                <input
                  type="text"
                  placeholder="e.g. 30.0131, 31.4988"
                  value={formData.gps_location}
                  onChange={(e) => handleInputChange('gps_location', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-cyan-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Stakeholders & Consultant Team */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/90 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                <Building className="w-4 h-4" />
                3. Stakeholders & Consultant Team
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">All Directory Lookups from Clients Table</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SearchableSelect
                label="Project Owner / Client"
                placeholder="Search Client Directory"
                value={formData.client_id}
                options={clients}
                onChange={handleClientChange}
                addNewLabel="Add Client"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />

              <SearchableSelect
                label="Main Contractor"
                placeholder="Search Contractor / Client"
                value={formData.main_contractor}
                valueKey="label"
                options={clients}
                onChange={(val) => handleInputChange('main_contractor', val)}
                addNewLabel="Add Contractor"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1">P.ZONE Role *</label>
                <select
                  value={formData.pzone_role}
                  onChange={(e) => handleInputChange('pzone_role', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-500/50 rounded-xl px-3 py-2 text-xs text-indigo-800 dark:text-indigo-300 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                >
                  <option value="Sub Contractor">Sub Contractor</option>
                  <option value="Main Contractor">Main Contractor</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <SearchableSelect
                label="Civil Consultant"
                placeholder="Select Civil Consultant"
                value={formData.civil_consultant}
                valueKey="label"
                options={clients}
                onChange={(val) => handleInputChange('civil_consultant', val)}
                addNewLabel="Add Consultant"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />

              <SearchableSelect
                label="Mechanical Consultant"
                placeholder="Select Mech Consultant"
                value={formData.mechanical_consultant}
                valueKey="label"
                options={clients}
                onChange={(val) => handleInputChange('mechanical_consultant', val)}
                addNewLabel="Add Consultant"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />

              <SearchableSelect
                label="Electric Consultant"
                placeholder="Select Elec Consultant"
                value={formData.electric_consultant}
                valueKey="label"
                options={clients}
                onChange={(val) => handleInputChange('electric_consultant', val)}
                addNewLabel="Add Consultant"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />

              <SearchableSelect
                label="Landscape Consultant"
                placeholder="Select Landscape Consultant"
                value={formData.landscape_consultant}
                valueKey="label"
                options={clients}
                onChange={(val) => handleInputChange('landscape_consultant', val)}
                addNewLabel="Add Consultant"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />
            </div>
          </div>

          {/* SECTION 4: Scheduling & Deadline Calculations */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/90 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                4. Scheduling & Deadline Calculations
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Target Submittal = Request Date + 7 Days</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Proposal Request Date</label>
                <input
                  type="date"
                  value={formData.proposal_request_date}
                  onChange={(e) => handleInputChange('proposal_request_date', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Submittal Date (+7 Days)</label>
                <input
                  type="date"
                  value={formData.proposal_submittal_date}
                  onChange={(e) => handleInputChange('proposal_submittal_date', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Proposal Status</label>
                <select
                  value={formData.proposal_status}
                  onChange={(e) => handleInputChange('proposal_status', e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Sent">Sent</option>
                  <option value="Hold">Hold</option>
                  <option value="Not Sent">Not Sent</option>
                  <option value="Out of Scope">Out of Scope</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {formData.proposal_status === 'Sent' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-300 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in shadow-xs">
                <span>Sent Timestamp Captured (Egypt / Cairo):</span>
                <span className="font-mono font-bold">{formData.sent_date ? formatDateTimeCairo(formData.sent_date) : 'Now (Cairo Time)'}</span>
              </div>
            )}
          </div>

          {/* SECTION 5: Direct Child Phase Spawning */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/90 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                5. Direct Child Phase Spawning
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddWaterFeaturePhase}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-100 dark:bg-cyan-950 hover:bg-cyan-200 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800/80 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <Waves className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" />
                  <span>+ Add Water Feature</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddPumpRoomPhase}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800/80 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <Cpu className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                  <span>+ Add Pump Room</span>
                </button>
              </div>
            </div>

            {/* Phases List with Interactive Scope Selector */}
            <div className="space-y-3">
              {formData.phases.map((phase, idx) => {
                const activeScopes = (phase.scope_of_work || '').split(',').map(s => s.trim()).filter(Boolean);

                return (
                  <div key={phase.id} className="p-4 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/90 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="w-6 h-6 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-mono text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Phase Title (e.g. Swimming Pool 01)"
                          value={phase.phase_title}
                          onChange={(e) => handlePhaseFieldChange(idx, 'phase_title', e.target.value)}
                          className="w-full max-w-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none"
                        />
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800/80 hidden sm:inline-block">
                          {formData.proposal_number}.{phase.phase_title || 'Phase'}
                        </span>
                      </div>

                      {formData.phases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhase(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-950 rounded-xl transition cursor-pointer"
                          title="Remove Phase"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                          Select Applicable Scopes of Work:
                        </label>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handlePhaseFieldChange(idx, 'scope_of_work', AVAILABLE_SCOPES.map(s => s.id).join(', '))}
                            className="text-purple-700 dark:text-purple-400 hover:underline cursor-pointer font-bold"
                          >
                            Select All (4 Trades)
                          </button>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <button
                            type="button"
                            onClick={() => handlePhaseFieldChange(idx, 'scope_of_work', 'Mechanical Works, Electrical Works')}
                            className="text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer font-bold"
                          >
                            MEP Only
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {AVAILABLE_SCOPES.map(scope => {
                          const isChecked = activeScopes.includes(scope.id);
                          return (
                            <button
                              key={scope.id}
                              type="button"
                              onClick={() => togglePhaseScope(idx, scope.id)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer text-left shadow-xs ${
                                isChecked
                                  ? `${scope.color} ring-1 ring-black/5 dark:ring-white/10`
                                  : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:text-slate-700'
                              }`}
                            >
                              <span className="truncate">{scope.label}</span>
                              <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ml-1.5 flex-shrink-0 ${
                                isChecked ? 'bg-black/10 dark:bg-white/20 text-current' : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-transparent'
                              }`}>
                                ✓
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Modal Bottom Submission Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onSave(false)}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Saving...' : 'Save Whole Tender & All Phases'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onSave(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-cyan-900/20 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : '🚀 Save Draft & Open in Phases Tab'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
