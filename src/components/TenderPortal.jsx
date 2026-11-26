import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet,
  Waves, 
  Plus, 
  Search, 
  Layers, 
  MapPin, 
  Clock, 
  Eye, 
  RefreshCw, 
  Trash2, 
  Download, 
  Table as TableIcon, 
  LayoutGrid, 
  CheckCircle2,
  FileCheck,
  ChevronRight,
  Edit3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  buildErpAuditFields,
  nowCairoIso,
  todayCairoIso,
} from '../lib/erpBridge';
import { useLookup } from '../lib/lookupContext';
import CreateTenderModal, { AVAILABLE_SCOPES } from './CreateTenderModal';
import EditTenderModal from './EditTenderModal';
import TenderDetailDrawer from './TenderDetailDrawer';
import QuickAddModal from './QuickAddModal';

export default function TenderPortal() {
  const { lookupCache, getResolvedLabel, reloadLookups } = useLookup();
  const [tenders, setTenders] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayLayout, setDisplayLayout] = useState('table'); // 'table' | 'cards'
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState('proposal_number');
  const [sortDirection, setSortDirection] = useState('desc');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectingTender, setInspectingTender] = useState(null);
  const [editingTender, setEditingTender] = useState(null);

  // Quick Add Record Modal State
  const [quickAddModal, setQuickAddModal] = useState({
    isOpen: false,
    type: null,
    title: '',
    client_type: 'Corporate',
    contact_person: '',
    isSaving: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const getSubmittalDateFromRequest = (reqDateStr) => {
    try {
      const baseStr = reqDateStr || todayCairoIso();
      const d = new Date(`${baseStr}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 7);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const DEFAULT_SCOPE = 'Civil Structural Works, Finishes Works, Mechanical Works, Electrical Works';

  const calculateNextCode = (tenderList, year) => {
    const yr = Number(year) || new Date().getFullYear();
    const currentYearTenders = (tenderList || []).filter(t => Number(t.proposal_year) === yr);

    let maxSerial = 0;
    currentYearTenders.forEach(t => {
      const code = String(t.proposal_number || '');
      const parts = code.split('.');
      const lastPart = parts[parts.length - 1];
      const parsedNum = parseInt(lastPart, 10);
      if (!isNaN(parsedNum) && parsedNum > maxSerial) {
        maxSerial = parsedNum;
      }
    });

    const nextSerial = maxSerial + 1;
    const pad2 = String(nextSerial).padStart(2, '0');
    return `SP.${yr}.${pad2}`;
  };

  const getInitialFormState = (nextCode = 'SP.2026.01') => {
    const today = todayCairoIso();
    return {
      proposal_year: Number(today.slice(0, 4)),
      proposal_number: nextCode,
      proposal_title: '',
      country: '1b89deb5-a904-41d8-b185-555e4fc69380', // Egypt
      governorate: '',
      region: '',
      district: '',
      postal_address: '',
      gps_location: '',
      pzone_role: 'Sub Contractor',
      client_id: '',
      owner: '',
      main_contractor: '',
      civil_consultant: '',
      mechanical_consultant: '',
      electric_consultant: '',
      landscape_consultant: '',
      sales_representative: '',
      proposal_request_date: today,
      proposal_submittal_date: getSubmittalDateFromRequest(today),
      notes: '',
      proposal_status: 'In Progress',
      sent_date: null,
      commercial_overheads: 15,
      phases: [
        {
          id: '1',
          phase_title: 'Swimming Pool 01',
          scope_of_work: DEFAULT_SCOPE,
          component_type: 'Water Feature'
        }
      ]
    };
  };

  const [formData, setFormData] = useState(getInitialFormState());

  const countries = useMemo(() => Object.values(lookupCache['countries'] || {}), [lookupCache]);
  
  const governorates = useMemo(() => {
    const list = Object.values(lookupCache['governorates'] || {});
    if (!formData.country) return list;
    return list.filter(g => g.raw?.country_id === formData.country || !g.raw?.country_id);
  }, [lookupCache, formData.country]);

  const regions = useMemo(() => {
    const list = Object.values(lookupCache['regions'] || {});
    if (!formData.governorate) return list;
    return list.filter(r => r.raw?.governorate_id === formData.governorate || !r.raw?.governorate_id);
  }, [lookupCache, formData.governorate]);

  const districts = useMemo(() => {
    const list = Object.values(lookupCache['districts'] || {});
    if (!formData.region) return list;
    return list.filter(d => d.raw?.region_id === formData.region || !d.raw?.region_id);
  }, [lookupCache, formData.region]);

  const clients = useMemo(() => Object.values(lookupCache['clients'] || {}), [lookupCache]);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const { data: tenderData, error: tErr } = await supabase
        .from('tender_log')
        .select('*')
        .order('created_at', { ascending: false });

      if (tErr) throw tErr;

      const { data: phaseData } = await supabase.from('phases').select('*');

      setTenders(tenderData || []);
      setPhases(phaseData || []);

      const nextCode = calculateNextCode(tenderData, new Date().getFullYear());
      setFormData(prev => ({ ...prev, proposal_number: nextCode }));
    } catch (err) {
      console.error('Error fetching tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const computedFullTitle = useMemo(() => {
    const code = formData.proposal_number || 'SP.2026.01';
    const title = formData.proposal_title.trim();
    return title ? `${code}: ${title}` : code;
  }, [formData.proposal_number, formData.proposal_title]);

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'proposal_request_date') {
        updated.proposal_submittal_date = getSubmittalDateFromRequest(value);
      }
      if (field === 'proposal_status') {
        updated.sent_date = value === 'Sent' ? nowCairoIso() : null;
      }
      if (field === 'proposal_year') {
        updated.proposal_number = calculateNextCode(tenders, value);
      }
      return updated;
    });
  };

  const handleCountryChange = (countryId) => {
    setFormData(prev => ({ ...prev, country: countryId, governorate: '', region: '', district: '' }));
  };

  const handleGovernorateChange = (govId) => {
    setFormData(prev => ({ ...prev, governorate: govId, region: '', district: '' }));
  };

  const handleRegionChange = (regId) => {
    setFormData(prev => ({ ...prev, region: regId, district: '' }));
  };

  const handleClientChange = (clientId) => {
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      owner: selectedClient?.label || prev.owner
    }));
  };

  const openQuickAddModal = (type, prefill = '') => {
    setQuickAddModal({
      isOpen: true,
      type,
      title: prefill || '',
      client_type: 'Corporate',
      contact_person: '',
      isSaving: false
    });
  };

  const handleSaveQuickRecord = async (e) => {
    e.preventDefault();
    if (!quickAddModal.title.trim()) return;

    setQuickAddModal(prev => ({ ...prev, isSaving: true }));
    try {
      const { type, title, client_type, contact_person } = quickAddModal;
      let insertedId = null;

      const auditInsert = buildErpAuditFields(false);
      if (type === 'country') {
        const { data, error } = await supabase.from('countries').insert([{ title: title.trim(), ...auditInsert }]).select().single();
        if (error) throw error;
        insertedId = data.id;
        handleCountryChange(insertedId);
      } else if (type === 'governorate') {
        const { data, error } = await supabase.from('governorates').insert([{
          title: title.trim(),
          country_id: formData.country || '1b89deb5-a904-41d8-b185-555e4fc69380',
          ...auditInsert
        }]).select().single();
        if (error) throw error;
        insertedId = data.id;
        handleGovernorateChange(insertedId);
      } else if (type === 'region') {
        const { data, error } = await supabase.from('regions').insert([{
          title: title.trim(),
          governorate_id: formData.governorate || null,
          country_id: formData.country || null,
          ...auditInsert
        }]).select().single();
        if (error) throw error;
        insertedId = data.id;
        handleRegionChange(insertedId);
      } else if (type === 'district') {
        const { data, error } = await supabase.from('districts').insert([{
          title: title.trim(),
          region_id: formData.region || null,
          ...auditInsert
        }]).select().single();
        if (error) throw error;
        insertedId = data.id;
        setFormData(prev => ({ ...prev, district: insertedId }));
      } else if (type === 'client') {
        const { data, error } = await supabase.from('clients').insert([{
          title: title.trim(),
          client_type: client_type || 'Corporate',
          contact_person: contact_person.trim() || null,
          ...auditInsert
        }]).select().single();
        if (error) throw error;
        insertedId = data.id;
        handleClientChange(insertedId);
      }

      await reloadLookups();
      setQuickAddModal({ isOpen: false, type: null, title: '', client_type: 'Corporate', contact_person: '', isSaving: false });
      showToast(`Added new ${type} "${title}"`);
    } catch (err) {
      showToast('Failed to add record: ' + err.message);
      setQuickAddModal(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleAddWaterFeaturePhase = () => {
    const count = formData.phases.filter(p => p.component_type === 'Water Feature' || p.phase_title.toLowerCase().includes('pool')).length;
    const nextIndex = String(count + 1).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      phases: [...prev.phases, { id: String(Date.now()), phase_title: `Swimming Pool ${nextIndex}`, scope_of_work: DEFAULT_SCOPE, component_type: 'Water Feature' }]
    }));
  };

  const handleAddPumpRoomPhase = () => {
    const count = formData.phases.filter(p => p.component_type === 'Pump Room' || p.phase_title.toLowerCase().includes('pump')).length;
    const nextIndex = String(count + 1).padStart(2, '0');
    setFormData(prev => ({
      ...prev,
      phases: [...prev.phases, { id: String(Date.now()), phase_title: `Pump Room ${nextIndex}`, scope_of_work: 'Mechanical Works, Electrical Works', component_type: 'Pump Room' }]
    }));
  };

  const handleRemovePhase = (index) => {
    if (formData.phases.length <= 1) return;
    setFormData(prev => ({ ...prev, phases: prev.phases.filter((_, i) => i !== index) }));
  };

  const handlePhaseFieldChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.phases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, phases: updated };
    });
  };

  const togglePhaseScope = (phaseIndex, scopeName) => {
    setFormData(prev => {
      const updatedPhases = [...prev.phases];
      const currentScopeStr = updatedPhases[phaseIndex].scope_of_work || '';
      let currentScopes = currentScopeStr.split(',').map(s => s.trim()).filter(Boolean);

      if (currentScopes.includes(scopeName)) {
        currentScopes = currentScopes.filter(s => s !== scopeName);
      } else {
        currentScopes = AVAILABLE_SCOPES.map(s => s.id).filter(id => currentScopes.includes(id) || id === scopeName);
      }

      updatedPhases[phaseIndex] = {
        ...updatedPhases[phaseIndex],
        scope_of_work: currentScopes.join(', ')
      };

      return { ...prev, phases: updatedPhases };
    });
  };

  const handleSaveTender = async (openPhasesTab = false) => {
    if (!formData.proposal_title || !formData.proposal_title.trim()) {
      showToast('Please enter a Project Title (e.g. Marassi Beach Club)');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullTitle = computedFullTitle || (formData.proposal_title ? `${formData.proposal_number}: ${formData.proposal_title}` : formData.proposal_number);

      const tenderPayload = {
        proposal_year: String(formData.proposal_year || new Date().getFullYear()),
        proposal_number: (formData.proposal_number || '').trim(),
        proposal_title: formData.proposal_title.trim(),
        proposal_full_title: fullTitle,
        pzone_role: formData.pzone_role || 'Sub Contractor',
        client_id: formData.client_id || null,
        owner: formData.owner || null,
        country: formData.country || null,
        governorate: formData.governorate || null,
        region: formData.region || null,
        district: formData.district || null,
        postal_address: formData.postal_address || null,
        gps_location: formData.gps_location || null,
        main_contractor: formData.main_contractor || null,
        civil_consultant: formData.civil_consultant || null,
        mechanical_consultant: formData.mechanical_consultant || null,
        electric_consultant: formData.electric_consultant || null,
        landscape_consultant: formData.landscape_consultant || null,
        proposal_request_date: formData.proposal_request_date || null,
        proposal_submittal_date: formData.proposal_submittal_date || null,
        proposal_status: formData.proposal_status || 'In Progress',
        sent_date: formData.proposal_status === 'Sent' ? nowCairoIso() : null,
        notes: formData.notes || null,
        commercial_overheads: Number(formData.commercial_overheads) || 15,
        ...buildErpAuditFields(false)
      };

      const { data: newTender, error: tenderErr } = await supabase.from('tender_log').insert(tenderPayload).select().single();
      if (tenderErr) throw tenderErr;

      const validPhases = (formData.phases || []).filter(p => p.phase_title && p.phase_title.trim() !== '');
      if (validPhases.length > 0) {
        const phasesPayload = validPhases.map(p => ({
          tender_log_id: newTender.id,
          phase_title: p.phase_title.trim(),
          phase_full_title: `${newTender.proposal_number}.${p.phase_title.trim()}`,
          scope_of_work: p.scope_of_work || '',
          component_type: p.component_type || 'Water Feature',
          ...buildErpAuditFields(false)
        }));

        const { error: phaseErr } = await supabase.from('phases').insert(phasesPayload);
        if (phaseErr) {
          console.error('Phase insert error:', phaseErr);
          throw phaseErr;
        }
      }

      showToast(`Tender "${newTender.proposal_full_title}" created successfully!`);
      setShowCreateModal(false);
      await fetchTenders();

      if (openPhasesTab) {
        setInspectingTender(newTender);
      }

      const nextCode = calculateNextCode(tenders, formData.proposal_year);
      setFormData(getInitialFormState(nextCode));

    } catch (err) {
      console.error('Error saving tender:', err);
      showToast('Error saving tender: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExistingTender = async (e) => {
    e.preventDefault();
    if (!editingTender) return;

    setIsSubmitting(true);
    try {
      const fullTitle = editingTender.proposal_title 
        ? `${editingTender.proposal_number}: ${editingTender.proposal_title}`
        : editingTender.proposal_number;

      const updatePayload = {
        proposal_year: String(editingTender.proposal_year),
        proposal_number: editingTender.proposal_number.trim(),
        proposal_title: editingTender.proposal_title.trim(),
        proposal_full_title: fullTitle,
        pzone_role: editingTender.pzone_role,
        client_id: editingTender.client_id || null,
        owner: editingTender.owner || null,
        country: editingTender.country || null,
        governorate: editingTender.governorate || null,
        region: editingTender.region || null,
        district: editingTender.district || null,
        postal_address: editingTender.postal_address || null,
        gps_location: editingTender.gps_location || null,
        main_contractor: editingTender.main_contractor || null,
        civil_consultant: editingTender.civil_consultant || null,
        mechanical_consultant: editingTender.mechanical_consultant || null,
        electric_consultant: editingTender.electric_consultant || null,
        landscape_consultant: editingTender.landscape_consultant || null,
        proposal_request_date: editingTender.proposal_request_date || null,
        proposal_submittal_date: editingTender.proposal_submittal_date || null,
        proposal_status: editingTender.proposal_status,
        sent_date: editingTender.proposal_status === 'Sent' ? (editingTender.sent_date || nowCairoIso()) : null,
        notes: editingTender.notes || null,
        ...buildErpAuditFields(true)
      };

      const { error: updErr } = await supabase.from('tender_log').update(updatePayload).eq('id', editingTender.id);
      if (updErr) throw updErr;

      setTenders(prev => prev.map(t => t.id === editingTender.id ? { ...t, ...updatePayload } : t));
      if (inspectingTender?.id === editingTender.id) {
        setInspectingTender({ ...inspectingTender, ...updatePayload });
      }

      showToast(`Tender "${fullTitle}" updated successfully!`);
      setEditingTender(null);
      await fetchTenders();
    } catch (err) {
      showToast('Failed to update tender: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (tenderId, newStatus) => {
    try {
      const updatePayload = {
        proposal_status: newStatus,
        sent_date: newStatus === 'Sent' ? nowCairoIso() : null,
        ...buildErpAuditFields(true)
      };

      const { error: updErr } = await supabase.from('tender_log').update(updatePayload).eq('id', tenderId);
      if (updErr) throw updErr;

      setTenders(prev => prev.map(t => t.id === tenderId ? { ...t, ...updatePayload } : t));
      if (inspectingTender?.id === tenderId) {
        setInspectingTender(prev => ({ ...prev, ...updatePayload }));
      }
      showToast(`Status updated to "${newStatus}"`);
    } catch (err) {
      showToast('Failed to update status: ' + err.message);
    }
  };

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    tenderId: null,
    fullTitle: '',
    isDeleting: false
  });

  const promptDeleteTender = (tenderId, fullTitle, e) => {
    if (e) e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      tenderId,
      fullTitle,
      isDeleting: false
    });
  };

  const handleConfirmDeleteTender = async () => {
    if (!deleteModal.tenderId) return;
    const { tenderId, fullTitle } = deleteModal;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      // 1. Fetch all associated phase IDs
      const { data: childPhases } = await supabase
        .from('phases')
        .select('id')
        .eq('tender_log_id', tenderId);
      
      const phaseIds = (childPhases || []).map(p => p.id);

      // 2. Delete proposal breakdown items (by tender_log_id and by phase_id)
      if (phaseIds.length > 0) {
        await supabase.from('proposal_breakdown_items').delete().in('phase_id', phaseIds);
      }
      await supabase.from('proposal_breakdown_items').delete().eq('tender_log_id', tenderId);

      // 3. Delete finishes
      await supabase.from('proposal_finishes_water_feature').delete().eq('linked_proposal', tenderId);
      await supabase.from('proposal_finishes_pump_room').delete().eq('linked_proposal', tenderId);

      // 4. Delete structural works
      await supabase.from('water_feature_structural_works').delete().eq('tender_log_id', tenderId);
      await supabase.from('pump_room_structural_works').delete().eq('tender_log_id', tenderId);

      // 5. Delete proposal and pump room data entries
      await supabase.from('proposal_data_entry').delete().eq('tender_log_id', tenderId);
      await supabase.from('pump_room_data_entry').delete().eq('tender_log_id', tenderId);

      // 6. Delete phases
      await supabase.from('phases').delete().eq('tender_log_id', tenderId);

      // 7. Delete master tender log record
      const { error: delErr } = await supabase.from('tender_log').delete().eq('id', tenderId);
      if (delErr) throw delErr;

      setTenders(prev => prev.filter(t => t.id !== tenderId));
      setPhases(prev => prev.filter(p => p.tender_log_id !== tenderId));
      if (inspectingTender?.id === tenderId) setInspectingTender(null);
      showToast(`Tender "${fullTitle}" and all associated data deleted successfully.`);
      if (fetchTenders) fetchTenders();
      setDeleteModal({ isOpen: false, tenderId: null, fullTitle: '', isDeleting: false });
    } catch (err) {
      console.error('Error deleting tender:', err);
      showToast('Error deleting tender: ' + err.message);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const filteredTenders = useMemo(() => {
    return tenders.filter(t => {
      const matchStatus = statusFilter === 'all' || t.proposal_status === statusFilter;
      const matchYear = yearFilter === 'all' || String(t.proposal_year) === yearFilter;
      const q = searchQuery.toLowerCase();
      const clientName = getResolvedLabel('clients', t.client_id) || t.owner || '';
      const govName = getResolvedLabel('governorates', t.governorate) || '';

      const matchSearch = !searchQuery ||
        (t.proposal_title && t.proposal_title.toLowerCase().includes(q)) ||
        (t.proposal_full_title && t.proposal_full_title.toLowerCase().includes(q)) ||
        (t.proposal_number && t.proposal_number.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        clientName.toLowerCase().includes(q) ||
        govName.toLowerCase().includes(q);

      return matchStatus && matchYear && matchSearch;
    }).sort((a, b) => {
      let valA = a[sortColumn] ?? '';
      let valB = b[sortColumn] ?? '';
      return sortDirection === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  }, [tenders, statusFilter, yearFilter, searchQuery, sortColumn, sortDirection, getResolvedLabel]);

  const stats = useMemo(() => {
    const total = tenders.length;
    const inProgress = tenders.filter(t => t.proposal_status === 'In Progress').length;
    const sent = tenders.filter(t => t.proposal_status === 'Sent').length;
    const hold = tenders.filter(t => t.proposal_status === 'Hold').length;
    return { total, inProgress, sent, hold, phasesCount: phases.length };
  }, [tenders, phases]);

  const distinctYears = useMemo(() => {
    const set = new Set(tenders.map(t => String(t.proposal_year || 2026)));
    return Array.from(set).sort().reverse();
  }, [tenders]);

  const openNewTenderModal = () => {
    const nextCode = calculateNextCode(tenders, new Date().getFullYear());
    setFormData(getInitialFormState(nextCode));
    setShowCreateModal(true);
  };

  const exportTendersCSV = () => {
    if (filteredTenders.length === 0) return;
    const cols = ['proposal_number', 'proposal_title', 'proposal_full_title', 'proposal_status', 'pzone_role', 'owner', 'governorate', 'proposal_request_date', 'proposal_submittal_date', 'sent_date'];
    const headers = cols.join(',');
    const rows = filteredTenders.map(t => {
      const client = getResolvedLabel('clients', t.client_id) || t.owner || '';
      const gov = getResolvedLabel('governorates', t.governorate) || '';
      return [
        `"${t.proposal_number || ''}"`,
        `"${t.proposal_title || ''}"`,
        `"${t.proposal_full_title || ''}"`,
        `"${t.proposal_status || ''}"`,
        `"${t.pzone_role || ''}"`,
        `"${client}"`,
        `"${gov}"`,
        `"${t.proposal_request_date || ''}"`,
        `"${t.proposal_submittal_date || ''}"`,
        `"${t.sent_date || ''}"`
      ].join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tender_log_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 dark:bg-emerald-950 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/90 shadow-sm w-full">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full">
              Tender Workspace
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Tender Log & Proposal Management</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Centralized registry for tender proposals, 4-tier geography, consultant team assignments & project phases.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={openNewTenderModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-cyan-900/20 transition transform hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Tender</span>
          </button>

          <button
            onClick={fetchTenders}
            disabled={loading}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-300 dark:border-slate-700 transition disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh Tender Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-cyan-500/30 rounded-xl text-amber-600 dark:text-amber-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Proposals</p>
            <p className="text-lg font-black font-mono text-slate-900 dark:text-slate-100">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">In Progress</p>
            <p className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Sent / Submitted</p>
            <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{stats.sent}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-xl text-purple-600 dark:text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Phases</p>
            <p className="text-lg font-black font-mono text-purple-600 dark:text-purple-400">{stats.phasesCount}</p>
          </div>
        </div>
      </div>

      {/* Filter & View Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs w-full">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search proposals by code, project, client, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filters & Toggles */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-xs font-semibold"
          >
            <option value="all">All Statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Sent">Sent</option>
            <option value="Hold">Hold</option>
            <option value="Not Sent">Not Sent</option>
            <option value="Out of Scope">Out of Scope</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-xs font-semibold"
          >
            <option value="all">All Years</option>
            {distinctYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={exportTendersCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition cursor-pointer shadow-xs"
            title="Export Tenders to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <div className="flex bg-slate-100 dark:bg-slate-950/80 p-0.5 rounded-xl border border-slate-300 dark:border-slate-800">
            <button
              onClick={() => setDisplayLayout('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${displayLayout === 'table' ? 'bg-white dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-slate-200 dark:border-cyan-500/40 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDisplayLayout('cards')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${displayLayout === 'cards' ? 'bg-white dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-slate-200 dark:border-cyan-500/40 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* TABLE VIEW */}
      {displayLayout === 'table' ? (
        <div className="border border-slate-200 dark:border-slate-800/90 rounded-2xl bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm w-full">
          <div className="overflow-x-auto min-h-[350px]">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead className="bg-slate-50 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 uppercase font-mono text-[11px] sticky top-0 z-10">
                <tr>
                  <th className="p-3.5 w-12 text-center text-slate-400 font-mono">#</th>
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-300">Proposal Code</th>
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-300">Project Title</th>
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-300">Client / Owner</th>
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-300">Role</th>
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-300">Governorate</th>
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-300 text-center">Phases</th>
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-300">Status</th>
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-300">Submittal Date</th>
                  <th className="p-3.5 font-bold text-slate-800 dark:text-slate-300 text-center">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500">
                      <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin mx-auto mb-2" />
                      <span>Loading tender log records...</span>
                    </td>
                  </tr>
                ) : filteredTenders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-500">
                      No tenders match your filter. Click <strong>"+ Add New Tender"</strong> to create one.
                    </td>
                  </tr>
                ) : (
                  filteredTenders.map((t, idx) => {
                    const tenderPhases = phases.filter(p => p.tender_log_id === t.id);
                    const clientName = getResolvedLabel('clients', t.client_id) || t.owner || '—';
                    const govName = getResolvedLabel('governorates', t.governorate) || '—';

                    return (
                      <tr
                        key={t.id}
                        onClick={() => setInspectingTender(t)}
                        className="hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition cursor-pointer group"
                      >
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800/60 px-2.5 py-1 rounded-lg">
                            {t.proposal_number || `SP.${t.proposal_year}.01`}
                          </span>
                        </td>

                        <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition">
                          {t.proposal_title || t.proposal_full_title || 'Untitled Proposal'}
                        </td>

                        <td className="p-3.5 text-slate-700 dark:text-slate-300 max-w-[180px] truncate font-medium">
                          {clientName}
                        </td>

                        <td className="p-3.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                          <span className={`px-2 py-0.5 rounded border ${t.pzone_role === 'Main Contractor' ? 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800' : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800'}`}>
                            {t.pzone_role || 'Sub Contractor'}
                          </span>
                        </td>

                        <td className="p-3.5 text-slate-700 dark:text-slate-300">
                          <span className="inline-flex items-center gap-1 text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800/40 px-2 py-0.5 rounded text-[11px] font-semibold">
                            <MapPin className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400" />
                            {govName}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="text-xs font-mono font-bold text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800/50 px-2 py-0.5 rounded-full">
                            {tenderPhases.length} {tenderPhases.length === 1 ? 'phase' : 'phases'}
                          </span>
                        </td>

                        <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={t.proposal_status || 'In Progress'}
                            onChange={(e) => handleQuickStatusChange(t.id, e.target.value)}
                            className={`text-[11px] font-bold uppercase rounded-lg px-2.5 py-1 border transition focus:outline-none cursor-pointer shadow-xs ${
                              t.proposal_status === 'Sent'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                                : t.proposal_status === 'In Progress'
                                ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                                : t.proposal_status === 'Hold'
                                ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            <option value="In Progress">In Progress</option>
                            <option value="Sent">Sent</option>
                            <option value="Hold">Hold</option>
                            <option value="Not Sent">Not Sent</option>
                            <option value="Out of Scope">Out of Scope</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {t.proposal_submittal_date || '—'}
                        </td>

                        <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onNavigate && onNavigate('/water-features')}
                              className="p-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/80 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 transition cursor-pointer shadow-xs"
                              title="Enter Water Feature & Pump Room Specifications"
                            >
                              <Waves className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingTender({ ...t })}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 border border-slate-300 dark:border-slate-700/60 transition cursor-pointer shadow-xs"
                              title="Edit Proposal Details & Code"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setInspectingTender(t)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-300 dark:border-slate-700/60 transition cursor-pointer shadow-xs"
                              title="Inspect Proposal Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => promptDeleteTender(t.id, t.proposal_full_title || t.proposal_title, e)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700/60 transition cursor-pointer shadow-xs"
                              title="Delete Tender"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between font-medium">
            <span>Showing <strong className="text-slate-900 dark:text-slate-200 font-mono">{filteredTenders.length}</strong> of <strong className="text-slate-900 dark:text-slate-200 font-mono">{tenders.length}</strong> tenders in database</span>
            <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">Direct Supabase Live Sync</span>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          {filteredTenders.map(t => {
            const tenderPhases = phases.filter(p => p.tender_log_id === t.id);
            const clientName = getResolvedLabel('clients', t.client_id) || t.owner || 'Not Assigned';
            const govName = getResolvedLabel('governorates', t.governorate);

            return (
              <div
                key={t.id}
                onClick={() => setInspectingTender(t)}
                className="bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-cyan-500/50 p-6 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800/60 px-2.5 py-0.5 rounded-lg">
                      {t.proposal_number || `SP.${t.proposal_year}.01`}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                      {t.proposal_status || 'In Progress'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition line-clamp-1 mb-1">
                    {t.proposal_title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono line-clamp-1 mb-4">
                    {t.proposal_full_title}
                  </p>

                  <div className="space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Client:</span>
                      <strong className="text-slate-800 dark:text-slate-300 truncate max-w-[160px]">{clientName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Role:</span>
                      <strong className="text-slate-800 dark:text-slate-300">{t.pzone_role || 'Sub Contractor'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Governorate:</span>
                      <strong className="text-cyan-700 dark:text-cyan-300">{govName || 'Egypt'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phases:</span>
                      <strong className="text-purple-700 dark:text-purple-400 font-mono">{tenderPhases.length} Defined</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-bold">
                  <span>Open Scopes & Phases</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER: Tender Details & Phases (Clean Read-Only) */}
      <TenderDetailDrawer
        tender={inspectingTender}
        phases={phases}
        onClose={() => setInspectingTender(null)}
        onEdit={(t) => {
          setInspectingTender(null);
          setEditingTender({ ...t });
        }}
        getResolvedLabel={getResolvedLabel}
      />

      {/* CREATE NEW TENDER MODAL */}
      <CreateTenderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        formData={formData}
        setFormData={setFormData}
        computedFullTitle={computedFullTitle}
        handleInputChange={handleInputChange}
        handleCountryChange={handleCountryChange}
        handleGovernorateChange={handleGovernorateChange}
        handleRegionChange={handleRegionChange}
        handleClientChange={handleClientChange}
        handleAddWaterFeaturePhase={handleAddWaterFeaturePhase}
        handleAddPumpRoomPhase={handleAddPumpRoomPhase}
        handleRemovePhase={handleRemovePhase}
        handlePhaseFieldChange={handlePhaseFieldChange}
        togglePhaseScope={togglePhaseScope}
        countries={countries}
        governorates={governorates}
        regions={regions}
        districts={districts}
        clients={clients}
        onOpenQuickAdd={openQuickAddModal}
        onResetAutoCode={() => {
          const autoCode = calculateNextCode(tenders, formData.proposal_year);
          handleInputChange('proposal_number', autoCode);
        }}
        isSubmitting={isSubmitting}
        onSave={handleSaveTender}
      />

      {/* EDIT EXISTING TENDER MODAL */}
      <EditTenderModal
        editingTender={editingTender}
        setEditingTender={setEditingTender}
        clients={clients}
        isSubmitting={isSubmitting}
        onSubmit={handleUpdateExistingTender}
        onClose={() => setEditingTender(null)}
        onOpenQuickAdd={openQuickAddModal}
      />

      {/* QUICK ADD RECORD MODAL */}
      <QuickAddModal
        isOpen={quickAddModal.isOpen}
        type={quickAddModal.type}
        title={quickAddModal.title}
        setTitle={(t) => setQuickAddModal(prev => ({ ...prev, title: t }))}
        clientType={quickAddModal.client_type}
        setClientType={(ct) => setQuickAddModal(prev => ({ ...prev, client_type: ct }))}
        contactPerson={quickAddModal.contact_person}
        setContactPerson={(cp) => setQuickAddModal(prev => ({ ...prev, contact_person: cp }))}
        isSaving={quickAddModal.isSaving}
        onSave={handleSaveQuickRecord}
        onClose={() => setQuickAddModal(prev => ({ ...prev, isOpen: false }))}
        parentLabel={
          quickAddModal.type === 'governorate' 
            ? getResolvedLabel('countries', formData.country) 
            : quickAddModal.type === 'region' 
            ? getResolvedLabel('governorates', formData.governorate) 
            : quickAddModal.type === 'district'
            ? getResolvedLabel('regions', formData.region)
            : ''
        }
      />

      {/* IN-APP DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Delete Tender Proposal?
                </h3>
                <p className="text-[11px] text-slate-400">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
              Are you sure you want to delete tender <strong className="text-slate-900 dark:text-slate-100">"{deleteModal.fullTitle}"</strong> and all its child phases, technical scope entries, and BOQ breakdown items?
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, tenderId: null, fullTitle: '', isDeleting: false })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTender}
                disabled={deleteModal.isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleteModal.isDeleting ? 'Deleting...' : 'Delete Tender & Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
