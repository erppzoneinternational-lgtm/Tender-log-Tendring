import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Edit3,
  Layers,
  Plus,
  X,
  XCircle,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  createLookupValue,
  getLookupValues,
  updateLookupValue,
} from '@/lib/dataStore';
import type { LookupCategory, LookupValue } from '@/types/database';

const ALL_CATEGORIES: LookupCategory[] = [
  'company_directory',
  'country',
  'governorate',
  'area',
  'district',
  'water_feature',
  'component_shape',
  'water_feature_type',
  'filtration_method',
  'finishing_type',
  'sales_representative',
  'tender_status',
  'project_priority',
  'pzone_role',
  'scope_of_work',
  'proposal_type',
  'project_status',
  'final_contracted_status',
  'revision_reason',
  'duplicate_status',
];

const BRAND_SWATCHES = [
  '#26336B', // Deep Navy
  '#1E9090', // Aqua Teal
  '#5BA88A', // Sea Green
  '#D4741A', // Sunset Orange
  '#D81E78', // Magenta
  '#6A2A80', // Purple
  '#8B1A28', // Crimson
  '#7A9BBF', // Slate Blue
];

export const LookupsAdmin: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useApp();

  const [lookups, setLookups] = useState<LookupValue[]>(() => getLookupValues());
  const [selectedCategory, setSelectedCategory] =
    useState<LookupCategory>('company_directory');
  const [countryFilter, setCountryFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LookupValue | null>(null);
  const [code, setCode] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [labelAr, setLabelAr] = useState('');
  const [color, setColor] = useState('#1E9090');
  const [requiresDepth, setRequiresDepth] = useState(true);
  const [metaCountry, setMetaCountry] = useState('Egypt');
  const [metaGovernorate, setMetaGovernorate] = useState('Cairo');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const categoryItems = useMemo(() => {
    return lookups
      .filter((lv) => {
        if (lv.category !== selectedCategory) return false;
        if (
          (selectedCategory === 'governorate' ||
            selectedCategory === 'area') &&
          countryFilter !== 'ALL'
        ) {
          return lv.metadata?.country === countryFilter;
        }
        return true;
      })
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [lookups, selectedCategory, countryFilter]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lv of lookups) {
      counts[lv.category] = (counts[lv.category] || 0) + 1;
    }
    return counts;
  }, [lookups]);

  const openAddModal = () => {
    setEditingItem(null);
    setCode('');
    setLabelEn('');
    setLabelAr('');
    setColor('#1E9090');
    setRequiresDepth(true);
    const defaultCountry = countryFilter !== 'ALL' ? countryFilter : 'Egypt';
    setMetaCountry(defaultCountry);
    const firstGov = lookups.find(
      (l) => l.category === 'governorate' && l.metadata?.country === defaultCountry
    );
    const defaultGov = firstGov?.label_en || 'Cairo';
    setMetaGovernorate(defaultGov);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (item: LookupValue) => {
    setEditingItem(item);
    setCode(item.code);
    setLabelEn(item.label_en);
    setLabelAr(item.label_ar);
    setColor(item.color || '#1E9090');
    setRequiresDepth(item.metadata?.requires_depth !== false);
    setMetaCountry(String(item.metadata?.country || 'Egypt'));
    setMetaGovernorate(String(item.metadata?.governorate || 'Cairo'));
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSaveOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg(null);

    try {
      const metadata: Record<string, unknown> =
        selectedCategory === 'water_feature'
          ? { requires_depth: requiresDepth }
          : selectedCategory === 'governorate'
          ? { country: metaCountry }
          : selectedCategory === 'area'
          ? { country: metaCountry, governorate: metaGovernorate }
          : {};

      if (editingItem) {
        updateLookupValue(
          editingItem.id,
          {
            label_en: labelEn,
            label_ar: labelAr,
            color,
            metadata,
          },
          user
        );
        showToast(`Updated option "${labelEn}"`);
      } else {
        createLookupValue(
          {
            category: selectedCategory,
            code: code || labelEn,
            label_en: labelEn,
            label_ar: labelAr,
            color,
            metadata,
          },
          user
        );
        showToast(`Created option "${labelEn}"`);
      }
      setLookups(getLookupValues());
      setModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleToggleActive = (item: LookupValue) => {
    if (!user) return;
    try {
      updateLookupValue(item.id, { active: !item.active }, user);
      setLookups(getLookupValues());
      showToast(
        `${item.label_en} ${!item.active ? 'enabled' : 'disabled'}`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleMoveOrder = (item: LookupValue, direction: 'up' | 'down') => {
    if (!user) return;
    const idx = categoryItems.findIndex((i) => i.id === item.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categoryItems.length) return;

    const neighbor = categoryItems[swapIdx];
    updateLookupValue(item.id, { sort_order: neighbor.sort_order }, user);
    updateLookupValue(neighbor.id, { sort_order: item.sort_order }, user);
    setLookups(getLookupValues());
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="p-3.5 rounded-xl bg-pzone-seagreen/15 border border-pzone-seagreen/30 text-pzone-seagreen text-xs font-semibold flex items-center justify-between">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left 4 cols: Category Selector */}
        <div className="lg:col-span-4 bg-card border border-border rounded-card p-4 shadow-soft dark:shadow-soft-dark space-y-2">
          <div className="px-2 py-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Layers className="w-4 h-4 text-pzone-teal" />
            <span>Lookup Categories ({ALL_CATEGORIES.length})</span>
          </div>

          <div className="space-y-1 max-h-[540px] overflow-y-auto pe-1">
            {ALL_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-start ${
                    active
                      ? 'bg-pzone-navy dark:bg-pzone-teal text-white shadow-sm'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="truncate">
                    {t(`admin.lookups.categories.${cat}`)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-tabular ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 cols: Category Items Table */}
        <div className="lg:col-span-8 bg-card border border-border rounded-card p-6 shadow-soft dark:shadow-soft-dark space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {t(`admin.lookups.categories.${selectedCategory}`)}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('admin.lookups.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(selectedCategory === 'governorate' ||
                selectedCategory === 'area') && (
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-foreground"
                >
                  <option value="ALL">All Countries</option>
                  {lookups
                    .filter((l) => l.category === 'country' && l.active)
                    .map((c) => (
                      <option key={c.id} value={c.label_en}>
                        {c.label_en}
                      </option>
                    ))}
                </select>
              )}
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pzone-navy hover:bg-pzone-navy/90 dark:bg-pzone-teal dark:hover:bg-pzone-teal/90 text-white text-xs font-semibold shadow-sm transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{t('admin.lookups.addOption')}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-border rounded-xl">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="bg-muted/60 text-muted-foreground text-xs uppercase border-b border-border">
                  <th className="py-3 px-3 text-start font-semibold">
                    {t('admin.lookups.colOrder')}
                  </th>
                  <th className="py-3 px-3 text-start font-semibold">
                    {t('admin.lookups.colCode')}
                  </th>
                  <th className="py-3 px-3 text-start font-semibold">
                    {t('admin.lookups.colLabelEn')}
                  </th>
                  <th className="py-3 px-3 text-start font-semibold">
                    {t('admin.lookups.colLabelAr')}
                  </th>
                  {(selectedCategory === 'water_feature' ||
                    selectedCategory === 'governorate' ||
                    selectedCategory === 'area') && (
                    <th className="py-3 px-3 text-start font-semibold">
                      {t('admin.lookups.colMeta')}
                    </th>
                  )}
                  <th className="py-3 px-3 text-start font-semibold">
                    {t('admin.lookups.colStatus')}
                  </th>
                  <th className="py-3 px-3 text-end font-semibold">
                    {t('admin.users.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[13px]">
                {categoryItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 font-tabular text-xs text-muted-foreground">
                        <span className="w-5 font-bold text-foreground">
                          {item.sort_order}
                        </span>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveOrder(item, 'up')}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === categoryItems.length - 1}
                          onClick={() => handleMoveOrder(item, 'down')}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted font-mono text-xs font-semibold text-foreground">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color || '#1E9090' }}
                        />
                        {item.code}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-foreground">
                      {item.label_en}
                    </td>

                    <td className="py-3 px-3 font-semibold text-foreground" dir="rtl">
                      {item.label_ar}
                    </td>

                    {selectedCategory === 'water_feature' && (
                      <td className="py-3 px-3">
                        {item.metadata?.requires_depth !== false ? (
                          <span className="px-2 py-0.5 rounded-md bg-pzone-teal/15 text-pzone-teal text-[11px] font-semibold">
                            {t('admin.lookups.requiresDepth')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-pzone-orange/15 text-pzone-orange text-[11px] font-semibold">
                            {t('admin.lookups.noDepthNeeded')}
                          </span>
                        )}
                      </td>
                    )}

                    {(selectedCategory === 'governorate' ||
                      selectedCategory === 'area') && (
                      <td className="py-3 px-3 text-xs text-muted-foreground">
                        {item.metadata?.country && (
                          <span className="px-2 py-0.5 rounded-md bg-muted font-semibold text-foreground me-1">
                            {String(item.metadata.country)}
                          </span>
                        )}
                        {item.metadata?.governorate && (
                          <span className="px-2 py-0.5 rounded-md bg-pzone-teal/15 text-pzone-teal font-semibold me-1">
                            {String(item.metadata.governorate)}
                          </span>
                        )}
                      </td>
                    )}

                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.active
                            ? 'bg-pzone-seagreen/15 text-pzone-seagreen'
                            : 'bg-pzone-crimson/15 text-pzone-crimson'
                        }`}
                      >
                        {item.active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('admin.users.active')}</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t('admin.users.inactive')}</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-end">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-pzone-teal hover:text-white text-foreground text-xs font-medium transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Lookup Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-card border border-border rounded-card shadow-2xl p-6 space-y-4 border-ribbon-top"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                {editingItem
                  ? `Edit: ${editingItem.code}`
                  : t('admin.lookups.addOption')}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-pzone-crimson/10 border border-pzone-crimson/30 text-pzone-crimson text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveOption} className="space-y-4">
              {!editingItem && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {t('admin.lookups.colCode')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="INFINITE_LAGOON"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t('admin.lookups.colLabelEn')} *
                </label>
                <input
                  type="text"
                  required
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  placeholder="Olympic Swimming Pool"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  {t('admin.lookups.colLabelAr')} *
                </label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  value={labelAr}
                  onChange={(e) => setLabelAr(e.target.value)}
                  placeholder="حمام سباحة أولمبي"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-pzone-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  {t('admin.lookups.colColor')}
                </label>
                <div className="flex items-center gap-2">
                  {BRAND_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      onClick={() => setColor(swatch)}
                      className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                        color === swatch
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: swatch }}
                    />
                  ))}
                </div>
              </div>

              {selectedCategory === 'water_feature' && (
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/60 border border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiresDepth}
                    onChange={(e) => setRequiresDepth(e.target.checked)}
                    className="w-4 h-4 rounded text-pzone-teal focus:ring-pzone-teal"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {t('admin.lookups.requiresDepth')}
                  </span>
                </label>
              )}

              {(selectedCategory === 'governorate' ||
                selectedCategory === 'area') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Parent Country
                    </label>
                    <select
                      value={metaCountry}
                      onChange={(e) => {
                        const nextCountry = e.target.value;
                        setMetaCountry(nextCountry);
                        const firstGov = lookups.find(
                          (l) =>
                            l.category === 'governorate' &&
                            l.active &&
                            l.metadata?.country === nextCountry
                        );
                        if (firstGov) {
                          setMetaGovernorate(firstGov.label_en);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
                    >
                      {lookups
                        .filter((l) => l.category === 'country' && l.active)
                        .map((c) => (
                          <option key={c.id} value={c.label_en}>
                            {c.label_en}
                          </option>
                        ))}
                    </select>
                  </div>
                  {selectedCategory === 'area' && (
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">
                        Parent Governorate
                      </label>
                      <select
                        value={metaGovernorate}
                        onChange={(e) => setMetaGovernorate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground"
                      >
                        {lookups
                          .filter(
                            (l) =>
                              l.category === 'governorate' &&
                              l.active &&
                              (!l.metadata?.country ||
                                l.metadata.country === metaCountry)
                          )
                          .map((g) => (
                            <option key={g.id} value={g.label_en}>
                              {g.label_en}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold"
                >
                  {t('admin.users.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pzone-navy dark:bg-pzone-teal text-white text-xs font-semibold shadow-sm hover:opacity-90"
                >
                  {t('admin.lookups.saveOption')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
