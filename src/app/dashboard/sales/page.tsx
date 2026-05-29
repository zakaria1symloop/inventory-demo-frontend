'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { salesApi, clientsApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import SaleForm from './_components/SaleForm';
import {
  DocumentTextIcon,
  TruckIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
  ListBulletIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  EyeIcon,
  TrashIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';

interface Sale {
  id: number;
  reference: string;
  client_id?: number;
  warehouse_id: number;
  date: string;
  total_amount: number;
  total_cost?: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: 'pending' | 'completed' | 'cancelled' | 'draft';
  payment_status: 'unpaid' | 'partial' | 'paid';
  note?: string;
  source?: 'web' | 'app' | 'delivery';
  returns_count?: number;
  client?: { id: number; name: string };
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
}

interface Client {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface Tab {
  id: string;
  type: 'list' | 'new' | 'edit' | 'retour';
  title: string;
  saleId?: number;
  reference?: string;
}

interface RetourItem {
  product_id: number;
  product_name: string;
  pieces_per_package: number;
  unit_price: number;
  max_qty: number;
  cartons: string;
  pcs: string;
  reason: string;
}

function SaleRetourForm({ saleId, onSuccess, onCancel }: { saleId: number; onSuccess: () => void; onCancel: () => void }) {
  const { t, locale } = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saleRef, setSaleRef] = useState('');
  const [items, setItems] = useState<RetourItem[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    salesApi.getOne(saleId).then(res => {
      const sale = res.data;
      setSaleRef(sale.reference || '');
      const returns = sale.returns || [];
      setItems((sale.items || []).map((item: any) => {
        const alreadyReturned = returns.reduce((sum: number, r: any) => {
          const ri = (r.items || []).find((i: any) => i.product_id === item.product_id);
          return sum + (ri ? ri.quantity : 0);
        }, 0);
        return {
          product_id: item.product_id,
          product_name: item.product?.name || '',
          pieces_per_package: item.product?.pieces_per_package > 1 ? item.product.pieces_per_package : 1,
          unit_price: item.unit_price,
          max_qty: item.quantity - alreadyReturned,
          cartons: '',
          pcs: '',
          reason: '',
        };
      }));
    }).catch(() => toast.error(t('sales.retourLoadError')))
      .finally(() => setIsLoading(false));
  }, [saleId, t]);

  const getQty = (item: RetourItem) => {
    const c = parseInt(item.cartons || '0') || 0;
    const p = parseInt(item.pcs || '0') || 0;
    return c * item.pieces_per_package + p;
  };

  const formatQtyDisplay = (qty: number, ppp: number) => {
    if (ppp <= 1) return `${qty}`;
    const cartons = Math.floor(qty / ppp);
    const pcs = qty % ppp;
    return cartons > 0 ? `${cartons}×${ppp}${pcs > 0 ? ` + ${pcs}` : ''}` : `${pcs}`;
  };

  const handleSubmit = async () => {
    const returnItems = items.filter(item => getQty(item) > 0).map(item => ({
      product_id: item.product_id,
      quantity: getQty(item),
      reason: item.reason || undefined,
    }));
    if (returnItems.length === 0) { toast.error(t('sales.retourNoItems')); return; }
    for (const item of items) {
      if (getQty(item) > item.max_qty) { toast.error(`${item.product_name}: ${t('sales.retourExceedsMax')}`); return; }
    }
    setIsSubmitting(true);
    try {
      await salesApi.createReturn(saleId, { items: returnItems, note });
      toast.success(t('sales.retourSuccess'));
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('sales.retourError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(v);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center gap-2.5">
        <ArrowUturnLeftIcon className="w-5 h-5 text-gray-500" strokeWidth={1.8} />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white tracking-tight">{t('sales.retourTitle')}</h2>
          <p className="text-[12px] text-gray-500 dark:text-gray-400 tnum">{saleRef}</p>
        </div>
        <span className="ms-auto inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
          <span className="metric-dot metric-dot-green" aria-hidden />
          {t('sales.approvedInvoice')}
        </span>
      </div>

      <div className="table-pro-wrap">
        <table className="table-pro compact">
          <thead>
            <tr>
              <th className="text-start">{t('sales.product')}</th>
              <th className="text-center">{t('sales.retourSoldQty')}</th>
              <th className="text-center">{t('sales.retourCartons')}</th>
              <th className="text-center">{t('sales.retourPcs')}</th>
              <th className="text-end">{t('sales.retourTotal')}</th>
              <th className="text-start">{t('sales.retourReason')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = getQty(item);
              const isOver = qty > item.max_qty;
              const totalValue = qty * item.unit_price;
              return (
                <tr key={item.product_id}>
                  <td className="t-strong">{item.product_name}</td>
                  <td className="text-center t-muted tnum">
                    {formatQtyDisplay(item.max_qty, item.pieces_per_package)}
                  </td>
                  <td className="text-center">
                    {item.pieces_per_package > 1 ? (
                      <input type="number" min="0" value={item.cartons}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, cartons: e.target.value } : it))}
                        className="w-20 text-center input py-1" placeholder="0" />
                    ) : <span className="text-gray-300 text-sm">—</span>}
                  </td>
                  <td className="text-center">
                    <input type="number" min="0" value={item.pcs}
                      onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, pcs: e.target.value } : it))}
                      className={`w-20 text-center input py-1 ${isOver ? 'border-red-400 ring-1 ring-red-200' : ''}`} placeholder="0" />
                  </td>
                  <td className="text-end tnum">
                    {isOver ? (
                      <div className="inline-flex flex-col items-end">
                        <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                          <span className="metric-dot metric-dot-red" aria-hidden />
                          {formatCurrency(totalValue)}
                        </span>
                        <span className="text-[10px] font-normal text-gray-500 dark:text-gray-400">{t('sales.retourExceedsMax')}</span>
                      </div>
                    ) : qty > 0 ? (
                      <span className="font-medium">{formatCurrency(totalValue)}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td>
                    <input type="text" value={item.reason}
                      onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, reason: e.target.value } : it))}
                      className="input py-1 w-full" placeholder={t('sales.retourReasonPlaceholder')} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('sales.retourNote')}</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          className="input w-full resize-none" placeholder={t('sales.retourNotePlaceholder')} />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="btn btn-secondary text-[13px] h-8 px-3">{t('sales.cancel')}</button>
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="btn btn-primary text-[13px] h-8 px-3 disabled:opacity-50">
          <ArrowUturnLeftIcon className="w-4 h-4" strokeWidth={1.8} />
          {isSubmitting ? '...' : t('sales.retourSubmit')}
        </button>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const { t, locale, dir } = useLocale();

  const salesTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="sales-title"]',
      title: t('sales.tourPageTitle'),
      desc: t('sales.tourPageDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="sales-add"]',
      title: t('sales.tourAddTitle'),
      desc: t('sales.tourAddDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="sales-debtors"]',
      title: t('sales.tourDebtorsTitle'),
      desc: t('sales.tourDebtorsDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="sales-kpis"]',
      title: t('sales.tourKpisTitle'),
      desc: t('sales.tourKpisDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="sales-profit"]',
      title: t('sales.tourProfitTitle'),
      desc: t('sales.tourProfitDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="sales-tabs"]',
      title: t('sales.tourTabsTitle'),
      desc: t('sales.tourTabsDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="sales-filters"]',
      title: t('sales.tourFiltersTitle'),
      desc: t('sales.tourFiltersDesc'),
      position: 'bottom',
    },
  ], [t]);

  // Tab state
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'list', type: 'list', title: t('sales.invoicesList') }
  ]);
  const [activeTabId, setActiveTabId] = useState('list');
  const [showTour, setShowTour] = useState(false);

  // Update list tab title when locale changes
  useEffect(() => {
    setTabs(prev => prev.map(tab =>
      tab.id === 'list' ? { ...tab, title: t('sales.invoicesList') } : tab
    ));
  }, [locale, t]);

  // List data
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Data for filters
  const [clients, setClients] = useState<Client[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Generate unique tab ID
  const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Open new tab
  const openNewTab = useCallback(() => {
    const newTab: Tab = {
      id: generateTabId(),
      type: 'new',
      title: t('sales.newInvoice'),
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [t]);

  // Open edit tab
  const openEditTab = useCallback((saleId: number, reference: string) => {
    // Check if tab already exists
    const existingTab = tabs.find(t => t.type === 'edit' && t.saleId === saleId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: Tab = {
      id: generateTabId(),
      type: 'edit',
      title: t('sales.editRef', { ref: reference }),
      saleId,
      reference,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs, t]);

  // Close tab
  const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (tabId === 'list') return; // Can't close list tab

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveTab = newTabs[closedIndex - 1] || newTabs[0];
        setActiveTabId(newActiveTab.id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  // Handle form success
  const handleFormSuccess = useCallback((tabId: string) => {
    closeTab(tabId);
    setActiveTabId('list');
    fetchData();
  }, [closeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        openNewTab();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId !== 'list') {
          closeTab(activeTabId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openNewTab, closeTab, activeTabId]);

  const fetchData = async () => {
    try {
      const response = await salesApi.getAll();
      setSales(response.data.data || response.data);
    } catch (error) {
      toast.error(t('sales.dataLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [clientsRes, warehousesRes] = await Promise.all([
        clientsApi.getAll({ per_page: 1000 }),
        warehousesApi.getAll(),
      ]);
      setClients(clientsRes.data?.data || clientsRes.data || []);
      setWarehouses(warehousesRes.data?.data || warehousesRes.data || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFilterData();
  }, []);

  const handleDelete = async (id: number, isDraft: boolean = false) => {
    const msg = isDraft
      ? t('sales.deleteDraftConfirm')
      : t('sales.deleteInvoiceConfirm');
    if (!confirm(msg)) return;
    try {
      await salesApi.delete(id);
      toast.success(t('sales.deleteSuccess'));
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || t('sales.deleteError');
      toast.error(message);
    }
  };

  const canDelete = () => true;

  const openRetourTab = useCallback((saleId: number, reference: string) => {
    const existingTab = tabs.find(t => t.type === 'retour' && t.saleId === saleId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }
    const newTab: Tab = {
      id: generateTabId(),
      type: 'retour',
      title: `↩ ${reference}`,
      saleId,
      reference,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs]);

  const handleConfirmDraft = async (id: number) => {
    if (!confirm(t('sales.confirmDraftQuestion'))) return;
    try {
      await salesApi.confirm(id);
      toast.success(t('sales.confirmSuccess'));
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || t('sales.confirmError');
      toast.error(message);
    }
  };

  const handleDownloadFacture = async (id: number) => {
    try {
      const response = await salesApi.downloadFacture(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(t('sales.downloadFactureSuccess'));
    } catch (error) {
      toast.error(t('sales.downloadFactureError'));
    }
  };

  const handleDownloadBonLivraison = async (id: number) => {
    try {
      const response = await salesApi.downloadBonLivraison(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bon-livraison-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(t('sales.downloadBonSuccess'));
    } catch (error) {
      toast.error(t('sales.downloadBonError'));
    }
  };

  const intlLocale = locale === 'fr' ? 'fr-DZ' : 'ar-DZ';

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return locale === 'fr' ? '0 DA' : '0 د.ج.';
    return new Intl.NumberFormat(intlLocale, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(intlLocale);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { dot: string; text: string }> = {
      draft:     { dot: 'metric-dot-blue',    text: t('sales.draft') },
      pending:   { dot: 'metric-dot-orange',  text: t('sales.pending') },
      completed: { dot: 'metric-dot-green',   text: t('sales.completed') },
      cancelled: { dot: 'metric-dot-red',     text: t('sales.cancelled') },
    };
    return badges[status] || { dot: 'metric-dot-neutral', text: status };
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, { dot: string; text: string }> = {
      unpaid:  { dot: 'metric-dot-red',    text: t('sales.unpaid') },
      partial: { dot: 'metric-dot-orange', text: t('sales.partial') },
      paid:    { dot: 'metric-dot-green',  text: t('sales.paidBadge') },
    };
    return badges[status] || { dot: 'metric-dot-neutral', text: status };
  };

  const getSourceMeta = (source?: string) => {
    if (source === 'app') return { dot: 'metric-dot-violet', text: t('sales.sourceApp'), Icon: DevicePhoneMobileIcon };
    if (source === 'delivery') return { dot: 'metric-dot-orange', text: t('sales.sourceDelivery'), Icon: TruckIcon };
    return { dot: 'metric-dot-blue', text: t('sales.sourcePlatform'), Icon: ComputerDesktopIcon };
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesRef = s.reference?.toLowerCase().includes(query);
        const matchesClient = s.client?.name?.toLowerCase().includes(query);
        if (!matchesRef && !matchesClient) return false;
      }

      if (statusFilter && s.status !== statusFilter) return false;
      if (paymentStatusFilter && s.payment_status !== paymentStatusFilter) return false;
      if (clientFilter && s.client_id !== parseInt(clientFilter)) return false;
      if (warehouseFilter && s.warehouse_id !== parseInt(warehouseFilter)) return false;
      if (dateFrom && new Date(s.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.date) > new Date(dateTo)) return false;
      if (sourceFilter && s.source !== sourceFilter) return false;

      return true;
    });
  }, [sales, searchTerm, statusFilter, paymentStatusFilter, clientFilter, warehouseFilter, dateFrom, dateTo, sourceFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date === today);

    const parseNum = (val: any) => {
      const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
      return isNaN(num) ? 0 : num;
    };

    // Exclude drafts from financial KPIs
    const countedSales = filteredSales.filter(s => s.status !== 'draft');
    const countedTodaySales = todaySales.filter(s => s.status !== 'draft');

    const totalAmount = countedSales.reduce((sum, s) => sum + parseNum(s.grand_total), 0);
    const totalCost = countedSales.reduce((sum, s) => sum + parseNum(s.total_cost), 0);
    const paidAmount = countedSales.reduce((sum, s) => sum + parseNum(s.paid_amount), 0);
    const dueAmount = countedSales.reduce((sum, s) => sum + parseNum(s.due_amount), 0);
    const todayAmount = countedTodaySales.reduce((sum, s) => sum + parseNum(s.grand_total), 0);
    const profit = totalAmount - totalCost;

    return {
      totalSales: filteredSales.length,
      pendingCount: filteredSales.filter(s => s.status === 'pending').length,
      completedCount: filteredSales.filter(s => s.status === 'completed').length,
      cancelledCount: filteredSales.filter(s => s.status === 'cancelled').length,
      unpaidCount: filteredSales.filter(s => s.payment_status === 'unpaid').length,
      partialCount: filteredSales.filter(s => s.payment_status === 'partial').length,
      paidCount: filteredSales.filter(s => s.payment_status === 'paid').length,
      totalAmount,
      totalCost,
      paidAmount,
      dueAmount,
      profit,
      draftCount: filteredSales.filter(s => s.status === 'draft').length,
      todaySales: countedTodaySales.length,
      todayAmount,
    };
  }, [filteredSales, sales]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setClientFilter('');
    setWarehouseFilter('');
    setDateFrom('');
    setDateTo('');
    setSourceFilter('');
  };

  const hasActiveFilters = searchTerm || statusFilter || paymentStatusFilter || clientFilter || warehouseFilter || dateFrom || dateTo || sourceFilter;

  const getTabIcon = (type: Tab['type']) => {
    switch (type) {
      case 'list':
        return <ListBulletIcon className="w-4 h-4" />;
      case 'new':
        return <DocumentPlusIcon className="w-4 h-4" />;
      case 'edit':
        return <PencilSquareIcon className="w-4 h-4" />;
      case 'retour':
        return <ArrowUturnLeftIcon className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Render tab content
  const renderTabContent = (tab: Tab) => {
    switch (tab.type) {
      case 'list':
        return (
          <div className="space-y-4">
            {/* --- Header --- */}
            <div data-tour="sales-title">
              <PageHeader title={t('sales.title')} subtitle={t('sales.subtitle')}>
                <Link
                  href="/dashboard/sales/debtors"
                  className="btn btn-secondary text-[13px] h-8 px-3"
                  data-tour="sales-debtors"
                >
                  <BanknotesIcon className="w-4 h-4" strokeWidth={1.8} />
                  <span className="hidden md:inline">{t('sales.outstandingDebts')}</span>
                </Link>
                <button
                  onClick={openNewTab}
                  className="btn btn-primary text-[13px] h-8 px-3"
                  data-tour="sales-add"
                >
                  <PlusIcon className="w-4 h-4" strokeWidth={2} />
                  <span className="hidden sm:inline">{t('sales.addSaleInvoice')}</span>
                  <span className="sm:hidden">{t('sales.add')}</span>
                </button>
              </PageHeader>
            </div>

            {/* --- Stats: profit + KPIs unified --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5" data-tour="sales-profit">
              {[
                { label: t('sales.totalCostPrice'),    value: formatCurrency(kpis.totalCost),    dot: 'metric-dot-orange',  currency: true },
                { label: t('sales.totalSellingPrice'), value: formatCurrency(kpis.totalAmount),  dot: 'metric-dot-green',   currency: true },
                { label: t('sales.profitMargin'),      value: formatCurrency(kpis.profit),       dot: kpis.profit >= 0 ? 'metric-dot-blue' : 'metric-dot-red', currency: true },
                { label: t('sales.collected'),         value: formatCurrency(kpis.paidAmount),   dot: 'metric-dot-green',   currency: true },
                { label: t('sales.debts'),             value: formatCurrency(kpis.dueAmount),    dot: 'metric-dot-red',     currency: true },
                { label: t('sales.unpaidCount'),       value: kpis.unpaidCount,                  dot: 'metric-dot-orange',  currency: false },
              ].map((s, i) => (
                <div key={i} className="metric-tile">
                  <div className="flex items-center gap-1.5">
                    <span className={`metric-dot ${s.dot}`} aria-hidden />
                    <p className="metric-label truncate">{s.label}</p>
                  </div>
                  {s.currency ? (
                    <p className="metric-value-currency">{s.value}</p>
                  ) : (
                    <p className="metric-value tnum truncate">{s.value}</p>
                  )}
                </div>
              ))}
            </div>

            {/* --- Counts row --- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5" data-tour="sales-kpis">
              {[
                { label: t('sales.totalInvoices'), value: kpis.totalSales, dot: 'metric-dot-neutral' },
                { label: t('sales.totalSales'),    value: formatCurrency(kpis.totalAmount), dot: 'metric-dot-violet', currency: true },
                { label: t('sales.todaySales'),    value: kpis.todaySales, dot: 'metric-dot-blue', sub: formatCurrency(kpis.todayAmount) },
                { label: t('sales.draft'),         value: kpis.draftCount, dot: 'metric-dot-blue' },
              ].map((s, i) => (
                <div key={i} className="metric-tile">
                  <div className="flex items-center gap-1.5">
                    <span className={`metric-dot ${s.dot}`} aria-hidden />
                    <p className="metric-label truncate">{s.label}</p>
                  </div>
                  {s.currency ? (
                    <p className="metric-value-currency">{s.value}</p>
                  ) : (
                    <p className="metric-value tnum truncate">{s.value}</p>
                  )}
                  {s.sub && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 tnum">{s.sub}</p>}
                </div>
              ))}
            </div>

            {/* --- Filters --- */}
            <div data-tour="sales-filters">
              <FilterBar
                search={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={t('sales.searchPlaceholder')}
                trailing={hasActiveFilters ? (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <XMarkIcon className="w-3.5 h-3.5" />
                    {t('sales.clearAll')}
                  </button>
                ) : undefined}
              >
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select text-[14px] py-2">
                  <option value="">{t('sales.allStatuses')}</option>
                  <option value="draft">{t('sales.draft')}</option>
                  <option value="pending">{t('sales.pending')}</option>
                  <option value="completed">{t('sales.completed')}</option>
                  <option value="cancelled">{t('sales.cancelled')}</option>
                </select>
                <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="select text-[14px] py-2">
                  <option value="">{t('sales.paymentStatus')}</option>
                  <option value="unpaid">{t('sales.unpaid')}</option>
                  <option value="partial">{t('sales.partial')}</option>
                  <option value="paid">{t('sales.paidBadge')}</option>
                </select>
                <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="select text-[14px] py-2">
                  <option value="">{t('sales.allClients')}</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
                <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="select text-[14px] py-2">
                  <option value="">{t('sales.allWarehouses')}</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="select text-[14px] py-2">
                  <option value="">{t('sales.allSources')}</option>
                  <option value="web">{t('sales.fromPlatform')}</option>
                  <option value="app">{t('sales.fromApp')}</option>
                  <option value="delivery">{t('sales.fromDelivery')}</option>
                </select>
                <DateInput value={dateFrom} onChange={(v) => setDateFrom(v)} placeholder={t('sales.fromDate')} />
                <DateInput value={dateTo} onChange={(v) => setDateTo(v)} placeholder={t('sales.toDate')} />
              </FilterBar>
            </div>

            {/* --- Table --- */}
            <div data-tour="sales-table">
              {isLoading ? (
                <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>
              ) : (
                <div className="table-pro-wrap">
                  <table className="table-pro compact">
                    <thead>
                      <tr>
                        <th className="text-start">{t('sales.reference')}</th>
                        <th className="text-start">{t('sales.client')}</th>
                        <th className="text-start">{t('sales.warehouse')}</th>
                        <th className="text-end">{t('sales.date')}</th>
                        <th className="text-end">{t('sales.cost')}</th>
                        <th className="text-end">{t('sales.total')}</th>
                        <th className="text-end">{t('sales.profit')}</th>
                        <th className="text-end">{t('sales.paid')}</th>
                        <th className="text-end">{t('sales.remaining')}</th>
                        <th className="text-start">{t('sales.status')}</th>
                        <th className="text-start">{t('sales.payment')}</th>
                        <th className="text-start">{t('sales.source')}</th>
                        <th className="text-end">{t('sales.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="t-empty">
                            <div className="flex flex-col items-center gap-2 py-6">
                              <DocumentTextIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                              <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{t('sales.noSaleInvoices')}</p>
                              <p className="text-[12px] text-gray-400 dark:text-gray-500">{t('sales.tryChangeFilters')}</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((sale) => {
                          const statusBadge = getStatusBadge(sale.status);
                          const paymentBadge = getPaymentBadge(sale.payment_status);
                          const sourceMeta = getSourceMeta(sale.source);
                          const profit = Number(sale.grand_total) - Number(sale.total_cost ?? 0);
                          const SourceIcon = sourceMeta.Icon;
                          return (
                            <tr key={sale.id}>
                              <td>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{sale.reference}</span>
                                  {(sale.returns_count ?? 0) > 0 && (
                                    <span
                                      title={t('sales.hasReturn')}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300"
                                    >
                                      <span className="metric-dot metric-dot-orange" aria-hidden />
                                      <ArrowUturnLeftIcon className="w-3 h-3" />
                                      {sale.returns_count}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="t-strong">{sale.client?.name || t('sales.cashClient')}</td>
                              <td className="t-muted">{sale.warehouse?.name || '-'}</td>
                              <td className="tnum">{formatDate(sale.date)}</td>
                              <td className="tnum text-end">{formatCurrency(sale.total_cost ?? 0)}</td>
                              <td className="tnum text-end font-medium">{formatCurrency(sale.grand_total)}</td>
                              <td className="tnum text-end">
                                {profit < 0 ? (
                                  <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                                    <span className="metric-dot metric-dot-red" aria-hidden />
                                    {formatCurrency(profit)}
                                  </span>
                                ) : (
                                  <span className="font-medium">{formatCurrency(profit)}</span>
                                )}
                              </td>
                              <td className="tnum text-end">{formatCurrency(sale.paid_amount)}</td>
                              <td className="tnum text-end">
                                {Number(sale.due_amount) > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                    <span className="metric-dot metric-dot-red" aria-hidden />
                                    {formatCurrency(sale.due_amount)}
                                  </span>
                                ) : (
                                  formatCurrency(sale.due_amount)
                                )}
                              </td>
                              <td>
                                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                  <span className={`metric-dot ${statusBadge.dot}`} aria-hidden />
                                  {statusBadge.text}
                                </span>
                              </td>
                              <td>
                                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                  <span className={`metric-dot ${paymentBadge.dot}`} aria-hidden />
                                  {paymentBadge.text}
                                </span>
                              </td>
                              <td>
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                    <span className={`metric-dot ${sourceMeta.dot}`} aria-hidden />
                                    <SourceIcon className="w-3.5 h-3.5" strokeWidth={1.7} />
                                    {sourceMeta.text}
                                  </span>
                                  {sale.user && (
                                    <span className="text-[10.5px] text-gray-500 dark:text-gray-400 ms-3.5">{sale.user.name}</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="flex justify-end gap-1">
                                  {sale.status === 'completed' && (
                                    <button
                                      onClick={() => openRetourTab(sale.id, sale.reference)}
                                      className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      title={t('sales.retourButton')}
                                    >
                                      <ArrowUturnLeftIcon className="w-4 h-4" strokeWidth={1.7} />
                                    </button>
                                  )}
                                  {sale.status === 'draft' && (
                                    <button
                                      onClick={() => handleConfirmDraft(sale.id)}
                                      className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                      title={t('sales.confirmInvoice')}
                                    >
                                      <CheckCircleIcon className="w-4 h-4" strokeWidth={1.7} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => openEditTab(sale.id, sale.reference)}
                                    className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title={t('sales.edit')}
                                  >
                                    <PencilIcon className="w-4 h-4" strokeWidth={1.7} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(sale.id, sale.status === 'draft')}
                                    className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title={sale.status === 'draft' ? t('sales.delete') : t('sales.cancelInvoice')}
                                  >
                                    <TrashIcon className="w-4 h-4" strokeWidth={1.7} />
                                  </button>
                                  <Link
                                    href={`/dashboard/sales/${sale.id}`}
                                    className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title={t('sales.viewInvoice')}
                                  >
                                    <EyeIcon className="w-4 h-4" strokeWidth={1.7} />
                                  </Link>
                                  <button
                                    onClick={() => handleDownloadFacture(sale.id)}
                                    className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title={t('sales.downloadInvoicePdf')}
                                  >
                                    <ArrowDownTrayIcon className="w-4 h-4" strokeWidth={1.7} />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadBonLivraison(sale.id)}
                                    className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    title="Bon de Livraison"
                                  >
                                    <TruckIcon className="w-4 h-4" strokeWidth={1.7} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'new':
        return (
          <SaleForm
            key={tab.id}
            onSuccess={() => handleFormSuccess(tab.id)}
            onCancel={() => closeTab(tab.id)}
          />
        );

      case 'edit':
        return (
          <SaleForm
            key={tab.id}
            saleId={tab.saleId}
            onSuccess={() => handleFormSuccess(tab.id)}
            onCancel={() => closeTab(tab.id)}
          />
        );

      case 'retour':
        return (
          <SaleRetourForm
            key={tab.id}
            saleId={tab.saleId!}
            onSuccess={() => { closeTab(tab.id); fetchData(); }}
            onCancel={() => closeTab(tab.id)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Shortcuts hint — quiet, neutral */}
      <div className="hidden sm:flex items-center gap-5 text-[12px] text-gray-500 dark:text-gray-400 px-3 py-1.5 mb-2 border border-gray-200/80 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
        <span className="font-medium text-gray-600 dark:text-gray-300">{t('sales.shortcuts')}</span>
        <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-600 dark:text-gray-300">Insert</kbd> {t('sales.newInvoiceShortcut')}</span>
        <span><kbd className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-600 dark:text-gray-300">Ctrl+W</kbd> {t('sales.closeTabShortcut')}</span>
        <button
          onClick={() => setShowTour(true)}
          className={`${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors`}
          title={t('sales.guidedTour')}
        >
          <QuestionMarkCircleIcon className="w-4 h-4" strokeWidth={1.8} />
          {t('sales.guidedTour')}
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 px-2 pt-2 overflow-x-auto" data-tour="sales-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors cursor-pointer
              ${activeTabId === tab.id
                ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-700 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {getTabIcon(tab.type)}
            <span className="max-w-[150px] truncate">{tab.title}</span>
            {tab.type !== 'list' && (
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* Add New Tab Button */}
        <button
          onClick={openNewTab}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title={t('sales.newInvoiceTab')}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white dark:bg-gray-800 p-4 overflow-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTabId === tab.id ? 'block' : 'hidden'}
          >
            {renderTabContent(tab)}
          </div>
        ))}
      </div>

      {showTour && (
        <GuidedTour
          steps={salesTourSteps}
          storageKey="sales_tour_step"
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
