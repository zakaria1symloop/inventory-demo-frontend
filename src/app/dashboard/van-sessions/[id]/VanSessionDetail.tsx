'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { vanSessionsApi, caissesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { VanSession, VanSale, VanReturn, Caisse } from '@/lib/types';

const roundQty = (v: number) => Math.round(v * 100) / 100;

const statusLabels: Record<string, { class: string; text: string; color: string }> = {
  preparing: { class: 'badge-warning', text: 'في الانتظار', color: 'yellow' },
  active: { class: 'badge-success', text: 'نشطة', color: 'green' },
  completed: { class: 'badge-info', text: 'مكتملة', color: 'blue' },
  cancelled: { class: 'badge-danger', text: 'ملغية', color: 'red' },
};

const paymentStatusLabels: Record<string, { class: string; text: string }> = {
  paid: { class: 'badge-success', text: 'مدفوع' },
  partial: { class: 'badge-warning', text: 'جزئي' },
  unpaid: { class: 'badge-danger', text: 'غير مدفوع' },
};

const returnReasonLabels: Record<string, string> = {
  unsold: 'غير مباع',
  damaged: 'تالف',
  expired: 'منتهي الصلاحية',
  other: 'أخرى',
};

export default function VanSessionDetail() {
  const params = useParams();
  const [id, setId] = useState<string | null>(null);

  const [session, setSession] = useState<VanSession | null>(null);
  const [sales, setSales] = useState<VanSale[]>([]);
  const [returns, setReturns] = useState<VanReturn[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'sales' | 'returns'>('overview');
  const [expandedSale, setExpandedSale] = useState<number | null>(null);

  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  // Settlement state
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [driverCaisse, setDriverCaisse] = useState<Caisse | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  // Extract ID from URL for static export compatibility
  useEffect(() => {
    const paramId = params.id as string;
    if (paramId && paramId !== '_') {
      setId(paramId);
    } else if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const urlId = pathParts[pathParts.length - 1];
      if (urlId && urlId !== '_') {
        setId(urlId);
      }
    }
  }, [params.id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    const numId = parseInt(id);
    try {
      const [sessionRes, salesRes] = await Promise.all([
        vanSessionsApi.getOne(numId),
        vanSessionsApi.getSales(numId),
      ]);
      const sessionData = sessionRes.data.data || sessionRes.data;
      const salesData = salesRes.data.data || salesRes.data;
      setSession(sessionData);
      setSales(Array.isArray(salesData) ? salesData : []);
      setReturns(sessionData.returns || []);

      if (sessionData.status === 'active' || sessionData.status === 'completed') {
        try {
          const statsRes = await vanSessionsApi.getStats(numId);
          setStats(statsRes.data.data || statsRes.data);
        } catch { /* stats optional */ }
      }
    } catch {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    setIsActioning(true);
    try {
      await vanSessionsApi.start(parseInt(id));
      toast.success('تم بدء الجلسة - تم خصم المخزون من المستودع');
      setShowStartConfirm(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: string) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || 'خطأ في بدء الجلسة');
      }
    } finally {
      setIsActioning(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setIsActioning(true);
    try {
      await vanSessionsApi.complete(parseInt(id));
      toast.success('تم إكمال الجلسة - تم إرجاع المخزون غير المباع');
      setShowCompleteConfirm(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في إكمال الجلسة');
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setIsActioning(true);
    try {
      await vanSessionsApi.cancel(parseInt(id));
      toast.success('تم إلغاء الجلسة');
      setShowCancelConfirm(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في إلغاء الجلسة');
    } finally {
      setIsActioning(false);
    }
  };

  const openSettleDialog = async () => {
    try {
      const res = await caissesApi.getAll({ is_active: true });
      const caisses = res.data.data || res.data;
      const found = (Array.isArray(caisses) ? caisses : []).find(
        (c: Caisse) => c.user_id === session?.livreur_id
      );
      if (!found) {
        toast.error('لا يوجد صندوق لهذا السائق');
        return;
      }
      setDriverCaisse(found);
      setSettleAmount(String(found.balance));
      setSettleNotes('');
      setShowSettleDialog(true);
    } catch {
      toast.error('خطأ في جلب بيانات الصندوق');
    }
  };

  const handleSettle = async () => {
    if (!driverCaisse) return;
    const amount = parseFloat(settleAmount);
    if (!amount || amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (amount > driverCaisse.balance) {
      toast.error('المبلغ أكبر من الرصيد الحالي');
      return;
    }
    setIsSettling(true);
    try {
      await caissesApi.settle(driverCaisse.id, {
        amount,
        type: 'admin_collect',
        notes: settleNotes || `تحصيل من جلسة ${session?.reference || session?.id}`,
      });
      toast.success(`تم تحصيل ${amount.toLocaleString()} د.ج بنجاح`);
      setShowSettleDialog(false);
      setDriverCaisse(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'خطأ في التحصيل');
    } finally {
      setIsSettling(false);
    }
  };

  const formatDateTime = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-DZ', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatTime = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);

  const formatPercent = (value: number) => `${Math.round(value)}%`;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  if (!session) {
    return <div className="text-center py-12 text-gray-500">الجلسة غير موجودة</div>;
  }

  const badge = statusLabels[session.status] || { class: 'badge-secondary', text: session.status, color: 'gray' };
  const items = session.items || [];
  const totalLoadedQty = roundQty(items.reduce((s, i) => s + i.quantity_loaded, 0));
  const totalSoldQty = roundQty(items.reduce((s, i) => s + i.quantity_sold, 0));
  const totalReturnedQty = roundQty(items.reduce((s, i) => s + i.quantity_returned, 0));
  const totalAvailableQty = roundQty(items.reduce((s, i) => s + (i.quantity_loaded - i.quantity_sold - i.quantity_returned), 0));
  const loadedValue = session.total_loaded_value || items.reduce((s, i) => s + (i.quantity_loaded * i.unit_cost), 0);
  const soldValue = session.total_sales || 0;
  const collectedValue = session.total_collected || 0;
  const creditValue = session.total_credit || 0;
  const sellThrough = totalLoadedQty > 0 ? (totalSoldQty / totalLoadedQty) * 100 : 0;
  const collectionRate = soldValue > 0 ? (collectedValue / soldValue) * 100 : 0;

  // Duration calculation
  const getDuration = () => {
    if (!session.started_at) return null;
    const start = new Date(session.started_at);
    const end = session.completed_at ? new Date(session.completed_at) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0) return `${hours} ساعة ${mins > 0 ? `و ${mins} دقيقة` : ''}`;
    return `${mins} دقيقة`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard/van-sessions" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {session.reference || `جلسة #${session.id}`}
            </h1>
            <span className={`badge ${badge.class} text-sm`}>{badge.text}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400 mr-9">
            <span>{new Date(session.date).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
            {session.started_at && <span>بدأت: {formatTime(session.started_at)}</span>}
            {session.completed_at && <span>انتهت: {formatTime(session.completed_at)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {session.status === 'preparing' && (
            <Link href={`/dashboard/van-sessions/${id}/edit`} className="btn btn-secondary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              تعديل
            </Link>
          )}
          {session.status === 'preparing' && (
            <button onClick={() => setShowStartConfirm(true)} className="btn btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              استلام البضاعة
            </button>
          )}
          {session.status === 'active' && (
            <button onClick={() => setShowCompleteConfirm(true)} className="btn bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              إنهاء الجلسة
            </button>
          )}
          {(session.status === 'preparing' || session.status === 'active') && (
            <button onClick={() => setShowCancelConfirm(true)} className="btn btn-danger flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              إلغاء
            </button>
          )}
          {(session.status === 'active' || session.status === 'completed') && (
            <button onClick={openSettleDialog} className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              تحصيل الصندوق
            </button>
          )}
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="card flex items-center gap-3 !p-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">السائق</div>
            <div className="font-bold text-sm dark:text-white truncate">{session.livreur?.name || '-'}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3 !p-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">المستودع</div>
            <div className="font-bold text-sm dark:text-white truncate">{session.warehouse?.name || '-'}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3 !p-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">المركبة</div>
            <div className="font-bold text-sm dark:text-white truncate">{session.vehicle?.name || 'بدون مركبة'}</div>
          </div>
        </div>

        <div className="card flex items-center gap-3 !p-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">عدد المنتجات</div>
            <div className="font-bold text-sm dark:text-white">{items.length} منتج</div>
          </div>
        </div>

        <div className="card flex items-center gap-3 !p-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">عدد الفواتير</div>
            <div className="font-bold text-sm dark:text-white">{session.sales_count || sales.length}</div>
          </div>
        </div>

        {getDuration() && (
          <div className="card flex items-center gap-3 !p-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400">المدة</div>
              <div className="font-bold text-sm dark:text-white truncate">{getDuration()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      {(session.status !== 'preparing') && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 !p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">قيمة التحميل</div>
                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(loadedValue)}</div>
              </div>
              <div className="text-3xl opacity-20">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="text-xs text-blue-500 dark:text-blue-400 mt-2">{totalLoadedQty} وحدة محملة</div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 !p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-green-600 dark:text-green-400 mb-1">إجمالي المبيعات</div>
                <div className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(soldValue)}</div>
              </div>
              <div className="text-3xl opacity-20">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
            </div>
            <div className="text-xs text-green-500 dark:text-green-400 mt-2">
              {totalSoldQty} وحدة مباعة ({formatPercent(sellThrough)} من التحميل)
            </div>
          </div>

          <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-800 !p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">المحصل نقداً</div>
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(collectedValue)}</div>
              </div>
              <div className="text-3xl opacity-20">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-xs text-emerald-500 dark:text-emerald-400 mt-2">
              نسبة التحصيل: {formatPercent(collectionRate)}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 !p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-red-600 dark:text-red-400 mb-1">الآجل (دين)</div>
                <div className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(creditValue)}</div>
              </div>
              <div className="text-3xl opacity-20">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
            </div>
            <div className="text-xs text-red-500 dark:text-red-400 mt-2">
              {sales.filter(s => s.payment_status !== 'paid').length} فاتورة غير مدفوعة بالكامل
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 !p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-orange-600 dark:text-orange-400 mb-1">المرتجعات</div>
                <div className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(session.total_returned_value || 0)}</div>
              </div>
              <div className="text-3xl opacity-20">
                <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </div>
            </div>
            <div className="text-xs text-orange-500 dark:text-orange-400 mt-2">
              {totalReturnedQty} وحدة مرتجعة
            </div>
          </div>
        </div>
      )}

      {/* Progress Bars (active/completed only) */}
      {(session.status === 'active' || session.status === 'completed') && totalLoadedQty > 0 && (
        <div className="card mb-6 !p-4">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">نسب الأداء</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sell-through rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">نسبة البيع</span>
                <span className="font-bold text-green-600 dark:text-green-400">{formatPercent(sellThrough)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(sellThrough, 100)}%` }} />
              </div>
              <div className="text-xs text-gray-400 mt-1">{totalSoldQty} / {totalLoadedQty} وحدة</div>
            </div>
            {/* Collection rate */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">نسبة التحصيل</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPercent(collectionRate)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
              </div>
              <div className="text-xs text-gray-400 mt-1">{formatCurrency(collectedValue)} / {formatCurrency(soldValue)}</div>
            </div>
            {/* Available stock */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">المخزون المتبقي</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{totalLoadedQty > 0 ? formatPercent((totalAvailableQty / totalLoadedQty) * 100) : '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${totalLoadedQty > 0 ? Math.min((totalAvailableQty / totalLoadedQty) * 100, 100) : 0}%` }} />
              </div>
              <div className="text-xs text-gray-400 mt-1">{totalAvailableQty} وحدة متبقية</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b dark:border-gray-700 mb-4 overflow-x-auto">
        {[
          { key: 'overview' as const, label: 'نظرة عامة', count: null },
          { key: 'items' as const, label: 'المنتجات', count: items.length },
          { key: 'sales' as const, label: 'المبيعات', count: sales.length },
          { key: 'returns' as const, label: 'المرتجعات', count: returns.length || (session.status === 'active' ? items.filter(i => roundQty(i.quantity_loaded - i.quantity_sold) > 0).length : 0) },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`mr-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Timeline */}
          <div className="card">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">المسار الزمني</h3>
            <div className="relative">
              <div className="absolute top-0 bottom-0 right-4 w-0.5 bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-6">
                {/* Created */}
                <div className="relative flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center z-10 flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-sm dark:text-white">تم إنشاء الجلسة</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(session.created_at)}</div>
                  </div>
                </div>

                {/* Started */}
                <div className="relative flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 border-2 ${
                    session.started_at
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}>
                    <svg className={`w-4 h-4 ${session.started_at ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                  </div>
                  <div>
                    <div className={`font-medium text-sm ${session.started_at ? 'dark:text-white' : 'text-gray-400'}`}>
                      استلام البضاعة وبدء البيع
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {session.started_at ? formatDateTime(session.started_at) : 'في انتظار الاستلام...'}
                    </div>
                  </div>
                </div>

                {/* Sales Activity */}
                {sales.length > 0 && (
                  <div className="relative flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 flex items-center justify-center z-10 flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-sm dark:text-white">{sales.length} عملية بيع</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        إجمالي {formatCurrency(soldValue)} - محصل {formatCurrency(collectedValue)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Completed */}
                <div className="relative flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 border-2 ${
                    session.status === 'completed'
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500'
                      : session.status === 'cancelled'
                        ? 'bg-red-100 dark:bg-red-900/30 border-red-500'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}>
                    {session.status === 'cancelled' ? (
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <svg className={`w-4 h-4 ${session.status === 'completed' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className={`font-medium text-sm ${(session.status === 'completed' || session.status === 'cancelled') ? 'dark:text-white' : 'text-gray-400'}`}>
                      {session.status === 'cancelled' ? 'تم إلغاء الجلسة' : 'إنهاء الجلسة وإرجاع المتبقي'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {session.completed_at ? formatDateTime(session.completed_at) : session.status === 'cancelled' ? 'تم الإلغاء' : 'لم تنته بعد...'}
                    </div>
                    {getDuration() && session.status === 'completed' && (
                      <div className="text-xs text-blue-500 mt-0.5">المدة الإجمالية: {getDuration()}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Products (if available) */}
          {items.length > 0 && (session.status === 'active' || session.status === 'completed') && (
            <div className="card">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">أداء المنتجات</h3>
              <div className="space-y-3">
                {[...items]
                  .sort((a, b) => b.quantity_sold - a.quantity_sold)
                  .slice(0, 8)
                  .map(item => {
                    const pct = item.quantity_loaded > 0 ? (item.quantity_sold / item.quantity_loaded) * 100 : 0;
                    return (
                      <div key={item.id}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium dark:text-white truncate ml-4">{item.product?.name || `منتج #${item.product_id}`}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {item.quantity_sold} / {item.quantity_loaded}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : pct > 0 ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Notes */}
          {session.notes && (
            <div className="card">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ملاحظات</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap">{session.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && (
        <div className="card">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p>لا توجد منتجات في هذه الجلسة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>المنتج</th>
                    <th>الكمية المحملة</th>
                    <th>المباع</th>
                    <th>المرتجع</th>
                    <th>المتوفر</th>
                    <th>سعر التكلفة</th>
                    <th>قيمة التحميل</th>
                    {(session.status === 'active' || session.status === 'completed') && <th>نسبة البيع</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const available = roundQty(item.quantity_loaded - item.quantity_sold - item.quantity_returned);
                    const pct = item.quantity_loaded > 0 ? (item.quantity_sold / item.quantity_loaded) * 100 : 0;
                    return (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td className="font-medium dark:text-white">{item.product?.name || `منتج #${item.product_id}`}</td>
                        <td className="font-medium">{roundQty(item.quantity_loaded)}</td>
                        <td className="text-green-600 dark:text-green-400 font-medium">{roundQty(item.quantity_sold)}</td>
                        <td className="text-orange-600 dark:text-orange-400">{roundQty(item.quantity_returned)}</td>
                        <td className={`font-bold ${available > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                          {available}
                        </td>
                        <td className="text-gray-500 dark:text-gray-400">{formatCurrency(item.unit_cost)}</td>
                        <td className="font-medium dark:text-white">{formatCurrency(item.quantity_loaded * item.unit_cost)}</td>
                        {(session.status === 'active' || session.status === 'completed') && (
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{Math.round(pct)}%</span>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td colSpan={2} className="text-left dark:text-white">الإجمالي</td>
                    <td>{totalLoadedQty}</td>
                    <td className="text-green-600 dark:text-green-400">{totalSoldQty}</td>
                    <td className="text-orange-600 dark:text-orange-400">{totalReturnedQty}</td>
                    <td className="text-blue-600 dark:text-blue-400">{totalAvailableQty}</td>
                    <td></td>
                    <td className="dark:text-white">{formatCurrency(loadedValue)}</td>
                    {(session.status === 'active' || session.status === 'completed') && (
                      <td className="text-sm text-gray-500">{formatPercent(sellThrough)}</td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div>
          {sales.length === 0 ? (
            <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
              <p>لا توجد مبيعات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale, idx) => {
                const payBadge = paymentStatusLabels[sale.payment_status] || { class: 'badge-secondary', text: sale.payment_status };
                const isExpanded = expandedSale === sale.id;
                return (
                  <div key={sale.id} className="card !p-0 overflow-hidden">
                    {/* Sale Header - Clickable */}
                    <button
                      onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-right"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-500 dark:text-gray-400">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm dark:text-white">
                              {sale.client?.name || 'بيع نقدي'}
                            </span>
                            {sale.reference && (
                              <span className="text-xs text-gray-400">({sale.reference})</span>
                            )}
                            <span className={`badge ${payBadge.class} text-xs`}>{payBadge.text}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {formatDateTime(sale.sale_time || sale.created_at)}
                            {sale.latitude && sale.longitude && (
                              <span className="mr-2 text-blue-500">
                                <svg className="w-3 h-3 inline ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                موقع GPS
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-left">
                          <div className="font-bold text-sm dark:text-white">{formatCurrency(sale.grand_total)}</div>
                          {sale.due_amount > 0 && (
                            <div className="text-xs text-red-500">متبقي: {formatCurrency(sale.due_amount)}</div>
                          )}
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded Sale Details */}
                    {isExpanded && (
                      <div className="border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        {/* Sale Info */}
                        <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-b dark:border-gray-700">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">المبلغ الإجمالي</span>
                            <div className="font-bold dark:text-white">{formatCurrency(sale.total_amount)}</div>
                          </div>
                          {sale.discount > 0 && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 text-xs">الخصم</span>
                              <div className="font-bold text-orange-600">{formatCurrency(sale.discount)}</div>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">المدفوع</span>
                            <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.paid_amount)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400 text-xs">المتبقي</span>
                            <div className={`font-bold ${sale.due_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                              {formatCurrency(sale.due_amount)}
                            </div>
                          </div>
                        </div>

                        {/* Sale Items */}
                        {sale.items && sale.items.length > 0 && (
                          <div className="px-4 py-3">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-500 dark:text-gray-400">
                                  <th className="text-right pb-2 font-medium">المنتج</th>
                                  <th className="text-center pb-2 font-medium">الكمية</th>
                                  <th className="text-center pb-2 font-medium">السعر</th>
                                  {sale.items.some(si => si.discount > 0) && <th className="text-center pb-2 font-medium">الخصم</th>}
                                  <th className="text-left pb-2 font-medium">المجموع</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sale.items.map(si => (
                                  <tr key={si.id} className="border-t dark:border-gray-700">
                                    <td className="py-2 font-medium dark:text-white">{si.product?.name || `منتج #${si.product_id}`}</td>
                                    <td className="py-2 text-center">{si.quantity}</td>
                                    <td className="py-2 text-center text-gray-500 dark:text-gray-400">{formatCurrency(si.unit_price)}</td>
                                    {sale.items!.some(si2 => si2.discount > 0) && (
                                      <td className="py-2 text-center text-orange-500">{si.discount > 0 ? formatCurrency(si.discount) : '-'}</td>
                                    )}
                                    <td className="py-2 text-left font-medium dark:text-white">{formatCurrency(si.subtotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Sale Notes & GPS */}
                        {(sale.notes || (sale.latitude && sale.longitude)) && (
                          <div className="px-4 py-3 border-t dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                            {sale.notes && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">ملاحظة:</span> {sale.notes}
                              </span>
                            )}
                            {sale.latitude && sale.longitude && (
                              <a
                                href={`https://www.google.com/maps?q=${sale.latitude},${sale.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                عرض على الخريطة
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Sales Totals */}
              <div className="card bg-gray-50 dark:bg-gray-800/50 !p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">عدد الفواتير</div>
                    <div className="text-lg font-bold dark:text-white">{sales.length}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">إجمالي المبيعات</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(sales.reduce((s, sale) => s + sale.grand_total, 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">إجمالي المحصل</div>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(sales.reduce((s, sale) => s + sale.paid_amount, 0))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">إجمالي الآجل</div>
                    <div className="text-lg font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(sales.reduce((s, sale) => s + sale.due_amount, 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Returns Tab */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          {/* Active session: show unsold products preview */}
          {session.status === 'active' && items.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">المنتجات غير المباعة (معاينة)</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">هذه الكميات سيتم إرجاعها تلقائياً عند إنهاء الجلسة</p>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-600 dark:text-blue-400">محمل</div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{totalLoadedQty}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                  <div className="text-xs text-green-600 dark:text-green-400">مباع</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">{totalSoldQty}</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                  <div className="text-xs text-orange-600 dark:text-orange-400">سيتم إرجاعه</div>
                  <div className="text-lg font-bold text-orange-700 dark:text-orange-300">{totalAvailableQty}</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                  <div className="text-xs text-purple-600 dark:text-purple-400">نسبة البيع</div>
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatPercent(sellThrough)}</div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>المنتج</th>
                      <th>الكمية المحملة</th>
                      <th>المباع</th>
                      <th>سيتم إرجاعه</th>
                      <th>نسبة البيع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const unsold = roundQty(item.quantity_loaded - item.quantity_sold);
                      const pct = item.quantity_loaded > 0 ? (item.quantity_sold / item.quantity_loaded) * 100 : 0;
                      return (
                        <tr key={item.id} className={unsold > 0 ? '' : 'opacity-50'}>
                          <td>{idx + 1}</td>
                          <td className="font-medium dark:text-white">{item.product?.name || `منتج #${item.product_id}`}</td>
                          <td>{roundQty(item.quantity_loaded)}</td>
                          <td className="text-green-600 dark:text-green-400 font-medium">{roundQty(item.quantity_sold)}</td>
                          <td className={`font-bold ${unsold > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
                            {unsold}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{Math.round(pct)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td colSpan={2} className="text-left dark:text-white">الإجمالي</td>
                      <td>{totalLoadedQty}</td>
                      <td className="text-green-600 dark:text-green-400">{totalSoldQty}</td>
                      <td className="text-orange-600 dark:text-orange-400">{totalAvailableQty}</td>
                      <td className="text-sm text-gray-500">{formatPercent(sellThrough)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Completed/actual returns */}
          <div className="card">
            {session.status === 'completed' && (
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">المرتجعات المسجلة</h3>
            )}
            {returns.length === 0 && session.status !== 'active' ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                <p>لا توجد مرتجعات مسجلة</p>
              </div>
            ) : returns.length > 0 ? (
              <>
                {/* Returns Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">إجمالي المرتجعات</div>
                    <div className="text-lg font-bold dark:text-white">{roundQty(returns.reduce((s, r) => s + r.quantity, 0))} وحدة</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">غير مباع</div>
                    <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                      {roundQty(returns.filter(r => r.reason === 'unsold').reduce((s, r) => s + r.quantity, 0))}
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                    <div className="text-xs text-red-600 dark:text-red-400">تالف / منتهي</div>
                    <div className="text-lg font-bold text-red-700 dark:text-red-300">
                      {roundQty(returns.filter(r => r.reason === 'damaged' || r.reason === 'expired').reduce((s, r) => s + r.quantity, 0))}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                    <div className="text-xs text-green-600 dark:text-green-400">قابل للإرجاع للمخزون</div>
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">
                      {roundQty(returns.filter(r => r.returnable_to_stock).reduce((s, r) => s + r.quantity, 0))}
                    </div>
                  </div>
                </div>

                {/* Returns Table */}
                <div className="overflow-x-auto">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>السبب</th>
                        <th>قابل للإرجاع</th>
                        <th>الحالة</th>
                        <th>ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returns.map((ret, idx) => (
                        <tr key={ret.id}>
                          <td>{idx + 1}</td>
                          <td className="font-medium dark:text-white">{ret.product?.name || `منتج #${ret.product_id}`}</td>
                          <td className="font-bold">{roundQty(ret.quantity)}</td>
                          <td>
                            <span className={`badge text-xs ${
                              ret.reason === 'unsold' ? 'badge-warning' :
                              ret.reason === 'damaged' ? 'badge-danger' :
                              ret.reason === 'expired' ? 'badge-danger' : 'badge-secondary'
                            }`}>
                              {returnReasonLabels[ret.reason] || ret.reason}
                            </span>
                          </td>
                          <td>
                            {ret.returnable_to_stock ? (
                              <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                نعم
                              </span>
                            ) : (
                              <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                لا
                              </span>
                            )}
                          </td>
                          <td>
                            {ret.processed ? (
                              <span className="badge badge-success text-xs">تمت المعالجة</span>
                            ) : (
                              <span className="badge badge-warning text-xs">في الانتظار</span>
                            )}
                          </td>
                          <td className="text-sm text-gray-500 dark:text-gray-400">{ret.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showStartConfirm}
        onClose={() => setShowStartConfirm(false)}
        onConfirm={handleStart}
        title="استلام البضاعة"
        message="سيتم خصم الكميات المحملة من مخزون المستودع وبدء الجلسة. هل أنت متأكد من استلام البضاعة؟"
        confirmText="استلام وبدء"
        isLoading={isActioning}
        variant="info"
      />

      <ConfirmDialog
        isOpen={showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(false)}
        onConfirm={handleComplete}
        title="إنهاء الجلسة"
        message="سيتم إرجاع جميع الكميات غير المباعة إلى المستودع وإغلاق الجلسة نهائياً. هل أنت متأكد من إنهاء الجلسة؟"
        confirmText="إنهاء الجلسة"
        isLoading={isActioning}
        variant="warning"
      />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="إلغاء الجلسة"
        message="سيتم إلغاء الجلسة وإرجاع جميع المنتجات إلى المستودع. هذا الإجراء لا يمكن التراجع عنه."
        confirmText="إلغاء الجلسة"
        isLoading={isActioning}
      />

      {/* Settlement Dialog */}
      {showSettleDialog && driverCaisse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full" dir="rtl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white">تحصيل من صندوق السائق</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{session.livreur?.name}</p>
                </div>
              </div>

              {/* Caisse Info */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-4 mb-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">الرصيد الحالي</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(driverCaisse.balance)}</span>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المبلغ المراد تحصيله</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    className="input w-full text-lg font-bold"
                    placeholder="0.00"
                    min="0.01"
                    max={driverCaisse.balance}
                    step="0.01"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">د.ج</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSettleAmount(String(driverCaisse.balance))}
                    className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                  >
                    كامل الرصيد
                  </button>
                  {collectedValue > 0 && (
                    <button
                      type="button"
                      onClick={() => setSettleAmount(String(collectedValue))}
                      className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      المحصل نقداً ({formatCurrency(collectedValue)})
                    </button>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ملاحظات (اختياري)</label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="input w-full"
                  placeholder={`تحصيل من جلسة ${session.reference || session.id}`}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSettle}
                  disabled={isSettling || !settleAmount || parseFloat(settleAmount) <= 0}
                  className="btn bg-emerald-600 hover:bg-emerald-700 text-white flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSettling ? (
                    <div className="spinner w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  تحصيل {settleAmount ? formatCurrency(parseFloat(settleAmount) || 0) : ''}
                </button>
                <button
                  onClick={() => { setShowSettleDialog(false); setDriverCaisse(null); }}
                  className="btn btn-secondary"
                  disabled={isSettling}
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
