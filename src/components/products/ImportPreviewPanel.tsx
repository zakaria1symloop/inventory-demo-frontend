'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { ImportPreviewResponse, ImportRow, ImportColumnDef } from '@/lib/types';

interface EditableRow {
  name: string;
  category_id: number | null;
  brand_id: number | null;
  unit_buy_id: number | null;
  unit_sale_id: number | null;
  barcode: string;
  cost_price: string;
  stock_alert: string;
  tax_percent: string;
  pieces_per_package: string;
  opening_stock: string;
  categoryPrices: Record<number, string>;
  isSkipped: boolean;
  errors: Record<string, string>;
}

interface Props {
  previewData: ImportPreviewResponse;
  onConfirm: (rows: ImportRow[]) => void;
  onCancel: () => void;
  isImporting: boolean;
}

type FilterTab = 'all' | 'valid' | 'invalid';

export default function ImportPreviewPanel({ previewData, onConfirm, onCancel, isImporting }: Props) {
  const [filter, setFilter] = useState<FilterTab>('all');
  const [editedRows, setEditedRows] = useState<Map<number, EditableRow>>(() => {
    const map = new Map<number, EditableRow>();
    for (const row of previewData.rows) {
      const c = row.cells;
      const catPrices: Record<number, string> = {};
      for (const col of previewData.columns) {
        if (col.client_category_id) {
          catPrices[col.client_category_id] = c[col.key]?.value || '';
        }
      }
      map.set(row.rowIndex, {
        name: c.name?.value || '',
        category_id: c.category?.resolvedId ?? null,
        brand_id: c.brand?.resolvedId ?? null,
        unit_buy_id: c.unit_buy?.resolvedId ?? null,
        unit_sale_id: c.unit_sale?.resolvedId ?? null,
        barcode: c.barcode?.value || '',
        cost_price: c.cost_price?.value || '',
        stock_alert: c.stock_alert?.value || '',
        tax_percent: c.tax_percent?.value || '',
        pieces_per_package: c.pieces_per_package?.value || '',
        opening_stock: c.opening_stock?.value || '',
        categoryPrices: catPrices,
        isSkipped: false,
        errors: {},
      });
    }
    return map;
  });

  // Collect all barcodes for cross-row duplicate detection
  const barcodeOwners = useMemo(() => {
    const map = new Map<string, number[]>();
    editedRows.forEach((row, idx) => {
      if (row.barcode && !row.isSkipped) {
        const existing = map.get(row.barcode) || [];
        existing.push(idx);
        map.set(row.barcode, existing);
      }
    });
    return map;
  }, [editedRows]);

  // Validate all rows
  const validateRow = useCallback((row: EditableRow, rowIndex: number): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!row.name.trim()) errors.name = 'الاسم مطلوب';
    const cp = parseFloat(row.cost_price);
    if (row.cost_price === '' || isNaN(cp) || cp < 0) errors.cost_price = 'سعر غير صالح';
    if (row.stock_alert !== '' && (isNaN(Number(row.stock_alert)) || Number(row.stock_alert) < 0)) errors.stock_alert = 'قيمة غير صالحة';
    if (row.tax_percent !== '' && (isNaN(Number(row.tax_percent)) || Number(row.tax_percent) < 0 || Number(row.tax_percent) > 100)) errors.tax_percent = '0-100';
    if (row.pieces_per_package !== '' && (isNaN(Number(row.pieces_per_package)) || Number(row.pieces_per_package) < 1)) errors.pieces_per_package = '1 أو أكثر';
    if (row.opening_stock !== '' && (isNaN(Number(row.opening_stock)) || Number(row.opening_stock) < 0)) errors.opening_stock = 'قيمة غير صالحة';
    // Barcode duplicate check
    if (row.barcode) {
      const owners = barcodeOwners.get(row.barcode) || [];
      if (owners.length > 1) errors.barcode = 'مكرر في الملف';
    }
    // Category price validation
    for (const col of previewData.columns) {
      if (col.client_category_id) {
        const val = row.categoryPrices[col.client_category_id] || '';
        if (val !== '' && (isNaN(Number(val)) || Number(val) < 0)) {
          errors[col.key] = 'سعر غير صالح';
        }
      }
    }
    return errors;
  }, [barcodeOwners, previewData.columns]);

  // Run validation on all rows whenever data changes
  useEffect(() => {
    setEditedRows(prev => {
      const next = new Map(prev);
      let changed = false;
      next.forEach((row, idx) => {
        const errors = validateRow(row, idx);
        if (JSON.stringify(errors) !== JSON.stringify(row.errors)) {
          next.set(idx, { ...row, errors });
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [validateRow]);

  const updateRow = (rowIndex: number, field: string, value: string | number | null) => {
    setEditedRows(prev => {
      const next = new Map(prev);
      const row = next.get(rowIndex);
      if (!row) return prev;
      const updated = { ...row, [field]: value };
      updated.errors = validateRow(updated, rowIndex);
      next.set(rowIndex, updated);
      return next;
    });
  };

  const updateCategoryPrice = (rowIndex: number, ccId: number, value: string) => {
    setEditedRows(prev => {
      const next = new Map(prev);
      const row = next.get(rowIndex);
      if (!row) return prev;
      const updated = { ...row, categoryPrices: { ...row.categoryPrices, [ccId]: value } };
      updated.errors = validateRow(updated, rowIndex);
      next.set(rowIndex, updated);
      return next;
    });
  };

  const toggleSkip = (rowIndex: number) => {
    setEditedRows(prev => {
      const next = new Map(prev);
      const row = next.get(rowIndex);
      if (!row) return prev;
      next.set(rowIndex, { ...row, isSkipped: !row.isSkipped });
      return next;
    });
  };

  // Stats
  const stats = useMemo(() => {
    let valid = 0, invalid = 0, skipped = 0;
    editedRows.forEach(row => {
      if (row.isSkipped) { skipped++; return; }
      if (Object.keys(row.errors).length === 0) valid++;
      else invalid++;
    });
    return { valid, invalid, skipped, total: editedRows.size };
  }, [editedRows]);

  // Filter rows
  const filteredRows = useMemo(() => {
    const entries = Array.from(editedRows.entries());
    if (filter === 'valid') return entries.filter(([, r]) => !r.isSkipped && Object.keys(r.errors).length === 0);
    if (filter === 'invalid') return entries.filter(([, r]) => !r.isSkipped && Object.keys(r.errors).length > 0);
    return entries;
  }, [editedRows, filter]);

  // Build final import data
  const handleConfirm = () => {
    const rows: ImportRow[] = [];
    editedRows.forEach(row => {
      if (row.isSkipped) return;
      if (Object.keys(row.errors).length > 0) return;
      const catPrices: { client_category_id: number; price: number }[] = [];
      for (const [ccId, val] of Object.entries(row.categoryPrices)) {
        if (val !== '' && Number(val) > 0) {
          catPrices.push({ client_category_id: Number(ccId), price: Number(val) });
        }
      }
      rows.push({
        name: row.name,
        category_id: row.category_id,
        brand_id: row.brand_id,
        unit_buy_id: row.unit_buy_id,
        unit_sale_id: row.unit_sale_id,
        barcode: row.barcode,
        cost_price: parseFloat(row.cost_price) || 0,
        stock_alert: row.stock_alert !== '' ? parseInt(row.stock_alert) : 0,
        tax_percent: row.tax_percent !== '' ? parseFloat(row.tax_percent) : 0,
        pieces_per_package: row.pieces_per_package !== '' ? parseInt(row.pieces_per_package) : 1,
        opening_stock: row.opening_stock !== '' ? parseInt(row.opening_stock) : 0,
        category_prices: catPrices,
      });
    });
    onConfirm(rows);
  };

  // Auto-scroll to first error on mount
  useEffect(() => {
    const el = document.querySelector('[data-row-status="invalid"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  const { referenceData } = previewData;
  const priceColumns = previewData.columns.filter(c => c.client_category_id);

  const canConfirm = stats.valid > 0 && !isImporting;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onCancel} />
      <div className="fixed inset-3 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold dark:text-white">معاينة الاستيراد</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-0.5 rounded-full font-medium">
                {stats.valid} صالح
              </span>
              {stats.invalid > 0 && (
                <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-3 py-0.5 rounded-full font-medium">
                  {stats.invalid} يحتاج تعديل
                </span>
              )}
              {stats.skipped > 0 && (
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-0.5 rounded-full font-medium">
                  {stats.skipped} متخطى
                </span>
              )}
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex-shrink-0">
          {([
            ['all', `الكل (${stats.total})`],
            ['valid', `صالح (${stats.valid})`],
            ['invalid', `يحتاج تعديل (${stats.invalid})`],
          ] as [FilterTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100 dark:bg-gray-900 border-b dark:border-gray-700">
                <th className="px-2 py-2 text-center w-10">#</th>
                <th className="px-2 py-2 text-center w-10">تخطي</th>
                <th className="px-2 py-2 text-center w-8"></th>
                <th className="px-3 py-2 text-right min-w-[180px]">الاسم *</th>
                <th className="px-3 py-2 text-right min-w-[140px]">الفئة</th>
                <th className="px-3 py-2 text-right min-w-[140px]">العلامة التجارية</th>
                <th className="px-3 py-2 text-right min-w-[130px]">وحدة الشراء</th>
                <th className="px-3 py-2 text-right min-w-[130px]">وحدة البيع</th>
                <th className="px-3 py-2 text-right min-w-[140px]">الباركود</th>
                <th className="px-3 py-2 text-right min-w-[120px]">سعر الشراء *</th>
                <th className="px-3 py-2 text-right min-w-[100px]">حد التنبيه</th>
                <th className="px-3 py-2 text-right min-w-[100px]">الضريبة %</th>
                <th className="px-3 py-2 text-right min-w-[120px]">قطع/كرتون</th>
                <th className="px-3 py-2 text-right min-w-[120px]">الكمية الأولية</th>
                {priceColumns.map(col => (
                  <th key={col.key} className="px-3 py-2 text-right min-w-[120px]">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(([rowIndex, row]) => {
                const hasErrors = Object.keys(row.errors).length > 0;
                const rowStatus = row.isSkipped ? 'skipped' : hasErrors ? 'invalid' : 'valid';
                return (
                  <tr
                    key={rowIndex}
                    data-row-status={rowStatus}
                    className={`border-b dark:border-gray-700 transition-colors ${
                      row.isSkipped
                        ? 'bg-gray-100 dark:bg-gray-800 opacity-50'
                        : hasErrors
                        ? 'bg-red-50/50 dark:bg-red-900/10'
                        : 'bg-green-50/30 dark:bg-green-900/5 hover:bg-green-50 dark:hover:bg-green-900/10'
                    }`}
                  >
                    {/* Row number */}
                    <td className="px-2 py-1.5 text-center text-gray-400 text-xs">{rowIndex}</td>

                    {/* Skip checkbox */}
                    <td className="px-2 py-1.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.isSkipped}
                        onChange={() => toggleSkip(rowIndex)}
                        className="w-3.5 h-3.5 rounded"
                      />
                    </td>

                    {/* Status icon */}
                    <td className="px-1 py-1.5 text-center">
                      {row.isSkipped ? (
                        <span className="text-gray-400 text-xs">—</span>
                      ) : hasErrors ? (
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mx-auto" />
                      ) : (
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mx-auto" />
                      )}
                    </td>

                    {/* Name */}
                    <CellInput value={row.name} error={row.errors.name} disabled={row.isSkipped}
                      onChange={v => updateRow(rowIndex, 'name', v)} />

                    {/* Category */}
                    <CellSelect
                      value={row.category_id}
                      error={row.errors.category}
                      disabled={row.isSkipped}
                      options={referenceData.categories}
                      originalText={previewData.rows.find(r => r.rowIndex === rowIndex)?.cells.category?.value}
                      onChange={v => updateRow(rowIndex, 'category_id', v)}
                    />

                    {/* Brand */}
                    <CellSelect
                      value={row.brand_id}
                      error={row.errors.brand}
                      disabled={row.isSkipped}
                      options={referenceData.brands}
                      originalText={previewData.rows.find(r => r.rowIndex === rowIndex)?.cells.brand?.value}
                      onChange={v => updateRow(rowIndex, 'brand_id', v)}
                    />

                    {/* Unit Buy */}
                    <CellSelect
                      value={row.unit_buy_id}
                      error={row.errors.unit_buy}
                      disabled={row.isSkipped}
                      options={referenceData.units.map(u => ({ id: u.id, name: u.name }))}
                      originalText={previewData.rows.find(r => r.rowIndex === rowIndex)?.cells.unit_buy?.value}
                      onChange={v => updateRow(rowIndex, 'unit_buy_id', v)}
                    />

                    {/* Unit Sale */}
                    <CellSelect
                      value={row.unit_sale_id}
                      error={row.errors.unit_sale}
                      disabled={row.isSkipped}
                      options={referenceData.units.map(u => ({ id: u.id, name: u.name }))}
                      originalText={previewData.rows.find(r => r.rowIndex === rowIndex)?.cells.unit_sale?.value}
                      onChange={v => updateRow(rowIndex, 'unit_sale_id', v)}
                    />

                    {/* Barcode */}
                    <CellInput value={row.barcode} error={row.errors.barcode} disabled={row.isSkipped}
                      onChange={v => updateRow(rowIndex, 'barcode', v)} />

                    {/* Cost Price */}
                    <CellInput value={row.cost_price} error={row.errors.cost_price} disabled={row.isSkipped}
                      type="number" onChange={v => updateRow(rowIndex, 'cost_price', v)} />

                    {/* Stock Alert */}
                    <CellInput value={row.stock_alert} error={row.errors.stock_alert} disabled={row.isSkipped}
                      type="number" onChange={v => updateRow(rowIndex, 'stock_alert', v)} />

                    {/* Tax Percent */}
                    <CellInput value={row.tax_percent} error={row.errors.tax_percent} disabled={row.isSkipped}
                      type="number" onChange={v => updateRow(rowIndex, 'tax_percent', v)} />

                    {/* Pieces Per Package */}
                    <CellInput value={row.pieces_per_package} error={row.errors.pieces_per_package} disabled={row.isSkipped}
                      type="number" onChange={v => updateRow(rowIndex, 'pieces_per_package', v)} />

                    {/* Opening Stock */}
                    <CellInput value={row.opening_stock} error={row.errors.opening_stock} disabled={row.isSkipped}
                      type="number" onChange={v => updateRow(rowIndex, 'opening_stock', v)} />

                    {/* Client Category Prices */}
                    {priceColumns.map(col => (
                      <CellInput
                        key={col.key}
                        value={row.categoryPrices[col.client_category_id!] || ''}
                        error={row.errors[col.key]}
                        disabled={row.isSkipped}
                        type="number"
                        onChange={v => updateCategoryPrice(rowIndex, col.client_category_id!, v)}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRows.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              لا توجد صفوف تطابق الفلتر المحدد
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
          <p className="text-sm text-gray-500">
            {stats.invalid > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                {stats.invalid} صف يحتاج تعديل — أصلح الأخطاء أو تخطَّ الصفوف
              </span>
            )}
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn btn-secondary" disabled={isImporting}>
              إلغاء
            </button>
            <button
              onClick={handleConfirm}
              className="btn btn-primary"
              disabled={!canConfirm}
            >
              {isImporting ? (
                <span className="spinner w-4 h-4"></span>
              ) : (
                `استيراد ${stats.valid} منتج`
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ──

function CellInput({ value, error, disabled, type = 'text', onChange }: {
  value: string;
  error?: string;
  disabled?: boolean;
  type?: 'text' | 'number';
  onChange: (v: string) => void;
}) {
  return (
    <td className="px-1.5 py-1 relative">
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-2 py-1 text-sm rounded border transition-colors ${
          error
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 focus:ring-red-400'
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-blue-400'
        } focus:outline-none focus:ring-1 disabled:opacity-40`}
        title={error || ''}
      />
      {error && (
        <span className="absolute -bottom-2.5 right-1 text-[9px] text-red-500 whitespace-nowrap bg-white dark:bg-gray-800 px-0.5 rounded">
          {error}
        </span>
      )}
    </td>
  );
}

function CellSelect({ value, error, disabled, options, originalText, onChange }: {
  value: number | null;
  error?: string;
  disabled?: boolean;
  options: { id: number; name: string }[];
  originalText?: string;
  onChange: (v: number | null) => void;
}) {
  const hasUnresolved = !value && originalText;
  return (
    <td className="px-1.5 py-1 relative">
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled}
        className={`w-full px-2 py-1 text-sm rounded border transition-colors ${
          error || hasUnresolved
            ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 focus:ring-red-400'
            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-blue-400'
        } focus:outline-none focus:ring-1 disabled:opacity-40`}
        title={error || (hasUnresolved ? `"${originalText}" غير موجود` : '')}
      >
        <option value="">{hasUnresolved ? `⚠ ${originalText}` : '—'}</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
      </select>
      {(error || hasUnresolved) && (
        <span className="absolute -bottom-2.5 right-1 text-[9px] text-red-500 whitespace-nowrap bg-white dark:bg-gray-800 px-0.5 rounded">
          {error || 'غير موجود'}
        </span>
      )}
    </td>
  );
}
