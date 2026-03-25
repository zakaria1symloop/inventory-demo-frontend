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
      setItems((sale.items || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product?.name || '',
        pieces_per_package: item.product?.pieces_per_package > 1 ? item.product.pieces_per_package : 1,
        unit_price: item.unit_price,
        max_qty: item.quantity,
        cartons: '',
        pcs: '',
        reason: '',
      })));
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
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
          <ArrowUturnLeftIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('sales.retourTitle')}</h2>
          <p className="text-sm text-gray-400">{saleRef}</p>
        </div>
        <span className="ms-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          {t('sales.approvedInvoice')}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('sales.product')}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('sales.retourSoldQty')}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('sales.retourCartons')}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('sales.retourPcs')}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('sales.retourTotal')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('sales.retourReason')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((item, idx) => {
                const qty = getQty(item);
                const isOver = qty > item.max_qty;
                const totalValue = qty * item.unit_price;
                return (
                  <tr key={item.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{item.product_name}</td>
                    <td className="px-4 py-3 text-center text-gray-500 tabular-nums text-sm">
                      {formatQtyDisplay(item.max_qty, item.pieces_per_package)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.pieces_per_package > 1 ? (
                        <input type="number" min="0" value={item.cartons}
                          onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, cartons: e.target.value } : it))}
                          className="w-20 text-center input py-1" placeholder="0" />
                      ) : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="number" min="0" value={item.pcs}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, pcs: e.target.value } : it))}
                        className={`w-20 text-center input py-1 ${isOver ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}`} placeholder="0" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`font-semibold tabular-nums ${isOver ? 'text-red-600' : qty > 0 ? 'text-orange-600' : 'text-gray-300'}`}>
                        {qty > 0 ? formatCurrency(totalValue) : '—'}
                        {isOver && <div className="text-[10px] font-normal text-red-500">{t('sales.retourExceedsMax')}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('sales.retourNote')}</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          className="input w-full resize-none" placeholder={t('sales.retourNotePlaceholder')} />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="btn btn-secondary">{t('sales.cancel')}</button>
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-orange-500 hover:bg-orange-600 shadow-md active:scale-[0.98] transition-all disabled:opacity-50">
          <ArrowUturnLeftIcon className="w-4 h-4" />
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

  const canDelete = (sale: Sale) => {
    return sale.status !== 'cancelled' && sale.status !== 'completed';
  };

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
    const badges: Record<string, { class: string; text: string }> = {
      draft: { class: 'badge-info', text: t('sales.draft') },
      pending: { class: 'badge-warning', text: t('sales.pending') },
      completed: { class: 'badge-success', text: t('sales.completed') },
      cancelled: { class: 'badge-danger', text: t('sales.cancelled') },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      unpaid: { class: 'badge-danger', text: t('sales.unpaid') },
      partial: { class: 'badge-warning', text: t('sales.partial') },
      paid: { class: 'badge-success', text: t('sales.paidBadge') },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
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
        return <ArrowUturnLeftIcon className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  // Render tab content
  const renderTabContent = (tab: Tab) => {
    switch (tab.type) {
      case 'list':
        return (
          <div className="space-y-5">
            {/* --- Header --- */}
            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
              <div data-tour="sales-title" className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <DocumentTextIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('sales.title')}</h1>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5">{t('sales.subtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href="/dashboard/sales/debtors"
                  className="group inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-200"
                  data-tour="sales-debtors"
                >
                  <BanknotesIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {t('sales.outstandingDebts')}
                </Link>
                <button
                  onClick={openNewTab}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] transition-all duration-200"
                  data-tour="sales-add"
                >
                  <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                  <span className="hidden sm:inline">{t('sales.addSaleInvoice')}</span>
                  <span className="sm:hidden">{t('sales.add')}</span>
                  <kbd className="hidden sm:inline bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">Insert</kbd>
                </button>
              </div>
            </div>

            {/* --- Profit Strip --- */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="sales-profit">
              <div className={`grid grid-cols-1 md:grid-cols-3 md:divide-x ${dir === 'rtl' ? 'md:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
                <div className="group relative p-5 hover:bg-orange-50/40 dark:hover:bg-orange-900/10 transition-colors duration-200">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-2.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                    </div>
                    <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{formatCurrency(kpis.totalCost)}</div>
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('sales.totalCostPrice')}</div>
                  </div>
                </div>
                <div className="group relative p-5 hover:bg-green-50/40 dark:hover:bg-green-900/10 transition-colors duration-200">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{formatCurrency(kpis.totalAmount)}</div>
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('sales.totalSellingPrice')}</div>
                  </div>
                </div>
                <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-200">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <div className={`text-lg font-black tabular-nums leading-none ${kpis.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(kpis.profit)}</div>
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('sales.profitMargin')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- KPI Strip --- */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="sales-kpis">
              <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 sm:divide-x ${dir === 'rtl' ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
                <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-200">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2.5">
                      <span className="text-sm font-black">#</span>
                    </div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.totalSales}</div>
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('sales.totalInvoices')}</div>
                  </div>
                </div>

                <div className="group relative p-5 hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors duration-200">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-2.5">
                      <BanknotesIcon className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{formatCurrency(kpis.totalAmount)}</div>
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('sales.totalSales')}</div>
                  </div>
                </div>

                <div className="group relative p-5 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors duration-200">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2.5">
                      <CheckCircleIcon className="w-4 h-4" />
                    </div>
                    <div className="text-lg font-black text-emerald-600 tabular-nums leading-none">{formatCurrency(kpis.paidAmount)}</div>
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('sales.collected')}</div>
                  </div>
                </div>

                <div className="group relative p-5 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors duration-200">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="text-lg font-black text-red-600 tabular-nums leading-none">{formatCurrency(kpis.dueAmount)}</div>
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('sales.debts')}</div>
                  </div>
                </div>

                <div className="group relative p-5 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors duration-200">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-2.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="text-3xl font-black text-indigo-600 tabular-nums leading-none">{kpis.todaySales}</div>
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('sales.todaySales')}</div>
                    <div className="text-[10px] text-indigo-400 mt-0.5">{formatCurrency(kpis.todayAmount)}</div>
                  </div>
                </div>

                <div className="group relative p-5 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors duration-200">
                  <div className="absolute top-0 inset-x-0 h-[3px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-2.5">
                      <XMarkIcon className="w-4 h-4" />
                    </div>
                    <div className="text-3xl font-black text-amber-600 tabular-nums leading-none">{kpis.unpaidCount}</div>
                    <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('sales.unpaidCount')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Filters --- */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="sales-filters">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-200/70 dark:bg-gray-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('sales.filters')}</span>
                  {hasActiveFilters && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{t('sales.active')}</span>
                  )}
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1.5 rounded-lg transition-colors">
                    <XMarkIcon className="w-3.5 h-3.5" />
                    {t('sales.clearAll')}
                  </button>
                )}
              </div>

              <div className="p-5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('sales.searchPlaceholder')}
                    className="input"
                  />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select">
                    <option value="">{t('sales.allStatuses')}</option>
                    <option value="draft">{t('sales.draft')}</option>
                    <option value="pending">{t('sales.pending')}</option>
                    <option value="completed">{t('sales.completed')}</option>
                    <option value="cancelled">{t('sales.cancelled')}</option>
                  </select>
                  <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="select">
                    <option value="">{t('sales.paymentStatus')}</option>
                    <option value="unpaid">{t('sales.unpaid')}</option>
                    <option value="partial">{t('sales.partial')}</option>
                    <option value="paid">{t('sales.paidBadge')}</option>
                  </select>
                  <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="select">
                    <option value="">{t('sales.allClients')}</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="select">
                    <option value="">{t('sales.allWarehouses')}</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                  <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="select">
                    <option value="">{t('sales.allSources')}</option>
                    <option value="web">{t('sales.fromPlatform')}</option>
                    <option value="app">{t('sales.fromApp')}</option>
                    <option value="delivery">{t('sales.fromDelivery')}</option>
                  </select>
                  <DateInput value={dateFrom} onChange={(v) => setDateFrom(v)} placeholder={t('sales.fromDate')} />
                  <DateInput value={dateTo} onChange={(v) => setDateTo(v)} placeholder={t('sales.toDate')} />
                </div>
              </div>
            </div>

            {/* --- Table --- */}
            <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="sales-table">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('sales.invoicesList')}</h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 tabular-nums">
                    {filteredSales.length}
                  </span>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>{t('sales.reference')}</th>
                        <th>{t('sales.client')}</th>
                        <th>{t('sales.warehouse')}</th>
                        <th>{t('sales.date')}</th>
                        <th>{t('sales.cost')}</th>
                        <th>{t('sales.total')}</th>
                        <th>{t('sales.profit')}</th>
                        <th>{t('sales.paid')}</th>
                        <th>{t('sales.remaining')}</th>
                        <th>{t('sales.status')}</th>
                        <th>{t('sales.payment')}</th>
                        <th>{t('sales.source')}</th>
                        <th>{t('sales.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="text-center py-16">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <DocumentTextIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">{t('sales.noSaleInvoices')}</p>
                                <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{t('sales.tryChangeFilters')}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((sale) => {
                          const statusBadge = getStatusBadge(sale.status);
                          const paymentBadge = getPaymentBadge(sale.payment_status);
                          return (
                            <tr key={sale.id} className="group hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors duration-150">
                              <td className="font-bold text-emerald-600">{sale.reference}</td>
                              <td className="font-medium text-gray-700 dark:text-gray-200">{sale.client?.name || t('sales.cashClient')}</td>
                              <td>{sale.warehouse?.name || '-'}</td>
                              <td className="tabular-nums">{formatDate(sale.date)}</td>
                              <td className="text-orange-600 tabular-nums">{formatCurrency(sale.total_cost ?? 0)}</td>
                              <td className="font-medium tabular-nums">{formatCurrency(sale.grand_total)}</td>
                              <td className={`font-bold tabular-nums ${(Number(sale.grand_total) - Number(sale.total_cost ?? 0)) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(Number(sale.grand_total) - Number(sale.total_cost ?? 0))}
                              </td>
                              <td className="text-emerald-600 font-medium tabular-nums">{formatCurrency(sale.paid_amount)}</td>
                              <td className="text-red-600 tabular-nums">{formatCurrency(sale.due_amount)}</td>
                              <td><span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span></td>
                              <td><span className={`badge ${paymentBadge.class}`}>{paymentBadge.text}</span></td>
                              <td className="text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    sale.source === 'app'
                                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                                      : sale.source === 'delivery'
                                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                      : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
                                  }`}>
                                    {sale.source === 'app' ? (
                                      <>
                                        <DevicePhoneMobileIcon className="w-3 h-3" />
                                        {t('sales.sourceApp')}
                                      </>
                                    ) : sale.source === 'delivery' ? (
                                      <>
                                        <TruckIcon className="w-3 h-3" />
                                        {t('sales.sourceDelivery')}
                                      </>
                                    ) : (
                                      <>
                                        <ComputerDesktopIcon className="w-3 h-3" />
                                        {t('sales.sourcePlatform')}
                                      </>
                                    )}
                                  </span>
                                  {sale.user && (
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{sale.user.name}</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="flex gap-1.5">
                                  {sale.status === 'completed' ? (
                                    <button
                                      onClick={() => openRetourTab(sale.id, sale.reference)}
                                      className="p-1.5 rounded-lg text-orange-500 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
                                      title={t('sales.retourButton')}
                                    >
                                      <ArrowUturnLeftIcon className="w-5 h-5" />
                                    </button>
                                  ) : (
                                    <>
                                      {sale.status === 'draft' && (
                                        <button
                                          onClick={() => handleConfirmDraft(sale.id)}
                                          className="p-1.5 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                                          title={t('sales.confirmInvoice')}
                                        >
                                          <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => openEditTab(sale.id, sale.reference)}
                                        className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
                                        title={t('sales.edit')}
                                      >
                                        <PencilIcon className="w-5 h-5" />
                                      </button>
                                      {canDelete(sale) && (
                                        <button onClick={() => handleDelete(sale.id, sale.status === 'draft')} className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors" title={sale.status === 'draft' ? t('sales.delete') : t('sales.cancelInvoice')}>
                                          <TrashIcon className="w-5 h-5" />
                                        </button>
                                      )}
                                    </>
                                  )}
                                  <Link href={`/dashboard/sales/${sale.id}`} className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors" title={t('sales.viewInvoice')}>
                                    <EyeIcon className="w-5 h-5" />
                                  </Link>
                                  <button onClick={() => handleDownloadFacture(sale.id)} className="p-1.5 rounded-lg text-red-600 hover:text-red-800 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors" title={t('sales.downloadInvoicePdf')}>
                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => handleDownloadBonLivraison(sale.id)} className="p-1.5 rounded-lg text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors" title="Bon de Livraison">
                                    <TruckIcon className="w-5 h-5" />
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
      {/* Shortcuts hint */}
      <div className="bg-gradient-to-l from-slate-800 to-slate-900 text-slate-300 px-4 py-2 rounded-xl mb-2 hidden sm:flex items-center gap-6 text-sm shadow-sm">
        <span className="font-bold text-white text-xs tracking-wide">{t('sales.shortcuts')}</span>
        <span><kbd className="bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-mono">Insert</kbd> {t('sales.newInvoiceShortcut')}</span>
        <span><kbd className="bg-red-600/30 text-red-300 px-2 py-0.5 rounded-md text-[10px] font-mono">Ctrl+W</kbd> {t('sales.closeTabShortcut')}</span>
        <button
          onClick={() => setShowTour(true)}
          className={`${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors`}
          title={t('sales.guidedTour')}
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
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
