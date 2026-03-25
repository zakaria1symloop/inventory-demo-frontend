'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, usersApi, warehousesApi } from '@/lib/api';
import { useLocale, type TranslationKey } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import type { Sale } from '@/lib/types';
import {
  UsersIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
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

// ─── KPI color map ───
const colorMap: Record<string, { hover: string; hoverDark: string; bar: string; iconBg: string; iconText: string; valueText: string }> = {
  indigo: { hover: 'hover:bg-indigo-50/40', hoverDark: 'dark:hover:bg-indigo-900/10', bar: 'bg-indigo-500', iconBg: 'bg-indigo-100 dark:bg-indigo-900/30', iconText: 'text-indigo-600 dark:text-indigo-400', valueText: 'text-indigo-600 dark:text-indigo-400' },
  emerald: { hover: 'hover:bg-emerald-50/40', hoverDark: 'dark:hover:bg-emerald-900/10', bar: 'bg-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconText: 'text-emerald-600 dark:text-emerald-400', valueText: 'text-emerald-600 dark:text-emerald-400' },
  blue: { hover: 'hover:bg-blue-50/40', hoverDark: 'dark:hover:bg-blue-900/10', bar: 'bg-blue-500', iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconText: 'text-blue-600 dark:text-blue-400', valueText: 'text-blue-600 dark:text-blue-400' },
  red: { hover: 'hover:bg-red-50/40', hoverDark: 'dark:hover:bg-red-900/10', bar: 'bg-red-500', iconBg: 'bg-red-100 dark:bg-red-900/30', iconText: 'text-red-600 dark:text-red-400', valueText: 'text-red-600 dark:text-red-400' },
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
      stat.totalAmount += parseFloat(String(s.grand_total)) || 0;
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
    try {
      const ExcelJS = (await import('exceljs')).default;
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
      ws.getRow(1).eachCell((cell) => {
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
      toast.success(t('sellers.exportSuccess' as TranslationKey));
    } catch { toast.error(t('sellers.exportError' as TranslationKey)); }
  };

  const exportPDF = async () => {
    if (!sellerStats.length) { toast.error(t('sellers.noExportData' as TranslationKey)); return; }
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text(t('sellers.title' as TranslationKey), 14, 20);
      doc.setFontSize(10);
      doc.text(`${dateFrom} → ${dateTo}`, 14, 28);
      autoTable(doc, {
        startY: 35,
        head: [[t('sellers.colSeller' as TranslationKey), t('sellers.colSalesCount' as TranslationKey), t('sellers.colTotal' as TranslationKey), t('sellers.colPaid' as TranslationKey), t('sellers.colDue' as TranslationKey), t('sellers.colCollectionRate' as TranslationKey)]],
        body: sellerStats.map(s => [s.name, s.salesCount, s.totalAmount.toLocaleString(), s.paidAmount.toLocaleString(), s.dueAmount.toLocaleString(), `${s.collectionRate}%`]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [245, 158, 11] },
      });
      doc.save(`sellers_${dateFrom}_${dateTo}.pdf`);
      toast.success(t('sellers.exportSuccess' as TranslationKey));
    } catch { toast.error(t('sellers.exportError' as TranslationKey)); }
  };

  const activeFilterCount = [filterSeller, filterWarehouse].filter(Boolean).length;

  const thClass = "text-start text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3";
  const thEndClass = "text-end text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3";
  const tdClass = "px-5 py-3";

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center">
          <UsersIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('sellers.title' as TranslationKey)}</h1>
          <p className="text-sm text-gray-400 mt-1">{t('sellers.subtitle' as TranslationKey)}</p>
        </div>
      </div>

      <div className="flex gap-5">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* ─── Filter Bar ─── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 px-5 py-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('sellers.from' as TranslationKey)}</span>
                <DateInput value={dateFrom} onChange={setDateFrom} className="w-36" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('sellers.to' as TranslationKey)}</span>
                <DateInput value={dateTo} onChange={setDateTo} className="w-36" />
              </div>
              <button onClick={() => refetchSales()} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <ArrowPathIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setShowFilters(!showFilters)} className={`relative inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors ${showFilters ? 'bg-amber-500 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <FunnelIcon className="w-4 h-4" />
                {t('sellers.filters' as TranslationKey)}
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
              <div className={`flex items-center gap-2 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                <button onClick={exportExcel} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                  <ArrowDownTrayIcon className="w-4 h-4" /> Excel
                </button>
                <button onClick={exportPDF} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 transition-colors">
                  <ArrowDownTrayIcon className="w-4 h-4" /> PDF
                </button>
              </div>
            </div>
          </div>

          {/* ─── KPIs ─── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className={`grid grid-cols-2 md:grid-cols-4 md:divide-x ${isRTL ? 'md:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
              {[
                { label: t('sellers.kpiActiveSellers' as TranslationKey), value: kpis.activeSellers.toString(), color: 'indigo', icon: <UsersIcon className="w-5 h-5" /> },
                { label: t('sellers.kpiTotalSales' as TranslationKey), value: kpis.totalSales.toString(), color: 'emerald', icon: <ClipboardDocumentListIcon className="w-5 h-5" /> },
                { label: t('sellers.kpiTotalPaid' as TranslationKey), value: formatCurrency(kpis.totalPaid), color: 'blue', icon: <CheckCircleIcon className="w-5 h-5" /> },
                { label: t('sellers.kpiTotalDue' as TranslationKey), value: formatCurrency(kpis.totalDue), color: 'red', icon: <ExclamationCircleIcon className="w-5 h-5" /> },
              ].map((kpi, i) => {
                const c = colorMap[kpi.color];
                return (
                  <div key={i} className={`group relative p-5 ${c.hover} ${c.hoverDark} transition-colors duration-200`}>
                    <div className={`absolute top-0 inset-x-0 h-[3px] ${c.bar} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b`} />
                    <div className="text-center">
                      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${c.iconBg} ${c.iconText} mb-2.5`}>{kpi.icon}</div>
                      <div className={`text-xl font-black ${c.valueText} tabular-nums leading-none`}>
                        {isLoading ? <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" /> : kpi.value}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-400 mt-2">{kpi.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Charts ─── */}
          {!isLoading && (topSellersData.length > 0 || dailyData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">{t('sellers.chartTopSellers' as TranslationKey)}</h3>
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">{t('sellers.chartDailyTrend' as TranslationKey)}</h3>
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('sellers.tableTitle' as TranslationKey)}</h3>
              <span className="text-xs text-gray-400 tabular-nums">{sellerStats.length} {t('sellers.entries' as TranslationKey)}</span>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-[3px] border-amber-200 dark:border-amber-800 border-t-amber-500 rounded-full animate-spin" />
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
                          <td className={tdClass}><span className="text-sm font-bold text-amber-600 dark:text-amber-400">{s.name}</span></td>
                          <td className={`${tdClass} text-end`}><span className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">{s.salesCount}</span></td>
                          <td className={`${tdClass} text-end`}><span className="text-sm font-bold text-gray-800 dark:text-gray-100 tabular-nums">{formatCurrency(s.totalAmount)}</span></td>
                          <td className={`${tdClass} text-end`}><span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(s.paidAmount)}</span></td>
                          <td className={`${tdClass} text-end`}><span className={`text-sm font-medium tabular-nums ${s.dueAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>{formatCurrency(s.dueAmount)}</span></td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-2.5">
                              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${s.collectionRate >= 80 ? 'bg-emerald-500' : s.collectionRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(100, s.collectionRate)}%` }}
                                />
                              </div>
                              <span className={`text-xs font-bold tabular-nums min-w-[36px] text-end ${s.collectionRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : s.collectionRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
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
                  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {t('sellers.pageInfo' as TranslationKey, { current: String(page), total: String(totalPages), count: String(sellerStats.length) })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                        <PrevChevron className="w-3.5 h-3.5" /> {t('sellers.prev' as TranslationKey)}
                      </button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
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
          <div className="w-72 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5 sticky top-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4" />
                  {t('sellers.filters' as TranslationKey)}
                </h3>
                <button onClick={() => setShowFilters(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('sellers.colSeller' as TranslationKey)}</label>
                <input type="text" value={filterSeller} onChange={(e) => { setFilterSeller(e.target.value); setPage(1); }} placeholder={t('sellers.filterSearchSeller' as TranslationKey)} className="input w-full text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('sellers.filterWarehouse' as TranslationKey)}</label>
                <select value={filterWarehouse} onChange={(e) => { setFilterWarehouse(e.target.value); setPage(1); }} className="input w-full text-sm">
                  <option value="">{t('sellers.filterAll' as TranslationKey)}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={String(w.id)}>{w.name}</option>
                  ))}
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button onClick={() => { setFilterSeller(''); setFilterWarehouse(''); setPage(1); }} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
