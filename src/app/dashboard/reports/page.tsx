'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchasesApi, salesApi, saleReturnsApi, purchaseReturnsApi } from '@/lib/api';
import Link from 'next/link';
import { useLocale, type TranslationKey } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import type { Purchase, Sale } from '@/lib/types';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  ShoppingCartIcon,
  BanknotesIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
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
type TabKey = 'purchases' | 'sales' | 'saleReturns' | 'purchaseReturns';

interface SaleReturn {
  id: number;
  reference: string;
  sale_id: number;
  client_id?: number;
  date: string;
  total_amount: number;
  status: string;
  sale?: { id: number; reference: string };
  client?: { id: number; name: string };
}

interface PurchaseReturn {
  id: number;
  reference: string;
  purchase_id: number;
  supplier_id?: number;
  date: string;
  total_amount: number;
  status: string;
  purchase?: { id: number; reference: string };
  supplier?: { id: number; name: string };
}

// ─── Tab config ───
interface TabDef {
  key: TabKey;
  labelKey: TranslationKey;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { key: 'purchases', labelKey: 'reports.tabPurchases', icon: <ShoppingCartIcon className="w-4 h-4" /> },
  { key: 'sales', labelKey: 'reports.tabSales', icon: <BanknotesIcon className="w-4 h-4" /> },
  { key: 'saleReturns', labelKey: 'reports.tabSaleReturns', icon: <ArrowUturnLeftIcon className="w-4 h-4" /> },
  { key: 'purchaseReturns', labelKey: 'reports.tabPurchaseReturns', icon: <ArrowUturnRightIcon className="w-4 h-4" /> },
];

// ─── Chart colors ───
const BAR_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#7c3aed', '#6d28d9', '#5b21b6', '#4f46e5', '#4338ca', '#818cf8', '#c4b5fd'];

// ─── Shared Components ───
function ChartTooltip({ active, payload, label, formatter }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; formatter: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 dark:bg-gray-700 text-white px-3.5 py-2 rounded-lg text-xs shadow-lg border border-gray-700 dark:border-gray-600">
      <p className="font-medium text-gray-300 mb-0.5">{label}</p>
      <p className="font-bold text-sm tabular-nums">{formatter(payload[0].value)}</p>
    </div>
  );
}

function StatusBadge({ status, type, t }: { status: string; type: 'status' | 'payment' | 'returnStatus'; t: (k: TranslationKey) => string }) {
  const configs: Record<string, Record<string, { dot: string; label: string }>> = {
    status: {
      pending:   { dot: 'metric-dot-orange', label: t('reports.statusPending') },
      received:  { dot: 'metric-dot-green',  label: t('reports.statusReceived') },
      partial:   { dot: 'metric-dot-blue',   label: t('reports.statusPartial') },
      completed: { dot: 'metric-dot-green',  label: t('reports.statusCompleted') },
      cancelled: { dot: 'metric-dot-red',    label: t('reports.statusCancelled') },
    },
    payment: {
      unpaid:  { dot: 'metric-dot-red',    label: t('reports.payUnpaid') },
      partial: { dot: 'metric-dot-orange', label: t('reports.payPartial') },
      paid:    { dot: 'metric-dot-green',  label: t('reports.payPaid') },
    },
    returnStatus: {
      pending:   { dot: 'metric-dot-orange', label: t('reports.statusPending') },
      approved:  { dot: 'metric-dot-green',  label: t('reports.statusApproved') },
      completed: { dot: 'metric-dot-green',  label: t('reports.statusCompleted') },
      rejected:  { dot: 'metric-dot-red',    label: t('reports.statusRejected') },
    },
  };
  const c = configs[type]?.[status] || { dot: 'metric-dot-neutral', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
      <span className={`metric-dot ${c.dot}`} aria-hidden />
      {c.label}
    </span>
  );
}

const PER_PAGE = 15;
const today = () => new Date().toISOString().split('T')[0];
const thirtyDaysAgo = () => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

export default function ReportsPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  // ─── State ───
  const [activeTab, setActiveTab] = useState<TabKey>('purchases');

  // Per-tab date filters
  const [purchasesDateFrom, setPurchasesDateFrom] = useState(thirtyDaysAgo);
  const [purchasesDateTo, setPurchasesDateTo] = useState(today);
  const [salesDateFrom, setSalesDateFrom] = useState(thirtyDaysAgo);
  const [salesDateTo, setSalesDateTo] = useState(today);
  const [saleReturnsDateFrom, setSaleReturnsDateFrom] = useState(thirtyDaysAgo);
  const [saleReturnsDateTo, setSaleReturnsDateTo] = useState(today);
  const [purchaseReturnsDateFrom, setPurchaseReturnsDateFrom] = useState(thirtyDaysAgo);
  const [purchaseReturnsDateTo, setPurchaseReturnsDateTo] = useState(today);

  // Per-tab pagination
  const [purchasesPage, setPurchasesPage] = useState(1);
  const [salesPage, setSalesPage] = useState(1);
  const [saleReturnsPage, setSaleReturnsPage] = useState(1);
  const [purchaseReturnsPage, setPurchaseReturnsPage] = useState(1);

  // Purchases filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterRef, setFilterRef] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

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

  // ═══════════════════════════════════════════════
  // ─── PURCHASES QUERY ───
  // ═══════════════════════════════════════════════
  const { data: purchasesRaw, isLoading: purchasesLoading, refetch: refetchPurchases } = useQuery({
    queryKey: ['reports-purchases', purchasesDateFrom, purchasesDateTo],
    queryFn: async () => {
      const params: Record<string, unknown> = { per_page: 10000 };
      if (purchasesDateFrom) params.from_date = purchasesDateFrom;
      if (purchasesDateTo) params.to_date = purchasesDateTo;
      const res = await purchasesApi.getAll(params);
      return res.data;
    },
    enabled: activeTab === 'purchases',
  });
  const purchases: Purchase[] = purchasesRaw?.data || [];

  const filteredPurchases = useMemo(() => {
    let list = purchases;
    if (filterRef) list = list.filter(p => p.reference.toLowerCase().includes(filterRef.toLowerCase()));
    if (filterSupplier) list = list.filter(p => (p.supplier?.name || '').toLowerCase().includes(filterSupplier.toLowerCase()));
    if (filterStatus) list = list.filter(p => p.status === filterStatus);
    if (filterPayment) list = list.filter(p => p.payment_status === filterPayment);
    return list;
  }, [purchases, filterRef, filterSupplier, filterStatus, filterPayment]);

  const purchasesKpis = useMemo(() => {
    const totalAmount = filteredPurchases.reduce((s, p) => s + (parseFloat(String(p.grand_total)) || 0), 0);
    const paidAmount = filteredPurchases.reduce((s, p) => s + (parseFloat(String(p.paid_amount)) || 0), 0);
    const dueAmount = filteredPurchases.reduce((s, p) => s + (parseFloat(String(p.due_amount)) || 0), 0);
    return { count: filteredPurchases.length, totalAmount, paidAmount, dueAmount };
  }, [filteredPurchases]);

  const purchasesSupplierData = useMemo(() => {
    const map = new Map<string, number>();
    filteredPurchases.forEach(p => {
      const name = p.supplier?.name || `#${p.supplier_id}`;
      map.set(name, (map.get(name) || 0) + (parseFloat(String(p.grand_total)) || 0));
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [filteredPurchases]);

  const purchasesDailyData = useMemo(() => {
    const map = new Map<string, number>();
    filteredPurchases.forEach(p => { map.set(p.date, (map.get(p.date) || 0) + (parseFloat(String(p.grand_total)) || 0)); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date: formatShortDate(date), amount }));
  }, [filteredPurchases, formatShortDate]);

  const paginatedPurchases = useMemo(() => filteredPurchases.slice((purchasesPage - 1) * PER_PAGE, purchasesPage * PER_PAGE), [filteredPurchases, purchasesPage]);
  const purchasesTotalPages = Math.ceil(filteredPurchases.length / PER_PAGE) || 1;

  // ═══════════════════════════════════════════════
  // ─── SALES QUERY ───
  // ═══════════════════════════════════════════════
  const { data: salesRaw, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['reports-sales', salesDateFrom, salesDateTo],
    queryFn: async () => {
      const params: Record<string, unknown> = { per_page: 10000 };
      if (salesDateFrom) params.from_date = salesDateFrom;
      if (salesDateTo) params.to_date = salesDateTo;
      const res = await salesApi.getAll(params);
      return res.data;
    },
    enabled: activeTab === 'sales',
  });
  const sales: Sale[] = salesRaw?.data || [];

  const salesKpis = useMemo(() => {
    const totalAmount = sales.reduce((s, p) => s + (parseFloat(String(p.grand_total)) || 0), 0);
    const paidAmount = sales.reduce((s, p) => s + (parseFloat(String(p.paid_amount)) || 0), 0);
    const dueAmount = sales.reduce((s, p) => s + (parseFloat(String(p.due_amount)) || 0), 0);
    return { count: sales.length, totalAmount, paidAmount, dueAmount };
  }, [sales]);

  const salesClientData = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach(s => {
      const name = s.client?.name || `#${s.client_id}`;
      map.set(name, (map.get(name) || 0) + (parseFloat(String(s.grand_total)) || 0));
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [sales]);

  const salesDailyData = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach(s => { map.set(s.date, (map.get(s.date) || 0) + (parseFloat(String(s.grand_total)) || 0)); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date: formatShortDate(date), amount }));
  }, [sales, formatShortDate]);

  const paginatedSales = useMemo(() => sales.slice((salesPage - 1) * PER_PAGE, salesPage * PER_PAGE), [sales, salesPage]);
  const salesTotalPages = Math.ceil(sales.length / PER_PAGE) || 1;

  // ═══════════════════════════════════════════════
  // ─── SALE RETURNS QUERY ───
  // ═══════════════════════════════════════════════
  const { data: saleReturnsRaw, isLoading: saleReturnsLoading, refetch: refetchSaleReturns } = useQuery({
    queryKey: ['reports-sale-returns', saleReturnsDateFrom, saleReturnsDateTo],
    queryFn: async () => {
      const params: Record<string, unknown> = { per_page: 10000 };
      if (saleReturnsDateFrom) params.from_date = saleReturnsDateFrom;
      if (saleReturnsDateTo) params.to_date = saleReturnsDateTo;
      const res = await saleReturnsApi.getAll(params);
      return res.data;
    },
    enabled: activeTab === 'saleReturns',
  });
  const saleReturns: SaleReturn[] = saleReturnsRaw?.data || [];

  const saleReturnsKpis = useMemo(() => {
    const totalAmount = saleReturns.reduce((s, r) => s + (parseFloat(String(r.total_amount)) || 0), 0);
    return { count: saleReturns.length, totalAmount };
  }, [saleReturns]);

  const saleReturnsClientData = useMemo(() => {
    const map = new Map<string, number>();
    saleReturns.forEach(r => {
      const name = r.client?.name || `#${r.client_id || '?'}`;
      map.set(name, (map.get(name) || 0) + (parseFloat(String(r.total_amount)) || 0));
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [saleReturns]);

  const saleReturnsDailyData = useMemo(() => {
    const map = new Map<string, number>();
    saleReturns.forEach(r => { map.set(r.date, (map.get(r.date) || 0) + (parseFloat(String(r.total_amount)) || 0)); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date: formatShortDate(date), amount }));
  }, [saleReturns, formatShortDate]);

  const paginatedSaleReturns = useMemo(() => saleReturns.slice((saleReturnsPage - 1) * PER_PAGE, saleReturnsPage * PER_PAGE), [saleReturns, saleReturnsPage]);
  const saleReturnsTotalPages = Math.ceil(saleReturns.length / PER_PAGE) || 1;

  // ═══════════════════════════════════════════════
  // ─── PURCHASE RETURNS QUERY ───
  // ═══════════════════════════════════════════════
  const { data: purchaseReturnsRaw, isLoading: purchaseReturnsLoading, refetch: refetchPurchaseReturns } = useQuery({
    queryKey: ['reports-purchase-returns', purchaseReturnsDateFrom, purchaseReturnsDateTo],
    queryFn: async () => {
      const params: Record<string, unknown> = { per_page: 10000 };
      if (purchaseReturnsDateFrom) params.from_date = purchaseReturnsDateFrom;
      if (purchaseReturnsDateTo) params.to_date = purchaseReturnsDateTo;
      const res = await purchaseReturnsApi.getAll(params);
      return res.data;
    },
    enabled: activeTab === 'purchaseReturns',
  });
  const purchaseReturnsList: PurchaseReturn[] = purchaseReturnsRaw?.data || [];

  const purchaseReturnsKpis = useMemo(() => {
    const totalAmount = purchaseReturnsList.reduce((s, r) => s + (parseFloat(String(r.total_amount)) || 0), 0);
    return { count: purchaseReturnsList.length, totalAmount };
  }, [purchaseReturnsList]);

  const purchaseReturnsSupplierData = useMemo(() => {
    const map = new Map<string, number>();
    purchaseReturnsList.forEach(r => {
      const name = r.supplier?.name || `#${r.supplier_id || '?'}`;
      map.set(name, (map.get(name) || 0) + (parseFloat(String(r.total_amount)) || 0));
    });
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name: name.length > 14 ? name.slice(0, 14) + '…' : name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [purchaseReturnsList]);

  const purchaseReturnsDailyData = useMemo(() => {
    const map = new Map<string, number>();
    purchaseReturnsList.forEach(r => { map.set(r.date, (map.get(r.date) || 0) + (parseFloat(String(r.total_amount)) || 0)); });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date: formatShortDate(date), amount }));
  }, [purchaseReturnsList, formatShortDate]);

  const paginatedPurchaseReturns = useMemo(() => purchaseReturnsList.slice((purchaseReturnsPage - 1) * PER_PAGE, purchaseReturnsPage * PER_PAGE), [purchaseReturnsList, purchaseReturnsPage]);
  const purchaseReturnsTotalPages = Math.ceil(purchaseReturnsList.length / PER_PAGE) || 1;

  // ═══════════════════════════════════════════════
  // ─── EXPORT HELPERS ───
  // ═══════════════════════════════════════════════
  const exportExcel = async (
    sheetName: string,
    columns: { header: string; key: string; width: number }[],
    rows: Record<string, unknown>[],
    fileName: string,
  ) => {
    if (!rows.length) { toast.error(t('reports.noExportData')); return; }
    try {
      const exceljsMod: any = await import('exceljs');
      const ExcelJS = exceljsMod.default || exceljsMod;
      const fileSaverMod: any = await import('file-saver');
      const saveAs = fileSaverMod.saveAs || fileSaverMod.default?.saveAs || fileSaverMod.default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(sheetName);
      ws.columns = columns;
      ws.getRow(1).eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
        cell.alignment = { horizontal: 'center' };
      });
      rows.forEach(r => ws.addRow(r));
      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
      toast.success(t('reports.exportSuccess'));
    } catch (err) {
      console.error('Excel export failed:', err);
      toast.error(t('reports.exportError'));
    }
  };

  const exportPDF = async (
    title: string,
    dateRange: string,
    headers: string[],
    rows: (string | number)[][],
    _fileName: string,
  ) => {
    if (!rows.length) { toast.error(t('reports.noExportData')); return; }
    try {
      const { printReport } = await import('@/lib/print-report');
      printReport({
        title,
        subtitle: dateRange,
        columns: headers,
        rows,
        orientation: 'landscape',
        dir: locale === 'ar' ? 'rtl' : 'ltr',
      });
      toast.success(t('reports.exportSuccess'));
    } catch { toast.error(t('reports.exportError')); }
  };

  // ─── Tab-specific export functions ───
  const exportPurchasesExcel = () => exportExcel(
    t('reports.tabPurchases'),
    [
      { header: t('reports.colReference'), key: 'reference', width: 18 },
      { header: t('reports.colSupplier'), key: 'supplier', width: 24 },
      { header: t('reports.colUser'), key: 'user', width: 18 },
      { header: t('reports.colWarehouse'), key: 'warehouse', width: 18 },
      { header: t('reports.colDate'), key: 'date', width: 14 },
      { header: t('reports.colTotal'), key: 'total', width: 16 },
      { header: t('reports.colPaid'), key: 'paid', width: 16 },
      { header: t('reports.colDue'), key: 'due', width: 16 },
      { header: t('reports.colStatus'), key: 'status', width: 12 },
      { header: t('reports.colPaymentStatus'), key: 'paymentStatus', width: 14 },
    ],
    filteredPurchases.map(p => ({ reference: p.reference, supplier: p.supplier?.name || '-', user: p.user?.name || '-', warehouse: p.warehouse?.name || '-', date: p.date, total: parseFloat(String(p.grand_total)) || 0, paid: parseFloat(String(p.paid_amount)) || 0, due: parseFloat(String(p.due_amount)) || 0, status: p.status, paymentStatus: p.payment_status })),
    `purchases_${purchasesDateFrom}_${purchasesDateTo}.xlsx`,
  );

  const exportPurchasesPDF = () => exportPDF(
    t('reports.tabPurchases'), `${purchasesDateFrom} → ${purchasesDateTo}`,
    [t('reports.colReference'), t('reports.colSupplier'), t('reports.colUser'), t('reports.colWarehouse'), t('reports.colDate'), t('reports.colTotal'), t('reports.colPaid'), t('reports.colDue'), t('reports.colStatus'), t('reports.colPaymentStatus')],
    filteredPurchases.map(p => [p.reference, p.supplier?.name || '-', p.user?.name || '-', p.warehouse?.name || '-', p.date, (parseFloat(String(p.grand_total)) || 0).toLocaleString(), (parseFloat(String(p.paid_amount)) || 0).toLocaleString(), (parseFloat(String(p.due_amount)) || 0).toLocaleString(), p.status, p.payment_status]),
    `purchases_${purchasesDateFrom}_${purchasesDateTo}.pdf`,
  );

  const exportSalesExcel = () => exportExcel(
    t('reports.tabSales'),
    [
      { header: t('reports.colReference'), key: 'reference', width: 18 },
      { header: t('reports.colClient'), key: 'client', width: 24 },
      { header: t('reports.colDate'), key: 'date', width: 14 },
      { header: t('reports.colTotal'), key: 'total', width: 16 },
      { header: t('reports.colPaid'), key: 'paid', width: 16 },
      { header: t('reports.colDue'), key: 'due', width: 16 },
      { header: t('reports.colStatus'), key: 'status', width: 12 },
      { header: t('reports.colPaymentStatus'), key: 'paymentStatus', width: 14 },
    ],
    sales.map(s => ({ reference: s.reference, client: s.client?.name || '-', date: s.date, total: parseFloat(String(s.grand_total)) || 0, paid: parseFloat(String(s.paid_amount)) || 0, due: parseFloat(String(s.due_amount)) || 0, status: s.status, paymentStatus: s.payment_status })),
    `sales_${salesDateFrom}_${salesDateTo}.xlsx`,
  );

  const exportSalesPDF = () => exportPDF(
    t('reports.tabSales'), `${salesDateFrom} → ${salesDateTo}`,
    [t('reports.colReference'), t('reports.colClient'), t('reports.colDate'), t('reports.colTotal'), t('reports.colPaid'), t('reports.colDue'), t('reports.colStatus'), t('reports.colPaymentStatus')],
    sales.map(s => [s.reference, s.client?.name || '-', s.date, (parseFloat(String(s.grand_total)) || 0).toLocaleString(), (parseFloat(String(s.paid_amount)) || 0).toLocaleString(), (parseFloat(String(s.due_amount)) || 0).toLocaleString(), s.status, s.payment_status]),
    `sales_${salesDateFrom}_${salesDateTo}.pdf`,
  );

  const exportSaleReturnsExcel = () => exportExcel(
    t('reports.tabSaleReturns'),
    [
      { header: t('reports.colReference'), key: 'reference', width: 18 },
      { header: t('reports.colSaleRef'), key: 'saleRef', width: 18 },
      { header: t('reports.colClient'), key: 'client', width: 24 },
      { header: t('reports.colDate'), key: 'date', width: 14 },
      { header: t('reports.colAmount'), key: 'amount', width: 16 },
      { header: t('reports.colStatus'), key: 'status', width: 12 },
    ],
    saleReturns.map(r => ({ reference: r.reference, saleRef: r.sale?.reference || '-', client: r.client?.name || '-', date: r.date, amount: parseFloat(String(r.total_amount)) || 0, status: r.status })),
    `sale-returns_${saleReturnsDateFrom}_${saleReturnsDateTo}.xlsx`,
  );

  const exportSaleReturnsPDF = () => exportPDF(
    t('reports.tabSaleReturns'), `${saleReturnsDateFrom} → ${saleReturnsDateTo}`,
    [t('reports.colReference'), t('reports.colSaleRef'), t('reports.colClient'), t('reports.colDate'), t('reports.colAmount'), t('reports.colStatus')],
    saleReturns.map(r => [r.reference, r.sale?.reference || '-', r.client?.name || '-', r.date, (parseFloat(String(r.total_amount)) || 0).toLocaleString(), r.status]),
    `sale-returns_${saleReturnsDateFrom}_${saleReturnsDateTo}.pdf`,
  );

  const exportPurchaseReturnsExcel = () => exportExcel(
    t('reports.tabPurchaseReturns'),
    [
      { header: t('reports.colReference'), key: 'reference', width: 18 },
      { header: t('reports.colPurchaseRef'), key: 'purchaseRef', width: 18 },
      { header: t('reports.colSupplier'), key: 'supplier', width: 24 },
      { header: t('reports.colDate'), key: 'date', width: 14 },
      { header: t('reports.colAmount'), key: 'amount', width: 16 },
      { header: t('reports.colStatus'), key: 'status', width: 12 },
    ],
    purchaseReturnsList.map(r => ({ reference: r.reference, purchaseRef: r.purchase?.reference || '-', supplier: r.supplier?.name || '-', date: r.date, amount: parseFloat(String(r.total_amount)) || 0, status: r.status })),
    `purchase-returns_${purchaseReturnsDateFrom}_${purchaseReturnsDateTo}.xlsx`,
  );

  const exportPurchaseReturnsPDF = () => exportPDF(
    t('reports.tabPurchaseReturns'), `${purchaseReturnsDateFrom} → ${purchaseReturnsDateTo}`,
    [t('reports.colReference'), t('reports.colPurchaseRef'), t('reports.colSupplier'), t('reports.colDate'), t('reports.colAmount'), t('reports.colStatus')],
    purchaseReturnsList.map(r => [r.reference, r.purchase?.reference || '-', r.supplier?.name || '-', r.date, (parseFloat(String(r.total_amount)) || 0).toLocaleString(), r.status]),
    `purchase-returns_${purchaseReturnsDateFrom}_${purchaseReturnsDateTo}.pdf`,
  );

  // ═══════════════════════════════════════════════
  // ─── SHARED RENDER HELPERS ───
  // ═══════════════════════════════════════════════
  const renderFilterBar = (
    dateFrom: string, setDateFrom: (v: string) => void,
    dateTo: string, setDateTo: (v: string) => void,
    onRefetch: () => void,
    onExportExcel: () => void,
    onExportPDF: () => void,
    filterToggle?: { active: boolean; onToggle: () => void; count: number },
  ) => (
    <FilterBar
      trailing={
        <>
          <button onClick={onRefetch} className="inline-flex items-center gap-1.5 px-2.5 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="Refresh">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          {filterToggle && (
            <button onClick={filterToggle.onToggle} className={`relative inline-flex items-center gap-1.5 px-3 h-[38px] text-[12px] font-semibold rounded-md transition-colors ${filterToggle.active ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <FunnelIcon className="w-4 h-4" />
              {t('reports.filters')}
              {filterToggle.count > 0 && (
                <span className="ms-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[10px] font-bold tnum">{filterToggle.count}</span>
              )}
            </button>
          )}
          <button onClick={onExportExcel} className="inline-flex items-center gap-1.5 px-3 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" /> Excel
          </button>
          <button onClick={onExportPDF} className="inline-flex items-center gap-1.5 px-3 h-[38px] text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowDownTrayIcon className="w-4 h-4" /> PDF
          </button>
        </>
      }
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('reports.from')}</span>
        <DateInput value={dateFrom} onChange={setDateFrom} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">{t('reports.to')}</span>
        <DateInput value={dateTo} onChange={setDateTo} />
      </div>
    </FilterBar>
  );

  const colorToDot: Record<string, string> = {
    indigo: 'metric-dot-violet',
    violet: 'metric-dot-violet',
    emerald: 'metric-dot-green',
    blue: 'metric-dot-blue',
    red: 'metric-dot-red',
    amber: 'metric-dot-orange',
  };

  const renderKpiStrip = (items: { label: string; value: string; color: string; currency?: boolean }[], loading: boolean) => (
    <div className={`grid grid-cols-2 md:grid-cols-${Math.min(items.length, 4)} gap-2.5`}>
      {items.map((kpi, i) => (
        <div key={i} className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className={`metric-dot ${colorToDot[kpi.color] || 'metric-dot-neutral'}`} aria-hidden />
            <p className="metric-label truncate">{kpi.label}</p>
          </div>
          {loading ? (
            <div className="w-20 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : kpi.currency ? (
            <p className="metric-value-currency">{kpi.value}</p>
          ) : (
            <p className="metric-value truncate">{kpi.value}</p>
          )}
        </div>
      ))}
    </div>
  );

  const renderCharts = (
    barData: { name: string; amount: number }[],
    areaData: { date: string; amount: number }[],
    barTitle: string,
    areaTitle: string,
    gradientId: string,
    accentColor: string,
    loading: boolean,
  ) => {
    if (loading || (barData.length === 0 && areaData.length === 0)) return null;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="surface-pro">
          <h3 className="surface-heading mb-3">{barTitle}</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={100} />
                <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]} barSize={22}>
                  {barData.map((_, i) => (<Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('reports.noData')}</div>
          )}
        </div>
        <div className="surface-pro">
          <h3 className="surface-heading mb-3">{areaTitle}</h3>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={areaData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip content={<ChartTooltip formatter={formatCurrency} />} />
                <Area type="monotone" dataKey="amount" stroke={accentColor} strokeWidth={2.5} fill={`url(#${gradientId})`}
                  dot={areaData.length <= 31 ? { r: 3, fill: accentColor, strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: accentColor, stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">{t('reports.noData')}</div>
          )}
        </div>
      </div>
    );
  };

  const renderPagination = (page: number, totalPages: number, totalCount: number, setPage: (fn: (p: number) => number) => void) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700">
        <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">
          {t('reports.pageInfo', { current: String(page), total: String(totalPages), count: String(totalCount) })}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
            <PrevChevron className="w-3.5 h-3.5" /> {t('reports.prev')}
          </button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">
            {t('reports.next')} <NextChevron className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center py-20">
      <div className="spinner" />
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <ClipboardDocumentListIcon className="w-12 h-12 mb-3" />
      <p className="text-sm font-medium">{t('reports.noData')}</p>
    </div>
  );

  const thClass = "text-start text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/60";
  const thEndClass = "text-end text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/60";
  const thCenterClass = "text-center text-[10.5px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 bg-gray-50/60 dark:bg-gray-800/60";
  const tdClass = "px-4 py-2 text-[13px]";

  // ═══════════════════════════════════════════════
  // ─── RENDER ───
  // ═══════════════════════════════════════════════
  return (
    <div className="space-y-4">
      <PageHeader title={t('reports.title')} subtitle={t('reports.subtitle')} tight />

      {/* ─── Tab Navigation ─── */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? 'border-gray-900 dark:border-gray-100 text-gray-900 dark:text-gray-100'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
              {tab.icon}
              <span className="hidden sm:inline">{t(tab.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* ─── PURCHASES TAB ─── */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'purchases' && (() => {
        const activeFilterCount = [filterRef, filterSupplier, filterStatus, filterPayment].filter(Boolean).length;
        const clearFilters = () => { setFilterRef(''); setFilterSupplier(''); setFilterStatus(''); setFilterPayment(''); setPurchasesPage(1); };
        return (
        <div className="flex gap-5">
          {/* Main content */}
          <div className={`flex-1 min-w-0 space-y-5 transition-all duration-300 ${showFilters ? '' : ''}`}>
          {renderFilterBar(purchasesDateFrom, setPurchasesDateFrom, purchasesDateTo, setPurchasesDateTo, () => refetchPurchases(), exportPurchasesExcel, exportPurchasesPDF, { active: showFilters, onToggle: () => setShowFilters(!showFilters), count: activeFilterCount })}

          {renderKpiStrip([
            { label: t('reports.kpiTotalPurchases'), value: purchasesKpis.count.toString(), color: 'indigo' },
            { label: t('reports.kpiTotalAmount'), value: formatCurrency(purchasesKpis.totalAmount), color: 'emerald', currency: true },
            { label: t('reports.kpiPaidAmount'), value: formatCurrency(purchasesKpis.paidAmount), color: 'blue', currency: true },
            { label: t('reports.kpiDueAmount'), value: formatCurrency(purchasesKpis.dueAmount), color: 'red', currency: true },
          ], purchasesLoading)}

          {renderCharts(purchasesSupplierData, purchasesDailyData, t('reports.chartTopSuppliers'), t('reports.chartDailyTrend'), 'purchaseGrad', '#6366f1', purchasesLoading)}

          <div className="bg-white dark:bg-gray-900 rounded-[10px] border border-gray-200/80 dark:border-gray-700/60 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700/60 flex items-center justify-between">
              <h3 className="surface-heading">{t('reports.tableTitle')}</h3>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">{filteredPurchases.length} {t('reports.entries')}</span>
            </div>
            {purchasesLoading ? renderLoading() : filteredPurchases.length === 0 ? renderEmpty() : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <th className={thClass}>{t('reports.colReference')}</th>
                        <th className={thClass}>{t('reports.colSupplier')}</th>
                        <th className={thClass}>{t('reports.colUser')}</th>
                        <th className={thClass}>{t('reports.colWarehouse')}</th>
                        <th className={thClass}>{t('reports.colDate')}</th>
                        <th className={thEndClass}>{t('reports.colTotal')}</th>
                        <th className={thEndClass}>{t('reports.colPaid')}</th>
                        <th className={thEndClass}>{t('reports.colDue')}</th>
                        <th className={thCenterClass}>{t('reports.colStatus')}</th>
                        <th className={thCenterClass}>{t('reports.colPaymentStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {paginatedPurchases.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className={tdClass}><Link href={`/dashboard/purchases/${p.id}`} className="font-mono font-semibold text-gray-800 dark:text-gray-100 hover:underline">{p.reference}</Link></td>
                          <td className={tdClass}><span className="text-sm text-gray-700 dark:text-gray-300">{p.supplier?.name || '-'}</span></td>
                          <td className={tdClass}><span className="text-sm text-gray-600 dark:text-gray-400">{p.user?.name || '-'}</span></td>
                          <td className={tdClass}><span className="text-sm text-gray-600 dark:text-gray-400">{p.warehouse?.name || '-'}</span></td>
                          <td className={tdClass}><span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(p.date)}</span></td>
                          <td className={`${tdClass} text-end`}><span className="font-semibold text-gray-800 dark:text-gray-100 tnum">{formatCurrency(parseFloat(String(p.grand_total)) || 0)}</span></td>
                          <td className={`${tdClass} text-end`}><span className="font-medium text-gray-700 dark:text-gray-300 tnum">{formatCurrency(parseFloat(String(p.paid_amount)) || 0)}</span></td>
                          <td className={`${tdClass} text-end`}><span className={`font-medium tnum ${(parseFloat(String(p.due_amount)) || 0) > 0 ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>{formatCurrency(parseFloat(String(p.due_amount)) || 0)}</span></td>
                          <td className={`${tdClass} text-center`}><StatusBadge status={p.status} type="status" t={t} /></td>
                          <td className={`${tdClass} text-center`}><StatusBadge status={p.payment_status} type="payment" t={t} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderPagination(purchasesPage, purchasesTotalPages, filteredPurchases.length, setPurchasesPage)}
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
                    {t('reports.filters')}
                  </h3>
                  <button onClick={() => setShowFilters(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('reports.colReference')}</label>
                  <input type="text" value={filterRef} onChange={(e) => { setFilterRef(e.target.value); setPurchasesPage(1); }} placeholder={t('reports.filterSearchRef')} className="input w-full text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('reports.colSupplier')}</label>
                  <input type="text" value={filterSupplier} onChange={(e) => { setFilterSupplier(e.target.value); setPurchasesPage(1); }} placeholder={t('reports.filterSearchSupplier')} className="input w-full text-sm" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('reports.colStatus')}</label>
                  <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPurchasesPage(1); }} className="input w-full text-sm">
                    <option value="">{t('reports.filterAll')}</option>
                    <option value="pending">{t('reports.statusPending')}</option>
                    <option value="received">{t('reports.statusReceived')}</option>
                    <option value="partial">{t('reports.statusPartial')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('reports.colPaymentStatus')}</label>
                  <select value={filterPayment} onChange={(e) => { setFilterPayment(e.target.value); setPurchasesPage(1); }} className="input w-full text-sm">
                    <option value="">{t('reports.filterAll')}</option>
                    <option value="unpaid">{t('reports.payUnpaid')}</option>
                    <option value="partial">{t('reports.payPartial')}</option>
                    <option value="paid">{t('reports.payPaid')}</option>
                  </select>
                </div>

                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-3.5 h-3.5" />
                    {t('reports.clearFilters')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ═══════════════════════════════════════════ */}
      {/* ─── SALES TAB ─── */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'sales' && (
        <>
          {renderFilterBar(salesDateFrom, setSalesDateFrom, salesDateTo, setSalesDateTo, () => refetchSales(), exportSalesExcel, exportSalesPDF)}

          {renderKpiStrip([
            { label: t('reports.kpiTotalSales'), value: salesKpis.count.toString(), color: 'indigo' },
            { label: t('reports.kpiTotalAmount'), value: formatCurrency(salesKpis.totalAmount), color: 'emerald', currency: true },
            { label: t('reports.kpiPaidAmount'), value: formatCurrency(salesKpis.paidAmount), color: 'blue', currency: true },
            { label: t('reports.kpiDueAmount'), value: formatCurrency(salesKpis.dueAmount), color: 'red', currency: true },
          ], salesLoading)}

          {renderCharts(salesClientData, salesDailyData, t('reports.chartTopClients'), t('reports.chartDailySalesTrend'), 'salesGrad', '#10b981', salesLoading)}

          <div className="bg-white dark:bg-gray-900 rounded-[10px] border border-gray-200/80 dark:border-gray-700/60 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700/60 flex items-center justify-between">
              <h3 className="surface-heading">{t('reports.tableTitleSales')}</h3>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">{sales.length} {t('reports.entries')}</span>
            </div>
            {salesLoading ? renderLoading() : sales.length === 0 ? renderEmpty() : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <th className={thClass}>{t('reports.colReference')}</th>
                        <th className={thClass}>{t('reports.colClient')}</th>
                        <th className={thClass}>{t('reports.colDate')}</th>
                        <th className={thEndClass}>{t('reports.colTotal')}</th>
                        <th className={thEndClass}>{t('reports.colPaid')}</th>
                        <th className={thEndClass}>{t('reports.colDue')}</th>
                        <th className={thCenterClass}>{t('reports.colStatus')}</th>
                        <th className={thCenterClass}>{t('reports.colPaymentStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {paginatedSales.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className={tdClass}><Link href={`/dashboard/sales/${s.id}`} className="font-mono font-semibold text-gray-800 dark:text-gray-100 hover:underline">{s.reference}</Link></td>
                          <td className={tdClass}><span className="text-sm text-gray-700 dark:text-gray-300">{s.client?.name || '-'}</span></td>
                          <td className={tdClass}><span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(s.date)}</span></td>
                          <td className={`${tdClass} text-end`}><span className="font-semibold text-gray-800 dark:text-gray-100 tnum">{formatCurrency(parseFloat(String(s.grand_total)) || 0)}</span></td>
                          <td className={`${tdClass} text-end`}><span className="font-medium text-gray-700 dark:text-gray-300 tnum">{formatCurrency(parseFloat(String(s.paid_amount)) || 0)}</span></td>
                          <td className={`${tdClass} text-end`}><span className={`font-medium tnum ${(parseFloat(String(s.due_amount)) || 0) > 0 ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400'}`}>{formatCurrency(parseFloat(String(s.due_amount)) || 0)}</span></td>
                          <td className={`${tdClass} text-center`}><StatusBadge status={s.status} type="status" t={t} /></td>
                          <td className={`${tdClass} text-center`}><StatusBadge status={s.payment_status} type="payment" t={t} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderPagination(salesPage, salesTotalPages, sales.length, setSalesPage)}
              </>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ─── SALE RETURNS TAB ─── */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'saleReturns' && (
        <>
          {renderFilterBar(saleReturnsDateFrom, setSaleReturnsDateFrom, saleReturnsDateTo, setSaleReturnsDateTo, () => refetchSaleReturns(), exportSaleReturnsExcel, exportSaleReturnsPDF)}

          {renderKpiStrip([
            { label: t('reports.kpiTotalSaleReturns'), value: saleReturnsKpis.count.toString(), color: 'violet' },
            { label: t('reports.kpiTotalReturnAmount'), value: formatCurrency(saleReturnsKpis.totalAmount), color: 'amber', currency: true },
          ], saleReturnsLoading)}

          {renderCharts(saleReturnsClientData, saleReturnsDailyData, t('reports.chartTopReturnClients'), t('reports.chartDailyReturnTrend'), 'saleReturnGrad', '#f59e0b', saleReturnsLoading)}

          <div className="bg-white dark:bg-gray-900 rounded-[10px] border border-gray-200/80 dark:border-gray-700/60 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700/60 flex items-center justify-between">
              <h3 className="surface-heading">{t('reports.tableTitleSaleReturns')}</h3>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">{saleReturns.length} {t('reports.entries')}</span>
            </div>
            {saleReturnsLoading ? renderLoading() : saleReturns.length === 0 ? renderEmpty() : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <th className={thClass}>{t('reports.colReference')}</th>
                        <th className={thClass}>{t('reports.colSaleRef')}</th>
                        <th className={thClass}>{t('reports.colClient')}</th>
                        <th className={thClass}>{t('reports.colDate')}</th>
                        <th className={thEndClass}>{t('reports.colAmount')}</th>
                        <th className={thCenterClass}>{t('reports.colStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {paginatedSaleReturns.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className={tdClass}><span className="font-mono font-semibold text-gray-800 dark:text-gray-100">{r.reference}</span></td>
                          <td className={tdClass}>{r.sale ? <Link href={`/dashboard/sales/${r.sale_id}`} className="font-mono text-gray-700 dark:text-gray-200 hover:underline">{r.sale.reference}</Link> : <span className="text-sm text-gray-400">-</span>}</td>
                          <td className={tdClass}><span className="text-sm text-gray-700 dark:text-gray-300">{r.client?.name || '-'}</span></td>
                          <td className={tdClass}><span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(r.date)}</span></td>
                          <td className={`${tdClass} text-end`}><span className="font-semibold text-gray-800 dark:text-gray-100 tnum">{formatCurrency(parseFloat(String(r.total_amount)) || 0)}</span></td>
                          <td className={`${tdClass} text-center`}><StatusBadge status={r.status} type="returnStatus" t={t} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderPagination(saleReturnsPage, saleReturnsTotalPages, saleReturns.length, setSaleReturnsPage)}
              </>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* ─── PURCHASE RETURNS TAB ─── */}
      {/* ═══════════════════════════════════════════ */}
      {activeTab === 'purchaseReturns' && (
        <>
          {renderFilterBar(purchaseReturnsDateFrom, setPurchaseReturnsDateFrom, purchaseReturnsDateTo, setPurchaseReturnsDateTo, () => refetchPurchaseReturns(), exportPurchaseReturnsExcel, exportPurchaseReturnsPDF)}

          {renderKpiStrip([
            { label: t('reports.kpiTotalPurchaseReturns'), value: purchaseReturnsKpis.count.toString(), color: 'violet' },
            { label: t('reports.kpiTotalReturnAmount'), value: formatCurrency(purchaseReturnsKpis.totalAmount), color: 'amber', currency: true },
          ], purchaseReturnsLoading)}

          {renderCharts(purchaseReturnsSupplierData, purchaseReturnsDailyData, t('reports.chartTopReturnSuppliers'), t('reports.chartDailyPurchaseReturnTrend'), 'purchaseReturnGrad', '#ef4444', purchaseReturnsLoading)}

          <div className="bg-white dark:bg-gray-900 rounded-[10px] border border-gray-200/80 dark:border-gray-700/60 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-200/80 dark:border-gray-700/60 flex items-center justify-between">
              <h3 className="surface-heading">{t('reports.tableTitlePurchaseReturns')}</h3>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">{purchaseReturnsList.length} {t('reports.entries')}</span>
            </div>
            {purchaseReturnsLoading ? renderLoading() : purchaseReturnsList.length === 0 ? renderEmpty() : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
                        <th className={thClass}>{t('reports.colReference')}</th>
                        <th className={thClass}>{t('reports.colPurchaseRef')}</th>
                        <th className={thClass}>{t('reports.colSupplier')}</th>
                        <th className={thClass}>{t('reports.colDate')}</th>
                        <th className={thEndClass}>{t('reports.colAmount')}</th>
                        <th className={thCenterClass}>{t('reports.colStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {paginatedPurchaseReturns.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className={tdClass}><span className="font-mono font-semibold text-gray-800 dark:text-gray-100">{r.reference}</span></td>
                          <td className={tdClass}>{r.purchase ? <Link href={`/dashboard/purchases/${r.purchase_id}`} className="font-mono text-gray-700 dark:text-gray-200 hover:underline">{r.purchase.reference}</Link> : <span className="text-sm text-gray-400">-</span>}</td>
                          <td className={tdClass}><span className="text-sm text-gray-700 dark:text-gray-300">{r.supplier?.name || '-'}</span></td>
                          <td className={tdClass}><span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(r.date)}</span></td>
                          <td className={`${tdClass} text-end`}><span className="font-semibold text-gray-800 dark:text-gray-100 tnum">{formatCurrency(parseFloat(String(r.total_amount)) || 0)}</span></td>
                          <td className={`${tdClass} text-center`}><StatusBadge status={r.status} type="returnStatus" t={t} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {renderPagination(purchaseReturnsPage, purchaseReturnsTotalPages, purchaseReturnsList.length, setPurchaseReturnsPage)}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
