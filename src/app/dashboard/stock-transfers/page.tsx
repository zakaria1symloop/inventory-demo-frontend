'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { stockTransfersApi, warehousesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import {
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  PlusIcon,
  ClockIcon,
  BoltIcon,
  CheckBadgeIcon,
  EyeIcon,
  PrinterIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CubeIcon,
  UserIcon,
  CalendarDaysIcon,
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
  const [showFilters, setShowFilters] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isActioning, setIsActioning] = useState<number | null>(null);

  const STATUS_CONFIG = useMemo(() => ({
    pending: {
      label: t('stockTransfersList.statusPending'),
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-700',
    },
    loading: {
      label: t('stockTransfersList.statusLoading'),
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-700',
    },
    collected: {
      label: t('stockTransfersList.statusCollected'),
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-700 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-700',
    },
  } as Record<string, { label: string; bg: string; text: string; border: string }>), [t]);

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

  // Keyboard shortcuts
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
    } catch {
      // ignore
    }
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
    // NOTE: Print template is Arabic-only for now
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

  // Stats
  const pendingCount = transfers.filter(tr => tr.status === 'pending').length;
  const loadingCount = transfers.filter(tr => tr.status === 'loading').length;
  const activeFilterCount = [statusFilter, fromWarehouseFilter, toWarehouseFilter, dateFrom, dateTo, searchTerm].filter(Boolean).length;

  const storageKey = 'stock_transfers_tour_step';

  if (isLoading && transfers.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="st-title">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <ArrowsRightLeftIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-none">{t('stockTransfersList.title')}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('stockTransfersList.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { localStorage.removeItem(storageKey); setShowTour(true); }}
            className="text-sm font-medium text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
          >
            {t('stockTransfersList.tourBtn')}
          </button>
          <button
            onClick={() => { setIsLoading(true); fetchTransfers(); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('stockTransfersList.refresh')}</span>
          </button>
          <button
            onClick={() => router.push('/dashboard/stock-transfers/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-xl shadow-sm transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            {t('stockTransfersList.newTransfer')}
            <kbd className={`bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium ${isRTL ? 'mr-1' : 'ml-1'}`}>Insert</kbd>
          </button>
        </div>
      </div>

      {/* View Mode Toggle: Active vs Archive */}
      <div className="flex items-center gap-2" data-tour="st-kpis">
        <button
          onClick={() => { setViewMode('active'); setStatusFilter(''); setCurrentPage(1); }}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl border text-sm font-bold transition-all ${
            viewMode === 'active'
              ? 'bg-white dark:bg-gray-800 border-teal-300 dark:border-teal-600 ring-1 ring-teal-200 dark:ring-teal-700 text-teal-700 dark:text-teal-400 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${viewMode === 'active' ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <ArrowsRightLeftIcon className={`w-4.5 h-4.5 ${viewMode === 'active' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}`} />
          </div>
          <div className="text-start">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none">{t('stockTransfersList.activeTransfers')}</p>
            <p className={`text-lg font-black tabular-nums leading-tight ${viewMode === 'active' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-500 dark:text-gray-400'}`}>{viewMode === 'active' && !statusFilter ? totalItems : pendingCount + loadingCount}</p>
          </div>
        </button>
        <button
          onClick={() => { setStatusFilter('pending'); setViewMode('active'); setCurrentPage(1); }}
          className={`hidden sm:inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl border text-sm font-bold transition-all ${
            statusFilter === 'pending'
              ? 'bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-700 text-amber-700 dark:text-amber-400 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${statusFilter === 'pending' ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <ClockIcon className={`w-4.5 h-4.5 ${statusFilter === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`} />
          </div>
          <div className="text-start">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none">{t('stockTransfersList.statusPending')}</p>
            <p className={`text-lg font-black tabular-nums leading-tight ${statusFilter === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>{pendingCount}</p>
          </div>
        </button>
        <button
          onClick={() => { setStatusFilter('loading'); setViewMode('active'); setCurrentPage(1); }}
          className={`hidden sm:inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl border text-sm font-bold transition-all ${
            statusFilter === 'loading'
              ? 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600 ring-1 ring-blue-200 dark:ring-blue-700 text-blue-700 dark:text-blue-400 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${statusFilter === 'loading' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <BoltIcon className={`w-4.5 h-4.5 ${statusFilter === 'loading' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
          </div>
          <div className="text-start">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none">{t('stockTransfersList.statusLoading')}</p>
            <p className={`text-lg font-black tabular-nums leading-tight ${statusFilter === 'loading' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{loadingCount}</p>
          </div>
        </button>
        <button
          onClick={() => { setViewMode('archive'); setStatusFilter(''); setCurrentPage(1); }}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl border text-sm font-bold transition-all ${
            viewMode === 'archive'
              ? 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 ring-1 ring-gray-300 dark:ring-gray-600 text-gray-700 dark:text-gray-300 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200/80 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${viewMode === 'archive' ? 'bg-gray-200 dark:bg-gray-600' : 'bg-gray-100 dark:bg-gray-700'}`}>
            <ArchiveBoxArrowDownIcon className={`w-4.5 h-4.5 ${viewMode === 'archive' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`} />
          </div>
          <div className="text-start">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none">{t('stockTransfersList.archive')}</p>
            <p className={`text-lg font-black tabular-nums leading-tight ${viewMode === 'archive' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>{viewMode === 'archive' ? totalItems : '—'}</p>
          </div>
        </button>
      </div>

      {/* Search + Filters + Cards */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700" data-tour="st-search">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
            <input
              type="text"
              placeholder={t('stockTransfersList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-teal-300 dark:border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('stockTransfersList.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1">
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('stockTransfersList.clear')}</span>
            </button>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
            {filteredTransfers.length} / {totalItems || transfers.length}
          </span>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('stockTransfersList.filterStatus')}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="select w-full"
                >
                  <option value="">{t('stockTransfersList.allStatuses')}</option>
                  <option value="pending">{t('stockTransfersList.statusPending')}</option>
                  <option value="loading">{t('stockTransfersList.statusLoading')}</option>
                  <option value="collected">{t('stockTransfersList.statusCollected')}</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('stockTransfersList.fromWarehouse')}</label>
                <select
                  value={fromWarehouseFilter}
                  onChange={(e) => { setFromWarehouseFilter(e.target.value); setCurrentPage(1); }}
                  className="select w-full"
                >
                  <option value="">{t('stockTransfersList.all')}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('stockTransfersList.toWarehouse')}</label>
                <select
                  value={toWarehouseFilter}
                  onChange={(e) => { setToWarehouseFilter(e.target.value); setCurrentPage(1); }}
                  className="select w-full"
                >
                  <option value="">{t('stockTransfersList.all')}</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('stockTransfersList.fromDate')}</label>
                <DateInput
                  value={dateFrom}
                  onChange={(v) => { setDateFrom(v); setCurrentPage(1); }}
                  placeholder={t('stockTransfersList.fromDate')}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{t('stockTransfersList.toDate')}</label>
                <DateInput
                  value={dateTo}
                  onChange={(v) => { setDateTo(v); setCurrentPage(1); }}
                  placeholder={t('stockTransfersList.toDate')}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto" data-tour="st-quick-filters">
          {viewMode === 'active' ? (
            <>
              {([
                { value: '', label: t('stockTransfersList.allActive') },
                { value: 'pending', label: t('stockTransfersList.statusPending') },
                { value: 'loading', label: t('stockTransfersList.statusLoading') },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); }}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === opt.value
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <ArchiveBoxArrowDownIcon className="w-3.5 h-3.5" />
              {t('stockTransfersList.archiveDelivered')}
            </span>
          )}
        </div>

        {/* Transfer Cards */}
        <div className="p-4 space-y-3" data-tour="st-cards">
          {filteredTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <ArchiveBoxArrowDownIcon className="w-12 h-12 mb-3" />
              <p className="text-lg font-semibold">
                {viewMode === 'archive' ? t('stockTransfersList.noArchivedTransfers') : t('stockTransfersList.noActiveTransfers')}
              </p>
              <p className="text-sm mt-1">
                {viewMode === 'archive' ? t('stockTransfersList.noDeliveredYet') : t('stockTransfersList.noProcessingNow')}
              </p>
              {viewMode === 'active' && (
                <button
                  onClick={() => router.push('/dashboard/stock-transfers/new')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-teal-600 to-cyan-600 rounded-xl shadow-sm transition-all hover:from-teal-700 hover:to-cyan-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  {t('stockTransfersList.createNewTransfer')}
                </button>
              )}
            </div>
          ) : (
            filteredTransfers.map(transfer => {
              const statusCfg = STATUS_CONFIG[transfer.status] || { label: transfer.status, bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' };
              const itemsCount = getItemsCount(transfer);
              const totalPcs = getTotalPieces(transfer);
              const driverName = transfer.to_warehouse?.assigned_user?.name || transfer.from_warehouse?.assigned_user?.name || '';
              const acting = isActioning === transfer.id;

              return (
                <div
                  key={transfer.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
                  onClick={() => router.push(`/dashboard/stock-transfers/${transfer.id}`)}
                >
                  <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Status icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        transfer.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30' :
                        transfer.status === 'loading' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-emerald-100 dark:bg-emerald-900/30'
                      }`}>
                        {transfer.status === 'pending' && <ClockIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                        {transfer.status === 'loading' && <BoltIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        {transfer.status === 'collected' && <CheckBadgeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Top row: reference + status + driver */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-100">{transfer.reference}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                            {statusCfg.label}
                          </span>
                          {driverName && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400">
                              {driverName}
                            </span>
                          )}
                        </div>

                        {/* Bottom row: warehouses + items info */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <BuildingStorefrontIcon className="w-3.5 h-3.5" />
                            {transfer.from_warehouse?.name || '-'}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">{isRTL ? '\u2190' : '\u2192'}</span>
                          <span className="flex items-center gap-1">
                            <TruckIcon className="w-3.5 h-3.5" />
                            {transfer.to_warehouse?.name || '-'}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">&middot;</span>
                          <span className="flex items-center gap-1">
                            <CubeIcon className="w-3.5 h-3.5" />
                            {itemsCount} {t('stockTransfersList.product')}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">&middot;</span>
                          <span>{totalPcs} {t('stockTransfersList.piece')}</span>
                          {transfer.creator && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">&middot;</span>
                              <span className="flex items-center gap-1">
                                <UserIcon className="w-3.5 h-3.5" />
                                {transfer.creator.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right/End side: date + actions */}
                    <div className={`flex items-center gap-3 shrink-0 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                      <div className="hidden sm:flex flex-col items-end text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {formatDate(transfer.created_at)}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/dashboard/stock-transfers/${transfer.id}`)}
                          className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors"
                          title={t('stockTransfersList.viewDetails')}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(transfer)}
                          className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={t('stockTransfersList.print')}
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </button>

                        {transfer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/stock-transfers/${transfer.id}/edit`)}
                              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                              title={t('stockTransfersList.edit')}
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApprove(transfer.id)}
                              disabled={acting}
                              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                              title={t('stockTransfersList.approve')}
                            >
                              {acting ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(transfer.id)}
                              disabled={acting}
                              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                              title={t('stockTransfersList.delete')}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {transfer.status === 'loading' && (
                          <>
                            <button
                              onClick={() => handleCollect(transfer.id)}
                              disabled={acting}
                              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
                              title={t('stockTransfersList.collect')}
                            >
                              {acting ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" /> : <BoltIcon className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(transfer.id)}
                              disabled={acting}
                              className="p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                              title={t('stockTransfersList.cancel')}
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {transfer.status === 'collected' && (
                          isRTL
                            ? <ChevronLeftIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            : <ChevronRightIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" />
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
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {t('stockTransfersList.totalTransfers', { total: String(totalItems) })} &middot; {t('stockTransfersList.pageOf', { current: String(currentPage), total: String(totalPages) })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRTL ? <ChevronRightIcon className="w-3.5 h-3.5" /> : <ChevronLeftIcon className="w-3.5 h-3.5" />}
                {t('stockTransfersList.previous')}
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('stockTransfersList.next')}
                {isRTL ? <ChevronLeftIcon className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

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
