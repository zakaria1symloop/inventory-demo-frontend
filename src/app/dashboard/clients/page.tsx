'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientsApi, clientCategoriesApi, salesApi, usersApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';

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
  QuestionMarkCircleIcon,
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
  code?: string;
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
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
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
  const [inactivePeriod, setInactivePeriod] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [showTour, setShowTour] = useState(false);
  const [showModalTour, setShowModalTour] = useState(false);

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
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});

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
  }, [inactivePeriod]);

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
      const clientParams: Record<string, unknown> = { per_page: 1000 };
      if (inactivePeriod) clientParams.no_purchase_days = inactivePeriod;
      const [clientsRes, categoriesRes, sellersRes, warehousesRes] = await Promise.all([
        clientsApi.getAll(clientParams),
        clientCategoriesApi.getAll(),
        usersApi.getAll({ per_page: 1000 }).catch(() => ({ data: { data: [] } })),
        warehousesApi.getAll().catch(() => ({ data: [] })),
      ]);
      setClients(clientsRes.data.data || clientsRes.data);
      setClientCategories(categoriesRes.data);
      setSellers(sellersRes.data.data || sellersRes.data || []);
      setWarehousesList(warehousesRes.data.data || warehousesRes.data || []);
    } catch (error) {
      toast.error(t('clients.loadError'));
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
      toast.error(t('clients.detailsLoadError'));
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
      toast.error(t('clients.statementLoadError'));
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

  const handleFieldChange = (field: string, value: string | boolean) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
    setFormErrors({});
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
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : 0,
      client_category_id: formData.client_category_id ? parseInt(formData.client_category_id) : null,
      warehouse_id: formData.warehouse_id ? parseInt(formData.warehouse_id) : null,
    };

    setFormErrors({});
    try {
      if (selectedClient) {
        await clientsApi.update(selectedClient.id, data);
        toast.success(t('clients.clientUpdated'));
      } else {
        await clientsApi.create(data);
        toast.success(t('clients.clientAdded'));
      }
      handleCloseModal();
      fetchClients();
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        toast.error(t('clients.saveError'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    try {
      await clientsApi.delete(selectedClient.id);
      toast.success(t('clients.clientDeleted'));
      setIsDeleteOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      const message = error.response?.data?.message || t('clients.deleteError');
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
      toast.error(error.response?.data?.message || t('clients.transferError'));
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
      toast.error(error.response?.data?.message || t('clients.copyError'));
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
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ');
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
    dateFrom || dateTo || creditLimitFilter !== 'all' || sourceFilter !== 'all' || sellerFilter || warehouseFilter || copyFilter !== 'all' || inactivePeriod;

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
    setInactivePeriod('');
  };

  // Filtered clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const clientsTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="clients-shortcuts"]',
      title: t('clients.tourShortcutsTitle'),
      desc: t('clients.tourShortcutsDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="clients-header"]',
      title: t('clients.tourHeaderTitle'),
      desc: t('clients.tourHeaderDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="clients-kpis"]',
      title: t('clients.tourKpisTitle'),
      desc: t('clients.tourKpisDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="clients-status"]',
      title: t('clients.tourStatusTitle'),
      desc: t('clients.tourStatusDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="clients-filters"]',
      title: t('clients.tourFiltersTitle'),
      desc: t('clients.tourFiltersDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="clients-table"]',
      title: t('clients.tourTableTitle'),
      desc: t('clients.tourTableDesc'),
      position: 'top' as const,
    },
  ], [t]);

  const modalTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="modal-header"]',
      title: t('clients.modalTourHeaderTitle'),
      desc: t('clients.modalTourHeaderDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="modal-basic"]',
      title: t('clients.modalTourBasicTitle'),
      desc: t('clients.modalTourBasicDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="modal-financial"]',
      title: t('clients.modalTourFinancialTitle'),
      desc: t('clients.modalTourFinancialDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="modal-legal"]',
      title: t('clients.modalTourLegalTitle'),
      desc: t('clients.modalTourLegalDesc'),
      position: 'top' as const,
    },
    {
      target: '[data-tour="modal-status"]',
      title: t('clients.modalTourStatusTitle'),
      desc: t('clients.modalTourStatusDesc'),
      position: 'top' as const,
    },
    {
      target: '[data-tour="modal-submit"]',
      title: t('clients.modalTourSubmitTitle'),
      desc: t('clients.modalTourSubmitDesc'),
      position: 'top' as const,
    },
  ], [t]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div data-tour="clients-header">
        <PageHeader title={t('clients.title')} subtitle={t('clients.subtitle')}>
          {/* View toggle — neutral segmented control */}
          <div className="inline-flex bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <TableCellsIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
              {t('clients.tableView')}
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
              {t('clients.mapView')}
            </button>
          </div>
          <button
            onClick={() => setShowTour(true)}
            className="btn btn-secondary text-[13px] h-8 px-3"
            title={t('clients.guidedTour')}
          >
            <QuestionMarkCircleIcon className="w-4 h-4" strokeWidth={1.8} />
            <span className="hidden md:inline">{t('clients.guidedTour')}</span>
          </button>
          <Link
            href="/dashboard/sales/debtors"
            className="btn btn-secondary text-[13px] h-8 px-3"
          >
            <BanknotesIcon className="w-4 h-4" strokeWidth={1.8} />
            <span className="hidden md:inline">{t('clients.outstandingDebts')}</span>
          </Link>
          {selectedClientIds.size > 0 && (
            <>
              <button
                onClick={() => setShowTransferModal(true)}
                className="btn btn-secondary text-[13px] h-8 px-3"
              >
                {t('clients.transferClients', { count: selectedClientIds.size })}
              </button>
              <button
                onClick={() => setShowCopyModal(true)}
                className="btn btn-secondary text-[13px] h-8 px-3"
              >
                {t('clients.copyClients', { count: selectedClientIds.size })}
              </button>
            </>
          )}
          <button onClick={handleOpenCreate} className="btn btn-primary text-[13px] h-8 px-3">
            <PlusIcon className="w-4 h-4" strokeWidth={2} />
            {t('clients.addClient')}
          </button>
        </PageHeader>
      </div>

      {/* KPI Strip — restrained metric tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5" data-tour="clients-kpis">
        {[
          { label: t('clients.totalClients'),  value: stats.totalClients,                 dot: 'metric-dot-neutral', currency: false },
          { label: t('clients.activeClients'), value: stats.activeClients,                dot: 'metric-dot-green',   currency: false },
          { label: t('clients.totalDebts'),    value: formatCurrency(stats.totalDebt),    dot: 'metric-dot-red',     currency: true  },
          { label: t('clients.withDebts'),     value: stats.clientsWithDebt,              dot: 'metric-dot-orange',  currency: false },
          { label: t('clients.newThisMonth'),  value: stats.newThisMonth,                 dot: 'metric-dot-violet',  currency: false },
          { label: t('clients.avgDebt'),       value: formatCurrency(stats.avgDebt),      dot: 'metric-dot-blue',    currency: true  },
        ].map((s, i) => (
          <div key={i} className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className={`metric-dot ${s.dot}`} aria-hidden />
              <p className="metric-label truncate">{s.label}</p>
            </div>
            {s.currency ? (
              <p className="metric-value-currency">{s.value}</p>
            ) : (
              <p className="metric-value tnum truncate">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Status Filter Strip — quiet chip toggles */}
      <div className="flex flex-wrap items-center gap-2" data-tour="clients-status">
        {[
          { label: t('clients.all'),            count: stats.totalClients,       dot: 'metric-dot-neutral', active: statusFilter === 'all' && balanceFilter === 'all',     onClick: () => { setStatusFilter('all'); setBalanceFilter('all'); } },
          { label: t('clients.activeLabel'),    count: stats.activeClients,      dot: 'metric-dot-green',   active: statusFilter === 'active' && balanceFilter === 'all',  onClick: () => { setStatusFilter('active'); setBalanceFilter('all'); } },
          { label: t('clients.disabledLabel'),  count: stats.inactiveClients,    dot: 'metric-dot-neutral', active: statusFilter === 'inactive',                            onClick: () => { setStatusFilter('inactive'); setBalanceFilter('all'); } },
          { label: t('clients.hasDebt'),        count: stats.clientsWithDebt,    dot: 'metric-dot-red',     active: balanceFilter === 'has_debt',                           onClick: () => { setStatusFilter('all'); setBalanceFilter('has_debt'); } },
          { label: t('clients.noDebt'),         count: stats.clientsWithoutDebt, dot: 'metric-dot-green',   active: balanceFilter === 'no_debt',                            onClick: () => { setStatusFilter('all'); setBalanceFilter('no_debt'); } },
        ].map((chip, i) => (
          <button
            key={i}
            onClick={chip.onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[12px] font-medium transition-colors ${
              chip.active
                ? 'border-gray-900 dark:border-gray-100 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <span className={`metric-dot ${chip.dot}`} aria-hidden />
            <span>{chip.label}</span>
            <span className="tnum opacity-70">{chip.count}</span>
          </button>
        ))}
      </div>

      {/* Filters — collapsible quiet bar */}
      <div data-tour="clients-filters">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FunnelIcon className="w-4 h-4 text-gray-500" strokeWidth={1.8} />
            {t('clients.filters')}
            {hasActiveFilters && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-400">
                <span className="metric-dot metric-dot-blue" aria-hidden />
                {t('clients.filtersActive')}
              </span>
            )}
            {showFilters ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
            )}
          </button>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <XCircleIcon className="w-3.5 h-3.5" />
                {t('clients.resetFilters')}
              </button>
            )}
            <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">
              {t('clients.countOfTotal', { count: filteredClients.length, total: stats.totalClients })}
            </span>
          </div>
        </div>

        {showFilters && (
          <FilterBar
            search={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={t('clients.searchPlaceholder')}
          >
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="select text-[14px] py-2">
              <option value="all">{t('clients.allStatuses')}</option>
              <option value="active">{t('clients.activeOnly')}</option>
              <option value="inactive">{t('clients.disabledOnly')}</option>
            </select>
            <select value={balanceFilter} onChange={(e) => setBalanceFilter(e.target.value as typeof balanceFilter)} className="select text-[14px] py-2">
              <option value="all">{t('clients.allBalances')}</option>
              <option value="has_debt">{t('clients.hasDebtFilter')}</option>
              <option value="no_debt">{t('clients.noDebtFilter')}</option>
            </select>
            <select value={creditLimitFilter} onChange={(e) => setCreditLimitFilter(e.target.value as typeof creditLimitFilter)} className="select text-[14px] py-2">
              <option value="all">{t('clients.creditLimit')}</option>
              <option value="has_limit">{t('clients.hasCreditLimit')}</option>
              <option value="no_limit">{t('clients.noCreditLimit')}</option>
              <option value="exceeded">{t('clients.exceededLimit', { count: stats.exceededCreditLimit })}</option>
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)} className="select text-[14px] py-2">
              <option value="all">{t('clients.allSources')}</option>
              <option value="web">{t('clients.fromPlatform')}</option>
              <option value="app">{t('clients.fromApp')}</option>
            </select>
            <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="select text-[14px] py-2">
              <option value="">{t('clients.allUsers')}</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>{seller.name} ({seller.role === 'admin' ? t('clients.roleAdmin') : seller.role === 'seller' ? t('clients.roleSeller') : seller.role === 'livreur' ? t('clients.roleDriver') : seller.role === 'cashvan' ? t('clients.roleCashvan') : seller.role})</option>
              ))}
            </select>
            <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="select text-[14px] py-2">
              <option value="">{t('clients.allWarehouses')}</option>
              <option value="none">{t('clients.noWarehouse')}</option>
              {warehousesList.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <select value={copyFilter} onChange={(e) => setCopyFilter(e.target.value as typeof copyFilter)} className="select text-[14px] py-2">
              <option value="all">{t('clients.allCopyFilter')}</option>
              <option value="copies">{t('clients.copiesOnly')}</option>
              <option value="originals">{t('clients.originalsOnly')}</option>
            </select>
            <select
              value={inactivePeriod}
              onChange={(e) => setInactivePeriod(e.target.value)}
              className="select text-[14px] py-2"
            >
              <option value="">{t('clients.allActivityFilter')}</option>
              <option value="30">{t('clients.inactiveSince30')}</option>
              <option value="60">{t('clients.inactiveSince60')}</option>
              <option value="90">{t('clients.inactiveSince90')}</option>
              <option value="180">{t('clients.inactiveSince180')}</option>
              <option value="365">{t('clients.inactiveSince365')}</option>
            </select>
            <DateInput value={dateFrom} onChange={(v) => setDateFrom(v)} placeholder={t('clients.from')} />
            <DateInput value={dateTo} onChange={(v) => setDateTo(v)} placeholder={t('clients.to')} />
          </FilterBar>
        )}
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="surface-pro overflow-hidden">
          <Suspense fallback={<div className="h-[550px] bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><div className="spinner"></div></div>}>
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

      {/* Table */}
      {viewMode === 'table' && (
        <div data-tour="clients-table" className="table-pro-wrap">
          <table className="table-pro compact">
            <thead>
              <tr>
                <th className="text-center" style={{ width: '2.5rem' }}>
                  <input
                    type="checkbox"
                    checked={filteredClients.length > 0 && selectedClientIds.size === filteredClients.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-gray-700 rounded"
                  />
                </th>
                <th className="text-start">{t('clients.clientCol')}</th>
                <th className="text-start">{t('clients.contactCol')}</th>
                <th className="text-start">{t('clients.warehouseCol')}</th>
                <th className="text-end">{t('clients.balanceCol')}</th>
                <th className="text-end">{t('clients.creditLimitCol')}</th>
                <th className="text-start">{t('clients.statusCol')}</th>
                <th className="text-start">{t('clients.sourceCol')}</th>
                <th className="text-end">{t('clients.actionsCol')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="t-empty">
                    <div className="flex flex-col items-center gap-2 py-6">
                      <UserGroupIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                      <p className="text-[13px] font-medium text-gray-500 dark:text-gray-400">{t('clients.noMatchingClients')}</p>
                      <p className="text-[12px] text-gray-400 dark:text-gray-500">{t('clients.tryChangingFilters')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const totalDebt = Number(client.combined_debt) || 0;
                  const salesDebt = Number(client.sales_debt) || 0;
                  const deliveryDebt = Number(client.delivery_debt) || 0;
                  const SourceIcon = client.source === 'app' ? DevicePhoneMobileIcon : ComputerDesktopIcon;
                  const sourceDot = client.source === 'app' ? 'metric-dot-violet' : 'metric-dot-blue';
                  const sourceText = client.source === 'app' ? t('clients.appSource') : t('clients.platformSource');
                  return (
                    <tr key={client.id} className={selectedClientIds.has(client.id) ? 'bg-gray-50 dark:bg-gray-800/60' : ''}>
                      <td className="text-center">
                        <input
                          type="checkbox"
                          checked={selectedClientIds.has(client.id)}
                          onChange={() => toggleClientSelection(client.id)}
                          className="w-4 h-4 accent-gray-700 rounded"
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-700 dark:text-gray-200 font-semibold text-[12px]">{client.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-[13px]">{client.name}</div>
                            <div className="flex items-center gap-1 flex-wrap mt-0.5">
                              {client.code && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{client.code}</span>
                              )}
                              {client.client_category && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                                  {client.client_category.name}
                                </span>
                              )}
                              {client.copied_from && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-600 dark:text-gray-400"
                                  title={t('clients.copyFrom', { name: client.original_client?.name || `#${client.copied_from}` })}
                                >
                                  <span className="metric-dot metric-dot-orange" aria-hidden />
                                  {t('clients.copy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-700 dark:text-gray-300">
                              <PhoneIcon className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.7} />
                              <span dir="ltr">{client.phone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400">
                              <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.7} />
                              <span className="truncate max-w-[140px]">{client.email}</span>
                            </div>
                          )}
                          {!client.phone && !client.email && (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {client.warehouse ? (
                          <span className="text-[12px] text-gray-700 dark:text-gray-300">{client.warehouse.name}</span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="text-end tnum">
                        {totalDebt > 0 ? (
                          <div className="inline-flex flex-col items-end">
                            <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                              <span className="metric-dot metric-dot-red" aria-hidden />
                              {formatCurrency(totalDebt)}
                            </span>
                            {(salesDebt > 0 || deliveryDebt > 0) && (
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                {salesDebt > 0 && <div>{t('clients.salesDebt', { amount: formatCurrency(salesDebt) })}</div>}
                                {deliveryDebt > 0 && <div>{t('clients.deliveryDebt', { amount: formatCurrency(deliveryDebt) })}</div>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">{formatCurrency(totalDebt)}</span>
                        )}
                      </td>
                      <td className="text-end tnum">
                        {client.credit_limit ? (
                          <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300">{formatCurrency(client.credit_limit)}</span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                          <span className={`metric-dot ${client.is_active ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                          {client.is_active ? t('clients.active') : t('clients.disabled')}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                            <span className={`metric-dot ${sourceDot}`} aria-hidden />
                            <SourceIcon className="w-3.5 h-3.5" strokeWidth={1.7} />
                            {sourceText}
                          </span>
                          {client.creator && (
                            <span className="text-[10.5px] text-gray-500 dark:text-gray-400 ms-3.5">{client.creator.name}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            onClick={() => handleOpenDetails(client)}
                            className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={t('clients.viewDetails')}
                          >
                            <EyeIcon className="w-4 h-4" strokeWidth={1.7} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={t('clients.edit')}
                          >
                            <PencilIcon className="w-4 h-4" strokeWidth={1.7} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title={t('clients.delete')}
                          >
                            <TrashIcon className="w-4 h-4" strokeWidth={1.7} />
                          </button>
                          {client.copied_from && (
                            <>
                              <button
                                onClick={async () => {
                                  if (!confirm(t('clients.cancelCopyConfirm', { name: client.name }))) return;
                                  try {
                                    await clientsApi.cancelCopy(client.id);
                                    toast.success(t('clients.copyCancelled'));
                                    fetchClients();
                                  } catch (err: any) {
                                    toast.error(err.response?.data?.message || t('clients.genericError'));
                                  }
                                }}
                                className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title={t('clients.cancelCopy')}
                              >
                                <XCircleIcon className="w-4 h-4" strokeWidth={1.7} />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await clientsApi.removeCopyFlag(client.id);
                                    toast.success(t('clients.convertedToNormal'));
                                    fetchClients();
                                  } catch (err: any) {
                                    toast.error(err.response?.data?.message || t('clients.genericError'));
                                  }
                                }}
                                className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title={t('clients.convertToNormal')}
                              >
                                <CheckCircleIcon className="w-4 h-4" strokeWidth={1.7} />
                              </button>
                            </>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200/80 dark:border-gray-700">

            {/* Header — Sharp Ledger style */}
            <div className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-200/80 dark:border-gray-700 px-6 py-4 flex-shrink-0" data-tour="modal-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center">
                    {selectedClient ? <PencilIcon className="w-5 h-5 text-blue-600" /> : <UserPlusIcon className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
                      {selectedClient ? t('clients.editClientData') : t('clients.addNewClientTitle')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {selectedClient ? t('clients.updateProfile', { name: selectedClient.name }) : t('clients.fillDataForNewClient')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModalTour(true)}
                    className="w-8 h-8 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center justify-center transition-colors"
                    title={t('clients.tourBtn')}
                  >
                    <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400" />
                  </button>
                  <button onClick={handleCloseModal} className="w-8 h-8 rounded-lg hover:bg-gray-200/60 flex items-center justify-center transition-colors">
                    <XMarkIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-6">

                {/* ═══ Section 01: Basic Info ═══ */}
                <div data-tour="modal-basic">
                  <div className="flex items-center gap-2 mb-4">
                    <UserIcon className="w-4 h-4 text-blue-500" />
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('clients.basicInfo')}</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                        {t('clients.clientName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        className={`input w-full ${formErrors.name ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                        required
                        placeholder={t('clients.clientNamePlaceholder')}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.name[0]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.phone')}</label>
                        <div className="relative">
                          <PhoneIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleFieldChange('phone', e.target.value.replace(/[^\d+\s-]/g, ''))}
                            className={`input w-full pr-9 ${formErrors.phone ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                            placeholder="0xxx xxx xxx"
                            dir="ltr"
                            inputMode="tel"
                            pattern="[\d+\s-]*"
                            maxLength={20}
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.phone[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.email')}</label>
                        <div className="relative">
                          <EnvelopeIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            className={`input w-full pr-9 ${formErrors.email ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                            placeholder="example@email.com"
                            dir="ltr"
                          />
                        </div>
                        {formErrors.email && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.email[0]}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.address')}</label>
                      <div className="relative">
                        <MapPinIcon className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                        <textarea
                          value={formData.address}
                          onChange={(e) => handleFieldChange('address', e.target.value)}
                          className={`input w-full pr-9 ${formErrors.address ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                          rows={2}
                          placeholder={t('clients.addressPlaceholder')}
                        />
                      </div>
                      {formErrors.address && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.address[0]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.latitude')} <span className="text-gray-400 text-[11px]">GPS</span></label>
                        <input
                          type="number"
                          value={formData.gps_lat}
                          onChange={(e) => handleFieldChange('gps_lat', e.target.value)}
                          className={`input w-full ${formErrors.gps_lat ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                          step="any"
                          placeholder="34.8449"
                          dir="ltr"
                        />
                        {formErrors.gps_lat && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.gps_lat[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.longitude')} <span className="text-gray-400 text-[11px]">GPS</span></label>
                        <input
                          type="number"
                          value={formData.gps_lng}
                          onChange={(e) => handleFieldChange('gps_lng', e.target.value)}
                          className={`input w-full ${formErrors.gps_lng ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                          step="any"
                          placeholder="5.7248"
                          dir="ltr"
                        />
                        {formErrors.gps_lng && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.gps_lng[0]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* ═══ Section 02: Financial & Classification ═══ */}
                <div data-tour="modal-financial">
                  <div className="flex items-center gap-2 mb-4">
                    <BanknotesIcon className="w-4 h-4 text-amber-500" />
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('clients.financialAndClassification')}</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.creditLimitLabel')}</label>
                      <div className="relative">
                        <CurrencyDollarIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="number"
                          value={formData.credit_limit}
                          onChange={(e) => handleFieldChange('credit_limit', e.target.value)}
                          className={`input w-full pr-9 ${formErrors.credit_limit ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                          min="0"
                          placeholder={t('clients.creditLimitPlaceholder')}
                          dir="ltr"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1">{t('clients.creditLimitHint')}</p>
                      {formErrors.credit_limit && (
                        <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.credit_limit[0]}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.clientCategory')}</label>
                        <select
                          value={formData.client_category_id}
                          onChange={(e) => handleFieldChange('client_category_id', e.target.value)}
                          className={`select w-full ${formErrors.client_category_id ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                        >
                          <option value="">{t('clients.noCategory')}</option>
                          {clientCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} {cat.description ? `- ${cat.description}` : ''} {cat.is_default ? t('clients.sellingPrice') : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-gray-400 mt-1">{t('clients.categoryHint')}</p>
                        {formErrors.client_category_id && (
                          <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.client_category_id[0]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.warehouse')}</label>
                        <select
                          value={formData.warehouse_id}
                          onChange={(e) => handleFieldChange('warehouse_id', e.target.value)}
                          className={`select w-full ${formErrors.warehouse_id ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                        >
                          <option value="">{t('clients.noWarehouseOption')}</option>
                          {warehousesList.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                        <p className="text-[11px] text-gray-400 mt-1">{t('clients.warehouseHint')}</p>
                        {formErrors.warehouse_id && (
                          <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.warehouse_id[0]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                {/* ═══ Section 03: Legal Documents ═══ */}
                <div data-tour="modal-legal">
                  <div className="flex items-center gap-2 mb-4">
                    <DocumentTextIcon className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('clients.legalInfo')}</h4>
                    <span className="text-[10px] font-normal text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{t('clients.optional')}</span>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.rcLabel')}</label>
                        <input type="text" value={formData.rc} onChange={(e) => handleFieldChange('rc', e.target.value.replace(/[^\dA-Za-z/-]/g, ''))} className={`input w-full ${formErrors.rc ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="00/00-0000000B00" maxLength={30} />
                        {formErrors.rc && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.rc[0]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.nifLabel')}</label>
                        <input type="text" value={formData.nif} onChange={(e) => handleFieldChange('nif', e.target.value.replace(/[^\d]/g, ''))} className={`input w-full ${formErrors.nif ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="000000000000000" inputMode="numeric" pattern="\d*" maxLength={20} />
                        {formErrors.nif && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.nif[0]}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.aiLabel')}</label>
                        <input type="text" value={formData.ai} onChange={(e) => handleFieldChange('ai', e.target.value.replace(/[^\d]/g, ''))} className={`input w-full ${formErrors.ai ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="00000000000" inputMode="numeric" pattern="\d*" maxLength={20} />
                        {formErrors.ai && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.ai[0]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.nisLabel')}</label>
                        <input type="text" value={formData.nis} onChange={(e) => handleFieldChange('nis', e.target.value.replace(/[^\d]/g, ''))} className={`input w-full ${formErrors.nis ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="000000000000000" inputMode="numeric" pattern="\d*" maxLength={20} />
                        {formErrors.nis && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.nis[0]}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.ribLabel')}</label>
                      <input type="text" value={formData.rib} onChange={(e) => handleFieldChange('rib', e.target.value.replace(/[^\d\s]/g, ''))} className={`input w-full ${formErrors.rib ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="00000 00000 00000000000 00" inputMode="numeric" maxLength={30} />
                      {formErrors.rib && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.rib[0]}</p>}
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className={`p-4 rounded-xl bg-gray-50/80 dark:bg-gray-700/50 border ${formErrors.is_active ? 'border-red-300' : 'border-gray-200/80 dark:border-gray-600'}`} data-tour="modal-status">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-200 text-sm">{t('clients.activeClient')}</span>
                      <p className="text-[11px] text-gray-400 mt-0.5">{t('clients.inactiveClientHint')}</p>
                    </div>
                  </label>
                  {formErrors.is_active && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.is_active[0]}</p>}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200/80 dark:border-gray-700 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  {t('clients.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                  data-tour="modal-submit"
                >
                  {isSaving ? (
                    <>
                      <span className="spinner w-4 h-4" />
                      {t('clients.saving')}
                    </>
                  ) : selectedClient ? (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      {t('clients.updateData')}
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      {t('clients.addTheClient')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Onboarding Tour */}
      {showModalTour && isModalOpen && (
        <GuidedTour
          steps={modalTourSteps}
          onComplete={() => setShowModalTour(false)}
          storageKey="clients_modal_tour_step"
        />
      )}

      {/* Client Details Modal */}
      {isDetailsOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col border border-gray-200/80 dark:border-gray-700">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{selectedClient.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-gray-100">{selectedClient.name}</h3>
                  {selectedClient.code && (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">{selectedClient.code}</span>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('clients.clientDetailsTitle')}</p>
                </div>
              </div>
              <button onClick={handleCloseDetails} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                <XMarkIcon className="w-5 h-5 dark:text-gray-300" />
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
                    <div className="card dark:bg-gray-750 dark:border-gray-700">
                      <h4 className="font-bold mb-3 flex items-center gap-2 dark:text-gray-100">
                        <UserIcon className="w-5 h-5 text-blue-600" />
                        {t('clients.clientInfo')}
                      </h4>
                      <div className="space-y-2 text-sm dark:text-gray-300">
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
                        <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-600">
                          <span className="text-gray-500 dark:text-gray-400">{t('clients.statusLabel')}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedClient.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}>
                            {selectedClient.is_active ? t('clients.active') : t('clients.disabled')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-200 dark:border-orange-800">
                      <h4 className="font-bold mb-3 flex items-center gap-2 dark:text-gray-100">
                        <BanknotesIcon className="w-5 h-5 text-orange-600" />
                        {t('clients.financialStatus')}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300">{t('clients.totalDebt')}</span>
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
                                <span className="text-gray-500 dark:text-gray-400">{t('clients.salesDebtLabel')}</span>
                                <span className="text-red-500">{formatCurrency(Number(selectedClient.sales_debt) || 0)}</span>
                              </div>
                            )}
                            {(Number(selectedClient.delivery_debt) || 0) > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">{t('clients.deliveryDebtLabel')}</span>
                                <span className="text-orange-500">{formatCurrency(Number(selectedClient.delivery_debt) || 0)}</span>
                              </div>
                            )}
                          </>
                        )}
                        {selectedClient.credit_limit && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">{t('clients.creditLimitDetail')}</span>
                            <span className="font-medium dark:text-gray-200">{formatCurrency(selectedClient.credit_limit)}</span>
                          </div>
                        )}
                        {clientDetails.totals && (
                          <>
                            <hr className="dark:border-gray-600" />
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-300">{t('clients.totalSales')}</span>
                              <span className="dark:text-gray-200">{formatCurrency(clientDetails.totals.total_sales || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-300">{t('clients.totalPaid')}</span>
                              <span className="text-green-600">{formatCurrency(clientDetails.totals.total_paid || 0)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-300">{t('clients.totalRemaining')}</span>
                              <span className="text-red-600">{formatCurrency(clientDetails.totals.total_remaining || 0)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Unpaid Sales */}
                  {clientDetails.sales && clientDetails.sales.length > 0 && (
                    <div className="card dark:bg-gray-750 dark:border-gray-700">
                      <h4 className="font-bold mb-3 flex items-center gap-2 dark:text-gray-100">
                        <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                        {t('clients.unpaidInvoices', { count: clientDetails.sales.length })}
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                              <th className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'} dark:text-gray-300`}>{t('clients.referenceCol')}</th>
                              <th className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'} dark:text-gray-300`}>{t('clients.dateCol')}</th>
                              <th className="px-3 py-2 text-center dark:text-gray-300">{t('clients.amountCol')}</th>
                              <th className="px-3 py-2 text-center dark:text-gray-300">{t('clients.paidCol')}</th>
                              <th className="px-3 py-2 text-center dark:text-gray-300">{t('clients.remainingCol')}</th>
                              <th className="px-3 py-2 text-center dark:text-gray-300">{t('clients.paymentStatusCol')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y dark:divide-gray-700">
                            {clientDetails.sales.map((sale) => (
                              <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-3 py-2 dark:text-gray-200">
                                  <Link
                                    href={`/dashboard/sales/${sale.id}`}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                  >
                                    {sale.reference}
                                  </Link>
                                </td>
                                <td className="px-3 py-2 dark:text-gray-300">{formatDate(sale.date)}</td>
                                <td className="px-3 py-2 text-center dark:text-gray-200">{formatCurrency(sale.grand_total)}</td>
                                <td className="px-3 py-2 text-center text-green-600">{formatCurrency(sale.paid_amount)}</td>
                                <td className="px-3 py-2 text-center text-red-600 font-medium">{formatCurrency(sale.due_amount)}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    sale.payment_status === 'paid'
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                      : sale.payment_status === 'partial'
                                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  }`}>
                                    {sale.payment_status === 'paid' ? t('clients.paid') : sale.payment_status === 'partial' ? t('clients.partial') : t('clients.unpaid')}
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
                      {t('clients.newSaleInvoice')}
                    </Link>
                    <button
                      onClick={() => {
                        handleCloseDetails();
                        handleOpenEdit(selectedClient);
                      }}
                      className="btn btn-secondary"
                    >
                      <PencilIcon className="w-5 h-5" />
                      {t('clients.editData')}
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
                      {t('clients.accountStatement')}
                    </button>
                    {(Number(selectedClient.combined_debt) || 0) > 0 && (
                      <Link
                        href="/dashboard/sales/debtors"
                        className="btn bg-amber-500 text-white hover:bg-amber-600"
                      >
                        <CurrencyDollarIcon className="w-5 h-5" />
                        {t('clients.collectDebt')}
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {t('clients.noData')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <TrashIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-bold mb-2 dark:text-gray-100">{t('clients.deleteClient')}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('clients.deleteConfirmMsg', { name: selectedClient.name })}
                <br />
                <span className="text-sm text-red-600">{t('clients.irreversibleAction')}</span>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="btn btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  {t('clients.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="btn bg-red-600 text-white hover:bg-red-700"
                >
                  {t('clients.yesDeleteClient')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-gray-100">{t('clients.transferToWarehouse')}</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XMarkIcon className="w-5 h-5 dark:text-gray-300" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {t('clients.transferDescription', { count: selectedClientIds.size })}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('clients.destinationWarehouse')}</label>
              <select
                value={transferWarehouseId}
                onChange={(e) => setTransferWarehouseId(e.target.value)}
                className="select w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="">{t('clients.selectWarehouse')}</option>
                {warehousesList.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className={`flex gap-3 ${isRTL ? 'justify-start' : 'justify-end'}`}>
              <button
                onClick={() => setShowTransferModal(false)}
                className="btn btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {t('clients.cancel')}
              </button>
              <button
                onClick={handleTransfer}
                disabled={!transferWarehouseId || isTransferring}
                className="btn bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {isTransferring ? (
                  <>
                    <span className="spinner w-4 h-4"></span>
                    {t('clients.transferring')}
                  </>
                ) : (
                  t('clients.transferClients2')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold dark:text-gray-100">{t('clients.copyToWarehouse')}</h3>
              <button onClick={() => setShowCopyModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <XMarkIcon className="w-5 h-5 dark:text-gray-300" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {t('clients.copyDescription', { count: selectedClientIds.size })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t('clients.copyNote')}
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('clients.destinationWarehouse')}</label>
              <select
                value={copyWarehouseId}
                onChange={(e) => setCopyWarehouseId(e.target.value)}
                className="select w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              >
                <option value="">{t('clients.selectWarehouse')}</option>
                {warehousesList.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className={`flex gap-3 ${isRTL ? 'justify-start' : 'justify-end'}`}>
              <button
                onClick={() => setShowCopyModal(false)}
                className="btn btn-secondary dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {t('clients.cancel')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!copyWarehouseId || isCopying}
                className="btn bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isCopying ? (
                  <>
                    <span className="spinner w-4 h-4"></span>
                    {t('clients.copying')}
                  </>
                ) : (
                  t('clients.copyClients2')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={clientsTourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="clients_tour_step"
        />
      )}

      {/* Statement Bottom Sheet */}
      {isStatementOpen && selectedClient && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50" onClick={() => setIsStatementOpen(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg dark:text-gray-100">{t('clients.clientStatement')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedClient.name}</p>
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
                      link.setAttribute('download', `${locale === 'ar' ? 'كشف-حساب' : 'releve-compte'}-${selectedClient.name}.pdf`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                      toast.success(t('clients.statementDownloaded'));
                    } catch {
                      toast.error(t('clients.statementDownloadError'));
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
                      {t('clients.exporting')}
                    </>
                  ) : (
                    <>
                      <ArrowTrendingDownIcon className="w-5 h-5" />
                      {t('clients.exportPdf')}
                    </>
                  )}
                </button>
                <button onClick={() => setIsStatementOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <XMarkIcon className="w-5 h-5 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Filters bar */}
            <div className="px-6 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('clients.fromLabel')}</label>
                <DateInput
                  value={statementDateFrom}
                  onChange={(v) => {
                    setStatementDateFrom(v);
                    if (v && statementDateTo) fetchStatementData(selectedClient.id, v, statementDateTo);
                  }}
                  placeholder={t('clients.fromDate')}
                  max={statementDateTo}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('clients.toLabel')}</label>
                <DateInput
                  value={statementDateTo}
                  onChange={(v) => {
                    setStatementDateTo(v);
                    if (statementDateFrom && v) fetchStatementData(selectedClient.id, statementDateFrom, v);
                  }}
                  placeholder={t('clients.toDate')}
                  min={statementDateFrom}
                />
              </div>
              <button
                onClick={() => fetchStatementData(selectedClient.id, statementDateFrom, statementDateTo)}
                className="btn btn-primary text-sm py-1.5"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
                {t('clients.show')}
              </button>
              <div className={`${isRTL ? 'border-l' : 'border-r'} h-6 mx-2 dark:border-gray-600`} />
              <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-gray-300">
                <input type="checkbox" checked={statementIncludeInfo} onChange={e => setStatementIncludeInfo(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                {t('clients.clientInfoCheckbox')}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer dark:text-gray-300">
                <input type="checkbox" checked={statementIncludeLegal} onChange={e => setStatementIncludeLegal(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                {t('clients.legalInfoCheckbox')}
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
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center border dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('clients.openingBalance')}</p>
                      <p className={`text-lg font-bold ${statementData.opening_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(statementData.opening_balance)}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('clients.totalInvoices')}</p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(statementData.total_somme)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center border border-green-200 dark:border-green-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('clients.totalPayments')}</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(statementData.total_versement)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center border border-red-200 dark:border-red-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('clients.closingBalance')}</p>
                      <p className={`text-lg font-bold ${statementData.closing_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(statementData.closing_balance)}
                      </p>
                    </div>
                  </div>

                  {/* Operations table */}
                  <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-800 dark:bg-gray-900 text-white">
                          <tr>
                            <th className="px-3 py-2 text-center w-12">#</th>
                            <th className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('clients.operationCode')}</th>
                            <th className="px-3 py-2 text-center">{t('clients.date')}</th>
                            <th className="px-3 py-2 text-center">{t('clients.type')}</th>
                            <th className="px-3 py-2 text-center">{t('clients.amount')}</th>
                            <th className="px-3 py-2 text-center">{t('clients.payment')}</th>
                            <th className="px-3 py-2 text-center">{t('clients.balance')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                          {/* Opening balance row */}
                          <tr className="bg-gray-50 dark:bg-gray-700/50 italic text-gray-500 dark:text-gray-400">
                            <td className="px-3 py-2 text-center"></td>
                            <td colSpan={3} className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'} font-medium`}>{t('clients.openingBalanceRow')}</td>
                            <td className="px-3 py-2 text-center"></td>
                            <td className="px-3 py-2 text-center"></td>
                            <td className="px-3 py-2 text-center font-bold">{formatCurrency(statementData.opening_balance)}</td>
                          </tr>
                          {statementData.operations.map((op, idx) => (
                            <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${op.type === 'versement' ? 'bg-green-50/30 dark:bg-green-900/10' : ''} dark:text-gray-200`}>
                              <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>
                              <td className="px-3 py-2 font-mono text-sm">{op.code}</td>
                              <td className="px-3 py-2 text-center">{formatDate(op.date)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  op.type === 'facture' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                }`}>
                                  {op.type === 'facture' ? t('clients.invoiceType') : t('clients.paymentType')}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-center">{op.somme > 0 ? formatCurrency(op.somme) : '-'}</td>
                              <td className="px-3 py-2 text-center text-green-600 dark:text-green-400">{op.versement > 0 ? formatCurrency(op.versement) : '-'}</td>
                              <td className={`px-3 py-2 text-center font-bold ${op.credit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(op.credit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold border-t-2 dark:border-gray-600">
                          <tr className="dark:text-gray-200">
                            <td colSpan={4} className={`px-3 py-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('clients.totalRow')}</td>
                            <td className="px-3 py-2 text-center">{formatCurrency(statementData.total_somme)}</td>
                            <td className="px-3 py-2 text-center text-green-600 dark:text-green-400">{formatCurrency(statementData.total_versement)}</td>
                            <td className={`px-3 py-2 text-center ${statementData.closing_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(statementData.closing_balance)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {statementData.operations.length === 0 && (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                      <DocumentTextIcon className="w-12 h-12 mx-auto mb-3" />
                      <p>{t('clients.noOperationsInPeriod')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-3" />
                  <p>{t('clients.selectPeriodAndShow')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
