'use client';

import { useState, useEffect, useMemo } from 'react';
import { productRequestsApi, warehousesApi, usersApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  UserIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  CubeIcon,
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
    pending:   { label: t('productRequests.statusPending'),   bg: 'bg-amber-50',   darkBg: 'dark:bg-amber-900/30',   text: 'text-amber-700',   darkText: 'dark:text-amber-400' },
    approved:  { label: t('productRequests.statusApproved'),  bg: 'bg-blue-50',    darkBg: 'dark:bg-blue-900/30',    text: 'text-blue-700',    darkText: 'dark:text-blue-400' },
    rejected:  { label: t('productRequests.statusRejected'),  bg: 'bg-red-50',     darkBg: 'dark:bg-red-900/30',     text: 'text-red-700',     darkText: 'dark:text-red-400' },
    fulfilled: { label: t('productRequests.statusFulfilled'), bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/30', text: 'text-emerald-700', darkText: 'dark:text-emerald-400' },
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
            <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-none">{t('productRequests.livreurTitle')}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('productRequests.livreurSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchRequests(); fetchAllForKpis(); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('productRequests.refresh')}</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className={`grid grid-cols-2 sm:grid-cols-4 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2.5">
                <ClipboardDocumentListIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.total}</div>
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('productRequests.lrTotal')}</div>
            </div>
          </div>
          <div className="group relative p-5 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-2.5">
                <ClockIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.pendingCount}</div>
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('productRequests.statusPending')}</div>
            </div>
          </div>
          <div className="group relative p-5 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2.5">
                <CheckBadgeIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.fulfilledCount}</div>
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('productRequests.statusFulfilled')}</div>
            </div>
          </div>
          <div className="group relative p-5 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2.5">
                <XCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.rejectedCount}</div>
              <div className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 mt-2">{t('productRequests.statusRejected')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
            <input
              type="text"
              placeholder={t('productRequests.searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('productRequests.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1">
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('productRequests.clear')}</span>
            </button>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">{total} {t('productRequests.lrCount')}</span>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('productRequests.filterStatus')}</label>
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select w-full">
                  <option value="">{t('productRequests.allStatuses')}</option>
                  <option value="pending">{t('productRequests.statusPending')}</option>
                  <option value="approved">{t('productRequests.statusApproved')}</option>
                  <option value="rejected">{t('productRequests.statusRejected')}</option>
                  <option value="fulfilled">{t('productRequests.statusFulfilled')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('productRequests.lrFilterLivreur')}</label>
                <select value={livreurFilter} onChange={(e) => { setLivreurFilter(e.target.value); setPage(1); }} className="select w-full">
                  <option value="">{t('productRequests.lrAllLivreurs')}</option>
                  {livreurs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('productRequests.warehouse')}</label>
                <select value={warehouseFilter} onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }} className="select w-full">
                  <option value="">{t('productRequests.lrAllWarehouses')}</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('productRequests.fromDate')}</label>
                <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder={t('productRequests.fromDate')} className="w-full" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('productRequests.toDate')}</label>
                <DateInput value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder={t('productRequests.toDate')} className="w-full" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Chips */}
        <div className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto`}>
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
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === opt.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
              {opt.count > 0 && (
                <span className={`text-[10px] ${statusFilter === opt.value ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'}`}>({opt.count})</span>
              )}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><div className="spinner w-8 h-8"></div></div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <ClipboardDocumentListIcon className="w-12 h-12 mb-3" />
              <p className="text-lg font-semibold">{t('productRequests.noRequests')}</p>
              <p className="text-sm mt-1">{t('productRequests.noRequestsDesc')}</p>
            </div>
          ) : requests.map((req) => {
            const statusCfg = STATUS_CONFIG[req.status] || { label: req.status, bg: 'bg-gray-100', darkBg: 'dark:bg-gray-700', text: 'text-gray-600', darkText: 'dark:text-gray-300' };
            const isExpanded = expandedId === req.id;
            const detail = requestDetails[req.id];
            const items: RequestItem[] = detail?.items || [];
            const hasStockData = req.warehouse_id ? !!warehouseStock[req.warehouse_id] : false;

            return (
              <div key={req.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                {/* Card Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => handleExpand(req)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      req.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
                      req.status === 'approved' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      req.status === 'fulfilled' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {req.status === 'pending' && <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                      {req.status === 'approved' && <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                      {req.status === 'fulfilled' && <CheckBadgeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                      {req.status === 'rejected' && <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100">{req.reference}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusCfg.bg} ${statusCfg.darkBg} ${statusCfg.text} ${statusCfg.darkText}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-400 dark:text-gray-500">
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
                  <div className={`flex items-center gap-3 shrink-0 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                    <ChevronDownIcon className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20">
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="spinner w-6 h-6"></div>
                        <span className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>{t('productRequests.lrLoadingDetails')}</span>
                      </div>
                    ) : (
                      <>
                        {/* Info Grid */}
                        <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm border-b border-gray-100 dark:border-gray-700">
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('productRequests.requester')}</span>
                            <div className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{req.requester?.name || '-'}</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('productRequests.warehouse')}</span>
                            <div className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{req.warehouse?.name || '-'}</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('productRequests.date')}</span>
                            <div className="font-bold text-gray-800 dark:text-gray-100 mt-0.5">{formatDate(req.created_at)}</div>
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
                            <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-emerald-50/80 dark:bg-emerald-900/20">
                              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                <CheckCircleIcon className="w-4 h-4" />
                                {t('productRequests.allStockAvailable')}
                              </div>
                            </div>
                          );
                          return (
                            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-red-50/80 dark:bg-red-900/20">
                              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm mb-2">
                                <ExclamationTriangleIcon className="w-5 h-5" />
                                {t('productRequests.stockInsufficient')}
                              </div>
                              <div className="space-y-1">
                                {shorts.map(item => {
                                  const av = getAvailableStock(req.warehouse_id, item.product_id) ?? 0;
                                  const need = approveQtys[item.id] ?? item.quantity_requested;
                                  const ppp = item.product?.pieces_per_package || 1;
                                  return (
                                    <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-0.5">
                                      <span className="text-red-600 dark:text-red-400 font-medium">{item.product?.name}</span>
                                      <span className="text-red-600 dark:text-red-400 text-xs">
                                        {t('productRequests.available')} <strong>{fmtQty(av, ppp)}</strong> | {t('productRequests.needed')} <strong>{fmtQty(need, ppp)}</strong>
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
                          <div className="px-5 py-3">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className={`${isRTL ? 'text-right' : 'text-left'} text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2`}>{t('productRequests.product')}</th>
                                    <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.quantityRequested')}</th>
                                    {req.status === 'pending' && hasStockData && (
                                      <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.quantityAvailable')}</th>
                                    )}
                                    {req.status === 'pending' && (
                                      <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.quantityApproved')}</th>
                                    )}
                                    {(req.status === 'approved' || req.status === 'fulfilled') && (
                                      <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.quantityApproved')}</th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                  {items.map(item => {
                                    const available = getAvailableStock(req.warehouse_id, item.product_id);
                                    const needed = approveQtys[item.id] ?? item.quantity_requested;
                                    const isShort = req.status === 'pending' && available !== null && available < needed;
                                    const ppp = item.product?.pieces_per_package || 1;
                                    return (
                                      <tr key={item.id} className={isShort ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                        <td className="py-2.5">
                                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{item.product?.name || `#${item.product_id}`}</span>
                                          {item.product?.barcode && <span className={`text-[10px] text-gray-400 dark:text-gray-500 ${isRTL ? 'mr-1' : 'ml-1'}`}>({item.product.barcode})</span>}
                                        </td>
                                        <td className="text-center text-sm font-bold text-gray-700 dark:text-gray-300 py-2.5">
                                          {fmtQty(item.quantity_requested, ppp)}
                                        </td>
                                        {req.status === 'pending' && hasStockData && (
                                          <td className={`text-center text-sm font-bold py-2.5 ${isShort ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {available !== null ? fmtQty(available, ppp) : '-'}
                                          </td>
                                        )}
                                        {req.status === 'pending' && (() => {
                                          const { cartons, pieces } = splitQty(needed, ppp);
                                          return (
                                            <td className="py-2.5 text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                <div className="flex flex-col items-center">
                                                  <input type="number" min="0" value={cartons}
                                                    onChange={(e) => {
                                                      const c = parseInt(e.target.value) || 0;
                                                      setApproveQtys(prev => ({ ...prev, [item.id]: combineQty(c, pieces, ppp) }));
                                                    }}
                                                    className="input w-14 text-center text-sm"
                                                  />
                                                  <span className="text-[10px] text-blue-600 dark:text-blue-400">{ppp > 1 ? t('productRequests.carton') : t('productRequests.piece')}</span>
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
                                                    <span className="text-[10px] text-orange-600 dark:text-orange-400">{t('productRequests.piece')}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          );
                                        })()}
                                        {(req.status === 'approved' || req.status === 'fulfilled') && (
                                          <td className="text-center text-sm font-bold text-blue-600 dark:text-blue-400 py-2.5">
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
                          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                            <textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder={t('productRequests.adminNotesPlaceholder')}
                              rows={2}
                              className="input w-full resize-none text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(req)}
                                disabled={isActioning}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
                              >
                                {isActioning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                  <><CheckCircleIcon className="w-4 h-4" />{t('productRequests.approve')}</>
                                )}
                              </button>
                              <button
                                onClick={() => handleReject(req)}
                                disabled={isActioning}
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                              >
                                <XCircleIcon className="w-4 h-4" />
                                {t('productRequests.reject')}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Processor info */}
                        {req.processor && (
                          <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500">
                            {t('productRequests.lrProcessedBy')} <span className="font-semibold">{req.processor.name}</span>
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
          <div className={`flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700`}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl disabled:opacity-40 transition-colors"
            >
              <PrevChevron className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {lastPage}</span>
            <button
              onClick={() => setPage(p => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl disabled:opacity-40 transition-colors"
            >
              <NextChevron className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
