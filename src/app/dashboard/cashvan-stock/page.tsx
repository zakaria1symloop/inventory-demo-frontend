'use client';

import { useState, useEffect, useMemo } from 'react';
import { deliveriesApi, warehousesApi } from '@/lib/api';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import {
  TruckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  CubeIcon,
  ArchiveBoxIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  barcode?: string;
  retail_price?: number;
  cost_price?: number;
  pieces_per_package?: number;
}

interface DeliveryStockItem {
  product_id: number;
  product: Product;
  quantity_loaded: number;
  quantity_delivered: number;
  quantity_returned: number;
  remaining: number;
}

interface VanSessionStockItem {
  product_id: number;
  product: Product;
  quantity_loaded: number;
  quantity_sold: number;
  quantity_returned: number;
  available: number;
}

interface Vehicle {
  id: number;
  name: string;
  plate_number?: string;
}

interface LivreurDelivery {
  id: number;
  reference: string;
  status: string;
  date: string;
  vehicle?: Vehicle;
  total_orders: number;
  delivered_count: number;
  failed_count: number;
  total_amount: number;
  collected_amount: number;
  stock: DeliveryStockItem[];
}

interface LivreurVanSession {
  id: number;
  reference: string;
  status: string;
  date: string;
  vehicle?: Vehicle;
  total_loaded_value: number;
  total_sales: number;
  total_collected: number;
  sales_count: number;
  items: VanSessionStockItem[];
}

interface WarehouseStock {
  warehouse: { id: number; name: string };
  items: VanSessionStockItem[];
  sales_count: number;
  total_sales: number;
  total_collected: number;
}

interface LivreurEntry {
  user: { id: number; name: string; phone?: string; role: string };
  deliveries: LivreurDelivery[];
  van_sessions: LivreurVanSession[];
  warehouse_stock?: WarehouseStock;
  totals: { total_loaded: number; total_remaining: number };
}

interface LivreurStockData {
  livreurs: LivreurEntry[];
  summary: {
    total_active_livreurs: number;
    total_active_deliveries: number;
    total_active_van_sessions: number;
    total_products_loaded: number;
    total_products_remaining: number;
  };
}

interface Warehouse {
  id: number;
  name: string;
}

interface ReturnItem {
  product_id: number;
  product_name: string;
  pieces_per_package: number;
  source_type: 'delivery' | 'van_session' | 'warehouse_stock';
  source_id: number | null;
  source_label: string;
  available: number;
  cartons: string;
  pieces: string;
}

const statusColors: Record<string, string> = {
  preparing: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  in_progress: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  active: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
};

const sourceTypeColors: Record<string, string> = {
  delivery: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  van_session: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  warehouse_stock: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
};

const ROLE_BADGE: Record<string, string> = {
  livreur: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  cashvan: 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
};

export default function CashvanStockPage() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';

  const [data, setData] = useState<LivreurStockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLivreur, setExpandedLivreur] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'van_session' | 'warehouse_stock'>('all');
  const [filterHasRemaining, setFilterHasRemaining] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterProgress, setFilterProgress] = useState<'all' | 'low' | 'mid' | 'high'>('all');
  const roleFilter = 'cashvan'; // This page only shows cashvan role
  const [showFilters, setShowFilters] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnLivreur, setReturnLivreur] = useState<LivreurEntry | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | ''>('');
  const [isReturning, setIsReturning] = useState(false);

  const statusLabels: Record<string, string> = useMemo(() => ({
    preparing: t('cashvanStock.statusPreparing'),
    in_progress: t('cashvanStock.statusInProgress'),
    active: t('cashvanStock.statusActive'),
  }), [t]);

  const sourceTypeLabels: Record<string, string> = useMemo(() => ({
    delivery: t('cashvanStock.sourceDelivery'),
    van_session: t('cashvanStock.sourceVanSession'),
    warehouse_stock: t('cashvanStock.sourceWarehouseStock'),
  }), [t]);

  const ROLE_LABELS: Record<string, string> = useMemo(() => ({
    livreur: t('cashvanStock.roleDriver'),
    cashvan: t('cashvanStock.roleCashvan'),
    admin: t('cashvanStock.roleAdmin'),
    manager: t('cashvanStock.roleManager'),
    seller: t('cashvanStock.roleSeller'),
  }), [t]);

  const stockTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="stock-title"]',
      title: t('cashvanStock.tourTitle1'),
      desc: t('cashvanStock.tourDesc1'),
      position: 'bottom',
    },
    {
      target: '[data-tour="stock-kpis"]',
      title: t('cashvanStock.tourTitle2'),
      desc: t('cashvanStock.tourDesc2'),
      position: 'bottom',
    },
    {
      target: '[data-tour="stock-search"]',
      title: t('cashvanStock.tourTitle3'),
      desc: t('cashvanStock.tourDesc3'),
      position: 'bottom',
    },
    {
      target: '[data-tour="stock-quick-filters"]',
      title: t('cashvanStock.tourTitle4'),
      desc: t('cashvanStock.tourDesc4'),
      position: 'bottom',
    },
    {
      target: '[data-tour="stock-cards"]',
      title: t('cashvanStock.tourTitle5'),
      desc: t('cashvanStock.tourDesc5'),
      position: 'top',
    },
  ], [t]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await deliveriesApi.getLivreurStock();
      setData(res.data);
    } catch {
      toast.error(t('cashvanStock.errorLoadingStock'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 2 }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ').format(value);
  };

  const formatQty = (totalPieces: number, piecesPerPackage?: number) => {
    const ppp = piecesPerPackage || 1;
    const qty = Math.round(totalPieces);
    if (ppp <= 1) return `${qty}`;
    const cartons = Math.floor(qty / ppp);
    const pieces = qty % ppp;
    if (cartons > 0 && pieces > 0) return `${cartons} ${t('cashvanStock.carton')} ${pieces} ${t('cashvanStock.piece')}`;
    if (cartons > 0) return `${cartons} ${t('cashvanStock.carton')}`;
    if (pieces > 0) return `${pieces} ${t('cashvanStock.piece')}`;
    return '0';
  };

  const getProgressPercent = (delivered: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((delivered / total) * 100);
  };

  const collectItems = (livreur: LivreurEntry) => {
    const loaded: { qty: number; ppp: number }[] = [];
    const remaining: { qty: number; ppp: number }[] = [];

    for (const d of livreur.deliveries) {
      for (const s of d.stock) {
        const ppp = s.product?.pieces_per_package || 1;
        if (s.quantity_loaded > 0) loaded.push({ qty: s.quantity_loaded, ppp });
        if (s.remaining > 0) remaining.push({ qty: s.remaining, ppp });
      }
    }
    for (const v of livreur.van_sessions) {
      for (const i of v.items) {
        const ppp = i.product?.pieces_per_package || 1;
        if (i.quantity_loaded > 0) loaded.push({ qty: i.quantity_loaded, ppp });
        if (i.available > 0) remaining.push({ qty: i.available, ppp });
      }
    }
    if (livreur.warehouse_stock) {
      for (const i of livreur.warehouse_stock.items) {
        const ppp = i.product?.pieces_per_package || 1;
        if (i.quantity_loaded > 0) loaded.push({ qty: i.quantity_loaded, ppp });
        if (i.available > 0) remaining.push({ qty: i.available, ppp });
      }
    }

    return { loaded, remaining };
  };

  const formatItemsList = (items: { qty: number; ppp: number }[]) => {
    if (items.length === 0) return '0';
    if (items.length === 1) return formatQty(items[0].qty, items[0].ppp);
    return `${items.length} ${t('cashvanStock.product')}`;
  };

  const openReturnModal = async (livreur: LivreurEntry) => {
    setReturnLivreur(livreur);
    const items: ReturnItem[] = [];

    for (const delivery of livreur.deliveries) {
      for (const s of delivery.stock) {
        if (s.remaining > 0) {
          items.push({
            product_id: s.product_id,
            product_name: s.product?.name || `${t('cashvanStock.product')} #${s.product_id}`,
            pieces_per_package: s.product?.pieces_per_package || 1,
            source_type: 'delivery',
            source_id: delivery.id,
            source_label: delivery.reference,
            available: s.remaining,
            cartons: '',
            pieces: '',
          });
        }
      }
    }

    for (const session of livreur.van_sessions) {
      for (const item of session.items) {
        if (item.available > 0) {
          items.push({
            product_id: item.product_id,
            product_name: item.product?.name || `${t('cashvanStock.product')} #${item.product_id}`,
            pieces_per_package: item.product?.pieces_per_package || 1,
            source_type: 'van_session',
            source_id: session.id,
            source_label: session.reference,
            available: item.available,
            cartons: '',
            pieces: '',
          });
        }
      }
    }

    if (livreur.warehouse_stock) {
      for (const item of livreur.warehouse_stock.items) {
        if (item.available > 0) {
          items.push({
            product_id: item.product_id,
            product_name: item.product?.name || `${t('cashvanStock.product')} #${item.product_id}`,
            pieces_per_package: item.product?.pieces_per_package || 1,
            source_type: 'warehouse_stock',
            source_id: null,
            source_label: livreur.warehouse_stock!.warehouse.name,
            available: item.available,
            cartons: '',
            pieces: '',
          });
        }
      }
    }

    setReturnItems(items);
    setSelectedWarehouse('');

    try {
      const res = await warehousesApi.getAll();
      setWarehouses(res.data.data || res.data);
    } catch {
      toast.error(t('cashvanStock.errorLoadingWarehouses'));
    }

    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setReturnLivreur(null);
    setReturnItems([]);
    setSelectedWarehouse('');
  };

  const updateReturnItem = (index: number, field: 'cartons' | 'pieces', value: string) => {
    setReturnItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const getReturnQty = (item: ReturnItem): number => {
    const ppp = item.pieces_per_package || 1;
    const cartons = parseInt(item.cartons) || 0;
    const pieces = parseInt(item.pieces) || 0;
    return cartons * ppp + pieces;
  };

  const handleReturnSubmit = async () => {
    if (!selectedWarehouse) {
      toast.error(t('cashvanStock.errorSelectWarehouse'));
      return;
    }

    if (!returnLivreur) return;

    const itemsToReturn: { product_id: number; quantity: number; source_type: string; source_id: number | null }[] = [];

    for (const item of returnItems) {
      const ppp = item.pieces_per_package || 1;
      const enteredCartons = parseInt(item.cartons) || 0;
      const enteredPieces = parseInt(item.pieces) || 0;
      const enteredTotalPieces = enteredCartons * ppp + enteredPieces;
      if (enteredTotalPieces <= 0) continue;

      if (enteredTotalPieces > item.available) {
        toast.error(`${t('cashvanStock.errorQtyExceeds')} ${item.product_name} (${formatQty(item.available, ppp)})`);
        return;
      }

      itemsToReturn.push({
        product_id: item.product_id,
        quantity: enteredTotalPieces,
        source_type: item.source_type,
        source_id: item.source_id,
      });
    }

    if (itemsToReturn.length === 0) {
      toast.error(t('cashvanStock.errorEnterQty'));
      return;
    }

    setIsReturning(true);

    try {
      await deliveriesApi.returnLivreurStock(returnLivreur.user.id, {
        warehouse_id: selectedWarehouse as number,
        items: itemsToReturn,
      });
      toast.success(t('cashvanStock.successReturn'));
      closeReturnModal();
      setIsLoading(true);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('cashvanStock.errorReturn'));
    } finally {
      setIsReturning(false);
    }
  };

  // Extract unique vehicles from data for filter dropdown
  const vehicleOptions = (() => {
    if (!data) return [];
    const map = new Map<string, string>();
    for (const l of data.livreurs) {
      if (l.user.role !== 'cashvan') continue;
      for (const v of l.van_sessions) {
        if (v.vehicle) map.set(String(v.vehicle.id), `${v.vehicle.name}${v.vehicle.plate_number ? ` (${v.vehicle.plate_number})` : ''}`);
      }
    }
    return Array.from(map, ([id, label]) => ({ id, label }));
  })();

  const filteredLivreurs = data?.livreurs.filter((l) => {
    if (searchTerm && !l.user.name.toLowerCase().includes(searchTerm.toLowerCase()) && !l.user.phone?.includes(searchTerm)) return false;
    if (roleFilter && l.user.role !== roleFilter) return false;
    if (filterType === 'van_session' && l.van_sessions.length === 0) return false;
    if (filterType === 'warehouse_stock' && !l.warehouse_stock) return false;
    if (filterHasRemaining && l.totals.total_remaining <= 0) return false;
    // Status filter
    if (filterStatus) {
      const hasStatus = l.van_sessions.some(v => v.status === filterStatus);
      if (!hasStatus) return false;
    }
    // Vehicle filter
    if (filterVehicle) {
      const hasVehicle = l.van_sessions.some(v => v.vehicle && String(v.vehicle.id) === filterVehicle);
      if (!hasVehicle) return false;
    }
    // Progress filter
    if (filterProgress !== 'all') {
      const pct = l.totals.total_loaded > 0
        ? Math.round(((l.totals.total_loaded - l.totals.total_remaining) / l.totals.total_loaded) * 100)
        : 0;
      if (filterProgress === 'low' && pct >= 50) return false;
      if (filterProgress === 'mid' && (pct < 50 || pct >= 80)) return false;
      if (filterProgress === 'high' && pct < 80) return false;
    }
    return true;
  }) ?? [];

  const activeFilterCount = [
    filterType !== 'all' ? filterType : '',
    filterHasRemaining ? 'yes' : '',
    filterStatus,
    filterVehicle,
    filterProgress !== 'all' ? filterProgress : '',
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterHasRemaining(false);
    setFilterStatus('');
    setFilterVehicle('');
    setFilterProgress('all');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="stock-title">
        <div>
          <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-none">{t('cashvanStock.pageTitle')}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">{t('cashvanStock.pageSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { localStorage.removeItem('cashvan_stock_tour_step'); setShowTour(true); }}
            className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            title={t('cashvanStock.guidedTour')}
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('cashvanStock.guidedTour')}</span>
          </button>
          <button
            onClick={() => { setIsLoading(true); fetchData(); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('cashvanStock.refresh')}</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" data-tour="stock-kpis">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">{t('cashvanStock.kpiActiveCashvan')}</p>
            <p className="text-lg font-black text-violet-600 dark:text-violet-400 tabular-nums">{data.summary.total_active_livreurs}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">{t('cashvanStock.kpiActiveDeliveries')}</p>
            <p className="text-lg font-black text-cyan-600 dark:text-cyan-400 tabular-nums">{data.summary.total_active_deliveries}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">{t('cashvanStock.kpiVanSessions')}</p>
            <p className="text-lg font-black text-violet-600 dark:text-violet-400 tabular-nums">{data.summary.total_active_van_sessions}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">{t('cashvanStock.kpiTotalLoaded')}</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{(() => { const all = data!.livreurs.flatMap(l => collectItems(l).loaded); return formatItemsList(all); })()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-[11px] text-gray-400 dark:text-gray-400 font-medium">{t('cashvanStock.kpiRemainingInVans')}</p>
            <p className="text-lg font-black text-orange-600 dark:text-orange-400 tabular-nums">{(() => { const all = data!.livreurs.flatMap(l => collectItems(l).remaining); return formatItemsList(all); })()}</p>
          </div>
        </div>
      )}

      {/* Search + Filters + Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700" data-tour="stock-search">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              placeholder={t('cashvanStock.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('cashvanStock.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {(searchTerm || activeFilterCount > 0) && (
            <button onClick={clearAllFilters} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1">
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('cashvanStock.clear')}</span>
            </button>
          )}
          <span className="text-xs text-gray-400 hidden sm:inline">
            {filteredLivreurs.length} / {data?.livreurs.length || 0}
          </span>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('cashvanStock.filterActivityType')}</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                  className="select w-full"
                >
                  <option value="all">{t('cashvanStock.filterAll')}</option>
                  <option value="van_session">{t('cashvanStock.sourceVanSession')}</option>
                  <option value="warehouse_stock">{t('cashvanStock.sourceWarehouseStock')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('cashvanStock.filterStatus')}</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="select w-full"
                >
                  <option value="">{t('cashvanStock.filterAllStatuses')}</option>
                  <option value="preparing">{t('cashvanStock.statusPreparing')}</option>
                  <option value="active">{t('cashvanStock.statusActive')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('cashvanStock.filterVehicle')}</label>
                <select
                  value={filterVehicle}
                  onChange={(e) => setFilterVehicle(e.target.value)}
                  className="select w-full"
                >
                  <option value="">{t('cashvanStock.filterAllVehicles')}</option>
                  {vehicleOptions.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('cashvanStock.filterProgress')}</label>
                <select
                  value={filterProgress}
                  onChange={(e) => setFilterProgress(e.target.value as typeof filterProgress)}
                  className="select w-full"
                >
                  <option value="all">{t('cashvanStock.filterAll')}</option>
                  <option value="low">{t('cashvanStock.filterLessThan50')}</option>
                  <option value="mid">{t('cashvanStock.filter50to80')}</option>
                  <option value="high">{t('cashvanStock.filterMoreThan80')}</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <label className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="checkbox"
                  checked={filterHasRemaining}
                  onChange={(e) => setFilterHasRemaining(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('cashvanStock.onlyWithRemaining')}</span>
              </label>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto" data-tour="stock-quick-filters">
          {([
            { value: 'all', label: t('cashvanStock.filterAll') },
            { value: 'van_session', label: t('cashvanStock.sourceVanSession') },
            { value: 'warehouse_stock', label: t('cashvanStock.quickFilterWarehouse') },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterType === opt.value
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />
          <button
            onClick={() => setFilterHasRemaining(!filterHasRemaining)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filterHasRemaining
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ArchiveBoxIcon className="w-3.5 h-3.5" />
            {t('cashvanStock.hasRemaining')}
          </button>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />
          {([
            { value: 'preparing', label: t('cashvanStock.statusPreparing') },
            { value: 'active', label: t('cashvanStock.statusActive') },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterStatus(filterStatus === opt.value ? '' : opt.value)}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === opt.value
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Driver Cards */}
        <div className="p-4 space-y-3" data-tour="stock-cards">
          {filteredLivreurs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <DevicePhoneMobileIcon className="w-12 h-12 mb-3" />
              <p className="text-lg font-semibold">{t('cashvanStock.emptyTitle')}</p>
              <p className="text-sm mt-1">{t('cashvanStock.emptySubtitle')}</p>
            </div>
          ) : (
            filteredLivreurs.map((livreur) => {
              const isExpanded = expandedLivreur === livreur.user.id;
              const progressPercent = livreur.totals.total_loaded > 0
                ? getProgressPercent(livreur.totals.total_loaded - livreur.totals.total_remaining, livreur.totals.total_loaded)
                : 0;
              const items = collectItems(livreur);
              return (
                <div key={livreur.user.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
                  {/* Driver Header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => setExpandedLivreur(isExpanded ? null : livreur.user.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-violet-100 dark:bg-violet-900/40">
                        <span className="font-bold text-lg text-violet-600 dark:text-violet-400">
                          {livreur.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100">{livreur.user.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {livreur.user.phone && (
                            <span className="text-xs text-gray-400">{livreur.user.phone}</span>
                          )}
                          {livreur.deliveries.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                              <TruckIcon className="w-3 h-3" />
                              {livreur.deliveries.length} {t('cashvanStock.sourceDelivery')}
                            </span>
                          )}
                          {livreur.van_sessions.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300">
                              <DevicePhoneMobileIcon className="w-3 h-3" />
                              {livreur.van_sessions.length} {t('cashvanStock.sourceVanSession')}
                            </span>
                          )}
                          {livreur.warehouse_stock && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300">
                              <ArchiveBoxIcon className="w-3 h-3" />
                              {livreur.warehouse_stock.warehouse.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Return button */}
                      {livreur.totals.total_remaining > 0 && (
                        <button
                          data-tour="stock-return-btn"
                          onClick={(e) => { e.stopPropagation(); openReturnModal(livreur); }}
                          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-700 transition-colors"
                        >
                          <ArrowPathIcon className="w-3.5 h-3.5" />
                          {t('cashvanStock.returnBtn')}
                        </button>
                      )}

                      {/* Summary stats */}
                      <div className="hidden md:flex items-center gap-5">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 font-medium">{t('cashvanStock.loaded')}</p>
                          <p className="text-sm font-black text-gray-800 dark:text-gray-200">{formatItemsList(items.loaded)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-400 font-medium">{t('cashvanStock.remaining')}</p>
                          <p className="text-sm font-black text-orange-600 dark:text-orange-400">{formatItemsList(items.remaining)}</p>
                        </div>
                        <div className="w-20">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-gray-400">{t('cashvanStock.progress')}</span>
                            <span className="font-bold text-gray-600 dark:text-gray-300">{progressPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${progressPercent >= 80 ? 'bg-emerald-500' : progressPercent >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Mobile summary */}
                  <div className="flex md:hidden items-center gap-3 px-5 pb-3 -mt-1">
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-gray-400">{t('cashvanStock.loaded')}</p>
                      <p className="text-sm font-black text-gray-800 dark:text-gray-200">{formatItemsList(items.loaded)}</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-[10px] text-gray-400">{t('cashvanStock.remaining')}</p>
                      <p className="text-sm font-black text-orange-600 dark:text-orange-400">{formatItemsList(items.remaining)}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-gray-400">{t('cashvanStock.progress')}</span>
                        <span className="font-bold text-gray-600 dark:text-gray-300">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${progressPercent >= 80 ? 'bg-emerald-500' : progressPercent >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                    {livreur.totals.total_remaining > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openReturnModal(livreur); }}
                        className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700"
                      >
                        <ArrowPathIcon className="w-3.5 h-3.5" />
                        {t('cashvanStock.returnBtn')}
                      </button>
                    )}
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/20">
                      {/* Deliveries */}
                      {livreur.deliveries.map((delivery) => (
                        <div key={`del-${delivery.id}`} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700 p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{delivery.reference}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors[delivery.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                {statusLabels[delivery.status] || delivery.status}
                              </span>
                              {delivery.vehicle && (
                                <span className="text-xs text-gray-400">
                                  {delivery.vehicle.name} {delivery.vehicle.plate_number ? `(${delivery.vehicle.plate_number})` : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-gray-500 dark:text-gray-400">
                                {t('cashvanStock.orders')}: <span className="font-bold text-gray-800 dark:text-gray-200">{delivery.delivered_count}/{delivery.total_orders}</span>
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {t('cashvanStock.collected')}: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(delivery.collected_amount)}</span>
                              </span>
                            </div>
                          </div>

                          {delivery.stock.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="text-start text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thProduct')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thLoaded')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thDelivered')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thReturned')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thRemaining')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">%</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                  {delivery.stock.map((s) => {
                                    const pct = getProgressPercent(s.quantity_delivered, s.quantity_loaded);
                                    const ppp = s.product?.pieces_per_package;
                                    return (
                                      <tr key={s.product_id}>
                                        <td className="py-2">
                                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.product?.name}</span>
                                          {s.product?.barcode && <span className="text-[10px] text-gray-400 me-1">({s.product.barcode})</span>}
                                        </td>
                                        <td className="text-center text-sm text-gray-600 dark:text-gray-300">{formatQty(s.quantity_loaded, ppp)}</td>
                                        <td className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{formatQty(s.quantity_delivered, ppp)}</td>
                                        <td className="text-center text-sm text-red-500 dark:text-red-400">{formatQty(s.quantity_returned, ppp)}</td>
                                        <td className="text-center">
                                          <span className={`text-sm font-bold ${s.remaining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {formatQty(s.remaining, ppp)}
                                          </span>
                                        </td>
                                        <td className="text-center">
                                          <div className="inline-flex items-center gap-1">
                                            <div className="w-10 bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                                              <div
                                                className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                style={{ width: `${pct}%` }}
                                              />
                                            </div>
                                            <span className="text-[10px] text-gray-400 w-7">{pct}%</span>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Van Sessions */}
                      {livreur.van_sessions.map((session) => (
                        <div key={`van-${session.id}`} className="bg-white dark:bg-gray-800 rounded-xl border border-violet-200/60 dark:border-violet-700/40 p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{session.reference}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors[session.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                {statusLabels[session.status] || session.status}
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">{t('cashvanStock.sourceVanSession')}</span>
                              {session.vehicle && (
                                <span className="text-xs text-gray-400">
                                  {session.vehicle.name} {session.vehicle.plate_number ? `(${session.vehicle.plate_number})` : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-gray-500 dark:text-gray-400">
                                {t('cashvanStock.sales')}: <span className="font-bold text-gray-800 dark:text-gray-200">{session.sales_count}</span>
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {t('cashvanStock.collected')}: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(session.total_collected)}</span>
                              </span>
                            </div>
                          </div>

                          {session.items.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="text-start text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thProduct')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thLoaded')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thSold')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thReturned')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thAvailable')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">%</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                  {session.items.map((item) => {
                                    const pct = getProgressPercent(item.quantity_sold, item.quantity_loaded);
                                    const ppp = item.product?.pieces_per_package;
                                    return (
                                      <tr key={item.product_id}>
                                        <td className="py-2">
                                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.product?.name}</span>
                                          {item.product?.barcode && <span className="text-[10px] text-gray-400 me-1">({item.product.barcode})</span>}
                                        </td>
                                        <td className="text-center text-sm text-gray-600 dark:text-gray-300">{formatQty(item.quantity_loaded, ppp)}</td>
                                        <td className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{formatQty(item.quantity_sold, ppp)}</td>
                                        <td className="text-center text-sm text-red-500 dark:text-red-400">{formatQty(item.quantity_returned, ppp)}</td>
                                        <td className="text-center">
                                          <span className={`text-sm font-bold ${item.available > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {formatQty(item.available, ppp)}
                                          </span>
                                        </td>
                                        <td className="text-center">
                                          <div className="inline-flex items-center gap-1">
                                            <div className="w-10 bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                                              <div
                                                className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                style={{ width: `${pct}%` }}
                                              />
                                            </div>
                                            <span className="text-[10px] text-gray-400 w-7">{pct}%</span>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Warehouse Stock */}
                      {livreur.warehouse_stock && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-emerald-200/60 dark:border-emerald-700/40 p-4">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{livreur.warehouse_stock.warehouse.name}</span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{t('cashvanStock.sourceWarehouseStock')}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-gray-500 dark:text-gray-400">
                                {t('cashvanStock.todaySales')}: <span className="font-bold text-gray-800 dark:text-gray-200">{livreur.warehouse_stock.sales_count}</span>
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {t('cashvanStock.total')}: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(livreur.warehouse_stock.total_sales)}</span>
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {t('cashvanStock.collected')}: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(livreur.warehouse_stock.total_collected)}</span>
                              </span>
                            </div>
                          </div>

                          {livreur.warehouse_stock.items.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="text-start text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thProduct')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thLoadedAlt')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thSold')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">{t('cashvanStock.thAvailable')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2">%</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                  {livreur.warehouse_stock.items.map((item) => {
                                    const ppp = item.product?.pieces_per_package;
                                    const pct = getProgressPercent(item.quantity_sold, item.quantity_loaded);
                                    return (
                                      <tr key={item.product_id}>
                                        <td className="py-2">
                                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.product?.name}</span>
                                          {item.product?.barcode && <span className="text-[10px] text-gray-400 me-1">({item.product.barcode})</span>}
                                        </td>
                                        <td className="text-center text-sm text-gray-600 dark:text-gray-300">{formatQty(item.quantity_loaded, ppp)}</td>
                                        <td className="text-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold">{formatQty(item.quantity_sold, ppp)}</td>
                                        <td className="text-center">
                                          <span className={`text-sm font-bold ${item.available > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {formatQty(item.available, ppp)}
                                          </span>
                                        </td>
                                        <td className="text-center">
                                          <div className="inline-flex items-center gap-1">
                                            <div className="w-10 bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                                              <div
                                                className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                                style={{ width: `${pct}%` }}
                                              />
                                            </div>
                                            <span className="text-[10px] text-gray-400 w-7">{pct}%</span>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Return Modal */}
      {showReturnModal && returnLivreur && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeReturnModal}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700"
            dir={dir}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                  <ArrowPathIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('cashvanStock.returnProducts')}</h2>
                  <p className="text-sm text-gray-400">{returnLivreur.user.name}</p>
                </div>
              </div>
              <button onClick={closeReturnModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Warehouse selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('cashvanStock.receivingWarehouse')}</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value ? parseInt(e.target.value) : '')}
                  className="select w-full"
                >
                  <option value="">{t('cashvanStock.selectWarehouse')}</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Products table */}
              {returnItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
                  <CubeIcon className="w-10 h-10 mb-2" />
                  <p className="text-sm">{t('cashvanStock.noProductsToReturn')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-start text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2.5">{t('cashvanStock.thProduct')}</th>
                        <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2.5">{t('cashvanStock.thSource')}</th>
                        <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2.5">{t('cashvanStock.thAvailable')}</th>
                        <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2.5">{t('cashvanStock.thReturnQty')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {returnItems.map((item, index) => {
                        const ppp = item.pieces_per_package || 1;
                        const hasPackaging = ppp > 1;
                        return (
                          <tr key={`${item.source_type}-${item.source_id}-${item.product_id}`}>
                            <td className="py-2.5">
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.product_name}</span>
                            </td>
                            <td className="text-center py-2.5">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${sourceTypeColors[item.source_type]}`}>
                                {sourceTypeLabels[item.source_type]}
                              </span>
                              <span className="block text-[10px] text-gray-400 mt-0.5">{item.source_label}</span>
                            </td>
                            <td className="text-center py-2.5">
                              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                {formatQty(item.available, ppp)}
                              </span>
                            </td>
                            <td className="text-center py-2.5">
                              <div className="flex items-center justify-center gap-2">
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={item.cartons}
                                    onChange={(e) => updateReturnItem(index, 'cartons', e.target.value)}
                                    placeholder="0"
                                    className="input w-16 text-center text-sm py-1"
                                  />
                                  <span className="text-[10px] text-gray-400">{hasPackaging ? t('cashvanStock.carton') : t('cashvanStock.unit')}</span>
                                </div>
                                {hasPackaging && (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      max={ppp - 1}
                                      value={item.pieces}
                                      onChange={(e) => updateReturnItem(index, 'pieces', e.target.value)}
                                      placeholder="0"
                                      className="input w-16 text-center text-sm py-1"
                                    />
                                    <span className="text-[10px] text-gray-400">{t('cashvanStock.piece')}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 rounded-b-2xl">
              <button onClick={closeReturnModal} className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors">
                {t('cashvanStock.cancel')}
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={isReturning || !selectedWarehouse || returnItems.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReturning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('cashvanStock.returning')}
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-4 h-4" />
                    {t('cashvanStock.confirmReturn')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={stockTourSteps}
          storageKey="cashvan_stock_tour_step"
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
