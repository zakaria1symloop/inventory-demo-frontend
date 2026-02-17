'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productRequestsApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';

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

const statusLabels: Record<string, { class: string; text: string }> = {
  pending: { class: 'badge-warning', text: 'في الانتظار' },
  approved: { class: 'badge-info', text: 'تمت الموافقة' },
  rejected: { class: 'badge-danger', text: 'مرفوض' },
  fulfilled: { class: 'badge-success', text: 'تم التسليم' },
};

export default function ProductRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [editedQuantities, setEditedQuantities] = useState<Record<number, number>>({});
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [editItems, setEditItems] = useState<Record<number, number>>({});

  // Stock availability per warehouse
  const [warehouseStock, setWarehouseStock] = useState<Record<number, StockItem[]>>({});
  const [loadingStock, setLoadingStock] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

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
      const response = await productRequestsApi.getAll(params);
      setRequests(response.data.data || response.data);
    } catch {
      toast.error('خطأ في تحميل الطلبات');
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
    // Store pre-fill data in sessionStorage for the purchase form
    const preFillData = {
      warehouse_id: req.warehouse_id,
      note: `شراء لتلبية طلب منتجات ${req.reference}`,
      items: shortItems.map(si => ({
        product_id: si.item.product_id,
        product_name: si.item.product?.name || '',
        barcode: si.item.product?.barcode || '',
        quantity: Math.ceil(si.needed - si.available),
        pieces_per_package: si.item.product?.pieces_per_package || 1,
        unit_price: si.item.product?.cost_price || 0,
        unit_name: si.item.product?.unit_buy?.short_name || 'وحدة',
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
      toast.success(isCashvan ? 'تمت الموافقة وإنشاء تحويل مخزون' : 'تمت الموافقة على الطلب');
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

  const handleDelete = async (req: ProductRequest) => {
    if (!confirm(`هل تريد حذف الطلب ${req.reference}؟`)) return;
    setIsActioning(true);
    try {
      await productRequestsApi.delete(req.id);
      toast.success('تم حذف الطلب');
      setExpandedId(null);
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في الحذف');
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
      toast.success('تم تعديل الطلب');
      setEditingRequestId(null);
      setEditItems({});
      fetchRequests();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في التعديل');
    } finally {
      setIsActioning(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('ar-DZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fmtQty = (val: unknown, piecesPerPkg?: number): string => {
    const n = Number(val);
    if (isNaN(n) || n === 0) return '0';
    const ppp = piecesPerPkg && piecesPerPkg > 1 ? piecesPerPkg : 0;
    if (!ppp) return String(n);
    const cartons = Math.floor(n);
    const pieces = Math.round((n - cartons) * ppp);
    if (cartons > 0 && pieces > 0) return `${cartons} كرتون ${pieces} قطعة`;
    if (cartons > 0) return `${cartons} كرتون`;
    if (pieces > 0) return `${pieces} قطعة`;
    return '0';
  };

  const splitQty = (decimal: number, ppp: number) => {
    const cartons = Math.floor(decimal);
    const pieces = Math.round((decimal - cartons) * ppp);
    return { cartons, pieces };
  };

  const combineQty = (cartons: number, pieces: number, ppp: number) => {
    return cartons + (ppp > 1 ? pieces / ppp : 0);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const isCashvanRequest = (req: ProductRequest) => !req.van_session_id;

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
            const cashvan = isCashvanRequest(req);
            const isEditing = editingRequestId === req.id;
            const stockStatus = isExpanded && req.status === 'pending' ? getStockStatus(req) : null;
            const hasStock = req.warehouse_id ? !!warehouseStock[req.warehouse_id] : false;
            const isLoadingThisStock = loadingStock === req.warehouse_id;

            return (
              <div key={req.id} className="card !p-0 overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => {
                    setExpandedId(isExpanded ? null : req.id);
                    setAdminNotes('');
                    setEditedQuantities({});
                    if (isEditing) cancelEditing();
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
                        {cashvan && (
                          <span className="badge bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">مستودع متنقل</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {req.requester?.name || '-'} - {cashvan ? (req.warehouse?.name || 'مستودع متنقل') : `الجلسة ${req.van_session?.reference || `#${req.van_session_id}`}`} - {req.items.length} منتج
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
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{cashvan ? 'النوع' : 'الجلسة'}</span>
                        <div className="font-bold dark:text-white">{cashvan ? 'مستودع متنقل' : (req.van_session?.reference || '-')}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{cashvan ? 'المستودع المصدر' : 'المستودع'}</span>
                        <div className="font-bold dark:text-white">{req.warehouse?.name || '-'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">التاريخ</span>
                        <div className="font-bold dark:text-white">{formatDate(req.created_at)}</div>
                      </div>
                    </div>

                    {/* Stock availability warning */}
                    {req.status === 'pending' && isLoadingThisStock && (
                      <div className="px-4 py-2 border-b dark:border-gray-700 text-sm text-gray-500 flex items-center gap-2">
                        <span className="spinner w-4 h-4" /> جاري التحقق من المخزون...
                      </div>
                    )}
                    {req.status === 'pending' && hasStock && stockStatus && !stockStatus.allAvailable && (
                      <div className="px-4 py-3 border-b dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-sm mb-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          المخزون غير كافٍ لبعض المنتجات
                        </div>
                        <div className="space-y-1 mb-3">
                          {stockStatus.shortItems.map(si => (
                            <div key={si.item.id} className="flex justify-between text-sm">
                              <span className="text-red-600 dark:text-red-400">{si.item.product?.name || `منتج #${si.item.product_id}`}</span>
                              <span className="text-red-600 dark:text-red-400">
                                متوفر: <strong>{fmtQty(si.available, si.item.product?.pieces_per_package)}</strong> | مطلوب: <strong>{fmtQty(si.needed, si.item.product?.pieces_per_package)}</strong> | ينقص: <strong>{fmtQty(si.needed - si.available, si.item.product?.pieces_per_package)}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleCreatePurchase(req)}
                          className="btn bg-amber-500 hover:bg-amber-600 text-white w-full flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                          </svg>
                          إنشاء فاتورة شراء للكميات الناقصة
                        </button>
                      </div>
                    )}
                    {req.status === 'pending' && hasStock && stockStatus && stockStatus.allAvailable && (
                      <div className="px-4 py-2 border-b dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          جميع الكميات متوفرة في المستودع
                        </div>
                      </div>
                    )}

                    {/* Items */}
                    <div className="px-4 py-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 dark:text-gray-400">
                            <th className="text-right pb-2 font-medium">المنتج</th>
                            <th className="text-center pb-2 font-medium">الكمية المطلوبة</th>
                            {req.status === 'pending' && hasStock && <th className="text-center pb-2 font-medium">المتوفر</th>}
                            {req.status === 'pending' && !isEditing && <th className="text-center pb-2 font-medium">الكمية المعتمدة</th>}
                            {isEditing && <th className="text-center pb-2 font-medium">تعديل الكمية</th>}
                            {(req.status === 'approved' || req.status === 'fulfilled') && <th className="text-center pb-2 font-medium">الكمية المعتمدة</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {req.items.map(item => {
                            const available = getAvailableStock(req.warehouse_id, item.product_id);
                            const needed = editedQuantities[item.id] ?? item.quantity_requested;
                            const isShort = available !== null && available < needed;

                            return (
                              <tr key={item.id} className={`border-t dark:border-gray-700 ${isShort ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                <td className="py-2 font-medium dark:text-white">
                                  {item.product?.name || `منتج #${item.product_id}`}
                                  {item.product?.barcode && <span className="text-xs text-gray-400 mr-2">({item.product.barcode})</span>}
                                </td>
                                <td className="py-2 text-center font-bold">{fmtQty(item.quantity_requested, item.product?.pieces_per_package)}</td>
                                {req.status === 'pending' && hasStock && (
                                  <td className={`py-2 text-center font-bold ${isShort ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {available !== null ? fmtQty(available, item.product?.pieces_per_package) : '-'}
                                    {isShort && (
                                      <div className="text-[10px] text-red-500">ينقص {fmtQty(needed - (available ?? 0), item.product?.pieces_per_package)}</div>
                                    )}
                                  </td>
                                )}
                                {req.status === 'pending' && !isEditing && (() => {
                                  const ppp = item.product?.pieces_per_package || 1;
                                  const val = editedQuantities[item.id] ?? item.quantity_requested;
                                  const { cartons, pieces } = splitQty(val, ppp);
                                  return (
                                    <td className="py-2 text-center">
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
                                          <span className="text-[10px] text-blue-600">كرتون</span>
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
                                            <span className="text-[10px] text-orange-600">قطعة</span>
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
                                    <td className="py-2 text-center">
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
                                          <span className="text-[10px] text-blue-600">كرتون</span>
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
                                            <span className="text-[10px] text-orange-600">قطعة</span>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })()}
                                {(req.status === 'approved' || req.status === 'fulfilled') && (
                                  <td className="py-2 text-center font-bold text-green-600 dark:text-green-400">
                                    {fmtQty(item.quantity_approved, item.product?.pieces_per_package)}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
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

                    {/* Edit mode save/cancel */}
                    {isEditing && (
                      <div className="px-4 py-3 border-t dark:border-gray-700 flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(req)}
                          disabled={isActioning}
                          className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                          {isActioning ? <span className="spinner w-4 h-4" /> : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              حفظ التعديلات
                            </>
                          )}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="btn bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex-1"
                        >
                          إلغاء
                        </button>
                      </div>
                    )}

                    {/* Admin Actions for pending requests */}
                    {req.status === 'pending' && !isEditing && (
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
                                {cashvan ? 'موافقة (إنشاء تحويل)' : 'موافقة'}
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
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditing(req)}
                            disabled={isActioning}
                            className="btn bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex-1 flex items-center justify-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDelete(req)}
                            disabled={isActioning}
                            className="btn bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 flex-1 flex items-center justify-center gap-2 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            حذف
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fulfill button for approved (van session requests only) */}
                    {req.status === 'approved' && !cashvan && (
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

                    {/* Cashvan approved info (auto-fulfilled, stock transfer created) */}
                    {req.status === 'fulfilled' && cashvan && (
                      <div className="px-4 py-2 border-t dark:border-gray-700">
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>تم إنشاء تحويل مخزون تلقائياً (بانتظار استلام السائق)</span>
                        </div>
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
