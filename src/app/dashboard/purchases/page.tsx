'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { purchasesApi, suppliersApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import PurchaseForm from './_components/PurchaseForm';
import DateInput from '@/components/ui/DateInput';
import {
  PlusIcon,
  XMarkIcon,
  ListBulletIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  EyeIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
  BanknotesIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';

interface Purchase {
  id: number;
  reference: string;
  supplier_id: number;
  warehouse_id: number;
  date: string;
  total_amount: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: 'pending' | 'received' | 'partial';
  payment_status: 'unpaid' | 'partial' | 'paid';
  note?: string;
  supplier?: { id: number; name: string };
  warehouse?: { id: number; name: string };
  returns_count?: number;
  returns_total?: number;
}

interface Tab {
  id: string;
  type: 'list' | 'new' | 'edit' | 'view' | 'retour';
  title: string;
  purchaseId?: number;
  reference?: string;
}

interface PurchaseRetourItem {
  product_id: number;
  product_name: string;
  pieces_per_package: number;
  unit_price: number;
  max_qty: number;
  cartons: string;
  pcs: string;
  reason: string;
}

function PurchaseRetourForm({ purchaseId, onSuccess, onCancel }: { purchaseId: number; onSuccess: () => void; onCancel: () => void }) {
  const { t, locale } = useLocale();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchaseRef, setPurchaseRef] = useState('');
  const [items, setItems] = useState<PurchaseRetourItem[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    purchasesApi.getOne(purchaseId).then(res => {
      const purchase = res.data;
      setPurchaseRef(purchase.reference || '');
      const returns = purchase.returns || [];
      setItems((purchase.items || []).map((item: any) => {
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
    }).catch(() => toast.error(t('purchases.prRetourLoadError')))
      .finally(() => setIsLoading(false));
  }, [purchaseId, t]);

  const getQty = (item: PurchaseRetourItem) => {
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
    if (returnItems.length === 0) { toast.error(t('purchases.prRetourNoItems')); return; }
    for (const item of items) {
      if (getQty(item) > item.max_qty) { toast.error(`${item.product_name}: ${t('purchases.prRetourExceedsMax')}`); return; }
    }
    setIsSubmitting(true);
    try {
      await purchasesApi.createReturn(purchaseId, { items: returnItems, note });
      toast.success(t('purchases.prRetourSuccess'));
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('purchases.prRetourError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(v);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;

  return (
    <div className="space-y-5 w-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
          <ArrowUturnLeftIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('purchases.prRetourTitle')}</h2>
          <p className="text-sm text-gray-400">{purchaseRef}</p>
        </div>
        <span className="ms-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          {t('purchases.prApprovedPurchase')}
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="text-start px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('purchases.product')}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('purchases.prRetourPurchasedQty')}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('purchases.prRetourCartons')}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('purchases.prRetourPcs')}</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('purchases.prRetourTotal')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{t('purchases.prRetourReason')}</th>
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
                        {isOver && <div className="text-[10px] font-normal text-red-500">{t('purchases.prRetourExceedsMax')}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input type="text" value={item.reason}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, reason: e.target.value } : it))}
                        className="input py-1 w-full" placeholder={t('purchases.prRetourReasonPlaceholder')} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('purchases.prRetourNote')}</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
          className="input w-full resize-none" placeholder={t('purchases.prRetourNotePlaceholder')} />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="btn btn-secondary">{t('purchases.cancel')}</button>
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50">
          <ArrowUturnLeftIcon className="w-4 h-4" />
          {isSubmitting ? '...' : t('purchases.prRetourSubmit')}
        </button>
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  const { t, locale, dir } = useLocale();

  const purchasesTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="purchases-title"]',
      title: t('purchases.tourTitle'),
      desc: t('purchases.tourDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="purchases-add"]',
      title: t('purchases.tourAddTitle'),
      desc: t('purchases.tourAddDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="purchases-creditors"]',
      title: t('purchases.tourCreditorsTitle'),
      desc: t('purchases.tourCreditorsDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="purchases-tabs"]',
      title: t('purchases.tourTabsTitle'),
      desc: t('purchases.tourTabsDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="purchases-filters"]',
      title: t('purchases.tourFiltersTitle'),
      desc: t('purchases.tourFiltersDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="purchases-table"]',
      title: t('purchases.tourTableTitle'),
      desc: t('purchases.tourTableDesc'),
      position: 'top',
    },
  ], [t]);

  // Tab state
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'list', type: 'list', title: t('purchases.invoicesList') }
  ]);
  const [activeTabId, setActiveTabId] = useState('list');
  const [showTour, setShowTour] = useState(false);

  // List data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasReturnFilter, setHasReturnFilter] = useState<'' | 'yes' | 'no'>('');

  // Data for filters
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);

  // Update list tab title when locale changes
  useEffect(() => {
    setTabs(prev => prev.map(tab => {
      if (tab.id === 'list') {
        return { ...tab, title: t('purchases.invoicesList') };
      }
      if (tab.type === 'new') {
        return { ...tab, title: t('purchases.newInvoice') };
      }
      if (tab.type === 'edit' && tab.reference) {
        return { ...tab, title: t('purchases.editRef', { ref: tab.reference }) };
      }
      return tab;
    }));
  }, [locale, t]);

  // Generate unique tab ID
  const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Open new tab
  const openNewTab = useCallback(() => {
    const newTab: Tab = {
      id: generateTabId(),
      type: 'new',
      title: t('purchases.newInvoice'),
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [t]);

  // Open edit tab
  const openEditTab = useCallback((purchaseId: number, reference: string) => {
    // Check if tab already exists
    const existingTab = tabs.find(t => t.type === 'edit' && t.purchaseId === purchaseId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: Tab = {
      id: generateTabId(),
      type: 'edit',
      title: t('purchases.editRef', { ref: reference }),
      purchaseId,
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
      // If closing active tab, switch to previous tab or list
      if (activeTabId === tabId) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveTab = newTabs[closedIndex - 1] || newTabs[0];
        setActiveTabId(newActiveTab.id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  // Handle form success (close tab and refresh list)
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
      const [purchasesRes] = await Promise.all([
        purchasesApi.getAll(),
      ]);
      setPurchases(purchasesRes.data.data || purchasesRes.data);
    } catch (error) {
      toast.error(t('purchases.dataLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [suppliersRes, warehousesRes] = await Promise.all([
        suppliersApi.getAll({ per_page: 1000 }),
        warehousesApi.getAll(),
      ]);
      setSuppliers(suppliersRes.data?.data || suppliersRes.data || []);
      setWarehouses(warehousesRes.data?.data || warehousesRes.data || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchFilterData();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(t('purchases.deleteConfirm'))) return;
    try {
      await purchasesApi.delete(id);
      toast.success(t('purchases.deleteSuccess'));
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.deleteError');
      toast.error(message);
    }
  };

  const canDelete = () => true;

  const openRetourTab = useCallback((purchaseId: number, reference: string) => {
    const existingTab = tabs.find(t => t.type === 'retour' && t.purchaseId === purchaseId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }
    const newTab: Tab = {
      id: generateTabId(),
      type: 'retour',
      title: `↩ ${reference}`,
      purchaseId,
      reference,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs]);

  const handleConfirmPurchase = async (id: number) => {
    if (!confirm(t('purchases.confirmReceiptQuestion'))) return;
    try {
      await purchasesApi.confirm(id);
      toast.success(t('purchases.confirmSuccess'));
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.confirmError');
      toast.error(message);
    }
  };

  const handleDownloadFacture = async (id: number, reference: string) => {
    try {
      const response = await purchasesApi.downloadFacture(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bon-achat-${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('purchases.downloadSuccess'));
    } catch (error) {
      toast.error(t('purchases.downloadError'));
    }
  };

  const handleDownloadBonCommande = async (id: number, reference: string) => {
    try {
      const response = await purchasesApi.downloadBonCommande(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bon-commande-${reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(t('purchases.downloadBonSuccess'));
    } catch (error) {
      toast.error(t('purchases.downloadBonError'));
    }
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return locale === 'fr' ? '0 DZD' : '0 د.ج.';
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'ar-DZ');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { dot: string; text: string }> = {
      pending: { dot: 'metric-dot-orange', text: t('purchases.pending') },
      received: { dot: 'metric-dot-green', text: t('purchases.received') },
      partial: { dot: 'metric-dot-blue', text: t('purchases.partial') },
    };
    return badges[status] || { dot: 'metric-dot-neutral', text: status };
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, { dot: string; text: string }> = {
      unpaid: { dot: 'metric-dot-red', text: t('purchases.unpaidStatus') },
      partial: { dot: 'metric-dot-orange', text: t('purchases.partialStatus') },
      paid: { dot: 'metric-dot-green', text: t('purchases.paidStatus') },
    };
    return badges[status] || { dot: 'metric-dot-neutral', text: status };
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesRef = p.reference?.toLowerCase().includes(query);
        const matchesSupplier = p.supplier?.name?.toLowerCase().includes(query);
        if (!matchesRef && !matchesSupplier) return false;
      }
      if (statusFilter && p.status !== statusFilter) return false;
      if (paymentStatusFilter && p.payment_status !== paymentStatusFilter) return false;
      if (supplierFilter && p.supplier_id !== parseInt(supplierFilter)) return false;
      if (warehouseFilter && p.warehouse_id !== parseInt(warehouseFilter)) return false;
      if (dateFrom && new Date(p.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(p.date) > new Date(dateTo)) return false;
      if (hasReturnFilter === 'yes' && !(p.returns_count && p.returns_count > 0)) return false;
      if (hasReturnFilter === 'no' && p.returns_count && p.returns_count > 0) return false;
      return true;
    });
  }, [purchases, searchTerm, statusFilter, paymentStatusFilter, supplierFilter, warehouseFilter, dateFrom, dateTo, hasReturnFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const parseNum = (val: any) => {
      const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
      return isNaN(num) ? 0 : num;
    };
    const totalAmount = filteredPurchases.reduce((sum, p) => sum + parseNum(p.grand_total), 0);
    const paidAmount = filteredPurchases.reduce((sum, p) => sum + parseNum(p.paid_amount), 0);
    const dueAmount = filteredPurchases.reduce((sum, p) => sum + parseNum(p.due_amount), 0);
    return {
      totalCount: filteredPurchases.length,
      totalAmount,
      paidAmount,
      dueAmount,
      unpaidCount: filteredPurchases.filter(p => p.payment_status === 'unpaid').length,
      partialCount: filteredPurchases.filter(p => p.payment_status === 'partial').length,
      paidCount: filteredPurchases.filter(p => p.payment_status === 'paid').length,
    };
  }, [filteredPurchases]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setSupplierFilter('');
    setWarehouseFilter('');
    setDateFrom('');
    setDateTo('');
    setHasReturnFilter('');
  };

  const hasActiveFilters = searchTerm || statusFilter || paymentStatusFilter || supplierFilter || warehouseFilter || dateFrom || dateTo || hasReturnFilter;

  // Render tab content
  const renderTabContent = (tab: Tab) => {
    switch (tab.type) {
      case 'list':
        return (
          <div className="space-y-4">
            {/* ─── Header ─── */}
            <div data-tour="purchases-title">
              <PageHeader title={t('purchases.title')} subtitle={t('purchases.subtitle')}>
                <Link
                  href="/dashboard/purchases/creditors"
                  className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  data-tour="purchases-creditors"
                >
                  <BanknotesIcon className="w-4 h-4" strokeWidth={1.8} />
                  {t('purchases.supplierDebts')}
                </Link>
                <button
                  onClick={openNewTab}
                  className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                  data-tour="purchases-add"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('purchases.addPurchaseInvoice')}</span>
                  <span className="sm:hidden">{t('purchases.add')}</span>
                  <kbd className="hidden sm:inline bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">Insert</kbd>
                </button>
              </PageHeader>
            </div>

            {/* ─── KPI Strip ─── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { label: t('purchases.totalInvoices'),  value: kpis.totalCount,                  dot: 'metric-dot-neutral', currency: false },
                { label: t('purchases.totalPurchases'), value: formatCurrency(kpis.totalAmount), dot: 'metric-dot-violet',  currency: true },
                { label: t('purchases.paid'),           value: formatCurrency(kpis.paidAmount),  dot: 'metric-dot-green',   currency: true },
                { label: t('purchases.remainingDebts'), value: formatCurrency(kpis.dueAmount),   dot: 'metric-dot-red',     currency: true },
                { label: t('purchases.unpaid'),         value: kpis.unpaidCount,                 dot: 'metric-dot-orange',  currency: false },
                { label: t('purchases.partialPayment'), value: kpis.partialCount,                dot: 'metric-dot-blue',    currency: false },
              ].map((s, i) => (
                <div key={i} className="metric-tile">
                  <div className="flex items-center gap-1.5">
                    <span className={`metric-dot ${s.dot}`} aria-hidden />
                    <p className="metric-label truncate">{s.label}</p>
                  </div>
                  {s.currency ? (
                    <p className="metric-value-currency">{s.value}</p>
                  ) : (
                    <p className="metric-value truncate">{s.value}</p>
                  )}
                </div>
              ))}
            </div>

            {/* ─── Filters ─── */}
            <div data-tour="purchases-filters">
              <FilterBar
                search={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={t('purchases.refOrSupplier')}
                trailing={hasActiveFilters ? (
                  <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2.5 py-1.5 rounded-md transition-colors">
                    <XMarkIcon className="w-3.5 h-3.5" />
                    {t('purchases.clearAll')}
                  </button>
                ) : undefined}
              >
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select text-[14px] py-2">
                  <option value="">{t('purchases.allStatuses')}</option>
                  <option value="pending">{t('purchases.pending')}</option>
                  <option value="received">{t('purchases.received')}</option>
                  <option value="partial">{t('purchases.partial')}</option>
                </select>
                <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="select text-[14px] py-2">
                  <option value="">{t('purchases.paymentStatus')}</option>
                  <option value="unpaid">{t('purchases.unpaidStatus')}</option>
                  <option value="partial">{t('purchases.partialStatus')}</option>
                  <option value="paid">{t('purchases.paidStatus')}</option>
                </select>
                <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="select text-[14px] py-2">
                  <option value="">{t('purchases.allSuppliers')}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="select text-[14px] py-2">
                  <option value="">{t('purchases.allWarehouses')}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                <DateInput value={dateFrom} onChange={(v) => setDateFrom(v)} placeholder={t('purchases.fromDate')} />
                <DateInput value={dateTo} onChange={(v) => setDateTo(v)} placeholder={t('purchases.toDate')} />
                <select value={hasReturnFilter} onChange={(e) => setHasReturnFilter(e.target.value as '' | 'yes' | 'no')} className="select text-[14px] py-2">
                  <option value="">{t('purchases.allReturns')}</option>
                  <option value="yes">{t('purchases.hasReturn')}</option>
                  <option value="no">{t('purchases.noReturn')}</option>
                </select>
              </FilterBar>
            </div>

            {/* ─── Table ─── */}
            <div data-tour="purchases-table">
              {isLoading ? (
                <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>
              ) : (
                <div className="table-pro-wrap">
                  <table className="table-pro">
                    <thead>
                      <tr>
                        <th>{t('purchases.reference')}</th>
                        <th>{t('purchases.supplier')}</th>
                        <th>{t('purchases.warehouse')}</th>
                        <th className="text-end">{t('purchases.date')}</th>
                        <th className="text-end">{t('purchases.total')}</th>
                        <th className="text-end">{t('purchases.paidCol')}</th>
                        <th className="text-end">{t('purchases.remaining')}</th>
                        <th>{t('purchases.status')}</th>
                        <th>{t('purchases.payment')}</th>
                        <th>{t('purchases.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-16">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <ClipboardDocumentListIcon className="w-6 h-6 text-gray-300 dark:text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{t('purchases.noPurchaseInvoices')}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('purchases.tryChangeFilters')}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases.map((purchase) => {
                          const statusBadge = getStatusBadge(purchase.status);
                          const paymentBadge = getPaymentBadge(purchase.payment_status);
                          return (
                            <tr key={purchase.id} className="group">
                              <td className="font-mono font-semibold text-gray-800 dark:text-gray-100">{purchase.reference}</td>
                              <td className="font-medium text-gray-700 dark:text-gray-300">{purchase.supplier?.name || '-'}</td>
                              <td className="text-gray-500">{purchase.warehouse?.name || '-'}</td>
                              <td className="text-gray-500 tnum">{formatDate(purchase.date)}</td>
                              <td className="font-semibold text-gray-800 dark:text-gray-100 tnum">
                                {formatCurrency(purchase.grand_total)}
                                {purchase.returns_total && purchase.returns_total > 0 ? (
                                  <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                    -{formatCurrency(purchase.returns_total)} {locale === 'ar' ? 'مرتجع' : 'retour'}
                                  </div>
                                ) : null}
                              </td>
                              <td className="font-medium text-gray-700 dark:text-gray-200 tnum">{formatCurrency(purchase.paid_amount)}</td>
                              <td className="font-medium text-gray-700 dark:text-gray-200 tnum">{formatCurrency(purchase.due_amount)}</td>
                              <td>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                    <span className={`metric-dot ${statusBadge.dot}`} aria-hidden />
                                    {statusBadge.text}
                                  </span>
                                  {purchase.returns_count && purchase.returns_count > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                      <ArrowUturnLeftIcon className="w-3 h-3" />
                                      {purchase.returns_count}
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td>
                                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                  <span className={`metric-dot ${paymentBadge.dot}`} aria-hidden />
                                  {paymentBadge.text}
                                </span>
                              </td>
                              <td>
                                <div className="flex items-center gap-1">
                                  {purchase.status === 'received' && (
                                    <button onClick={() => openRetourTab(purchase.id, purchase.reference)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" title={t('purchases.prRetourButton')}>
                                      <ArrowUturnLeftIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                  {purchase.status === 'pending' && (
                                    <button onClick={() => handleConfirmPurchase(purchase.id)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" title={t('purchases.confirmReceipt')}>
                                      <CheckCircleIcon className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button onClick={() => openEditTab(purchase.id, purchase.reference)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" title={t('purchases.edit')}>
                                    <PencilSquareIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDelete(purchase.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors" title={t('purchases.delete')}>
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                  <Link href={`/dashboard/purchases/${purchase.id}`} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" title={t('purchases.view')}>
                                    <EyeIcon className="w-4 h-4" />
                                  </Link>
                                  <button onClick={() => handleDownloadFacture(purchase.id, purchase.reference)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" title={t('purchases.purchaseBon')}>
                                    <DocumentTextIcon className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDownloadBonCommande(purchase.id, purchase.reference)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors" title={t('purchases.orderBon')}>
                                    <ClipboardDocumentListIcon className="w-4 h-4" />
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
          <PurchaseForm
            key={tab.id}
            onSuccess={() => handleFormSuccess(tab.id)}
            onCancel={() => closeTab(tab.id)}
          />
        );

      case 'edit':
        return (
          <PurchaseForm
            key={tab.id}
            purchaseId={tab.purchaseId}
            onSuccess={() => handleFormSuccess(tab.id)}
            onCancel={() => closeTab(tab.id)}
          />
        );

      case 'retour':
        return (
          <PurchaseRetourForm
            key={tab.id}
            purchaseId={tab.purchaseId!}
            onSuccess={() => { closeTab(tab.id); fetchData(); }}
            onCancel={() => closeTab(tab.id)}
          />
        );

      default:
        return null;
    }
  };

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

  return (
    <div className="flex flex-col h-full">
      {/* Shortcuts hint */}
      <div className="bg-gradient-to-l from-slate-800 to-slate-900 text-slate-300 px-4 py-2 rounded-xl mb-2 hidden sm:flex items-center gap-6 text-sm shadow-sm">
        <span className="font-bold text-white text-xs tracking-wide">{t('purchases.shortcuts')}</span>
        <span><kbd className="bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-mono">Insert</kbd> {t('purchases.newInvoiceShortcut')}</span>
        <span><kbd className="bg-red-600/30 text-red-300 px-2 py-0.5 rounded-md text-[10px] font-mono">Ctrl+W</kbd> {t('purchases.closeTabShortcut')}</span>
        <button
          onClick={() => { localStorage.removeItem('purchases_tour_step'); setShowTour(true); }}
          className="ms-auto flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          title={t('purchases.guidedTour')}
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
          {t('purchases.guidedTour')}
        </button>
      </div>

      {showTour && (
        <GuidedTour
          steps={purchasesTourSteps}
          storageKey="purchases_tour_step"
          onComplete={() => setShowTour(false)}
        />
      )}

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 pt-2 overflow-x-auto" data-tour="purchases-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors cursor-pointer
              ${activeTabId === tab.id
                ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-blue-600'
                : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }
            `}
          >
            {getTabIcon(tab.type)}
            <span className="max-w-[150px] truncate">{tab.title}</span>
            {tab.type !== 'list' && (
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="p-0.5 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* Add New Tab Button */}
        <button
          onClick={openNewTab}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title={t('purchases.newInvoice')}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white dark:bg-gray-900 p-4 overflow-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTabId === tab.id ? 'block' : 'hidden'}
          >
            {renderTabContent(tab)}
          </div>
        ))}
      </div>
    </div>
  );
}
