'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { stockTransfersApi, warehousesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  ArrowsRightLeftIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
  BoltIcon,
  EyeIcon,
  PrinterIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArchiveBoxArrowDownIcon,
} from '@heroicons/react/24/outline';

interface AssignedUser {
  id: number;
  name: string;
}

interface WarehouseWithUser {
  id: number;
  name: string;
  assigned_user?: AssignedUser | null;
}

interface StockTransferItem {
  id: number;
  product_id: number;
  quantity: number;
  product?: { id: number; name: string; barcode?: string; pieces_per_package?: number; cost_price?: number; retail_price?: number };
}

interface StockTransfer {
  id: number;
  reference: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  created_by: number;
  collected_by: number | null;
  approved_by: number | null;
  status: 'pending' | 'loading' | 'collected';
  collected_at: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  from_warehouse?: WarehouseWithUser;
  to_warehouse?: WarehouseWithUser;
  creator?: { id: number; name: string };
  collector?: { id: number; name: string };
  approver?: { id: number; name: string };
  items?: StockTransferItem[];
}

export default function StockTransfersPage() {
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromWarehouseFilter, setFromWarehouseFilter] = useState('');
  const [toWarehouseFilter, setToWarehouseFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'active' | 'archive'>('active');
  const [showTour, setShowTour] = useState(false);
  const [isActioning, setIsActioning] = useState<number | null>(null);

  const STATUS_INFO: Record<string, { label: string; dot: string }> = useMemo(() => ({
    pending: { label: t('stockTransfersList.statusPending'), dot: 'metric-dot-orange' },
    loading: { label: t('stockTransfersList.statusLoading'), dot: 'metric-dot-blue' },
    collected: { label: t('stockTransfersList.statusCollected'), dot: 'metric-dot-green' },
  }), [t]);

  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="st-title"]',
      title: t('stockTransfersList.tourTitleStep'),
      desc: t('stockTransfersList.tourTitleDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="st-kpis"]',
      title: t('stockTransfersList.tourKpisStep'),
      desc: t('stockTransfersList.tourKpisDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="st-search"]',
      title: t('stockTransfersList.tourSearchStep'),
      desc: t('stockTransfersList.tourSearchDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="st-quick-filters"]',
      title: t('stockTransfersList.tourQuickFiltersStep'),
      desc: t('stockTransfersList.tourQuickFiltersDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="st-cards"]',
      title: t('stockTransfersList.tourCardsStep'),
      desc: t('stockTransfersList.tourCardsDesc'),
      position: 'top',
    },
  ], [t]);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [currentPage, statusFilter, fromWarehouseFilter, toWarehouseFilter, dateFrom, dateTo, viewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        router.push('/dashboard/stock-transfers/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesApi.getAll();
      setWarehouses(response.data.data || response.data);
    } catch {}
  };

  const fetchTransfers = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page: currentPage, per_page: 20 };
      if (statusFilter) params.status = statusFilter;
      else if (viewMode === 'active') params.active = 1;
      else if (viewMode === 'archive') params.archived = 1;
      if (fromWarehouseFilter) params.from_warehouse_id = fromWarehouseFilter;
      if (toWarehouseFilter) params.to_warehouse_id = toWarehouseFilter;
      if (dateFrom) params.from_date = dateFrom;
      if (dateTo) params.to_date = dateTo;
      const response = await stockTransfersApi.getAll(params);
      const data = response.data;
      if (data.data) {
        setTransfers(data.data);
        setTotalPages(data.last_page || 1);
        setTotalItems(data.total || 0);
      } else {
        setTransfers(Array.isArray(data) ? data : []);
        setTotalItems(Array.isArray(data) ? data.length : 0);
      }
    } catch {
      toast.error(t('stockTransfersList.errorLoading'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm(t('stockTransfersList.confirmApprove'))) return;
    setIsActioning(id);
    try {
      await stockTransfersApi.approve(id);
      toast.success(t('stockTransfersList.approvedSuccess'));
      fetchTransfers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || t('stockTransfersList.errorApproving');
      toast.error(msg);
    } finally {
      setIsActioning(null);
    }
  };

  const handleCollect = async (id: number) => {
    if (!confirm(t('stockTransfersList.confirmCollect'))) return;
    setIsActioning(id);
    try {
      await stockTransfersApi.collect(id);
      toast.success(t('stockTransfersList.collectedSuccess'));
      fetchTransfers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || t('stockTransfersList.errorCollecting');
      toast.error(msg);
    } finally {
      setIsActioning(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('stockTransfersList.confirmDelete'))) return;
    setIsActioning(id);
    try {
      await stockTransfersApi.delete(id);
      toast.success(t('stockTransfersList.deletedSuccess'));
      fetchTransfers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('stockTransfersList.errorDeleting'));
    } finally {
      setIsActioning(null);
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setFromWarehouseFilter('');
    setToWarehouseFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemsCount = (transfer: StockTransfer) => transfer.items?.length || 0;
  const getTotalPieces = (transfer: StockTransfer) =>
    transfer.items?.reduce((sum, item) => sum + Math.round(Number(item.quantity)), 0) || 0;

  const handlePrint = (transfer: StockTransfer) => {
    const items = transfer.items || [];
    let totalCartons = 0;
    let totalExtraPieces = 0;
    let totalPieces = 0;

    const itemRows = items.map((item, index) => {
      const ppp = item.product?.pieces_per_package || 1;
      const tp = Math.round(Number(item.quantity));
      const cartons = ppp > 1 ? Math.floor(tp / ppp) : tp;
      const extra = ppp > 1 ? tp % ppp : 0;
      totalCartons += cartons;
      totalExtraPieces += extra;
      totalPieces += tp;
      return `<tr>
        <td class="text-center">${index + 1}</td>
        <td>${item.product?.name || '-'}${ppp > 1 ? ` <span style="font-size:11px;color:#888">(${ppp} ق/كرتون)</span>` : ''}</td>
        <td class="text-center text-blue">${cartons}</td>
        <td class="text-center text-orange">${extra || '-'}</td>
        <td class="text-center" style="font-weight:bold">${tp}</td>
      </tr>`;
    }).join('');

    const statusText = transfer.status === 'pending' ? 'طلب جديد' : transfer.status === 'loading' ? 'جاري التحميل' : 'تم التسليم';

    const printContent = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>تحويل مخزون - ${transfer.reference}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;padding:20px;font-size:14px}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #333;padding-bottom:20px}.header h1{font-size:24px;margin-bottom:5px}.header .ref{font-size:18px;color:#666}.header .status{display:inline-block;padding:4px 16px;border-radius:20px;font-size:14px;font-weight:bold;margin-top:8px}.status-pending{background:#fef3c7;color:#92400e}.status-loading{background:#dbeafe;color:#1e40af}.status-collected{background:#dcfce7;color:#166534}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px}.info-box{background:#f9f9f9;padding:15px;border-radius:8px}.info-box h3{font-size:14px;color:#666;margin-bottom:8px}.info-box p{font-size:16px;font-weight:bold}.info-box .sub{font-size:12px;color:#888;font-weight:normal}table{width:100%;border-collapse:collapse;margin-bottom:20px}th,td{padding:10px 8px;text-align:right;border-bottom:1px solid #ddd}th{background:#f5f5f5;font-weight:bold;font-size:13px}.text-center{text-align:center}.text-blue{color:#1d4ed8}.text-orange{color:#c2410c}tfoot td{background:#f5f5f5;font-weight:bold}.summary{display:flex;gap:20px;margin-top:10px}.summary-item{flex:1;background:#f0f9ff;border:1px solid #bae6fd;padding:12px;border-radius:8px;text-align:center}.summary-item .label{font-size:12px;color:#0369a1;margin-bottom:4px}.summary-item .value{font-size:20px;font-weight:bold;color:#0c4a6e}.footer{margin-top:40px;text-align:center;color:#666;font-size:12px}.notes{margin-top:20px;padding:15px;background:#f9f9f9;border-radius:8px}.signature{display:flex;justify-content:space-between;margin-top:50px;padding-top:20px}.signature-box{text-align:center;width:200px}.signature-box .line{border-top:1px solid #333;margin-top:50px;padding-top:5px}@media print{body{padding:0}}</style></head><body><div class="header"><h1>وصل تحويل مخزون</h1><div class="ref">${transfer.reference}</div><div class="status status-${transfer.status}">${statusText}</div></div><div class="info-grid"><div class="info-box"><h3>المستودع المصدر</h3><p>${transfer.from_warehouse?.name || '-'}</p>${transfer.from_warehouse?.assigned_user ? `<p class="sub">المسؤول: ${transfer.from_warehouse.assigned_user.name}</p>` : ''}</div><div class="info-box"><h3>المستودع الوجهة</h3><p>${transfer.to_warehouse?.name || '-'}</p>${transfer.to_warehouse?.assigned_user ? `<p class="sub">السائق: ${transfer.to_warehouse.assigned_user.name}</p>` : ''}</div><div class="info-box"><h3>تاريخ الإنشاء</h3><p>${formatDate(transfer.created_at)}</p><p class="sub">بواسطة: ${transfer.creator?.name || '-'}</p></div><div class="info-box"><h3>${transfer.collected_at ? 'تاريخ التسليم' : 'تاريخ الموافقة'}</h3><p>${transfer.collected_at ? formatDate(transfer.collected_at) : transfer.approved_at ? formatDate(transfer.approved_at) : '-'}</p>${transfer.approver ? `<p class="sub">وافق: ${transfer.approver.name}</p>` : ''}</div></div><table><thead><tr><th class="text-center">#</th><th>المنتج</th><th class="text-center">كرتون</th><th class="text-center">قطع إضافية</th><th class="text-center">إجمالي القطع</th></tr></thead><tbody>${itemRows}</tbody><tfoot><tr><td colspan="2" class="text-center">الإجمالي (${items.length} منتج)</td><td class="text-center text-blue">${totalCartons}</td><td class="text-center text-orange">${totalExtraPieces || '-'}</td><td class="text-center" style="font-weight:bold">${totalPieces}</td></tr></tfoot></table><div class="summary"><div class="summary-item"><div class="label">عدد المنتجات</div><div class="value">${items.length}</div></div><div class="summary-item"><div class="label">إجمالي الكراتين</div><div class="value">${totalCartons}</div></div><div class="summary-item"><div class="label">إجمالي القطع</div><div class="value">${totalPieces}</div></div></div>${transfer.notes ? `<div class="notes"><strong>ملاحظات:</strong><p>${transfer.notes}</p></div>` : ''}<div class="signature"><div class="signature-box"><div class="line">توقيع المسؤول (المستودع)</div></div><div class="signature-box"><div class="line">توقيع السائق</div></div></div><div class="footer"><p>تم الطباعة بتاريخ ${new Date().toLocaleDateString('ar-DZ')}</p></div></body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 100);
      }, 250);
    }
  };

  const filteredTransfers = transfers.filter(tr => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      tr.reference.toLowerCase().includes(term) ||
      tr.from_warehouse?.name?.toLowerCase().includes(term) ||
      tr.to_warehouse?.name?.toLowerCase().includes(term) ||
      tr.creator?.name?.toLowerCase().includes(term)
    );
  });

  const pendingCount = transfers.filter(tr => tr.status === 'pending').length;
  const loadingCount = transfers.filter(tr => tr.status === 'loading').length;
  const activeFilterCount = [statusFilter, fromWarehouseFilter, toWarehouseFilter, dateFrom, dateTo, searchTerm].filter(Boolean).length;

  const storageKey = 'stock_transfers_tour_step';

  if (isLoading && transfers.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8"></div></div>;
  }

  return (
    <div>
      <div data-tour="st-title">
        <PageHeader title={t('stockTransfersList.title')} subtitle={t('stockTransfersList.subtitle')}>
          <button
            onClick={() => { localStorage.removeItem(storageKey); setShowTour(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('stockTransfersList.tourBtn')}
          </button>
          <button
            onClick={() => { setIsLoading(true); fetchTransfers(); }}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" strokeWidth={1.8} />
            <span className="hidden sm:inline">{t('stockTransfersList.refresh')}</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/stock-transfers/new')}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" strokeWidth={2} />
            {t('stockTransfersList.newTransfer')}
          </button>
        </PageHeader>
      </div>

      {/* Metric tiles (also used as view-mode toggles) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4" data-tour="st-kpis">
        <button
          type="button"
          onClick={() => { setViewMode('active'); setStatusFilter(''); setCurrentPage(1); }}
          className={`metric-tile text-left ${viewMode === 'active' && !statusFilter ? 'ring-1 ring-gray-400 dark:ring-gray-500' : ''}`}
        >
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-blue" aria-hidden />
            <p className="metric-label truncate">{t('stockTransfersList.activeTransfers')}</p>
          </div>
          <p className="metric-value tnum">{viewMode === 'active' && !statusFilter ? totalItems : pendingCount + loadingCount}</p>
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter('pending'); setViewMode('active'); setCurrentPage(1); }}
          className={`metric-tile text-left ${statusFilter === 'pending' ? 'ring-1 ring-gray-400 dark:ring-gray-500' : ''}`}
        >
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-orange" aria-hidden />
            <p className="metric-label truncate">{t('stockTransfersList.statusPending')}</p>
          </div>
          <p className="metric-value tnum">{pendingCount}</p>
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter('loading'); setViewMode('active'); setCurrentPage(1); }}
          className={`metric-tile text-left ${statusFilter === 'loading' ? 'ring-1 ring-gray-400 dark:ring-gray-500' : ''}`}
        >
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-blue" aria-hidden />
            <p className="metric-label truncate">{t('stockTransfersList.statusLoading')}</p>
          </div>
          <p className="metric-value tnum">{loadingCount}</p>
        </button>
        <button
          type="button"
          onClick={() => { setViewMode('archive'); setStatusFilter(''); setCurrentPage(1); }}
          className={`metric-tile text-left ${viewMode === 'archive' ? 'ring-1 ring-gray-400 dark:ring-gray-500' : ''}`}
        >
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            <p className="metric-label truncate">{t('stockTransfersList.archive')}</p>
          </div>
          <p className="metric-value tnum">{viewMode === 'archive' ? totalItems : '—'}</p>
        </button>
      </div>

      {/* Filters */}
      <div data-tour="st-search">
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('stockTransfersList.searchPlaceholder')}
          trailing={activeFilterCount > 0 ? (
            <button onClick={clearFilters} className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <XMarkIcon className="w-3.5 h-3.5" />
              {t('stockTransfersList.clear')}
            </button>
          ) : undefined}
        >
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">{t('stockTransfersList.allStatuses')}</option>
            <option value="pending">{t('stockTransfersList.statusPending')}</option>
            <option value="loading">{t('stockTransfersList.statusLoading')}</option>
            <option value="collected">{t('stockTransfersList.statusCollected')}</option>
          </select>
          <select value={fromWarehouseFilter} onChange={(e) => { setFromWarehouseFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">{t('stockTransfersList.fromWarehouse')}</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <select value={toWarehouseFilter} onChange={(e) => { setToWarehouseFilter(e.target.value); setCurrentPage(1); }}>
            <option value="">{t('stockTransfersList.toWarehouse')}</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setCurrentPage(1); }} placeholder={t('stockTransfersList.fromDate')} />
          <DateInput value={dateTo} onChange={(v) => { setDateTo(v); setCurrentPage(1); }} placeholder={t('stockTransfersList.toDate')} />
        </FilterBar>
      </div>

      {/* Quick filters */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto" data-tour="st-quick-filters">
        {viewMode === 'active' ? (
          [
            { value: '', label: t('stockTransfersList.allActive') },
            { value: 'pending', label: t('stockTransfersList.statusPending') },
            { value: 'loading', label: t('stockTransfersList.statusLoading') },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); }}
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === opt.value
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            {t('stockTransfersList.archiveDelivered')}
          </span>
        )}
        <span className="text-[12px] t-muted ms-auto whitespace-nowrap">
          {filteredTransfers.length} / {totalItems || transfers.length}
        </span>
      </div>

      {/* Transfer cards */}
      <div className="space-y-2.5" data-tour="st-cards">
        {filteredTransfers.length === 0 ? (
          <div className="surface-pro flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <ArchiveBoxArrowDownIcon className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
            <p className="text-[14px] font-medium">
              {viewMode === 'archive' ? t('stockTransfersList.noArchivedTransfers') : t('stockTransfersList.noActiveTransfers')}
            </p>
            <p className="text-[12px] mt-1 t-muted">
              {viewMode === 'archive' ? t('stockTransfersList.noDeliveredYet') : t('stockTransfersList.noProcessingNow')}
            </p>
            {viewMode === 'active' && (
              <button
                onClick={() => router.push('/dashboard/stock-transfers/new')}
                className="mt-4 inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" strokeWidth={2} />
                {t('stockTransfersList.createNewTransfer')}
              </button>
            )}
          </div>
        ) : (
          filteredTransfers.map(transfer => {
            const statusCfg = STATUS_INFO[transfer.status] || { label: transfer.status, dot: 'metric-dot-neutral' };
            const itemsCount = getItemsCount(transfer);
            const totalPcs = getTotalPieces(transfer);
            const driverName = transfer.to_warehouse?.assigned_user?.name || transfer.from_warehouse?.assigned_user?.name || '';
            const acting = isActioning === transfer.id;

            return (
              <div
                key={transfer.id}
                className="surface-pro overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => router.push(`/dashboard/stock-transfers/${transfer.id}`)}
              >
                <div className="flex items-center justify-between px-3 py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <ArrowsRightLeftIcon className="w-4.5 h-4.5 text-gray-600 dark:text-gray-300" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[13.5px] font-semibold text-gray-900 dark:text-gray-100">{transfer.reference}</span>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                          <span className={`metric-dot ${statusCfg.dot}`} aria-hidden />
                          {statusCfg.label}
                        </span>
                        {driverName && (
                          <span className="text-[11px] t-muted">· {driverName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] t-muted">
                        <span>{transfer.from_warehouse?.name || '-'}</span>
                        <span>{isRTL ? '←' : '→'}</span>
                        <span>{transfer.to_warehouse?.name || '-'}</span>
                        <span>·</span>
                        <span>{itemsCount} {t('stockTransfersList.product')}</span>
                        <span>·</span>
                        <span>{totalPcs} {t('stockTransfersList.piece')}</span>
                        {transfer.creator && (<><span>·</span><span>{transfer.creator.name}</span></>)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="hidden sm:inline text-[11px] tnum t-muted">{formatDate(transfer.created_at)}</span>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/dashboard/stock-transfers/${transfer.id}`)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title={t('stockTransfersList.viewDetails')}
                      >
                        <EyeIcon className="w-4 h-4" strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={() => handlePrint(transfer)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title={t('stockTransfersList.print')}
                      >
                        <PrinterIcon className="w-4 h-4" strokeWidth={1.8} />
                      </button>

                      {transfer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/stock-transfers/${transfer.id}/edit`)}
                            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                            title={t('stockTransfersList.edit')}
                          >
                            <PencilSquareIcon className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                          <button
                            onClick={() => handleApprove(transfer.id)}
                            disabled={acting}
                            className="p-1.5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                            title={t('stockTransfersList.approve')}
                          >
                            {acting ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <CheckCircleIcon className="w-4 h-4" strokeWidth={1.8} />}
                          </button>
                          <button
                            onClick={() => handleDelete(transfer.id)}
                            disabled={acting}
                            className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                            title={t('stockTransfersList.delete')}
                          >
                            <TrashIcon className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                        </>
                      )}

                      {transfer.status === 'loading' && (
                        <>
                          <button
                            onClick={() => handleCollect(transfer.id)}
                            disabled={acting}
                            className="p-1.5 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                            title={t('stockTransfersList.collect')}
                          >
                            {acting ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <BoltIcon className="w-4 h-4" strokeWidth={1.8} />}
                          </button>
                          <button
                            onClick={() => handleDelete(transfer.id)}
                            disabled={acting}
                            className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
                            title={t('stockTransfersList.cancel')}
                          >
                            <XMarkIcon className="w-4 h-4" strokeWidth={1.8} />
                          </button>
                        </>
                      )}

                      {transfer.status === 'collected' && (
                        isRTL
                          ? <ChevronLeftIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          : <ChevronRightIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-[12px] t-muted">
            {t('stockTransfersList.totalTransfers', { total: String(totalItems) })} · {t('stockTransfersList.pageOf', { current: String(currentPage), total: String(totalPages) })}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
            >
              {t('stockTransfersList.previous')}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
            >
              {t('stockTransfersList.next')}
            </button>
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
