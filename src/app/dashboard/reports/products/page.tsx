'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, productsApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import {
  CubeIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

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
      ? <ChevronUpIcon className="w-3 h-3 text-blue-600" />
      : <ChevronDownIcon className="w-3 h-3 text-blue-600" />;
  };

  const exportCSV = () => {
    const header = ['المنتج', 'الباركود', 'الفئة', 'الكمية', 'الإيرادات', 'التكلفة', 'الربح', 'الهامش %'];
    const rows = filtered.map(p => {
      const margin = n(p.total_revenue) > 0 ? ((n(p.profit) / n(p.total_revenue)) * 100).toFixed(1) : '0';
      return [p.name, p.barcode || '', p.category_name || '', n(p.total_quantity), n(p.total_revenue).toFixed(0), n(p.total_cost).toFixed(0), n(p.profit).toFixed(0), margin];
    });
    const csv = '\uFEFF' + [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `product-report-${dateFrom}-${dateTo}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = [search, categoryFilter].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <CubeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-none">
              {locale === 'ar' ? 'تقرير المنتجات' : 'Rapport Produits'}
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {locale === 'ar' ? 'تحليل المبيعات والأرباح حسب المنتج' : 'Analyse des ventes et marges par produit'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button onClick={exportCSV} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              {locale === 'ar' ? 'من تاريخ' : 'Du'}
            </label>
            <DateInput value={dateFrom} onChange={setDateFrom} className="w-full" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              {locale === 'ar' ? 'إلى تاريخ' : 'Au'}
            </label>
            <DateInput value={dateTo} onChange={setDateTo} className="w-full" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: locale === 'ar' ? 'عدد المنتجات' : 'Produits', value: String(filtered.length), icon: CubeIcon, color: 'violet' },
          { label: locale === 'ar' ? 'إجمالي الإيرادات' : 'Revenus', value: formatCurrency(n(totals.total_revenue)), icon: BanknotesIcon, color: 'blue' },
          { label: locale === 'ar' ? 'إجمالي التكلفة' : 'Coûts', value: formatCurrency(n(totals.total_cost)), icon: ChartBarIcon, color: 'amber' },
          { label: locale === 'ar' ? 'إجمالي الربح' : 'Profit', value: formatCurrency(n(totals.total_profit)), icon: ArrowTrendingUpIcon, color: 'emerald' },
          { label: locale === 'ar' ? 'هامش الربح' : 'Marge', value: `${totalMargin.toFixed(1)}%`, icon: n(totals.total_profit) >= 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon, color: totalMargin >= 0 ? 'emerald' : 'red' },
        ].map((kpi, i) => {
          const colorMap: Record<string, string> = {
            violet: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
            blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
            amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
            emerald: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
            red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
          };
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[kpi.color]}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase">{kpi.label}</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none mt-0.5">{kpi.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart - Top 10 */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
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

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
        {/* Search + Filters */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              placeholder={locale === 'ar' ? 'بحث بالاسم أو الباركود...' : 'Rechercher par nom ou code-barres...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={() => { setSearch(''); setCategoryFilter(''); }} className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs text-gray-400 hidden sm:inline">{filtered.length} {locale === 'ar' ? 'منتج' : 'produits'}</span>
        </div>

        {showFilters && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                {locale === 'ar' ? 'الفئة' : 'Catégorie'}
              </label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="select w-full sm:w-64">
                <option value="">{locale === 'ar' ? 'كل الفئات' : 'Toutes les catégories'}</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Data Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="spinner w-8 h-8"></div></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CubeIcon className="w-12 h-12 mb-3" />
            <p className="text-lg font-semibold">{locale === 'ar' ? 'لا توجد بيانات' : 'Aucune donnée'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-start text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-4">#</th>
                  <th className="text-start text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-4 cursor-pointer" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">{locale === 'ar' ? 'المنتج' : 'Produit'} <SortIcon col="name" /></span>
                  </th>
                  <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-3 cursor-pointer" onClick={() => handleSort('total_quantity')}>
                    <span className="flex items-center justify-center gap-1">{locale === 'ar' ? 'الكمية' : 'Qté'} <SortIcon col="total_quantity" /></span>
                  </th>
                  <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-3 cursor-pointer" onClick={() => handleSort('total_revenue')}>
                    <span className="flex items-center justify-center gap-1">{locale === 'ar' ? 'الإيرادات' : 'Revenus'} <SortIcon col="total_revenue" /></span>
                  </th>
                  <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-3 cursor-pointer" onClick={() => handleSort('total_cost')}>
                    <span className="flex items-center justify-center gap-1">{locale === 'ar' ? 'التكلفة' : 'Coûts'} <SortIcon col="total_cost" /></span>
                  </th>
                  <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-3 cursor-pointer" onClick={() => handleSort('profit')}>
                    <span className="flex items-center justify-center gap-1">{locale === 'ar' ? 'الربح' : 'Profit'} <SortIcon col="profit" /></span>
                  </th>
                  <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-3 px-3 cursor-pointer" onClick={() => handleSort('margin')}>
                    <span className="flex items-center justify-center gap-1">{locale === 'ar' ? 'الهامش' : 'Marge'} <SortIcon col="margin" /></span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filtered.map((p, i) => {
                  const revenue = n(p.total_revenue);
                  const cost = n(p.total_cost);
                  const profit = n(p.profit);
                  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                  const isNegative = profit < 0;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="py-3 px-4 text-xs text-gray-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {p.barcode && <span className="text-[10px] text-gray-400 font-mono">{p.barcode}</span>}
                          {p.category_name && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{p.category_name}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300">{n(p.total_quantity)}</td>
                      <td className="py-3 px-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(revenue)}</td>
                      <td className="py-3 px-3 text-center text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(cost)}</td>
                      <td className={`py-3 px-3 text-center text-sm font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {formatCurrency(profit)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                          margin >= 30 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                          margin >= 15 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                          margin >= 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-900/30 border-t-2 border-gray-200 dark:border-gray-600">
                  <td colSpan={2} className="py-3 px-4 text-sm font-bold text-gray-700 dark:text-gray-300">
                    {locale === 'ar' ? 'المجموع' : 'Total'} ({filtered.length})
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-black text-gray-900 dark:text-white">
                    {filtered.reduce((s, p) => s + n(p.total_quantity), 0)}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-black text-blue-600 dark:text-blue-400">
                    {formatCurrency(filtered.reduce((s, p) => s + n(p.total_revenue), 0))}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-black text-amber-600 dark:text-amber-400">
                    {formatCurrency(filtered.reduce((s, p) => s + n(p.total_cost), 0))}
                  </td>
                  <td className={`py-3 px-3 text-center text-sm font-black ${n(totals.total_profit) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(filtered.reduce((s, p) => s + n(p.profit), 0))}
                  </td>
                  <td className="py-3 px-3 text-center text-sm font-black text-gray-700 dark:text-gray-300">
                    {totalMargin.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
