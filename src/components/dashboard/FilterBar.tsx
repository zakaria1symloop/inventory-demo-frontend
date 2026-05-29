'use client';

import { ReactNode } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Filter row above tables and lists. Single horizontal ruler — every
 * descendant input lives at the same 38px height, same border, same
 * radius. Mobile stacks; md+ stays on one line with horizontal scroll
 * if there are more filters than the viewport can fit (the ERP
 * convention — NetSuite, Odoo, Linear all do this).
 *
 * Children may be plain <select> elements; the bar styles them via
 * descendant selectors so pages don't have to remember the right
 * height/font/border classes for every dropdown they ship.
 *
 *   <FilterBar
 *     search={search} onSearchChange={setSearch}
 *     searchPlaceholder={t('purchases.searchPlaceholder')}
 *     trailing={hasActiveFilters && <button onClick={clear}>Clear</button>}
 *   >
 *     <select>...</select>
 *     <select>...</select>
 *     <DateInput value={from} onChange={setFrom} />
 *     <DateInput value={to}   onChange={setTo}   />
 *   </FilterBar>
 */

export interface FilterBarProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  /** Filter widgets (selects, date pickers, toggles). */
  children?: ReactNode;
  /** Right-aligned slot (e.g. clear filters, view toggle). */
  trailing?: ReactNode;
  /** Don't render in a bordered tile (inline on plain background). */
  bare?: boolean;
}

export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
  trailing,
  bare = false,
}: FilterBarProps) {
  const container = bare
    ? 'mb-3'
    : 'mb-3 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-md px-2.5 py-2';

  return (
    <div className={container}>
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-2">
        {/* ───────── Search ───────── */}
        {typeof search === 'string' && onSearchChange && (
          <div className="relative w-full md:w-[260px] md:flex-shrink-0 group">
            <MagnifyingGlassIcon
              className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 w-4 h-4 text-gray-400 group-focus-within:text-gray-700 dark:group-focus-within:text-gray-200 pointer-events-none transition-colors"
              strokeWidth={1.7}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-[38px] ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 text-[13.5px] bg-gray-50/60 dark:bg-gray-900/40 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-900/5 transition-colors"
            />
          </div>
        )}

        {/* ───────── Vertical divider (md+ only, between search & filters) ───── */}
        {typeof search === 'string' && children && (
          <div className="hidden md:block w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 flex-shrink-0" />
        )}

        {/* ───────── Filter widgets ─────────
            Wraps freely when there's not enough horizontal space.
            Each <select> gets the same height/border so the row reads
            as a coherent instrument panel even when wrapped. */}
        {children && (
          <div
            className="
              flex items-center gap-1.5 flex-wrap md:flex-1 md:min-w-0
              [&_select]:min-w-[140px] [&_select]:max-w-[220px]
              [&_select]:h-[38px]
              [&_select]:text-[13.5px] [&_select]:py-0 [&_select]:ltr:pl-3 [&_select]:ltr:pr-7 [&_select]:rtl:pr-3 [&_select]:rtl:pl-7
              [&_select]:border [&_select]:border-gray-200/80 dark:[&_select]:border-gray-700
              [&_select]:rounded-md
              [&_select]:bg-gray-50/60 dark:[&_select]:bg-gray-900/40
              [&_select]:text-gray-900 dark:[&_select]:text-gray-100
              [&_select:hover]:bg-white dark:[&_select:hover]:bg-gray-800
              [&_select:focus]:bg-white dark:[&_select:focus]:bg-gray-800
              [&_select:focus]:outline-none [&_select:focus]:border-gray-400 dark:[&_select:focus]:border-gray-500
              [&_select:focus]:ring-1 [&_select:focus]:ring-gray-900/5
              [&_select]:cursor-pointer
              [&_select]:transition-colors
              [&_select]:appearance-none
              [&_select]:bg-[length:14px_14px] [&_select]:bg-no-repeat
              [&_select]:ltr:bg-[right_0.6rem_center] [&_select]:rtl:bg-[left_0.6rem_center]
              [&_select]:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%20fill=%22%236b7280%22%3E%3Cpath%20fill-rule=%22evenodd%22%20d=%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule=%22evenodd%22%2F%3E%3C/svg%3E')]
            "
          >
            {children}
          </div>
        )}

        {/* ───────── Trailing slot (Clear, view toggle, etc.) ─────────
            Stays pinned to the end of the row so it never scrolls
            away with the filters. */}
        {trailing && (
          <div className="flex items-center gap-2 md:flex-shrink-0 md:ltr:ml-auto md:rtl:mr-auto">
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}
