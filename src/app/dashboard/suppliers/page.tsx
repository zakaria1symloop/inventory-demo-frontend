'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DateInput from '@/components/ui/DateInput';
import { suppliersApi, creditorsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
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
  ChevronDownIcon,
  ChevronUpIcon,
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
  const { t, locale, dir } = useLocale();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'has_debt' | 'no_debt'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [companyFilter, setCompanyFilter] = useState<'all' | 'has_company' | 'no_company'>('all');
  const [showFilters, setShowFilters] = useState(false);

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
      toast.error(t('purchases.suppLoadError'));
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
      toast.error(t('purchases.suppDetailsLoadError'));
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
        toast.success(t('purchases.supplierUpdateSuccess'));
      } else {
        await suppliersApi.create(formData);
        toast.success(t('purchases.supplierAddSuccess'));
      }
      handleCloseModal();
      fetchSuppliers();
    } catch (error) {
      toast.error(t('purchases.suppSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;
    try {
      await suppliersApi.delete(selectedSupplier.id);
      toast.success(t('purchases.supplierDeleteSuccess'));
      setIsDeleteOpen(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.suppDeleteErrorGeneric');
      toast.error(message);
    }
  };

  const formatCurrency = (value: number) => {
    const safeValue = Number(value) || 0;
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(safeValue);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ');
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
    <div className="space-y-4">
      {/* Header */}
      <PageHeader title={t('purchases.suppTitle')} subtitle={t('purchases.suppSubtitle')}>
        <Link
          href="/dashboard/purchases/creditors"
          className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <BanknotesIcon className="w-4 h-4" strokeWidth={1.8} />
          {t('purchases.supplierDebts')}
        </Link>
        <button onClick={handleOpenCreate} className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors">
          <PlusIcon className="w-4 h-4" />
          {t('purchases.addSupplier')}
          <kbd className={`bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`}>Insert</kbd>
        </button>
      </PageHeader>

      {/* Main KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { label: t('purchases.suppTotalSuppliers'), value: stats.totalSuppliers,             dot: 'metric-dot-neutral', currency: false },
          { label: t('purchases.suppActiveLabel'),    value: stats.activeSuppliers,            dot: 'metric-dot-green',   currency: false },
          { label: t('purchases.suppTotalDebts'),     value: formatCurrency(stats.totalDebt),  dot: 'metric-dot-red',     currency: true  },
          { label: t('purchases.suppHasDebtOnUs'),    value: stats.suppliersWithDebt,          dot: 'metric-dot-orange',  currency: false },
          { label: t('purchases.suppNewThisMonth'),   value: stats.newThisMonth,               dot: 'metric-dot-violet',  currency: false },
          { label: t('purchases.suppAvgDebt'),        value: formatCurrency(stats.avgDebt),    dot: 'metric-dot-blue',    currency: true  },
        ].map((s, i) => (
          <div key={i} className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className={`metric-dot ${s.dot}`} aria-hidden />
              <p className="metric-label truncate">{s.label}</p>
            </div>
            {s.currency ? (
              <p className="metric-value-currency">{s.value}</p>
            ) : (
              <p className="metric-value truncate">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Clickable Status quick filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          { onClick: () => { setStatusFilter('all'); setBalanceFilter('all'); },        active: statusFilter === 'all' && balanceFilter === 'all',  label: t('purchases.suppAll'),         count: stats.totalSuppliers },
          { onClick: () => { setStatusFilter('active'); setBalanceFilter('all'); },     active: statusFilter === 'active' && balanceFilter === 'all', label: t('purchases.suppActiveLabel'), count: stats.activeSuppliers },
          { onClick: () => { setStatusFilter('inactive'); setBalanceFilter('all'); },   active: statusFilter === 'inactive',                          label: t('purchases.suppDisabled'),    count: stats.inactiveSuppliers },
          { onClick: () => { setStatusFilter('all'); setBalanceFilter('has_debt'); },   active: balanceFilter === 'has_debt',                         label: t('purchases.suppHasDebtOnUs'), count: stats.suppliersWithDebt },
          { onClick: () => { setStatusFilter('all'); setBalanceFilter('no_debt'); },    active: balanceFilter === 'no_debt',                          label: t('purchases.suppWithoutDebt'), count: stats.suppliersWithoutDebt },
        ] as const).map((c, i) => (
          <button
            key={i}
            onClick={c.onClick}
            className={`px-3 py-1.5 text-[12px] font-semibold rounded-md whitespace-nowrap transition-colors ${
              c.active
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {c.label} <span className={`${c.active ? 'text-orange-200' : 'text-gray-400 dark:text-gray-500'} tnum`}>({c.count})</span>
          </button>
        ))}
      </div>

      {/* Filters and Search */}
      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('purchases.searchPlaceholder')}
        trailing={
          <>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-md transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <FunnelIcon className="w-3.5 h-3.5" />
              {t('purchases.filters')}
              {showFilters ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
            </button>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="text-[12px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold flex items-center gap-1">
                <XCircleIcon className="w-3.5 h-3.5" />
                {t('purchases.suppReset')}
              </button>
            )}
            <span className="text-[12px] text-gray-400 dark:text-gray-500 hidden sm:inline">
              {t('purchases.suppShowingCount').replace('{count}', String(filteredSuppliers.length)).replace('{total}', String(stats.totalSuppliers))}
            </span>
          </>
        }
      />

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="surface-pro p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="select text-[14px] py-2"
            >
              <option value="all">{t('purchases.suppAllStatuses')}</option>
              <option value="active">{t('purchases.suppActiveOnly')}</option>
              <option value="inactive">{t('purchases.suppInactiveOnly')}</option>
            </select>

            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as typeof balanceFilter)}
              className="select text-[14px] py-2"
            >
              <option value="all">{t('purchases.suppAllBalances')}</option>
              <option value="has_debt">{t('purchases.suppHasDebtFilter')}</option>
              <option value="no_debt">{t('purchases.suppWithoutDebtFilter')}</option>
            </select>

            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value as typeof companyFilter)}
              className="select text-[14px] py-2"
            >
              <option value="all">{t('purchases.suppCompanyName')}</option>
              <option value="has_company">{t('purchases.suppHasCompanyCount').replace('{count}', String(stats.withCompanyName))}</option>
              <option value="no_company">{t('purchases.suppNoCompanyName')}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-[12px] text-gray-600 dark:text-gray-400">{t('purchases.suppCreationDate')}</span>
            </div>
            <DateInput value={dateFrom} onChange={(v) => setDateFrom(v)} placeholder={t('purchases.suppFrom')} />
            <span className="text-gray-400 dark:text-gray-500">-</span>
            <DateInput value={dateTo} onChange={(v) => setDateTo(v)} placeholder={t('purchases.suppTo')} />
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th>{t('purchases.supplier')}</th>
              <th>{t('purchases.company')}</th>
              <th>{t('purchases.suppContactCol')}</th>
              <th className="text-center">{t('purchases.balance')}</th>
              <th className="text-center">{t('purchases.taxNumber')}</th>
              <th className="text-center">{t('purchases.status')}</th>
              <th className="text-center">{t('purchases.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  <TruckIcon className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p>{t('purchases.suppNoMatchingSuppliers')}</p>
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 dark:text-gray-300 font-semibold">{supplier.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 tnum">#{supplier.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {supplier.company_name ? (
                      <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200">
                        <BuildingOfficeIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        <span>{supplier.company_name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                    )}
                  </td>
                  <td>
                    <div className="space-y-1">
                      {supplier.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <PhoneIcon className="w-4 h-4" />
                          <span dir="ltr" className="tnum">{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span className="truncate max-w-[150px]">{supplier.email}</span>
                        </div>
                      )}
                      {!supplier.phone && !supplier.email && (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-200 tnum">
                      {(supplier.balance || 0) > 0 ? (
                        <>
                          <span className="metric-dot metric-dot-red" aria-hidden />
                          <ArrowTrendingUpIcon className="w-3.5 h-3.5 text-gray-400" />
                        </>
                      ) : (supplier.balance || 0) < 0 ? (
                        <>
                          <span className="metric-dot metric-dot-green" aria-hidden />
                          <ArrowTrendingDownIcon className="w-3.5 h-3.5 text-gray-400" />
                        </>
                      ) : (
                        <span className="metric-dot metric-dot-neutral" aria-hidden />
                      )}
                      {formatCurrency(Math.abs(supplier.balance || 0))}
                    </div>
                    {(supplier.balance || 0) > 0 && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{t('purchases.suppDebtOnUs')}</div>
                    )}
                    {(supplier.balance || 0) < 0 && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{t('purchases.suppCreditWithUs')}</div>
                    )}
                  </td>
                  <td className="text-center">
                    {supplier.tax_number ? (
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono tnum">{supplier.tax_number}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="text-center">
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                      <span className={`metric-dot ${supplier.is_active ? 'metric-dot-green' : 'metric-dot-neutral'}`} aria-hidden />
                      {supplier.is_active ? t('purchases.suppActiveStatus') : t('purchases.suppInactiveStatus')}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenDetails(supplier)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        title={t('purchases.suppViewDetails')}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(supplier)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        title={t('purchases.suppEdit')}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setIsDeleteOpen(true);
                        }}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        title={t('purchases.suppDelete')}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-bold dark:text-white">
                {selectedSupplier ? t('purchases.suppEditData') : t('purchases.suppAddNew')}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XMarkIcon className="w-5 h-5 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    {t('purchases.supplierName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="input w-full"
                    required
                    placeholder={t('purchases.supplierNamePlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('purchases.suppCompanyName')}</label>
                  <div className="relative">
                    <BuildingOfficeIcon className={`w-5 h-5 absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500`} />
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData(p => ({ ...p, company_name: e.target.value }))}
                      className={`input w-full ${dir === 'rtl' ? 'pr-10' : 'pl-10'}`}
                      placeholder={t('purchases.suppCompanyOrOrg')}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('purchases.suppPhoneNumber')}</label>
                  <div className="relative">
                    <PhoneIcon className={`w-5 h-5 absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500`} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value.replace(/[^\d+\s-]/g, '') }))}
                      className={`input w-full ${dir === 'rtl' ? 'pr-10' : 'pl-10'}`}
                      placeholder="0xxx xxx xxx"
                      dir="ltr"
                      inputMode="tel"
                      pattern="[\d+\s-]*"
                      maxLength={20}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('purchases.suppEmailLabel')}</label>
                  <div className="relative">
                    <EnvelopeIcon className={`w-5 h-5 absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500`} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      className={`input w-full ${dir === 'rtl' ? 'pr-10' : 'pl-10'}`}
                      placeholder="example@email.com"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('purchases.suppTaxNumberNIF')}</label>
                <div className="relative">
                  <IdentificationIcon className={`w-5 h-5 absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500`} />
                  <input
                    type="text"
                    value={formData.tax_number}
                    onChange={(e) => setFormData(p => ({ ...p, tax_number: e.target.value.replace(/[^\d]/g, '') }))}
                    className={`input w-full ${dir === 'rtl' ? 'pr-10' : 'pl-10'}`}
                    placeholder={t('purchases.taxNumber')}
                    dir="ltr"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={20}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('purchases.suppAddressLabel')}</label>
                <div className="relative">
                  <MapPinIcon className={`w-5 h-5 absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-3 text-gray-400 dark:text-gray-500`} />
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                    className={`input w-full ${dir === 'rtl' ? 'pr-10' : 'pl-10'}`}
                    rows={2}
                    placeholder={t('purchases.suppAddressPlaceholder')}
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">{t('purchases.suppActiveCheckbox')}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('purchases.suppInactiveNote')}</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
                  {t('purchases.suppCancel')}
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary">
                  {isSaving ? (
                    <>
                      <span className="spinner w-4 h-4"></span>
                      {t('purchases.suppSaving')}
                    </>
                  ) : selectedSupplier ? (
                    t('purchases.suppUpdateData')
                  ) : (
                    t('purchases.addSupplierBtn')
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <span className="text-xl font-bold text-purple-600">{selectedSupplier.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white">{selectedSupplier.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('purchases.suppDetailsAndTransactions')}</p>
                </div>
              </div>
              <button onClick={handleCloseDetails} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                <XMarkIcon className="w-5 h-5 dark:text-gray-400" />
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
                      <h4 className="font-bold mb-3 flex items-center gap-2 dark:text-white">
                        <UserIcon className="w-5 h-5 text-purple-600" />
                        {t('purchases.suppInfo')}
                      </h4>
                      <div className="space-y-2 text-sm">
                        {selectedSupplier.company_name && (
                          <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="dark:text-gray-200">{selectedSupplier.company_name}</span>
                          </div>
                        )}
                        {selectedSupplier.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span dir="ltr" className="dark:text-gray-200">{selectedSupplier.phone}</span>
                          </div>
                        )}
                        {selectedSupplier.email && (
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="dark:text-gray-200">{selectedSupplier.email}</span>
                          </div>
                        )}
                        {selectedSupplier.address && (
                          <div className="flex items-start gap-2">
                            <MapPinIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5" />
                            <span className="dark:text-gray-200">{selectedSupplier.address}</span>
                          </div>
                        )}
                        {selectedSupplier.tax_number && (
                          <div className="flex items-center gap-2">
                            <IdentificationIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="font-mono dark:text-gray-200">{selectedSupplier.tax_number}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400">{t('purchases.suppStatusLabel')}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedSupplier.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {selectedSupplier.is_active ? t('purchases.suppActiveStatus') : t('purchases.suppInactiveStatus')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
                      <h4 className="font-bold mb-3 flex items-center gap-2 dark:text-white">
                        <BanknotesIcon className="w-5 h-5 text-red-600" />
                        {t('purchases.suppFinancialStatus')}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">{t('purchases.suppCurrentBalance')}</span>
                          <span className={`text-xl font-bold ${
                            (selectedSupplier.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {formatCurrency(selectedSupplier.balance || 0)}
                          </span>
                        </div>
                        {(selectedSupplier.balance || 0) > 0 && (
                          <p className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                            {t('purchases.suppDebtDescription')}
                          </p>
                        )}
                        {supplierDetails.totals && (
                          <>
                            <hr className="dark:border-gray-700" />
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{t('purchases.suppTotalPurchasesLabel')}</span>
                              <span className="dark:text-gray-200">{formatCurrency(supplierDetails.totals.total_purchases || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{t('purchases.suppTotalPaidLabel')}</span>
                              <span className="text-green-600">{formatCurrency(supplierDetails.totals.total_paid || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{t('purchases.suppTotalRemainingLabel')}</span>
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
                      <h4 className="font-bold mb-3 flex items-center gap-2 dark:text-white">
                        <DocumentTextIcon className="w-5 h-5 text-red-600" />
                        {t('purchases.suppUnpaidInvoices').replace('{count}', String(supplierDetails.purchases.length))}
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-750">
                            <tr>
                              <th className="px-3 py-2 text-start dark:text-gray-400">{t('purchases.suppRefCol')}</th>
                              <th className="px-3 py-2 text-start dark:text-gray-400">{t('purchases.suppDateCol')}</th>
                              <th className="px-3 py-2 text-center dark:text-gray-400">{t('purchases.suppAmountCol')}</th>
                              <th className="px-3 py-2 text-center dark:text-gray-400">{t('purchases.suppPaidCol')}</th>
                              <th className="px-3 py-2 text-center dark:text-gray-400">{t('purchases.suppRemainingCol')}</th>
                              <th className="px-3 py-2 text-center dark:text-gray-400">{t('purchases.suppStatusCol')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y dark:divide-gray-700">
                            {supplierDetails.purchases.map((purchase) => (
                              <tr key={purchase.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-3 py-2">
                                  <Link
                                    href={`/dashboard/purchases/${purchase.id}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    {purchase.reference}
                                  </Link>
                                </td>
                                <td className="px-3 py-2 dark:text-gray-200">{formatDate(purchase.date)}</td>
                                <td className="px-3 py-2 text-center dark:text-gray-200">{formatCurrency(purchase.grand_total)}</td>
                                <td className="px-3 py-2 text-center text-green-600">{formatCurrency(purchase.paid_amount)}</td>
                                <td className="px-3 py-2 text-center text-red-600 font-medium">{formatCurrency(purchase.due_amount)}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    purchase.payment_status === 'paid'
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                      : purchase.payment_status === 'partial'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}>
                                    {purchase.payment_status === 'paid' ? t('purchases.suppPaidStatus') : purchase.payment_status === 'partial' ? t('purchases.suppPartialStatus') : t('purchases.suppUnpaidStatus')}
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
                      {t('purchases.suppNewPurchaseInvoice')}
                    </Link>
                    <button
                      onClick={() => {
                        handleCloseDetails();
                        handleOpenEdit(selectedSupplier);
                      }}
                      className="btn btn-secondary"
                    >
                      <PencilIcon className="w-5 h-5" />
                      {t('purchases.suppEditInfo')}
                    </button>
                    {(selectedSupplier.balance || 0) > 0 && (
                      <Link
                        href="/dashboard/purchases/creditors"
                        className="btn bg-red-500 text-white hover:bg-red-600"
                      >
                        <CurrencyDollarIcon className="w-5 h-5" />
                        {t('purchases.suppPayDebt')}
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {t('purchases.noData')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold mb-2 dark:text-white">{t('purchases.deleteSupplier')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('purchases.deleteSupplierMsg').replace('{name}', selectedSupplier.name)}
                <br />
                <span className="text-sm text-red-600 dark:text-red-400">{t('purchases.suppDeleteIrreversible')}</span>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="btn btn-secondary"
                >
                  {t('purchases.suppCancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  {t('purchases.suppYesDelete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
