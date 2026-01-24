'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { salesApi, clientsApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { DocumentTextIcon, TruckIcon, BanknotesIcon, ArrowDownTrayIcon, PencilIcon } from '@heroicons/react/24/outline';

interface Sale {
  id: number;
  reference: string;
  client_id?: number;
  warehouse_id: number;
  date: string;
  total_amount: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid';
  note?: string;
  client?: { id: number; name: string };
  warehouse?: { id: number; name: string };
}

interface Client {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
}

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Data for filters
  const [clients, setClients] = useState<Client[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    fetchData();
    fetchFilterData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        router.push('/dashboard/sales/new');
      } else if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        router.push('/dashboard/sales/debtors');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const fetchData = async () => {
    try {
      const response = await salesApi.getAll();
      setSales(response.data.data || response.data);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [clientsRes, warehousesRes] = await Promise.all([
        clientsApi.getAll({ per_page: 1000 }),
        warehousesApi.getAll(),
      ]);
      setClients(clientsRes.data?.data || clientsRes.data || []);
      setWarehouses(warehousesRes.data?.data || warehousesRes.data || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    try {
      await salesApi.delete(id);
      toast.success('تم حذف الفاتورة بنجاح');
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || 'خطأ في حذف الفاتورة';
      toast.error(message);
    }
  };

  const canDelete = (sale: Sale) => {
    return sale.payment_status === 'unpaid' && sale.paid_amount === 0;
  };

  const handleDownloadFacture = async (id: number) => {
    try {
      const response = await salesApi.downloadFacture(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل الفاتورة');
    } catch (error) {
      toast.error('خطأ في تحميل الفاتورة');
    }
  };

  const handleDownloadBonLivraison = async (id: number) => {
    try {
      const response = await salesApi.downloadBonLivraison(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bon-livraison-${id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل وصل التسليم');
    } catch (error) {
      toast.error('خطأ في تحميل وصل التسليم');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ar-DZ');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      pending: { class: 'badge-warning', text: 'معلق' },
      completed: { class: 'badge-success', text: 'مكتمل' },
      cancelled: { class: 'badge-danger', text: 'ملغي' },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const getPaymentBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      unpaid: { class: 'badge-danger', text: 'غير مدفوع' },
      partial: { class: 'badge-warning', text: 'جزئي' },
      paid: { class: 'badge-success', text: 'مدفوع' },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Search
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesRef = s.reference?.toLowerCase().includes(query);
        const matchesClient = s.client?.name?.toLowerCase().includes(query);
        if (!matchesRef && !matchesClient) return false;
      }

      // Status filter
      if (statusFilter && s.status !== statusFilter) return false;

      // Payment status filter
      if (paymentStatusFilter && s.payment_status !== paymentStatusFilter) return false;

      // Client filter
      if (clientFilter && s.client_id !== parseInt(clientFilter)) return false;

      // Warehouse filter
      if (warehouseFilter && s.warehouse_id !== parseInt(warehouseFilter)) return false;

      // Date from filter
      if (dateFrom && new Date(s.date) < new Date(dateFrom)) return false;

      // Date to filter
      if (dateTo && new Date(s.date) > new Date(dateTo)) return false;

      return true;
    });
  }, [sales, searchTerm, statusFilter, paymentStatusFilter, clientFilter, warehouseFilter, dateFrom, dateTo]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date === today);

    const totalAmount = filteredSales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
    const paidAmount = filteredSales.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
    const dueAmount = filteredSales.reduce((sum, s) => sum + (s.due_amount || 0), 0);

    const todayAmount = todaySales.reduce((sum, s) => sum + (s.grand_total || 0), 0);

    return {
      totalSales: filteredSales.length,
      pendingCount: filteredSales.filter(s => s.status === 'pending').length,
      completedCount: filteredSales.filter(s => s.status === 'completed').length,
      cancelledCount: filteredSales.filter(s => s.status === 'cancelled').length,
      unpaidCount: filteredSales.filter(s => s.payment_status === 'unpaid').length,
      partialCount: filteredSales.filter(s => s.payment_status === 'partial').length,
      paidCount: filteredSales.filter(s => s.payment_status === 'paid').length,
      totalAmount,
      paidAmount,
      dueAmount,
      todaySales: todaySales.length,
      todayAmount,
    };
  }, [filteredSales, sales]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPaymentStatusFilter('');
    setClientFilter('');
    setWarehouseFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchTerm || statusFilter || paymentStatusFilter || clientFilter || warehouseFilter || dateFrom || dateTo;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> فاتورة جديدة</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Alt+D</kbd> الديون</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المبيعات</h1>
          <p className="text-gray-500 mt-1">إدارة فواتير المبيعات</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/sales/debtors"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
          >
            <BanknotesIcon className="w-5 h-5" />
            الديون المستحقة
            <kbd className="bg-amber-600 px-1.5 py-0.5 rounded text-xs">Alt+D</kbd>
          </Link>
          <Link
            href="/dashboard/sales/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة فاتورة بيع
            <kbd className="bg-blue-700 px-1.5 py-0.5 rounded text-xs">Insert</kbd>
          </Link>
        </div>
      </div>

      {/* KPIs Row 1 - Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card bg-blue-50 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-600 text-sm font-medium">إجمالي الفواتير</div>
              <div className="text-3xl font-bold text-blue-700">{kpis.totalSales}</div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
        <div className="card bg-green-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 text-sm font-medium">المحصل</div>
              <div className="text-lg font-bold text-green-700">{formatCurrency(kpis.paidAmount)}</div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-red-50 border-2 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-red-600 text-sm font-medium">الديون</div>
              <div className="text-lg font-bold text-red-700">{formatCurrency(kpis.dueAmount)}</div>
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
              <div className="text-indigo-600 text-sm font-medium">مبيعات اليوم</div>
              <div className="text-3xl font-bold text-indigo-700">{kpis.todaySales}</div>
              <div className="text-xs text-indigo-500">{formatCurrency(kpis.todayAmount)}</div>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-amber-50 border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-amber-600 text-sm font-medium">غير مدفوع</div>
              <div className="text-3xl font-bold text-amber-700">{kpis.unpaidCount}</div>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
        <div className="card bg-green-50 border border-green-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setStatusFilter(statusFilter === 'completed' ? '' : 'completed')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 text-sm">مكتمل</div>
              <div className="text-2xl font-bold text-green-700">{kpis.completedCount}</div>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-rose-50 border border-rose-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setPaymentStatusFilter(paymentStatusFilter === 'unpaid' ? '' : 'unpaid')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-rose-600 text-sm">غير مدفوع</div>
              <div className="text-2xl font-bold text-rose-700">{kpis.unpaidCount}</div>
            </div>
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
              </svg>
            </div>
          </div>
        </div>
        <div className="card bg-orange-50 border border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setPaymentStatusFilter(paymentStatusFilter === 'partial' ? '' : 'partial')}>
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
        <div className="card bg-emerald-50 border border-emerald-200 cursor-pointer hover:shadow-md transition-shadow"
             onClick={() => setPaymentStatusFilter(paymentStatusFilter === 'paid' ? '' : 'paid')}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-emerald-600 text-sm">مدفوع</div>
              <div className="text-2xl font-bold text-emerald-700">{kpis.paidCount}</div>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">بحث</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="رقم المرجع أو اسم العميل..."
              className="input"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select">
              <option value="">كل الحالات</option>
              <option value="pending">معلق</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">حالة الدفع</label>
            <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="select">
              <option value="">كل الحالات</option>
              <option value="unpaid">غير مدفوع</option>
              <option value="partial">جزئي</option>
              <option value="paid">مدفوع</option>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Warehouse Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المستودع</label>
            <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="select">
              <option value="">كل المستودعات</option>
              {warehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
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

      {/* Sales Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">قائمة الفواتير ({filteredSales.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>المرجع</th>
                <th>العميل</th>
                <th>المستودع</th>
                <th>التاريخ</th>
                <th>الإجمالي</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
                <th>الحالة</th>
                <th>الدفع</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">لا توجد فواتير بيع</td></tr>
              ) : (
                filteredSales.map((sale) => {
                  const statusBadge = getStatusBadge(sale.status);
                  const paymentBadge = getPaymentBadge(sale.payment_status);
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="font-medium">{sale.reference}</td>
                      <td>{sale.client?.name || 'عميل نقدي'}</td>
                      <td>{sale.warehouse?.name || '-'}</td>
                      <td>{formatDate(sale.date)}</td>
                      <td>{formatCurrency(sale.grand_total)}</td>
                      <td className="text-green-600 font-medium">{formatCurrency(sale.paid_amount)}</td>
                      <td className="text-red-600">{formatCurrency(sale.due_amount)}</td>
                      <td><span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span></td>
                      <td><span className={`badge ${paymentBadge.class}`}>{paymentBadge.text}</span></td>
                      <td>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/sales/edit/${sale.id}`} className="text-amber-600 hover:text-amber-800" title="تعديل">
                            <PencilIcon className="w-5 h-5" />
                          </Link>
                          <Link href={`/dashboard/sales/${sale.id}`} className="text-blue-600 hover:text-blue-800" title="عرض الفاتورة">
                            <DocumentTextIcon className="w-5 h-5" />
                          </Link>
                          <button onClick={() => handleDownloadFacture(sale.id)} className="text-red-600 hover:text-red-800" title="تحميل الفاتورة PDF">
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDownloadBonLivraison(sale.id)} className="text-green-600 hover:text-green-800" title="Bon de Livraison">
                            <TruckIcon className="w-5 h-5" />
                          </button>
                          {canDelete(sale) && (
                            <button onClick={() => handleDelete(sale.id)} className="text-red-600 hover:text-red-800" title="حذف">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
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
      </div>
    </div>
  );
}
