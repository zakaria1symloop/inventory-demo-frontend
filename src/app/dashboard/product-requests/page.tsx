'use client';

import { useState, useEffect } from 'react';
import { productRequestsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface ProductRequestItem {
  id: number;
  product_id: number;
  quantity_requested: number;
  quantity_approved: number;
  notes?: string;
  product?: { id: number; name: string; retail_price: number; barcode?: string };
}

interface ProductRequest {
  id: number;
  reference: string;
  van_session_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  notes?: string;
  admin_notes?: string;
  created_at: string;
  processed_at?: string;
  requester?: { id: number; name: string };
  van_session?: { id: number; reference: string; status: string };
  warehouse?: { id: number; name: string };
  processor?: { id: number; name: string };
  items: ProductRequestItem[];
}

const statusLabels: Record<string, { class: string; text: string }> = {
  pending: { class: 'badge-warning', text: 'في الانتظار' },
  approved: { class: 'badge-info', text: 'تمت الموافقة' },
  rejected: { class: 'badge-danger', text: 'مرفوض' },
  fulfilled: { class: 'badge-success', text: 'تم التسليم' },
};

export default function ProductRequestsPage() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [editedQuantities, setEditedQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { per_page: 50 };
      if (statusFilter) params.status = statusFilter;
      const response = await productRequestsApi.getAll(params);
      setRequests(response.data.data || response.data);
    } catch {
      toast.error('خطأ في تحميل الطلبات');
    } finally {
      setIsLoading(false);
    }
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
      toast.success('تمت الموافقة على الطلب');
      setAdminNotes('');
      setEditedQuantities({});
      setExpandedId(null);
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في الموافقة');
    } finally {
      setIsActioning(false);
    }
  };

  const handleReject = async (req: ProductRequest) => {
    setIsActioning(true);
    try {
      await productRequestsApi.reject(req.id, { admin_notes: adminNotes || null });
      toast.success('تم رفض الطلب');
      setAdminNotes('');
      setExpandedId(null);
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في الرفض');
    } finally {
      setIsActioning(false);
    }
  };

  const handleFulfill = async (req: ProductRequest) => {
    setIsActioning(true);
    try {
      await productRequestsApi.fulfill(req.id);
      toast.success('تم تسليم المنتجات وخصمها من المستودع');
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: string) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || 'خطأ في التسليم');
      }
    } finally {
      setIsActioning(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">طلبات المنتجات</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">إدارة طلبات المنتجات من سائقي البيع المتنقل</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-lg font-bold">
            {pendingCount} طلب في الانتظار
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button onClick={() => setStatusFilter('pending')}
          className={`card text-right transition-all ${statusFilter === 'pending' ? 'ring-2 ring-orange-400' : ''} bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800`}>
          <div className="text-orange-600 dark:text-orange-400 text-sm">في الانتظار</div>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {requests.filter(r => r.status === 'pending').length}
          </div>
        </button>
        <button onClick={() => setStatusFilter('approved')}
          className={`card text-right transition-all ${statusFilter === 'approved' ? 'ring-2 ring-blue-400' : ''} bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800`}>
          <div className="text-blue-600 dark:text-blue-400 text-sm">تمت الموافقة</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {requests.filter(r => r.status === 'approved').length}
          </div>
        </button>
        <button onClick={() => setStatusFilter('fulfilled')}
          className={`card text-right transition-all ${statusFilter === 'fulfilled' ? 'ring-2 ring-green-400' : ''} bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800`}>
          <div className="text-green-600 dark:text-green-400 text-sm">تم التسليم</div>
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            {requests.filter(r => r.status === 'fulfilled').length}
          </div>
        </button>
        <button onClick={() => setStatusFilter('')}
          className={`card text-right transition-all ${statusFilter === '' ? 'ring-2 ring-purple-400' : ''} bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800`}>
          <div className="text-purple-600 dark:text-purple-400 text-sm">الكل</div>
          <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {requests.length}
          </div>
        </button>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p>لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => {
            const badge = statusLabels[req.status] || { class: 'badge-secondary', text: req.status };
            const isExpanded = expandedId === req.id;

            return (
              <div key={req.id} className="card !p-0 overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : req.id);
                    setAdminNotes('');
                    setEditedQuantities({});
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-right"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      req.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30' :
                      req.status === 'approved' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      req.status === 'fulfilled' ? 'bg-green-100 dark:bg-green-900/30' :
                      'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <svg className={`w-5 h-5 ${
                        req.status === 'pending' ? 'text-orange-600' :
                        req.status === 'approved' ? 'text-blue-600' :
                        req.status === 'fulfilled' ? 'text-green-600' :
                        'text-red-600'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm dark:text-white">{req.reference}</span>
                        <span className={`badge ${badge.class} text-xs`}>{badge.text}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {req.requester?.name || '-'} - الجلسة {req.van_session?.reference || `#${req.van_session_id}`} - {req.items.length} منتج
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{formatDate(req.created_at)}</span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    {/* Info */}
                    <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-b dark:border-gray-700">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">الطالب</span>
                        <div className="font-bold dark:text-white">{req.requester?.name || '-'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">الجلسة</span>
                        <div className="font-bold dark:text-white">{req.van_session?.reference || '-'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">المستودع</span>
                        <div className="font-bold dark:text-white">{req.warehouse?.name || '-'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">التاريخ</span>
                        <div className="font-bold dark:text-white">{formatDate(req.created_at)}</div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="px-4 py-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 dark:text-gray-400">
                            <th className="text-right pb-2 font-medium">المنتج</th>
                            <th className="text-center pb-2 font-medium">الكمية المطلوبة</th>
                            {req.status === 'pending' && <th className="text-center pb-2 font-medium">الكمية المعتمدة</th>}
                            {(req.status === 'approved' || req.status === 'fulfilled') && <th className="text-center pb-2 font-medium">الكمية المعتمدة</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {req.items.map(item => (
                            <tr key={item.id} className="border-t dark:border-gray-700">
                              <td className="py-2 font-medium dark:text-white">
                                {item.product?.name || `منتج #${item.product_id}`}
                                {item.product?.barcode && <span className="text-xs text-gray-400 mr-2">({item.product.barcode})</span>}
                              </td>
                              <td className="py-2 text-center font-bold">{item.quantity_requested}</td>
                              {req.status === 'pending' && (
                                <td className="py-2 text-center">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    defaultValue={editedQuantities[item.id] ?? item.quantity_requested}
                                    onChange={(e) => setEditedQuantities(prev => ({
                                      ...prev,
                                      [item.id]: parseFloat(e.target.value) || 0,
                                    }))}
                                    className="input w-24 text-center text-sm"
                                  />
                                </td>
                              )}
                              {(req.status === 'approved' || req.status === 'fulfilled') && (
                                <td className="py-2 text-center font-bold text-green-600 dark:text-green-400">
                                  {item.quantity_approved}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Notes */}
                    {req.notes && (
                      <div className="px-4 py-2 border-t dark:border-gray-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">ملاحظات السائق: </span>
                        <span className="text-sm dark:text-gray-300">{req.notes}</span>
                      </div>
                    )}

                    {/* Admin Actions */}
                    {req.status === 'pending' && (
                      <div className="px-4 py-3 border-t dark:border-gray-700 space-y-3">
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="ملاحظات الإدارة (اختياري)..."
                          className="input w-full text-sm"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={isActioning}
                            className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                          >
                            {isActioning ? <span className="spinner w-4 h-4" /> : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                موافقة
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={isActioning}
                            className="btn btn-danger flex-1 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            رفض
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fulfill button for approved */}
                    {req.status === 'approved' && (
                      <div className="px-4 py-3 border-t dark:border-gray-700">
                        <button
                          onClick={() => handleFulfill(req)}
                          disabled={isActioning}
                          className="btn bg-green-600 hover:bg-green-700 text-white w-full flex items-center justify-center gap-2"
                        >
                          {isActioning ? <span className="spinner w-4 h-4" /> : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              تسليم المنتجات (خصم من المستودع وإضافة للشاحنة)
                            </>
                          )}
                        </button>
                        {req.admin_notes && (
                          <p className="text-xs text-gray-500 mt-2">ملاحظات: {req.admin_notes}</p>
                        )}
                      </div>
                    )}

                    {/* Processor info */}
                    {req.processor && (
                      <div className="px-4 py-2 border-t dark:border-gray-700 text-xs text-gray-500">
                        تمت المعالجة بواسطة {req.processor.name} - {req.processed_at ? formatDate(req.processed_at) : ''}
                        {req.admin_notes && <span className="mr-2">| {req.admin_notes}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
