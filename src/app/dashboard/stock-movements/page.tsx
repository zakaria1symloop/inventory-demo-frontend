'use client';

import { useState, useEffect, useMemo } from 'react';
import { stockMovementsApi, productsApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import {
  ArrowPathIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsRightLeftIcon,
  CubeIcon,
  TruckIcon,
  ShoppingCartIcon,
  ClipboardDocumentCheckIcon,
  BanknotesIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

interface StockMovement {
  id: number;
  product_id: number;
  warehouse_id: number;
  user_id: number;
  type: string;
  reference: string;
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  unit_cost: number;
  note: string;
  created_at: string;
  product?: { id: number; name: string; sku: string; barcode: string; pieces_per_package: number };
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
}

interface Product {
  id: number;
  name: string;
  sku: string;
}

interface Warehouse {
  id: number;
  name: string;
}

const MOVEMENT_TYPES = {
  purchase: { label: 'شراء', color: 'bg-green-100 text-green-800 border-green-200', icon: ArrowDownIcon, direction: 'in' },
  purchase_return: { label: 'مرتجع شراء', color: 'bg-red-100 text-red-800 border-red-200', icon: ArrowUpIcon, direction: 'out' },
  sale: { label: 'بيع', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ArrowUpIcon, direction: 'out' },
  sale_return: { label: 'مرتجع بيع', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ArrowDownIcon, direction: 'in' },
  adjustment: { label: 'تسوية', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: ArrowsRightLeftIcon, direction: 'both' },
  transfer: { label: 'نقل', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: ArrowsRightLeftIcon, direction: 'both' },
  delivery: { label: 'توصيل', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: TruckIcon, direction: 'out' },
  delivery_out: { label: 'خروج للتوصيل', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: TruckIcon, direction: 'out' },
  delivery_return: { label: 'مرتجع توصيل', color: 'bg-pink-100 text-pink-800 border-pink-200', icon: ArrowDownIcon, direction: 'in' },
  opening: { label: 'رصيد افتتاحي', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: ArchiveBoxIcon, direction: 'in' },
  order: { label: 'طلب', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: ShoppingCartIcon, direction: 'out' },
  van_out: { label: 'خروج للبيع المتنقل', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: TruckIcon, direction: 'out' },
  van_sale: { label: 'بيع متنقل', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: BanknotesIcon, direction: 'out' },
  van_return: { label: 'مرتجع بيع متنقل', color: 'bg-teal-100 text-teal-800 border-teal-200', icon: ArrowDownIcon, direction: 'in' },
} as const;

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  // Filters
  const [showFilters, setShowFilters] = useState(true);
  const [productFilter, setProductFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { t, locale } = useLocale();

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [productFilter, warehouseFilter, typeFilter, directionFilter, fromDate, toDate, pagination.currentPage]);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll({ per_page: 1000 });
      setProducts(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesApi.getAll();
      setWarehouses(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchMovements = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, unknown> = {
        page: pagination.currentPage,
        per_page: 25,
      };
      if (productFilter) params.product_id = productFilter;
      if (warehouseFilter) params.warehouse_id = warehouseFilter;
      if (typeFilter) params.type = typeFilter;
      if (directionFilter) params.direction = directionFilter;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const response = await stockMovementsApi.getAll(params);
      const data = response.data;
      setMovements(data.data || []);
      setPagination({
        currentPage: data.current_page || 1,
        lastPage: data.last_page || 1,
        total: data.total || 0,
      });
    } catch (error) {
      toast.error(t('common.loadError', { item: t('stock.movementsTitle') }));
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setProductFilter('');
    setWarehouseFilter('');
    setTypeFilter('');
    setDirectionFilter('');
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = productFilter || warehouseFilter || typeFilter || directionFilter || fromDate || toDate;

  // Filter movements by search term (client-side for current page)
  const filteredMovements = useMemo(() => {
    if (!searchTerm) return movements;
    const term = searchTerm.toLowerCase();
    return movements.filter(m =>
      m.product?.name?.toLowerCase().includes(term) ||
      m.product?.sku?.toLowerCase().includes(term) ||
      m.reference?.toLowerCase().includes(term) ||
      m.warehouse?.name?.toLowerCase().includes(term)
    );
  }, [movements, searchTerm]);

  // Calculate summary from current data
  const summary = useMemo(() => {
    const incoming = filteredMovements.filter(m => m.quantity_change > 0).reduce((sum, m) => sum + m.quantity_change, 0);
    const outgoing = filteredMovements.filter(m => m.quantity_change < 0).reduce((sum, m) => sum + Math.abs(m.quantity_change), 0);
    return { incoming, outgoing, net: incoming - outgoing };
  }, [filteredMovements]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatNumber = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ').format(num);
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return '0 د.ج.';
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
  };

  const formatQty = (qty: number, ppp: number) => {
    const absQty = Math.abs(qty);
    if (!ppp || ppp <= 1) return `${formatNumber(qty)} ${t('stock.piece')}`;
    const cartons = Math.floor(absQty / ppp);
    const pieces = absQty % ppp;
    const sign = qty < 0 ? '-' : '';
    if (absQty === 0) return '0';
    if (pieces === 0) return `${sign}${cartons} ${t('stock.carton')} (${formatNumber(qty)} ق)`;
    if (cartons === 0) return `${formatNumber(qty)} ${t('stock.piece')}`;
    return `${sign}${cartons} ك + ${pieces} ق (${formatNumber(qty)})`;
  };

  const getTypeInfo = (type: string) => {
    const typeLabels: Record<string, string> = {
      purchase: t('stock.typePurchase'),
      purchase_return: t('stock.typePurchaseReturn'),
      sale: t('stock.typeSale'),
      sale_return: t('stock.typeSaleReturn'),
      adjustment: t('stock.typeAdjustment'),
      transfer: t('stock.typeTransfer'),
      delivery: t('stock.typeDelivery'),
      delivery_out: t('stock.typeDeliveryOut'),
      delivery_return: t('stock.typeDeliveryReturn'),
      opening: t('stock.typeOpening'),
      order: t('stock.typeOrder'),
      van_out: t('stock.typeVanOut'),
      van_sale: t('stock.typeVanSale'),
      van_return: t('stock.typeVanReturn'),
    };
    const base = MOVEMENT_TYPES[type as keyof typeof MOVEMENT_TYPES] || {
      label: type,
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: CubeIcon,
      direction: 'both'
    };
    return { ...base, label: typeLabels[type] || base.label };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('stock.movementsTitle')}</h1>
          <p className="text-gray-500 mt-1">{t('stock.movementsSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-outline inline-flex items-center gap-2 ${hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}`}
          >
            <FunnelIcon className="w-5 h-5" />
            {t('common.filters')}
            {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
          </button>
          <button onClick={fetchMovements} className="btn btn-outline inline-flex items-center gap-2">
            <ArrowPathIcon className="w-5 h-5" />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 bg-green-50 border border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ArrowDownIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-green-600">{t('stock.incoming')}</div>
              <div className="text-xl font-bold text-green-700">+{formatNumber(summary.incoming)}</div>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-red-50 border border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <ArrowUpIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-red-600">{t('stock.outgoing')}</div>
              <div className="text-xl font-bold text-red-700">-{formatNumber(summary.outgoing)}</div>
            </div>
          </div>
        </div>
        <div className="card p-4 bg-blue-50 border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ArrowsRightLeftIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-blue-600">{t('stock.net')}</div>
              <div className={`text-xl font-bold ${summary.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {summary.net >= 0 ? '+' : ''}{formatNumber(summary.net)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">{t('common.filterResults')}</h3>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                <XMarkIcon className="w-4 h-4" />
                {t('common.clearFilters')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('common.search')}</label>
              <input
                type="text"
                placeholder={t('stock.searchProductOrRef')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            {/* Product Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('stock.product')}</label>
              <select
                value={productFilter}
                onChange={(e) => { setProductFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
                className="select select-bordered w-full"
              >
                <option value="">{t('common.all')}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>

            {/* Warehouse Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('stock.warehouse')}</label>
              <select
                value={warehouseFilter}
                onChange={(e) => { setWarehouseFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
                className="select select-bordered w-full"
              >
                <option value="">{t('common.all')}</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('stock.movementType')}</label>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
                className="select select-bordered w-full"
              >
                <option value="">{t('stock.allTypes')}</option>
                {Object.keys(MOVEMENT_TYPES).map((key) => {
                  const info = getTypeInfo(key);
                  return <option key={key} value={key}>{info.label}</option>;
                })}
              </select>
            </div>

            {/* Direction Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('stock.direction')}</label>
              <select
                value={directionFilter}
                onChange={(e) => { setDirectionFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
                className="select select-bordered w-full"
              >
                <option value="">{t('common.all')}</option>
                <option value="incoming">{t('stock.dirIncoming')}</option>
                <option value="outgoing">{t('stock.dirOutgoing')}</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('common.fromDate')}</label>
              <DateInput
                value={fromDate}
                onChange={(v) => { setFromDate(v); setPagination(p => ({ ...p, currentPage: 1 })); }}
                placeholder={t('common.fromDate')}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">{t('common.toDate')}</label>
              <DateInput
                value={toDate}
                onChange={(v) => { setToDate(v); setPagination(p => ({ ...p, currentPage: 1 })); }}
                placeholder={t('common.toDate')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">{t('common.date')}</th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">{t('stock.product')}</th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">{t('stock.warehouse')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">{t('stock.movementType')}</th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">{t('stock.reference')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">{t('stock.before')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">{t('stock.change')}</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">{t('stock.after')}</th>
                  <th className="px-4 py-3 text-start text-sm font-medium text-gray-600">{t('stock.userCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">{t('stock.noMovements')}</p>
                      <p className="text-sm">{t('stock.tryChangeFilters')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((movement) => {
                    const typeInfo = getTypeInfo(movement.type);
                    const IconComponent = typeInfo.icon;
                    const isIncoming = movement.quantity_change > 0;

                    return (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(movement.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{movement.product?.name || '-'}</div>
                          <div className="text-xs text-gray-500">{movement.product?.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {movement.warehouse?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${typeInfo.color}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-gray-600">
                            {movement.reference || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          <div>{formatNumber(movement.quantity_before)}</div>
                          {(movement.product?.pieces_per_package ?? 0) > 1 && (
                            <div className="text-xs text-gray-400">{formatQty(movement.quantity_before, movement.product!.pieces_per_package)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 font-bold ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                            {isIncoming ? (
                              <ArrowDownIcon className="w-4 h-4" />
                            ) : (
                              <ArrowUpIcon className="w-4 h-4" />
                            )}
                            {isIncoming ? '+' : ''}{formatNumber(movement.quantity_change)}
                          </span>
                          {(movement.product?.pieces_per_package ?? 0) > 1 && (
                            <div className={`text-xs ${isIncoming ? 'text-green-500' : 'text-red-500'}`}>
                              {formatQty(movement.quantity_change, movement.product!.pieces_per_package)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                          <div>{formatNumber(movement.quantity_after)}</div>
                          {(movement.product?.pieces_per_package ?? 0) > 1 && (
                            <div className="text-xs text-gray-400">{formatQty(movement.quantity_after, movement.product!.pieces_per_package)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {movement.user?.name || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-600">
              {t('common.showing', { count: filteredMovements.length, total: pagination.total, item: t('stock.movement') })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="btn btn-sm btn-ghost disabled:opacity-50"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
              <span className="px-3 py-1 text-sm font-medium">
                {pagination.currentPage} / {pagination.lastPage}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.lastPage}
                className="btn btn-sm btn-ghost disabled:opacity-50"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Movement Types Legend */}
      <div className="card p-4">
        <h3 className="font-medium mb-3">{t('stock.movementTypesGuide')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.keys(MOVEMENT_TYPES).map((key) => {
            const info = getTypeInfo(key);
            const IconComponent = info.icon;
            return (
              <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${info.color}`}>
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{info.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
