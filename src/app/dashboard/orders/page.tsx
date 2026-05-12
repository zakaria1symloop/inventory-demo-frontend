'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, usersApi, clientsApi, warehousesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import DateInput from '@/components/ui/DateInput';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import type { Order, OrderItem } from '@/lib/types';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  UserIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

interface StockItem { product_id: number; quantity: number }

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';
  const storageKey = 'orders_tour_step';

  // STATUS_CONFIG using t() for labels
  const STATUS_CONFIG: Record<string, { label: string; bg: string; darkBg: string; text: string; darkText: string }> = useMemo(() => ({
    pending: { label: t('orders.statusPending'), bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/30', text: 'text-amber-700', darkText: 'dark:text-amber-400' },
    confirmed: { label: t('orders.statusConfirmed'), bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-700', darkText: 'dark:text-blue-400' },
    assigned: { label: t('orders.statusAssigned'), bg: 'bg-cyan-50', darkBg: 'dark:bg-cyan-900/30', text: 'text-cyan-700', darkText: 'dark:text-cyan-400' },
    delivered: { label: t('orders.statusDelivered'), bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/30', text: 'text-emerald-700', darkText: 'dark:text-emerald-400' },
    partial: { label: t('orders.statusPartial'), bg: 'bg-orange-50', darkBg: 'dark:bg-orange-900/30', text: 'text-orange-700', darkText: 'dark:text-orange-400' },
    cancelled: { label: t('orders.statusCancelled'), bg: 'bg-red-50', darkBg: 'dark:bg-red-900/30', text: 'text-red-700', darkText: 'dark:text-red-400' },
  }), [t]);

  const tourSteps: TourStep[] = useMemo(() => [
    { target: '[data-tour="orders-title"]', title: t('orders.tourTitle1'), desc: t('orders.tourDesc1'), position: 'bottom' },
    { target: '[data-tour="orders-kpis"]', title: t('orders.tourTitle2'), desc: t('orders.tourDesc2'), position: 'bottom' },
    { target: '[data-tour="orders-search"]', title: t('orders.tourTitle3'), desc: t('orders.tourDesc3'), position: 'bottom' },
    { target: '[data-tour="orders-chips"]', title: t('orders.tourTitle4'), desc: t('orders.tourDesc4'), position: 'bottom' },
    { target: '[data-tour="orders-cards"]', title: t('orders.tourTitle5'), desc: t('orders.tourDesc5'), position: 'top' },
  ], [t]);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasProblemsFilter, setHasProblemsFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Expand & confirm state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, Order>>({});
  const [confirmQuantities, setConfirmQuantities] = useState<Record<number, number>>({});
  const [warehouseStock, setWarehouseStock] = useState<Record<number, StockItem[]>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  // Cancel dialog
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filter data
  const [sellers, setSellers] = useState<Array<{ id: number; name: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: number; name: string }>>([]);

  // Fetch filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [sellersRes, clientsRes] = await Promise.all([
          usersApi.getSellers(),
          clientsApi.getAll({ per_page: 1000 }),
        ]);
        setSellers(sellersRes.data || []);
        setClients(clientsRes.data?.data || clientsRes.data || []);
      } catch { /* silent */ }
    };
    fetchFilterData();
  }, []);

  // Orders list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', page, search, statusFilter, sellerFilter, clientFilter, dateFrom, dateTo, hasProblemsFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sellerFilter) params.seller_id = sellerFilter;
      if (clientFilter) params.client_id = clientFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (hasProblemsFilter) params.has_problem = true;
      const response = await ordersApi.getAll(params);
      return response.data;
    },
  });

  // All orders for KPIs
  const { data: allOrdersData } = useQuery({
    queryKey: ['orders-stats'],
    queryFn: async () => {
      const response = await ordersApi.getAll({ per_page: 10000 });
      return response.data;
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success(t('orders.toastOrderCancelled'));
      setIsCancelOpen(false);
      setSelectedOrder(null);
      setExpandedId(null);
    },
    onError: () => toast.error(t('orders.toastCancelError')),
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        router.push('/dashboard/orders/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // ─── Expand & Detail ───
  const handleExpand = async (order: Order) => {
    if (expandedId === order.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(order.id);
    setConfirmQuantities({});

    // Fetch order detail if not cached
    if (!orderDetails[order.id]) {
      setLoadingDetail(true);
      try {
        const res = await ordersApi.getOne(order.id);
        const detail = res.data;
        setOrderDetails(prev => ({ ...prev, [order.id]: detail }));
        if (order.status === 'pending' && detail.items) {
          const qtys: Record<number, number> = {};
          detail.items.forEach((item: OrderItem) => {
            qtys[item.id] = item.quantity_ordered;
          });
          setConfirmQuantities(qtys);
        }
      } catch {
        toast.error(t('orders.toastDetailLoadError'));
      } finally {
        setLoadingDetail(false);
      }
    } else {
      const detail = orderDetails[order.id];
      if (order.status === 'pending' && detail.items) {
        const qtys: Record<number, number> = {};
        detail.items.forEach((item: OrderItem) => {
          qtys[item.id] = item.quantity_ordered;
        });
        setConfirmQuantities(qtys);
      }
    }

    // Fetch warehouse stock for pending orders
    if (order.status === 'pending' && order.warehouse_id && !warehouseStock[order.warehouse_id]) {
      try {
        const res = await warehousesApi.getStock(order.warehouse_id);
        setWarehouseStock(prev => ({
          ...prev,
          [order.warehouse_id]: (res.data || []).map((s: Record<string, unknown>) => ({
            product_id: s.product_id as number,
            quantity: Number(s.quantity) || 0,
          })),
        }));
      } catch { /* stock info is supplementary */ }
    }
  };

  // ─── Confirm with quantities ───
  const handleConfirm = async (order: Order) => {
    setIsActioning(true);
    try {
      const detail = orderDetails[order.id];
      const items = detail?.items?.map((item: OrderItem) => ({
        id: item.id,
        quantity_confirmed: confirmQuantities[item.id] ?? item.quantity_ordered,
      }));
      await ordersApi.confirm(order.id, { items });
      toast.success(t('orders.toastConfirmSuccess'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
      setExpandedId(null);
      // Remove cached detail so it refreshes on next expand
      setOrderDetails(prev => {
        const copy = { ...prev };
        delete copy[order.id];
        return copy;
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('orders.toastConfirmError'));
    } finally {
      setIsActioning(false);
    }
  };

  // ─── Create purchase for shortages ───
  const handleCreatePurchase = (order: Order) => {
    const detail = orderDetails[order.id];
    if (!detail?.items) return;
    const shortItems = detail.items.filter((item: OrderItem) => {
      const available = getAvailableStock(order.warehouse_id, item.product_id);
      const needed = confirmQuantities[item.id] ?? item.quantity_ordered;
      return available !== null && available < needed;
    });
    const preFillData = {
      warehouse_id: order.warehouse_id,
      note: t('orders.purchaseNoteTemplate', { reference: order.reference }),
      items: shortItems.map((item: OrderItem) => {
        const available = getAvailableStock(order.warehouse_id, item.product_id) ?? 0;
        const needed = confirmQuantities[item.id] ?? item.quantity_ordered;
        return {
          product_id: item.product_id,
          product_name: item.product?.name || '',
          barcode: item.product?.barcode || '',
          quantity: Math.ceil(needed - available),
          pieces_per_package: item.product?.pieces_per_package || 1,
          unit_price: item.product?.cost_price || 0,
        };
      }),
    };
    sessionStorage.setItem('purchasePreFill', JSON.stringify(preFillData));
    router.push('/dashboard/purchases/new');
  };

  // ─── Helpers ───
  const getAvailableStock = (warehouseId: number, productId: number): number | null => {
    if (!warehouseStock[warehouseId]) return null;
    const s = warehouseStock[warehouseId].find(x => x.product_id === productId);
    return s ? s.quantity : 0;
  };

  const formatCurrency = (value: unknown) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (!isFinite(num)) return locale === 'ar' ? '0 د.ج' : '0 DA';
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-FR', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fmtQty = (val: unknown, ppp?: number): string => {
    const total = Math.round(Number(val) || 0);
    if (total === 0) return '0';
    if (!ppp || ppp <= 1) return String(total);
    const c = Math.floor(total / ppp);
    const p = total % ppp;
    if (c > 0 && p > 0) return `${c} ${t('orders.unitCarton')} ${p} ${t('orders.unitPiece')}`;
    if (c > 0) return `${c} ${t('orders.unitCarton')}`;
    return `${p} ${t('orders.unitPiece')}`;
  };

  const splitQty = (total: number, ppp: number) => ({
    cartons: ppp > 1 ? Math.floor(total / ppp) : total,
    pieces: ppp > 1 ? total % ppp : 0,
  });

  const combineQty = (c: number, p: number, ppp: number) => c * (ppp > 1 ? ppp : 1) + p;

  // ─── KPIs ───
  const kpis = useMemo(() => {
    const orders: Order[] = allOrdersData?.data || [];
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.date === today);
    const totalAmount = orders.reduce((sum, o) => sum + (parseFloat(String(o.grand_total)) || 0), 0);
    const problemOrders = orders.filter(o => o.has_problem).length;
    return {
      totalOrders: orders.length,
      pendingCount: orders.filter(o => o.status === 'pending').length,
      confirmedCount: orders.filter(o => o.status === 'confirmed').length,
      assignedCount: orders.filter(o => o.status === 'assigned').length,
      deliveredCount: orders.filter(o => o.status === 'delivered').length,
      partialCount: orders.filter(o => o.status === 'partial').length,
      cancelledCount: orders.filter(o => o.status === 'cancelled').length,
      todayOrders: todayOrders.length,
      todayPending: todayOrders.filter(o => o.status === 'pending').length,
      totalAmount,
      problemOrders,
    };
  }, [allOrdersData]);

  const clearFilters = () => {
    setStatusFilter('');
    setSellerFilter('');
    setClientFilter('');
    setDateFrom('');
    setDateTo('');
    setHasProblemsFilter(false);
    setSearch('');
    setPage(1);
  };

  const activeFilterCount = [statusFilter, sellerFilter, clientFilter, dateFrom, dateTo, search, hasProblemsFilter ? '1' : ''].filter(Boolean).length;

  const orders: Order[] = data?.data || [];

  // Pagination chevrons based on RTL
  const PrevChevron = isRTL ? ChevronRightIcon : ChevronLeftIcon;
  const NextChevron = isRTL ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="orders-title">
        <div>
          <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-none">{t('orders.title')}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('orders.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { localStorage.removeItem(storageKey); setShowTour(true); }}
            className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
            title={t('orders.tourButton')}
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('orders.tourButton')}</span>
          </button>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('orders.refreshButton')}</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/orders/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            {t('orders.newOrder')}
            <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium ms-1">Insert</kbd>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="orders-kpis">
        <div className={`grid grid-cols-2 sm:grid-cols-4 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          {/* Total Orders */}
          <div className="group relative p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('orders.totalOrders')}</div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.totalOrders}</div>
            </div>
          </div>
          {/* Today Orders */}
          <div className="group relative p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('orders.todayOrders')}</div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.todayOrders}</div>
              {kpis.todayPending > 0 && <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">{t('orders.pendingToday', { count: String(kpis.todayPending) })}</div>}
            </div>
          </div>
          {/* Total Amounts */}
          <div className="group relative p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('orders.totalAmounts')}</div>
              <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{formatCurrency(kpis.totalAmount)}</div>
            </div>
          </div>
          {/* Problems */}
          <div className="group relative p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{t('orders.problems')}</div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.problemOrders}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700" data-tour="orders-search">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
            <input
              type="text"
              placeholder={t('orders.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('orders.filterButton')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1">
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('orders.clearButton')}</span>
            </button>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">{t('orders.orderCount', { count: String(data?.total || 0) })}</span>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('orders.filterStatus')}</label>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-full">
                  <option value="">{t('orders.allStatuses')}</option>
                  <option value="pending">{t('orders.statusPending')}</option>
                  <option value="confirmed">{t('orders.statusConfirmed')}</option>
                  <option value="assigned">{t('orders.statusAssigned')}</option>
                  <option value="delivered">{t('orders.statusDelivered')}</option>
                  <option value="partial">{t('orders.statusPartial')}</option>
                  <option value="cancelled">{t('orders.statusCancelled')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('orders.filterSeller')}</label>
                <select value={sellerFilter} onChange={(e) => { setSellerFilter(e.target.value); setPage(1); }} className="select w-full">
                  <option value="">{t('orders.allSellers')}</option>
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('orders.filterClient')}</label>
                <select value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setPage(1); }} className="select w-full">
                  <option value="">{t('orders.allClients')}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('orders.filterDateFrom')}</label>
                <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder={t('orders.filterDateFrom')} className="w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('orders.filterDateTo')}</label>
                <DateInput value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder={t('orders.filterDateTo')} className="w-full" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer h-10">
                  <input
                    type="checkbox"
                    checked={hasProblemsFilter}
                    onChange={(e) => { setHasProblemsFilter(e.target.checked); setPage(1); }}
                    className="w-4 h-4 text-red-600 rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('orders.filterProblemsOnly')}</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto" data-tour="orders-chips">
          {([
            { value: '', label: t('orders.chipAll'), count: kpis.totalOrders },
            { value: 'pending', label: t('orders.chipPending'), count: kpis.pendingCount },
            { value: 'confirmed', label: t('orders.chipConfirmed'), count: kpis.confirmedCount },
            { value: 'assigned', label: t('orders.chipAssigned'), count: kpis.assignedCount },
            { value: 'delivered', label: t('orders.chipDelivered'), count: kpis.deliveredCount },
            { value: 'partial', label: t('orders.chipPartial'), count: kpis.partialCount },
            { value: 'cancelled', label: t('orders.chipCancelled'), count: kpis.cancelledCount },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === opt.value
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
              {opt.count > 0 && (
                <span className={`text-[10px] ${statusFilter === opt.value ? 'text-orange-200' : 'text-gray-400 dark:text-gray-500'}`}>({opt.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Order Cards */}
        <div className="p-4 space-y-3" data-tour="orders-cards">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><div className="spinner w-8 h-8"></div></div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <ClipboardDocumentListIcon className="w-12 h-12 mb-3" />
              <p className="text-lg font-semibold">{t('orders.noOrders')}</p>
              <p className="text-sm mt-1">{t('orders.noOrdersDesc')}</p>
              <button
                onClick={() => router.push('/dashboard/orders/new')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                {t('orders.createNewOrder')}
              </button>
            </div>
          ) : (
            orders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, bg: 'bg-gray-100', darkBg: 'dark:bg-gray-700', text: 'text-gray-600', darkText: 'dark:text-gray-300' };
              const isExpanded = expandedId === order.id;
              const detail = orderDetails[order.id];
              const items: OrderItem[] = detail?.items || [];
              const hasStockData = order.warehouse_id ? !!warehouseStock[order.warehouse_id] : false;

              return (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                  {/* Card Header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => handleExpand(order)}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        order.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        order.status === 'confirmed' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        order.status === 'assigned' ? 'bg-cyan-100 dark:bg-cyan-900/30' :
                        order.status === 'delivered' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        order.status === 'partial' ? 'bg-orange-100 dark:bg-orange-900/30' :
                        'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        {order.status === 'pending' && <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                        {order.status === 'confirmed' && <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        {order.status === 'assigned' && <TruckIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />}
                        {order.status === 'delivered' && <CheckBadgeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                        {order.status === 'partial' && <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                        {order.status === 'cancelled' && <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100">{order.reference}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusCfg.bg} ${statusCfg.darkBg} ${statusCfg.text} ${statusCfg.darkText}`}>
                            {statusCfg.label}
                          </span>
                          {order.has_problem && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 flex items-center gap-0.5">
                              <ExclamationTriangleIcon className="w-3 h-3" />
                              {t('orders.problemLabel')}
                            </span>
                          )}
                          {order.client?.name && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {order.client.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-400 dark:text-gray-500">
                          {order.seller?.name && (
                            <span className="flex items-center gap-1">
                              <UserIcon className="w-3.5 h-3.5" />
                              {order.seller.name}
                            </span>
                          )}
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="w-3.5 h-3.5" />
                            {formatDate(order.date)}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">·</span>
                          <span className="flex items-center gap-1 font-bold text-gray-600 dark:text-gray-300">
                            <BanknotesIcon className="w-3.5 h-3.5" />
                            {formatCurrency(order.grand_total)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 shrink-0 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                          className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                          title={t('orders.viewDetails')}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => { setSelectedOrder(order); setIsCancelOpen(true); }}
                            className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title={t('orders.cancelButton')}
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <ChevronDownIcon className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20">
                      {loadingDetail ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="spinner w-6 h-6"></div>
                          <span className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>{t('orders.loadingDetails')}</span>
                        </div>
                      ) : (
                        <>
                          {/* Order Info Grid */}
                          <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-b border-gray-100 dark:border-gray-700">
                            <div>
                              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('orders.detailClient')}</span>
                              <div className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{order.client?.name || '-'}</div>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('orders.detailSeller')}</span>
                              <div className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{order.seller?.name || '-'}</div>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('orders.detailWarehouse')}</span>
                              <div className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{order.warehouse?.name || '-'}</div>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('orders.detailTotal')}</span>
                              <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(order.grand_total)}</div>
                            </div>
                          </div>

                          {/* Stock warnings for pending */}
                          {order.status === 'pending' && hasStockData && (() => {
                            const shorts = items.filter(item => {
                              const av = getAvailableStock(order.warehouse_id, item.product_id);
                              const need = confirmQuantities[item.id] ?? item.quantity_ordered;
                              return av !== null && av < need;
                            });
                            if (shorts.length === 0) {
                              return (
                                <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-emerald-50/80 dark:bg-emerald-900/20">
                                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                    <CheckCircleIcon className="w-4 h-4" />
                                    {t('orders.allStockAvailable')}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-red-50/80 dark:bg-red-900/20">
                                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm mb-2">
                                  <ExclamationTriangleIcon className="w-5 h-5" />
                                  {t('orders.insufficientStock')}
                                </div>
                                <div className="space-y-1 mb-3">
                                  {shorts.map(item => {
                                    const av = getAvailableStock(order.warehouse_id, item.product_id) ?? 0;
                                    const need = confirmQuantities[item.id] ?? item.quantity_ordered;
                                    return (
                                      <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-0.5">
                                        <span className="text-red-600 dark:text-red-400 font-medium">{item.product?.name || `#${item.product_id}`}</span>
                                        <span className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
                                          {t('orders.stockAvailable')} <strong>{fmtQty(av, item.product?.pieces_per_package)}</strong> | {t('orders.stockNeeded')} <strong>{fmtQty(need, item.product?.pieces_per_package)}</strong>
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <button
                                  onClick={() => handleCreatePurchase(order)}
                                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors"
                                >
                                  <ShoppingCartIcon className="w-4 h-4" />
                                  {t('orders.createPurchaseButton')}
                                </button>
                              </div>
                            );
                          })()}

                          {/* Items Table */}
                          {items.length > 0 && (
                            <div className="px-5 py-3">
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                      <th className={`${isRTL ? 'text-right' : 'text-left'} text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2`}>{t('orders.thProduct')}</th>
                                      <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('orders.thQuantityOrdered')}</th>
                                      {order.status === 'pending' && hasStockData && (
                                        <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('orders.thAvailable')}</th>
                                      )}
                                      {order.status === 'pending' && (
                                        <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('orders.thConfirmedQty')}</th>
                                      )}
                                      {(order.status === 'confirmed' || order.status === 'assigned') && (
                                        <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('orders.thConfirmed')}</th>
                                      )}
                                      {(order.status === 'delivered' || order.status === 'partial') && (
                                        <>
                                          <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('orders.thConfirmed')}</th>
                                          <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('orders.thDelivered')}</th>
                                        </>
                                      )}
                                      <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('orders.thPrice')}</th>
                                      <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('orders.thTotal')}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {items.map(item => {
                                      const available = getAvailableStock(order.warehouse_id, item.product_id);
                                      const needed = confirmQuantities[item.id] ?? item.quantity_ordered;
                                      const isShort = order.status === 'pending' && available !== null && available < needed;
                                      const ppp = item.product?.pieces_per_package || 1;

                                      return (
                                        <tr key={item.id} className={isShort ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                          <td className="py-2.5">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.product?.name || `#${item.product_id}`}</span>
                                            {item.product?.barcode && <span className={`text-[10px] text-gray-400 dark:text-gray-500 ${isRTL ? 'mr-1' : 'ml-1'}`}>({item.product.barcode})</span>}
                                          </td>
                                          <td className="text-center text-sm font-bold text-gray-700 dark:text-gray-300 py-2.5">
                                            {fmtQty(item.quantity_ordered, ppp)}
                                          </td>
                                          {order.status === 'pending' && hasStockData && (
                                            <td className={`text-center text-sm font-bold py-2.5 ${isShort ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                              {available !== null ? fmtQty(available, ppp) : '-'}
                                            </td>
                                          )}
                                          {order.status === 'pending' && (() => {
                                            const { cartons, pieces } = splitQty(needed, ppp);
                                            return (
                                              <td className="py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                  <div className="flex flex-col items-center">
                                                    <input
                                                      type="number"
                                                      min="0"
                                                      step="1"
                                                      value={cartons}
                                                      onChange={(e) => {
                                                        const c = parseInt(e.target.value) || 0;
                                                        setConfirmQuantities(prev => ({ ...prev, [item.id]: combineQty(c, pieces, ppp) }));
                                                      }}
                                                      className="input w-14 text-center text-sm"
                                                    />
                                                    <span className="text-[10px] text-blue-600 dark:text-blue-400">{ppp > 1 ? t('orders.unitCarton') : t('orders.unitUnit')}</span>
                                                  </div>
                                                  {ppp > 1 && (
                                                    <div className="flex flex-col items-center">
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        max={ppp - 1}
                                                        step="1"
                                                        value={pieces}
                                                        onChange={(e) => {
                                                          const p = parseInt(e.target.value) || 0;
                                                          setConfirmQuantities(prev => ({ ...prev, [item.id]: combineQty(cartons, p, ppp) }));
                                                        }}
                                                        className="input w-14 text-center text-sm"
                                                      />
                                                      <span className="text-[10px] text-orange-600 dark:text-orange-400">{t('orders.unitPiece')}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </td>
                                            );
                                          })()}
                                          {(order.status === 'confirmed' || order.status === 'assigned') && (
                                            <td className="text-center text-sm font-bold text-blue-600 dark:text-blue-400 py-2.5">
                                              {fmtQty(item.quantity_confirmed, ppp)}
                                            </td>
                                          )}
                                          {(order.status === 'delivered' || order.status === 'partial') && (
                                            <>
                                              <td className="text-center text-sm font-bold text-blue-600 dark:text-blue-400 py-2.5">
                                                {fmtQty(item.quantity_confirmed, ppp)}
                                              </td>
                                              <td className="text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2.5">
                                                {fmtQty(item.quantity_delivered, ppp)}
                                                {item.quantity_returned > 0 && (
                                                  <div className="text-[10px] text-red-500 dark:text-red-400">{t('orders.returned')} {fmtQty(item.quantity_returned, ppp)}</div>
                                                )}
                                              </td>
                                            </>
                                          )}
                                          <td className="text-center text-sm text-gray-600 dark:text-gray-300 py-2.5">{formatCurrency(item.unit_price)}</td>
                                          <td className="text-center text-sm font-bold text-gray-700 dark:text-gray-300 py-2.5">{formatCurrency(item.subtotal)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {order.notes && (
                            <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700">
                              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('orders.notesLabel')}</span>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{order.notes}</p>
                            </div>
                          )}

                          {/* Confirm/Cancel for pending */}
                          {order.status === 'pending' && (
                            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleConfirm(order)}
                                  disabled={isActioning}
                                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
                                >
                                  {isActioning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                    <>
                                      <CheckCircleIcon className="w-4 h-4" />
                                      {t('orders.confirmOrder')}
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => { setSelectedOrder(order); setIsCancelOpen(true); }}
                                  disabled={isActioning}
                                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                  {t('orders.cancelButton')}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Problem info */}
                          {order.has_problem && order.problem_description && (
                            <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-red-50/50 dark:bg-red-900/20">
                              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm font-medium">
                                <ExclamationTriangleIcon className="w-4 h-4" />
                                {order.problem_description}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {t('orders.totalXOrders', { total: String(data.total) })} · {t('orders.pageXOfY', { current: String(data.current_page), last: String(data.last_page) })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={data.current_page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PrevChevron className="w-3.5 h-3.5" />
                {t('orders.previous')}
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.last_page, p + 1))}
                disabled={data.current_page === data.last_page}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('orders.next')}
                <NextChevron className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={() => selectedOrder && cancelMutation.mutate(selectedOrder.id)}
        title={t('orders.cancelDialogTitle')}
        message={t('orders.cancelDialogMessage', { reference: selectedOrder?.reference || '' })}
        confirmText={t('orders.cancelDialogConfirm')}
        isLoading={cancelMutation.isPending}
        variant="danger"
      />

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={tourSteps}
          storageKey={storageKey}
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
