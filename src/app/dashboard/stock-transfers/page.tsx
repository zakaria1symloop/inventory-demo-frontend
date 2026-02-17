'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { stockTransfersApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';

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
  product?: { id: number; name: string; barcode?: string; pieces_per_package?: number };
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

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [currentPage, statusFilter, fromWarehouseFilter, toWarehouseFilter, dateFrom, dateTo]);

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
      toast.error('خطأ في تحميل التحويلات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟ سيتم التحقق من توفر المخزون.')) return;
    try {
      await stockTransfersApi.approve(id);
      toast.success('تمت الموافقة - جاري التحميل');
      fetchTransfers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'خطأ في الموافقة';
      toast.error(msg);
    }
  };

  const handleCollect = async (id: number) => {
    if (!confirm('هل أنت متأكد من تسليم البضاعة؟ سيتم نقل المخزون فوراً.')) return;
    try {
      await stockTransfersApi.collect(id);
      toast.success('تم التسليم بنجاح - يمكن للسائق البدء');
      fetchTransfers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'خطأ في التسليم';
      toast.error(msg);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا التحويل؟')) return;
    try {
      await stockTransfersApi.delete(id);
      toast.success('تم حذف التحويل');
      fetchTransfers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في الحذف');
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

  const hasActiveFilters = statusFilter || fromWarehouseFilter || toWarehouseFilter || dateFrom || dateTo;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      pending: { class: 'badge-warning', text: 'طلب جديد' },
      loading: { class: 'badge-info', text: 'جاري التحميل' },
      collected: { class: 'badge-success', text: 'تم التسليم' },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const filteredTransfers = transfers.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.reference.toLowerCase().includes(term) ||
      t.from_warehouse?.name?.toLowerCase().includes(term) ||
      t.to_warehouse?.name?.toLowerCase().includes(term) ||
      t.creator?.name?.toLowerCase().includes(term)
    );
  });

  const getItemsCount = (transfer: StockTransfer) => {
    return transfer.items?.length || 0;
  };

  const getTotalPieces = (transfer: StockTransfer) => {
    return transfer.items?.reduce((sum, item) => {
      const ppp = item.product?.pieces_per_package || 1;
      return sum + Math.round(Number(item.quantity) * ppp);
    }, 0) || 0;
  };

  // Stats from current page
  const pendingCount = transfers.filter(t => t.status === 'pending').length;
  const loadingCount = transfers.filter(t => t.status === 'loading').length;
  const collectedCount = transfers.filter(t => t.status === 'collected').length;

  if (isLoading && transfers.length === 0) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-4 flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> تحويل جديد</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">تحويلات المخزون</h1>
        <button onClick={() => router.push('/dashboard/stock-transfers/new')} className="btn btn-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          تحويل جديد
          <kbd className="bg-blue-700 px-1.5 py-0.5 rounded text-xs mr-2">Insert</kbd>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">الإجمالي</p>
            <p className="text-2xl font-bold">{totalItems || transfers.length}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">طلبات جديدة</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">جاري التحميل</p>
            <p className="text-2xl font-bold text-blue-600">{loadingCount}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">تم التسليم</p>
            <p className="text-2xl font-bold text-green-600">{collectedCount}</p>
          </div>
        </div>
      </div>

      <div className="card">
        {/* Filters */}
        <div className="space-y-3 mb-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="بحث بالمرجع أو المستودع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input max-w-xs"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="select max-w-xs"
            >
              <option value="">كل الحالات</option>
              <option value="pending">طلب جديد</option>
              <option value="loading">جاري التحميل</option>
              <option value="collected">تم التسليم</option>
            </select>
            <select
              value={fromWarehouseFilter}
              onChange={(e) => { setFromWarehouseFilter(e.target.value); setCurrentPage(1); }}
              className="select max-w-xs"
            >
              <option value="">المستودع المصدر (الكل)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select
              value={toWarehouseFilter}
              onChange={(e) => { setToWarehouseFilter(e.target.value); setCurrentPage(1); }}
              className="select max-w-xs"
            >
              <option value="">المستودع الوجهة (الكل)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 whitespace-nowrap">من:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="input max-w-[170px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 whitespace-nowrap">إلى:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="input max-w-[170px]"
              />
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn btn-sm btn-outline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>المرجع</th>
                <th>من مستودع</th>
                <th>إلى مستودع</th>
                <th>السائق</th>
                <th>المنتجات</th>
                <th>القطع</th>
                <th>أنشأ بواسطة</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    لا توجد تحويلات
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => {
                  const statusBadge = getStatusBadge(transfer.status);
                  return (
                    <tr
                      key={transfer.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/stock-transfers/${transfer.id}`)}
                    >
                      <td className="font-medium font-mono text-sm">{transfer.reference}</td>
                      <td>{transfer.from_warehouse?.name || '-'}</td>
                      <td>{transfer.to_warehouse?.name || '-'}</td>
                      <td className="font-medium text-blue-600">
                        {transfer.to_warehouse?.assigned_user?.name || transfer.from_warehouse?.assigned_user?.name || '-'}
                      </td>
                      <td>{getItemsCount(transfer)}</td>
                      <td>{getTotalPieces(transfer)}</td>
                      <td>{transfer.creator?.name || '-'}</td>
                      <td className="text-sm">{formatDate(transfer.created_at)}</td>
                      <td>
                        <span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span>
                      </td>
                      <td>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => router.push(`/dashboard/stock-transfers/${transfer.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="عرض التفاصيل"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {transfer.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(transfer.id)}
                                className="text-green-600 hover:text-green-800"
                                title="موافقة (بدء التحميل)"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(transfer.id)}
                                className="text-red-600 hover:text-red-800"
                                title="حذف"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                          {transfer.status === 'loading' && (
                            <>
                              <button
                                onClick={() => handleCollect(transfer.id)}
                                className="text-green-600 hover:text-green-800"
                                title="تسليم (انطلاق)"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(transfer.id)}
                                className="text-red-600 hover:text-red-800"
                                title="إلغاء"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t dark:border-gray-700">
            <span className="text-sm text-gray-500">
              إجمالي {totalItems} تحويل - صفحة {currentPage} من {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-sm btn-secondary"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-sm btn-secondary"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
