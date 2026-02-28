'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { deliveriesApi, ordersApi, usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Delivery {
  id: number;
  reference: string;
  livreur_id: number;
  vehicle_id?: number;
  date: string;
  start_time?: string;
  end_time?: string;
  status: 'preparing' | 'in_progress' | 'completed' | 'cancelled';
  total_orders: number;
  delivered_count: number;
  failed_count: number;
  total_amount?: number;
  collected_amount?: number;
  notes?: string;
  livreur?: { id: number; name: string };
  vehicle?: { id: number; name: string };
  created_at?: string;
}

interface Order {
  id: number;
  reference: string;
  client_id: number;
  grand_total: number;
  status: string;
  client?: { id: number; name: string; address?: string; phone?: string };
}

interface Livreur {
  id: number;
  name: string;
}

export default function DeliveriesPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [livreurFilter, setLivreurFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        router.push('/dashboard/deliveries/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const fetchData = async () => {
    try {
      const [deliveriesRes, ordersRes, livreursRes] = await Promise.all([
        deliveriesApi.getAll(),
        ordersApi.getUnassigned(),
        usersApi.getLivreurs(),
      ]);
      setDeliveries(deliveriesRes.data.data || deliveriesRes.data);
      setConfirmedOrders(ordersRes.data || []);
      setLivreurs(livreursRes.data || []);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('ar-DZ');

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      preparing: { class: 'badge-warning', text: 'قيد التحضير' },
      in_progress: { class: 'badge-info', text: 'جاري التوصيل' },
      completed: { class: 'badge-success', text: 'مكتمل' },
      cancelled: { class: 'badge-danger', text: 'ملغي' },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      // Status filter
      if (statusFilter && d.status !== statusFilter) return false;

      // Livreur filter
      if (livreurFilter && d.livreur_id !== parseInt(livreurFilter)) return false;

      // Date from filter
      if (dateFrom && new Date(d.date) < new Date(dateFrom)) return false;

      // Date to filter
      if (dateTo && new Date(d.date) > new Date(dateTo)) return false;

      // Search query (reference or livreur name)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesRef = d.reference?.toLowerCase().includes(query);
        const matchesLivreur = d.livreur?.name?.toLowerCase().includes(query);
        if (!matchesRef && !matchesLivreur) return false;
      }

      return true;
    });
  }, [deliveries, statusFilter, livreurFilter, dateFrom, dateTo, searchQuery]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = deliveries.filter(d => d.date === today);

    const totalOrders = filteredDeliveries.reduce((sum, d) => sum + d.total_orders, 0);
    const deliveredOrders = filteredDeliveries.reduce((sum, d) => sum + d.delivered_count, 0);
    const failedOrders = filteredDeliveries.reduce((sum, d) => sum + d.failed_count, 0);
    const pendingOrders = totalOrders - deliveredOrders - failedOrders;

    const successRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0';

    const totalAmount = filteredDeliveries.reduce((sum, d) => sum + (d.total_amount || 0), 0);
    const collectedAmount = filteredDeliveries.reduce((sum, d) => sum + (d.collected_amount || 0), 0);

    return {
      totalDeliveries: filteredDeliveries.length,
      preparingCount: filteredDeliveries.filter(d => d.status === 'preparing').length,
      inProgressCount: filteredDeliveries.filter(d => d.status === 'in_progress').length,
      completedCount: filteredDeliveries.filter(d => d.status === 'completed').length,
      cancelledCount: filteredDeliveries.filter(d => d.status === 'cancelled').length,
      todayDeliveries: todayDeliveries.length,
      todayInProgress: todayDeliveries.filter(d => d.status === 'in_progress').length,
      totalOrders,
      deliveredOrders,
      failedOrders,
      pendingOrders,
      successRate,
      totalAmount,
      collectedAmount,
      unassignedOrders: confirmedOrders.length,
    };
  }, [filteredDeliveries, deliveries, confirmedOrders]);

  const clearFilters = () => {
    setStatusFilter('');
    setLivreurFilter('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  const [startingId, setStartingId] = useState<number | null>(null);

  const handleStartDelivery = async (id: number) => {
    if (!confirm('هل تريد بدء هذه التوصيلة؟ سيتم خصم المنتجات من المستودع.')) return;
    setStartingId(id);
    try {
      await deliveriesApi.start(id);
      toast.success('تم بدء التوصيلة بنجاح');
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'خطأ في بدء التوصيلة';
      toast.error(message);
    } finally {
      setStartingId(null);
    }
  };

  const hasActiveFilters = statusFilter || livreurFilter || dateFrom || dateTo || searchQuery;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> إضافة جديد</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة التوصيل</h1>
          <p className="text-gray-500 mt-1">متابعة وإدارة عمليات التوصيل</p>
        </div>
        <Link href="/dashboard/deliveries/new" className="btn btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          إنشاء توصيل جديد
          <kbd className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs mr-1">Insert</kbd>
        </Link>
      </div>

      {/* KPIs Row 1 - Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-600 text-sm font-medium">إجمالي التوصيلات</div>
              <div className="text-3xl font-bold text-blue-700">{kpis.totalDeliveries}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 text-sm font-medium">نسبة النجاح</div>
              <div className="text-3xl font-bold text-green-700">{kpis.successRate}%</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-600 text-sm font-medium">إجمالي الطلبات</div>
              <div className="text-3xl font-bold text-purple-700">{kpis.totalOrders}</div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-emerald-50 border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-emerald-600 text-sm font-medium">تم التسليم</div>
              <div className="text-3xl font-bold text-emerald-700">{kpis.deliveredOrders}</div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-red-600 text-sm font-medium">فشل/مرجع</div>
              <div className="text-3xl font-bold text-red-700">{kpis.failedOrders}</div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-orange-50 border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-600 text-sm font-medium">طلبات جاهزة</div>
              <div className="text-3xl font-bold text-orange-700">{kpis.unassignedOrders}</div>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Row 2 - Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card bg-yellow-50 border border-yellow-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'preparing' ? '' : 'preparing')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-yellow-600 text-sm">قيد التحضير</div>
              <div className="text-2xl font-bold text-yellow-700">{kpis.preparingCount}</div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'in_progress' ? '' : 'in_progress')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-600 text-sm">جاري التوصيل</div>
              <div className="text-2xl font-bold text-blue-700">{kpis.inProgressCount}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'completed' ? '' : 'completed')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 text-sm">مكتمل</div>
              <div className="text-2xl font-bold text-green-700">{kpis.completedCount}</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border border-red-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'cancelled' ? '' : 'cancelled')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-red-600 text-sm">ملغي</div>
              <div className="text-2xl font-bold text-red-700">{kpis.cancelledCount}</div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-indigo-50 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-indigo-600 text-sm">توصيلات اليوم</div>
              <div className="text-2xl font-bold text-indigo-700">{kpis.todayDeliveries}</div>
              <div className="text-xs text-indigo-500">{kpis.todayInProgress} نشط</div>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            الفلاتر
          </h3>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              مسح الفلاتر
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="رقم المرجع أو اسم السائق..."
              className="input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select">
              <option value="">كل الحالات</option>
              <option value="preparing">قيد التحضير</option>
              <option value="in_progress">جاري التوصيل</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {/* Livreur Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">السائق</label>
            <select value={livreurFilter} onChange={(e) => setLivreurFilter(e.target.value)} className="select">
              <option value="">كل السائقين</option>
              {livreurs.map(livreur => (
                <option key={livreur.id} value={livreur.id}>{livreur.name}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">قائمة التوصيلات ({filteredDeliveries.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>المرجع</th>
                <th>السائق</th>
                <th>المركبة</th>
                <th>التاريخ</th>
                <th>الطلبات</th>
                <th>تم التسليم</th>
                <th>فشل/مرجع</th>
                <th>معلق</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeliveries.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">لا توجد توصيلات مطابقة للفلاتر</td></tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const statusBadge = getStatusBadge(delivery.status);
                  const pendingCount = delivery.total_orders - delivery.delivered_count - delivery.failed_count;
                  const progressPercent = delivery.total_orders > 0
                    ? ((delivery.delivered_count / delivery.total_orders) * 100).toFixed(0)
                    : 0;
                  return (
                    <tr key={delivery.id} className="hover:bg-gray-50">
                      <td className="font-medium">{delivery.reference}</td>
                      <td>{delivery.livreur?.name || '-'}</td>
                      <td>{delivery.vehicle?.name || '-'}</td>
                      <td>{formatDate(delivery.date)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span>{delivery.total_orders}</span>
                          {delivery.status === 'in_progress' && delivery.total_orders > 0 && (
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="text-green-600 font-medium">{delivery.delivered_count}</td>
                      <td className="text-red-600">{delivery.failed_count}</td>
                      <td className="text-yellow-600">{pendingCount > 0 ? pendingCount : '-'}</td>
                      <td><span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span></td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {delivery.status === 'preparing' && (
                            <button
                              onClick={() => handleStartDelivery(delivery.id)}
                              disabled={startingId === delivery.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {startingId === delivery.id ? (
                                <div className="spinner w-3.5 h-3.5 border-white"></div>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              بدء
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/dashboard/deliveries/${delivery.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            عرض
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
