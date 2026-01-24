'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { suppliersApi, creditorsApi } from '@/lib/api';
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
  BuildingOfficeIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MagnifyingGlassIcon,
  IdentificationIcon,
  TruckIcon,
  CalendarIcon,
  FunnelIcon,
  XCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';

interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  company_name?: string;
  tax_number?: string;
  balance: number;
  is_active: boolean;
  created_at: string;
}

interface SupplierPurchase {
  id: number;
  reference: string;
  date: string;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  payment_status: string;
}

interface SupplierDetails {
  supplier: Supplier;
  purchases: SupplierPurchase[];
  totals: {
    total_purchases: number;
    total_paid: number;
    total_remaining: number;
  };
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'has_debt' | 'no_debt'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [companyFilter, setCompanyFilter] = useState<'all' | 'has_company' | 'no_company'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierDetails, setSupplierDetails] = useState<SupplierDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    company_name: '',
    tax_number: '',
    is_active: true,
  });

  useEffect(() => {
    fetchSuppliers();
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

  const fetchSuppliers = async () => {
    try {
      const response = await suppliersApi.getAll({ per_page: 1000 });
      setSuppliers(response.data.data || response.data);
    } catch (error) {
      toast.error('خطأ في تحميل البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupplierDetails = async (supplierId: number) => {
    setLoadingDetails(true);
    try {
      const [supplierRes, debtRes] = await Promise.all([
        suppliersApi.getOne(supplierId),
        creditorsApi.getSupplierDebt(supplierId).catch(() => ({ data: { purchases: [], totals: {} } }))
      ]);

      setSupplierDetails({
        supplier: supplierRes.data,
        purchases: debtRes.data.purchases || [],
        totals: debtRes.data.totals || { total_purchases: 0, total_paid: 0, total_remaining: 0 }
      });
    } catch (error) {
      toast.error('خطأ في تحميل تفاصيل المورد');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      company_name: '',
      tax_number: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      company_name: supplier.company_name || '',
      tax_number: supplier.tax_number || '',
      is_active: supplier.is_active,
    });
    setIsModalOpen(true);
  };

  const handleOpenDetails = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailsOpen(true);
    fetchSupplierDetails(supplier.id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSupplier(null);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedSupplier(null);
    setSupplierDetails(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (selectedSupplier) {
        await suppliersApi.update(selectedSupplier.id, formData);
        toast.success('تم تحديث بيانات المورد بنجاح');
      } else {
        await suppliersApi.create(formData);
        toast.success('تم إضافة المورد بنجاح');
      }
      handleCloseModal();
      fetchSuppliers();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;
    try {
      await suppliersApi.delete(selectedSupplier.id);
      toast.success('تم حذف المورد بنجاح');
      setIsDeleteOpen(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'حدث خطأ أثناء الحذف';
      toast.error(message);
    }
  };

  const formatCurrency = (value: number) => {
    const safeValue = Number(value) || 0;
    return new Intl.NumberFormat('ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(safeValue);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-DZ');
  };

  // Statistics
  const stats = useMemo(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.is_active).length;
    const inactiveSuppliers = suppliers.filter(s => !s.is_active).length;
    const suppliersWithDebt = suppliers.filter(s => (Number(s.balance) || 0) > 0).length;
    const suppliersWithoutDebt = suppliers.filter(s => (Number(s.balance) || 0) <= 0).length;
    const totalDebt = suppliers.reduce((sum, s) => {
      const balance = Number(s.balance) || 0;
      return sum + (balance > 0 ? balance : 0);
    }, 0);
    const avgDebt = suppliersWithDebt > 0 ? totalDebt / suppliersWithDebt : 0;

    // New suppliers this month
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newThisMonth = suppliers.filter(s => {
      if (!s.created_at) return false;
      return new Date(s.created_at) >= thisMonth;
    }).length;

    // Suppliers with company name
    const withCompanyName = suppliers.filter(s => s.company_name && s.company_name.trim()).length;

    // Suppliers with tax number
    const withTaxNumber = suppliers.filter(s => s.tax_number && s.tax_number.trim()).length;

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      suppliersWithDebt,
      suppliersWithoutDebt,
      totalDebt,
      avgDebt,
      newThisMonth,
      withCompanyName,
      withTaxNumber,
    };
  }, [suppliers]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || balanceFilter !== 'all' ||
    dateFrom || dateTo || companyFilter !== 'all';

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBalanceFilter('all');
    setDateFrom('');
    setDateTo('');
    setCompanyFilter('all');
  };

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.tax_number?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && supplier.is_active) ||
        (statusFilter === 'inactive' && !supplier.is_active);

      const matchesBalance =
        balanceFilter === 'all' ||
        (balanceFilter === 'has_debt' && (supplier.balance || 0) > 0) ||
        (balanceFilter === 'no_debt' && (supplier.balance || 0) <= 0);

      // Date filter
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const createdAt = supplier.created_at ? new Date(supplier.created_at) : null;
        if (createdAt) {
          if (dateFrom && createdAt < new Date(dateFrom)) matchesDate = false;
          if (dateTo && createdAt > new Date(dateTo + 'T23:59:59')) matchesDate = false;
        } else {
          matchesDate = false;
        }
      }

      // Company filter
      let matchesCompany = true;
      if (companyFilter !== 'all') {
        const hasCompany = supplier.company_name && supplier.company_name.trim();
        if (companyFilter === 'has_company') matchesCompany = !!hasCompany;
        else if (companyFilter === 'no_company') matchesCompany = !hasCompany;
      }

      return matchesSearch && matchesStatus && matchesBalance && matchesDate && matchesCompany;
    });
  }, [suppliers, searchTerm, statusFilter, balanceFilter, dateFrom, dateTo, companyFilter]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> إضافة مورد جديد</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الموردين</h1>
          <p className="text-gray-500 mt-1">إدارة بيانات الموردين وحساباتهم</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/purchases/creditors"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <BanknotesIcon className="w-5 h-5" />
            الديون للموردين
          </Link>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <PlusIcon className="w-5 h-5" />
            إضافة مورد
            <kbd className="bg-blue-700 px-1.5 py-0.5 rounded text-xs mr-2">Insert</kbd>
          </button>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">إجمالي الموردين</p>
              <p className="text-xl font-bold text-blue-600">{stats.totalSuppliers}</p>
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
              <p className="text-xl font-bold text-green-600">{stats.activeSuppliers}</p>
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
              <p className="text-xs text-gray-600">لهم ديون علينا</p>
              <p className="text-xl font-bold text-orange-600">{stats.suppliersWithDebt}</p>
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
            <TruckIcon className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-bold text-gray-800">{stats.totalSuppliers}</span>
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
            <span className="text-lg font-bold text-gray-800">{stats.activeSuppliers}</span>
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
            <span className="text-lg font-bold text-gray-800">{stats.inactiveSuppliers}</span>
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
            <span className="text-lg font-bold text-gray-800">{stats.suppliersWithDebt}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">لهم ديون علينا</p>
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
            <span className="text-lg font-bold text-gray-800">{stats.suppliersWithoutDebt}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">بدون دين</p>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">الفلاتر</span>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mr-auto flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <XCircleIcon className="w-4 h-4" />
              إعادة تعيين
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، الشركة، الهاتف..."
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
            <option value="has_debt">له دين علينا</option>
            <option value="no_debt">بدون دين</option>
          </select>

          {/* Company Filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value as typeof companyFilter)}
            className="select"
          >
            <option value="all">اسم الشركة</option>
            <option value="has_company">لديه اسم شركة ({stats.withCompanyName})</option>
            <option value="no_company">بدون اسم شركة</option>
          </select>
        </div>

        {/* Date Range */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">تاريخ الإنشاء:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input text-sm"
              placeholder="من"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input text-sm"
              placeholder="إلى"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500 mb-4 flex items-center justify-between">
          <span>عرض {filteredSuppliers.length} من {stats.totalSuppliers} مورد</span>
          {hasActiveFilters && (
            <span className="text-blue-600">
              ({stats.totalSuppliers - filteredSuppliers.length} مخفي بالفلاتر)
            </span>
          )}
        </div>

        {/* Suppliers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">المورد</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">الشركة</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">التواصل</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الرصيد</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الرقم الضريبي</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الحالة</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <TruckIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>لا يوجد موردين مطابقين للبحث</p>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-bold">{supplier.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                          <div className="text-xs text-gray-500">#{supplier.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {supplier.company_name ? (
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                          <span>{supplier.company_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <PhoneIcon className="w-4 h-4" />
                            <span dir="ltr">{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <EnvelopeIcon className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">{supplier.email}</span>
                          </div>
                        )}
                        {!supplier.phone && !supplier.email && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                        (supplier.balance || 0) > 0
                          ? 'bg-red-100 text-red-700'
                          : (supplier.balance || 0) < 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {(supplier.balance || 0) > 0 ? (
                          <ArrowTrendingUpIcon className="w-4 h-4" />
                        ) : (supplier.balance || 0) < 0 ? (
                          <ArrowTrendingDownIcon className="w-4 h-4" />
                        ) : null}
                        {formatCurrency(Math.abs(supplier.balance || 0))}
                      </div>
                      {(supplier.balance || 0) > 0 && (
                        <div className="text-xs text-red-600 mt-1">له دين علينا</div>
                      )}
                      {(supplier.balance || 0) < 0 && (
                        <div className="text-xs text-green-600 mt-1">لنا رصيد عنده</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {supplier.tax_number ? (
                        <span className="text-sm text-gray-600 font-mono">{supplier.tax_number}</span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        supplier.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {supplier.is_active ? (
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDetails(supplier)}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(supplier)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setIsDeleteOpen(true);
                          }}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
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
                {selectedSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم المورد <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="input w-full"
                    required
                    placeholder="أدخل اسم المورد"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة</label>
                  <div className="relative">
                    <BuildingOfficeIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData(p => ({ ...p, company_name: e.target.value }))}
                      className="input w-full pr-10"
                      placeholder="اسم الشركة أو المؤسسة"
                    />
                  </div>
                </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي (NIF)</label>
                <div className="relative">
                  <IdentificationIcon className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.tax_number}
                    onChange={(e) => setFormData(p => ({ ...p, tax_number: e.target.value }))}
                    className="input w-full pr-10"
                    placeholder="الرقم الضريبي"
                    dir="ltr"
                  />
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
                    placeholder="أدخل عنوان المورد"
                  />
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
                    <span className="font-medium text-gray-700">مورد نشط</span>
                    <p className="text-xs text-gray-500">المورد غير النشط لن يظهر في قوائم الاختيار</p>
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
                  ) : selectedSupplier ? (
                    'تحديث البيانات'
                  ) : (
                    'إضافة المورد'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Details Modal */}
      {isDetailsOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-purple-600">{selectedSupplier.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedSupplier.name}</h3>
                  <p className="text-sm text-gray-500">تفاصيل المورد والمعاملات</p>
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
              ) : supplierDetails ? (
                <div className="space-y-6">
                  {/* Supplier Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-purple-600" />
                        معلومات المورد
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedSupplier.company_name && (
                          <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                            <span>{selectedSupplier.company_name}</span>
                          </div>
                        )}
                        {selectedSupplier.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                            <span dir="ltr">{selectedSupplier.phone}</span>
                          </div>
                        )}
                        {selectedSupplier.email && (
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                            <span>{selectedSupplier.email}</span>
                          </div>
                        )}
                        {selectedSupplier.address && (
                          <div className="flex items-start gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                            <span>{selectedSupplier.address}</span>
                          </div>
                        )}
                        {selectedSupplier.tax_number && (
                          <div className="flex items-center gap-2">
                            <IdentificationIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-mono">{selectedSupplier.tax_number}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <span className="text-gray-500">الحالة:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedSupplier.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {selectedSupplier.is_active ? 'نشط' : 'معطل'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <BanknotesIcon className="w-5 h-5 text-red-600" />
                        الحالة المالية
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">الرصيد الحالي:</span>
                          <span className={`text-xl font-bold ${
                            (selectedSupplier.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(selectedSupplier.balance || 0)}
                          </span>
                        </div>
                        {(selectedSupplier.balance || 0) > 0 && (
                          <p className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
                            هذا المبلغ مستحق للمورد (دين علينا)
                          </p>
                        )}
                        {supplierDetails.totals && (
                          <>
                            <hr />
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">إجمالي المشتريات:</span>
                              <span>{formatCurrency(supplierDetails.totals.total_purchases || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">إجمالي المدفوع:</span>
                              <span className="text-green-600">{formatCurrency(supplierDetails.totals.total_paid || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">إجمالي المتبقي:</span>
                              <span className="text-red-600">{formatCurrency(supplierDetails.totals.total_remaining || 0)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unpaid Purchases */}
                  {supplierDetails.purchases && supplierDetails.purchases.length > 0 && (
                    <div className="card">
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-red-600" />
                        فواتير الشراء غير المسددة ({supplierDetails.purchases.length})
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
                            {supplierDetails.purchases.map((purchase) => (
                              <tr key={purchase.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  <Link
                                    href={`/dashboard/purchases/${purchase.id}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {purchase.reference}
                                  </Link>
                                </td>
                                <td className="px-3 py-2">{formatDate(purchase.date)}</td>
                                <td className="px-3 py-2 text-center">{formatCurrency(purchase.grand_total)}</td>
                                <td className="px-3 py-2 text-center text-green-600">{formatCurrency(purchase.paid_amount)}</td>
                                <td className="px-3 py-2 text-center text-red-600 font-medium">{formatCurrency(purchase.due_amount)}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    purchase.payment_status === 'paid'
                                      ? 'bg-green-100 text-green-700'
                                      : purchase.payment_status === 'partial'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                  }`}>
                                    {purchase.payment_status === 'paid' ? 'مدفوع' : purchase.payment_status === 'partial' ? 'جزئي' : 'غير مدفوع'}
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
                      href={`/dashboard/purchases/new?supplier_id=${selectedSupplier.id}`}
                      className="btn btn-primary"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                      فاتورة شراء جديدة
                    </Link>
                    <button
                      onClick={() => {
                        handleCloseDetails();
                        handleOpenEdit(selectedSupplier);
                      }}
                      className="btn btn-secondary"
                    >
                      <PencilIcon className="w-5 h-5" />
                      تعديل البيانات
                    </button>
                    {(selectedSupplier.balance || 0) > 0 && (
                      <Link
                        href="/dashboard/purchases/creditors"
                        className="btn bg-red-500 text-white hover:bg-red-600"
                      >
                        <CurrencyDollarIcon className="w-5 h-5" />
                        تسديد دين
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
      {isDeleteOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold mb-2">حذف المورد</h3>
              <p className="text-gray-600 mb-6">
                هل أنت متأكد من حذف المورد "{selectedSupplier.name}"؟
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
                  نعم، حذف المورد
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
