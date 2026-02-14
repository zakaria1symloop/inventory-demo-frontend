'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { salesApi, clientsApi, warehousesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import SaleForm from './_components/SaleForm';
import {
  DocumentTextIcon,
  TruckIcon,
  BanknotesIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
  ListBulletIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  EyeIcon,
  TrashIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

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
  source?: 'web' | 'app';
  client?: { id: number; name: string };
  warehouse?: { id: number; name: string };
  user?: { id: number; name: string };
}

interface Client {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  name: string;
}

interface Tab {
  id: string;
  type: 'list' | 'new' | 'edit';
  title: string;
  saleId?: number;
  reference?: string;
}

export default function SalesPage() {
  // Tab state
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'list', type: 'list', title: 'قائمة الفواتير' }
  ]);
  const [activeTabId, setActiveTabId] = useState('list');

  // List data
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
  const [sourceFilter, setSourceFilter] = useState('');

  // Data for filters
  const [clients, setClients] = useState<Client[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Generate unique tab ID
  const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Open new tab
  const openNewTab = useCallback(() => {
    const newTab: Tab = {
      id: generateTabId(),
      type: 'new',
      title: 'فاتورة جديدة',
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  // Open edit tab
  const openEditTab = useCallback((saleId: number, reference: string) => {
    // Check if tab already exists
    const existingTab = tabs.find(t => t.type === 'edit' && t.saleId === saleId);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: Tab = {
      id: generateTabId(),
      type: 'edit',
      title: `تعديل ${reference}`,
      saleId,
      reference,
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs]);

  // Close tab
  const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (tabId === 'list') return; // Can't close list tab

    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const newActiveTab = newTabs[closedIndex - 1] || newTabs[0];
        setActiveTabId(newActiveTab.id);
      }
      return newTabs;
    });
  }, [activeTabId]);

  // Handle form success
  const handleFormSuccess = useCallback((tabId: string) => {
    closeTab(tabId);
    setActiveTabId('list');
    fetchData();
  }, [closeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        openNewTab();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId !== 'list') {
          closeTab(activeTabId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openNewTab, closeTab, activeTabId]);

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

  useEffect(() => {
    fetchData();
    fetchFilterData();
  }, []);

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

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return '0 د.ج.';
    return new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
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
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesRef = s.reference?.toLowerCase().includes(query);
        const matchesClient = s.client?.name?.toLowerCase().includes(query);
        if (!matchesRef && !matchesClient) return false;
      }

      if (statusFilter && s.status !== statusFilter) return false;
      if (paymentStatusFilter && s.payment_status !== paymentStatusFilter) return false;
      if (clientFilter && s.client_id !== parseInt(clientFilter)) return false;
      if (warehouseFilter && s.warehouse_id !== parseInt(warehouseFilter)) return false;
      if (dateFrom && new Date(s.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(s.date) > new Date(dateTo)) return false;
      if (sourceFilter && s.source !== sourceFilter) return false;

      return true;
    });
  }, [sales, searchTerm, statusFilter, paymentStatusFilter, clientFilter, warehouseFilter, dateFrom, dateTo, sourceFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.date === today);

    const parseNum = (val: any) => {
      const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
      return isNaN(num) ? 0 : num;
    };

    const totalAmount = filteredSales.reduce((sum, s) => sum + parseNum(s.grand_total), 0);
    const paidAmount = filteredSales.reduce((sum, s) => sum + parseNum(s.paid_amount), 0);
    const dueAmount = filteredSales.reduce((sum, s) => sum + parseNum(s.due_amount), 0);
    const todayAmount = todaySales.reduce((sum, s) => sum + parseNum(s.grand_total), 0);

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
    setSourceFilter('');
  };

  const hasActiveFilters = searchTerm || statusFilter || paymentStatusFilter || clientFilter || warehouseFilter || dateFrom || dateTo || sourceFilter;

  const getTabIcon = (type: Tab['type']) => {
    switch (type) {
      case 'list':
        return <ListBulletIcon className="w-4 h-4" />;
      case 'new':
        return <DocumentPlusIcon className="w-4 h-4" />;
      case 'edit':
        return <PencilSquareIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Render tab content
  const renderTabContent = (tab: Tab) => {
    switch (tab.type) {
      case 'list':
        return (
          <div className="space-y-6">
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
                </Link>
                <button onClick={openNewTab} className="btn btn-primary inline-flex items-center gap-2">
                  <PlusIcon className="w-5 h-5" />
                  إضافة فاتورة بيع
                  <kbd className="bg-blue-700 px-1.5 py-0.5 rounded text-xs">Insert</kbd>
                </button>
              </div>
            </div>

            {/* KPIs Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="card bg-blue-50 border-2 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-blue-600 text-sm font-medium">إجمالي الفواتير</div>
                    <div className="text-3xl font-bold text-blue-700">{kpis.totalSales}</div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
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
                    <BanknotesIcon className="w-6 h-6 text-purple-600" />
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
                    <XMarkIcon className="w-4 h-4" />
                    مسح الفلاتر
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="رقم المرجع أو اسم العميل..."
                  className="input"
                />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select">
                  <option value="">كل الحالات</option>
                  <option value="pending">معلق</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغي</option>
                </select>
                <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)} className="select">
                  <option value="">حالة الدفع</option>
                  <option value="unpaid">غير مدفوع</option>
                  <option value="partial">جزئي</option>
                  <option value="paid">مدفوع</option>
                </select>
                <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="select">
                  <option value="">كل العملاء</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="select">
                  <option value="">كل المستودعات</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="select">
                  <option value="">جميع المصادر</option>
                  <option value="web">من المنصة</option>
                  <option value="app">من التطبيق</option>
                </select>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input" placeholder="من تاريخ" />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input" placeholder="إلى تاريخ" />
              </div>
            </div>

            {/* Sales Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">قائمة الفواتير ({filteredSales.length})</h3>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>
              ) : (
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
                        <th>
                          المصدر
                          <span className="inline-block mr-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full leading-none">جديد</span>
                        </th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr><td colSpan={11} className="text-center py-8 text-gray-500">لا توجد فواتير بيع</td></tr>
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
                              <td className="text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    sale.source === 'app'
                                      ? 'bg-violet-100 text-violet-700'
                                      : 'bg-sky-100 text-sky-700'
                                  }`}>
                                    {sale.source === 'app' ? (
                                      <>
                                        <DevicePhoneMobileIcon className="w-3 h-3" />
                                        تطبيق
                                      </>
                                    ) : (
                                      <>
                                        <ComputerDesktopIcon className="w-3 h-3" />
                                        منصة
                                      </>
                                    )}
                                  </span>
                                  {sale.user && (
                                    <span className="text-[10px] text-gray-500">{sale.user.name}</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => openEditTab(sale.id, sale.reference)}
                                    className="text-amber-600 hover:text-amber-800"
                                    title="تعديل"
                                  >
                                    <PencilIcon className="w-5 h-5" />
                                  </button>
                                  <Link href={`/dashboard/sales/${sale.id}`} className="text-blue-600 hover:text-blue-800" title="عرض الفاتورة">
                                    <EyeIcon className="w-5 h-5" />
                                  </Link>
                                  <button onClick={() => handleDownloadFacture(sale.id)} className="text-red-600 hover:text-red-800" title="تحميل الفاتورة PDF">
                                    <ArrowDownTrayIcon className="w-5 h-5" />
                                  </button>
                                  <button onClick={() => handleDownloadBonLivraison(sale.id)} className="text-green-600 hover:text-green-800" title="Bon de Livraison">
                                    <TruckIcon className="w-5 h-5" />
                                  </button>
                                  {canDelete(sale) && (
                                    <button onClick={() => handleDelete(sale.id)} className="text-red-600 hover:text-red-800" title="حذف">
                                      <TrashIcon className="w-5 h-5" />
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
              )}
            </div>
          </div>
        );

      case 'new':
        return (
          <SaleForm
            key={tab.id}
            onSuccess={() => handleFormSuccess(tab.id)}
            onCancel={() => closeTab(tab.id)}
          />
        );

      case 'edit':
        return (
          <SaleForm
            key={tab.id}
            saleId={tab.saleId}
            onSuccess={() => handleFormSuccess(tab.id)}
            onCancel={() => closeTab(tab.id)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-2 flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> فاتورة جديدة</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Ctrl+W</kbd> إغلاق التبويب</span>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 pt-2 overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors cursor-pointer
              ${activeTabId === tab.id
                ? 'bg-white border-gray-200 text-blue-600'
                : 'bg-gray-100 border-transparent text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {getTabIcon(tab.type)}
            <span className="max-w-[150px] truncate">{tab.title}</span>
            {tab.type !== 'list' && (
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="p-0.5 rounded hover:bg-gray-300 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* Add New Tab Button */}
        <button
          onClick={openNewTab}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          title="فاتورة جديدة"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white p-4 overflow-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={activeTabId === tab.id ? 'block' : 'hidden'}
          >
            {renderTabContent(tab)}
          </div>
        ))}
      </div>
    </div>
  );
}
