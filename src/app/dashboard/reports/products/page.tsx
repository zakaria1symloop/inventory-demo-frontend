'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, productsApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import {
  CubeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { PageHeader, FilterBar } from '@/components/dashboard';

interface ProductReport {
  id: number;
  name: string;
  barcode: string | null;
  category_name: string | null;
  retail_price: number | string;
  cost_price: number | string;
  total_quantity: number | string;
  total_revenue: number | string;
  total_cost: number | string;
  profit: number | string;
}

const n = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
};

const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};
const today = () => new Date().toISOString().split('T')[0];

type SortKey = 'name' | 'total_quantity' | 'total_revenue' | 'total_cost' | 'profit' | 'margin';

export default function ProductReportPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo());
  const [dateTo, setDateTo] = useState(today());
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('total_revenue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['product-report', dateFrom, dateTo],
    queryFn: async () => {
      const res = await reportsApi.salesByProduct({ from_date: dateFrom, to_date: dateTo });
      return res.data as { data: ProductReport[]; totals: { total_quantity: number; total_revenue: number; total_cost: number; total_profit: number } };
    },
  });

  const products = data?.data || [];
  const totals = data?.totals || { total_quantity: 0, total_revenue: 0, total_cost: 0, total_profit: 0 };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => { if (p.category_name) cats.add(p.category_name); });
    return Array.from(cats).sort();
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q)));
    }
    if (categoryFilter) {
      list = list.filter(p => p.category_name === categoryFilter);
    }
    list.sort((a, b) => {
      let va: number, vb: number;
      if (sortKey === 'name') {
        return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sortKey === 'margin') {
        va = n(a.total_revenue) > 0 ? (n(a.profit) / n(a.total_revenue)) * 100 : 0;
        vb = n(b.total_revenue) > 0 ? (n(b.profit) / n(b.total_revenue)) * 100 : 0;
      } else {
        va = n(a[sortKey]);
        vb = n(b[sortKey]);
      }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return list;
  }, [products, search, categoryFilter, sortKey, sortDir]);

  const totalMargin = n(totals.total_revenue) > 0 ? (n(totals.total_profit) / n(totals.total_revenue)) * 100 : 0;

  const chartData = useMemo(() =>
    filtered.slice(0, 10).map(p => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
      revenue: n(p.total_revenue),
      profit: n(p.profit),
      cost: n(p.total_cost),
    })),
  [filtered]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(v);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronUpIcon className="w-3 h-3 text-gray-300 dark:text-gray-600" />;
    return sortDir === 'asc'
      ? <ChevronUpIcon className="w-3 h-3 text-gray-700 dark:text-gray-200" />
      : <ChevronDownIcon className="w-3 h-3 text-gray-700 dark:text-gray-200" />;
  };

  const exportCSV = () => {
    const header = ['المنتج', 'الباركود', 'الفئة', 'الكمية', 'الإيرادات', 'التكلفة', 'الربح', 'الهامش %'];
    const rows = filtered.map(p => {
      const margin = n(p.total_revenue) > 0 ? ((n(p.profit) / n(p.total_revenue)) * 100).toFixed(1) : '0';
      return [p.name, p.barcode || '', p.category_name || '', n(p.total_quantity), n(p.total_revenue).toFixed(0), n(p.total_cost).toFixed(0), n(p.profit).toFixed(0), margin];
    });
    const csv = '﻿' + [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `product-report-${dateFrom}-${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = [search, categoryFilter].filter(Boolean).length;

  const marginDot = (margin: number) => {
    if (margin >= 30) return 'metric-dot-green';
    if (margin >= 15) return 'metric-dot-blue';
    if (margin >= 0) return 'metric-dot-orange';
    return 'metric-dot-red';
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={locale === 'ar' ? 'تقرير المنتجات' : 'Rapport Produits'}
        subtitle={locale === 'ar' ? 'تحليل المبيعات والأرباح حسب المنتج' : 'Analyse des ventes et marges par produit'}
        tight
      >
        <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 px-2.5 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="Refresh">
          <ArrowPathIcon className="w-4 h-4" />
        </button>
        <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <ArrowDownTrayIcon className="w-4 h-4" /> CSV
        </button>
      </PageHeader>

      {/* Date Range */}
      <FilterBar>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{locale === 'ar' ? 'من' : 'Du'}</span>
          <DateInput value={dateFrom} onChange={setDateFrom} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{locale === 'ar' ? 'إلى' : 'Au'}</span>
          <DateInput value={dateTo} onChange={setDateTo} />
        </div>
      </FilterBar>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {[
          { label: locale === 'ar' ? 'عدد المنتجات' : 'Produits', value: String(filtered.length), dot: 'metric-dot-violet', currency: false },
          { label: locale === 'ar' ? 'إجمالي الإيرادات' : 'Revenus', value: formatCurrency(n(totals.total_revenue)), dot: 'metric-dot-blue', currency: true },
          { label: locale === 'ar' ? 'إجمالي التكلفة' : 'Coûts', value: formatCurrency(n(totals.total_cost)), dot: 'metric-dot-orange', currency: true },
          { label: locale === 'ar' ? 'إجمالي الربح' : 'Profit', value: formatCurrency(n(totals.total_profit)), dot: 'metric-dot-green', currency: true },
          { label: locale === 'ar' ? 'هامش الربح' : 'Marge', value: `${totalMargin.toFixed(1)}%`, dot: totalMargin >= 0 ? 'metric-dot-green' : 'metric-dot-red', currency: false },
        ].map((kpi, i) => (
          <div key={i} className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className={`metric-dot ${kpi.dot}`} aria-hidden />
              <p className="metric-label truncate">{kpi.label}</p>
            </div>
            {kpi.currency ? (
              <p className="metric-value-currency">{kpi.value}</p>
            ) : (
              <p className="metric-value truncate">{kpi.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Chart - Top 10 */}
      {chartData.length > 0 && (
        <div className="surface-pro">
          <h3 className="surface-heading mb-3">
            {locale === 'ar' ? 'أعلى 10 منتجات حسب الإيرادات' : 'Top 10 produits par revenu'}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" name={locale === 'ar' ? 'الإيرادات' : 'Revenus'} radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#7c3aed' : '#a78bfa'} />)}
                </Bar>
                <Bar dataKey="profit" name={locale === 'ar' ? 'الربح' : 'Profit'} radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => <Cell key={i} fill={i === 0 ? '#059669' : '#6ee7b7'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search + filter row */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={locale === 'ar' ? 'بحث بالاسم أو الباركود...' : 'Rechercher par nom ou code-barres...'}
        trailing={
          <>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative inline-flex items-center gap-1.5 px-3 h-[38px] text-[12px] font-semibold rounded-md transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="ms-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[10px] font-bold tnum">{activeFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={() => { setSearch(''); setCategoryFilter(''); }} className="inline-flex items-center gap-1 px-2 h-[38px] text-[12px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <XMarkIcon className="w-3.5 h-3.5" />
                {locale === 'ar' ? 'مسح' : 'Clear'}
              </button>
            )}
            <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum hidden sm:inline">{filtered.length} {locale === 'ar' ? 'منتج' : 'produits'}</span>
          </>
        }
      >
        {showFilters && (
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">{locale === 'ar' ? 'كل الفئات' : 'Toutes les catégories'}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </FilterBar>

      {/* Data Table */}
      <div className="table-pro-wrap">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CubeIcon className="w-12 h-12 mb-3" />
            <p className="text-[13px] font-medium">{locale === 'ar' ? 'لا توجد بيانات' : 'Aucune donnée'}</p>
          </div>
        ) : (
          <table className="table-pro compact">
            <thead>
              <tr>
                <th className="text-start w-10">#</th>
                <th className="cursor-pointer" onClick={() => handleSort('name')}>
                  <span className="flex items-center gap-1">{locale === 'ar' ? 'المنتج' : 'Produit'} <SortIcon col="name" /></span>
                </th>
                <th className="text-end cursor-pointer" onClick={() => handleSort('total_quantity')}>
                  <span className="flex items-center justify-end gap-1">{locale === 'ar' ? 'الكمية' : 'Qté'} <SortIcon col="total_quantity" /></span>
                </th>
                <th className="text-end cursor-pointer" onClick={() => handleSort('total_revenue')}>
                  <span className="flex items-center justify-end gap-1">{locale === 'ar' ? 'الإيرادات' : 'Revenus'} <SortIcon col="total_revenue" /></span>
                </th>
                <th className="text-end cursor-pointer" onClick={() => handleSort('total_cost')}>
                  <span className="flex items-center justify-end gap-1">{locale === 'ar' ? 'التكلفة' : 'Coûts'} <SortIcon col="total_cost" /></span>
                </th>
                <th className="text-end cursor-pointer" onClick={() => handleSort('profit')}>
                  <span className="flex items-center justify-end gap-1">{locale === 'ar' ? 'الربح' : 'Profit'} <SortIcon col="profit" /></span>
                </th>
                <th className="text-end cursor-pointer" onClick={() => handleSort('margin')}>
                  <span className="flex items-center justify-end gap-1">{locale === 'ar' ? 'الهامش' : 'Marge'} <SortIcon col="margin" /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const revenue = n(p.total_revenue);
                const cost = n(p.total_cost);
                const profit = n(p.profit);
                const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

                return (
                  <tr key={p.id}>
                    <td className="text-gray-400 tnum">{i + 1}</td>
                    <td>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.barcode && <span className="text-[11px] text-gray-400 font-mono">{p.barcode}</span>}
                        {p.category_name && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{p.category_name}</span>}
                      </div>
                    </td>
                    <td className="text-end font-medium text-gray-700 dark:text-gray-300 tnum">{n(p.total_quantity)}</td>
                    <td className="text-end font-semibold text-gray-800 dark:text-gray-100 tnum">{formatCurrency(revenue)}</td>
                    <td className="text-end font-medium text-gray-700 dark:text-gray-300 tnum">{formatCurrency(cost)}</td>
                    <td className="text-end font-semibold text-gray-800 dark:text-gray-100 tnum">
                      {formatCurrency(profit)}
                    </td>
                    <td className="text-end">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 tnum">
                        <span className={`metric-dot ${marginDot(margin)}`} aria-hidden />
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-gray-800/40 border-t border-gray-200 dark:border-gray-700">
                <td colSpan={2} className="font-semibold text-gray-700 dark:text-gray-200">
                  {locale === 'ar' ? 'المجموع' : 'Total'} ({filtered.length})
                </td>
                <td className="text-end font-semibold text-gray-900 dark:text-white tnum">
                  {filtered.reduce((s, p) => s + n(p.total_quantity), 0)}
                </td>
                <td className="text-end font-semibold text-gray-900 dark:text-white tnum">
                  {formatCurrency(filtered.reduce((s, p) => s + n(p.total_revenue), 0))}
                </td>
                <td className="text-end font-semibold text-gray-900 dark:text-white tnum">
                  {formatCurrency(filtered.reduce((s, p) => s + n(p.total_cost), 0))}
                </td>
                <td className="text-end font-semibold text-gray-900 dark:text-white tnum">
                  {formatCurrency(filtered.reduce((s, p) => s + n(p.profit), 0))}
                </td>
                <td className="text-end font-semibold text-gray-700 dark:text-gray-300 tnum">
                  {totalMargin.toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
