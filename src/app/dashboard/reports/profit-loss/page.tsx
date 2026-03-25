'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesApi, purchasesApi, saleReturnsApi, purchaseReturnsApi, dispensesApi, warehousesApi } from '@/lib/api';
import { useLocale, type TranslationKey } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import {
  ScaleIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShoppingCartIcon,
  CubeIcon,
  ReceiptRefundIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
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

// ─── KPI color map ───
const colorMap: Record<string, { hover: string; hoverDark: string; bar: string; iconBg: string; iconText: string; valueText: string }> = {
  emerald: { hover: 'hover:bg-emerald-50/40', hoverDark: 'dark:hover:bg-emerald-900/10', bar: 'bg-emerald-500', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconText: 'text-emerald-600 dark:text-emerald-400', valueText: 'text-emerald-600 dark:text-emerald-400' },
  blue: { hover: 'hover:bg-blue-50/40', hoverDark: 'dark:hover:bg-blue-900/10', bar: 'bg-blue-500', iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconText: 'text-blue-600 dark:text-blue-400', valueText: 'text-blue-600 dark:text-blue-400' },
  amber: { hover: 'hover:bg-amber-50/40', hoverDark: 'dark:hover:bg-amber-900/10', bar: 'bg-amber-500', iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400', valueText: 'text-amber-600 dark:text-amber-400' },
  violet: { hover: 'hover:bg-violet-50/40', hoverDark: 'dark:hover:bg-violet-900/10', bar: 'bg-violet-500', iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconText: 'text-violet-600 dark:text-violet-400', valueText: 'text-violet-600 dark:text-violet-400' },
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
  const pnl = useMemo(() => {
    const salesTotal = sales.reduce((s, sale) => s + num(sale.grand_total), 0);
    const salesPaid = sales.reduce((s, sale) => s + num(sale.paid_amount), 0);
    const purchasesTotal = purchases.reduce((s, p) => s + num(p.grand_total), 0);
    const purchasesPaid = purchases.reduce((s, p) => s + num(p.paid_amount), 0);
    const saleReturnsTotal = saleReturns.reduce((s, r) => s + num(r.total_amount), 0);
    const purchaseReturnsTotal = purchaseReturns.reduce((s, r) => s + num(r.total_amount), 0);
    const expensesTotal = expenses.reduce((s, e) => s + num(e.amount || e.total_amount), 0);

    const revenue = salesTotal - saleReturnsTotal;
    const paymentsReceived = salesPaid + purchaseReturnsTotal;
    const paymentsSent = purchasesPaid + saleReturnsTotal + expensesTotal;
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
  }, [sales, purchases, saleReturns, purchaseReturns, expenses]);

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
    try {
      const ExcelJS = (await import('exceljs')).default;
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
      toast.success(t('profitLoss.exportSuccess' as TranslationKey));
    } catch { toast.error(t('profitLoss.exportError' as TranslationKey)); }
  };

  // ─── Export PDF ───
  const exportPDF = async () => {
    if (isLoading) { toast.error(t('profitLoss.noExportData' as TranslationKey)); return; }
    try {
      const { default: jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'portrait' });
      doc.setFontSize(16);
      doc.text(t('profitLoss.title' as TranslationKey), 14, 20);
      doc.setFontSize(10);
      doc.text(`${dateFrom} → ${dateTo}`, 14, 28);

      autoTable(doc, {
        startY: 35,
        head: [['', '', '']],
        showHead: false,
        body: [
          [{ content: t('profitLoss.sales' as TranslationKey), styles: { fontStyle: 'bold' } }, `(${pnl.salesCount})`, pnl.salesTotal.toLocaleString()],
          [{ content: t('profitLoss.purchases' as TranslationKey), styles: { fontStyle: 'bold' } }, `(${pnl.purchasesCount})`, pnl.purchasesTotal.toLocaleString()],
          [{ content: t('profitLoss.salesReturn' as TranslationKey), styles: { fontStyle: 'bold' } }, `(${pnl.saleReturnsCount})`, pnl.saleReturnsTotal.toLocaleString()],
          [{ content: t('profitLoss.purchasesReturn' as TranslationKey), styles: { fontStyle: 'bold' } }, `(${pnl.purchaseReturnsCount})`, pnl.purchaseReturnsTotal.toLocaleString()],
          ['', '', ''],
          [{ content: t('profitLoss.revenue' as TranslationKey), styles: { fontStyle: 'bold' } }, '', pnl.revenue.toLocaleString()],
          [{ content: t('profitLoss.paymentsReceived' as TranslationKey), styles: { fontStyle: 'bold' } }, '', pnl.paymentsReceived.toLocaleString()],
          [{ content: t('profitLoss.paymentsSent' as TranslationKey), styles: { fontStyle: 'bold' } }, '', pnl.paymentsSent.toLocaleString()],
          [{ content: t('profitLoss.expenses' as TranslationKey), styles: { fontStyle: 'bold' } }, '', pnl.expensesTotal.toLocaleString()],
          [{ content: t('profitLoss.paymentsNet' as TranslationKey), styles: { fontStyle: 'bold' } }, '', pnl.paymentsNet.toLocaleString()],
          ['', '', ''],
          [{ content: t('profitLoss.profitFifo' as TranslationKey), styles: { fontStyle: 'bold' } }, '', pnl.profitFifo.toLocaleString()],
          [{ content: t('profitLoss.profitAvg' as TranslationKey), styles: { fontStyle: 'bold' } }, '', pnl.profitAvg.toLocaleString()],
        ],
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 25, halign: 'center' }, 2: { cellWidth: 50, halign: 'right' } },
      });

      doc.save(`profit-loss_${dateFrom}_${dateTo}.pdf`);
      toast.success(t('profitLoss.exportSuccess' as TranslationKey));
    } catch { toast.error(t('profitLoss.exportError' as TranslationKey)); }
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
    const textColor = dotColor === 'dynamic'
      ? (isNeg ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')
      : `text-${dotColor}-600 dark:text-${dotColor}-400`;
    const bgDot = dotColor === 'dynamic'
      ? (isNeg ? 'bg-red-500' : 'bg-emerald-500')
      : `bg-${dotColor}-500`;

    return (
      <div className="flex items-start justify-between py-4 gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${bgDot}`} />
          <div className="min-w-0">
            <p className={`text-sm ${bold ? 'font-extrabold' : 'font-bold'} text-gray-700 dark:text-gray-200`}>{label}</p>
            {desc && <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>}
          </div>
        </div>
        <span className={`text-lg ${bold ? 'font-black' : 'font-bold'} tabular-nums whitespace-nowrap ${textColor}`}>
          {isLoading ? <Skeleton /> : formatCurrency(value)}
        </span>
      </div>
    );
  };

  const dateRangeLabel = `${dateFrom} → ${dateTo}`;

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center">
          <ScaleIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
            {t('profitLoss.title' as TranslationKey)}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{t('profitLoss.subtitle' as TranslationKey)}</p>
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 px-5 py-3.5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('profitLoss.from' as TranslationKey)}</span>
            <DateInput value={dateFrom} onChange={setDateFrom} className="w-36" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('profitLoss.to' as TranslationKey)}</span>
            <DateInput value={dateTo} onChange={setDateTo} className="w-36" />
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('profitLoss.filterWarehouse' as TranslationKey)}</span>
            <select value={filterWarehouse} onChange={(e) => setFilterWarehouse(e.target.value)} className="input text-sm py-2 min-w-[140px]">
              <option value="">{t('profitLoss.filterAll' as TranslationKey)}</option>
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

      {/* ─── KPI Cards (4 columns) ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x ${isRTL ? 'lg:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          {[
            { label: t('profitLoss.sales' as TranslationKey), count: pnl.salesCount, value: formatCurrency(pnl.salesTotal), color: 'emerald', icon: <ArrowTrendingUpIcon className="w-5 h-5" /> },
            { label: t('profitLoss.purchases' as TranslationKey), count: pnl.purchasesCount, value: formatCurrency(pnl.purchasesTotal), color: 'blue', icon: <ShoppingCartIcon className="w-5 h-5" /> },
            { label: t('profitLoss.salesReturn' as TranslationKey), count: pnl.saleReturnsCount, value: formatCurrency(pnl.saleReturnsTotal), color: 'amber', icon: <ReceiptRefundIcon className="w-5 h-5" /> },
            { label: t('profitLoss.purchasesReturn' as TranslationKey), count: pnl.purchaseReturnsCount, value: formatCurrency(pnl.purchaseReturnsTotal), color: 'violet', icon: <CubeIcon className="w-5 h-5" /> },
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
                    <span className={`${isRTL ? 'mr-1' : 'ml-1'} text-gray-300 dark:text-gray-500`}>({kpi.count})</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Financial Statement + Chart ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ─── Financial Summary Card (3/5) ─── */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('profitLoss.summaryTitle' as TranslationKey)}</h3>
            <span className="text-[10px] text-gray-400 tabular-nums">{dateRangeLabel}</span>
          </div>
          <div className="px-5 divide-y divide-gray-100 dark:divide-gray-700/50">
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
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('profitLoss.chartTitle' as TranslationKey)}</h3>
            <span className="text-[10px] text-gray-400 tabular-nums">{dateRangeLabel}</span>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-[300px]">
              <div className="w-8 h-8 border-[3px] border-violet-200 dark:border-violet-800 border-t-violet-600 rounded-full animate-spin" />
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-violet-200 dark:border-violet-800/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-violet-100 dark:border-violet-800/30 bg-violet-50/50 dark:bg-violet-900/10">
          <h3 className="text-sm font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2">
            <BanknotesIcon className="w-4 h-4" />
            {t('profitLoss.profitSection' as TranslationKey)}
          </h3>
        </div>
        <div className="px-5 divide-y divide-violet-100 dark:divide-violet-800/20">
          <div className="flex items-start justify-between py-5 gap-4">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-gray-700 dark:text-gray-200">
                {t('profitLoss.profitFifo' as TranslationKey)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t('profitLoss.profitDesc' as TranslationKey)}</p>
            </div>
            <span className={`text-2xl font-black tabular-nums whitespace-nowrap ${pnl.profitFifo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isLoading ? <Skeleton /> : formatCurrency(pnl.profitFifo)}
            </span>
          </div>
          <div className="flex items-start justify-between py-5 gap-4">
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-gray-700 dark:text-gray-200">
                {t('profitLoss.profitAvg' as TranslationKey)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t('profitLoss.profitDesc' as TranslationKey)}</p>
            </div>
            <span className={`text-2xl font-black tabular-nums whitespace-nowrap ${pnl.profitAvg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isLoading ? <Skeleton /> : formatCurrency(pnl.profitAvg)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
