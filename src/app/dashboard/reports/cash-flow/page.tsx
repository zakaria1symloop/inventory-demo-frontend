'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { caissesApi, warehousesApi } from '@/lib/api';
import { useLocale, type TranslationKey } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  BarChart, Bar, AreaChart, Area, Legend,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ───
interface CaisseItem {
  id: number;
  name: string;
  balance: number | string;
  type?: string;
  is_active?: boolean;
  user_id?: number;
  user?: { id: number; name: string };
}

interface CaisseSummary {
  total_balance: number;
  total_caisses?: number;
  today?: { total_in: number; total_out: number };
  caisses: CaisseItem[];
}

interface CaisseFlowTotals {
  total_in: number;
  total_out: number;
  net: number;
}

interface CaisseTransaction {
  id: number;
  type: 'in' | 'out';
  amount: number | string;
  created_at: string;
}

interface CaisseFlowRow {
  name: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface DailyFlowPoint {
  date: string;
  dateRaw: string;
  inflow: number;
  outflow: number;
  net: number;
}

interface Warehouse {
  id: number;
  name: string;
}

const colorToDot: Record<string, string> = {
  emerald: 'metric-dot-green',
  red: 'metric-dot-red',
  blue: 'metric-dot-blue',
};

const PER_PAGE = 15;
const today = () => new Date().toISOString().split('T')[0];
const thirtyDaysAgo = () => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

export default function CashFlowReportPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  // ─── State ───
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [page, setPage] = useState(1);
  const [filterAccount, setFilterAccount] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');
  const [flowData, setFlowData] = useState<Record<number, CaisseFlowTotals>>({});
  const [dailyTransactions, setDailyTransactions] = useState<CaisseTransaction[]>([]);
  const [flowLoading, setFlowLoading] = useState(false);

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
  const { data: summaryRaw, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['reports-cashflow-summary'],
    queryFn: async () => {
      const res = await caissesApi.getSummary();
      return res.data;
    },
  });
  const summary: CaisseSummary = summaryRaw?.data || summaryRaw || { total_balance: 0, caisses: [] };

  const { data: warehousesRaw } = useQuery({
    queryKey: ['reports-cashflow-warehouses'],
    queryFn: async () => {
      const res = await warehousesApi.getAll();
      return res.data;
    },
  });
  const warehouses: Warehouse[] = warehousesRaw?.data || warehousesRaw || [];

  // ─── Fetch per-caisse inflow/outflow + transactions for date range ───
  const fetchFlowData = useCallback(async () => {
    const caissesArr = summary.caisses || [];
    if (!caissesArr.length) return;
    setFlowLoading(true);
    try {
      const results = await Promise.all(
        caissesArr.map(async (c) => {
          try {
            const params: Record<string, unknown> = { per_page: 10000 };
            if (dateFrom) params.from_date = dateFrom;
            if (dateTo) params.to_date = dateTo;
            const res = await caissesApi.getTransactions(c.id, params);
            const totals: CaisseFlowTotals = res.data?.totals || { total_in: 0, total_out: 0, net: 0 };
            const txs: CaisseTransaction[] = res.data?.data || [];
            return { id: c.id, totals, txs };
          } catch {
            return { id: c.id, totals: { total_in: 0, total_out: 0, net: 0 }, txs: [] };
          }
        })
      );
      const map: Record<number, CaisseFlowTotals> = {};
      const allTxs: CaisseTransaction[] = [];
      results.forEach(r => {
        map[r.id] = r.totals;
        allTxs.push(...r.txs);
      });
      setFlowData(map);
      setDailyTransactions(allTxs);
    } catch {
      // silent
    } finally {
      setFlowLoading(false);
    }
  }, [summary.caisses, dateFrom, dateTo]);

  useEffect(() => {
    if (summary.caisses?.length) {
      fetchFlowData();
    }
  }, [summary.caisses, dateFrom, dateTo, fetchFlowData]);

  const isLoading = summaryLoading;

  // ─── Filtered caisses ───
  const filteredCaisses = useMemo(() => {
    let list = summary.caisses || [];
    if (filterAccount) list = list.filter(c => String(c.id) === filterAccount);
    return list;
  }, [summary.caisses, filterAccount]);

  // ─── Build grouped rows: per caisse → inflow / outflow / net ───
  const groupedRows: CaisseFlowRow[] = useMemo(() => {
    return filteredCaisses.map(c => {
      const flow = flowData[c.id];
      return {
        name: c.name || c.user?.name || `#${c.id}`,
        inflow: parseFloat(String(flow?.total_in)) || 0,
        outflow: parseFloat(String(flow?.total_out)) || 0,
        net: parseFloat(String(flow?.net)) || 0,
      };
    }).sort((a, b) => (b.inflow + b.outflow) - (a.inflow + a.outflow));
  }, [filteredCaisses, flowData]);

  // ─── KPIs ───
  const kpis = useMemo(() => {
    const totalIn = groupedRows.reduce((s, r) => s + r.inflow, 0);
    const totalOut = groupedRows.reduce((s, r) => s + r.outflow, 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [groupedRows]);

  // ─── Daily trend from transactions ───
  const dailyFlowData: DailyFlowPoint[] = useMemo(() => {
    const filteredIds = new Set(filteredCaisses.map(c => c.id));
    // Filter transactions to only relevant caisses
    const relevantTxs = dailyTransactions.filter(tx => {
      // If we can't determine caisse, include it
      return true;
    });

    const map = new Map<string, { inflow: number; outflow: number }>();
    relevantTxs.forEach(tx => {
      const dateStr = (tx.created_at || '').split('T')[0].split(' ')[0];
      if (!dateStr) return;
      if (!map.has(dateStr)) map.set(dateStr, { inflow: 0, outflow: 0 });
      const entry = map.get(dateStr)!;
      const amount = parseFloat(String(tx.amount)) || 0;
      if (tx.type === 'in') entry.inflow += amount;
      else if (tx.type === 'out') entry.outflow += amount;
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateStr, vals]) => ({
        dateRaw: dateStr,
        date: formatShortDate(dateStr),
        inflow: vals.inflow,
        outflow: vals.outflow,
        net: vals.inflow - vals.outflow,
      }));
  }, [dailyTransactions, filteredCaisses, formatShortDate]);

  // ─── Chart data for grouped bar ───
  const barChartData = useMemo(() => {
    return groupedRows
      .map(r => ({
        name: r.name.length > 14 ? r.name.slice(0, 14) + '…' : r.name,
        inflow: r.inflow,
        outflow: r.outflow,
      }))
      .slice(0, 10);
  }, [groupedRows]);

  // ─── Pagination ───
  const paginated = useMemo(() => groupedRows.slice((page - 1) * PER_PAGE, page * PER_PAGE), [groupedRows, page]);
  const totalPages = Math.ceil(groupedRows.length / PER_PAGE) || 1;

  // ─── Multi-line tooltip ───
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

  // ─── Export ───
  const exportExcel = async () => {
    if (!groupedRows.length) { toast.error(t('cashFlow.noExportData' as TranslationKey)); return; }
    const loadingToast = toast.loading(t('cashFlow.exporting' as TranslationKey) || 'Generating Excel…');
    try {
      await new Promise(r => setTimeout(r, 0));
      const exceljsMod: any = await import('exceljs');
      const ExcelJS = exceljsMod.default || exceljsMod;
      const { saveAs } = await import('file-saver');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(t('cashFlow.title' as TranslationKey));
      ws.columns = [
        { header: t('cashFlow.colGroup' as TranslationKey), key: 'group', width: 28 },
        { header: t('cashFlow.colInflow' as TranslationKey), key: 'inflow', width: 20 },
        { header: t('cashFlow.colOutflow' as TranslationKey), key: 'outflow', width: 20 },
        { header: t('cashFlow.colNet' as TranslationKey), key: 'net', width: 20 },
      ];
      ws.getRow(1).eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
        cell.alignment = { horizontal: 'center' };
      });
      groupedRows.forEach(r => ws.addRow({ group: r.name, inflow: r.inflow, outflow: r.outflow, net: r.net }));
      // Totals row
      ws.addRow({ group: t('cashFlow.totalsLabel' as TranslationKey), inflow: kpis.totalIn, outflow: kpis.totalOut, net: kpis.net });
      const lastRow = ws.lastRow!;
      lastRow.eachCell((cell: any) => { cell.font = { bold: true }; });
      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `cash-flow_${dateFrom}_${dateTo}.xlsx`);
      toast.success(t('cashFlow.exportSuccess' as TranslationKey), { id: loadingToast });
    } catch (err) { console.error('Export failed:', err); toast.error((err instanceof Error ? err.message : '') || t('cashFlow.exportError' as TranslationKey), { id: loadingToast }); }
  };

  const exportPDF = async () => {
    if (!groupedRows.length) { toast.error(t('cashFlow.noExportData' as TranslationKey)); return; }
    try {
      const { printReport } = await import('@/lib/print-report');
      printReport({
        title: t('cashFlow.title' as TranslationKey),
        subtitle: `${dateFrom} → ${dateTo}`,
        columns: [t('cashFlow.colGroup' as TranslationKey), t('cashFlow.colInflow' as TranslationKey), t('cashFlow.colOutflow' as TranslationKey), t('cashFlow.colNet' as TranslationKey)],
        rows: [
          ...groupedRows.map(r => [r.name, r.inflow.toLocaleString(), r.outflow.toLocaleString(), r.net.toLocaleString()]),
          [t('cashFlow.totalsLabel' as TranslationKey), kpis.totalIn.toLocaleString(), kpis.totalOut.toLocaleString(), kpis.net.toLocaleString()],
        ],
        orientation: 'landscape',
        dir: isRTL ? 'rtl' : 'ltr',
      });
      toast.success(t('cashFlow.exportSuccess' as TranslationKey));
    } catch (err) { console.error('Export failed:', err); toast.error((err instanceof Error ? err.message : '') || t('cashFlow.exportError' as TranslationKey)); }
  };

  const thClass = "text-start text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/60";
  const thEndClass = "text-end text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/60";
  const tdClass = "px-4 py-2 text-[13px]";

  const dateRangeLabel = `${dateFrom} → ${dateTo}`;

  const kpiItems: { label: string; value: string; color: string }[] = [
    { label: t('cashFlow.kpiTotalInflow' as TranslationKey), value: formatCurrency(kpis.totalIn), color: 'emerald' },
    { label: t('cashFlow.kpiTotalOutflow' as TranslationKey), value: formatCurrency(kpis.totalOut), color: 'red' },
    { label: t('cashFlow.kpiNetCashFlow' as TranslationKey), value: formatCurrency(kpis.net), color: 'blue' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t('cashFlow.title' as TranslationKey)} subtitle={t('cashFlow.subtitle' as TranslationKey)} tight />

      {/* ─── Filter Bar ─── */}
      <FilterBar
        trailing={
          <>
            <button onClick={() => { refetchSummary(); fetchFlowData(); }} className="inline-flex items-center gap-1.5 px-2.5 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="Refresh">
              <ArrowPathIcon className="w-4 h-4" />
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
          <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('cashFlow.from' as TranslationKey)}</span>
          <DateInput value={dateFrom} onChange={setDateFrom} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('cashFlow.to' as TranslationKey)}</span>
          <DateInput value={dateTo} onChange={setDateTo} />
        </div>
        <select value={filterAccount} onChange={(e) => { setFilterAccount(e.target.value); setPage(1); }}>
          <option value="">{t('cashFlow.filterAccount' as TranslationKey)}</option>
          {(summary.caisses || []).map(c => (
            <option key={c.id} value={String(c.id)}>{c.name || c.user?.name || `#${c.id}`}</option>
          ))}
        </select>
        <select value={filterWarehouse} onChange={(e) => { setFilterWarehouse(e.target.value); setPage(1); }}>
          <option value="">{t('cashFlow.filterWarehouse' as TranslationKey)}</option>
          {warehouses.map(w => (
            <option key={w.id} value={String(w.id)}>{w.name}</option>
          ))}
        </select>
      </FilterBar>

      {/* ─── KPIs (3 cards) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {kpiItems.map((kpi, i) => (
          <div key={i} className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className={`metric-dot ${colorToDot[kpi.color] || 'metric-dot-neutral'}`} aria-hidden />
              <p className="metric-label truncate">{kpi.label}</p>
            </div>
            {(isLoading || flowLoading) ? (
              <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ) : (
              <p className="metric-value-currency">{kpi.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* ─── Charts ─── */}
      {!isLoading && !flowLoading && (barChartData.length > 0 || dailyFlowData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* ─── Left: Grouped Bar — Inflow vs Outflow per caisse ─── */}
          <div className="surface-pro">
            <div className="flex items-center justify-between mb-3">
              <h3 className="surface-heading">{t('cashFlow.chartInflowOutflow' as TranslationKey)}</h3>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 tnum">{dateRangeLabel}</span>
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
                  <Bar dataKey="inflow" name={t('cashFlow.inflow' as TranslationKey)} fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={14} />
                  <Bar dataKey="outflow" name={t('cashFlow.outflow' as TranslationKey)} fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('cashFlow.noData' as TranslationKey)}</div>
            )}
          </div>

          {/* ─── Right: Area — Net Cash Flow Over Time ─── */}
          <div className="surface-pro">
            <div className="flex items-center justify-between mb-3">
              <h3 className="surface-heading">{t('cashFlow.chartNetOverTime' as TranslationKey)}</h3>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 tnum">{dateRangeLabel}</span>
            </div>
            {dailyFlowData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyFlowData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
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
                  <Area type="monotone" dataKey="inflow" name={t('cashFlow.inflow' as TranslationKey)} stroke="#3b82f6" strokeWidth={2} fill="url(#inflowGrad)"
                    dot={dailyFlowData.length <= 31 ? { r: 2.5, fill: '#3b82f6', strokeWidth: 0 } : false} />
                  <Area type="monotone" dataKey="outflow" name={t('cashFlow.outflow' as TranslationKey)} stroke="#10b981" strokeWidth={2} fill="url(#outflowGrad)"
                    dot={dailyFlowData.length <= 31 ? { r: 2.5, fill: '#10b981', strokeWidth: 0 } : false} />
                  <Area type="monotone" dataKey="net" name={t('cashFlow.net' as TranslationKey)} stroke="#f59e0b" strokeWidth={2} fill="none"
                    dot={dailyFlowData.length <= 31 ? { r: 2.5, fill: '#f59e0b', strokeWidth: 0 } : false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('cashFlow.noData' as TranslationKey)}</div>
            )}
          </div>
        </div>
      )}

      {/* ─── Table: Group | Inflow | Outflow | Net ─── */}
      <div className="bg-white dark:bg-gray-900 rounded-[10px] border border-gray-200/80 dark:border-gray-700/60 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700/60 flex items-center justify-between">
          <h3 className="surface-heading">{t('cashFlow.tableTitle' as TranslationKey)}</h3>
          <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">{groupedRows.length} {t('cashFlow.entries' as TranslationKey)}</span>
        </div>
        {(isLoading || flowLoading) ? (
          <div className="flex items-center justify-center py-20">
            <div className="spinner" />
          </div>
        ) : groupedRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ClipboardDocumentListIcon className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">{t('cashFlow.noData' as TranslationKey)}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                    <th className={thClass}>{t('cashFlow.colGroup' as TranslationKey)}</th>
                    <th className={thEndClass}>{t('cashFlow.colInflow' as TranslationKey)}</th>
                    <th className={thEndClass}>{t('cashFlow.colOutflow' as TranslationKey)}</th>
                    <th className={thEndClass}>{t('cashFlow.colNet' as TranslationKey)}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {paginated.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className={tdClass}><span className="font-semibold text-gray-800 dark:text-gray-100">{r.name}</span></td>
                      <td className={`${tdClass} text-end`}><span className="font-medium text-gray-700 dark:text-gray-300 tnum">{formatCurrency(r.inflow)}</span></td>
                      <td className={`${tdClass} text-end`}><span className="font-medium text-gray-700 dark:text-gray-300 tnum">{formatCurrency(r.outflow)}</span></td>
                      <td className={`${tdClass} text-end`}>
                        <span className="inline-flex items-center gap-1.5 font-semibold tnum text-gray-800 dark:text-gray-100">
                          <span className={`metric-dot ${r.net >= 0 ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                          {formatCurrency(r.net)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* ─── Totals row ─── */}
                <tfoot>
                  <tr className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40">
                    <td className={`${tdClass} font-semibold text-gray-700 dark:text-gray-200`}>{t('cashFlow.totalsLabel' as TranslationKey)}</td>
                    <td className={`${tdClass} text-end`}><span className="font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(kpis.totalIn)}</span></td>
                    <td className={`${tdClass} text-end`}><span className="font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(kpis.totalOut)}</span></td>
                    <td className={`${tdClass} text-end`}>
                      <span className="inline-flex items-center gap-1.5 font-semibold tnum text-gray-900 dark:text-white">
                        <span className={`metric-dot ${kpis.net >= 0 ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                        {formatCurrency(kpis.net)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200/80 dark:border-gray-700/60">
                <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">
                  {t('cashFlow.pageInfo' as TranslationKey, { current: String(page), total: String(totalPages), count: String(groupedRows.length) })}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                    <PrevChevron className="w-3.5 h-3.5" /> {t('cashFlow.prev' as TranslationKey)}
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                    {t('cashFlow.next' as TranslationKey)} <NextChevron className="w-3.5 h-3.5" />
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
