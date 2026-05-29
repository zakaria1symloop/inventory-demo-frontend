'use client';

import { useState, useEffect, useMemo } from 'react';
import { stockMovementsApi, productsApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  ArrowPathIcon,
  XMarkIcon,
  CubeIcon,
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

// Movement type → status dot color
const TYPE_DOTS: Record<string, string> = {
  purchase: 'metric-dot-green',
  purchase_return: 'metric-dot-red',
  sale: 'metric-dot-blue',
  sale_return: 'metric-dot-violet',
  adjustment: 'metric-dot-orange',
  transfer: 'metric-dot-neutral',
  transfer_in: 'metric-dot-blue',
  transfer_out: 'metric-dot-neutral',
  delivery: 'metric-dot-orange',
  delivery_out: 'metric-dot-orange',
  delivery_return: 'metric-dot-violet',
  opening: 'metric-dot-violet',
  order: 'metric-dot-blue',
  van_out: 'metric-dot-orange',
  van_sale: 'metric-dot-green',
  van_return: 'metric-dot-violet',
};

const ALL_TYPE_KEYS = Object.keys(TYPE_DOTS);

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });

  // Filters
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

  const hasActiveFilters = !!(productFilter || warehouseFilter || typeFilter || directionFilter || fromDate || toDate);

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

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      purchase: t('stock.typePurchase'),
      purchase_return: t('stock.typePurchaseReturn'),
      sale: t('stock.typeSale'),
      sale_return: t('stock.typeSaleReturn'),
      adjustment: t('stock.typeAdjustment'),
      transfer: t('stock.typeTransfer'),
      transfer_in: t('stock.typeTransferIn'),
      transfer_out: t('stock.typeTransferOut'),
      delivery: t('stock.typeDelivery'),
      delivery_out: t('stock.typeDeliveryOut'),
      delivery_return: t('stock.typeDeliveryReturn'),
      opening: t('stock.typeOpening'),
      order: t('stock.typeOrder'),
      van_out: t('stock.typeVanOut'),
      van_sale: t('stock.typeVanSale'),
      van_return: t('stock.typeVanReturn'),
    };
    return typeLabels[type] || type;
  };

  return (
    <div>
      <PageHeader
        title={t('stock.movementsTitle')}
        subtitle={t('stock.movementsSubtitle')}
      >
        <button
          onClick={fetchMovements}
          className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" strokeWidth={1.8} />
          {t('common.refresh')}
        </button>
      </PageHeader>

      {/* Metric tiles */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-green" aria-hidden />
            <p className="metric-label truncate">{t('stock.incoming')}</p>
          </div>
          <p className="metric-value tnum">+{formatNumber(summary.incoming)}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-red" aria-hidden />
            <p className="metric-label truncate">{t('stock.outgoing')}</p>
          </div>
          <p className="metric-value tnum">-{formatNumber(summary.outgoing)}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-blue" aria-hidden />
            <p className="metric-label truncate">{t('stock.net')}</p>
          </div>
          <p className="metric-value tnum">{summary.net >= 0 ? '+' : ''}{formatNumber(summary.net)}</p>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('stock.searchProductOrRef')}
        trailing={hasActiveFilters ? (
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
            {t('common.clearFilters')}
          </button>
        ) : undefined}
      >
        <select
          value={productFilter}
          onChange={(e) => { setProductFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
        >
          <option value="">{t('stock.product')}</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </select>
        <select
          value={warehouseFilter}
          onChange={(e) => { setWarehouseFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
        >
          <option value="">{t('stock.warehouse')}</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
        >
          <option value="">{t('stock.allTypes')}</option>
          {ALL_TYPE_KEYS.map((key) => (
            <option key={key} value={key}>{getTypeLabel(key)}</option>
          ))}
        </select>
        <select
          value={directionFilter}
          onChange={(e) => { setDirectionFilter(e.target.value); setPagination(p => ({ ...p, currentPage: 1 })); }}
        >
          <option value="">{t('stock.direction')}</option>
          <option value="incoming">{t('stock.dirIncoming')}</option>
          <option value="outgoing">{t('stock.dirOutgoing')}</option>
        </select>
        <DateInput
          value={fromDate}
          onChange={(v) => { setFromDate(v); setPagination(p => ({ ...p, currentPage: 1 })); }}
          placeholder={t('common.fromDate')}
        />
        <DateInput
          value={toDate}
          onChange={(v) => { setToDate(v); setPagination(p => ({ ...p, currentPage: 1 })); }}
          placeholder={t('common.toDate')}
        />
      </FilterBar>

      {/* Table */}
      <div>
        {isLoading ? (
          <div className="surface-pro flex items-center justify-center h-64">
            <div className="spinner"></div>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="surface-pro text-center py-12 text-gray-500 dark:text-gray-400">
            <CubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
            <p className="text-[14px] font-medium">{t('stock.noMovements')}</p>
            <p className="text-[12px] mt-1 t-muted">{t('stock.tryChangeFilters')}</p>
          </div>
        ) : (
          <div className="table-pro-wrap">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>{t('common.date')}</th>
                  <th>{t('stock.product')}</th>
                  <th>{t('stock.warehouse')}</th>
                  <th>{t('stock.movementType')}</th>
                  <th>{t('stock.reference')}</th>
                  <th className="text-end">{t('stock.before')}</th>
                  <th className="text-end">{t('stock.change')}</th>
                  <th className="text-end">{t('stock.after')}</th>
                  <th>{t('stock.userCol')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map((movement) => {
                  const typeLabel = getTypeLabel(movement.type);
                  const typeDot = TYPE_DOTS[movement.type] || 'metric-dot-neutral';
                  const isIncoming = movement.quantity_change > 0;
                  const ppp = movement.product?.pieces_per_package ?? 0;
                  return (
                    <tr key={movement.id}>
                      <td className="tnum t-muted whitespace-nowrap">{formatDate(movement.created_at)}</td>
                      <td>
                        <div className="t-strong">{movement.product?.name || '-'}</div>
                        {movement.product?.sku && <div className="text-[11px] t-muted">{movement.product.sku}</div>}
                      </td>
                      <td className="t-muted">{movement.warehouse?.name || '-'}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                          <span className={`metric-dot ${typeDot}`} aria-hidden />
                          {typeLabel}
                        </span>
                      </td>
                      <td className="font-mono text-[12px] t-muted">{movement.reference || '-'}</td>
                      <td className="tnum t-muted">
                        <div>{formatNumber(movement.quantity_before)}</div>
                        {ppp > 1 && (
                          <div className="text-[11px] t-muted">{formatQty(movement.quantity_before, ppp)}</div>
                        )}
                      </td>
                      <td className="tnum t-strong">
                        <div>{isIncoming ? '+' : ''}{formatNumber(movement.quantity_change)}</div>
                        {ppp > 1 && (
                          <div className="text-[11px] t-muted">{formatQty(movement.quantity_change, ppp)}</div>
                        )}
                      </td>
                      <td className="tnum">
                        <div>{formatNumber(movement.quantity_after)}</div>
                        {ppp > 1 && (
                          <div className="text-[11px] t-muted">{formatQty(movement.quantity_after, ppp)}</div>
                        )}
                      </td>
                      <td className="t-muted">{movement.user?.name || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              {t('common.showing', { count: filteredMovements.length, total: pagination.total, item: t('stock.movement') })}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
              >
                {pagination.currentPage - 1 || '—'}
              </button>
              <span className="px-2.5 py-1 text-[12px] font-medium text-gray-900 dark:text-white">
                {pagination.currentPage} / {pagination.lastPage}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage === pagination.lastPage}
                className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
              >
                {pagination.currentPage + 1 > pagination.lastPage ? '—' : pagination.currentPage + 1}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
