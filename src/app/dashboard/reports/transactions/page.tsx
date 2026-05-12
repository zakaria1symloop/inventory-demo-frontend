'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '@/lib/api';
import { useLocale, type TranslationKey } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
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
interface Payment {
  id: number;
  reference: string;
  payable_type: string;
  payable_id: number;
  amount: number | string;
  payment_method: string;
  date: string;
  user?: { id: number; name: string };
  payable?: { id: number; name?: string; reference?: string; client?: { name: string }; supplier?: { name: string } };
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
  violet: { hover: 'hover:bg-violet-50/40', hoverDark: 'dark:hover:bg-violet-900/10', bar: 'bg-violet-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconText: 'text-violet-600 dark:text-violet-400', valueText: 'text-violet-600 dark:text-violet-400' },
};

const PER_PAGE = 15;
const today = () => new Date().toISOString().split('T')[0];
const thirtyDaysAgo = () => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

export default function TransactionsReportPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  // ─── State ───
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filterRef, setFilterRef] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterType, setFilterType] = useState('');

  // ─── Formatters ───
  const formatCurrency = useCallback((value: number) => {
    if (!isFinite(value)) return '0';
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency', currency: 'DZD', minimumFractionDigits: 0,
    }).format(value);
  }, [locale]);

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }, [locale]);

  const formatShortDate = useCallback((date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      month: 'short', day: 'numeric',
    });
  }, [locale]);

  const PrevChevron = isRTL ? ChevronRightIcon : ChevronLeftIcon;
  const NextChevron = isRTL ? ChevronLeftIcon : ChevronRightIcon;

  // ─── Query ───
  const { data: paymentsRaw, isLoading, refetch } = useQuery({
    queryKey: ['reports-transactions', dateFrom, dateTo],
    queryFn: async () => {
      const params: Record<string, unknown> = { per_page: 10000 };
      if (dateFrom) params.from_date = dateFrom;
      if (dateTo) params.to_date = dateTo;
      const res = await paymentsApi.getAll(params);
      return res.data;
    },
  });
  const payments: Payment[] = paymentsRaw?.data || [];

  // ─── Filtered data ───
  const filtered = useMemo(() => {
    let list = payments;
    if (filterRef) list = list.filter(p => (p.reference || '').toLowerCase().includes(filterRef.toLowerCase()));
    if (filterMethod) list = list.filter(p => p.payment_method === filterMethod);
    if (filterType) list = list.filter(p => {
      const pType = (p.payable_type || '').toLowerCase();
      if (filterType === 'sale') return pType.includes('sale');
      if (filterType === 'purchase') return pType.includes('purchase');
      return true;
    });
    return list;
  }, [payments, filterRef, filterMethod, filterType]);

  // ─── KPIs ───
  const kpis = useMemo(() => {
    const totalAmount = filtered.reduce((s, p) => s + (parseFloat(String(p.amount)) || 0), 0);
    const cashAmount = filtered.filter(p => p.payment_method === 'cash').reduce((s, p) => s + (parseFloat(String(p.amount)) || 0), 0);
    const bankCheckAmount = filtered.filter(p => ['bank', 'check'].includes(p.payment_method)).reduce((s, p) => s + (parseFloat(String(p.amount)) || 0), 0);
    return { count: filtered.length, totalAmount, cashAmount, bankCheckAmount };
  }, [filtered]);

  // ─── Charts ───
  const entityData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(p => {
      const name = p.payable?.client?.name || p.payable?.supplier?.name || p.payable?.name || `#${p.payable_id}`;
      map.set(name, (map.get(name) || 0) + (parseFloat(String(p.amount)) || 0));
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filtered]);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(p => { map.set(p.date, (map.get(p.date) || 0) + (parseFloat(String(p.amount)) || 0)); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date: formatShortDate(date), amount }));
  }, [filtered, formatShortDate]);

  // ─── Pagination ───
  const paginated = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;

  // ─── Method badge ───
  const methodLabel = (m: string) => {
    const map: Record<string, { key: TranslationKey; bg: string; text: string }> = {
      cash: { key: 'transactions.methodCash', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300' },
      bank: { key: 'transactions.methodBank', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300' },
      check: { key: 'transactions.methodCheck', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300' },
      other: { key: 'transactions.methodOther', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300' },
    };
    const c = map[m] || map.other;
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${c.bg} ${c.text}`}>{t(c.key)}</span>;
  };

  const payableTypeLabel = (p: Payment) => {
    const pType = (p.payable_type || '').toLowerCase();
    if (pType.includes('sale')) return t('transactions.typeSale' as TranslationKey);
    if (pType.includes('purchase')) return t('transactions.typePurchase' as TranslationKey);
    return p.payable_type || '-';
  };

  const entityName = (p: Payment) => {
    return p.payable?.client?.name || p.payable?.supplier?.name || p.payable?.name || '-';
  };

  // ─── Export ───
  const exportExcel = async () => {
    if (!filtered.length) { toast.error(t('transactions.noExportData' as TranslationKey)); return; }
    const loadingToast = toast.loading(t('transactions.exporting' as TranslationKey) || 'Generating Excel…');
    try {
      // Yield to the browser so the toast renders before heavy work starts.
      await new Promise(r => setTimeout(r, 0));
      const exceljsMod: any = await import('exceljs');
      const ExcelJS = exceljsMod.default || exceljsMod;
      const { saveAs } = await import('file-saver');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(t('transactions.title' as TranslationKey));
      ws.columns = [
        { header: t('transactions.colReference' as TranslationKey), key: 'reference', width: 18 },
        { header: t('transactions.colType' as TranslationKey), key: 'type', width: 14 },
        { header: t('transactions.colEntity' as TranslationKey), key: 'entity', width: 24 },
        { header: t('transactions.colAmount' as TranslationKey), key: 'amount', width: 16 },
        { header: t('transactions.colMethod' as TranslationKey), key: 'method', width: 14 },
        { header: t('transactions.colDate' as TranslationKey), key: 'date', width: 14 },
        { header: t('transactions.colUser' as TranslationKey), key: 'user', width: 18 },
      ];
      ws.getRow(1).eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
        cell.alignment = { horizontal: 'center' };
      });
      // Add rows in chunks so the UI thread can breathe on large datasets.
      const CHUNK = 500;
      for (let i = 0; i < filtered.length; i += CHUNK) {
        filtered.slice(i, i + CHUNK).forEach(p => ws.addRow({
          reference: p.reference || '-',
          type: payableTypeLabel(p),
          entity: entityName(p),
          amount: parseFloat(String(p.amount)) || 0,
          method: p.payment_method,
          date: p.date,
          user: p.user?.name || '-',
        }));
        if (i + CHUNK < filtered.length) await new Promise(r => setTimeout(r, 0));
      }
      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `transactions_${dateFrom}_${dateTo}.xlsx`);
      toast.success(t('transactions.exportSuccess' as TranslationKey), { id: loadingToast });
    } catch (err) {
      console.error('Excel export failed:', err);
      toast.error((err instanceof Error ? err.message : '') || t('transactions.exportError' as TranslationKey), { id: loadingToast });
    }
  };

  const exportPDF = async () => {
    if (!filtered.length) { toast.error(t('transactions.noExportData' as TranslationKey)); return; }
    try {
      const { printReport } = await import('@/lib/print-report');
      printReport({
        title: t('transactions.title' as TranslationKey),
        subtitle: `${dateFrom} → ${dateTo}`,
        columns: [t('transactions.colReference' as TranslationKey), t('transactions.colType' as TranslationKey), t('transactions.colEntity' as TranslationKey), t('transactions.colAmount' as TranslationKey), t('transactions.colMethod' as TranslationKey), t('transactions.colDate' as TranslationKey), t('transactions.colUser' as TranslationKey)],
        rows: filtered.map(p => [p.reference || '-', payableTypeLabel(p), entityName(p), (parseFloat(String(p.amount)) || 0).toLocaleString(), p.payment_method, p.date, p.user?.name || '-']),
        orientation: 'landscape',
        dir: isRTL ? 'rtl' : 'ltr',
      });
      toast.success(t('transactions.exportSuccess' as TranslationKey));
    } catch { toast.error(t('transactions.exportError' as TranslationKey)); }
  };

  const activeFilterCount = [filterRef, filterMethod, filterType].filter(Boolean).length;

  const thClass = "text-start text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3";
  const thEndClass = "text-end text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3";
  const thCenterClass = "text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-5 py-3";
  const tdClass = "px-5 py-3";

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('transactions.title' as TranslationKey)}</h1>
        <p className="text-sm text-gray-400 mt-1">{t('transactions.subtitle' as TranslationKey)}</p>
      </div>

      <div className="flex gap-5">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* ─── Filter Bar ─── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 px-5 py-3.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('transactions.from' as TranslationKey)}</span>
                <DateInput value={dateFrom} onChange={setDateFrom} className="w-36" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('transactions.to' as TranslationKey)}</span>
                <DateInput value={dateTo} onChange={setDateTo} className="w-36" />
              </div>
              <button onClick={() => refetch()} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <ArrowPathIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setShowFilters(!showFilters)} className={`relative inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-colors ${showFilters ? 'bg-emerald-600 text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <FunnelIcon className="w-4 h-4" />
                {t('transactions.filters' as TranslationKey)}
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
                { label: t('transactions.kpiTotalTransactions' as TranslationKey), value: kpis.count.toString(), color: 'indigo' },
                { label: t('transactions.kpiTotalAmount' as TranslationKey), value: formatCurrency(kpis.totalAmount), color: 'emerald' },
                { label: t('transactions.kpiCashPayments' as TranslationKey), value: formatCurrency(kpis.cashAmount), color: 'blue' },
                { label: t('transactions.kpiBankCheck' as TranslationKey), value: formatCurrency(kpis.bankCheckAmount), color: 'violet' },
              ].map((kpi, i) => {
                const c = colorMap[kpi.color];
                return (
                  <div key={i} className={`group relative p-5 ${c.hover} ${c.hoverDark} transition-colors duration-200`}>
                    <div className={`absolute top-0 inset-x-0 h-[3px] ${c.bar} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b`} />
                    <div className="text-center">
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
          {!isLoading && (entityData.length > 0 || dailyData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">{t('transactions.chartTopEntities' as TranslationKey)}</h3>
                {entityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={entityData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
                      <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={22}>
                        {entityData.map((_, i) => (<Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('transactions.noData' as TranslationKey)}</div>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">{t('transactions.chartDailyTrend' as TranslationKey)}</h3>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="transGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                      <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                      <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2.5} fill="url(#transGrad)"
                        dot={dailyData.length <= 31 ? { r: 3, fill: '#10b981', strokeWidth: 0 } : false}
                        activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('transactions.noData' as TranslationKey)}</div>
                )}
              </div>
            </div>
          )}

          {/* ─── Table ─── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('transactions.tableTitle' as TranslationKey)}</h3>
              <span className="text-xs text-gray-400 tabular-nums">{filtered.length} {t('transactions.entries' as TranslationKey)}</span>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-[3px] border-emerald-200 dark:border-emerald-800 border-t-emerald-600 rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <ClipboardDocumentListIcon className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">{t('transactions.noData' as TranslationKey)}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <th className={thClass}>{t('transactions.colReference' as TranslationKey)}</th>
                        <th className={thClass}>{t('transactions.colType' as TranslationKey)}</th>
                        <th className={thClass}>{t('transactions.colEntity' as TranslationKey)}</th>
                        <th className={thEndClass}>{t('transactions.colAmount' as TranslationKey)}</th>
                        <th className={thCenterClass}>{t('transactions.colMethod' as TranslationKey)}</th>
                        <th className={thClass}>{t('transactions.colDate' as TranslationKey)}</th>
                        <th className={thClass}>{t('transactions.colUser' as TranslationKey)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {paginated.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className={tdClass}><span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{p.reference || '-'}</span></td>
                          <td className={tdClass}><span className="text-sm text-gray-600 dark:text-gray-400">{payableTypeLabel(p)}</span></td>
                          <td className={tdClass}><span className="text-sm text-gray-700 dark:text-gray-300">{entityName(p)}</span></td>
                          <td className={`${tdClass} text-end`}><span className="text-sm font-bold text-gray-800 dark:text-gray-100 tabular-nums">{formatCurrency(parseFloat(String(p.amount)) || 0)}</span></td>
                          <td className={`${tdClass} text-center`}>{methodLabel(p.payment_method)}</td>
                          <td className={tdClass}><span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(p.date)}</span></td>
                          <td className={tdClass}><span className="text-sm text-gray-600 dark:text-gray-400">{p.user?.name || '-'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400 tabular-nums">
                      {t('transactions.pageInfo' as TranslationKey, { current: String(page), total: String(totalPages), count: String(filtered.length) })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                        <PrevChevron className="w-3.5 h-3.5" /> {t('transactions.prev' as TranslationKey)}
                      </button>
                      <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
                        {t('transactions.next' as TranslationKey)} <NextChevron className="w-3.5 h-3.5" />
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
                  {t('transactions.filters' as TranslationKey)}
                </h3>
                <button onClick={() => setShowFilters(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('transactions.colReference' as TranslationKey)}</label>
                <input type="text" value={filterRef} onChange={(e) => { setFilterRef(e.target.value); setPage(1); }} placeholder={t('transactions.filterSearchRef' as TranslationKey)} className="input w-full text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('transactions.filterMethod' as TranslationKey)}</label>
                <select value={filterMethod} onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }} className="input w-full text-sm">
                  <option value="">{t('transactions.filterAll' as TranslationKey)}</option>
                  <option value="cash">{t('transactions.methodCash' as TranslationKey)}</option>
                  <option value="bank">{t('transactions.methodBank' as TranslationKey)}</option>
                  <option value="check">{t('transactions.methodCheck' as TranslationKey)}</option>
                  <option value="other">{t('transactions.methodOther' as TranslationKey)}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('transactions.filterType' as TranslationKey)}</label>
                <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }} className="input w-full text-sm">
                  <option value="">{t('transactions.filterAll' as TranslationKey)}</option>
                  <option value="sale">{t('transactions.typeSale' as TranslationKey)}</option>
                  <option value="purchase">{t('transactions.typePurchase' as TranslationKey)}</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button onClick={() => { setFilterRef(''); setFilterMethod(''); setFilterType(''); setPage(1); }} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <XMarkIcon className="w-3.5 h-3.5" />
                  {t('transactions.clearFilters' as TranslationKey)}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
