import { STATIC_ITEMS_LOOKUP } from '../lib/staticLookup';
import { useLookup } from '../lib/lookupContext';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, Check, X } from 'lucide-react';

export default function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  disabled = false,
  allowAddNew = true,
  addNewLabel = 'Add New',
  onAddNew,
  valueKey = 'id', // 'id' | 'label'
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const { getResolvedLabel } = useLookup() || {};

    // Normalize legacy or wrong UUIDs
  let effectiveValue = value;
  if (effectiveValue === '5051614a-fbbf-4e78-9a4f-51eafe737c0f') {
    effectiveValue = '752fdb9d-a15b-465d-8155-3f6462d07e8e';
  }

  const selectedOption = options.find(o => 
    o[valueKey] === effectiveValue || 
    o.id === effectiveValue || 
    o.label === effectiveValue ||
    (o.spec?.filter_code && typeof effectiveValue === 'string' && (effectiveValue.includes(o.spec.filter_code) || effectiveValue.includes(String(o.spec.filter_code).padStart(5, '0')))) ||
    (o.spec?.filter_pump_code && typeof effectiveValue === 'string' && effectiveValue.includes(o.spec.filter_pump_code)) ||
    (o.spec?.code && typeof effectiveValue === 'string' && effectiveValue.includes(o.spec.code))
  );

  const isUUID = typeof effectiveValue === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveValue);
  const resolvedFallbackLabel = isUUID && getResolvedLabel ? getResolvedLabel(null, effectiveValue) : null;
  const staticFallback = (typeof effectiveValue === 'string' && STATIC_ITEMS_LOOKUP[effectiveValue]) || null;
  const displayLabel = selectedOption ? selectedOption.label : (staticFallback || resolvedFallbackLabel || (isUUID ? 'Selected Item' : effectiveValue) || placeholder);

  const filteredOptions = options.filter(o =>
    (o.label || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block leading-snug">{label}</label>
          {allowAddNew && onAddNew && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddNew(searchQuery);
              }}
              className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-bold flex items-center gap-0.5 hover:underline cursor-pointer flex-shrink-0"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>{addNewLabel}</span>
            </button>
          )}
        </div>
      )}

      {/* Trigger Container */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full flex items-center justify-between bg-white dark:bg-slate-900 border rounded-xl px-3.5 py-2.5 text-xs transition cursor-pointer text-left shadow-xs ${
          disabled
            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
            : isOpen
            ? 'border-cyan-500 ring-2 ring-cyan-500/20 text-slate-900 dark:text-slate-100 font-bold'
            : 'border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200 font-medium'
        }`}
      >
        <span className={`leading-snug break-words pr-2 ${!selectedOption && !value ? 'text-slate-400 dark:text-slate-500 font-normal' : 'text-slate-900 dark:text-slate-100 font-bold'}`}>
          {displayLabel}
        </span>
        <div className="flex items-center gap-1 ml-1.5 flex-shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg text-slate-400 transition cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-cyan-600 dark:text-cyan-400' : ''}`} />
        </div>
      </div>

      {/* Dropdown Popup with Full Name Visibility */}
      {isOpen && (
        <div className="absolute z-50 left-0 min-w-full w-max max-w-[min(90vw,580px)] mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-72 flex flex-col">
          
          {/* Search Bar */}
          <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Type to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto flex-1 p-1 space-y-0.5 max-h-56 divide-y divide-slate-100 dark:divide-slate-800/40">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-400">
                <span>No records found for "{searchQuery}"</span>
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const targetVal = valueKey === 'label' ? opt.label : opt.id;
                const isSelected = effectiveValue === targetVal || 
                                       effectiveValue === opt.label ||
                                       (selectedOption && (selectedOption.id === opt.id || selectedOption.label === opt.label));
                return (
                  <button
                    key={opt.id || `opt-${opt.label}`}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onChange(targetVal);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-left transition cursor-pointer gap-3 ${
                      isSelected
                        ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="leading-snug whitespace-normal break-words font-medium pointer-events-none">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 ml-2 pointer-events-none" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Add New Button */}
          {allowAddNew && onAddNew && (
            <div className="p-1.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew(searchQuery);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-cyan-50 dark:bg-cyan-950/80 hover:bg-cyan-100 dark:hover:bg-cyan-900 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>{searchQuery ? `+ Add "${searchQuery}"` : `+ ${addNewLabel}`}</span>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
