'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, saleReturnsApi, warehousesApi } from '@/lib/api';
import { useLocale, type TranslationKey } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import {
  ArrowUturnLeftIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ReceiptRefundIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ───
interface Sale {
  id: number;
  reference: string;
  grand_total: number | string;
  user_id: number;
  warehouse_id: number;
  date: string;
  user?: { id: number; name: string };
}

interface SaleReturn {
  id: number;
  reference: string;
  total_amount: number | string;
  warehouse_id: number;
  date: string;
  user?: { id: number; name: string };
  sale?: { id: number; reference: string };
}

interface Warehouse {
  id: number;
  name: string;
}

interface UserReturnRow {
  userId: number;
  userName: string;
  salesCount: number;
  salesAmount: number;
  returnsCount: number;
  returnsAmount: number;
  returnRate: number;
}

interface DailyReturnPoint {
  date: string;
  dateRaw: string;
  sales: number;
  returns: number;
}

// ─── KPI color map ───
const colorMap: Record<string, { hover: string; hoverDark: string; bar: string; iconBg: string; iconText: string; valueText: string }> = {
  emerald: { hover: 'hover:bg-emerald-50/40', hoverDark: 'dark:hover:bg-emerald-900/10', bar: 'bg-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconText: 'text-emerald-600 dark:text-emerald-400', valueText: 'text-emerald-600 dark:text-emerald-400' },
  red: { hover: 'hover:bg-red-50/40', hoverDark: 'dark:hover:bg-red-900/10', bar: 'bg-red-500', iconBg: 'bg-red-100 dark:bg-red-900/30', iconText: 'text-red-600 dark:text-red-400', valueText: 'text-red-600 dark:text-red-400' },
  amber: { hover: 'hover:bg-amber-50/40', hoverDark: 'dark:hover:bg-amber-900/10', bar: 'bg-amber-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400', valueText: 'text-amber-600 dark:text-amber-400' },
  blue: { hover: 'hover:bg-blue-50/40', hoverDark: 'dark:hover:bg-blue-900/10', bar: 'bg-blue-500', iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconText: 'text-blue-600 dark:text-blue-400', valueText: 'text-blue-600 dark:text-blue-400' },
};

const PER_PAGE = 15;
const today = () => new Date().toISOString().split('T')[0];
const thirtyDaysAgo = () => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
const num = (v: unknown): number => parseFloat(String(v)) || 0;

export default function ReturnRatioReportPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  // ─── State ───
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [page, setPage] = useState(1);

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
  const queryParams = useMemo(() => {
    const p: Record<string, unknown> = { per_page: 10000 };
    if (dateFrom) p.from_date = dateFrom;
    if (dateTo) p.to_date = dateTo;
    return p;
  }, [dateFrom, dateTo]);

  const { data: salesRaw, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['return-ratio-sales', dateFrom, dateTo],
    queryFn: async () => { const res = await salesApi.getAll(queryParams); return res.data; },
  });

  const { data: returnsRaw, isLoading: returnsLoading, refetch: refetchReturns } = useQuery({
    queryKey: ['return-ratio-returns', dateFrom, dateTo],
    queryFn: async () => { const res = await saleReturnsApi.getAll(queryParams); return res.data; },
  });

  const { data: warehousesRaw } = useQuery({
    queryKey: ['return-ratio-warehouses'],
    queryFn: async () => { const res = await warehousesApi.getAll(); return res.data; },
  });

  const warehouses: Warehouse[] = warehousesRaw?.data || warehousesRaw || [];
  const isLoading = salesLoading || returnsLoading;

  // ─── Filtered by warehouse ───
  const sales: Sale[] = useMemo(() => {
    const all: Sale[] = salesRaw?.data || [];
    if (!filterWarehouse) return all;
    return all.filter(s => String(s.warehouse_id) === filterWarehouse);
  }, [salesRaw, filterWarehouse]);

  const returns: SaleReturn[] = useMemo(() => {
    const all: SaleReturn[] = returnsRaw?.data || [];
    if (!filterWarehouse) return all;
    return all.filter(r => String(r.warehouse_id) === filterWarehouse);
  }, [returnsRaw, filterWarehouse]);

  // ─── KPIs ───
  const kpis = useMemo(() => {
    const totalSales = sales.reduce((s, sale) => s + num(sale.grand_total), 0);
    const totalReturns = returns.reduce((s, r) => s + num(r.total_amount), 0);
    const returnRate = sales.length > 0 ? (returns.length / sales.length * 100) : 0;
    return {
      salesCount: sales.length,
      totalSales,
      returnsCount: returns.length,
      totalReturns,
      returnRate,
    };
  }, [sales, returns]);

  // ─── Group by user ───
  const userRows: UserReturnRow[] = useMemo(() => {
    const noUser = t('returnRatio.noUser' as TranslationKey);
    const map = new Map<number, UserReturnRow>();

    // Aggregate sales by user
    sales.forEach(sale => {
      const uid = sale.user_id || sale.user?.id || 0;
      if (!map.has(uid)) {
        map.set(uid, {
          userId: uid,
          userName: sale.user?.name || noUser,
          salesCount: 0,
          salesAmount: 0,
          returnsCount: 0,
          returnsAmount: 0,
          returnRate: 0,
        });
      }
      const row = map.get(uid)!;
      row.salesCount++;
      row.salesAmount += num(sale.grand_total);
    });

    // Aggregate returns by user
    returns.forEach(ret => {
      const uid = ret.user?.id || 0;
      if (!map.has(uid)) {
        map.set(uid, {
          userId: uid,
          userName: ret.user?.name || noUser,
          salesCount: 0,
          salesAmount: 0,
          returnsCount: 0,
          returnsAmount: 0,
          returnRate: 0,
        });
      }
      const row = map.get(uid)!;
      row.returnsCount++;
      row.returnsAmount += num(ret.total_amount);
    });

    // Calculate return rates
    const rows = Array.from(map.values()).map(r => ({
      ...r,
      returnRate: r.salesCount > 0 ? (r.returnsCount / r.salesCount * 100) : (r.returnsCount > 0 ? 100 : 0),
    }));

    return rows.sort((a, b) => b.returnsCount - a.returnsCount);
  }, [sales, returns, t]);

  // ─── Chart: Top users by returns ───
  const barChartData = useMemo(() => {
    return userRows
      .filter(r => r.returnsCount > 0)
      .slice(0, 10)
      .map(r => ({
        name: r.userName.length > 14 ? r.userName.slice(0, 14) + '…' : r.userName,
        returns: r.returnsAmount,
        sales: r.salesAmount,
      }));
  }, [userRows]);

  // ─── Chart: Daily trend ───
  const dailyData: DailyReturnPoint[] = useMemo(() => {
    const map = new Map<string, { sales: number; returns: number }>();

    sales.forEach(s => {
      const d = (s.date || '').split('T')[0].split(' ')[0];
      if (!d) return;
      if (!map.has(d)) map.set(d, { sales: 0, returns: 0 });
      map.get(d)!.sales += num(s.grand_total);
    });

    returns.forEach(r => {
      const d = (r.date || '').split('T')[0].split(' ')[0];
      if (!d) return;
      if (!map.has(d)) map.set(d, { sales: 0, returns: 0 });
      map.get(d)!.returns += num(r.total_amount);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, vals]) => ({
        dateRaw: dateStr,
        date: formatShortDate(dateStr),
        sales: vals.sales,
        returns: vals.returns,
      }));
  }, [sales, returns, formatShortDate]);

  // ─── Pagination ───
  const paginated = useMemo(() => userRows.slice((page - 1) * PER_PAGE, page * PER_PAGE), [userRows, page]);
  const totalPages = Math.ceil(userRows.length / PER_PAGE) || 1;

  // ─── Tooltip ───
  const MultiTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-gray-900 dark:bg-gray-700 text-white px-3.5 py-2.5 rounded-lg text-xs shadow-lg border border-gray-700 dark:border-gray-600">
        <p className="font-medium text-gray-300 mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-400">{p.name}:</span>
            <span className="font-bold tabular-nums">{formatCurrency(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  // ─── Refresh ───
  const refetchAll = () => { refetchSales(); refetchReturns(); };

  // ─── Export Excel ───
  const exportExcel = async () => {
    if (!userRows.length) { toast.error(t('returnRatio.noExportData' as TranslationKey)); return; }
    try {
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(t('returnRatio.title' as TranslationKey));
      ws.columns = [
        { header: t('returnRatio.colUser' as TranslationKey), key: 'user', width: 28 },
        { header: t('returnRatio.colSalesCount' as TranslationKey), key: 'salesCount', width: 14 },
        { header: t('returnRatio.colSalesAmount' as TranslationKey), key: 'salesAmount', width: 20 },
        { header: t('returnRatio.colReturnsCount' as TranslationKey), key: 'returnsCount', width: 14 },
        { header: t('returnRatio.colReturnsAmount' as TranslationKey), key: 'returnsAmount', width: 20 },
        { header: t('returnRatio.colReturnRate' as TranslationKey), key: 'returnRate', width: 16 },
      ];
      ws.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEF4444' } };
        cell.alignment = { horizontal: 'center' };
      });
      userRows.forEach(r => ws.addRow({
        user: r.userName, salesCount: r.salesCount, salesAmount: r.salesAmount,
        returnsCount: r.returnsCount, returnsAmount: r.returnsAmount,
        returnRate: `${r.returnRate.toFixed(1)}%`,
      }));
      // Totals
      ws.addRow({
        user: t('returnRatio.totalsLabel' as TranslationKey),
        salesCount: kpis.salesCount, salesAmount: kpis.totalSales,
        returnsCount: kpis.returnsCount, returnsAmount: kpis.totalReturns,
        returnRate: `${kpis.returnRate.toFixed(1)}%`,
      });
      ws.lastRow!.eachCell(cell => { cell.font = { bold: true }; });
      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `return-ratio_${dateFrom}_${dateTo}.xlsx`);
      toast.success(t('returnRatio.exportSuccess' as TranslationKey));
    } catch { toast.error(t('returnRatio.exportError' as TranslationKey)); }
  };

  // ─── Export PDF ───
  const exportPDF = async () => {
    if (!userRows.length) { toast.error(t('returnRatio.noExportData' as TranslationKey)); return; }
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFontSize(16);
      doc.text(t('returnRatio.title' as TranslationKey), 14, 20);
      doc.setFontSize(10);
      doc.text(`${dateFrom} → ${dateTo}`, 14, 28);
      autoTable(doc, {
        startY: 35,
        head: [[
          t('returnRatio.colUser' as TranslationKey),
          t('returnRatio.colSalesCount' as TranslationKey),
          t('returnRatio.colSalesAmount' as TranslationKey),
          t('returnRatio.colReturnsCount' as TranslationKey),
          t('returnRatio.colReturnsAmount' as TranslationKey),
          t('returnRatio.colReturnRate' as TranslationKey),
        ]],
        body: [
          ...userRows.map(r => [r.userName, r.salesCount, r.salesAmount.toLocaleString(), r.returnsCount, r.returnsAmount.toLocaleString(), `${r.returnRate.toFixed(1)}%`]),
          [
            { content: t('returnRatio.totalsLabel' as TranslationKey), styles: { fontStyle: 'bold' } },
            { content: String(kpis.salesCount), styles: { fontStyle: 'bold' } },
            { content: kpis.totalSales.toLocaleString(), styles: { fontStyle: 'bold' } },
            { content: String(kpis.returnsCount), styles: { fontStyle: 'bold' } },
            { content: kpis.totalReturns.toLocaleString(), styles: { fontStyle: 'bold' } },
            { content: `${kpis.returnRate.toFixed(1)}%`, styles: { fontStyle: 'bold' } },
          ],
        ],
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [239, 68, 68] },
      });
      doc.save(`return-ratio_${dateFrom}_${dateTo}.pdf`);
      toast.success(t('returnRatio.exportSuccess' as TranslationKey));
    } catch { toast.error(t('returnRatio.exportError' as TranslationKey)); }
  };

  const Skeleton = () => <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />;

  const thClass = "text-start text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3";
  const thEndClass = "text-end text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3";
  const tdClass = "px-5 py-3.5";
  const dateRangeLabel = `${dateFrom} → ${dateTo}`;

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-600 flex items-center justify-center">
          <ArrowUturnLeftIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
            {t('returnRatio.title' as TranslationKey)}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{t('returnRatio.subtitle' as TranslationKey)}</p>
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 px-5 py-3.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('returnRatio.from' as TranslationKey)}</span>
            <DateInput value={dateFrom} onChange={setDateFrom} className="w-36" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('returnRatio.to' as TranslationKey)}</span>
            <DateInput value={dateTo} onChange={setDateTo} className="w-36" />
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('returnRatio.filterWarehouse' as TranslationKey)}</span>
            <select value={filterWarehouse} onChange={(e) => { setFilterWarehouse(e.target.value); setPage(1); }} className="input text-sm py-2 min-w-[140px]">
              <option value="">{t('returnRatio.filterAll' as TranslationKey)}</option>
              {warehouses.map(w => (
                <option key={w.id} value={String(w.id)}>{w.name}</option>
              ))}
            </select>
          </div>

          <button onClick={refetchAll} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
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
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x ${isRTL ? 'lg:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          {[
            { label: t('returnRatio.kpiTotalSales' as TranslationKey), value: formatCurrency(kpis.totalSales), sub: `(${kpis.salesCount})`, color: 'emerald', icon: <ArrowTrendingUpIcon className="w-5 h-5" /> },
            { label: t('returnRatio.kpiTotalReturns' as TranslationKey), value: formatCurrency(kpis.totalReturns), sub: `(${kpis.returnsCount})`, color: 'red', icon: <ReceiptRefundIcon className="w-5 h-5" /> },
            { label: t('returnRatio.kpiReturnRate' as TranslationKey), value: `${kpis.returnRate.toFixed(1)}%`, sub: null, color: 'amber', icon: <ChartBarIcon className="w-5 h-5" /> },
            { label: t('returnRatio.kpiReturnAmount' as TranslationKey), value: formatCurrency(kpis.totalReturns), sub: null, color: 'blue', icon: <ArrowTrendingDownIcon className="w-5 h-5" /> },
          ].map((kpi, i) => {
            const c = colorMap[kpi.color];
            return (
              <div key={i} className={`group relative p-5 ${c.hover} ${c.hoverDark} transition-colors duration-200`}>
                <div className={`absolute top-0 inset-x-0 h-[3px] ${c.bar} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b`} />
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${c.iconBg} ${c.iconText} mb-2.5`}>{kpi.icon}</div>
                  <div className={`text-xl font-black ${c.valueText} tabular-nums leading-none`}>
                    {isLoading ? <Skeleton /> : kpi.value}
                  </div>
                  <div className="text-[11px] font-semibold text-gray-400 mt-2">
                    {kpi.label}
                    {kpi.sub && <span className={`${isRTL ? 'mr-1' : 'ml-1'} text-gray-300 dark:text-gray-500`}>{kpi.sub}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Charts ─── */}
      {!isLoading && (barChartData.length > 0 || dailyData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ─── Left: Top users by return amount ─── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('returnRatio.chartTopUsers' as TranslationKey)}</h3>
              <span className="text-[10px] text-gray-400 tabular-nums">{dateRangeLabel}</span>
            </div>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
                  <Tooltip content={<MultiTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-gray-500 dark:text-gray-400">{value}</span>}
                    iconType="square"
                    iconSize={10}
                  />
                  <Bar dataKey="sales" name={t('returnRatio.salesLabel' as TranslationKey)} fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey="returns" name={t('returnRatio.returns' as TranslationKey)} fill="#ef4444" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('returnRatio.noData' as TranslationKey)}</div>
            )}
          </div>

          {/* ─── Right: Daily trend ─── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('returnRatio.chartReturnTrend' as TranslationKey)}</h3>
              <span className="text-[10px] text-gray-400 tabular-nums">{dateRangeLabel}</span>
            </div>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="returnsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip content={<MultiTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-gray-500 dark:text-gray-400">{value}</span>}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Area type="monotone" dataKey="sales" name={t('returnRatio.salesLabel' as TranslationKey)} stroke="#10b981" strokeWidth={2} fill="url(#salesGrad)"
                    dot={dailyData.length <= 31 ? { r: 2.5, fill: '#10b981', strokeWidth: 0 } : false} />
                  <Area type="monotone" dataKey="returns" name={t('returnRatio.returns' as TranslationKey)} stroke="#ef4444" strokeWidth={2} fill="url(#returnsGrad)"
                    dot={dailyData.length <= 31 ? { r: 2.5, fill: '#ef4444', strokeWidth: 0 } : false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('returnRatio.noData' as TranslationKey)}</div>
            )}
          </div>
        </div>
      )}

      {/* ─── Table: Per-user breakdown ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('returnRatio.tableTitle' as TranslationKey)}</h3>
          <span className="text-xs text-gray-400 tabular-nums">{userRows.length} {t('returnRatio.entries' as TranslationKey)}</span>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-red-200 dark:border-red-800 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : userRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ClipboardDocumentListIcon className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">{t('returnRatio.noData' as TranslationKey)}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                    <th className={thClass}>{t('returnRatio.colUser' as TranslationKey)}</th>
                    <th className={thEndClass}>{t('returnRatio.colSalesCount' as TranslationKey)}</th>
                    <th className={thEndClass}>{t('returnRatio.colSalesAmount' as TranslationKey)}</th>
                    <th className={thEndClass}>{t('returnRatio.colReturnsCount' as TranslationKey)}</th>
                    <th className={thEndClass}>{t('returnRatio.colReturnsAmount' as TranslationKey)}</th>
                    <th className={thEndClass}>{t('returnRatio.colReturnRate' as TranslationKey)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {paginated.map((r, i) => {
                    const rateColor = r.returnRate >= 20 ? 'text-red-600 dark:text-red-400' : r.returnRate >= 10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                    const barColor = r.returnRate >= 20 ? 'bg-red-500' : r.returnRate >= 10 ? 'bg-amber-500' : 'bg-emerald-500';
                    return (
                      <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className={tdClass}><span className="text-sm font-bold text-gray-700 dark:text-gray-200">{r.userName}</span></td>
                        <td className={`${tdClass} text-end`}><span className="text-sm font-medium text-gray-600 dark:text-gray-300 tabular-nums">{r.salesCount}</span></td>
                        <td className={`${tdClass} text-end`}><span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(r.salesAmount)}</span></td>
                        <td className={`${tdClass} text-end`}><span className="text-sm font-bold text-red-600 dark:text-red-400 tabular-nums">{r.returnsCount}</span></td>
                        <td className={`${tdClass} text-end`}><span className="text-sm font-medium text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(r.returnsAmount)}</span></td>
                        <td className={`${tdClass} text-end`}>
                          <div className="flex items-center gap-2 justify-end">
                            <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                              <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(r.returnRate, 100)}%` }} />
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${rateColor}`}>{r.returnRate.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* ─── Totals row ─── */}
                <tfoot>
                  <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/30">
                    <td className={`${tdClass} text-sm font-extrabold text-gray-700 dark:text-gray-200`}>{t('returnRatio.totalsLabel' as TranslationKey)}</td>
                    <td className={`${tdClass} text-end`}><span className="text-sm font-extrabold text-gray-600 dark:text-gray-300 tabular-nums">{kpis.salesCount}</span></td>
                    <td className={`${tdClass} text-end`}><span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(kpis.totalSales)}</span></td>
                    <td className={`${tdClass} text-end`}><span className="text-sm font-extrabold text-red-600 dark:text-red-400 tabular-nums">{kpis.returnsCount}</span></td>
                    <td className={`${tdClass} text-end`}><span className="text-sm font-extrabold text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(kpis.totalReturns)}</span></td>
                    <td className={`${tdClass} text-end`}><span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">{kpis.returnRate.toFixed(1)}%</span></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-400 tabular-nums">
                  {t('returnRatio.pageInfo' as TranslationKey, { current: String(page), total: String(totalPages), count: String(userRows.length) })}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                    <PrevChevron className="w-3.5 h-3.5" /> {t('returnRatio.prev' as TranslationKey)}
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                    {t('returnRatio.next' as TranslationKey)} <NextChevron className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
