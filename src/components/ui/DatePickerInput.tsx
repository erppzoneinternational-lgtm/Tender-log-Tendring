import React, { useEffect, useRef, useState } from 'react';
import { Calendar, X } from 'lucide-react';

export const CAIRO_TIMEZONE = 'Africa/Cairo';

/**
 * Returns the current datetime as an ISO-8601 string in Egypt Cairo Timezone (`Africa/Cairo`),
 * e.g. `2026-11-16T14:32:10+02:00` (automatically handling +02:00 / +03:00 DST).
 */
export function nowCairoIso(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAIRO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'longOffset',
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const yyyy = get('year');
  const mm = get('month');
  const dd = get('day');
  const rawHour = get('hour');
  const hh = rawHour === '24' ? '00' : rawHour;
  const min = get('minute');
  const ss = get('second');
  const tzName = get('timeZoneName');
  const offsetMatch = /([+-]\d{2}:\d{2})$/.exec(tzName);
  const offset = offsetMatch ? offsetMatch[1] : '+02:00';
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}${offset}`;
}

/**
 * Returns today's calendar date (`YYYY-MM-DD`) in Egypt Cairo Timezone (`Africa/Cairo`).
 */
export function todayCairoIso(date: Date = new Date()): string {
  return nowCairoIso(date).slice(0, 10);
}

/**
 * Formats an ISO timestamp (`created_at`, `updated_at`, `timestamp`, etc.) in
 * Egypt Cairo Timezone (`Africa/Cairo`) as `dd/mm/yyyy, hh:mm:ss AM/PM`.
 */
export function formatDateTimeCairo(
  isoTimestamp?: string | null,
  emptyFallback = '—'
): string {
  if (!isoTimestamp) return emptyFallback;
  const trimmed = isoTimestamp.trim();
  if (!trimmed) return emptyFallback;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return formatDateDdMmYyyy(trimmed, emptyFallback);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return trimmed;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CAIRO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).formatToParts(parsed);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const dayPeriod = get('dayPeriod').toUpperCase();
  return `${get('day')}/${get('month')}/${get('year')}, ${get('hour')}:${get('minute')}:${get('second')}${dayPeriod ? ` ${dayPeriod}` : ''}`;
}

/**
 * Formats any audit log field value, automatically converting ISO datetime strings
 * (`created_at`, `updated_at`, `assigned_at`, etc.) to Egypt Cairo Timezone.
 */
export function formatAuditValueCairo(value: unknown): string {
  if (value === undefined || value === null) return '—';
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value.trim())
  ) {
    return formatDateTimeCairo(value);
  }
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/**
 * Formats an ISO date string (`YYYY-MM-DD` or full ISO timestamp) into `dd/mm/yyyy`
 * (using `Africa/Cairo` when a full timestamp with time component is supplied).
 * Returns `'—'` (or fallback) when empty.
 */
export function formatDateDdMmYyyy(
  isoDate?: string | null,
  emptyFallback = '—'
): string {
  if (!isoDate) return emptyFallback;
  const trimmed = isoDate.trim();
  if (!trimmed) return emptyFallback;

  // Plain YYYY-MM-DD calendar date (no time component)
  const plainDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (plainDateMatch) {
    const [, yyyy, mm, dd] = plainDateMatch;
    return `${dd}/${mm}/${yyyy}`;
  }

  // Already dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: CAIRO_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(parsed);
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value || '';
    return `${get('day')}/${get('month')}/${get('year')}`;
  }

  return trimmed;
}

/**
 * Parses a `dd/mm/yyyy` string into ISO `YYYY-MM-DD` if valid, otherwise returns null.
 */
export function parseDdMmYyyyToIso(display: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(display.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) {
    return null;
  }
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

interface DatePickerInputProps {
  value: string; // ISO YYYY-MM-DD or ''
  onChange: (isoDate: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'dd/mm/yyyy',
  className = '',
}) => {
  const [text, setText] = useState(() =>
    value ? formatDateDdMmYyyy(value, '') : ''
  );
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(value ? formatDateDdMmYyyy(value, '') : '');
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow digits and slashes; auto-insert slashes when typing digits
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = raw;

    if (/^\d+$/.test(raw.replace(/\//g, '')) && raw.length >= text.length) {
      if (digitsOnly.length <= 2) {
        formatted = digitsOnly;
      } else if (digitsOnly.length <= 4) {
        formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`;
      } else {
        formatted = `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(
          2,
          4
        )}/${digitsOnly.slice(4, 8)}`;
      }
    }

    setText(formatted);

    if (!formatted.trim()) {
      onChange('');
      return;
    }

    const iso = parseDdMmYyyyToIso(formatted);
    if (iso) {
      onChange(iso);
    }
  };

  const handleBlur = () => {
    if (!text.trim()) {
      if (!required) onChange('');
      else if (value) setText(formatDateDdMmYyyy(value, ''));
      return;
    }
    const iso = parseDdMmYyyyToIso(text);
    if (iso) {
      setText(formatDateDdMmYyyy(iso, ''));
      onChange(iso);
    } else {
      // Revert to last valid value
      setText(value ? formatDateDdMmYyyy(value, '') : '');
    }
  };

  const openNativePicker = () => {
    if (disabled || !hiddenDateRef.current) return;
    try {
      if (typeof hiddenDateRef.current.showPicker === 'function') {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current.focus();
        hiddenDateRef.current.click();
      }
    } catch {
      hiddenDateRef.current.focus();
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        required={required}
        disabled={disabled}
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full ps-3 pe-14 py-2 rounded-xl bg-background border border-border text-sm font-mono font-tabular text-foreground focus:outline-none focus:border-pzone-teal focus:ring-2 focus:ring-pzone-teal/20 disabled:opacity-60"
      />

      <div className="absolute end-2 flex items-center gap-1">
        {value && !disabled && !required && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              setText('');
              onChange('');
            }}
            title="Clear date"
            className="p-1 rounded-md text-muted-foreground hover:text-pzone-crimson hover:bg-muted transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={openNativePicker}
          title="Pick date from calendar"
          className="p-1 rounded-md text-muted-foreground hover:text-pzone-teal hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {/* Hidden native date input for 1-click popup calendar selection */}
      <input
        ref={hiddenDateRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        value={value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''}
        onChange={(e) => {
          const nextIso = e.target.value;
          setText(nextIso ? formatDateDdMmYyyy(nextIso, '') : '');
          onChange(nextIso);
        }}
        className="sr-only pointer-events-none"
      />
    </div>
  );
};
