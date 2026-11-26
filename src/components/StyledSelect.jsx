import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { STATIC_ITEMS_LOOKUP, STATIC_BRANDS_LOOKUP, STATIC_WF_TYPES_LOOKUP } from '../lib/staticLookup';
import { useLookup } from '../lib/lookupContext';

export default function StyledSelect({
  label,
  value = '',
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className = '',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const lookupCtx = useLookup();
  const getResolvedLabel = lookupCtx?.getResolvedLabel;

  // Normalize options array into { id, label, desc, raw }
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string') {
      const fallbackLbl = STATIC_ITEMS_LOOKUP[opt] || STATIC_BRANDS_LOOKUP[opt] || STATIC_WF_TYPES_LOOKUP[opt] || opt;
      return { id: opt, label: fallbackLbl, raw: opt };
    }
    const resolvedId = opt.id !== undefined ? opt.id : opt.value;
    const resolvedLabel = opt.label || opt.name || opt.title || 
      (resolvedId && (STATIC_ITEMS_LOOKUP[resolvedId] || STATIC_BRANDS_LOOKUP[resolvedId] || STATIC_WF_TYPES_LOOKUP[resolvedId])) || 
      resolvedId;
    return {
      id: resolvedId,
      label: resolvedLabel,
      desc: opt.desc || opt.color || opt.sublabel || null,
      raw: opt
    };
  });

  const valStr = String(value ?? '').trim().toLowerCase();

  const selectedOption = normalizedOptions.find(o => {
    if (!valStr) return false;
    const idStr = String(o.id ?? '').trim().toLowerCase();
    const lblStr = String(o.label ?? '').trim().toLowerCase();
    if (idStr === valStr || lblStr === valStr) return true;

    // Deep check raw option attributes
    const r = o.raw;
    if (r && typeof r === 'object') {
      if (r.item_id && String(r.item_id).trim().toLowerCase() === valStr) return true;
      if (r.brand_id && String(r.brand_id).trim().toLowerCase() === valStr) return true;
      if (r.material_id && String(r.material_id).trim().toLowerCase() === valStr) return true;
      if (r.value && String(r.value).trim().toLowerCase() === valStr) return true;
      if (r.item_name && String(r.item_name).trim().toLowerCase() === valStr) return true;
    }
    return false;
  });

  const isUUID = typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  const staticFallback = (typeof value === 'string' && (STATIC_ITEMS_LOOKUP[value] || STATIC_BRANDS_LOOKUP[value] || STATIC_WF_TYPES_LOOKUP[value])) || null;
  const resolvedFallbackLabel = isUUID && getResolvedLabel ? getResolvedLabel(null, value) : null;

  const displayLabel = selectedOption 
    ? selectedOption.label 
    : (staticFallback || resolvedFallbackLabel || (isUUID ? (placeholder || 'Select...') : value) || placeholder);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5 leading-snug">
          {label} {required && <span className="text-cyan-600">*</span>}
        </label>
      )}

      {/* Styled Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 border rounded-xl px-3.5 py-2.5 text-xs transition cursor-pointer text-left shadow-xs ${
          disabled
            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
            : isOpen
            ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
            : 'border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-600 text-slate-900 dark:text-slate-100 font-bold'
        }`}
      >
        <span className={`leading-snug break-words pr-2 ${!selectedOption && !value ? 'text-slate-400 dark:text-slate-500 font-normal' : 'font-bold'}`}>
          {displayLabel}
        </span>

        <div className="flex items-center gap-1 ml-1.5 flex-shrink-0">
          {value && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 hover:text-rose-500 text-slate-400 transition cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-cyan-600 dark:text-cyan-400' : ''}`} />
        </div>
      </button>

      {/* Styled Dropdown Menu Popup with Full Name Visibility */}
      {isOpen && (
        <div className="absolute z-50 left-0 min-w-full w-max max-w-[min(90vw,580px)] mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto p-1.5 space-y-1">
          {normalizedOptions.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400">
              <span>No options available</span>
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = (selectedOption && (selectedOption.id === opt.id || (selectedOption.raw?.item_id && selectedOption.raw?.item_id === opt.raw?.item_id))) ||
                (valStr && (String(opt.id).toLowerCase() === valStr || (opt.raw?.item_id && String(opt.raw.item_id).toLowerCase() === valStr) || (opt.raw?.brand_id && String(opt.raw.brand_id).toLowerCase() === valStr)));
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs text-left transition cursor-pointer gap-3 ${
                    isSelected
                      ? 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 font-black border border-cyan-200 dark:border-cyan-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="leading-snug font-bold whitespace-normal break-words">{opt.label}</p>
                    {opt.desc && (
                      <p className="text-[10px] text-slate-400 whitespace-normal mt-0.5">{opt.desc}</p>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
