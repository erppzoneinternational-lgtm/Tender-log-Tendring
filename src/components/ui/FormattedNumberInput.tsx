import React, { useState } from 'react';

export interface FormattedNumberInputProps {
  value: number | null | undefined;
  onValueChange: (next: number) => void;
  decimals?: number;
  min?: number;
  disabled?: boolean;
  placeholder?: string;
  title?: string;
  className?: string;
  allowEmptyNull?: boolean;
  onEmptyChange?: () => void;
}

export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value,
  onValueChange,
  decimals = 2,
  min = 0,
  disabled = false,
  placeholder,
  title,
  className = '',
  allowEmptyNull = false,
  onEmptyChange,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [rawText, setRawText] = useState('');

  const formatDisplay = (num: number | null | undefined): string => {
    if (allowEmptyNull && (num === null || num === undefined)) {
      return '';
    }
    const safe = Number(num ?? 0);
    if (Number.isNaN(safe)) {
      return (0).toFixed(decimals);
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(safe);
  };

  const displayedValue =
    isFocused && !disabled ? rawText : formatDisplay(value);

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      placeholder={placeholder}
      title={title}
      value={displayedValue}
      onFocus={(e) => {
        if (disabled) return;
        const current =
          value === null || value === undefined ? '' : String(value);
        setRawText(current);
        setIsFocused(true);
        const target = e.currentTarget;
        requestAnimationFrame(() => {
          try {
            target.select();
          } catch {
            // Ignore selection errors on detached inputs
          }
        });
      }}
      onBlur={() => {
        setIsFocused(false);
      }}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/,/g, '').trim();
        if (cleaned === '') {
          setRawText('');
          if (allowEmptyNull && onEmptyChange) {
            onEmptyChange();
          } else {
            onValueChange(min);
          }
          return;
        }
        if (cleaned === '.') {
          setRawText('0.');
          onValueChange(min);
          return;
        }
        if (!/^-?\d*\.?\d*$/.test(cleaned)) {
          return;
        }
        setRawText(cleaned);
        const parsed = Number(cleaned);
        if (!Number.isNaN(parsed)) {
          onValueChange(Math.max(min, parsed));
        }
      }}
      className={className}
    />
  );
};
