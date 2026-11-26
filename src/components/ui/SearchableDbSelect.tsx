import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';

export interface DbSelectOption {
  id: string;
  value: string;
  label: string;
  subLabel?: string;
}

interface SearchableDbSelectProps {
  value: string;
  onChange: (nextValue: string) => void;
  options: DbSelectOption[];
  placeholder?: string;
  addButtonLabel: string; // e.g. "Add Company, Owner" or "Add Governorate"
  onAddNew?: (newLabel: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export const SearchableDbSelect: React.FC<SearchableDbSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  addButtonLabel,
  onAddNew,
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [addingInline, setAddingInline] = useState(false);
  const [inlineNewName, setInlineNewName] = useState('');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  const updatePopoverPosition = useCallback(() => {
    const el = containerRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const minWidth = Math.max(rect.width, 280);
    const width = Math.min(minWidth, window.innerWidth - 24);
    const isRtl = document.documentElement.dir === 'rtl';

    let left = isRtl ? rect.right - width : rect.left;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < 280 && spaceAbove > spaceBelow;

    if (openUpward) {
      setPopoverStyle({
        position: 'fixed',
        left,
        width,
        bottom: window.innerHeight - rect.top + 6,
        zIndex: 9999,
      });
    } else {
      setPopoverStyle({
        position: 'fixed',
        left,
        width,
        top: rect.bottom + 6,
        zIndex: 9999,
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePopoverPosition();
    window.addEventListener('scroll', updatePopoverPosition, true);
    window.addEventListener('resize', updatePopoverPosition);
    return () => {
      window.removeEventListener('scroll', updatePopoverPosition, true);
      window.removeEventListener('resize', updatePopoverPosition);
    };
  }, [open, updatePopoverPosition]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setAddingInline(false);
      setInlineNewName('');
      return;
    }
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 20);
  }, [open]);

  useEffect(() => {
    if (addingInline) {
      setTimeout(() => {
        inlineInputRef.current?.focus();
      }, 20);
    }
  }, [addingInline]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.subLabel && o.subLabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  const exactMatchedOption = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return undefined;
    return options.find(
      (o) => o.value.toLowerCase() === q || o.label.toLowerCase() === q
    );
  }, [options, search]);

  const exactMatchExists = Boolean(exactMatchedOption);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const handleCreateNew = (rawName: string) => {
    const trimmed = rawName.trim();
    if (!trimmed || !onAddNew) return;
    onAddNew(trimmed);
    setOpen(false);
  };

  const dropdownMenu = open ? (
    <div
      ref={dropdownRef}
      style={popoverStyle}
      className="rounded-xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Search Input inside Dropdown */}
      <div className="p-2 border-b border-border bg-muted/30">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute start-2.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (addingInline) setAddingInline(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (exactMatchedOption) {
                  onChange(exactMatchedOption.value);
                  setOpen(false);
                } else if (filteredOptions.length === 1) {
                  onChange(filteredOptions[0].value);
                  setOpen(false);
                } else if (search.trim() && onAddNew) {
                  handleCreateNew(search);
                }
              }
            }}
            placeholder="Search list or type new name..."
            className="w-full ps-8 pe-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-pzone-teal"
          />
        </div>
      </div>

      {/* Options List */}
      <div className="max-h-56 overflow-y-auto divide-y divide-border/30">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-start transition-colors ${
                  isSelected
                    ? 'bg-pzone-teal/15 text-pzone-teal font-bold'
                    : 'text-foreground hover:bg-muted/60'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-pzone-teal shrink-0" />
                )}
              </button>
            );
          })
        ) : (
          <div className="px-3 py-3 text-center space-y-2">
            {search.trim() ? (
              <div className="text-xs text-muted-foreground">
                No match found for{' '}
                <strong className="text-foreground">"{search.trim()}"</strong>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                List is empty — type a name above or click below to add
              </div>
            )}
            {onAddNew && search.trim() && (
              <button
                type="button"
                onClick={() => handleCreateNew(search)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-pzone-teal text-white text-xs font-bold shadow-xs hover:bg-pzone-teal/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {addButtonLabel}: "{search.trim()}"
                </span>
              </button>
            )}
          </div>
        )}

        {/* When user typed something that partially matches, but not an exact match, also show the quick "+ Add" button inside the dropdown */}
        {onAddNew &&
          filteredOptions.length > 0 &&
          search.trim() &&
          !exactMatchExists && (
            <button
              type="button"
              onClick={() => handleCreateNew(search)}
              className="w-full flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-pzone-teal bg-pzone-teal/10 hover:bg-pzone-teal/20 transition-colors text-start"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {addButtonLabel}: "{search.trim()}"
              </span>
            </button>
          )}
      </div>

      {/* Persistent "+ Add Company, Owner" / "+ Add ..." footer inside the dropdown */}
      {onAddNew && (
        <div className="border-t border-border bg-muted/40 p-2">
          {!addingInline ? (
            <button
              type="button"
              onClick={() => {
                if (exactMatchedOption) {
                  onChange(exactMatchedOption.value);
                  setOpen(false);
                } else if (search.trim()) {
                  handleCreateNew(search);
                } else {
                  setAddingInline(true);
                  setInlineNewName('');
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-pzone-teal hover:bg-pzone-teal/15 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{addButtonLabel}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                ref={inlineInputRef}
                type="text"
                value={inlineNewName}
                onChange={(e) => setInlineNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateNew(inlineNewName);
                  } else if (e.key === 'Escape') {
                    setAddingInline(false);
                  }
                }}
                placeholder={`${addButtonLabel}...`}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-background border border-pzone-teal/60 text-xs text-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCreateNew(inlineNewName)}
                className="px-2.5 py-1.5 rounded-lg bg-pzone-teal text-white text-xs font-bold shrink-0"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-background border text-sm text-start transition-all ${
          open
            ? 'border-pzone-teal ring-2 ring-pzone-teal/25'
            : 'border-border hover:border-pzone-teal/50'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`truncate ${
            value ? 'text-foreground font-medium' : 'text-muted-foreground'
          }`}
        >
          {selectedOption ? selectedOption.label : value || placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              title="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-0.5 rounded-md text-muted-foreground hover:text-pzone-crimson hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${
              open ? 'rotate-180 text-pzone-teal' : ''
            }`}
          />
        </div>
      </button>

      {dropdownMenu && typeof document !== 'undefined'
        ? createPortal(dropdownMenu, document.body)
        : dropdownMenu}
    </div>
  );
};
