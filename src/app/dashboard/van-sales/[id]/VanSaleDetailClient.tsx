'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { vanSessionsApi } from '@/lib/api';
import { formatQty } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  ArrowRightIcon,
  PlayIcon,
  StopIcon,
  XMarkIcon,
  TruckIcon,
  BanknotesIcon,
  CubeIcon,
  ArrowPathIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface VanSession {
  id: number;
  reference: string;
  livreur_id: number;
  vehicle_id?: number;
  warehouse_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  status: 'preparing' | 'active' | 'completed' | 'cancelled';
  total_loaded_value: number;
  total_sales: number;
  total_collected: number;
  total_credit: number;
  total_returned_value: number;
  sales_count: number;
  notes?: string;
  livreur?: { id: number; name: string };
  vehicle?: { id: number; plate_number: string; model: string };
  warehouse?: { id: number; name: string };
  items?: SessionItem[];
  sales?: VanSale[];
  returns?: VanReturn[];
}

interface SessionItem {
  id: number;
  product_id: number;
  quantity_loaded: number;
  quantity_sold: number;
  quantity_returned: number;
  product?: { id: number; name: string; sku: string; retail_price: number; pieces_per_package?: number };
}

interface VanSale {
  id: number;
  reference: string;
  client_id?: number;
  sale_time: string;
  total_amount: number;
  discount: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  client?: { id: number; name: string };
  items?: VanSaleItem[];
}

interface VanSaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  product?: { id: number; name: string; pieces_per_package?: number };
}

interface VanReturn {
  id: number;
  product_id: number;
  quantity: number;
  reason: string;
  returnable_to_stock: boolean;
  processed: boolean;
  product?: { id: number; name: string; pieces_per_package?: number };
}

export default function VanSaleDetailClient() {
  const params = useParams();
  const router = useRouter();
  const sessionId = parseInt(params.id as string);

  const [session, setSession] = useState<VanSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'sales' | 'returns'>('products');

  const fetchSession = async () => {
    try {
      const response = await vanSessionsApi.getOne(sessionId);
      setSession(response.data);
    } catch {
      toast.error('خطأ في تحميل بيانات الجلسة');
      router.push('/dashboard/van-sales');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const handleStart = async () => {
    if (!confirm('هل تريد بدء جلسة البيع المتنقل؟ سيتم خصم المخزون من المستودع.')) return;
    try {
      await vanSessionsApi.start(sessionId);
      toast.success('تم بدء الجلسة بنجاح');
      fetchSession();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      const errors = err.response?.data?.errors;
      if (errors) {
        toast.error(errors.join('\n'));
      } else {
        toast.error(err.response?.data?.message || 'خطأ في بدء الجلسة');
      }
    }
  };

  const handleComplete = async () => {
    if (!confirm('هل تريد إنهاء الجلسة؟ سيتم إرجاع المنتجات غير المباعة للمستودع.')) return;
    try {
      await vanSessionsApi.complete(sessionId);
      toast.success('تم إنهاء الجلسة بنجاح');
      fetchSession();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في إنهاء الجلسة');
    }
  };

  const handleCancel = async () => {
    if (!confirm('هل أنت متأكد من إلغاء هذه الجلسة؟')) return;
    try {
      await vanSessionsApi.cancel(sessionId);
      toast.success('تم إلغاء الجلسة');
      fetchSession();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في إلغاء الجلسة');
    }
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return '0 د.ج.';
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('ar-DZ');
  const formatTime = (datetime: string | undefined) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
  };
  const formatDateTime = (datetime: string) => new Date(datetime).toLocaleString('ar-DZ');

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      preparing: { class: 'badge-warning', text: 'قيد التحضير' },
      active: { class: 'badge-info', text: 'نشط' },
      completed: { class: 'badge-success', text: 'مكتمل' },
      cancelled: { class: 'badge-error', text: 'ملغي' },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      paid: { class: 'badge-success', text: 'مدفوع' },
      partial: { class: 'badge-warning', text: 'جزئي' },
      unpaid: { class: 'badge-error', text: 'غير مدفوع' },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      unsold: 'غير مباع', damaged: 'تالف', expired: 'منتهي الصلاحية', other: 'أخرى',
    };
    return labels[reason] || reason;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="loading loading-spinner loading-lg"></div></div>;
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">الجلسة غير موجودة</p>
        <Link href="/dashboard/van-sales" className="btn btn-primary mt-4">العودة للقائمة</Link>
      </div>
    );
  }

  const statusBadge = getStatusBadge(session.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/van-sales" className="text-gray-500 hover:text-gray-700"><ArrowRightIcon className="w-6 h-6" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{session.reference}</h1>
              <span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span>
            </div>
            <p className="text-gray-500 mt-1">جلسة بيع متنقل</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSession} className="btn btn-ghost"><ArrowPathIcon className="w-5 h-5" /></button>
          {session.status === 'preparing' && (<button onClick={handleStart} className="btn btn-success"><PlayIcon className="w-5 h-5" />بدء الجلسة</button>)}
          {session.status === 'active' && (
            <>
              <button onClick={handleComplete} className="btn btn-primary"><StopIcon className="w-5 h-5" />إنهاء الجلسة</button>
              <button onClick={handleCancel} className="btn btn-error btn-outline"><XMarkIcon className="w-5 h-5" />إلغاء</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center"><TruckIcon className="w-6 h-6 text-blue-600" /></div><div><div className="text-sm text-gray-500">السائق</div><div className="font-medium">{session.livreur?.name || '-'}</div><div className="text-sm text-gray-400">{session.vehicle?.plate_number || 'بدون مركبة'}</div></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center"><CubeIcon className="w-6 h-6 text-purple-600" /></div><div><div className="text-sm text-gray-500">المستودع</div><div className="font-medium">{session.warehouse?.name || '-'}</div><div className="text-sm text-gray-400">{formatDate(session.date)}</div></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center"><BanknotesIcon className="w-6 h-6 text-green-600" /></div><div><div className="text-sm text-gray-500">المبيعات</div><div className="font-medium text-green-600">{formatCurrency(session.total_sales)}</div><div className="text-sm text-gray-400">{session.sales_count} عملية</div></div></div></div>
        <div className="card p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center"><ClockIcon className="w-6 h-6 text-amber-600" /></div><div><div className="text-sm text-gray-500">التوقيت</div><div className="font-medium">{session.start_time ? formatTime(session.start_time) : 'لم يبدأ'}</div>{session.end_time && (<div className="text-sm text-gray-400">انتهى: {formatTime(session.end_time)}</div>)}</div></div></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 bg-blue-50"><div className="text-blue-600 text-sm font-medium">قيمة التحميل</div><div className="text-xl font-bold text-blue-700">{formatCurrency(session.total_loaded_value)}</div></div>
        <div className="card p-4 bg-green-50"><div className="text-green-600 text-sm font-medium">المبيعات</div><div className="text-xl font-bold text-green-700">{formatCurrency(session.total_sales)}</div></div>
        <div className="card p-4 bg-emerald-50"><div className="text-emerald-600 text-sm font-medium">المحصل</div><div className="text-xl font-bold text-emerald-700">{formatCurrency(session.total_collected)}</div></div>
        <div className="card p-4 bg-red-50"><div className="text-red-600 text-sm font-medium">الآجل</div><div className="text-xl font-bold text-red-700">{formatCurrency(session.total_credit)}</div></div>
        <div className="card p-4 bg-gray-50"><div className="text-gray-600 text-sm font-medium">قيمة المرتجع</div><div className="text-xl font-bold text-gray-700">{formatCurrency(session.total_returned_value)}</div></div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b">
          {(['products', 'sales', 'returns'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-medium ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab === 'products' ? `المنتجات (${session.items?.length || 0})` : tab === 'sales' ? `المبيعات (${session.sales?.length || 0})` : `المرتجعات (${session.returns?.length || 0})`}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gray-50"><th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المنتج</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">محمّل</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">مباع</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">مرتجع</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">متبقي</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {session.items?.map(item => {
                    const ppp = item.product?.pieces_per_package || 1;
                    const remaining = item.quantity_loaded - item.quantity_sold - item.quantity_returned;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="font-medium">{item.product?.name}</div><div className="text-sm text-gray-500">{item.product?.sku}</div></td>
                        <td className="px-4 py-3 text-center">{formatQty(item.quantity_loaded, ppp)}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-medium">{formatQty(item.quantity_sold, ppp)}</td>
                        <td className="px-4 py-3 text-center text-orange-600">{formatQty(item.quantity_returned, ppp)}</td>
                        <td className="px-4 py-3 text-center"><span className={remaining > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}>{formatQty(remaining, ppp)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'sales' && (
            <div className="overflow-x-auto">
              {session.sales && session.sales.length > 0 ? (
                <table className="w-full">
                  <thead><tr className="bg-gray-50"><th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المرجع</th><th className="px-4 py-3 text-right text-sm font-medium text-gray-600">العميل</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الوقت</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">المجموع</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">المدفوع</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الحالة</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {session.sales.map(sale => {
                      const paymentBadge = getPaymentBadge(sale.payment_status);
                      return (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{sale.reference}</td>
                          <td className="px-4 py-3">{sale.client?.name || 'عميل نقدي'}</td>
                          <td className="px-4 py-3 text-center text-sm">{formatDateTime(sale.sale_time)}</td>
                          <td className="px-4 py-3 text-center font-medium">{formatCurrency(sale.grand_total)}</td>
                          <td className="px-4 py-3 text-center text-green-600">{formatCurrency(sale.paid_amount)}</td>
                          <td className="px-4 py-3 text-center"><span className={`badge ${paymentBadge.class}`}>{paymentBadge.text}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (<div className="text-center py-8 text-gray-500">لا توجد مبيعات بعد</div>)}
            </div>
          )}
          {activeTab === 'returns' && (
            <div className="overflow-x-auto">
              {session.returns && session.returns.length > 0 ? (
                <table className="w-full">
                  <thead><tr className="bg-gray-50"><th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المنتج</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الكمية</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">السبب</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">قابل للإرجاع</th><th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الحالة</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {session.returns.map(ret => (
                      <tr key={ret.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{ret.product?.name}</td>
                        <td className="px-4 py-3 text-center">{formatQty(ret.quantity, ret.product?.pieces_per_package)}</td>
                        <td className="px-4 py-3 text-center">{getReasonLabel(ret.reason)}</td>
                        <td className="px-4 py-3 text-center">{ret.returnable_to_stock ? <span className="text-green-600">نعم</span> : <span className="text-red-600">لا (خسارة)</span>}</td>
                        <td className="px-4 py-3 text-center">{ret.processed ? <span className="badge badge-success">تمت المعالجة</span> : <span className="badge badge-warning">معلق</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (<div className="text-center py-8 text-gray-500">لا توجد مرتجعات</div>)}
            </div>
          )}
        </div>
      </div>

      {session.notes && (<div className="card p-4"><h3 className="font-medium mb-2">ملاحظات</h3><p className="text-gray-600">{session.notes}</p></div>)}
    </div>
  );
}
