'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, usersApi, clientsApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import {
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  PlusIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import DataTable from '@/components/ui/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { Order } from '@/lib/types';

const statusLabels: Record<string, string> = {
  pending: 'معلق',
  confirmed: 'مؤكد',
  assigned: 'موزع',
  delivered: 'تم التسليم',
  partial: 'تسليم جزئي',
  cancelled: 'ملغي',
};

const statusClasses: Record<string, string> = {
  pending: 'badge-warning',
  confirmed: 'badge-info',
  assigned: 'badge-info',
  delivered: 'badge-success',
  partial: 'badge-warning',
  cancelled: 'badge-danger',
};

interface Seller {
  id: number;
  name: string;
}

interface Client {
  id: number;
  name: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [hasProblemsFilter, setHasProblemsFilter] = useState(false);

  // Data for filters
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Fetch filter data
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [sellersRes, clientsRes] = await Promise.all([
          usersApi.getSellers(),
          clientsApi.getAll({ per_page: 1000 }),
        ]);
        setSellers(sellersRes.data || []);
        setClients(clientsRes.data?.data || clientsRes.data || []);
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };
    fetchFilterData();
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter, sellerFilter, clientFilter, dateFrom, dateTo, hasProblemsFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (sellerFilter) params.seller_id = sellerFilter;
      if (clientFilter) params.client_id = clientFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (hasProblemsFilter) params.has_problem = true;
      const response = await ordersApi.getAll(params);
      return response.data;
    },
  });

  // Fetch all orders for KPIs (without pagination)
  const { data: allOrdersData } = useQuery({
    queryKey: ['orders-stats'],
    queryFn: async () => {
      const response = await ordersApi.getAll({ per_page: 10000 });
      return response.data;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => ordersApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success('تم تأكيد الطلب بنجاح');
      setIsConfirmOpen(false);
      setSelectedOrder(null);
    },
    onError: () => toast.error('حدث خطأ أثناء التأكيد'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => ordersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-stats'] });
      toast.success('تم إلغاء الطلب');
      setIsCancelOpen(false);
      setSelectedOrder(null);
    },
    onError: () => toast.error('حدث خطأ أثناء الإلغاء'),
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        router.push('/dashboard/orders/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const formatCurrency = (value: unknown) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (!isFinite(num)) return '0 د.ج';
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate KPIs
  const kpis = useMemo(() => {
    const orders = allOrdersData?.data || [];
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o: Order) => o.date === today);

    const totalAmount = orders.reduce((sum: number, o: Order) => sum + (parseFloat(String(o.grand_total)) || 0), 0);
    const deliveredAmount = orders
      .filter((o: Order) => o.status === 'delivered')
      .reduce((sum: number, o: Order) => sum + (parseFloat(String(o.grand_total)) || 0), 0);

    const problemOrders = orders.filter((o: Order) => o.has_problem);

    return {
      totalOrders: orders.length,
      pendingCount: orders.filter((o: Order) => o.status === 'pending').length,
      confirmedCount: orders.filter((o: Order) => o.status === 'confirmed').length,
      assignedCount: orders.filter((o: Order) => o.status === 'assigned').length,
      deliveredCount: orders.filter((o: Order) => o.status === 'delivered').length,
      partialCount: orders.filter((o: Order) => o.status === 'partial').length,
      cancelledCount: orders.filter((o: Order) => o.status === 'cancelled').length,
      todayOrders: todayOrders.length,
      todayPending: todayOrders.filter((o: Order) => o.status === 'pending').length,
      totalAmount,
      deliveredAmount,
      problemOrders: problemOrders.length,
    };
  }, [allOrdersData]);

  const clearFilters = () => {
    setStatusFilter('');
    setSellerFilter('');
    setClientFilter('');
    setDateFrom('');
    setDateTo('');
    setHasProblemsFilter(false);
    setSearch('');
  };

  const hasActiveFilters = statusFilter || sellerFilter || clientFilter || dateFrom || dateTo || hasProblemsFilter || search;

  const columns = [
    { key: 'reference', title: 'المرجع' },
    {
      key: 'client',
      title: 'العميل',
      render: (item: Order) => item.client?.name || '-',
    },
    {
      key: 'seller',
      title: 'البائع',
      render: (item: Order) => item.seller?.name || '-',
    },
    {
      key: 'date',
      title: 'التاريخ',
      render: (item: Order) => formatDate(item.date),
    },
    {
      key: 'grand_total',
      title: 'المجموع',
      render: (item: Order) => formatCurrency(item.grand_total),
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (item: Order) => (
        <div className="flex items-center gap-2">
          <span className={`badge ${statusClasses[item.status]}`}>
            {statusLabels[item.status]}
          </span>
          {item.has_problem && (
            <span className="text-red-500" title={item.problem_description || 'يوجد مشكلة'}>
              <ExclamationTriangleIcon className="w-5 h-5" />
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (item: Order) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/orders/${item.id}`}
            className="p-1.5 hover:bg-gray-100 text-gray-600 rounded-lg"
          >
            <EyeIcon className="w-4 h-4" />
          </Link>
          {item.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  setSelectedOrder(item);
                  setIsConfirmOpen(true);
                }}
                className="p-1.5 hover:bg-green-50 text-green-600 rounded-lg"
              >
                <CheckIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedOrder(item);
                  setIsCancelOpen(true);
                }}
                className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

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
          <h1 className="text-2xl font-bold text-gray-800">الطلبات</h1>
          <p className="text-gray-500 mt-1">إدارة طلبات العملاء</p>
        </div>
        <Link
          href="/dashboard/orders/new"
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          إنشاء طلب جديد
          <kbd className="bg-primary-600 px-1.5 py-0.5 rounded text-xs mr-1">Insert</kbd>
        </Link>
      </div>

      {/* KPIs Row 1 - Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-600 text-sm font-medium">إجمالي الطلبات</div>
              <div className="text-3xl font-bold text-blue-700">{kpis.totalOrders}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 text-sm font-medium">تم التسليم</div>
              <div className="text-3xl font-bold text-green-700">{kpis.deliveredCount}</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-purple-50 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-600 text-sm font-medium">إجمالي المبيعات</div>
              <div className="text-lg font-bold text-purple-700">{formatCurrency(kpis.totalAmount)}</div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-emerald-50 border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-emerald-600 text-sm font-medium">المحصل</div>
              <div className="text-lg font-bold text-emerald-700">{formatCurrency(kpis.deliveredAmount)}</div>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-red-600 text-sm font-medium">مشاكل</div>
              <div className="text-3xl font-bold text-red-700">{kpis.problemOrders}</div>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-indigo-50 border-2 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-indigo-600 text-sm font-medium">طلبات اليوم</div>
              <div className="text-3xl font-bold text-indigo-700">{kpis.todayOrders}</div>
              <div className="text-xs text-indigo-500">{kpis.todayPending} معلق</div>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Row 2 - Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card bg-yellow-50 border border-yellow-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'pending' ? '' : 'pending')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-yellow-600 text-sm">معلق</div>
              <div className="text-2xl font-bold text-yellow-700">{kpis.pendingCount}</div>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-blue-50 border border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'confirmed' ? '' : 'confirmed')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-600 text-sm">مؤكد</div>
              <div className="text-2xl font-bold text-blue-700">{kpis.confirmedCount}</div>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-cyan-50 border border-cyan-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'assigned' ? '' : 'assigned')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-cyan-600 text-sm">موزع</div>
              <div className="text-2xl font-bold text-cyan-700">{kpis.assignedCount}</div>
            </div>
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-green-50 border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'delivered' ? '' : 'delivered')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 text-sm">تم التسليم</div>
              <div className="text-2xl font-bold text-green-700">{kpis.deliveredCount}</div>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-orange-50 border border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'partial' ? '' : 'partial')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-600 text-sm">جزئي</div>
              <div className="text-2xl font-bold text-orange-700">{kpis.partialCount}</div>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select">
              <option value="">جميع الحالات</option>
              <option value="pending">معلق</option>
              <option value="confirmed">مؤكد</option>
              <option value="assigned">موزع</option>
              <option value="delivered">تم التسليم</option>
              <option value="partial">تسليم جزئي</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {/* Seller Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البائع</label>
            <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="select">
              <option value="">كل البائعين</option>
              {sellers.map(seller => (
                <option key={seller.id} value={seller.id}>{seller.name}</option>
              ))}
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العميل</label>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="select">
              <option value="">كل العملاء</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {/* Problems Filter */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer h-10">
              <input
                type="checkbox"
                checked={hasProblemsFilter}
                onChange={(e) => setHasProblemsFilter(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">الطلبات ذات المشاكل فقط</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">من تاريخ</label>
            <DateInput
              value={dateFrom}
              onChange={(v) => setDateFrom(v)}
              placeholder="من تاريخ"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">إلى تاريخ</label>
            <DateInput
              value={dateTo}
              onChange={(v) => setDateTo(v)}
              placeholder="إلى تاريخ"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">قائمة الطلبات ({data?.total || 0})</h3>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          searchable
          searchPlaceholder="بحث عن طلب..."
          onSearch={setSearch}
          pagination={
            data && {
              currentPage: data.current_page,
              lastPage: data.last_page,
              total: data.total,
              perPage: data.per_page,
              onPageChange: setPage,
            }
          }
          emptyMessage="لا توجد طلبات"
        />
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => selectedOrder && confirmMutation.mutate(selectedOrder.id)}
        title="تأكيد الطلب"
        message={`هل أنت متأكد من تأكيد الطلب "${selectedOrder?.reference}"؟`}
        confirmText="تأكيد"
        isLoading={confirmMutation.isPending}
        variant="info"
      />

      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={() => selectedOrder && cancelMutation.mutate(selectedOrder.id)}
        title="إلغاء الطلب"
        message={`هل أنت متأكد من إلغاء الطلب "${selectedOrder?.reference}"؟`}
        confirmText="إلغاء الطلب"
        isLoading={cancelMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
