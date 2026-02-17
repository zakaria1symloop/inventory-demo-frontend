'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { stockTransfersApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Warehouse {
  id: number;
  name: string;
  assigned_user?: { id: number; name: string } | null;
}

interface Product {
  id: number;
  name: string;
  barcode?: string;
  sku?: string;
  cost_price?: number;
  retail_price?: number;
  wholesale_price?: number;
  pieces_per_package?: number;
  unit?: { name: string; short_name?: string };
  unit_sale?: { name: string; short_name?: string };
}

interface StockTransferItem {
  id: number;
  product_id: number;
  quantity: number;
  product?: Product;
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
  updated_at: string;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  creator?: { id: number; name: string };
  collector?: { id: number; name: string };
  approver?: { id: number; name: string };
  items?: StockTransferItem[];
}

function formatQty(decimalQty: number, piecesPerPackage: number): string {
  const ppp = piecesPerPackage || 1;
  if (ppp <= 1) {
    const total = Math.round(decimalQty);
    return `${total} قطعة`;
  }
  const totalPieces = Math.round(decimalQty * ppp);
  const cartons = Math.floor(totalPieces / ppp);
  const pieces = totalPieces % ppp;
  if (pieces === 0) return `${cartons} كرتون (${totalPieces} ق)`;
  if (cartons === 0) return `${totalPieces} قطعة`;
  return `${cartons} كرتون + ${pieces} قطعة (${totalPieces} ق)`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
}

export default function StockTransferDetail() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [transfer, setTransfer] = useState<StockTransfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => {
    fetchTransfer();
  }, [id]);

  const fetchTransfer = async () => {
    setIsLoading(true);
    try {
      const response = await stockTransfersApi.getOne(id);
      setTransfer(response.data);
    } catch {
      toast.error('خطأ في تحميل التحويل');
      router.push('/dashboard/stock-transfers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('هل أنت متأكد من الموافقة على هذا الطلب؟ سيتم التحقق من توفر المخزون.')) return;
    setIsActioning(true);
    try {
      await stockTransfersApi.approve(id);
      toast.success('تمت الموافقة - جاري التحميل');
      fetchTransfer();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'خطأ في الموافقة';
      toast.error(msg);
    } finally {
      setIsActioning(false);
    }
  };

  const handleCollect = async () => {
    if (!confirm('هل أنت متأكد من تسليم البضاعة؟ سيتم نقل المخزون فوراً والسائق يمكنه الانطلاق.')) return;
    setIsActioning(true);
    try {
      await stockTransfersApi.collect(id);
      toast.success('تم التسليم بنجاح - يمكن للسائق الانطلاق');
      fetchTransfer();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const msg = err.response?.data?.errors?.join('\n') || err.response?.data?.message || 'خطأ في التسليم';
      toast.error(msg);
    } finally {
      setIsActioning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('هل أنت متأكد من حذف هذا التحويل؟')) return;
    try {
      await stockTransfersApi.delete(id);
      toast.success('تم حذف التحويل');
      router.push('/dashboard/stock-transfers');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    const statuses: Record<string, { class: string; text: string; icon: string }> = {
      pending: { class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400', text: 'طلب جديد', icon: '⏳' },
      loading: { class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', text: 'جاري التحميل', icon: '📦' },
      collected: { class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', text: 'تم التسليم - انطلاق', icon: '✅' },
    };
    return statuses[status] || { class: 'bg-gray-100 text-gray-800', text: status, icon: '❓' };
  };

  const getItemDetails = (item: StockTransferItem) => {
    const ppp = item.product?.pieces_per_package || 1;
    const totalPieces = Math.round(Number(item.quantity) * ppp);
    const cartons = Math.floor(totalPieces / ppp);
    const extraPieces = totalPieces % ppp;
    const unitCost = Number(item.product?.cost_price) || 0;
    const subtotal = unitCost * totalPieces;
    return { ppp, totalPieces, cartons, extraPieces, unitCost, subtotal };
  };

  const getSummary = () => {
    const items = transfer?.items || [];
    let totalCartons = 0;
    let totalExtraPieces = 0;
    let totalPieces = 0;
    let totalCostValue = 0;
    let totalRetailValue = 0;

    for (const item of items) {
      const d = getItemDetails(item);
      totalCartons += d.cartons;
      totalExtraPieces += d.extraPieces;
      totalPieces += d.totalPieces;
      totalCostValue += d.subtotal;
      const retailPrice = Number(item.product?.retail_price) || 0;
      totalRetailValue += retailPrice * d.totalPieces;
    }

    return { totalCartons, totalExtraPieces, totalPieces, totalCostValue, totalRetailValue, productCount: items.length };
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  if (!transfer) {
    return <div className="text-center py-8 text-gray-500">التحويل غير موجود</div>;
  }

  const statusInfo = getStatusInfo(transfer.status);
  const summary = getSummary();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/stock-transfers')}
            className="btn btn-secondary btn-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            رجوع
          </button>
          <h1 className="text-2xl font-bold">تحويل {transfer.reference}</h1>
        </div>
        <div className={`px-4 py-2 rounded-lg font-medium text-sm ${statusInfo.class}`}>
          {statusInfo.icon} {statusInfo.text}
        </div>
      </div>

      {/* Status Progress Bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              transfer.status === 'pending' ? 'bg-amber-500' : 'bg-green-500'
            }`}>
              1
            </div>
            <div>
              <p className="font-medium text-sm">طلب</p>
              <p className="text-xs text-gray-500">{formatDate(transfer.created_at)}</p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 rounded ${
            transfer.status !== 'pending' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
          }`} />
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              transfer.status === 'loading' ? 'bg-blue-500 text-white' :
              transfer.status === 'collected' ? 'bg-green-500 text-white' :
              'bg-gray-200 dark:bg-gray-700 text-gray-400'
            }`}>
              2
            </div>
            <div>
              <p className="font-medium text-sm">تحميل</p>
              <p className="text-xs text-gray-500">
                {transfer.approved_at ? formatDate(transfer.approved_at) : '-'}
              </p>
            </div>
          </div>
          <div className={`flex-1 h-1 mx-4 rounded ${
            transfer.status === 'collected' ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
          }`} />
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              transfer.status === 'collected' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            }`}>
              3
            </div>
            <div>
              <p className="font-medium text-sm">انطلاق</p>
              <p className="text-xs text-gray-500">
                {transfer.collected_at ? formatDate(transfer.collected_at) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">معلومات التحويل</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">المرجع</label>
                <p className="font-mono font-medium">{transfer.reference}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">تاريخ الإنشاء</label>
                <p className="font-medium">{formatDate(transfer.created_at)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">المستودع المصدر</label>
                <p className="font-medium">{transfer.from_warehouse?.name || '-'}</p>
                {transfer.from_warehouse?.assigned_user && (
                  <p className="text-xs text-gray-500">المسؤول: {transfer.from_warehouse.assigned_user.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">المستودع الوجهة</label>
                <p className="font-medium">{transfer.to_warehouse?.name || '-'}</p>
                {transfer.to_warehouse?.assigned_user && (
                  <p className="text-xs text-blue-600 font-medium">السائق: {transfer.to_warehouse.assigned_user.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">أنشأ بواسطة</label>
                <p className="font-medium">{transfer.creator?.name || '-'}</p>
              </div>
              {transfer.approver && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">وافق عليه</label>
                  <p className="font-medium">{transfer.approver.name}</p>
                  {transfer.approved_at && (
                    <p className="text-xs text-gray-500">{formatDate(transfer.approved_at)}</p>
                  )}
                </div>
              )}
              {transfer.collector && (
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">تم التسليم بواسطة</label>
                  <p className="font-medium">{transfer.collector.name}</p>
                  {transfer.collected_at && (
                    <p className="text-xs text-gray-500">{formatDate(transfer.collected_at)}</p>
                  )}
                </div>
              )}
              {transfer.notes && (
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-500 dark:text-gray-400">ملاحظات</label>
                  <p className="font-medium">{transfer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items Card */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4">
              المنتجات ({transfer.items?.length || 0})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-3 py-2 text-center w-12">#</th>
                    <th className="px-3 py-2 text-right">المنتج</th>
                    <th className="px-3 py-2 text-center w-16">الوحدة</th>
                    <th className="px-3 py-2 text-center w-24">كرتون</th>
                    <th className="px-3 py-2 text-center w-20">قطع إضافية</th>
                    <th className="px-3 py-2 text-center w-20">إجمالي القطع</th>
                    <th className="px-3 py-2 text-center w-24">س. الوحدة</th>
                    <th className="px-3 py-2 text-center w-24">المبلغ</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.items?.map((item, index) => {
                    const d = getItemDetails(item);
                    return (
                      <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-3 py-3 text-center text-gray-500">{index + 1}</td>
                        <td className="px-3 py-3">
                          <div className="font-medium">{item.product?.name || '-'}</div>
                          {(item.product?.barcode || item.product?.sku) && (
                            <div className="text-xs text-gray-500 font-mono">{item.product.barcode || item.product.sku}</div>
                          )}
                          {d.ppp > 1 && (
                            <div className="text-xs text-blue-600">{d.ppp} قطعة/كرتون</div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">{item.product?.unit?.name || item.product?.unit_sale?.name || '-'}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-bold text-blue-700">{d.cartons}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {d.extraPieces > 0 ? (
                            <span className="font-bold text-orange-600">{d.extraPieces}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center font-bold">{d.totalPieces}</td>
                        <td className="px-3 py-3 text-center text-sm">{d.unitCost.toFixed(2)}</td>
                        <td className="px-3 py-3 text-center font-bold text-green-700">{d.subtotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {(!transfer.items || transfer.items.length === 0) && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">لا توجد منتجات</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-800 font-bold">
                    <td colSpan={3} className="px-3 py-3 text-right">الإجمالي</td>
                    <td className="px-3 py-3 text-center text-blue-700">{summary.totalCartons}</td>
                    <td className="px-3 py-3 text-center text-orange-600">{summary.totalExtraPieces}</td>
                    <td className="px-3 py-3 text-center">{summary.totalPieces}</td>
                    <td className="px-3 py-3 text-center">-</td>
                    <td className="px-3 py-3 text-center text-green-700">{formatCurrency(summary.totalCostValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card sticky top-4">
            <h2 className="text-lg font-semibold mb-4">الإجراءات</h2>

            <div className="space-y-3">
              {transfer.status === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={isActioning}
                    className="btn btn-primary w-full"
                  >
                    {isActioning ? (
                      <div className="spinner w-4 h-4 border-2"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    موافقة - بدء التحميل
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    سيتم التحقق من توفر المخزون في المستودع المصدر
                  </p>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleDelete}
                    className="btn btn-danger w-full"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف الطلب
                  </button>
                </>
              )}

              {transfer.status === 'loading' && (
                <>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                    <p className="font-medium mb-1">جاري التحميل</p>
                    <p>البضاعة يتم تحضيرها. اضغط &quot;تسليم&quot; عند الانتهاء.</p>
                  </div>
                  <button
                    onClick={handleCollect}
                    disabled={isActioning}
                    className="btn btn-success w-full"
                  >
                    {isActioning ? (
                      <div className="spinner w-4 h-4 border-2"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    تسليم - انطلاق السائق
                  </button>
                  <p className="text-xs text-gray-500 text-center">
                    سيتم نقل المخزون من المستودع المصدر إلى مستودع السائق
                  </p>
                  <hr className="border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={handleDelete}
                    className="btn btn-danger w-full btn-outline"
                  >
                    إلغاء التحويل
                  </button>
                </>
              )}

              {transfer.status === 'collected' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-green-700 dark:text-green-400">تم التسليم بنجاح</p>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    البضاعة في مستودع السائق والسائق يمكنه البدء بالبيع
                  </p>
                  {transfer.collected_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(transfer.collected_at)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t dark:border-gray-700">
              <h3 className="font-semibold mb-3 text-sm">ملخص التحويل</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">عدد المنتجات:</span>
                  <span className="font-medium">{summary.productCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">إجمالي الكراتين:</span>
                  <span className="font-bold text-blue-600">{summary.totalCartons}</span>
                </div>
                {summary.totalExtraPieces > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">قطع إضافية:</span>
                    <span className="font-bold text-orange-600">{summary.totalExtraPieces}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">إجمالي القطع:</span>
                  <span className="font-bold">{summary.totalPieces}</span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between">
                  <span className="text-gray-500">قيمة التكلفة:</span>
                  <span className="font-bold text-green-700">{formatCurrency(summary.totalCostValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">قيمة البيع (تجزئة):</span>
                  <span className="font-bold text-blue-700">{formatCurrency(summary.totalRetailValue)}</span>
                </div>
                {summary.totalRetailValue > summary.totalCostValue && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">هامش الربح:</span>
                    <span className="font-medium text-purple-600">
                      {formatCurrency(summary.totalRetailValue - summary.totalCostValue)}
                      {' '}({((summary.totalRetailValue - summary.totalCostValue) / summary.totalCostValue * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}