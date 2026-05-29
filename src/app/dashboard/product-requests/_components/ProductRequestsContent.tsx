'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { productRequestsApi, warehousesApi, usersApi } from '@/lib/api';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  ArrowPathIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CheckBadgeIcon,
  PencilSquareIcon,
  TrashIcon,
  ShoppingCartIcon,
  PrinterIcon,
  EyeIcon,
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

const STATUS_DOT: Record<string, 'orange' | 'blue' | 'red' | 'green' | 'neutral'> = {
  pending: 'orange',
  approved: 'blue',
  rejected: 'red',
  fulfilled: 'green',
};

export function ProductRequestsContent({ requestType, title, subtitle }: ProductRequestsPageProps) {
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';

  const STATUS_LABEL: Record<string, string> = {
    pending: t('productRequests.statusPending'),
    approved: t('productRequests.statusApproved'),
    rejected: t('productRequests.statusRejected'),
    fulfilled: t('productRequests.statusFulfilled'),
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

  const handlePrint = (req: ProductRequest) => {
    const statusLabels: Record<string, string> = {
      pending: t('productRequests.statusPending'),
      approved: t('productRequests.statusApproved'),
      rejected: t('productRequests.statusRejected'),
      fulfilled: t('productRequests.statusFulfilled'),
    };
    const rows = req.items.map(item =>
      `<tr>
        <td style="padding:8px;border:1px solid #ddd;text-align:right">${item.product?.name || '#' + item.product_id}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${fmtQty(item.quantity_requested, item.product?.pieces_per_package)}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:center">${item.quantity_approved ? fmtQty(item.quantity_approved, item.product?.pieces_per_package) : '-'}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8">
      <title>${req.reference}</title>
      <style>body{font-family:Tajawal,Arial,sans-serif;padding:30px;color:#333}
      table{width:100%;border-collapse:collapse;margin:20px 0}
      th{background:#f3f4f6;padding:8px;border:1px solid #ddd;text-align:center;font-size:12px}
      td{font-size:13px}
      .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;border-bottom:2px solid #333;padding-bottom:15px}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px}
      .info-item{font-size:13px}.info-label{font-weight:bold;color:#666;font-size:11px}</style></head><body>
      <div class="header"><div><h2 style="margin:0">${t('productRequests.title')}</h2><p style="margin:5px 0;color:#666">${req.reference}</p></div>
      <div style="text-align:left"><strong>${statusLabels[req.status] || req.status}</strong><br><span style="font-size:12px;color:#666">${formatDate(req.created_at)}</span></div></div>
      <div class="info-grid">
        <div class="info-item"><span class="info-label">${t('productRequests.requester')}</span><br>${req.requester?.name || '-'}</div>
        <div class="info-item"><span class="info-label">${t('productRequests.warehouse')}</span><br>${req.warehouse?.name || '-'}</div>
      </div>
      <table><thead><tr><th>${t('productRequests.product')}</th><th>${t('productRequests.quantityRequested')}</th><th>${t('productRequests.quantityApproved')}</th></tr></thead><tbody>${rows}</tbody></table>
      ${req.notes ? `<p><strong>${t('productRequests.driverNotes')}:</strong> ${req.notes}</p>` : ''}
      ${req.admin_notes ? `<p><strong>${t('productRequests.adminNotesPlaceholder')}:</strong> ${req.admin_notes}</p>` : ''}
      ${req.processor ? `<p style="font-size:12px;color:#666">${t('productRequests.processedBy')} ${req.processor.name} - ${req.processed_at ? formatDate(req.processed_at) : ''}</p>` : ''}
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

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

  const storageKey = requestType ? `${requestType}_pr_tour_step` : 'pr_tour_step';

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8"></div></div>;
  }

  return (
    <div>
      <div data-tour="pr-title">
        <PageHeader title={resolvedTitle} subtitle={resolvedSubtitle}>
          <button
            onClick={() => { localStorage.removeItem(storageKey); setShowTour(true); }}
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            title={t('productRequests.tourButton')}
          >
            <QuestionMarkCircleIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('productRequests.tourButton')}</span>
          </button>
          <button
            onClick={() => { setIsLoading(true); fetchRequests(); }}
            className="inline-flex items-center gap-1.5 px-3 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('productRequests.refresh')}</span>
          </button>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
              <span className="metric-dot metric-dot-orange" aria-hidden />
              {pendingCount} {t('productRequests.pendingBadge')}
            </span>
          )}
        </PageHeader>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4" data-tour="pr-kpis">
        <button onClick={() => setStatusFilter('')} className="metric-tile text-start">
          <div className="metric-label">{t('productRequests.all')}</div>
          <div className="metric-value tnum">{requests.length}</div>
        </button>
        <button onClick={() => setStatusFilter('pending')} className="metric-tile text-start">
          <div className="metric-label flex items-center gap-1.5"><span className="metric-dot metric-dot-orange" aria-hidden />{t('productRequests.statusPending')}</div>
          <div className="metric-value tnum">{pendingCount}</div>
        </button>
        <button onClick={() => setStatusFilter('approved')} className="metric-tile text-start">
          <div className="metric-label flex items-center gap-1.5"><span className="metric-dot metric-dot-blue" aria-hidden />{t('productRequests.statusApproved')}</div>
          <div className="metric-value tnum">{approvedCount}</div>
        </button>
        <button onClick={() => setStatusFilter('fulfilled')} className="metric-tile text-start">
          <div className="metric-label flex items-center gap-1.5"><span className="metric-dot metric-dot-green" aria-hidden />{t('productRequests.statusFulfilled')}</div>
          <div className="metric-value tnum">{fulfilledCount}</div>
        </button>
        <button onClick={() => setStatusFilter('rejected')} className="metric-tile text-start">
          <div className="metric-label flex items-center gap-1.5"><span className="metric-dot metric-dot-red" aria-hidden />{t('productRequests.statusRejected')}</div>
          <div className="metric-value tnum">{rejectedCount}</div>
        </button>
      </div>

      <div data-tour="pr-search">
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('productRequests.searchPlaceholder')}
          trailing={
            (searchTerm || activeFilterCount > 0) ? (
              <button onClick={clearAllFilters} className="text-[13px] text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">
                {t('productRequests.clear')}
              </button>
            ) : (
              <span className="text-[12px] text-gray-400 dark:text-gray-500 hidden sm:inline">
                {filteredRequests.length} / {requests.length}
              </span>
            )
          }
        >
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">{t('productRequests.allStatuses')}</option>
            <option value="pending">{t('productRequests.statusPending')}</option>
            <option value="approved">{t('productRequests.statusApproved')}</option>
            <option value="fulfilled">{t('productRequests.statusFulfilled')}</option>
            <option value="rejected">{t('productRequests.statusRejected')}</option>
          </select>
          <DateInput value={dateFrom} onChange={setDateFrom} placeholder={t('productRequests.fromDate')} />
          <DateInput value={dateTo} onChange={setDateTo} placeholder={t('productRequests.toDate')} />
        </FilterBar>
      </div>

      <div className="surface-pro">
        {/* Quick Filters */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 overflow-x-auto" data-tour="pr-quick-filters">
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
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === opt.value
                  ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
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
              const statusLabel = STATUS_LABEL[req.status] || req.status;
              const statusDot = STATUS_DOT[req.status] || 'neutral';
              const isExpanded = expandedId === req.id;
              const cashvan = isCashvanRequest(req);
              const isEditing = editingRequestId === req.id;
              const stockStatus = isExpanded && req.status === 'pending' ? getStockStatus(req) : null;
              const hasStock = req.warehouse_id ? !!warehouseStock[req.warehouse_id] : false;
              const isLoadingThisStock = loadingStock === req.warehouse_id;

              return (
                <div key={req.id} className="bg-white dark:bg-gray-800 rounded-md border border-gray-200/80 dark:border-gray-700 overflow-hidden">
                  {/* Request Header */}
                  <div
                    className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : req.id);
                      setAdminNotes('');
                      setEditedQuantities({});
                      if (isEditing) cancelEditing();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[13px] font-medium text-gray-900 dark:text-gray-100">{req.reference}</span>
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                            <span className={`metric-dot metric-dot-${statusDot}`} aria-hidden />
                            {statusLabel}
                          </span>
                          {cashvan && (
                            <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-gray-400">
                              <span className="metric-dot metric-dot-violet" aria-hidden />
                              {t('productRequests.mobileWarehouse')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[12px] text-gray-500 dark:text-gray-400">
                          <span>{req.requester?.name || '-'}</span>
                          <span>·</span>
                          <span>{cashvan ? (req.warehouse?.name || t('productRequests.mobileWarehouse')) : `${t('productRequests.session')} ${req.van_session?.reference || `#${req.van_session_id}`}`}</span>
                          <span>·</span>
                          <span className="tnum">{req.items.length} {t('productRequests.productCount')}</span>
                          <span>·</span>
                          <span className="tnum">{req.items.reduce((sum, i) => sum + Math.round(Number(i.quantity_requested) || 0), 0)} {t('productRequests.pieceCount')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-gray-500 dark:text-gray-400 hidden sm:inline">{formatDate(req.created_at)}</span>
                      {/* Quick action buttons */}
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setExpandedId(isExpanded ? null : req.id); setAdminNotes(''); setEditedQuantities({}); if (isEditing) cancelEditing(); }}
                          className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={t('productRequests.view') || 'عرض'}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(req)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={t('productRequests.print') || 'طباعة'}
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </button>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => { setExpandedId(req.id); }}
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={t('productRequests.approve')}
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleReject(req)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={t('productRequests.reject')}
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {req.status === 'approved' && !cashvan && (
                          <button
                            onClick={() => handleFulfill(req)}
                            disabled={isActioning}
                            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            title={t('productRequests.fulfillProducts')}
                          >
                            <CubeIcon className="w-4 h-4" />
                          </button>
                        )}
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleDelete(req)}
                            className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                            title={t('productRequests.delete')}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <ChevronDownIcon className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-900 dark:text-gray-100 mb-2">
                            <span className="metric-dot metric-dot-red" aria-hidden />
                            {t('productRequests.stockInsufficient')}
                          </div>
                          <div className="space-y-1 mb-3">
                            {stockStatus.shortItems.map(si => (
                              <div key={si.item.id} className="flex flex-col sm:flex-row sm:justify-between text-[13px] gap-0.5">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{si.item.product?.name || `${t('productRequests.productHash')} #${si.item.product_id}`}</span>
                                <span className="text-gray-500 dark:text-gray-400 text-[12px] tnum">
                                  {t('productRequests.available')}: <strong className="text-gray-700 dark:text-gray-300">{fmtQty(si.available, si.item.product?.pieces_per_package)}</strong> | {t('productRequests.needed')}: <strong className="text-gray-700 dark:text-gray-300">{fmtQty(si.needed, si.item.product?.pieces_per_package)}</strong> | {t('productRequests.missing')}: <strong className="text-gray-700 dark:text-gray-300">{fmtQty(si.needed - si.available, si.item.product?.pieces_per_package)}</strong>
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => handleCreatePurchase(req)}
                            className="inline-flex items-center justify-center gap-1.5 w-full px-4 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                          >
                            <ShoppingCartIcon className="w-4 h-4" />
                            {t('productRequests.createPurchaseForShortage')}
                          </button>
                        </div>
                      )}
                      {req.status === 'pending' && hasStock && stockStatus && stockStatus.allAvailable && (
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                          <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                            <span className="metric-dot metric-dot-green" aria-hidden />
                            {t('productRequests.allStockAvailable')}
                          </div>
                        </div>
                      )}

                      {/* Items Table */}
                      <div className="px-4 py-2">
                        <div className="table-pro-wrap">
                          <table className="table-pro compact">
                            <thead>
                              <tr>
                                <th>{t('productRequests.product')}</th>
                                <th className="tnum">{t('productRequests.quantityRequested')}</th>
                                {req.status === 'pending' && hasStock && <th className="tnum">{t('productRequests.quantityAvailable')}</th>}
                                {req.status === 'pending' && !isEditing && <th className="text-center">{t('productRequests.quantityApproved')}</th>}
                                {isEditing && <th className="text-center">{t('productRequests.editQuantity')}</th>}
                                {(req.status === 'approved' || req.status === 'fulfilled') && <th className="tnum">{t('productRequests.quantityApproved')}</th>}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                              {req.items.map(item => {
                                const available = getAvailableStock(req.warehouse_id, item.product_id);
                                const needed = editedQuantities[item.id] ?? item.quantity_requested;
                                const isShort = available !== null && available < needed;

                                return (
                                  <tr key={item.id} className={isShort ? 'bg-red-50/40 dark:bg-red-900/10' : ''}>
                                    <td>
                                      <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200">{item.product?.name || `${t('productRequests.productHash')} #${item.product_id}`}</span>
                                      {item.product?.barcode && <span className={`text-[11px] text-gray-400 dark:text-gray-500 ${isRTL ? 'mr-1' : 'ml-1'}`}>({item.product.barcode})</span>}
                                    </td>
                                    <td className="tnum">{fmtQty(item.quantity_requested, item.product?.pieces_per_package)}</td>
                                    {req.status === 'pending' && hasStock && (
                                      <td className="tnum">
                                        <span className={isShort ? 'inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300' : 'inline-flex items-center gap-1.5 text-gray-700 dark:text-gray-300'}>
                                          <span className={`metric-dot ${isShort ? 'metric-dot-red' : 'metric-dot-green'}`} aria-hidden />
                                          {available !== null ? fmtQty(available, item.product?.pieces_per_package) : '-'}
                                        </span>
                                        {isShort && (
                                          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{t('productRequests.missing')} {fmtQty(needed - (available ?? 0), item.product?.pieces_per_package)}</div>
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
                                      <td className="tnum t-strong">
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
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(req)}
                            disabled={isActioning}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 h-[34px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
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
                            className="flex-1 px-4 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                          >
                            {t('productRequests.cancel')}
                          </button>
                        </div>
                      )}

                      {/* Admin Actions for pending */}
                      {req.status === 'pending' && !isEditing && (
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700 space-y-2.5" data-tour="pr-actions">
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder={t('productRequests.adminNotesPlaceholder')}
                            className="input w-full text-[13px]"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={isActioning}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 h-[34px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
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
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              {t('productRequests.reject')}
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(req)}
                              disabled={isActioning}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-[30px] text-[12px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                              <PencilSquareIcon className="w-3.5 h-3.5" />
                              {t('productRequests.edit')}
                            </button>
                            <button
                              onClick={() => handleDelete(req)}
                              disabled={isActioning}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 h-[30px] text-[12px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              {t('productRequests.delete')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Fulfill button for approved (van session requests only) */}
                      {req.status === 'approved' && !cashvan && (
                        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                          <button
                            onClick={() => handleFulfill(req)}
                            disabled={isActioning}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 h-[34px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
                          >
                            {isActioning ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                              <>
                                <CubeIcon className="w-4 h-4" />
                                {t('productRequests.fulfillProducts')}
                              </>
                            )}
                          </button>
                          {req.admin_notes && (
                            <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-2">{t('productRequests.notes')}: {req.admin_notes}</p>
                          )}
                        </div>
                      )}

                      {/* Cashvan approved info */}
                      {req.status === 'fulfilled' && cashvan && (
                        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                          <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                            <span className="metric-dot metric-dot-green" aria-hidden />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200/80 dark:border-gray-700 shadow-xl w-full max-w-md">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="metric-dot metric-dot-orange" aria-hidden />
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">مستخدم بدون مستودع</h3>
              </div>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-4">
                المستخدم <strong className="text-gray-900 dark:text-gray-100">{noWarehouseModal.requesterName}</strong> لا يملك مستودعاً مخصصاً. اختر مستودعاً لتعيينه والموافقة على الطلب.
              </p>
              <select
                value={selectedWarehouseId}
                onChange={e => setSelectedWarehouseId(e.target.value)}
                className="input w-full mb-4"
              >
                <option value="">-- اختر مستودع --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleAssignWarehouseAndApprove}
                  disabled={!selectedWarehouseId || isAssigningWarehouse}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 h-[34px] text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white rounded-md transition-colors disabled:opacity-50"
                >
                  {isAssigningWarehouse
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><CheckCircleIcon className="w-4 h-4" /> تعيين والموافقة</>
                  }
                </button>
                <button
                  onClick={() => setNoWarehouseModal(null)}
                  className="flex-1 px-4 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
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
