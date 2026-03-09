'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
  'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const DAY_NAMES = ['سب', 'أح', 'إث', 'ثل', 'أر', 'خم', 'جم'];

function toDisplay(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

function toISO(display: string): string {
  if (!display) return '';
  const [d, m, y] = display.split('-');
  if (!d || !m || !y || y.length !== 4) return '';
  return `${y}-${m}-${d}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0=Sun, we want Saturday=0
  const day = new Date(year, month, 1).getDay();
  return (day + 1) % 7; // shift so Saturday=0
}

export default function DateInput({
  value,
  onChange,
  placeholder = 'dd-mm-yyyy',
  className = '',
  min,
  max,
  required,
  disabled,
}: DateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(toDisplay(value));
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0]);
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return parseInt(value.split('-')[1]) - 1;
    return new Date().getMonth();
  });
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setDisplayValue(toDisplay(value));
    if (value) {
      const [y, m] = value.split('-');
      setViewYear(parseInt(y));
      setViewMonth(parseInt(m) - 1);
    }
  }, [value]);

  // Position dropdown
  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 340;
    const top = spaceBelow < dropdownHeight
      ? rect.top + window.scrollY - dropdownHeight - 4
      : rect.bottom + window.scrollY + 4;
    setDropdownPos({
      top,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 280),
    });
  }, []);

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setIsOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Auto-insert dashes
    const digits = val.replace(/[^0-9]/g, '');
    if (digits.length <= 2) {
      val = digits;
    } else if (digits.length <= 4) {
      val = digits.slice(0, 2) + '-' + digits.slice(2);
    } else {
      val = digits.slice(0, 2) + '-' + digits.slice(2, 4) + '-' + digits.slice(4, 8);
    }
    setDisplayValue(val);

    // If complete, convert to ISO
    if (val.length === 10) {
      const iso = toISO(val);
      if (iso && !isNaN(Date.parse(iso))) {
        if (min && iso < min) return;
        if (max && iso > max) return;
        onChange(iso);
        const [y, m] = iso.split('-');
        setViewYear(parseInt(y));
        setViewMonth(parseInt(m) - 1);
      }
    } else if (val === '') {
      onChange('');
    }
  };

  const handleDayClick = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const iso = `${viewYear}-${m}-${d}`;
    if (min && iso < min) return;
    if (max && iso > max) return;
    onChange(iso);
    setDisplayValue(toDisplay(iso));
    setIsOpen(false);
  };

  const handleToday = () => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (min && iso < min) return;
    if (max && iso > max) return;
    onChange(iso);
    setDisplayValue(toDisplay(iso));
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setDisplayValue('');
    setIsOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDayDisabled = (day: number): boolean => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const iso = `${viewYear}-${m}-${d}`;
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  };

  const isSelected = (day: number): boolean => {
    if (!value) return false;
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return value === `${viewYear}-${m}-${d}`;
  };

  const isToday = (day: number): boolean => {
    const now = new Date();
    return day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const calendarDropdown = isOpen && typeof window !== 'undefined' ? createPortal(
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        direction: 'rtl',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {MONTH_NAMES[viewMonth]}
          </span>
          <input
            type="number"
            value={viewYear}
            onChange={(e) => {
              const y = parseInt(e.target.value);
              if (y > 1900 && y < 2100) setViewYear(y);
            }}
            className="w-16 text-center text-sm font-semibold bg-transparent border-none outline-none text-gray-800 dark:text-gray-200"
            style={{ direction: 'ltr' }}
          />
        </div>
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 px-2 pb-2">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            {day ? (
              <button
                type="button"
                onClick={() => handleDayClick(day)}
                disabled={isDayDisabled(day)}
                className={`w-8 h-8 text-sm rounded-lg transition-all
                  ${isSelected(day)
                    ? 'bg-blue-500 text-white font-bold shadow-sm'
                    : isToday(day)
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  ${isDayDisabled(day) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {day}
              </button>
            ) : (
              <span className="w-8 h-8" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={handleToday}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
        >
          اليوم
        </button>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
          >
            مسح
          </button>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) {
              updatePosition();
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="input pl-9"
          style={{ direction: 'ltr', textAlign: 'left' }}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              updatePosition();
              setIsOpen(!isOpen);
              inputRef.current?.focus();
            }
          }}
          tabIndex={-1}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </button>
      </div>
      {calendarDropdown}
    </div>
  );
}
