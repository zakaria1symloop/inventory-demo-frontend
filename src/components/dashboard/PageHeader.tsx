'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

/**
 * Unified header for every dashboard page.
 *
 * Replaces ~60+ ad-hoc page-header blocks across `/dashboard/*`. Keeps
 * spacing, type scale and breadcrumb behaviour consistent so the eye
 * never has to recalibrate when switching pages.
 *
 * Usage:
 *   <PageHeader title="Inventory" subtitle="Stock across warehouses">
 *     <button className="btn-secondary">Export</button>
 *     <button className="btn-primary">Add product</button>
 *   </PageHeader>
 */
export interface PageHeaderProps {
  /** Big title (h1). Required. */
  title: string;
  /** One-line context under the title. Optional. */
  subtitle?: string;
  /**
   * Breadcrumb trail. Last entry is the current page (rendered non-link).
   * Leave undefined to skip the breadcrumb.
   */
  breadcrumb?: Array<{ label: string; href?: string }>;
  /**
   * Right-aligned action slot (buttons, dropdowns).
   * Stacks below the title on narrow screens.
   */
  children?: ReactNode;
  /**
   * Small badge or status next to the title — e.g. "Beta", "3 active".
   */
  pill?: ReactNode;
  /**
   * Tighten the bottom margin. Use when followed immediately by a tabs row.
   */
  tight?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumb,
  children,
  pill,
  tight = false,
}: PageHeaderProps) {
  return (
    <header className={tight ? 'mb-3' : 'mb-5 md:mb-6'}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1 text-[12px] text-gray-500 dark:text-gray-400 mb-1.5"
        >
          {breadcrumb.map((crumb, i) => {
            const isLast = i === breadcrumb.length - 1;
            return (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRightIcon
                    className="w-3 h-3 text-gray-300 dark:text-gray-600 rtl:rotate-180"
                    strokeWidth={2}
                  />
                )}
                {!isLast && crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isLast
                        ? 'text-gray-700 dark:text-gray-300 font-medium'
                        : ''
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[20px] md:text-[22px] font-semibold text-gray-900 dark:text-white tracking-tight leading-tight truncate">
              {title}
            </h1>
            {pill}
          </div>
          {subtitle && (
            <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
