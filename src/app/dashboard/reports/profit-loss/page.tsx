'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, purchasesApi, saleReturnsApi, purchaseReturnsApi, dispensesApi, warehousesApi, caissesApi } from '@/lib/api';
import { useLocale, type TranslationKey } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

// ─── Types ───
interface Sale {
  id: number;
  grand_total: number | string;
  paid_amount: number | string;
  warehouse_id: number;
  items?: Array<{ quantity: number; product?: { cost_price: number | string } }>;
}

interface Purchase {
  id: number;
  grand_total: number | string;
  paid_amount: number | string;
  warehouse_id: number;
}

interface SaleReturn {
  id: number;
  total_amount: number | string;
  warehouse_id?: number;
  sale?: { warehouse_id?: number };
}

interface PurchaseReturn {
  id: number;
  total_amount: number | string;
  warehouse_id?: number;
  purchase?: { warehouse_id?: number };
}

interface Expense {
  id: number;
  amount: number | string;
  total_amount?: number | string;
}

interface Warehouse {
  id: number;
  name: string;
}

const colorToDot: Record<string, string> = {
  emerald: 'metric-dot-green',
  blue: 'metric-dot-blue',
  amber: 'metric-dot-orange',
  violet: 'metric-dot-violet',
};

const today = () => new Date().toISOString().split('T')[0];
const thirtyDaysAgo = () => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

const num = (v: unknown): number => parseFloat(String(v)) || 0;

export default function ProfitLossReportPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  // ─── State ───
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [filterWarehouse, setFilterWarehouse] = useState('');

  // ─── Formatters ───
  const formatCurrency = useCallback((value: number) => {
    if (!isFinite(value)) return '0';
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency', currency: 'DZD', minimumFractionDigits: 0,
    }).format(value);
  }, [locale]);

  // ─── Queries (all fire simultaneously) ───
  const queryParams = useMemo(() => {
    const p: Record<string, unknown> = { per_page: 10000 };
    if (dateFrom) p.from_date = dateFrom;
    if (dateTo) p.to_date = dateTo;
    return p;
  }, [dateFrom, dateTo]);

  const { data: salesRaw, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['pnl-sales', dateFrom, dateTo],
    queryFn: async () => { const res = await salesApi.getAll(queryParams); return res.data; },
  });

  const { data: purchasesRaw, isLoading: purchasesLoading, refetch: refetchPurchases } = useQuery({
    queryKey: ['pnl-purchases', dateFrom, dateTo],
    queryFn: async () => { const res = await purchasesApi.getAll(queryParams); return res.data; },
  });

  const { data: saleReturnsRaw, isLoading: srLoading, refetch: refetchSR } = useQuery({
    queryKey: ['pnl-sale-returns', dateFrom, dateTo],
    queryFn: async () => { const res = await saleReturnsApi.getAll(queryParams); return res.data; },
  });

  const { data: purchaseReturnsRaw, isLoading: prLoading, refetch: refetchPR } = useQuery({
    queryKey: ['pnl-purchase-returns', dateFrom, dateTo],
    queryFn: async () => { const res = await purchaseReturnsApi.getAll(queryParams); return res.data; },
  });

  const { data: expensesRaw, isLoading: expLoading, refetch: refetchExp } = useQuery({
    queryKey: ['pnl-expenses', dateFrom, dateTo],
    queryFn: async () => { const res = await dispensesApi.getAll(queryParams); return res.data; },
  });

  const { data: warehousesRaw } = useQuery({
    queryKey: ['pnl-warehouses'],
    queryFn: async () => { const res = await warehousesApi.getAll(); return res.data; },
  });

  // Real cash movements from the caisse module — keeps the P&L page in sync with /dashboard/caisses
  const { data: caisseSummary } = useQuery({
    queryKey: ['pnl-caisse-period', dateFrom, dateTo],
    queryFn: async () => {
      const res = await caissesApi.getPeriodSummary({ from_date: dateFrom, to_date: dateTo });
      return res.data as { total_in: number; total_out: number; net: number };
    },
  });

  const warehouses: Warehouse[] = warehousesRaw?.data || warehousesRaw || [];
  const isLoading = salesLoading || purchasesLoading || srLoading || prLoading || expLoading;

  // ─── Filtered data by warehouse ───
  const sales: Sale[] = useMemo(() => {
    const all: Sale[] = salesRaw?.data || [];
    if (!filterWarehouse) return all;
    return all.filter(s => String(s.warehouse_id) === filterWarehouse);
  }, [salesRaw, filterWarehouse]);

  const purchases: Purchase[] = useMemo(() => {
    const all: Purchase[] = purchasesRaw?.data || [];
    if (!filterWarehouse) return all;
    return all.filter(p => String(p.warehouse_id) === filterWarehouse);
  }, [purchasesRaw, filterWarehouse]);

  const saleReturns: SaleReturn[] = useMemo(() => {
    const all: SaleReturn[] = saleReturnsRaw?.data || [];
    if (!filterWarehouse) return all;
    return all.filter(r => String(r.warehouse_id || r.sale?.warehouse_id) === filterWarehouse);
  }, [saleReturnsRaw, filterWarehouse]);

  const purchaseReturns: PurchaseReturn[] = useMemo(() => {
    const all: PurchaseReturn[] = purchaseReturnsRaw?.data || [];
    if (!filterWarehouse) return all;
    return all.filter(r => String(r.warehouse_id || r.purchase?.warehouse_id) === filterWarehouse);
  }, [purchaseReturnsRaw, filterWarehouse]);

  const expenses: Expense[] = useMemo(() => {
    return expensesRaw?.data || [];
  }, [expensesRaw]);

  // ─── P&L Calculations ───
  const pnl = useMemo<{
    salesCount: number; salesTotal: number;
    purchasesCount: number; purchasesTotal: number;
    saleReturnsCount: number; saleReturnsTotal: number;
    purchaseReturnsCount: number; purchaseReturnsTotal: number;
    expensesTotal: number;
    revenue: number; cogs: number;
    paymentsReceived: number; paymentsSent: number; paymentsNet: number;
    profitFifo: number; profitAvg: number;
  }>(() => {
    const salesTotal = sales.reduce((s, sale) => s + num(sale.grand_total), 0);
    const salesPaid = sales.reduce((s, sale) => s + num(sale.paid_amount), 0);
    const purchasesTotal = purchases.reduce((s, p) => s + num(p.grand_total), 0);
    const purchasesPaid = purchases.reduce((s, p) => s + num(p.paid_amount), 0);
    const saleReturnsTotal = saleReturns.reduce((s, r) => s + num(r.total_amount), 0);
    const purchaseReturnsTotal = purchaseReturns.reduce((s, r) => s + num(r.total_amount), 0);
    const expensesTotal = expenses.reduce((s, e) => s + num(e.amount || e.total_amount), 0);

    const revenue = salesTotal - saleReturnsTotal;
    // Use real caisse cash flow when available (keeps this page in sync with /dashboard/caisses).
    // Fall back to derived totals if the period summary is still loading or unavailable
    // (e.g. when warehouse filter is set, since the caisse summary is not warehouse-scoped).
    const useCaisseCash = !filterWarehouse && caisseSummary !== undefined;
    const paymentsReceived = useCaisseCash ? num(caisseSummary?.total_in) : (salesPaid + purchaseReturnsTotal);
    const paymentsSent = useCaisseCash ? num(caisseSummary?.total_out) : (purchasesPaid + saleReturnsTotal + expensesTotal);
    const paymentsNet = paymentsReceived - paymentsSent;

    // COGS: try item-level cost, fallback to net purchases
    let itemCogs = 0;
    let hasItemCost = false;
    sales.forEach(sale => {
      if (sale.items?.length) {
        hasItemCost = true;
        sale.items.forEach(item => {
          itemCogs += (item.quantity || 0) * num(item.product?.cost_price);
        });
      }
    });

    const cogs = hasItemCost ? itemCogs : (purchasesTotal - purchaseReturnsTotal);
    const profitNet = salesTotal - cogs - expensesTotal;

    return {
      salesCount: sales.length,
      salesTotal,
      purchasesCount: purchases.length,
      purchasesTotal,
      saleReturnsCount: saleReturns.length,
      saleReturnsTotal,
      purchaseReturnsCount: purchaseReturns.length,
      purchaseReturnsTotal,
      expensesTotal,
      revenue,
      paymentsReceived,
      paymentsSent,
      paymentsNet,
      cogs,
      profitFifo: profitNet,
      profitAvg: profitNet,
    };
  }, [sales, purchases, saleReturns, purchaseReturns, expenses, caisseSummary, filterWarehouse]);

  // ─── Chart data ───
  const chartData = useMemo(() => [
    { name: t('profitLoss.chartRevenue' as TranslationKey), value: pnl.revenue, fill: '#10b981' },
    { name: t('profitLoss.chartCogs' as TranslationKey), value: pnl.cogs, fill: '#3b82f6' },
    { name: t('profitLoss.chartExpenses' as TranslationKey), value: pnl.expensesTotal, fill: '#f59e0b' },
    { name: t('profitLoss.chartProfit' as TranslationKey), value: pnl.profitFifo, fill: pnl.profitFifo >= 0 ? '#10b981' : '#ef4444' },
  ], [pnl, t]);

  // ─── Tooltip ───
  const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: { fill: string } }> }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
      <div className="bg-gray-900 dark:bg-gray-700 text-white px-3.5 py-2.5 rounded-lg text-xs shadow-lg border border-gray-700 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.payload.fill }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-bold tabular-nums">{formatCurrency(p.value)}</span>
        </div>
      </div>
    );
  };

  // ─── Refresh all ───
  const refetchAll = () => {
    refetchSales(); refetchPurchases(); refetchSR(); refetchPR(); refetchExp();
  };

  // ─── Export Excel ───
  const exportExcel = async () => {
    if (isLoading) { toast.error(t('profitLoss.noExportData' as TranslationKey)); return; }
    const loadingToast = toast.loading(t('profitLoss.exporting' as TranslationKey) || 'Generating Excel…');
    try {
      await new Promise(r => setTimeout(r, 0));
      const exceljsMod: any = await import('exceljs');
      const ExcelJS = exceljsMod.default || exceljsMod;
      const { saveAs } = await import('file-saver');
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(t('profitLoss.title' as TranslationKey));
      ws.columns = [
        { header: '', key: 'label', width: 40 },
        { header: '', key: 'count', width: 12 },
        { header: '', key: 'value', width: 22 },
      ];

      const sectionRow = (label: string) => {
        const r = ws.addRow({ label });
        r.getCell(1).font = { bold: true, size: 12 };
        r.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        r.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        r.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
      };

      const dataRow = (label: string, count: number | null, value: number) => {
        ws.addRow({ label, count: count !== null ? `(${count})` : '', value });
      };

      sectionRow(t('profitLoss.title' as TranslationKey));
      dataRow(t('profitLoss.sales' as TranslationKey), pnl.salesCount, pnl.salesTotal);
      dataRow(t('profitLoss.purchases' as TranslationKey), pnl.purchasesCount, pnl.purchasesTotal);
      dataRow(t('profitLoss.salesReturn' as TranslationKey), pnl.saleReturnsCount, pnl.saleReturnsTotal);
      dataRow(t('profitLoss.purchasesReturn' as TranslationKey), pnl.purchaseReturnsCount, pnl.purchaseReturnsTotal);
      ws.addRow({});

      sectionRow(t('profitLoss.summaryTitle' as TranslationKey));
      dataRow(t('profitLoss.revenue' as TranslationKey), null, pnl.revenue);
      dataRow(t('profitLoss.paymentsReceived' as TranslationKey), null, pnl.paymentsReceived);
      dataRow(t('profitLoss.paymentsSent' as TranslationKey), null, pnl.paymentsSent);
      dataRow(t('profitLoss.expenses' as TranslationKey), null, pnl.expensesTotal);
      dataRow(t('profitLoss.paymentsNet' as TranslationKey), null, pnl.paymentsNet);
      ws.addRow({});

      sectionRow(t('profitLoss.profitSection' as TranslationKey));
      dataRow(t('profitLoss.profitFifo' as TranslationKey), null, pnl.profitFifo);
      dataRow(t('profitLoss.profitAvg' as TranslationKey), null, pnl.profitAvg);

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `profit-loss_${dateFrom}_${dateTo}.xlsx`);
      toast.success(t('profitLoss.exportSuccess' as TranslationKey), { id: loadingToast });
    } catch (err) { console.error('Export failed:', err); toast.error((err instanceof Error ? err.message : '') || t('profitLoss.exportError' as TranslationKey), { id: loadingToast }); }
  };

  // ─── Export PDF ───
  const exportPDF = async () => {
    if (isLoading) { toast.error(t('profitLoss.noExportData' as TranslationKey)); return; }
    try {
      const { printReport } = await import('@/lib/print-report');
      printReport({
        title: t('profitLoss.title' as TranslationKey),
        subtitle: `${dateFrom} → ${dateTo}`,
        columns: [t('profitLoss.label' as TranslationKey) || ' ', '#', t('profitLoss.amount' as TranslationKey) || ' '],
        rows: [
          [t('profitLoss.sales' as TranslationKey), `(${pnl.salesCount})`, pnl.salesTotal.toLocaleString()],
          [t('profitLoss.purchases' as TranslationKey), `(${pnl.purchasesCount})`, pnl.purchasesTotal.toLocaleString()],
          [t('profitLoss.salesReturn' as TranslationKey), `(${pnl.saleReturnsCount})`, pnl.saleReturnsTotal.toLocaleString()],
          [t('profitLoss.purchasesReturn' as TranslationKey), `(${pnl.purchaseReturnsCount})`, pnl.purchaseReturnsTotal.toLocaleString()],
          [t('profitLoss.revenue' as TranslationKey), '', pnl.revenue.toLocaleString()],
          [t('profitLoss.paymentsReceived' as TranslationKey), '', pnl.paymentsReceived.toLocaleString()],
          [t('profitLoss.paymentsSent' as TranslationKey), '', pnl.paymentsSent.toLocaleString()],
          [t('profitLoss.expenses' as TranslationKey), '', pnl.expensesTotal.toLocaleString()],
          [t('profitLoss.paymentsNet' as TranslationKey), '', pnl.paymentsNet.toLocaleString()],
          [t('profitLoss.profitFifo' as TranslationKey), '', pnl.profitFifo.toLocaleString()],
          [t('profitLoss.profitAvg' as TranslationKey), '', pnl.profitAvg.toLocaleString()],
        ],
        orientation: 'portrait',
        dir: isRTL ? 'rtl' : 'ltr',
      });
      toast.success(t('profitLoss.exportSuccess' as TranslationKey));
    } catch (err) { console.error('Export failed:', err); toast.error((err instanceof Error ? err.message : '') || t('profitLoss.exportError' as TranslationKey)); }
  };

  // ─── Skeleton for loading ───
  const Skeleton = () => (
    <div className="w-24 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
  );

  // ─── Financial row component ───
  const FinancialRow = ({ label, desc, value, dotColor, bold }: {
    label: string; desc?: string; value: number; dotColor: string; bold?: boolean;
  }) => {
    const isNeg = value < 0;
    const dotClass = dotColor === 'dynamic'
      ? (isNeg ? 'metric-dot-red' : 'metric-dot-green')
      : (colorToDot[dotColor] || 'metric-dot-neutral');

    return (
      <div className="flex items-start justify-between py-3 gap-4">
        <div className="flex items-start gap-2.5 min-w-0">
          <span className={`metric-dot ${dotClass} mt-1.5 shrink-0`} aria-hidden />
          <div className="min-w-0">
            <p className={`text-[13px] ${bold ? 'font-semibold' : 'font-medium'} text-gray-800 dark:text-gray-100`}>{label}</p>
            {desc && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>}
          </div>
        </div>
        <span className={`${bold ? 'text-[16px] font-semibold' : 'text-[15px] font-medium'} tnum whitespace-nowrap text-gray-900 dark:text-gray-100`}>
          {isLoading ? <Skeleton /> : formatCurrency(value)}
        </span>
      </div>
    );
  };

  const dateRangeLabel = `${dateFrom} → ${dateTo}`;

  const kpiItems: { label: string; count: number; value: string; color: string }[] = [
    { label: t('profitLoss.sales' as TranslationKey), count: pnl.salesCount, value: formatCurrency(pnl.salesTotal), color: 'emerald' },
    { label: t('profitLoss.purchases' as TranslationKey), count: pnl.purchasesCount, value: formatCurrency(pnl.purchasesTotal), color: 'blue' },
    { label: t('profitLoss.salesReturn' as TranslationKey), count: pnl.saleReturnsCount, value: formatCurrency(pnl.saleReturnsTotal), color: 'amber' },
    { label: t('profitLoss.purchasesReturn' as TranslationKey), count: pnl.purchaseReturnsCount, value: formatCurrency(pnl.purchaseReturnsTotal), color: 'violet' },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t('profitLoss.title' as TranslationKey)} subtitle={t('profitLoss.subtitle' as TranslationKey)} tight />

      {/* ─── Filter Bar ─── */}
      <FilterBar
        trailing={
          <>
            <button onClick={refetchAll} className="inline-flex items-center gap-1.5 px-2.5 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="Refresh">
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
          <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('profitLoss.from' as TranslationKey)}</span>
          <DateInput value={dateFrom} onChange={setDateFrom} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('profitLoss.to' as TranslationKey)}</span>
          <DateInput value={dateTo} onChange={setDateTo} />
        </div>
        <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)}>
          <option value="">{t('profitLoss.filterWarehouse' as TranslationKey)}</option>
          {warehouses.map(w => (
            <option key={w.id} value={String(w.id)}>{w.name}</option>
          ))}
        </select>
      </FilterBar>

      {/* ─── KPI Cards (4 columns) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {kpiItems.map((kpi, i) => (
          <div key={i} className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className={`metric-dot ${colorToDot[kpi.color] || 'metric-dot-neutral'}`} aria-hidden />
              <p className="metric-label truncate">
                {kpi.label}
                <span className="ms-1 text-gray-400 dark:text-gray-500 normal-case font-normal tnum">({kpi.count})</span>
              </p>
            </div>
            {isLoading ? <Skeleton /> : <p className="metric-value-currency">{kpi.value}</p>}
          </div>
        ))}
      </div>

      {/* ─── Financial Statement + Chart ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

        {/* ─── Financial Summary Card (3/5) ─── */}
        <div className="lg:col-span-3 surface-pro p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200/80 dark:border-gray-700/60">
            <h3 className="surface-heading">{t('profitLoss.summaryTitle' as TranslationKey)}</h3>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 tnum">{dateRangeLabel}</span>
          </div>
          <div className="px-5 divide-y divide-gray-200/60 dark:divide-gray-700/40">
            <FinancialRow
              label={t('profitLoss.revenue' as TranslationKey)}
              desc={t('profitLoss.revenueDesc' as TranslationKey)}
              value={pnl.revenue}
              dotColor="emerald"
            />
            <FinancialRow
              label={t('profitLoss.paymentsReceived' as TranslationKey)}
              desc={t('profitLoss.paymentsReceivedDesc' as TranslationKey)}
              value={pnl.paymentsReceived}
              dotColor="blue"
            />
            <FinancialRow
              label={t('profitLoss.paymentsSent' as TranslationKey)}
              desc={t('profitLoss.paymentsSentDesc' as TranslationKey)}
              value={pnl.paymentsSent}
              dotColor="red"
            />
            <FinancialRow
              label={t('profitLoss.expenses' as TranslationKey)}
              value={pnl.expensesTotal}
              dotColor="amber"
            />
            <FinancialRow
              label={t('profitLoss.paymentsNet' as TranslationKey)}
              desc={t('profitLoss.paymentsNetDesc' as TranslationKey)}
              value={pnl.paymentsNet}
              dotColor="dynamic"
              bold
            />
          </div>
        </div>

        {/* ─── Chart (2/5) ─── */}
        <div className="lg:col-span-2 surface-pro">
          <div className="flex items-center justify-between mb-3">
            <h3 className="surface-heading">{t('profitLoss.chartTitle' as TranslationKey)}</h3>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 tnum">{dateRangeLabel}</span>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="spinner" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ─── Profit Card ─── */}
      <div className="surface-pro p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200/80 dark:border-gray-700/60">
          <h3 className="surface-heading flex items-center gap-2">
            <BanknotesIcon className="w-4 h-4" />
            {t('profitLoss.profitSection' as TranslationKey)}
          </h3>
        </div>
        <div className="px-5 divide-y divide-gray-200/60 dark:divide-gray-700/40">
          <div className="flex items-start justify-between py-4 gap-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className={`metric-dot ${pnl.profitFifo >= 0 ? 'metric-dot-green' : 'metric-dot-red'} mt-1.5 shrink-0`} aria-hidden />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                  {t('profitLoss.profitFifo' as TranslationKey)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{t('profitLoss.profitDesc' as TranslationKey)}</p>
              </div>
            </div>
            <span className="text-[18px] font-semibold tnum whitespace-nowrap text-gray-900 dark:text-gray-100">
              {isLoading ? <Skeleton /> : formatCurrency(pnl.profitFifo)}
            </span>
          </div>
          <div className="flex items-start justify-between py-4 gap-4">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className={`metric-dot ${pnl.profitAvg >= 0 ? 'metric-dot-green' : 'metric-dot-red'} mt-1.5 shrink-0`} aria-hidden />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                  {t('profitLoss.profitAvg' as TranslationKey)}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{t('profitLoss.profitDesc' as TranslationKey)}</p>
              </div>
            </div>
            <span className="text-[18px] font-semibold tnum whitespace-nowrap text-gray-900 dark:text-gray-100">
              {isLoading ? <Skeleton /> : formatCurrency(pnl.profitAvg)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
