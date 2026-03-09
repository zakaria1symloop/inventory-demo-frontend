'use client';

import { useState, useEffect } from 'react';
import { deliveriesApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';

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

const statusLabels: Record<string, string> = {
  preparing: 'تحضير',
  in_progress: 'قيد التوصيل',
  active: 'نشطة',
};

const statusColors: Record<string, string> = {
  preparing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const sourceTypeLabels: Record<string, string> = {
  delivery: 'توصيل',
  van_session: 'بيع متنقل',
  warehouse_stock: 'مخزون مستودع',
};

const sourceTypeColors: Record<string, string> = {
  delivery: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  van_session: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  warehouse_stock: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export default function LivreurStockPage() {
  const [data, setData] = useState<LivreurStockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLivreur, setExpandedLivreur] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'delivery' | 'van_session' | 'warehouse_stock'>('all');
  const [filterHasRemaining, setFilterHasRemaining] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnLivreur, setReturnLivreur] = useState<LivreurEntry | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | ''>('');
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await deliveriesApi.getLivreurStock();
      setData(res.data);
    } catch {
      toast.error('خطأ في تحميل بيانات مخزون السائقين');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 2 }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ar-DZ').format(value);
  };

  const formatQty = (totalPieces: number, piecesPerPackage?: number) => {
    const ppp = piecesPerPackage || 1;
    const qty = Math.round(totalPieces);
    if (ppp <= 1) return `${qty}`;
    const cartons = Math.floor(qty / ppp);
    const pieces = qty % ppp;
    if (cartons > 0 && pieces > 0) return `${cartons} كرتون ${pieces} قطعة`;
    if (cartons > 0) return `${cartons} كرتون`;
    if (pieces > 0) return `${pieces} قطعة`;
    return '0';
  };

  const getProgressPercent = (delivered: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((delivered / total) * 100);
  };

  // Collect all product items for a livreur with their qty info
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

  // Format a list of items: if 1 product show cartons+pieces, if multiple show product count
  const formatItemsList = (items: { qty: number; ppp: number }[]) => {
    if (items.length === 0) return '0';
    if (items.length === 1) return formatQty(items[0].qty, items[0].ppp);
    return `${items.length} منتج`;
  };

  const openReturnModal = async (livreur: LivreurEntry) => {
    setReturnLivreur(livreur);

    // Build return items from all sources
    const items: ReturnItem[] = [];

    for (const delivery of livreur.deliveries) {
      for (const s of delivery.stock) {
        if (s.remaining > 0) {
          items.push({
            product_id: s.product_id,
            product_name: s.product?.name || `منتج #${s.product_id}`,
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
            product_name: item.product?.name || `منتج #${item.product_id}`,
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
            product_name: item.product?.name || `منتج #${item.product_id}`,
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

    // Fetch warehouses
    try {
      const res = await warehousesApi.getAll();
      setWarehouses(res.data.data || res.data);
    } catch {
      toast.error('خطأ في تحميل المستودعات');
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
      toast.error('يرجى اختيار المستودع المستلم');
      return;
    }

    if (!returnLivreur) return;

    // Validate by comparing piece counts (not raw decimals) to avoid floating point issues
    const itemsToReturn: { product_id: number; quantity: number; source_type: string; source_id: number | null }[] = [];

    for (const item of returnItems) {
      const ppp = item.pieces_per_package || 1;
      const enteredCartons = parseInt(item.cartons) || 0;
      const enteredPieces = parseInt(item.pieces) || 0;

      // Total entered in piece units
      const enteredTotalPieces = enteredCartons * ppp + enteredPieces;
      if (enteredTotalPieces <= 0) continue;

      // Available is already in pieces from the backend
      if (enteredTotalPieces > item.available) {
        toast.error(`الكمية المدخلة لـ ${item.product_name} أكبر من المتاح (${formatQty(item.available, ppp)})`);
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
      toast.error('يرجى إدخال كمية واحدة على الأقل');
      return;
    }

    setIsReturning(true);

    try {
      await deliveriesApi.returnLivreurStock(returnLivreur.user.id, {
        warehouse_id: selectedWarehouse as number,
        items: itemsToReturn,
      });
      toast.success('تم إرجاع المنتجات بنجاح');
      closeReturnModal();
      setIsLoading(true);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'خطأ في إرجاع المنتجات');
    } finally {
      setIsReturning(false);
    }
  };

  const filteredLivreurs = data?.livreurs.filter((l) => {
    // Search filter
    if (searchTerm && !l.user.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    // Source type filter
    if (filterType === 'delivery' && l.deliveries.length === 0) return false;
    if (filterType === 'van_session' && l.van_sessions.length === 0) return false;
    if (filterType === 'warehouse_stock' && !l.warehouse_stock) return false;
    // Has remaining filter
    if (filterHasRemaining && l.totals.total_remaining <= 0) return false;
    return true;
  }) ?? [];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">مخزون السائقين</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">البضاعة الموجودة حاليا في الشاحنات</p>
        </div>
        <button onClick={() => { setIsLoading(true); fetchData(); }} className="btn btn-secondary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          تحديث
        </button>
      </div>

      {/* Summary KPIs */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-xs text-blue-600 dark:text-blue-400 mb-1">سائقين نشطين</h3>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{data.summary.total_active_livreurs}</p>
          </div>
          <div className="card bg-orange-50 dark:bg-orange-900/20">
            <h3 className="text-xs text-orange-600 dark:text-orange-400 mb-1">توصيلات نشطة</h3>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{data.summary.total_active_deliveries}</p>
          </div>
          <div className="card bg-purple-50 dark:bg-purple-900/20">
            <h3 className="text-xs text-purple-600 dark:text-purple-400 mb-1">جلسات بيع متنقل</h3>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{data.summary.total_active_van_sessions}</p>
          </div>
          <div className="card bg-green-50 dark:bg-green-900/20">
            <h3 className="text-xs text-green-600 dark:text-green-400 mb-1">إجمالي محمّل</h3>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{(() => { const all = data!.livreurs.flatMap(l => collectItems(l).loaded); return formatItemsList(all); })()}</p>
          </div>
          <div className="card bg-red-50 dark:bg-red-900/20">
            <h3 className="text-xs text-red-600 dark:text-red-400 mb-1">متبقي في الشاحنات</h3>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{(() => { const all = data!.livreurs.flatMap(l => collectItems(l).remaining); return formatItemsList(all); })()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      {data && data.livreurs.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالاسم..."
            className="input w-48"
          />

          {/* Source type filter */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {([
              { value: 'all', label: 'الكل' },
              { value: 'delivery', label: 'توصيل' },
              { value: 'van_session', label: 'بيع متنقل' },
              { value: 'warehouse_stock', label: 'مستودع' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterType(opt.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterType === opt.value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Has remaining toggle */}
          <button
            onClick={() => setFilterHasRemaining(!filterHasRemaining)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterHasRemaining
                ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700'
                : 'bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            لديه متبقي
          </button>

          {/* Active filter count + reset */}
          {(searchTerm || filterType !== 'all' || filterHasRemaining) && (
            <button
              onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterHasRemaining(false); }}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              مسح الفلاتر
            </button>
          )}

          <span className="text-xs text-gray-400 dark:text-gray-500 mr-auto">
            {filteredLivreurs.length} / {data.livreurs.length} سائق
          </span>
        </div>
      )}

      {/* Livreurs List */}
      {filteredLivreurs.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg">لا يوجد سائقين نشطين حاليا</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">لا توجد توصيلات أو جلسات بيع متنقل قيد التنفيذ</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLivreurs.map((livreur) => {
            const isExpanded = expandedLivreur === livreur.user.id;
            const progressPercent = livreur.totals.total_loaded > 0
              ? getProgressPercent(livreur.totals.total_loaded - livreur.totals.total_remaining, livreur.totals.total_loaded)
              : 0;
            const items = collectItems(livreur);

            return (
              <div key={livreur.user.id} className="card">
                {/* Livreur Header - Always visible */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedLivreur(isExpanded ? null : livreur.user.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                        {livreur.user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold dark:text-white text-lg">{livreur.user.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {livreur.user.phone && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{livreur.user.phone}</span>
                        )}
                        <div className="flex items-center gap-1">
                          {livreur.deliveries.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>
                              {livreur.deliveries.length} توصيل
                            </span>
                          )}
                          {livreur.van_sessions.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                              {livreur.van_sessions.length} بيع متنقل
                            </span>
                          )}
                          {livreur.warehouse_stock && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                              {livreur.warehouse_stock.warehouse.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Return button */}
                    {livreur.totals.total_remaining > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openReturnModal(livreur); }}
                        className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        إرجاع
                      </button>
                    )}

                    {/* Summary stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">محمّل</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{formatItemsList(items.loaded)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">متبقي</p>
                        <p className="font-bold text-orange-600 dark:text-orange-400">{formatItemsList(items.remaining)}</p>
                      </div>
                      <div className="w-24">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500 dark:text-gray-400">التقدم</span>
                          <span className="font-medium dark:text-white">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${progressPercent >= 80 ? 'bg-green-500' : progressPercent >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Mobile summary (visible on small screens) */}
                <div className="flex md:hidden items-center gap-4 mt-3 pt-3 border-t dark:border-gray-700">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">محمّل</p>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{formatItemsList(items.loaded)}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">متبقي</p>
                    <p className="font-bold text-orange-600 dark:text-orange-400">{formatItemsList(items.remaining)}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">التقدم</span>
                      <span className="font-medium dark:text-white">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${progressPercent >= 80 ? 'bg-green-500' : progressPercent >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                  {livreur.totals.total_remaining > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); openReturnModal(livreur); }}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      إرجاع
                    </button>
                  )}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700 space-y-6">
                    {/* Deliveries */}
                    {livreur.deliveries.map((delivery) => (
                      <div key={`del-${delivery.id}`} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-medium dark:text-white">{delivery.reference}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[delivery.status]}`}>
                              {statusLabels[delivery.status]}
                            </span>
                            {delivery.vehicle && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {delivery.vehicle.name} {delivery.vehicle.plate_number ? `(${delivery.vehicle.plate_number})` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              الطلبات: <span className="font-medium text-gray-800 dark:text-gray-200">{delivery.delivered_count}/{delivery.total_orders}</span>
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              محصّل: <span className="font-medium text-green-600">{formatCurrency(delivery.collected_amount)}</span>
                            </span>
                          </div>
                        </div>

                        {delivery.stock.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                  <th className="text-right py-2 font-medium">المنتج</th>
                                  <th className="text-center py-2 font-medium">محمّل</th>
                                  <th className="text-center py-2 font-medium">تم تسليم</th>
                                  <th className="text-center py-2 font-medium">مرتجع</th>
                                  <th className="text-center py-2 font-medium">متبقي</th>
                                  <th className="text-center py-2 font-medium">%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {delivery.stock.map((s) => {
                                  const pct = getProgressPercent(s.quantity_delivered, s.quantity_loaded);
                                  const ppp = s.product?.pieces_per_package;
                                  return (
                                    <tr key={s.product_id} className="border-b dark:border-gray-700/50 last:border-0">
                                      <td className="py-2">
                                        <span className="text-sm font-medium dark:text-white">{s.product?.name}</span>
                                        {s.product?.barcode && (
                                          <span className="text-xs text-gray-400 mr-2">({s.product.barcode})</span>
                                        )}
                                      </td>
                                      <td className="text-center text-sm dark:text-gray-300">{formatQty(s.quantity_loaded, ppp)}</td>
                                      <td className="text-center text-sm text-green-600 font-medium">{formatQty(s.quantity_delivered, ppp)}</td>
                                      <td className="text-center text-sm text-red-500">{formatQty(s.quantity_returned, ppp)}</td>
                                      <td className="text-center">
                                        <span className={`text-sm font-bold ${s.remaining > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600'}`}>
                                          {formatQty(s.remaining, ppp)}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <div className="inline-flex items-center gap-1">
                                          <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                            <div
                                              className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{pct}%</span>
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
                      <div key={`van-${session.id}`} className="bg-purple-50/50 dark:bg-purple-900/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-medium dark:text-white">{session.reference}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[session.status]}`}>
                              {statusLabels[session.status]}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                              بيع متنقل
                            </span>
                            {session.vehicle && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {session.vehicle.name} {session.vehicle.plate_number ? `(${session.vehicle.plate_number})` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              مبيعات: <span className="font-medium text-gray-800 dark:text-gray-200">{session.sales_count}</span>
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              محصّل: <span className="font-medium text-green-600">{formatCurrency(session.total_collected)}</span>
                            </span>
                          </div>
                        </div>

                        {session.items.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                  <th className="text-right py-2 font-medium">المنتج</th>
                                  <th className="text-center py-2 font-medium">محمّل</th>
                                  <th className="text-center py-2 font-medium">مباع</th>
                                  <th className="text-center py-2 font-medium">مرتجع</th>
                                  <th className="text-center py-2 font-medium">متاح</th>
                                  <th className="text-center py-2 font-medium">%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {session.items.map((item) => {
                                  const pct = getProgressPercent(item.quantity_sold, item.quantity_loaded);
                                  const ppp = item.product?.pieces_per_package;
                                  return (
                                    <tr key={item.product_id} className="border-b dark:border-gray-700/50 last:border-0">
                                      <td className="py-2">
                                        <span className="text-sm font-medium dark:text-white">{item.product?.name}</span>
                                        {item.product?.barcode && (
                                          <span className="text-xs text-gray-400 mr-2">({item.product.barcode})</span>
                                        )}
                                      </td>
                                      <td className="text-center text-sm dark:text-gray-300">{formatQty(item.quantity_loaded, ppp)}</td>
                                      <td className="text-center text-sm text-green-600 font-medium">{formatQty(item.quantity_sold, ppp)}</td>
                                      <td className="text-center text-sm text-red-500">{formatQty(item.quantity_returned, ppp)}</td>
                                      <td className="text-center">
                                        <span className={`text-sm font-bold ${item.available > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600'}`}>
                                          {formatQty(item.available, ppp)}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <div className="inline-flex items-center gap-1">
                                          <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                            <div
                                              className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{pct}%</span>
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

                    {/* Warehouse Stock (cashvan drivers) */}
                    {livreur.warehouse_stock && (
                      <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium dark:text-white">{livreur.warehouse_stock.warehouse.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                              مخزون مستودع
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">
                              مبيعات اليوم: <span className="font-medium text-gray-800 dark:text-gray-200">{livreur.warehouse_stock.sales_count}</span>
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              إجمالي: <span className="font-medium text-green-600">{formatCurrency(livreur.warehouse_stock.total_sales)}</span>
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              محصّل: <span className="font-medium text-green-600">{formatCurrency(livreur.warehouse_stock.total_collected)}</span>
                            </span>
                          </div>
                        </div>

                        {livreur.warehouse_stock.items.length > 0 && (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                  <th className="text-right py-2 font-medium">المنتج</th>
                                  <th className="text-center py-2 font-medium">المحمّل</th>
                                  <th className="text-center py-2 font-medium">مباع</th>
                                  <th className="text-center py-2 font-medium">متاح</th>
                                  <th className="text-center py-2 font-medium">%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {livreur.warehouse_stock.items.map((item) => {
                                  const ppp = item.product?.pieces_per_package;
                                  const pct = getProgressPercent(item.quantity_sold, item.quantity_loaded);
                                  return (
                                    <tr key={item.product_id} className="border-b dark:border-gray-700/50 last:border-0">
                                      <td className="py-2">
                                        <span className="text-sm font-medium dark:text-white">{item.product?.name}</span>
                                        {item.product?.barcode && (
                                          <span className="text-xs text-gray-400 mr-2">({item.product.barcode})</span>
                                        )}
                                      </td>
                                      <td className="text-center text-sm dark:text-gray-300">{formatQty(item.quantity_loaded, ppp)}</td>
                                      <td className="text-center text-sm text-green-600 font-medium">{formatQty(item.quantity_sold, ppp)}</td>
                                      <td className="text-center">
                                        <span className={`text-sm font-bold ${item.available > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600'}`}>
                                          {formatQty(item.available, ppp)}
                                        </span>
                                      </td>
                                      <td className="text-center">
                                        <div className="inline-flex items-center gap-1">
                                          <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                            <div
                                              className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{pct}%</span>
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
          })}
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && returnLivreur && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeReturnModal}>
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold dark:text-white">إرجاع منتجات</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{returnLivreur.user.name}</p>
                </div>
              </div>
              <button onClick={closeReturnModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Warehouse selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">المستودع المستلم</label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value ? parseInt(e.target.value) : '')}
                  className="input w-full"
                >
                  <option value="">اختر المستودع...</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Products table */}
              {returnItems.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">لا توجد منتجات متاحة للإرجاع</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                        <th className="text-right py-2.5 font-medium">المنتج</th>
                        <th className="text-center py-2.5 font-medium">المصدر</th>
                        <th className="text-center py-2.5 font-medium">المتاح</th>
                        <th className="text-center py-2.5 font-medium">كمية الإرجاع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnItems.map((item, index) => {
                        const ppp = item.pieces_per_package || 1;
                        const hasPackaging = ppp > 1;
                        return (
                          <tr key={`${item.source_type}-${item.source_id}-${item.product_id}`} className="border-b dark:border-gray-700/50 last:border-0">
                            <td className="py-2.5">
                              <span className="text-sm font-medium dark:text-white">{item.product_name}</span>
                            </td>
                            <td className="text-center py-2.5">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${sourceTypeColors[item.source_type]}`}>
                                {sourceTypeLabels[item.source_type]}
                              </span>
                              <span className="block text-xs text-gray-400 mt-0.5">{item.source_label}</span>
                            </td>
                            <td className="text-center py-2.5">
                              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
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
                                  <span className="text-xs text-gray-500 dark:text-gray-400">{hasPackaging ? 'كرتون' : 'وحدة'}</span>
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
                                    <span className="text-xs text-gray-500 dark:text-gray-400">قطعة</span>
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
            <div className="flex items-center justify-between p-5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
              <button onClick={closeReturnModal} className="btn btn-secondary">
                إلغاء
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={isReturning || !selectedWarehouse || returnItems.length === 0}
                className="btn bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReturning ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري الإرجاع...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    تأكيد الإرجاع
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
