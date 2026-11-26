import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

export default function EditTenderModal({
  editingTender,
  setEditingTender,
  clients = [],
  isSubmitting,
  onSubmit,
  onClose,
  onOpenQuickAdd
}) {
  if (!editingTender) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Edit Proposal Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update proposal code, title, role, dates, status & stakeholders</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Proposal Code & Title */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Proposal Year</label>
                <input
                  type="number"
                  value={editingTender.proposal_year}
                  onChange={(e) => setEditingTender(prev => ({ ...prev, proposal_year: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Proposal Code *</label>
                <input
                  type="text"
                  required
                  value={editingTender.proposal_number}
                  onChange={(e) => setEditingTender(prev => ({ ...prev, proposal_number: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-800 dark:text-amber-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={editingTender.proposal_title}
                  onChange={(e) => setEditingTender(prev => ({ ...prev, proposal_title: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
              <span>Computed Full Title:</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
                {editingTender.proposal_number}: {editingTender.proposal_title}
              </span>
            </div>
          </div>

          {/* Role, Status & Dates */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">P.ZONE Role</label>
                <select
                  value={editingTender.pzone_role}
                  onChange={(e) => setEditingTender(prev => ({ ...prev, pzone_role: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Sub Contractor">Sub Contractor</option>
                  <option value="Main Contractor">Main Contractor</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Proposal Status</label>
                <select
                  value={editingTender.proposal_status}
                  onChange={(e) => setEditingTender(prev => ({ ...prev, proposal_status: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Sent">Sent</option>
                  <option value="Hold">Hold</option>
                  <option value="Not Sent">Not Sent</option>
                  <option value="Out of Scope">Out of Scope</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Target Submittal Date</label>
                <input
                  type="date"
                  value={editingTender.proposal_submittal_date || ''}
                  onChange={(e) => setEditingTender(prev => ({ ...prev, proposal_submittal_date: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Stakeholders & Consultants */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Stakeholders & Consultants (Clients Directory)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SearchableSelect
                label="Client / Owner"
                placeholder="Select Client"
                value={editingTender.client_id || ''}
                options={clients}
                onChange={(val) => {
                  const sel = clients.find(c => c.id === val);
                  setEditingTender(prev => ({ ...prev, client_id: val, owner: sel?.label || prev.owner }));
                }}
                addNewLabel="Add Client"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />

              <SearchableSelect
                label="Main Contractor"
                placeholder="Select Main Contractor"
                value={editingTender.main_contractor || ''}
                valueKey="label"
                options={clients}
                onChange={(val) => setEditingTender(prev => ({ ...prev, main_contractor: val }))}
                addNewLabel="Add Contractor"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <SearchableSelect
                label="Civil Consultant"
                placeholder="Civil Consultant"
                value={editingTender.civil_consultant || ''}
                valueKey="label"
                options={clients}
                onChange={(val) => setEditingTender(prev => ({ ...prev, civil_consultant: val }))}
                addNewLabel="Add"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />

              <SearchableSelect
                label="Mech Consultant"
                placeholder="Mech Consultant"
                value={editingTender.mechanical_consultant || ''}
                valueKey="label"
                options={clients}
                onChange={(val) => setEditingTender(prev => ({ ...prev, mechanical_consultant: val }))}
                addNewLabel="Add"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />

              <SearchableSelect
                label="Elec Consultant"
                placeholder="Elec Consultant"
                value={editingTender.electric_consultant || ''}
                valueKey="label"
                options={clients}
                onChange={(val) => setEditingTender(prev => ({ ...prev, electric_consultant: val }))}
                addNewLabel="Add"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />

              <SearchableSelect
                label="Landscape Consultant"
                placeholder="Landscape Consultant"
                value={editingTender.landscape_consultant || ''}
                valueKey="label"
                options={clients}
                onChange={(val) => setEditingTender(prev => ({ ...prev, landscape_consultant: val }))}
                addNewLabel="Add"
                onAddNew={(q) => onOpenQuickAdd('client', q)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Notes</label>
            <textarea
              rows={2}
              value={editingTender.notes || ''}
              onChange={(e) => setEditingTender(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Internal notes..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes to Supabase'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
