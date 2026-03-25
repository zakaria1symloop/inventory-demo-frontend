'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { productRequestsApi, warehousesApi, usersApi } from '@/lib/api';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import {
  TruckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CheckBadgeIcon,
  PencilSquareIcon,
  TrashIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

interface ProductRequestItem {
  id: number;
  product_id: number;
  quantity_requested: number;
  quantity_approved: number;
  notes?: string;
  product?: { id: number; name: string; retail_price: number; cost_price?: number; barcode?: string; pieces_per_package?: number; unit_buy?: { name: string; short_name: string } };
}

interface ProductRequest {
  id: number;
  reference: string;
  van_session_id: number | null;
  warehouse_id: number | null;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  notes?: string;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
  requested_by?: number;
  requester?: { id: number; name: string; warehouse_id?: number; warehouse?: { id: number; name: string } };
  van_session?: { id: number; reference: string; status: string };
  warehouse?: { id: number; name: string };
  processor?: { id: number; name: string };
  items: ProductRequestItem[];
}

interface StockItem {
  product_id: number;
  quantity: number;
}

export interface ProductRequestsPageProps {
  requestType?: 'livreur' | 'cashvan';
  title?: string;
  subtitle?: string;
}

const getTheme = (type?: string) => {
  if (type === 'livreur') return { from: 'from-blue-500', to: 'to-indigo-600', shadow: 'shadow-blue-500/20', chip: 'bg-blue-600', chipHover: 'hover:bg-blue-700' };
  if (type === 'cashvan') return { from: 'from-violet-500', to: 'to-purple-600', shadow: 'shadow-violet-500/20', chip: 'bg-violet-600', chipHover: 'hover:bg-violet-700' };
  return { from: 'from-blue-500', to: 'to-indigo-600', shadow: 'shadow-indigo-500/20', chip: 'bg-indigo-600', chipHover: 'hover:bg-indigo-700' };
};

export function ProductRequestsContent({ requestType, title, subtitle }: ProductRequestsPageProps) {
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const theme = getTheme(requestType);

  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
    pending: { label: t('productRequests.statusPending'), bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: 'clock' },
    approved: { label: t('productRequests.statusApproved'), bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: 'check' },
    rejected: { label: t('productRequests.statusRejected'), bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: 'x' },
    fulfilled: { label: t('productRequests.statusFulfilled'), bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: 'badge' },
  };

  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [editedQuantities, setEditedQuantities] = useState<Record<number, number>>({});
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [editItems, setEditItems] = useState<Record<number, number>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Stock availability per warehouse
  const [warehouseStock, setWarehouseStock] = useState<Record<number, StockItem[]>>({});
  const [loadingStock, setLoadingStock] = useState<number | null>(null);

  // No-warehouse assignment modal
  const [noWarehouseModal, setNoWarehouseModal] = useState<{
    req: ProductRequest;
    requesterId: number | null;
    requesterName: string;
  } | null>(null);
  const [warehouses, setWarehouses] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [isAssigningWarehouse, setIsAssigningWarehouse] = useState(false);

  const resolvedTitle = title || t('productRequests.title');
  const resolvedSubtitle = subtitle || t('productRequests.subtitle');

  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="pr-title"]',
      title: resolvedTitle,
      desc: requestType === 'cashvan'
        ? t('productRequests.tourDescCashvan')
        : requestType === 'livreur'
        ? t('productRequests.tourDescLivreur')
        : t('productRequests.tourDescGeneral'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="pr-kpis"]',
      title: t('productRequests.tourTitleSummary'),
      desc: t('productRequests.tourDescSummary'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="pr-search"]',
      title: t('productRequests.tourTitleSearch'),
      desc: t('productRequests.tourDescSearch'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="pr-quick-filters"]',
      title: t('productRequests.tourTitleQuickFilters'),
      desc: t('productRequests.tourDescQuickFilters'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="pr-cards"]',
      title: t('productRequests.tourTitleCards'),
      desc: t('productRequests.tourDescCards'),
      position: 'top' as const,
    },
  ], [t, resolvedTitle, requestType]);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, requestType]);

  useEffect(() => {
    warehousesApi.getAll().then(r => setWarehouses(r.data || [])).catch(() => {});
  }, []);

  // Fetch warehouse stock when expanding a pending request
  useEffect(() => {
    if (expandedId) {
      const req = requests.find(r => r.id === expandedId);
      if (req && req.status === 'pending' && req.warehouse_id && !warehouseStock[req.warehouse_id]) {
        fetchWarehouseStock(req.warehouse_id);
      }
    }
  }, [expandedId]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { per_page: 50 };
      if (statusFilter) params.status = statusFilter;
      if (requestType) params.type = requestType;
      const response = await productRequestsApi.getAll(params);
      setRequests(response.data.data || response.data);
    } catch {
      toast.error(t('productRequests.errorLoadingRequests'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWarehouseStock = async (warehouseId: number) => {
    setLoadingStock(warehouseId);
    try {
      const response = await warehousesApi.getStock(warehouseId);
      const stockData: StockItem[] = (response.data || []).map((s: Record<string, unknown>) => ({
        product_id: s.product_id as number,
        quantity: Number(s.quantity) || 0,
      }));
      setWarehouseStock(prev => ({ ...prev, [warehouseId]: stockData }));
    } catch {
      // Silent fail - stock info is supplementary
    } finally {
      setLoadingStock(null);
    }
  };

  const getAvailableStock = (warehouseId: number | null, productId: number): number | null => {
    if (!warehouseId || !warehouseStock[warehouseId]) return null;
    const stockItem = warehouseStock[warehouseId].find(s => s.product_id === productId);
    return stockItem ? stockItem.quantity : 0;
  };

  const getStockStatus = (req: ProductRequest): { allAvailable: boolean; shortItems: Array<{ item: ProductRequestItem; available: number; needed: number }> } => {
    if (!req.warehouse_id || !warehouseStock[req.warehouse_id]) {
      return { allAvailable: true, shortItems: [] };
    }
    const shortItems: Array<{ item: ProductRequestItem; available: number; needed: number }> = [];
    for (const item of req.items) {
      const available = getAvailableStock(req.warehouse_id, item.product_id) ?? 0;
      const needed = editedQuantities[item.id] ?? item.quantity_requested;
      if (available < needed) {
        shortItems.push({ item, available, needed });
      }
    }
    return { allAvailable: shortItems.length === 0, shortItems };
  };

  const handleCreatePurchase = (req: ProductRequest) => {
    const { shortItems } = getStockStatus(req);
    const preFillData = {
      warehouse_id: req.warehouse_id,
      note: `${t('productRequests.purchaseNotePrefix')} ${req.reference}`,
      items: shortItems.map(si => ({
        product_id: si.item.product_id,
        product_name: si.item.product?.name || '',
        barcode: si.item.product?.barcode || '',
        quantity: Math.ceil(si.needed - si.available),
        pieces_per_package: si.item.product?.pieces_per_package || 1,
        unit_price: si.item.product?.cost_price || 0,
        unit_name: si.item.product?.unit_buy?.short_name || t('productRequests.unit'),
      })),
    };
    sessionStorage.setItem('purchasePreFill', JSON.stringify(preFillData));
    router.push('/dashboard/purchases/new');
  };

  const handleApprove = async (req: ProductRequest) => {
    setIsActioning(true);
    try {
      const itemsData = req.items.map(item => ({
        id: item.id,
        quantity_approved: editedQuantities[item.id] ?? item.quantity_requested,
      }));
      await productRequestsApi.approve(req.id, {
        items: itemsData,
        admin_notes: adminNotes || null,
      });
      const isCashvan = !req.van_session_id;
      toast.success(isCashvan ? t('productRequests.approvedWithTransfer') : t('productRequests.approvedSuccess'));
      setAdminNotes('');
      setEditedQuantities({});
      setExpandedId(null);
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error_type?: string; requester_id?: number; requester_name?: string } } };
      if (err.response?.data?.error_type === 'no_warehouse') {
        setNoWarehouseModal({
          req,
          requesterId: err.response.data.requester_id ?? null,
          requesterName: err.response.data.requester_name ?? '',
        });
        setSelectedWarehouseId('');
      } else {
        toast.error(err.response?.data?.message || t('productRequests.errorApproving'));
      }
    } finally {
      setIsActioning(false);
    }
  };

  const handleAssignWarehouseAndApprove = async () => {
    if (!noWarehouseModal || !noWarehouseModal.requesterId || !selectedWarehouseId) return;
    setIsAssigningWarehouse(true);
    try {
      await usersApi.update(noWarehouseModal.requesterId, { warehouse_id: Number(selectedWarehouseId) });
      toast.success('تم تعيين المستودع بنجاح');
      const req = noWarehouseModal.req;
      setNoWarehouseModal(null);
      await handleApprove(req);
    } catch {
      toast.error('فشل تعيين المستودع');
    } finally {
      setIsAssigningWarehouse(false);
    }
  };

  const handleReject = async (req: ProductRequest) => {
    setIsActioning(true);
    try {
      await productRequestsApi.reject(req.id, { admin_notes: adminNotes || null });
      toast.success(t('productRequests.rejectedSuccess'));
      setAdminNotes('');
      setExpandedId(null);
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('productRequests.errorRejecting'));
    } finally {
      setIsActioning(false);
    }
  };

  const handleFulfill = async (req: ProductRequest) => {
    setIsActioning(true);
    try {
      await productRequestsApi.fulfill(req.id);
      toast.success(t('productRequests.fulfilledSuccess'));
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: string) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || t('productRequests.errorFulfilling'));
      }
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async (req: ProductRequest) => {
    if (!confirm(`${t('productRequests.confirmDelete')} ${req.reference}?`)) return;
    setIsActioning(true);
    try {
      await productRequestsApi.delete(req.id);
      toast.success(t('productRequests.deletedSuccess'));
      setExpandedId(null);
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('productRequests.errorDeleting'));
    } finally {
      setIsActioning(false);
    }
  };

  const startEditing = (req: ProductRequest) => {
    setEditingRequestId(req.id);
    const quantities: Record<number, number> = {};
    req.items.forEach(item => {
      quantities[item.id] = item.quantity_requested;
    });
    setEditItems(quantities);
  };

  const cancelEditing = () => {
    setEditingRequestId(null);
    setEditItems({});
  };

  const handleSaveEdit = async (req: ProductRequest) => {
    setIsActioning(true);
    try {
      const items = req.items.map(item => ({
        product_id: item.product_id,
        quantity: editItems[item.id] ?? item.quantity_requested,
      }));
      await productRequestsApi.update(req.id, { items });
      toast.success(t('productRequests.editedSuccess'));
      setEditingRequestId(null);
      setEditItems({});
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('productRequests.errorEditing'));
    } finally {
      setIsActioning(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fmtQty = (val: unknown, piecesPerPkg?: number): string => {
    const totalPieces = Math.round(Number(val) || 0);
    if (totalPieces === 0) return '0';
    const ppp = piecesPerPkg && piecesPerPkg > 1 ? piecesPerPkg : 0;
    if (!ppp) return String(totalPieces);
    const cartons = Math.floor(totalPieces / ppp);
    const pieces = totalPieces % ppp;
    if (cartons > 0 && pieces > 0) return `${cartons} ${t('productRequests.carton')} ${pieces} ${t('productRequests.piece')}`;
    if (cartons > 0) return `${cartons} ${t('productRequests.carton')}`;
    if (pieces > 0) return `${pieces} ${t('productRequests.piece')}`;
    return '0';
  };

  const splitQty = (totalPieces: number, ppp: number) => {
    const cartons = ppp > 1 ? Math.floor(totalPieces / ppp) : totalPieces;
    const pieces = ppp > 1 ? totalPieces % ppp : 0;
    return { cartons, pieces };
  };

  const combineQty = (cartons: number, pieces: number, ppp: number) => {
    return (cartons * (ppp > 1 ? ppp : 1)) + pieces;
  };

  const isCashvanRequest = (req: ProductRequest) => !req.van_session_id;

  // Client-side search + date filtering
  const filteredRequests = requests.filter((r) => {
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchRef = r.reference.toLowerCase().includes(s);
      const matchName = r.requester?.name?.toLowerCase().includes(s);
      if (!matchRef && !matchName) return false;
    }
    if (dateFrom && r.created_at < dateFrom) return false;
    if (dateTo && r.created_at.slice(0, 10) > dateTo) return false;
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const fulfilledCount = requests.filter(r => r.status === 'fulfilled').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const activeFilterCount = [
    statusFilter,
    searchTerm,
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  const HeaderIcon = requestType === 'cashvan' ? DevicePhoneMobileIcon : requestType === 'livreur' ? TruckIcon : ClipboardDocumentListIcon;
  const storageKey = requestType ? `${requestType}_pr_tour_step` : 'pr_tour_step';

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="pr-title">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${theme.from} ${theme.to} flex items-center justify-center shadow-lg ${theme.shadow}`}>
            <HeaderIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-none">{resolvedTitle}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{resolvedSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { localStorage.removeItem(storageKey); setShowTour(true); }}
            className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
            title={t('productRequests.tourButton')}
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
            <span className="hidden sm:inline">{t('productRequests.tourButton')}</span>
          </button>
          <button
            onClick={() => { setIsLoading(true); fetchRequests(); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('productRequests.refresh')}</span>
          </button>
          {pendingCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm font-bold">
              <ClockIcon className="w-4 h-4" />
              {pendingCount} {t('productRequests.pendingBadge')}
            </div>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" data-tour="pr-kpis">
        <button onClick={() => setStatusFilter('')} className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 shadow-sm text-start transition-all ${statusFilter === '' ? 'border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-200 dark:ring-indigo-700' : 'border-gray-200/80 dark:border-gray-700'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <ClipboardDocumentListIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{t('productRequests.all')}</p>
              <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{requests.length}</p>
            </div>
          </div>
        </button>
        <button onClick={() => setStatusFilter('pending')} className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 shadow-sm text-start transition-all ${statusFilter === 'pending' ? 'border-amber-300 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-700' : 'border-gray-200/80 dark:border-gray-700'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{t('productRequests.statusPending')}</p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">{pendingCount}</p>
            </div>
          </div>
        </button>
        <button onClick={() => setStatusFilter('approved')} className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 shadow-sm text-start transition-all ${statusFilter === 'approved' ? 'border-blue-300 dark:border-blue-600 ring-1 ring-blue-200 dark:ring-blue-700' : 'border-gray-200/80 dark:border-gray-700'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{t('productRequests.statusApproved')}</p>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400 tabular-nums">{approvedCount}</p>
            </div>
          </div>
        </button>
        <button onClick={() => setStatusFilter('fulfilled')} className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 shadow-sm text-start transition-all ${statusFilter === 'fulfilled' ? 'border-emerald-300 dark:border-emerald-600 ring-1 ring-emerald-200 dark:ring-emerald-700' : 'border-gray-200/80 dark:border-gray-700'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckBadgeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{t('productRequests.statusFulfilled')}</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{fulfilledCount}</p>
            </div>
          </div>
        </button>
        <button onClick={() => setStatusFilter('rejected')} className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 shadow-sm text-start transition-all ${statusFilter === 'rejected' ? 'border-red-300 dark:border-red-600 ring-1 ring-red-200 dark:ring-red-700' : 'border-gray-200/80 dark:border-gray-700'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{t('productRequests.statusRejected')}</p>
              <p className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums">{rejectedCount}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Search + Filters + Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700" data-tour="pr-search">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
            <input
              type="text"
              placeholder={t('productRequests.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            data-tour="pr-filter-btn"
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('productRequests.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {(searchTerm || activeFilterCount > 0) && (
            <button onClick={clearAllFilters} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1">
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('productRequests.clear')}</span>
            </button>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
            {filteredRequests.length} / {requests.length}
          </span>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('productRequests.filterStatus')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select w-full"
                >
                  <option value="">{t('productRequests.allStatuses')}</option>
                  <option value="pending">{t('productRequests.statusPending')}</option>
                  <option value="approved">{t('productRequests.statusApproved')}</option>
                  <option value="fulfilled">{t('productRequests.statusFulfilled')}</option>
                  <option value="rejected">{t('productRequests.statusRejected')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('productRequests.fromDate')}</label>
                <DateInput
                  value={dateFrom}
                  onChange={setDateFrom}
                  placeholder={t('productRequests.fromDate')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('productRequests.toDate')}</label>
                <DateInput
                  value={dateTo}
                  onChange={setDateTo}
                  placeholder={t('productRequests.toDate')}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto" data-tour="pr-quick-filters">
          {([
            { value: '', label: t('productRequests.all') },
            { value: 'pending', label: t('productRequests.statusPending') },
            { value: 'approved', label: t('productRequests.statusApproved') },
            { value: 'fulfilled', label: t('productRequests.statusFulfilled') },
            { value: 'rejected', label: t('productRequests.statusRejected') },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === opt.value
                  ? `${theme.chip} text-white shadow-sm`
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Request Cards */}
        <div className="p-4 space-y-3" data-tour="pr-cards">
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <CubeIcon className="w-12 h-12 mb-3" />
              <p className="text-lg font-semibold">{t('productRequests.noRequests')}</p>
              <p className="text-sm mt-1">{t('productRequests.noRequestsDesc')}</p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const statusCfg = STATUS_CONFIG[req.status] || { label: req.status, bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: 'clock' };
              const isExpanded = expandedId === req.id;
              const cashvan = isCashvanRequest(req);
              const isEditing = editingRequestId === req.id;
              const stockStatus = isExpanded && req.status === 'pending' ? getStockStatus(req) : null;
              const hasStock = req.warehouse_id ? !!warehouseStock[req.warehouse_id] : false;
              const isLoadingThisStock = loadingStock === req.warehouse_id;

              return (
                <div key={req.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
                  {/* Request Header */}
                  <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : req.id);
                      setAdminNotes('');
                      setEditedQuantities({});
                      if (isEditing) cancelEditing();
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        req.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/40' :
                        req.status === 'approved' ? 'bg-blue-100 dark:bg-blue-900/40' :
                        req.status === 'fulfilled' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
                        'bg-red-100 dark:bg-red-900/40'
                      }`}>
                        {req.status === 'pending' && <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                        {req.status === 'approved' && <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        {req.status === 'fulfilled' && <CheckBadgeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                        {req.status === 'rejected' && <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{req.reference}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.label}
                          </span>
                          {cashvan && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">{t('productRequests.mobileWarehouse')}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-400 dark:text-gray-500">
                          <span>{req.requester?.name || '-'}</span>
                          <span>·</span>
                          <span>{cashvan ? (req.warehouse?.name || t('productRequests.mobileWarehouse')) : `${t('productRequests.session')} ${req.van_session?.reference || `#${req.van_session_id}`}`}</span>
                          <span>·</span>
                          <span>{req.items.length} {t('productRequests.productCount')}</span>
                          <span>·</span>
                          <span>{req.items.reduce((sum, i) => sum + Math.round(Number(i.quantity_requested) || 0), 0)} {t('productRequests.pieceCount')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">{formatDate(req.created_at)}</span>
                      <ChevronDownIcon className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20">
                      {/* Info Grid */}
                      <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-b border-gray-100 dark:border-gray-700">
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('productRequests.requester')}</span>
                          <div className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{req.requester?.name || '-'}</div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{cashvan ? t('productRequests.type') : t('productRequests.sessionLabel')}</span>
                          <div className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{cashvan ? t('productRequests.mobileWarehouse') : (req.van_session?.reference || '-')}</div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{cashvan ? t('productRequests.sourceWarehouse') : t('productRequests.warehouse')}</span>
                          <div className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{req.warehouse?.name || '-'}</div>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('productRequests.date')}</span>
                          <div className="font-bold text-gray-800 dark:text-gray-200 mt-0.5">{formatDate(req.created_at)}</div>
                        </div>
                      </div>

                      {/* Stock availability warnings */}
                      {req.status === 'pending' && isLoadingThisStock && (
                        <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                          <span className="spinner w-4 h-4" /> {t('productRequests.checkingStock')}
                        </div>
                      )}
                      {req.status === 'pending' && hasStock && stockStatus && !stockStatus.allAvailable && (
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-red-50/80 dark:bg-red-900/20">
                          <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-sm mb-2">
                            <ExclamationTriangleIcon className="w-5 h-5" />
                            {t('productRequests.stockInsufficient')}
                          </div>
                          <div className="space-y-1 mb-3">
                            {stockStatus.shortItems.map(si => (
                              <div key={si.item.id} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-0.5">
                                <span className="text-red-600 dark:text-red-400 font-medium">{si.item.product?.name || `${t('productRequests.productHash')} #${si.item.product_id}`}</span>
                                <span className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
                                  {t('productRequests.available')}: <strong>{fmtQty(si.available, si.item.product?.pieces_per_package)}</strong> | {t('productRequests.needed')}: <strong>{fmtQty(si.needed, si.item.product?.pieces_per_package)}</strong> | {t('productRequests.missing')}: <strong>{fmtQty(si.needed - si.available, si.item.product?.pieces_per_package)}</strong>
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleCreatePurchase(req)}
                            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl transition-all"
                          >
                            <ShoppingCartIcon className="w-4 h-4" />
                            {t('productRequests.createPurchaseForShortage')}
                          </button>
                        </div>
                      )}
                      {req.status === 'pending' && hasStock && stockStatus && stockStatus.allAvailable && (
                        <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-emerald-50/80 dark:bg-emerald-900/20">
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
                            <CheckCircleIcon className="w-4 h-4" />
                            {t('productRequests.allStockAvailable')}
                          </div>
                        </div>
                      )}

                      {/* Items Table */}
                      <div className="px-5 py-3">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-100 dark:border-gray-700">
                                <th className="text-start text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.product')}</th>
                                <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.quantityRequested')}</th>
                                {req.status === 'pending' && hasStock && <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.quantityAvailable')}</th>}
                                {req.status === 'pending' && !isEditing && <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.quantityApproved')}</th>}
                                {isEditing && <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.editQuantity')}</th>}
                                {(req.status === 'approved' || req.status === 'fulfilled') && <th className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider py-2">{t('productRequests.quantityApproved')}</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                              {req.items.map(item => {
                                const available = getAvailableStock(req.warehouse_id, item.product_id);
                                const needed = editedQuantities[item.id] ?? item.quantity_requested;
                                const isShort = available !== null && available < needed;

                                return (
                                  <tr key={item.id} className={isShort ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                    <td className="py-2.5">
                                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.product?.name || `${t('productRequests.productHash')} #${item.product_id}`}</span>
                                      {item.product?.barcode && <span className={`text-[10px] text-gray-400 dark:text-gray-500 ${isRTL ? 'mr-1' : 'ml-1'}`}>({item.product.barcode})</span>}
                                    </td>
                                    <td className="text-center text-sm font-bold text-gray-700 dark:text-gray-300 py-2.5">{fmtQty(item.quantity_requested, item.product?.pieces_per_package)}</td>
                                    {req.status === 'pending' && hasStock && (
                                      <td className={`text-center text-sm font-bold py-2.5 ${isShort ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {available !== null ? fmtQty(available, item.product?.pieces_per_package) : '-'}
                                        {isShort && (
                                          <div className="text-[10px] text-red-500 dark:text-red-400">{t('productRequests.missing')} {fmtQty(needed - (available ?? 0), item.product?.pieces_per_package)}</div>
                                        )}
                                      </td>
                                    )}
                                    {req.status === 'pending' && !isEditing && (() => {
                                      const ppp = item.product?.pieces_per_package || 1;
                                      const val = editedQuantities[item.id] ?? item.quantity_requested;
                                      const { cartons, pieces } = splitQty(val, ppp);
                                      return (
                                        <td className="py-2.5 text-center">
                                          <div className="flex items-center justify-center gap-1">
                                            <div className="flex flex-col items-center">
                                              <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                defaultValue={cartons}
                                                onChange={(e) => {
                                                  const c = parseInt(e.target.value) || 0;
                                                  const curVal = editedQuantities[item.id] ?? item.quantity_requested;
                                                  const curPcs = splitQty(curVal, ppp).pieces;
                                                  setEditedQuantities(prev => ({ ...prev, [item.id]: combineQty(c, curPcs, ppp) }));
                                                }}
                                                className="input w-14 text-center text-sm"
                                              />
                                              <span className="text-[10px] text-blue-600 dark:text-blue-400">{ppp > 1 ? t('productRequests.carton') : t('productRequests.unit')}</span>
                                            </div>
                                            {ppp > 1 && (
                                              <div className="flex flex-col items-center">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  max={ppp - 1}
                                                  step="1"
                                                  defaultValue={pieces}
                                                  onChange={(e) => {
                                                    const p = parseInt(e.target.value) || 0;
                                                    const curVal = editedQuantities[item.id] ?? item.quantity_requested;
                                                    const curCartons = splitQty(curVal, ppp).cartons;
                                                    setEditedQuantities(prev => ({ ...prev, [item.id]: combineQty(curCartons, p, ppp) }));
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
                                    {isEditing && (() => {
                                      const ppp = item.product?.pieces_per_package || 1;
                                      const val = editItems[item.id] ?? item.quantity_requested;
                                      const { cartons, pieces } = splitQty(val, ppp);
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
                                                  setEditItems(prev => ({ ...prev, [item.id]: combineQty(c, pieces, ppp) }));
                                                }}
                                                className="input w-14 text-center text-sm border-blue-400"
                                              />
                                              <span className="text-[10px] text-blue-600 dark:text-blue-400">{ppp > 1 ? t('productRequests.carton') : t('productRequests.unit')}</span>
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
                                                    setEditItems(prev => ({ ...prev, [item.id]: combineQty(cartons, p, ppp) }));
                                                  }}
                                                  className="input w-14 text-center text-sm border-orange-400"
                                                />
                                                <span className="text-[10px] text-orange-600 dark:text-orange-400">{t('productRequests.piece')}</span>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })()}
                                    {(req.status === 'approved' || req.status === 'fulfilled') && (
                                      <td className="py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                        {fmtQty(item.quantity_approved, item.product?.pieces_per_package)}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Notes */}
                      {req.notes && (
                        <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700">
                          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('productRequests.driverNotes')}</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{req.notes}</p>
                        </div>
                      )}

                      {/* Edit mode save/cancel */}
                      {isEditing && (
                        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(req)}
                            disabled={isActioning}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all disabled:opacity-50"
                          >
                            {isActioning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                              <>
                                <CheckCircleIcon className="w-4 h-4" />
                                {t('productRequests.saveChanges')}
                              </>
                            )}
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                          >
                            {t('productRequests.cancel')}
                          </button>
                        </div>
                      )}

                      {/* Admin Actions for pending */}
                      {req.status === 'pending' && !isEditing && (
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 space-y-3" data-tour="pr-actions">
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder={t('productRequests.adminNotesPlaceholder')}
                            className="input w-full text-sm"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={isActioning}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all disabled:opacity-50"
                            >
                              {isActioning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                <>
                                  <CheckCircleIcon className="w-4 h-4" />
                                  {cashvan ? t('productRequests.approveWithTransfer') : t('productRequests.approve')}
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(req)}
                              disabled={isActioning}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all disabled:opacity-50"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              {t('productRequests.reject')}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(req)}
                              disabled={isActioning}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5" />
                              {t('productRequests.edit')}
                            </button>
                            <button
                              onClick={() => handleDelete(req)}
                              disabled={isActioning}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              {t('productRequests.delete')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Fulfill button for approved (van session requests only) */}
                      {req.status === 'approved' && !cashvan && (
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => handleFulfill(req)}
                            disabled={isActioning}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all disabled:opacity-50"
                          >
                            {isActioning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                              <>
                                <CubeIcon className="w-4 h-4" />
                                {t('productRequests.fulfillProducts')}
                              </>
                            )}
                          </button>
                          {req.admin_notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('productRequests.notes')}: {req.admin_notes}</p>
                          )}
                        </div>
                      )}

                      {/* Cashvan approved info */}
                      {req.status === 'fulfilled' && cashvan && (
                        <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-emerald-50/50 dark:bg-emerald-900/20">
                          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                            <CheckBadgeIcon className="w-4 h-4" />
                            {t('productRequests.transferCreatedAuto')}
                          </div>
                        </div>
                      )}

                      {/* Processor info */}
                      {req.processor && (
                        <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                          {t('productRequests.processedBy')} <span className="font-semibold">{req.processor.name}</span> - {req.processed_at ? formatDate(req.processed_at) : ''}
                          {req.admin_notes && <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>| {req.admin_notes}</span>}
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

      {/* No-Warehouse Assignment Modal */}
      {noWarehouseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">مستخدم بدون مستودع</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                المستخدم <strong className="text-gray-900 dark:text-gray-100">{noWarehouseModal.requesterName}</strong> لا يملك مستودعاً مخصصاً. اختر مستودعاً لتعيينه والموافقة على الطلب.
              </p>
              <select
                value={selectedWarehouseId}
                onChange={e => setSelectedWarehouseId(e.target.value)}
                className="input w-full mb-5"
              >
                <option value="">-- اختر مستودع --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={handleAssignWarehouseAndApprove}
                  disabled={!selectedWarehouseId || isAssigningWarehouse}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl transition-all disabled:opacity-50"
                >
                  {isAssigningWarehouse
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircleIcon className="w-4 h-4" /> تعيين والموافقة</>
                  }
                </button>
                <button
                  onClick={() => setNoWarehouseModal(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
