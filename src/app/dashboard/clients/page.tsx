'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientsApi, clientCategoriesApi, salesApi, usersApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';

const ClientsMap = lazy(() => import('./ClientsMap'));
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BanknotesIcon,
  UserGroupIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  FunnelIcon,
  XCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  MapIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

interface ClientCategory {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
}

interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gps_lat?: number;
  gps_lng?: number;
  balance: number;
  sales_debt?: number;
  delivery_debt?: number;
  combined_debt?: number;
  credit_limit?: number;
  is_active: boolean;
  client_category_id?: number;
  client_category?: ClientCategory;
  rc?: string;
  nif?: string;
  ai?: string;
  nis?: string;
  rib?: string;
  created_at?: string;
  orders_count?: number;
  sales_count?: number;
  source?: 'web' | 'app';
  created_by?: number;
  creator?: { id: number; name: string };
  warehouse_id?: number;
  warehouse?: { id: number; name: string };
  copied_from?: number;
  original_client?: { id: number; name: string };
}

interface SellerUser {
  id: number;
  name: string;
  role: string;
}

interface ClientSale {
  id: number;
  reference: string;
  date: string;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  payment_status: string;
}

interface ClientDetails {
  client: Client;
  sales: ClientSale[];
  totals: {
    total_sales: number;
    total_paid: number;
    total_remaining: number;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientCategories, setClientCategories] = useState<ClientCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'has_debt' | 'no_debt'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [creditLimitFilter, setCreditLimitFilter] = useState<'all' | 'has_limit' | 'no_limit' | 'exceeded'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web' | 'app'>('all');
  const [sellerFilter, setSellerFilter] = useState('');
  const [sellers, setSellers] = useState<SellerUser[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [warehousesList, setWarehousesList] = useState<{ id: number; name: string }[]>([]);
  const [copyFilter, setCopyFilter] = useState<'all' | 'copies' | 'originals'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');

  // Transfer, copy & selection
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferWarehouseId, setTransferWarehouseId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyWarehouseId, setCopyWarehouseId] = useState('');
  const [isCopying, setIsCopying] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Statement bottom sheet
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [statementDateFrom, setStatementDateFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  });
  const [statementDateTo, setStatementDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [statementIncludeInfo, setStatementIncludeInfo] = useState(true);
  const [statementIncludeLegal, setStatementIncludeLegal] = useState(true);
  const [statementData, setStatementData] = useState<{
    operations: { type: string; code: string; date: string; somme: number; versement: number; credit: number }[];
    opening_balance: number;
    closing_balance: number;
    total_somme: number;
    total_versement: number;
  } | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gps_lat: '',
    gps_lng: '',
    credit_limit: '',
    is_active: true,
    client_category_id: '',
    warehouse_id: '',
    rc: '',
    nif: '',
    ai: '',
    nis: '',
    rib: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        handleOpenCreate();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchClients = async () => {
    try {
      const [clientsRes, categoriesRes, sellersRes, warehousesRes] = await Promise.all([
        clientsApi.getAll({ per_page: 1000 }),
        clientCategoriesApi.getAll(),
        usersApi.getAll({ per_page: 1000 }).catch(() => ({ data: { data: [] } })),
        warehousesApi.getAll().catch(() => ({ data: [] })),
      ]);
      setClients(clientsRes.data.data || clientsRes.data);
      setClientCategories(categoriesRes.data);
      setSellers(sellersRes.data.data || sellersRes.data || []);
      setWarehousesList(warehousesRes.data.data || warehousesRes.data || []);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientDetails = async (clientId: number) => {
    setLoadingDetails(true);
    try {
      const [clientRes, salesDebtRes] = await Promise.all([
        clientsApi.getOne(clientId),
        clientsApi.getSalesDebt(clientId).catch(() => ({ data: { sales: [], totals: {} } }))
      ]);

      setClientDetails({
        client: clientRes.data,
        sales: salesDebtRes.data.sales || [],
        totals: salesDebtRes.data.totals || { total_sales: 0, total_paid: 0, total_remaining: 0 }
      });
    } catch (error) {
      toast.error('خطأ في تحميل تفاصيل العميل');
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchStatementData = async (clientId: number, dateFrom: string, dateTo: string) => {
    setLoadingStatement(true);
    try {
      const res = await clientsApi.getStatement(clientId, { date_from: dateFrom, date_to: dateTo });
      setStatementData(res.data);
    } catch {
      toast.error('خطأ في تحميل بيانات كشف الحساب');
    } finally {
      setLoadingStatement(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedClient(null);
    const defaultCategory = clientCategories.find(c => c.is_default);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      gps_lat: '',
      gps_lng: '',
      credit_limit: '',
      is_active: true,
      client_category_id: defaultCategory ? defaultCategory.id.toString() : '',
      warehouse_id: '',
      rc: '',
      nif: '',
      ai: '',
      nis: '',
      rib: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      gps_lat: client.gps_lat?.toString() || '',
      gps_lng: client.gps_lng?.toString() || '',
      credit_limit: client.credit_limit?.toString() || '',
      is_active: client.is_active,
      client_category_id: client.client_category_id?.toString() || '',
      warehouse_id: client.warehouse_id?.toString() || '',
      rc: client.rc || '',
      nif: client.nif || '',
      ai: client.ai || '',
      nis: client.nis || '',
      rib: client.rib || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
    fetchClientDetails(client.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedClient(null);
    setClientDetails(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const data = {
      ...formData,
      gps_lat: formData.gps_lat ? parseFloat(formData.gps_lat) : null,
      gps_lng: formData.gps_lng ? parseFloat(formData.gps_lng) : null,
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      client_category_id: formData.client_category_id ? parseInt(formData.client_category_id) : null,
      warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : null,
    };

    try {
      if (selectedClient) {
        await clientsApi.update(selectedClient.id, data);
        toast.success('تم تحديث بيانات العميل بنجاح');
      } else {
        await clientsApi.create(data);
        toast.success('تم إضافة العميل بنجاح');
      }
      handleCloseModal();
      fetchClients();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    try {
      await clientsApi.delete(selectedClient.id);
      toast.success('تم حذف العميل بنجاح');
      setIsDeleteOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      const message = error.response?.data?.message || 'حدث خطأ أثناء الحذف';
      toast.error(message);
    }
  };

  const handleTransfer = async () => {
    if (!transferWarehouseId || selectedClientIds.size === 0) return;
    setIsTransferring(true);
    try {
      const res = await clientsApi.transferWarehouse(
        Array.from(selectedClientIds),
        parseInt(transferWarehouseId)
      );
      toast.success(res.data.message);
      setShowTransferModal(false);
      setSelectedClientIds(new Set());
      setTransferWarehouseId('');
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في نقل العملاء');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCopy = async () => {
    if (!copyWarehouseId || selectedClientIds.size === 0) return;
    setIsCopying(true);
    try {
      const res = await clientsApi.copyToWarehouse(
        Array.from(selectedClientIds),
        parseInt(copyWarehouseId)
      );
      toast.success(res.data.message);
      setShowCopyModal(false);
      setSelectedClientIds(new Set());
      setCopyWarehouseId('');
      fetchClients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'خطأ في نسخ العملاء');
    } finally {
      setIsCopying(false);
    }
  };

  const toggleClientSelection = (id: number) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedClientIds.size === filteredClients.length) {
      setSelectedClientIds(new Set());
    } else {
      setSelectedClientIds(new Set(filteredClients.map(c => c.id)));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-DZ');
  };

  // Statistics - use combined_debt (sales + deliveries)
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.is_active).length;
    const inactiveClients = clients.filter(c => !c.is_active).length;
    const clientsWithDebt = clients.filter(c => (Number(c.combined_debt) || 0) > 0).length;
    const clientsWithoutDebt = clients.filter(c => (Number(c.combined_debt) || 0) <= 0).length;
    const totalDebt = clients.reduce((sum, c) => {
      const debt = Number(c.combined_debt) || 0;
      return sum + (debt > 0 ? debt : 0);
    }, 0);
    const avgDebt = clientsWithDebt > 0 ? totalDebt / clientsWithDebt : 0;

    // New clients this month
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = clients.filter(c => {
      if (!c.created_at) return false;
      return new Date(c.created_at) >= thisMonth;
    }).length;

    // Clients with credit limit
    const withCreditLimit = clients.filter(c => c.credit_limit && c.credit_limit > 0).length;
    const exceededCreditLimit = clients.filter(c => {
      if (!c.credit_limit || c.credit_limit <= 0) return false;
      const debt = Number(c.combined_debt) || 0;
      return debt > c.credit_limit;
    }).length;

    // Total sales count
    const totalOrders = clients.reduce((sum, c) => sum + (c.orders_count || 0), 0);
    const totalSales = clients.reduce((sum, c) => sum + (c.sales_count || 0), 0);

    return {
      totalClients,
      activeClients,
      inactiveClients,
      clientsWithDebt,
      clientsWithoutDebt,
      totalDebt,
      avgDebt,
      newThisMonth,
      withCreditLimit,
      exceededCreditLimit,
      totalOrders,
      totalSales,
    };
  }, [clients]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || balanceFilter !== 'all' ||
    dateFrom || dateTo || creditLimitFilter !== 'all' || sourceFilter !== 'all' || sellerFilter || warehouseFilter || copyFilter !== 'all';

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBalanceFilter('all');
    setDateFrom('');
    setDateTo('');
    setCreditLimitFilter('all');
    setSourceFilter('all');
    setSellerFilter('');
    setWarehouseFilter('');
    setCopyFilter('all');
  };

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.address?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && client.is_active) ||
        (statusFilter === 'inactive' && !client.is_active);

      const clientDebt = Number(client.combined_debt) || 0;
      const matchesBalance =
        balanceFilter === 'all' ||
        (balanceFilter === 'has_debt' && clientDebt > 0) ||
        (balanceFilter === 'no_debt' && clientDebt <= 0);

      // Date filter
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const createdAt = client.created_at ? new Date(client.created_at) : null;
        if (createdAt) {
          if (dateFrom && createdAt < new Date(dateFrom)) matchesDate = false;
          if (dateTo && createdAt > new Date(dateTo + 'T23:59:59')) matchesDate = false;
        } else {
          matchesDate = false;
        }
      }

      // Credit limit filter
      let matchesCreditLimit = true;
      if (creditLimitFilter !== 'all') {
        const hasLimit = client.credit_limit && client.credit_limit > 0;
        const isExceeded = hasLimit && clientDebt > (client.credit_limit || 0);

        if (creditLimitFilter === 'has_limit') matchesCreditLimit = !!hasLimit;
        else if (creditLimitFilter === 'no_limit') matchesCreditLimit = !hasLimit;
        else if (creditLimitFilter === 'exceeded') matchesCreditLimit = !!isExceeded;
      }

      // Source filter
      const matchesSource = sourceFilter === 'all' || client.source === sourceFilter;

      // Seller filter
      const matchesSeller = !sellerFilter || client.created_by === parseInt(sellerFilter);

      // Warehouse filter
      const matchesWarehouse = !warehouseFilter ||
        (warehouseFilter === 'none' ? !client.warehouse_id : client.warehouse_id === parseInt(warehouseFilter));

      // Copy filter
      const matchesCopy = copyFilter === 'all' ||
        (copyFilter === 'copies' && !!client.copied_from) ||
        (copyFilter === 'originals' && !client.copied_from);

      return matchesSearch && matchesStatus && matchesBalance && matchesDate && matchesCreditLimit && matchesSource && matchesSeller && matchesWarehouse && matchesCopy;
    });
  }, [clients, searchTerm, statusFilter, balanceFilter, dateFrom, dateTo, creditLimitFilter, sourceFilter, sellerFilter, warehouseFilter, copyFilter]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> إضافة عميل جديد</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">العملاء</h1>
          <p className="text-gray-500 mt-1">إدارة بيانات العملاء وحساباتهم</p>
        </div>
        <div className="flex gap-3 items-center">
          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              جدول
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'map' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              خريطة
            </button>
          </div>
          <Link
            href="/dashboard/sales/debtors"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            <BanknotesIcon className="w-5 h-5" />
            الديون المستحقة
          </Link>
          {selectedClientIds.size > 0 && (
            <>
              <button
                onClick={() => setShowTransferModal(true)}
                className="btn bg-amber-600 hover:bg-amber-700 text-white"
              >
                نقل {selectedClientIds.size} عميل
              </button>
              <button
                onClick={() => setShowCopyModal(true)}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                نسخ {selectedClientIds.size} عميل
              </button>
            </>
          )}
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <PlusIcon className="w-5 h-5" />
            إضافة عميل
            <kbd className="bg-blue-700 px-1.5 py-0.5 rounded text-xs mr-2">Insert</kbd>
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">إجمالي العملاء</p>
              <p className="text-xl font-bold text-blue-600">{stats.totalClients}</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">نشطون</p>
              <p className="text-xl font-bold text-green-600">{stats.activeClients}</p>
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <BanknotesIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">إجمالي الديون</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalDebt)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">لديهم ديون</p>
              <p className="text-xl font-bold text-orange-600">{stats.clientsWithDebt}</p>
            </div>
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <UserPlusIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">جدد هذا الشهر</p>
              <p className="text-xl font-bold text-purple-600">{stats.newThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">متوسط الدين</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.avgDebt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clickable Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <button
          onClick={() => { setStatusFilter('all'); setBalanceFilter('all'); }}
          className={`p-3 rounded-lg border-2 transition-all text-right ${
            statusFilter === 'all' && balanceFilter === 'all'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <UserGroupIcon className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-bold text-gray-800">{stats.totalClients}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">الكل</p>
        </button>

        <button
          onClick={() => { setStatusFilter('active'); setBalanceFilter('all'); }}
          className={`p-3 rounded-lg border-2 transition-all text-right ${
            statusFilter === 'active' && balanceFilter === 'all'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <span className="text-lg font-bold text-gray-800">{stats.activeClients}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">نشطون</p>
        </button>

        <button
          onClick={() => { setStatusFilter('inactive'); setBalanceFilter('all'); }}
          className={`p-3 rounded-lg border-2 transition-all text-right ${
            statusFilter === 'inactive'
              ? 'border-gray-500 bg-gray-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <UserMinusIcon className="w-5 h-5 text-gray-600" />
            <span className="text-lg font-bold text-gray-800">{stats.inactiveClients}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">معطلون</p>
        </button>

        <button
          onClick={() => { setStatusFilter('all'); setBalanceFilter('has_debt'); }}
          className={`p-3 rounded-lg border-2 transition-all text-right ${
            balanceFilter === 'has_debt'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <ArrowTrendingUpIcon className="w-5 h-5 text-red-600" />
            <span className="text-lg font-bold text-gray-800">{stats.clientsWithDebt}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">لديهم ديون</p>
        </button>

        <button
          onClick={() => { setStatusFilter('all'); setBalanceFilter('no_debt'); }}
          className={`p-3 rounded-lg border-2 transition-all text-right ${
            balanceFilter === 'no_debt'
              ? 'border-teal-500 bg-teal-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <CheckCircleIcon className="w-5 h-5 text-teal-600" />
            <span className="text-lg font-bold text-gray-800">{stats.clientsWithoutDebt}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">بدون دين</p>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        {/* Filter Header - Always Visible */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <FunnelIcon className="w-5 h-5" />
            <span className="font-medium">الفلاتر</span>
            {hasActiveFilters && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                نشط
              </span>
            )}
            {showFilters ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <XCircleIcon className="w-4 h-4" />
                إعادة تعيين
              </button>
            )}
            <span className="text-sm text-gray-500">
              {filteredClients.length} من {stats.totalClients} عميل
            </span>
          </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث بالاسم، الهاتف، البريد..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input w-full pr-10"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="select"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط فقط</option>
                <option value="inactive">معطل فقط</option>
              </select>

              {/* Balance Filter */}
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value as typeof balanceFilter)}
                className="select"
              >
                <option value="all">جميع الأرصدة</option>
                <option value="has_debt">لديه دين</option>
                <option value="no_debt">بدون دين</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Credit Limit Filter */}
              <select
                value={creditLimitFilter}
                onChange={(e) => setCreditLimitFilter(e.target.value as typeof creditLimitFilter)}
                className="select"
              >
                <option value="all">حد الائتمان</option>
                <option value="has_limit">لديه حد ائتمان</option>
                <option value="no_limit">بدون حد ائتمان</option>
                <option value="exceeded">تجاوز الحد ({stats.exceededCreditLimit})</option>
              </select>

              {/* Source Filter */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
                className="select"
              >
                <option value="all">جميع المصادر</option>
                <option value="web">من المنصة</option>
                <option value="app">من التطبيق</option>
              </select>

              {/* Creator Filter */}
              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="select"
              >
                <option value="">جميع المستخدمين</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>{seller.name} ({seller.role === 'admin' ? 'مدير' : seller.role === 'seller' ? 'بائع' : seller.role === 'livreur' ? 'سائق' : seller.role === 'cashvan' ? 'كاشفان' : seller.role})</option>
                ))}
              </select>

              {/* Warehouse Filter */}
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="select"
              >
                <option value="">جميع المستودعات</option>
                <option value="none">بدون مستودع</option>
                {warehousesList.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>

              {/* Copy Filter */}
              <select
                value={copyFilter}
                onChange={(e) => setCopyFilter(e.target.value as typeof copyFilter)}
                className="select"
              >
                <option value="all">الكل (أصلي + نسخ)</option>
                <option value="copies">النسخ فقط</option>
                <option value="originals">الأصلي فقط</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">تاريخ الإنشاء:</span>
              </div>
              <div className="flex items-center gap-2">
                <DateInput
                  value={dateFrom}
                  onChange={(v) => setDateFrom(v)}
                  className="text-sm"
                  placeholder="من"
                />
                <span className="text-gray-400">-</span>
                <DateInput
                  value={dateTo}
                  onChange={(v) => setDateTo(v)}
                  className="text-sm"
                  placeholder="إلى"
                />
              </div>
            </div>
          </div>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <div className={showFilters ? '' : 'mt-4'}>
            <Suspense fallback={<div className="h-[550px] rounded-lg bg-gray-100 flex items-center justify-center"><div className="spinner"></div></div>}>
              <ClientsMap
                clients={filteredClients}
                onClientClick={(id) => {
                  const client = filteredClients.find(c => c.id === id);
                  if (client) handleOpenDetails(client);
                }}
              />
            </Suspense>
          </div>
        )}

        {/* Clients Table */}
        <div className={`overflow-x-auto ${showFilters ? '' : 'mt-4'} ${viewMode === 'map' ? 'hidden' : ''}`}>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredClients.length > 0 && selectedClientIds.size === filteredClients.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">العميل</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التواصل</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المستودع</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الرصيد</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">حد الائتمان</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  المصدر
                  <span className="inline-block mr-1 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full leading-none">جديد</span>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>لا يوجد عملاء مطابقين للبحث</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className={`hover:bg-gray-50 ${selectedClientIds.has(client.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-2 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedClientIds.has(client.id)}
                        onChange={() => toggleClientSelection(client.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-bold">{client.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{client.name}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">#{client.id}</span>
                            {client.client_category && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {client.client_category.name}
                              </span>
                            )}
                            {client.copied_from && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700" title={`نسخة من: ${client.original_client?.name || `#${client.copied_from}`}`}>
                                نسخة
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <PhoneIcon className="w-4 h-4" />
                            <span dir="ltr">{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <EnvelopeIcon className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{client.email}</span>
                          </div>
                        )}
                        {!client.phone && !client.email && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {client.warehouse ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                          {client.warehouse.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const totalDebt = Number(client.combined_debt) || 0;
                        const salesDebt = Number(client.sales_debt) || 0;
                        const deliveryDebt = Number(client.delivery_debt) || 0;
                        return (
                          <>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                              totalDebt > 0
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {totalDebt > 0 && <ArrowTrendingUpIcon className="w-4 h-4" />}
                              {formatCurrency(totalDebt)}
                            </div>
                            {totalDebt > 0 && (
                              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                {salesDebt > 0 && (
                                  <div>مبيعات: {formatCurrency(salesDebt)}</div>
                                )}
                                {deliveryDebt > 0 && (
                                  <div>توصيل: {formatCurrency(deliveryDebt)}</div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {client.credit_limit ? (
                        <span className="text-gray-700">{formatCurrency(client.credit_limit)}</span>
                      ) : (
                        <span className="text-gray-400">غير محدد</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        client.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {client.is_active ? (
                          <>
                            <CheckCircleIcon className="w-3 h-3" />
                            نشط
                          </>
                        ) : (
                          <>
                            <XMarkIcon className="w-3 h-3" />
                            معطل
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          client.source === 'app'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}>
                          {client.source === 'app' ? (
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
                        {client.creator && (
                          <span className="text-[10px] text-gray-500">{client.creator.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDetails(client)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(client)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClient(client);
                            setIsDeleteOpen(true);
                          }}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                        {client.copied_from && (
                          <>
                            <button
                              onClick={async () => {
                                if (!confirm(`إلغاء نسخة "${client.name}"؟`)) return;
                                try {
                                  await clientsApi.cancelCopy(client.id);
                                  toast.success('تم إلغاء النسخة');
                                  fetchClients();
                                } catch (err: any) {
                                  toast.error(err.response?.data?.message || 'خطأ');
                                }
                              }}
                              className="p-2 hover:bg-orange-50 text-orange-600 rounded-lg transition-colors"
                              title="إلغاء النسخة (حذف)"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await clientsApi.removeCopyFlag(client.id);
                                  toast.success('تم تحويل العميل إلى عادي');
                                  fetchClients();
                                } catch (err: any) {
                                  toast.error(err.response?.data?.message || 'خطأ');
                                }
                              }}
                              className="p-2 hover:bg-teal-50 text-teal-600 rounded-lg transition-colors"
                              title="تحويل إلى عميل عادي"
                            >
                              <CheckCircleIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">
                {selectedClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم العميل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="input w-full"
                  required
                  placeholder="أدخل اسم العميل"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <div className="relative">
                    <PhoneIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      className="input w-full pr-10"
                      placeholder="0xxx xxx xxx"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <EnvelopeIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="input w-full pr-10"
                      placeholder="example@email.com"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <div className="relative">
                  <MapPinIcon className="w-5 h-5 absolute right-3 top-3 text-gray-400" />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                    className="input w-full pr-10"
                    rows={2}
                    placeholder="أدخل عنوان العميل"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">خط العرض (GPS)</label>
                  <input
                    type="number"
                    value={formData.gps_lat}
                    onChange={(e) => setFormData(p => ({ ...p, gps_lat: e.target.value }))}
                    className="input w-full"
                    step="any"
                    placeholder="مثال: 34.8449"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">خط الطول (GPS)</label>
                  <input
                    type="number"
                    value={formData.gps_lng}
                    onChange={(e) => setFormData(p => ({ ...p, gps_lng: e.target.value }))}
                    className="input w-full"
                    step="any"
                    placeholder="مثال: 5.7248"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حد الائتمان</label>
                <div className="relative">
                  <BanknotesIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData(p => ({ ...p, credit_limit: e.target.value }))}
                    className="input w-full pr-10"
                    min="0"
                    placeholder="الحد الأقصى للدين المسموح"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">اتركه فارغاً لعدم تحديد حد</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">فئة العميل</label>
                <select
                  value={formData.client_category_id}
                  onChange={(e) => setFormData(p => ({ ...p, client_category_id: e.target.value }))}
                  className="select w-full"
                >
                  <option value="">بدون فئة</option>
                  {clientCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {cat.description ? `- ${cat.description}` : ''} {cat.is_default ? '(سعر البيع)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">تحدد الفئة أسعار المنتجات للعميل</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المستودع</label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData(p => ({ ...p, warehouse_id: e.target.value }))}
                  className="select w-full"
                >
                  <option value="">بدون مستودع</option>
                  {warehousesList.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">المستودع الذي ينتمي إليه العميل (يحدد رؤية السائقين)</p>
              </div>

              {/* Legal Information */}
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-700 mb-3">المعلومات القانونية</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RC (السجل التجاري)
                      </label>
                      <input
                        type="text"
                        value={formData.rc}
                        onChange={(e) => setFormData(p => ({ ...p, rc: e.target.value }))}
                        className="input w-full"
                        dir="ltr"
                        placeholder="00/00-0000000B00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIF (الرقم الجبائي)
                      </label>
                      <input
                        type="text"
                        value={formData.nif}
                        onChange={(e) => setFormData(p => ({ ...p, nif: e.target.value }))}
                        className="input w-full"
                        dir="ltr"
                        placeholder="000000000000000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AI (رقم المادة)
                      </label>
                      <input
                        type="text"
                        value={formData.ai}
                        onChange={(e) => setFormData(p => ({ ...p, ai: e.target.value }))}
                        className="input w-full"
                        dir="ltr"
                        placeholder="00000000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NIS (رقم الإحصاء)
                      </label>
                      <input
                        type="text"
                        value={formData.nis}
                        onChange={(e) => setFormData(p => ({ ...p, nis: e.target.value }))}
                        className="input w-full"
                        dir="ltr"
                        placeholder="000000000000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RIB (رقم الحساب البنكي)
                    </label>
                    <input
                      type="text"
                      value={formData.rib}
                      onChange={(e) => setFormData(p => ({ ...p, rib: e.target.value }))}
                      className="input w-full"
                      dir="ltr"
                      placeholder="00000 00000 00000000000 00"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-700">عميل نشط</span>
                    <p className="text-xs text-gray-500">العميل غير النشط لن يظهر في قوائم الاختيار</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  إلغاء
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  {isSaving ? (
                    <>
                      <span className="spinner w-4 h-4"></span>
                      جاري الحفظ...
                    </>
                  ) : selectedClient ? (
                    'تحديث البيانات'
                  ) : (
                    'إضافة العميل'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {isDetailsOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600">{selectedClient.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedClient.name}</h3>
                  <p className="text-sm text-gray-500">تفاصيل العميل والمعاملات</p>
                </div>
              </div>
              <button onClick={handleCloseDetails} className="p-2 hover:bg-gray-200 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="spinner"></div>
                </div>
              ) : clientDetails ? (
                <div className="space-y-6">
                  {/* Client Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                        معلومات العميل
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedClient.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                            <span dir="ltr">{selectedClient.phone}</span>
                          </div>
                        )}
                        {selectedClient.email && (
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                            <span>{selectedClient.email}</span>
                          </div>
                        )}
                        {selectedClient.address && (
                          <div className="flex items-start gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span>{selectedClient.address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <span className="text-gray-500">الحالة:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedClient.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedClient.is_active ? 'نشط' : 'معطل'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-orange-600" />
                        الحالة المالية
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">إجمالي الدين:</span>
                          <span className={`text-xl font-bold ${
                            (Number(selectedClient.combined_debt) || 0) > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(Number(selectedClient.combined_debt) || 0)}
                          </span>
                        </div>
                        {(Number(selectedClient.combined_debt) || 0) > 0 && (
                          <>
                            {(Number(selectedClient.sales_debt) || 0) > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">دين المبيعات:</span>
                                <span className="text-red-500">{formatCurrency(Number(selectedClient.sales_debt) || 0)}</span>
                              </div>
                            )}
                            {(Number(selectedClient.delivery_debt) || 0) > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">دين التوصيل:</span>
                                <span className="text-orange-500">{formatCurrency(Number(selectedClient.delivery_debt) || 0)}</span>
                              </div>
                            )}
                          </>
                        )}
                        {selectedClient.credit_limit && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">حد الائتمان:</span>
                            <span className="font-medium">{formatCurrency(selectedClient.credit_limit)}</span>
                          </div>
                        )}
                        {clientDetails.totals && (
                          <>
                            <hr />
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">إجمالي المبيعات:</span>
                              <span>{formatCurrency(clientDetails.totals.total_sales || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">إجمالي المدفوع:</span>
                              <span className="text-green-600">{formatCurrency(clientDetails.totals.total_paid || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">إجمالي المتبقي:</span>
                              <span className="text-red-600">{formatCurrency(clientDetails.totals.total_remaining || 0)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unpaid Sales */}
                  {clientDetails.sales && clientDetails.sales.length > 0 && (
                    <div className="card">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                        الفواتير غير المسددة ({clientDetails.sales.length})
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-right">المرجع</th>
                              <th className="px-3 py-2 text-right">التاريخ</th>
                              <th className="px-3 py-2 text-center">المبلغ</th>
                              <th className="px-3 py-2 text-center">المدفوع</th>
                              <th className="px-3 py-2 text-center">المتبقي</th>
                              <th className="px-3 py-2 text-center">الحالة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {clientDetails.sales.map((sale) => (
                              <tr key={sale.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  <Link
                                    href={`/dashboard/sales/${sale.id}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {sale.reference}
                                  </Link>
                                </td>
                                <td className="px-3 py-2">{formatDate(sale.date)}</td>
                                <td className="px-3 py-2 text-center">{formatCurrency(sale.grand_total)}</td>
                                <td className="px-3 py-2 text-center text-green-600">{formatCurrency(sale.paid_amount)}</td>
                                <td className="px-3 py-2 text-center text-red-600 font-medium">{formatCurrency(sale.due_amount)}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    sale.payment_status === 'paid'
                                      ? 'bg-green-100 text-green-700'
                                      : sale.payment_status === 'partial'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                  }`}>
                                    {sale.payment_status === 'paid' ? 'مدفوع' : sale.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/dashboard/sales/new?client_id=${selectedClient.id}`}
                      className="btn btn-primary"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                      فاتورة بيع جديدة
                    </Link>
                    <button
                      onClick={() => {
                        handleCloseDetails();
                        handleOpenEdit(selectedClient);
                      }}
                      className="btn btn-secondary"
                    >
                      <PencilIcon className="w-5 h-5" />
                      تعديل البيانات
                    </button>
                    <button
                      onClick={() => {
                        setIsStatementOpen(true);
                        setStatementData(null);
                        fetchStatementData(selectedClient.id, statementDateFrom, statementDateTo);
                      }}
                      className="btn bg-purple-600 text-white hover:bg-purple-700"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                      كشف حساب
                    </button>
                    {(Number(selectedClient.combined_debt) || 0) > 0 && (
                      <Link
                        href="/dashboard/sales/debtors"
                        className="btn bg-amber-500 text-white hover:bg-amber-600"
                      >
                        <CurrencyDollarIcon className="w-5 h-5" />
                        تحصيل دين
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  لا توجد بيانات
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">حذف العميل</h3>
              <p className="text-gray-600 mb-6">
                هل أنت متأكد من حذف العميل "{selectedClient.name}"؟
                <br />
                <span className="text-sm text-red-600">هذا الإجراء لا يمكن التراجع عنه</span>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="btn btn-secondary"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDelete}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  نعم، حذف العميل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">نقل العملاء إلى مستودع</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              سيتم نقل <span className="font-bold text-blue-600">{selectedClientIds.size}</span> عميل إلى المستودع المحدد
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">المستودع الوجهة</label>
              <select
                value={transferWarehouseId}
                onChange={(e) => setTransferWarehouseId(e.target.value)}
                className="select w-full"
              >
                <option value="">اختر المستودع</option>
                {warehousesList.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowTransferModal(false)}
                className="btn btn-secondary"
              >
                إلغاء
              </button>
              <button
                onClick={handleTransfer}
                disabled={!transferWarehouseId || isTransferring}
                className="btn bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isTransferring ? (
                  <>
                    <span className="spinner w-4 h-4"></span>
                    جاري النقل...
                  </>
                ) : (
                  'نقل العملاء'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">نسخ العملاء إلى مستودع</h3>
              <button onClick={() => setShowCopyModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-2">
              سيتم نسخ <span className="font-bold text-indigo-600">{selectedClientIds.size}</span> عميل إلى المستودع المحدد
            </p>
            <p className="text-xs text-gray-500 mb-4">
              سيتم إنشاء نسخة جديدة من كل عميل في المستودع الوجهة مع رصيد صفر
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">المستودع الوجهة</label>
              <select
                value={copyWarehouseId}
                onChange={(e) => setCopyWarehouseId(e.target.value)}
                className="select w-full"
              >
                <option value="">اختر المستودع</option>
                {warehousesList.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCopyModal(false)}
                className="btn btn-secondary"
              >
                إلغاء
              </button>
              <button
                onClick={handleCopy}
                disabled={!copyWarehouseId || isCopying}
                className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCopying ? (
                  <>
                    <span className="spinner w-4 h-4"></span>
                    جاري النسخ...
                  </>
                ) : (
                  'نسخ العملاء'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Statement Bottom Sheet */}
      {isStatementOpen && selectedClient && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={(e) => {
          if (e.target === e.currentTarget) setIsStatementOpen(false);
        }}>
          <div
            className="bg-white rounded-t-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">كشف حساب العميل</h3>
                  <p className="text-sm text-gray-500">{selectedClient.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    setIsExportingPdf(true);
                    try {
                      const response = await clientsApi.downloadStatement(selectedClient.id, {
                        date_from: statementDateFrom,
                        date_to: statementDateTo,
                        include_info: statementIncludeInfo,
                        include_legal: statementIncludeLegal,
                      });
                      const url = window.URL.createObjectURL(new Blob([response.data]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `كشف-حساب-${selectedClient.name}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                      toast.success('تم تحميل كشف الحساب');
                    } catch {
                      toast.error('خطأ في تحميل كشف الحساب');
                    } finally {
                      setIsExportingPdf(false);
                    }
                  }}
                  disabled={isExportingPdf || loadingStatement}
                  className="btn bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {isExportingPdf ? (
                    <>
                      <span className="spinner w-4 h-4"></span>
                      جاري التصدير...
                    </>
                  ) : (
                    <>
                      <ArrowTrendingDownIcon className="w-5 h-5" />
                      تصدير PDF
                    </>
                  )}
                </button>
                <button onClick={() => setIsStatementOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filters bar */}
            <div className="px-6 py-3 border-b bg-gray-50 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">من:</label>
                <DateInput
                  value={statementDateFrom}
                  onChange={(v) => {
                    setStatementDateFrom(v);
                    if (v && statementDateTo) fetchStatementData(selectedClient.id, v, statementDateTo);
                  }}
                  placeholder="من تاريخ"
                  max={statementDateTo}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">إلى:</label>
                <DateInput
                  value={statementDateTo}
                  onChange={(v) => {
                    setStatementDateTo(v);
                    if (statementDateFrom && v) fetchStatementData(selectedClient.id, statementDateFrom, v);
                  }}
                  placeholder="إلى تاريخ"
                  min={statementDateFrom}
                />
              </div>
              <button
                onClick={() => fetchStatementData(selectedClient.id, statementDateFrom, statementDateTo)}
                className="btn btn-primary text-sm py-1.5"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                عرض
              </button>
              <div className="border-r h-6 mx-2" />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={statementIncludeInfo} onChange={e => setStatementIncludeInfo(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                معلومات العميل
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={statementIncludeLegal} onChange={e => setStatementIncludeLegal(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                معلومات قانونية
              </label>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingStatement ? (
                <div className="flex items-center justify-center py-16">
                  <div className="spinner"></div>
                </div>
              ) : statementData ? (
                <div className="max-w-4xl mx-auto space-y-4">
                  {/* Summary cards */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center border">
                      <p className="text-xs text-gray-500">الرصيد الافتتاحي</p>
                      <p className={`text-lg font-bold ${statementData.opening_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(statementData.opening_balance)}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                      <p className="text-xs text-gray-500">إجمالي الفواتير</p>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(statementData.total_somme)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                      <p className="text-xs text-gray-500">إجمالي المدفوعات</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(statementData.total_versement)}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
                      <p className="text-xs text-gray-500">الرصيد النهائي</p>
                      <p className={`text-lg font-bold ${statementData.closing_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(statementData.closing_balance)}
                      </p>
                    </div>
                  </div>

                  {/* Operations table */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800 text-white">
                          <tr>
                            <th className="px-3 py-2 text-center w-12">#</th>
                            <th className="px-3 py-2 text-right">كود العملية</th>
                            <th className="px-3 py-2 text-center">التاريخ</th>
                            <th className="px-3 py-2 text-center">النوع</th>
                            <th className="px-3 py-2 text-center">المبلغ</th>
                            <th className="px-3 py-2 text-center">الدفع</th>
                            <th className="px-3 py-2 text-center">الرصيد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {/* Opening balance row */}
                          <tr className="bg-gray-50 italic text-gray-500">
                            <td className="px-3 py-2 text-center"></td>
                            <td colSpan={3} className="px-3 py-2 text-right font-medium">الرصيد الافتتاحي</td>
                            <td className="px-3 py-2 text-center"></td>
                            <td className="px-3 py-2 text-center"></td>
                            <td className="px-3 py-2 text-center font-bold">{formatCurrency(statementData.opening_balance)}</td>
                          </tr>
                          {statementData.operations.map((op, idx) => (
                            <tr key={idx} className={`hover:bg-gray-50 ${op.type === 'versement' ? 'bg-green-50/30' : ''}`}>
                              <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                              <td className="px-3 py-2 font-mono text-sm">{op.code}</td>
                              <td className="px-3 py-2 text-center">{formatDate(op.date)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  op.type === 'facture' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {op.type === 'facture' ? 'فاتورة' : 'دفع'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">{op.somme > 0 ? formatCurrency(op.somme) : '-'}</td>
                              <td className="px-3 py-2 text-center text-green-600">{op.versement > 0 ? formatCurrency(op.versement) : '-'}</td>
                              <td className={`px-3 py-2 text-center font-bold ${op.credit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(op.credit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100 font-bold border-t-2">
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-right">المجموع</td>
                            <td className="px-3 py-2 text-center">{formatCurrency(statementData.total_somme)}</td>
                            <td className="px-3 py-2 text-center text-green-600">{formatCurrency(statementData.total_versement)}</td>
                            <td className={`px-3 py-2 text-center ${statementData.closing_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(statementData.closing_balance)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {statementData.operations.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <DocumentTextIcon className="w-12 h-12 mx-auto mb-3" />
                      <p>لا توجد عمليات في الفترة المحددة</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-3" />
                  <p>اختر فترة واضغط عرض</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
