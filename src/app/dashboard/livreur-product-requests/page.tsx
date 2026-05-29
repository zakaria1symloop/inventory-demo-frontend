'use client';

import { useState, useEffect, useMemo } from 'react';
import { productRequestsApi, warehousesApi, usersApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  UserIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

interface RequestItem {
  id: number;
  product_id: number;
  quantity_requested: number;
  quantity_approved: number;
  notes?: string;
  product?: { id: number; name: string; barcode?: string; pieces_per_package?: number; cost_price?: number };
}

interface ProductRequest {
  id: number;
  reference: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  notes?: string;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
  warehouse_id?: number;
  requester?: { id: number; name: string };
  warehouse?: { id: number; name: string };
  processor?: { id: number; name: string };
  items: RequestItem[];
}

interface StockItem { product_id: number; quantity: number }

export default function LivreurProductRequestsPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  const STATUS_CONFIG = useMemo(() => ({
    pending:   { label: t('productRequests.statusPending'),   dot: 'orange'  as const },
    approved:  { label: t('productRequests.statusApproved'),  dot: 'blue'    as const },
    rejected:  { label: t('productRequests.statusRejected'),  dot: 'red'     as const },
    fulfilled: { label: t('productRequests.statusFulfilled'), dot: 'green'   as const },
  }), [t]);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [livreurFilter, setLivreurFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [allRequests, setAllRequests] = useState<ProductRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  // Expand state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [requestDetails, setRequestDetails] = useState<Record<number, ProductRequest>>({});
  const [approveQtys, setApproveQtys] = useState<Record<number, number>>({});
  const [adminNotes, setAdminNotes] = useState('');
  const [warehouseStock, setWarehouseStock] = useState<Record<number, StockItem[]>>({});

  // Filter data
  const [livreurs, setLivreurs] = useState<Array<{ id: number; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    Promise.all([usersApi.getLivreurs(), warehousesApi.getAll()])
      .then(([lRes, wRes]) => {
        setLivreurs(lRes.data || []);
        setWarehouses(wRes.data || []);
      }).catch(() => {});
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { type: 'livreur', page, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (livreurFilter) params.requester_id = livreurFilter;
      if (warehouseFilter) params.warehouse_id = warehouseFilter;
      if (dateFrom) params.from_date = dateFrom;
      if (dateTo) params.to_date = dateTo;
      const res = await productRequestsApi.getAll(params);
      const d = res.data;
      setRequests(d.data || d);
      setTotal(d.total || (d.data || d).length);
      setLastPage(d.last_page || 1);
    } catch { toast.error(t('productRequests.errorLoadingRequests')); }
    finally { setIsLoading(false); }
  };

  const fetchAllForKpis = async () => {
    try {
      const res = await productRequestsApi.getAll({ type: 'livreur', per_page: 10000 });
      const d = res.data;
      setAllRequests(d.data || d);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchRequests(); }, [page, search, statusFilter, livreurFilter, warehouseFilter, dateFrom, dateTo]);
  useEffect(() => { fetchAllForKpis(); }, []);

  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      total: allRequests.length,
      todayCount: allRequests.filter(r => r.created_at?.startsWith(today)).length,
      pendingCount: allRequests.filter(r => r.status === 'pending').length,
      approvedCount: allRequests.filter(r => r.status === 'approved').length,
      rejectedCount: allRequests.filter(r => r.status === 'rejected').length,
      fulfilledCount: allRequests.filter(r => r.status === 'fulfilled').length,
    };
  }, [allRequests]);

  const clearFilters = () => {
    setStatusFilter(''); setLivreurFilter(''); setWarehouseFilter('');
    setDateFrom(''); setDateTo(''); setSearch(''); setPage(1);
  };

  const activeFilterCount = [statusFilter, livreurFilter, warehouseFilter, dateFrom, dateTo, search].filter(Boolean).length;

  const handleExpand = async (req: ProductRequest) => {
    if (expandedId === req.id) { setExpandedId(null); return; }
    setExpandedId(req.id);
    setAdminNotes('');
    if (!requestDetails[req.id]) {
      setLoadingDetail(true);
      try {
        const res = await productRequestsApi.getOne(req.id);
        const detail = res.data;
        setRequestDetails(prev => ({ ...prev, [req.id]: detail }));
        if (req.status === 'pending' && detail.items) {
          const qtys: Record<number, number> = {};
          detail.items.forEach((item: RequestItem) => { qtys[item.id] = item.quantity_requested; });
          setApproveQtys(qtys);
        }
        if (req.status === 'pending' && req.warehouse_id && !warehouseStock[req.warehouse_id]) {
          const sRes = await warehousesApi.getStock(req.warehouse_id);
          setWarehouseStock(prev => ({
            ...prev,
            [req.warehouse_id!]: (sRes.data || []).map((s: Record<string, unknown>) => ({
              product_id: s.product_id as number,
              quantity: Number(s.quantity) || 0,
            })),
          }));
        }
      } catch { toast.error(t('productRequests.errorLoadingRequests')); }
      finally { setLoadingDetail(false); }
    } else {
      const detail = requestDetails[req.id];
      if (req.status === 'pending' && detail.items) {
        const qtys: Record<number, number> = {};
        detail.items.forEach((item: RequestItem) => { qtys[item.id] = item.quantity_requested; });
        setApproveQtys(qtys);
      }
    }
  };

  const getAvailableStock = (warehouseId: number | undefined, productId: number): number | null => {
    if (!warehouseId || !warehouseStock[warehouseId]) return null;
    const s = warehouseStock[warehouseId].find(x => x.product_id === productId);
    return s ? s.quantity : 0;
  };

  const handleApprove = async (req: ProductRequest) => {
    setIsActioning(true);
    try {
      const detail = requestDetails[req.id];
      const items = (detail?.items || []).map((item: RequestItem) => ({
        id: item.id,
        quantity_approved: approveQtys[item.id] ?? item.quantity_requested,
      }));
      await productRequestsApi.approve(req.id, { items, admin_notes: adminNotes || null });
      toast.success(t('productRequests.approvedSuccess'));
      setExpandedId(null);
      setRequestDetails(prev => { const c = { ...prev }; delete c[req.id]; return c; });
      fetchRequests(); fetchAllForKpis();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('productRequests.errorApproving'));
    } finally { setIsActioning(false); }
  };

  const handleReject = async (req: ProductRequest) => {
    setIsActioning(true);
    try {
      await productRequestsApi.reject(req.id, { admin_notes: adminNotes || null });
      toast.success(t('productRequests.rejectedSuccess'));
      setExpandedId(null);
      setRequestDetails(prev => { const c = { ...prev }; delete c[req.id]; return c; });
      fetchRequests(); fetchAllForKpis();
    } catch { toast.error(t('productRequests.errorRejecting')); }
    finally { setIsActioning(false); }
  };

  const fmtQty = (val: unknown, ppp?: number) => {
    const total = Math.round(Number(val) || 0);
    if (!ppp || ppp <= 1) return String(total);
    const c = Math.floor(total / ppp); const p = total % ppp;
    if (c > 0 && p > 0) return `${c} ${t('productRequests.carton')} ${p} ${t('productRequests.piece')}`;
    if (c > 0) return `${c} ${t('productRequests.carton')}`;
    return `${p} ${t('productRequests.piece')}`;
  };

  const splitQty = (total: number, ppp: number) => ({ cartons: ppp > 1 ? Math.floor(total / ppp) : total, pieces: ppp > 1 ? total % ppp : 0 });
  const combineQty = (c: number, p: number, ppp: number) => c * (ppp > 1 ? ppp : 1) + p;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const PrevChevron = isRTL ? ChevronRightIcon : ChevronLeftIcon;
  const NextChevron = isRTL ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <div>
      <PageHeader title={t('productRequests.livreurTitle')} subtitle={t('productRequests.livreurSubtitle')}>
        <button
          onClick={() => { fetchRequests(); fetchAllForKpis(); }}
          className="inline-flex items-center gap-1.5 px-3 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{t('productRequests.refresh')}</span>
        </button>
      </PageHeader>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="metric-tile">
          <div className="metric-label">{t('productRequests.lrTotal')}</div>
          <div className="metric-value tnum">{kpis.total}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label flex items-center gap-1.5"><span className="metric-dot metric-dot-orange" aria-hidden />{t('productRequests.statusPending')}</div>
          <div className="metric-value tnum">{kpis.pendingCount}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label flex items-center gap-1.5"><span className="metric-dot metric-dot-green" aria-hidden />{t('productRequests.statusFulfilled')}</div>
          <div className="metric-value tnum">{kpis.fulfilledCount}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label flex items-center gap-1.5"><span className="metric-dot metric-dot-red" aria-hidden />{t('productRequests.statusRejected')}</div>
          <div className="metric-value tnum">{kpis.rejectedCount}</div>
        </div>
      </div>

      <FilterBar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder={t('productRequests.searchPlaceholder')}
        trailing={
          activeFilterCount > 0 ? (
            <button onClick={clearFilters} className="text-[13px] text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">
              {t('productRequests.clear')}
            </button>
          ) : (
            <span className="text-[12px] text-gray-400 dark:text-gray-500 hidden sm:inline tnum">{total} {t('productRequests.lrCount')}</span>
          )
        }
      >
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">{t('productRequests.allStatuses')}</option>
          <option value="pending">{t('productRequests.statusPending')}</option>
          <option value="approved">{t('productRequests.statusApproved')}</option>
          <option value="rejected">{t('productRequests.statusRejected')}</option>
          <option value="fulfilled">{t('productRequests.statusFulfilled')}</option>
        </select>
        <select value={livreurFilter} onChange={(e) => { setLivreurFilter(e.target.value); setPage(1); }}>
          <option value="">{t('productRequests.lrAllLivreurs')}</option>
          {livreurs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}>
          <option value="">{t('productRequests.lrAllWarehouses')}</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder={t('productRequests.fromDate')} />
        <DateInput value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder={t('productRequests.toDate')} />
      </FilterBar>

      <div className="surface-pro">
        {/* Quick Chips */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          {([
            { value: '', label: t('productRequests.all'), count: kpis.total },
            { value: 'pending', label: t('productRequests.statusPending'), count: kpis.pendingCount },
            { value: 'approved', label: t('productRequests.statusApproved'), count: kpis.approvedCount },
            { value: 'fulfilled', label: t('productRequests.statusFulfilled'), count: kpis.fulfilledCount },
            { value: 'rejected', label: t('productRequests.statusRejected'), count: kpis.rejectedCount },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === opt.value
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
              {opt.count > 0 && (
                <span className={`text-[10px] tnum ${statusFilter === opt.value ? 'opacity-70' : 'opacity-60'}`}>({opt.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="p-3 space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><div className="spinner w-8 h-8"></div></div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 t-empty">
              <ClipboardDocumentListIcon className="w-10 h-10 mb-3" />
              <p className="text-[14px] font-medium">{t('productRequests.noRequests')}</p>
              <p className="text-[13px] mt-1">{t('productRequests.noRequestsDesc')}</p>
            </div>
          ) : requests.map((req) => {
            const statusCfg = STATUS_CONFIG[req.status] || { label: req.status, dot: 'neutral' as const };
            const isExpanded = expandedId === req.id;
            const detail = requestDetails[req.id];
            const items: RequestItem[] = detail?.items || [];
            const hasStockData = req.warehouse_id ? !!warehouseStock[req.warehouse_id] : false;

            return (
              <div key={req.id} className="bg-white dark:bg-gray-800 rounded-md border border-gray-200/80 dark:border-gray-700 overflow-hidden">
                {/* Card Header */}
                <div
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                  onClick={() => handleExpand(req)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[13px] font-medium text-gray-900 dark:text-gray-100">{req.reference}</span>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                          <span className={`metric-dot metric-dot-${statusCfg.dot}`} aria-hidden />
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[12px] text-gray-500 dark:text-gray-400">
                        {req.requester?.name && (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5" />
                            {req.requester.name}
                          </span>
                        )}
                        {req.warehouse?.name && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <span className="flex items-center gap-1">
                              <BuildingStorefrontIcon className="w-3.5 h-3.5" />
                              {req.warehouse.name}
                            </span>
                          </>
                        )}
                        <span className="text-gray-300 dark:text-gray-600">·</span>
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {formatDate(req.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 shrink-0 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                    <ChevronDownIcon className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="spinner w-6 h-6"></div>
                        <span className={`text-[13px] text-gray-500 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>{t('productRequests.lrLoadingDetails')}</span>
                      </div>
                    ) : (
                      <>
                        {/* Info Grid */}
                        <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-gray-100 dark:border-gray-700">
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('productRequests.requester')}</span>
                            <div className="text-[13px] t-strong mt-0.5">{req.requester?.name || '-'}</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('productRequests.warehouse')}</span>
                            <div className="text-[13px] t-strong mt-0.5">{req.warehouse?.name || '-'}</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('productRequests.date')}</span>
                            <div className="text-[13px] t-strong mt-0.5">{formatDate(req.created_at)}</div>
                          </div>
                        </div>

                        {/* Stock warnings for pending */}
                        {req.status === 'pending' && hasStockData && (() => {
                          const shorts = items.filter(item => {
                            const av = getAvailableStock(req.warehouse_id, item.product_id);
                            const need = approveQtys[item.id] ?? item.quantity_requested;
                            return av !== null && av < need;
                          });
                          if (shorts.length === 0) return (
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                              <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                <span className="metric-dot metric-dot-green" aria-hidden />
                                {t('productRequests.allStockAvailable')}
                              </div>
                            </div>
                          );
                          return (
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                              <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900 dark:text-gray-100 mb-2">
                                <span className="metric-dot metric-dot-red" aria-hidden />
                                {t('productRequests.stockInsufficient')}
                              </div>
                              <div className="space-y-1">
                                {shorts.map(item => {
                                  const av = getAvailableStock(req.warehouse_id, item.product_id) ?? 0;
                                  const need = approveQtys[item.id] ?? item.quantity_requested;
                                  const ppp = item.product?.pieces_per_package || 1;
                                  return (
                                    <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between text-[13px] gap-0.5">
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">{item.product?.name}</span>
                                      <span className="text-gray-500 dark:text-gray-400 text-[12px] tnum">
                                        {t('productRequests.available')} <strong className="text-gray-700 dark:text-gray-300">{fmtQty(av, ppp)}</strong> | {t('productRequests.needed')} <strong className="text-gray-700 dark:text-gray-300">{fmtQty(need, ppp)}</strong>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Items Table */}
                        {items.length > 0 && (
                          <div className="px-4 py-2">
                            <div className="table-pro-wrap">
                              <table className="table-pro compact">
                                <thead>
                                  <tr>
                                    <th>{t('productRequests.product')}</th>
                                    <th className="tnum">{t('productRequests.quantityRequested')}</th>
                                    {req.status === 'pending' && hasStockData && (
                                      <th className="tnum">{t('productRequests.quantityAvailable')}</th>
                                    )}
                                    {req.status === 'pending' && (
                                      <th className="text-center">{t('productRequests.quantityApproved')}</th>
                                    )}
                                    {(req.status === 'approved' || req.status === 'fulfilled') && (
                                      <th className="tnum">{t('productRequests.quantityApproved')}</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map(item => {
                                    const available = getAvailableStock(req.warehouse_id, item.product_id);
                                    const needed = approveQtys[item.id] ?? item.quantity_requested;
                                    const isShort = req.status === 'pending' && available !== null && available < needed;
                                    const ppp = item.product?.pieces_per_package || 1;
                                    return (
                                      <tr key={item.id} className={isShort ? 'bg-red-50/40 dark:bg-red-900/10' : ''}>
                                        <td>
                                          <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{item.product?.name || `#${item.product_id}`}</span>
                                          {item.product?.barcode && <span className={`text-[11px] text-gray-400 dark:text-gray-500 ${isRTL ? 'mr-1' : 'ml-1'}`}>({item.product.barcode})</span>}
                                        </td>
                                        <td className="tnum">
                                          {fmtQty(item.quantity_requested, ppp)}
                                        </td>
                                        {req.status === 'pending' && hasStockData && (
                                          <td className="tnum">
                                            <span className="inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                              <span className={`metric-dot ${isShort ? 'metric-dot-red' : 'metric-dot-green'}`} aria-hidden />
                                              {available !== null ? fmtQty(available, ppp) : '-'}
                                            </span>
                                          </td>
                                        )}
                                        {req.status === 'pending' && (() => {
                                          const { cartons, pieces } = splitQty(needed, ppp);
                                          return (
                                            <td className="text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                <div className="flex flex-col items-center">
                                                  <input type="number" min="0" value={cartons}
                                                    onChange={(e) => {
                                                      const c = parseInt(e.target.value) || 0;
                                                      setApproveQtys(prev => ({ ...prev, [item.id]: combineQty(c, pieces, ppp) }));
                                                    }}
                                                    className="input w-14 text-center text-sm"
                                                  />
                                                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{ppp > 1 ? t('productRequests.carton') : t('productRequests.piece')}</span>
                                                </div>
                                                {ppp > 1 && (
                                                  <div className="flex flex-col items-center">
                                                    <input type="number" min="0" max={ppp - 1} value={pieces}
                                                      onChange={(e) => {
                                                        const p = parseInt(e.target.value) || 0;
                                                        setApproveQtys(prev => ({ ...prev, [item.id]: combineQty(cartons, p, ppp) }));
                                                      }}
                                                      className="input w-14 text-center text-sm"
                                                    />
                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{t('productRequests.piece')}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          );
                                        })()}
                                        {(req.status === 'approved' || req.status === 'fulfilled') && (
                                          <td className="tnum t-strong">
                                            {fmtQty(item.quantity_approved, ppp)}
                                          </td>
                                        )}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Admin notes + actions for pending */}
                        {req.status === 'pending' && (
                          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 space-y-2.5">
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder={t('productRequests.adminNotesPlaceholder')}
                              rows={2}
                              className="input w-full resize-none text-[13px]"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={isActioning}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 h-[34px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
                              >
                                {isActioning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                  <><CheckCircleIcon className="w-4 h-4" />{t('productRequests.approve')}</>
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                disabled={isActioning}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                              >
                                <XCircleIcon className="w-4 h-4" />
                                {t('productRequests.reject')}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Processor info */}
                        {req.processor && (
                          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-[12px] text-gray-500 dark:text-gray-400">
                            {t('productRequests.lrProcessedBy')} <span className="font-medium">{req.processor.name}</span>
                            {req.processed_at && <> · {formatDate(req.processed_at)}</>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1.5 px-3 h-[32px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md disabled:opacity-40 transition-colors"
            >
              <PrevChevron className="w-4 h-4" />
            </button>
            <span className="text-[13px] text-gray-500 dark:text-gray-400 tnum">{page} / {lastPage}</span>
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="inline-flex items-center gap-1.5 px-3 h-[32px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md disabled:opacity-40 transition-colors"
            >
              <NextChevron className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
