import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  addDirectoryDatabaseEntry,
  addTenderDocument,
  createTender,
  getLookupsByCategory,
  getTenders,
  subscribeDataStore,
  suggestNextProposalCode,
} from '@/lib/dataStore';
import { detectDuplicateTender } from '@/lib/formulas';
import { SearchableDbSelect } from '@/components/ui/SearchableDbSelect';
import { DatePickerInput, todayCairoIso } from '@/components/ui/DatePickerInput';

const WIZARD_DRAFT_KEY = 'pzone_wizard_draft_v3_geo';

interface WizardDraft {
  step?: 1 | 2 | 3 | 4;
  year?: number;
  proposalCode?: string;
  proposalName?: string;
  salesRepId?: string;
  pzoneRole?: string;
  projectPriority?: string;
  owner?: string;
  contractor?: string;
  country?: string;
  governorate?: string;
  area?: string;
  district?: string;
  location?: string;
  contactName?: string;
  contactJobTitle?: string;
  contactNumber?: string;
  contactEmail?: string;
  contactAddress?: string;
  receivedDate?: string;
  deadlineDate?: string;
  scopeOfWork?: string[];
  statusNotes?: string;
  serverLinkPath?: string;
}

function readWizardDraft(): WizardDraft | null {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as WizardDraft) : null;
  } catch {
    return null;
  }
}

export const TenderNew: React.FC = () => {
  const navigate = useNavigate();
  const { user, language } = useApp();
  const isAr = language === 'ar';

  const today = todayCairoIso();
  const currentYear = Number(today.slice(0, 4));
  const initialDraft = useMemo(() => readWizardDraft(), []);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialDraft?.step ?? 1);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [year, setYear] = useState(initialDraft?.year ?? currentYear);
  const [proposalCode, setProposalCode] = useState(
    () => initialDraft?.proposalCode ?? suggestNextProposalCode(currentYear)
  );
  const [proposalName, setProposalName] = useState(
    initialDraft?.proposalName ?? ''
  );
  const [salesRepId, setSalesRepId] = useState(
    initialDraft?.salesRepId && !initialDraft.salesRepId.startsWith('lv-sr-')
      ? initialDraft.salesRepId
      : ''
  );
  const [pzoneRole, setPzoneRole] = useState(
    initialDraft?.pzoneRole ?? 'Sub Contractor'
  );
  const [projectPriority, setProjectPriority] = useState(
    initialDraft?.projectPriority ?? 'High'
  );

  // Step 2: Client, Geography & Contact
  const [dbVersion, setDbVersion] = useState(0);
  useEffect(() => {
    return subscribeDataStore(() => setDbVersion((v) => v + 1));
  }, []);

  const [owner, setOwner] = useState(initialDraft?.owner ?? '');
  const [contractor, setContractor] = useState(
    initialDraft?.contractor ?? ''
  );
  const [country, setCountry] = useState(initialDraft?.country ?? 'Egypt');
  const [governorate, setGovernorate] = useState(
    initialDraft?.governorate ?? 'Cairo'
  );
  const [area, setArea] = useState(
    initialDraft?.area ?? 'New Cairo & Fifth Settlement'
  );
  const [district, setDistrict] = useState(initialDraft?.district ?? '');
  const [location, setLocation] = useState(initialDraft?.location ?? '');
  const [contactName, setContactName] = useState(
    initialDraft?.contactName ?? ''
  );
  const [contactJobTitle, setContactJobTitle] = useState(
    initialDraft?.contactJobTitle ?? ''
  );
  const [contactNumber, setContactNumber] = useState(
    initialDraft?.contactNumber ?? ''
  );
  const [contactEmail, setContactEmail] = useState(
    initialDraft?.contactEmail ?? ''
  );
  const [contactAddress, setContactAddress] = useState(
    initialDraft?.contactAddress ?? ''
  );

  // Step 3: Dates & Scope
  const [receivedDate, setReceivedDate] = useState(
    initialDraft?.receivedDate ?? today
  );
  const [deadlineDate, setDeadlineDate] = useState(
    initialDraft?.deadlineDate ?? ''
  );
  const [scopeOfWork, setScopeOfWork] = useState<string[]>(() => {
    const base = initialDraft?.scopeOfWork ?? [
      'Civil & Structural Works',
      'Mechanical Works',
      'Electrical & Automation',
    ];
    return base.map((s) =>
      s === 'Mechanical Works (MEP)' ? 'Mechanical Works' : s
    );
  });
  const [statusNotes, setStatusNotes] = useState(
    initialDraft?.statusNotes ?? ''
  );

  // Step 4: Server Link Documents
  const [serverLinkPath, setServerLinkPath] = useState(
    initialDraft?.serverLinkPath ??
      `\\\\PZ-SERVER\\Tenders\\${currentYear}\\${proposalCode}`
  );
  const [extraDocs, setExtraDocs] = useState<
    Array<{ file_name: string; doc_type: string; server_path: string; version: string }>
  >([]);

  const isDirty = Boolean(
    proposalName.trim() || owner.trim() || contractor.trim() || location.trim()
  );

  useEffect(() => {
    const draft: WizardDraft = {
      step,
      year,
      proposalCode,
      proposalName,
      salesRepId,
      pzoneRole,
      projectPriority,
      owner,
      contractor,
      country,
      governorate,
      area,
      district,
      location,
      contactName,
      contactJobTitle,
      contactNumber,
      contactEmail,
      contactAddress,
      receivedDate,
      deadlineDate,
      scopeOfWork,
      statusNotes,
      serverLinkPath,
    };
    try {
      localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore storage quota errors
    }
  }, [
    step,
    year,
    proposalCode,
    proposalName,
    salesRepId,
    pzoneRole,
    projectPriority,
    owner,
    contractor,
    country,
    governorate,
    area,
    district,
    location,
    contactName,
    contactJobTitle,
    contactNumber,
    contactEmail,
    contactAddress,
    receivedDate,
    deadlineDate,
    scopeOfWork,
    statusNotes,
    serverLinkPath,
  ]);

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleClearDraft = () => {
    localStorage.removeItem(WIZARD_DRAFT_KEY);
    const nextCode = suggestNextProposalCode(currentYear);
    setStep(1);
    setYear(currentYear);
    setProposalCode(nextCode);
    setProposalName('');
    setSalesRepId('');
    setOwner('');
    setContractor('');
    setLocation('');
    setContactName('');
    setContactJobTitle('');
    setContactNumber('');
    setContactEmail('');
    setContactAddress('');
    setDeadlineDate('');
    setStatusNotes('');
    setServerLinkPath(`\\\\PZ-SERVER\\Tenders\\${currentYear}\\${nextCode}`);
  };

  const salesReps = useMemo(
    () => getLookupsByCategory('sales_representative'),
    [dbVersion]
  );
  const rolesList = useMemo(
    () => getLookupsByCategory('pzone_role'),
    [dbVersion]
  );
  const priorities = useMemo(
    () => getLookupsByCategory('project_priority'),
    [dbVersion]
  );
  // Unified Company Directory: both Owner / Developer and Main Contractor read from the exact same database
  const companiesDb = useMemo(
    () => getLookupsByCategory('company_directory'),
    [dbVersion]
  );
  const ownersDb = companiesDb;
  const countriesDb = useMemo(
    () => getLookupsByCategory('country'),
    [dbVersion]
  );
  const allGovernoratesDb = useMemo(
    () => getLookupsByCategory('governorate'),
    [dbVersion]
  );
  const allAreasDb = useMemo(() => getLookupsByCategory('area'), [dbVersion]);
  const allDistrictsDb = useMemo(
    () => getLookupsByCategory('district'),
    [dbVersion]
  );
  const scopes = useMemo(
    () => getLookupsByCategory('scope_of_work'),
    [dbVersion]
  );

  // Filter Governorates by selected Country
  const filteredGovernorates = useMemo(() => {
    const matches = allGovernoratesDb.filter(
      (g) => !g.metadata?.country || g.metadata.country === country
    );
    return matches.length > 0 ? matches : allGovernoratesDb;
  }, [allGovernoratesDb, country]);

  // Filter Geographic Areas by selected Governorate (and Country)
  const filteredAreas = useMemo(() => {
    const matches = allAreasDb.filter(
      (a) =>
        (!a.metadata?.governorate || a.metadata.governorate === governorate) &&
        (!a.metadata?.country || a.metadata.country === country)
    );
    if (matches.length > 0) return matches;
    const countryMatches = allAreasDb.filter(
      (a) => a.metadata?.country === country
    );
    return countryMatches.length > 0 ? countryMatches : allAreasDb;
  }, [allAreasDb, governorate, country]);

  const existingTenders = useMemo(() => getTenders(), [proposalCode, dbVersion]);

  const handleCountryChange = (nextCountry: string) => {
    setCountry(nextCountry);
    const govsForCountry = allGovernoratesDb.filter(
      (g) => g.metadata?.country === nextCountry
    );
    if (govsForCountry.length > 0) {
      const nextGov = govsForCountry[0].label_en;
      setGovernorate(nextGov);
      const areasForGov = allAreasDb.filter(
        (a) => a.metadata?.governorate === nextGov
      );
      if (areasForGov.length > 0) {
        setArea(areasForGov[0].label_en);
      }
    }
  };

  const handleGovernorateChange = (nextGov: string) => {
    setGovernorate(nextGov);
    const areasForGov = allAreasDb.filter(
      (a) => a.metadata?.governorate === nextGov
    );
    if (areasForGov.length > 0) {
      setArea(areasForGov[0].label_en);
    }
  };

  // Auto-fill returning client contact details when Owner matches database or previous tender
  const handleOwnerChange = (nextOwner: string) => {
    setOwner(nextOwner);
    const dbEntry = ownersDb.find(
      (o) => o.label_en.trim().toLowerCase() === nextOwner.trim().toLowerCase()
    );
    if (dbEntry?.metadata?.default_contact_address && !contactAddress) {
      setContactAddress(String(dbEntry.metadata.default_contact_address));
    }
    const match = existingTenders.find(
      (t) => t.owner.trim().toLowerCase() === nextOwner.trim().toLowerCase()
    );
    if (match) {
      if (!contractor && match.contractor) setContractor(match.contractor);
      if (!contactName && match.contact_name) setContactName(match.contact_name);
      if (!contactJobTitle && match.contact_job_title) {
        setContactJobTitle(match.contact_job_title);
      }
      if (!contactNumber && match.contact_number) {
        setContactNumber(match.contact_number);
      }
      if (!contactEmail && match.contact_email) {
        setContactEmail(match.contact_email);
      }
      if (!contactAddress && match.contact_address) {
        setContactAddress(match.contact_address);
      }
    }
  };

  // Live duplicate detection (Section 4.1 C & 5.1)
  const duplicateMatch = useMemo(() => {
    return detectDuplicateTender(
      {
        proposal_code: proposalCode,
        owner,
        proposal_name: proposalName,
      },
      existingTenders
    );
  }, [proposalCode, owner, proposalName, existingTenders]);

  const toggleScope = (label: string) => {
    setScopeOfWork((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleAddExtraDoc = () => {
    setExtraDocs((prev) => [
      ...prev,
      {
        file_name: `RFP_Package_${prev.length + 1}`,
        doc_type: 'RFP',
        server_path: `${serverLinkPath}\\0${prev.length + 1}_Docs`,
        version: 'v1.0',
      },
    ]);
  };

  const saveTenderRecord = (andCreateAnother: boolean) => {
    if (!user) return;
    if (!proposalCode.trim() || !proposalName.trim() || !owner.trim()) {
      setFormError(
        'Please complete Proposal Code, Proposal Name, and Owner / Developer before saving.'
      );
      return;
    }
    setFormError(null);

    const created = createTender(
      {
        year,
        proposal_code: proposalCode,
        proposal_name: proposalName,
        sales_representative_id: salesRepId,
        pzone_role: pzoneRole,
        project_priority: projectPriority,
        owner,
        contractor,
        country,
        governorate,
        area,
        district,
        location,
        contact_name: contactName,
        contact_job_title: contactJobTitle,
        contact_number: contactNumber,
        contact_email: contactEmail,
        contact_address: contactAddress,
        received_date: receivedDate,
        expected_send_date: null,
        deadline_date: deadlineDate || null,
        scope_of_work: scopeOfWork,
        estimated_price_if_not_sent: null,
        tender_status_notes: statusNotes,
        server_link_path: serverLinkPath,
        is_duplicate: duplicateMatch ? 'Duplicate' : 'Not Duplicate',
        duplicate_of_tender_id: duplicateMatch?.id || null,
      },
      user
    );

    for (const doc of extraDocs) {
      if (doc.server_path.trim()) {
        addTenderDocument(created.id, doc, user);
      }
    }

    localStorage.removeItem(WIZARD_DRAFT_KEY);

    if (andCreateAnother) {
      const nextCode = suggestNextProposalCode(year);
      setStep(1);
      setProposalCode(nextCode);
      setProposalName('');
      setOwner('');
      setContractor('');
      setDistrict('');
      setLocation('');
      setContactName('');
      setContactJobTitle('');
      setContactNumber('');
      setContactEmail('');
      setContactAddress('');
      setDeadlineDate('');
      setStatusNotes('');
      setExtraDocs([]);
      setServerLinkPath(`\\\\PZ-SERVER\\Tenders\\${year}\\${nextCode}`);
      setSavedToast(
        `Registered ${created.proposal_code} ("${created.proposal_name}"). Ready for next tender!`
      );
      setTimeout(() => setSavedToast(null), 5000);
    } else {
      navigate('/tenders');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTenderRecord(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate('/tenders')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tender Log</span>
          </button>
          <h1 className="text-2xl font-extrabold text-foreground">
            {isAr
              ? 'تسجيل مناقصة جديدة (Document Control)'
              : 'Register New Tender Proposal'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClearDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Draft
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Live Duplicate Warning Banner */}
      {duplicateMatch && (
        <div className="p-4 rounded-card bg-pzone-orange/15 border border-pzone-orange/40 text-pzone-orange flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold">
              Duplicate Tender Warning Detected!
            </div>
            <div>
              Matches existing proposal{' '}
              <strong>{duplicateMatch.proposal_code}</strong> — "
              {duplicateMatch.proposal_name}" ({duplicateMatch.owner}). Saving
              will automatically link it under Duplicate Control.
            </div>
          </div>
        </div>
      )}

      {/* 4-Step Progress Bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { num: 1, title: isAr ? '1. هوية العرض' : '1. Proposal Identity' },
          { num: 2, title: isAr ? '2. العميل والتواصل' : '2. Client & Contact' },
          { num: 3, title: isAr ? '3. التواريخ والنطاق' : '3. Dates & Scope' },
          { num: 4, title: isAr ? '4. مسارات السيرفر' : '4. Server Paths' },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num as 1 | 2 | 3 | 4)}
            className={`p-3 rounded-xl text-xs font-bold border text-start transition-all ${
              step === s.num
                ? 'bg-pzone-navy dark:bg-pzone-teal text-white border-transparent shadow-sm'
                : step > s.num
                  ? 'bg-pzone-seagreen/15 text-pzone-seagreen border-pzone-seagreen/30'
                  : 'bg-card text-muted-foreground border-border'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Registration Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border rounded-card p-6 sm:p-8 shadow-soft dark:shadow-soft-dark space-y-6 border-ribbon-top"
      >
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Step 1: Proposal Identity & Classification
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Year *</label>
                <input
                  type="number"
                  required
                  value={year}
                  onChange={(e) => {
                    const nextY = Number(e.target.value);
                    setYear(nextY);
                    const nextC = suggestNextProposalCode(nextY);
                    setProposalCode(nextC);
                    setServerLinkPath(`\\\\PZ-SERVER\\Tenders\\${nextY}\\${nextC}`);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-tabular"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Proposal Code *
                </label>
                <input
                  type="text"
                  required
                  value={proposalCode}
                  onChange={(e) => {
                    setProposalCode(e.target.value);
                    setServerLinkPath(
                      `\\\\PZ-SERVER\\Tenders\\${year}\\${e.target.value}`
                    );
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Project Priority *
                </label>
                <select
                  value={projectPriority}
                  onChange={(e) => setProjectPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                >
                  {priorities.map((p) => (
                    <option key={p.id} value={p.label_en}>
                      {isAr ? p.label_ar : p.label_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Proposal Name *
              </label>
              <input
                type="text"
                required
                value={proposalName}
                onChange={(e) => setProposalName(e.target.value)}
                placeholder="e.g. Marassi Bay Clubhouse Pools & Crystal Lagoon"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Sales Representative
                </label>
                <SearchableDbSelect
                  value={salesRepId}
                  onChange={(nextVal) => setSalesRepId(nextVal)}
                  options={salesReps.map((sr) => ({
                    id: sr.id,
                    value: sr.id,
                    label: isAr ? sr.label_ar : sr.label_en,
                  }))}
                  placeholder="Select or add Sales Representative..."
                  addButtonLabel="Add Sales Representative"
                  onAddNew={(newName) => {
                    if (!user) return;
                    const added = addDirectoryDatabaseEntry(
                      {
                        category: 'sales_representative',
                        label_en: newName,
                      },
                      user
                    );
                    setSalesRepId(added.id);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  P.ZONE Role *
                </label>
                <select
                  value={pzoneRole}
                  onChange={(e) => setPzoneRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                >
                  {rolesList.map((r) => (
                    <option key={r.id} value={r.label_en}>
                      {isAr ? r.label_ar : r.label_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Step 2: Owner / Developer, Main Contractor & Separated Geography
            </h2>

            {/* Unified Owner / Developer & Main Contractor Database */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Owner / Developer *
                </label>
                <SearchableDbSelect
                  required
                  value={owner}
                  onChange={(nextVal) => handleOwnerChange(nextVal)}
                  options={companiesDb.map((o) => ({
                    id: o.id,
                    value: o.label_en,
                    label: isAr ? `${o.label_ar} (${o.label_en})` : o.label_en,
                  }))}
                  placeholder="Select Owner / Developer..."
                  addButtonLabel="Add Company, Owner"
                  onAddNew={(newName) => {
                    if (!user) return;
                    const added = addDirectoryDatabaseEntry(
                      {
                        category: 'company_directory',
                        label_en: newName,
                      },
                      user
                    );
                    handleOwnerChange(added.label_en);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Main Contractor
                </label>
                <SearchableDbSelect
                  value={contractor}
                  onChange={(nextVal) => setContractor(nextVal)}
                  options={companiesDb.map((c) => ({
                    id: c.id,
                    value: c.label_en,
                    label: isAr ? `${c.label_ar} (${c.label_en})` : c.label_en,
                  }))}
                  placeholder="Select Main Contractor..."
                  addButtonLabel="Add Company, Owner"
                  onAddNew={(newName) => {
                    if (!user) return;
                    const added = addDirectoryDatabaseEntry(
                      {
                        category: 'company_directory',
                        label_en: newName,
                      },
                      user
                    );
                    setContractor(added.label_en);
                  }}
                />
              </div>
            </div>

            {/* Separated Country, Governorate, and Geographic Area Columns */}
            <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-border/50">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Country *
                </label>
                <SearchableDbSelect
                  value={country}
                  onChange={(nextVal) => handleCountryChange(nextVal)}
                  options={countriesDb.map((c) => ({
                    id: c.id,
                    value: c.label_en,
                    label: isAr ? c.label_ar : c.label_en,
                  }))}
                  placeholder="Select Country..."
                  addButtonLabel="Add Country"
                  onAddNew={(newName) => {
                    if (!user) return;
                    const added = addDirectoryDatabaseEntry(
                      {
                        category: 'country',
                        label_en: newName,
                      },
                      user
                    );
                    setCountry(added.label_en);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Governorate *
                </label>
                <SearchableDbSelect
                  value={governorate}
                  onChange={(nextVal) => handleGovernorateChange(nextVal)}
                  options={filteredGovernorates.map((g) => ({
                    id: g.id,
                    value: g.label_en,
                    label: isAr ? g.label_ar : g.label_en,
                  }))}
                  placeholder="Select Governorate..."
                  addButtonLabel={`Add Governorate (${country})`}
                  onAddNew={(newName) => {
                    if (!user) return;
                    const added = addDirectoryDatabaseEntry(
                      {
                        category: 'governorate',
                        label_en: newName,
                        metadata: { country },
                      },
                      user
                    );
                    setGovernorate(added.label_en);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Geographic Area *
                </label>
                <SearchableDbSelect
                  value={area}
                  onChange={(nextVal) => setArea(nextVal)}
                  options={filteredAreas.map((a) => ({
                    id: a.id,
                    value: a.label_en,
                    label: isAr ? a.label_ar : a.label_en,
                  }))}
                  placeholder="Select Geographic Area..."
                  addButtonLabel={`Add Geographic Area (${governorate})`}
                  onAddNew={(newName) => {
                    if (!user) return;
                    const added = addDirectoryDatabaseEntry(
                      {
                        category: 'area',
                        label_en: newName,
                        metadata: { country, governorate },
                      },
                      user
                    );
                    setArea(added.label_en);
                  }}
                />
              </div>
            </div>

            {/* Dedicated District Table Column (Compound / Building Name) + Location */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  District (Compound Name / Building Name)
                </label>
                <SearchableDbSelect
                  value={district}
                  onChange={(nextVal) => setDistrict(nextVal)}
                  options={allDistrictsDb.map((d) => ({
                    id: d.id,
                    value: d.label_en,
                    label: isAr ? `${d.label_ar} (${d.label_en})` : d.label_en,
                  }))}
                  placeholder="Select or add Compound / Building Name..."
                  addButtonLabel="Add District / Compound"
                  onAddNew={(newName) => {
                    if (!user) return;
                    const added = addDirectoryDatabaseEntry(
                      {
                        category: 'district',
                        label_en: newName,
                      },
                      user
                    );
                    setDistrict(added.label_en);
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Project Location / Google Maps URL
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="https://maps.google.com/... or Plot / Sector"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-border">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Contact Job Title
                </label>
                <input
                  type="text"
                  value={contactJobTitle}
                  onChange={(e) => setContactJobTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-tabular"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Contact Address
                </label>
                <input
                  type="text"
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              Step 3: Schedule & Scope of Work
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Proposal Received Date *
                </label>
                <DatePickerInput
                  required
                  value={receivedDate}
                  onChange={(iso) => setReceivedDate(iso)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Deadline
                </label>
                <DatePickerInput
                  value={deadlineDate}
                  onChange={(iso) => setDeadlineDate(iso)}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Note: <strong>Expected Send Date</strong> is assigned by the Tender Manager when reviewing and assigning the tender.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-2">
                Proposal Scope of Work
              </label>
              <div className="flex flex-wrap gap-2">
                {scopes.map((sc) => {
                  const selected = scopeOfWork.includes(sc.label_en);
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => toggleScope(sc.label_en)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        selected
                          ? 'bg-pzone-teal text-white border-pzone-teal'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {isAr ? sc.label_ar : sc.label_en}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Tender Status Notes
              </label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Initial RFP notes or special client requirements..."
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-pzone-teal" />
              <span>Step 4: Proposal Server Link Paths</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Documents stay on your network server. Enter the primary UNC network folder path or URL and any specific RFP/BOQ/Drawing sub-paths.
            </p>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Primary Proposal Server Link Path *
              </label>
              <input
                type="text"
                required
                value={serverLinkPath}
                onChange={(e) => setServerLinkPath(e.target.value)}
                placeholder="\\PZ-SERVER\Tenders\2026\PZ-2026-008"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-mono"
              />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Additional Document Sub-paths (RFP, Drawings, BOQ, Addendum)
                </span>
                <button
                  type="button"
                  onClick={handleAddExtraDoc}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted hover:bg-pzone-teal hover:text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Path</span>
                </button>
              </div>

              {extraDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="grid sm:grid-cols-12 gap-2 p-3 rounded-xl bg-muted/40 border border-border items-center"
                >
                  <input
                    type="text"
                    value={doc.file_name}
                    onChange={(e) => {
                      const next = [...extraDocs];
                      next[idx].file_name = e.target.value;
                      setExtraDocs(next);
                    }}
                    placeholder="Title"
                    className="sm:col-span-3 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs"
                  />
                  <select
                    value={doc.doc_type}
                    onChange={(e) => {
                      const next = [...extraDocs];
                      next[idx].doc_type = e.target.value;
                      setExtraDocs(next);
                    }}
                    className="sm:col-span-2 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs"
                  >
                    <option value="RFP">RFP</option>
                    <option value="Drawings">Drawings</option>
                    <option value="BOQ">BOQ</option>
                    <option value="Addendum">Addendum</option>
                  </select>
                  <input
                    type="text"
                    value={doc.server_path}
                    onChange={(e) => {
                      const next = [...extraDocs];
                      next[idx].server_path = e.target.value;
                      setExtraDocs(next);
                    }}
                    placeholder="\\Server\Path"
                    className="sm:col-span-5 px-2.5 py-1.5 rounded-lg bg-card border border-border text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={doc.version}
                    onChange={(e) => {
                      const next = [...extraDocs];
                      next[idx].version = e.target.value;
                      setExtraDocs(next);
                    }}
                    placeholder="v1.0"
                    className="sm:col-span-1 px-2 py-1.5 rounded-lg bg-card border border-border text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setExtraDocs(extraDocs.filter((_, i) => i !== idx))
                    }
                    className="sm:col-span-1 p-1.5 text-pzone-crimson hover:bg-pzone-crimson/10 rounded-lg flex justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {formError && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/35 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* 4-Step Wizard Navigation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-muted text-xs font-semibold disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && (!proposalCode.trim() || !proposalName.trim())) {
                  setFormError(
                    'Please enter Proposal Code and Proposal Name before continuing.'
                  );
                  return;
                }
                if (step === 2 && !owner.trim()) {
                  setFormError(
                    'Please select or add an Owner / Developer before continuing.'
                  );
                  return;
                }
                setFormError(null);
                setStep((s) => Math.min(4, s + 1) as 1 | 2 | 3 | 4);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-pzone-navy dark:bg-pzone-teal text-white text-xs font-semibold shadow-sm"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => saveTenderRecord(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-pzone-teal/15 hover:bg-pzone-teal/25 text-pzone-teal border border-pzone-teal/30 text-xs font-bold transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Save & Register Another</span>
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pzone-seagreen hover:bg-pzone-seagreen/90 text-white text-xs font-bold shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Register Proposal</span>
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
