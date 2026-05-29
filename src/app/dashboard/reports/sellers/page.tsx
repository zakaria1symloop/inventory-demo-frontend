'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, usersApi, warehousesApi } from '@/lib/api';
import { useLocale, type TranslationKey } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import type { Sale } from '@/lib/types';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

// ─── Types ───
interface SellerStats {
  userId: number;
  name: string;
  salesCount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  collectionRate: number;
}

interface Seller {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
}

// ─── Chart helpers ───
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#7c3aed', '#6d28d9', '#5b21b6', '#4f46e5', '#4338ca', '#818cf8', '#c4b5fd'];

function ChartTooltip({ active, payload, label, formatter }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; formatter: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 dark:bg-gray-700 text-white px-3.5 py-2 rounded-lg text-xs shadow-lg border border-gray-700 dark:border-gray-600">
      <p className="font-medium text-gray-300 mb-0.5">{label}</p>
      <p className="font-bold text-sm tabular-nums">{formatter(payload[0].value)}</p>
    </div>
  );
}

const colorToDot: Record<string, string> = {
  indigo: 'metric-dot-violet',
  emerald: 'metric-dot-green',
  blue: 'metric-dot-blue',
  red: 'metric-dot-red',
};

const PER_PAGE = 15;
const today = () => new Date().toISOString().split('T')[0];
const thirtyDaysAgo = () => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

export default function SellersReportPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  // ─── State ───
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSeller, setFilterSeller] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');

  // ─── Formatters ───
  const formatCurrency = useCallback((value: number) => {
    if (!isFinite(value)) return '0';
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency', currency: 'DZD', minimumFractionDigits: 0,
    }).format(value);
  }, [locale]);

  const formatShortDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      month: 'short', day: 'numeric',
    });
  }, [locale]);

  const PrevChevron = isRTL ? ChevronRightIcon : ChevronLeftIcon;
  const NextChevron = isRTL ? ChevronLeftIcon : ChevronRightIcon;

  // ─── Queries ───
  const { data: salesRaw, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['reports-sellers-sales', dateFrom, dateTo],
    queryFn: async () => {
      const params: Record<string, unknown> = { per_page: 10000 };
      if (dateFrom) params.from_date = dateFrom;
      if (dateTo) params.to_date = dateTo;
      const res = await salesApi.getAll(params);
      return res.data;
    },
  });
  const sales: Sale[] = salesRaw?.data || [];

  const { data: sellersRaw } = useQuery({
    queryKey: ['reports-sellers-list'],
    queryFn: async () => {
      const res = await usersApi.getSellers();
      return res.data;
    },
  });
  const sellersList: Seller[] = sellersRaw?.data || sellersRaw || [];

  const { data: warehousesRaw } = useQuery({
    queryKey: ['reports-sellers-warehouses'],
    queryFn: async () => {
      const res = await warehousesApi.getAll();
      return res.data;
    },
  });
  const warehouses: Warehouse[] = warehousesRaw?.data || warehousesRaw || [];

  const isLoading = salesLoading;

  // ─── Aggregation ───
  const sellerStats = useMemo(() => {
    let filteredSales = sales;
    if (filterWarehouse) filteredSales = filteredSales.filter((s: Sale & { warehouse_id?: number }) => String(s.warehouse_id) === filterWarehouse);

    const map = new Map<number, SellerStats>();
    filteredSales.forEach((s) => {
      const userId = s.user_id || s.user?.id || 0;
      const userName = s.user?.name || `#${userId}`;
      if (!map.has(userId)) {
        map.set(userId, { userId, name: userName, salesCount: 0, totalAmount: 0, paidAmount: 0, dueAmount: 0, collectionRate: 0 });
      }
      const stat = map.get(userId)!;
      stat.salesCount++;
      const returnsTotal = parseFloat(String((s as Sale & { returns_total?: number }).returns_total || 0)) || 0;
      stat.totalAmount += (parseFloat(String(s.grand_total)) || 0) - returnsTotal;
      stat.paidAmount += parseFloat(String(s.paid_amount)) || 0;
      stat.dueAmount += parseFloat(String(s.due_amount)) || 0;
    });

    const result = Array.from(map.values()).map(s => ({
      ...s,
      collectionRate: s.totalAmount > 0 ? Math.round((s.paidAmount / s.totalAmount) * 100) : 0,
    }));

    if (filterSeller) {
      return result.filter(s => s.name.toLowerCase().includes(filterSeller.toLowerCase()));
    }
    return result.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [sales, filterSeller, filterWarehouse]);

  // ─── KPIs ───
  const kpis = useMemo(() => ({
    activeSellers: sellerStats.length,
    totalSales: sellerStats.reduce((s, v) => s + v.salesCount, 0),
    totalPaid: sellerStats.reduce((s, v) => s + v.paidAmount, 0),
    totalDue: sellerStats.reduce((s, v) => s + v.dueAmount, 0),
  }), [sellerStats]);

  // ─── Charts ───
  const topSellersData = useMemo(() => {
    return sellerStats
      .map(s => ({ name: s.name.length > 14 ? s.name.slice(0, 14) + '…' : s.name, amount: s.totalAmount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [sellerStats]);

  const dailyData = useMemo(() => {
    let filteredSales = sales;
    if (filterWarehouse) filteredSales = filteredSales.filter((s: Sale & { warehouse_id?: number }) => String(s.warehouse_id) === filterWarehouse);

    const map = new Map<string, number>();
    filteredSales.forEach(s => { map.set(s.date, (map.get(s.date) || 0) + (parseFloat(String(s.grand_total)) || 0)); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date: formatShortDate(date), amount }));
  }, [sales, filterWarehouse, formatShortDate]);

  // ─── Pagination ───
  const paginated = useMemo(() => sellerStats.slice((page - 1) * PER_PAGE, page * PER_PAGE), [sellerStats, page]);
  const totalPages = Math.ceil(sellerStats.length / PER_PAGE) || 1;

  // ─── Export ───
  const exportExcel = async () => {
    if (!sellerStats.length) { toast.error(t('sellers.noExportData' as TranslationKey)); return; }
    const loadingToast = toast.loading(t('sellers.exporting' as TranslationKey) || 'Generating Excel…');
    try {
      await new Promise(r => setTimeout(r, 0));
      const exceljsMod: any = await import('exceljs');
      const ExcelJS = exceljsMod.default || exceljsMod;
      const { saveAs } = await import('file-saver');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(t('sellers.title' as TranslationKey));
      ws.columns = [
        { header: t('sellers.colSeller' as TranslationKey), key: 'seller', width: 24 },
        { header: t('sellers.colSalesCount' as TranslationKey), key: 'salesCount', width: 14 },
        { header: t('sellers.colTotal' as TranslationKey), key: 'total', width: 18 },
        { header: t('sellers.colPaid' as TranslationKey), key: 'paid', width: 18 },
        { header: t('sellers.colDue' as TranslationKey), key: 'due', width: 18 },
        { header: t('sellers.colCollectionRate' as TranslationKey), key: 'rate', width: 16 },
      ];
      ws.getRow(1).eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF59E0B' } };
        cell.alignment = { horizontal: 'center' };
      });
      sellerStats.forEach(s => ws.addRow({
        seller: s.name,
        salesCount: s.salesCount,
        total: s.totalAmount,
        paid: s.paidAmount,
        due: s.dueAmount,
        rate: `${s.collectionRate}%`,
      }));
      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `sellers_${dateFrom}_${dateTo}.xlsx`);
      toast.success(t('sellers.exportSuccess' as TranslationKey), { id: loadingToast });
    } catch (err) { console.error('Excel export failed:', err); toast.error((err instanceof Error ? err.message : '') || t('sellers.exportError' as TranslationKey), { id: loadingToast }); }
  };

  const exportPDF = async () => {
    if (!sellerStats.length) { toast.error(t('sellers.noExportData' as TranslationKey)); return; }
    try {
      const { printReport } = await import('@/lib/print-report');
      printReport({
        title: t('sellers.title' as TranslationKey),
        subtitle: `${dateFrom} → ${dateTo}`,
        columns: [t('sellers.colSeller' as TranslationKey), t('sellers.colSalesCount' as TranslationKey), t('sellers.colTotal' as TranslationKey), t('sellers.colPaid' as TranslationKey), t('sellers.colDue' as TranslationKey), t('sellers.colCollectionRate' as TranslationKey)],
        rows: sellerStats.map(s => [s.name, s.salesCount, s.totalAmount.toLocaleString(), s.paidAmount.toLocaleString(), s.dueAmount.toLocaleString(), `${s.collectionRate}%`]),
        orientation: 'landscape',
        dir: isRTL ? 'rtl' : 'ltr',
      });
      toast.success(t('sellers.exportSuccess' as TranslationKey));
    } catch (err) { console.error('Excel export failed:', err); toast.error((err instanceof Error ? err.message : '') || t('sellers.exportError' as TranslationKey)); }
  };

  const activeFilterCount = [filterSeller, filterWarehouse].filter(Boolean).length;

  const thClass = "text-start text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/60";
  const thEndClass = "text-end text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/60";
  const tdClass = "px-4 py-2 text-[13px]";

  const kpiItems: { label: string; value: string; color: string; currency?: boolean }[] = [
    { label: t('sellers.kpiActiveSellers' as TranslationKey), value: kpis.activeSellers.toString(), color: 'indigo' },
    { label: t('sellers.kpiTotalSales' as TranslationKey), value: kpis.totalSales.toString(), color: 'emerald' },
    { label: t('sellers.kpiTotalPaid' as TranslationKey), value: formatCurrency(kpis.totalPaid), color: 'blue', currency: true },
    { label: t('sellers.kpiTotalDue' as TranslationKey), value: formatCurrency(kpis.totalDue), color: 'red', currency: true },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t('sellers.title' as TranslationKey)} subtitle={t('sellers.subtitle' as TranslationKey)} tight />

      <div className="flex gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* ─── Filter Bar ─── */}
          <FilterBar
            trailing={
              <>
                <button onClick={() => refetchSales()} className="inline-flex items-center gap-1.5 px-2.5 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="Refresh">
                  <ArrowPathIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setShowFilters(!showFilters)} className={`relative inline-flex items-center gap-1.5 px-3 h-[38px] text-[12px] font-semibold rounded-md transition-colors ${showFilters ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                  <FunnelIcon className="w-4 h-4" />
                  {t('sellers.filters' as TranslationKey)}
                  {activeFilterCount > 0 && (
                    <span className="ms-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[10px] font-bold tnum">{activeFilterCount}</span>
                  )}
                </button>
                <button onClick={exportExcel} className="inline-flex items-center gap-1.5 px-3 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Excel
                </button>
                <button onClick={exportPDF} className="inline-flex items-center gap-1.5 px-3 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <ArrowDownTrayIcon className="w-4 h-4" /> PDF
                </button>
              </>
            }
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('sellers.from' as TranslationKey)}</span>
              <DateInput value={dateFrom} onChange={setDateFrom} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('sellers.to' as TranslationKey)}</span>
              <DateInput value={dateTo} onChange={setDateTo} />
            </div>
          </FilterBar>

          {/* ─── KPIs ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {kpiItems.map((kpi, i) => (
              <div key={i} className="metric-tile">
                <div className="flex items-center gap-1.5">
                  <span className={`metric-dot ${colorToDot[kpi.color] || 'metric-dot-neutral'}`} aria-hidden />
                  <p className="metric-label truncate">{kpi.label}</p>
                </div>
                {isLoading ? (
                  <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : kpi.currency ? (
                  <p className="metric-value-currency">{kpi.value}</p>
                ) : (
                  <p className="metric-value truncate">{kpi.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* ─── Charts ─── */}
          {!isLoading && (topSellersData.length > 0 || dailyData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="surface-pro">
                <h3 className="surface-heading mb-3">{t('sellers.chartTopSellers' as TranslationKey)}</h3>
                {topSellersData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topSellersData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
                      <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={22}>
                        {topSellersData.map((_, i) => (<Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('sellers.noData' as TranslationKey)}</div>
                )}
              </div>
              <div className="surface-pro">
                <h3 className="surface-heading mb-3">{t('sellers.chartDailyTrend' as TranslationKey)}</h3>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="sellersGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                      <Area type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={2.5} fill="url(#sellersGrad)"
                        dot={dailyData.length <= 31 ? { r: 3, fill: '#f59e0b', strokeWidth: 0 } : false}
                        activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('sellers.noData' as TranslationKey)}</div>
                )}
              </div>
            </div>
          )}

          {/* ─── Table ─── */}
          <div className="bg-white dark:bg-gray-900 rounded-[10px] border border-gray-200/80 dark:border-gray-700/60 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700/60 flex items-center justify-between">
              <h3 className="surface-heading">{t('sellers.tableTitle' as TranslationKey)}</h3>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">{sellerStats.length} {t('sellers.entries' as TranslationKey)}</span>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="spinner" />
              </div>
            ) : sellerStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ClipboardDocumentListIcon className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">{t('sellers.noData' as TranslationKey)}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <th className={thClass}>{t('sellers.colSeller' as TranslationKey)}</th>
                        <th className={thEndClass}>{t('sellers.colSalesCount' as TranslationKey)}</th>
                        <th className={thEndClass}>{t('sellers.colTotal' as TranslationKey)}</th>
                        <th className={thEndClass}>{t('sellers.colPaid' as TranslationKey)}</th>
                        <th className={thEndClass}>{t('sellers.colDue' as TranslationKey)}</th>
                        <th className={thClass}>{t('sellers.colCollectionRate' as TranslationKey)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {paginated.map((s) => (
                        <tr key={s.userId} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className={tdClass}><span className="font-semibold text-gray-800 dark:text-gray-100">{s.name}</span></td>
                          <td className={`${tdClass} text-end`}><span className="font-medium text-gray-700 dark:text-gray-300 tnum">{s.salesCount}</span></td>
                          <td className={`${tdClass} text-end`}><span className="font-semibold text-gray-800 dark:text-gray-100 tnum">{formatCurrency(s.totalAmount)}</span></td>
                          <td className={`${tdClass} text-end`}><span className="font-medium text-gray-700 dark:text-gray-300 tnum">{formatCurrency(s.paidAmount)}</span></td>
                          <td className={`${tdClass} text-end`}><span className={`font-medium tnum ${s.dueAmount > 0 ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>{formatCurrency(s.dueAmount)}</span></td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${s.collectionRate >= 80 ? 'bg-emerald-500' : s.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(100, s.collectionRate)}%` }}
                                />
                              </div>
                              <span className="text-[12px] font-semibold tnum min-w-[36px] text-end text-gray-700 dark:text-gray-300">
                                {s.collectionRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200/80 dark:border-gray-700/60">
                    <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">
                      {t('sellers.pageInfo' as TranslationKey, { current: String(page), total: String(totalPages), count: String(sellerStats.length) })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                        <PrevChevron className="w-3.5 h-3.5" /> {t('sellers.prev' as TranslationKey)}
                      </button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                        {t('sellers.next' as TranslationKey)} <NextChevron className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── Filter Panel ─── */}
        {showFilters && (
          <div className="w-64 shrink-0">
            <div className="surface-pro sticky top-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="surface-heading flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4" />
                  {t('sellers.filters' as TranslationKey)}
                </h3>
                <button onClick={() => setShowFilters(false)} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-400 mb-1">{t('sellers.colSeller' as TranslationKey)}</label>
                <input type="text" value={filterSeller} onChange={(e) => { setFilterSeller(e.target.value); setPage(1); }} placeholder={t('sellers.filterSearchSeller' as TranslationKey)} className="input w-full text-[13px]" />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-gray-600 dark:text-gray-400 mb-1">{t('sellers.filterWarehouse' as TranslationKey)}</label>
                <select value={filterWarehouse} onChange={(e) => { setFilterWarehouse(e.target.value); setPage(1); }} className="input w-full text-[13px]">
                  <option value="">{t('sellers.filterAll' as TranslationKey)}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={String(w.id)}>{w.name}</option>
                  ))}
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button onClick={() => { setFilterSeller(''); setFilterWarehouse(''); setPage(1); }} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <XMarkIcon className="w-3.5 h-3.5" />
                  {t('sellers.clearFilters' as TranslationKey)}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
