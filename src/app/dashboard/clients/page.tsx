'use client';

import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clientsApi, clientCategoriesApi, salesApi, usersApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import { useLocale } from '@/lib/i18n/context';

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
    <div className="space-y-5">
      {/* Shortcuts Bar */}
      <div className={`bg-gradient-to-l from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-slate-300 px-4 py-2 rounded-xl flex items-center gap-6 text-sm shadow-sm ${isRTL ? '' : 'flex-row-reverse'}`} data-tour="clients-shortcuts">
        <span className="font-bold text-white text-xs tracking-wide">{t('clients.shortcuts')}</span>
        <div className="w-px h-4 bg-slate-700" />
        <span><kbd className="bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-md text-[10px] font-mono">Insert</kbd> {t('clients.addNewClient')}</span>
        <button onClick={() => setShowTour(true)} className={`${isRTL ? 'mr-auto' : 'ml-auto'} flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors`}>
          <QuestionMarkCircleIcon className="w-5 h-5" />
          <span className="text-slate-400">{t('clients.guidedTour')}</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between" data-tour="clients-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <UserGroupIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('clients.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('clients.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* View toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <TableCellsIcon className="w-4 h-4" />
              {t('clients.tableView')}
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-medium transition-all ${
                viewMode === 'map' ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              {t('clients.mapView')}
            </button>
          </div>
          <Link
            href="/dashboard/sales/debtors"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
          >
            <BanknotesIcon className="w-4 h-4" />
            {t('clients.outstandingDebts')}
          </Link>
          {selectedClientIds.size > 0 && (
            <>
              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm"
              >
                {t('clients.transferClients', { count: selectedClientIds.size })}
              </button>
              <button
                onClick={() => setShowCopyModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {t('clients.copyClients', { count: selectedClientIds.size })}
              </button>
            </>
          )}
          <button onClick={handleOpenCreate} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">
            <PlusIcon className="w-4 h-4" />
            {t('clients.addClient')}
            <kbd className={`bg-blue-700/50 px-1.5 py-0.5 rounded text-[10px] font-mono ${isRTL ? 'mr-1' : 'ml-1'}`}>Insert</kbd>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden" data-tour="clients-kpis">
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          <div className="group relative px-4 py-4 text-center hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors">
            <div className={`absolute top-0 right-0 left-0 h-[3px] ${isRTL ? 'rounded-tr-2xl' : 'rounded-tl-2xl'} bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform ${isRTL ? 'origin-right' : 'origin-left'}`} />
            <UserGroupIcon className="w-5 h-5 mx-auto mb-1.5 text-blue-500" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('clients.totalClients')}</p>
            <p className="text-lg font-bold text-blue-600">{stats.totalClients}</p>
          </div>
          <div className="group relative px-4 py-4 text-center hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20 transition-colors">
            <div className={`absolute top-0 right-0 left-0 h-[3px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform ${isRTL ? 'origin-right' : 'origin-left'}`} />
            <CheckCircleIcon className="w-5 h-5 mx-auto mb-1.5 text-emerald-500" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('clients.activeClients')}</p>
            <p className="text-lg font-bold text-emerald-600">{stats.activeClients}</p>
          </div>
          <div className="group relative px-4 py-4 text-center hover:bg-red-50/30 dark:hover:bg-red-900/20 transition-colors">
            <div className={`absolute top-0 right-0 left-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform ${isRTL ? 'origin-right' : 'origin-left'}`} />
            <BanknotesIcon className="w-5 h-5 mx-auto mb-1.5 text-red-500" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('clients.totalDebts')}</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalDebt)}</p>
          </div>
          <div className="group relative px-4 py-4 text-center hover:bg-orange-50/30 dark:hover:bg-orange-900/20 transition-colors">
            <div className={`absolute top-0 right-0 left-0 h-[3px] bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform ${isRTL ? 'origin-right' : 'origin-left'}`} />
            <ExclamationTriangleIcon className="w-5 h-5 mx-auto mb-1.5 text-orange-500" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('clients.withDebts')}</p>
            <p className="text-lg font-bold text-orange-600">{stats.clientsWithDebt}</p>
          </div>
          <div className="group relative px-4 py-4 text-center hover:bg-violet-50/30 dark:hover:bg-violet-900/20 transition-colors">
            <div className={`absolute top-0 right-0 left-0 h-[3px] bg-violet-500 scale-x-0 group-hover:scale-x-100 transition-transform ${isRTL ? 'origin-right' : 'origin-left'}`} />
            <UserPlusIcon className="w-5 h-5 mx-auto mb-1.5 text-violet-500" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('clients.newThisMonth')}</p>
            <p className="text-lg font-bold text-violet-600">{stats.newThisMonth}</p>
          </div>
          <div className="group relative px-4 py-4 text-center hover:bg-amber-50/30 dark:hover:bg-amber-900/20 transition-colors">
            <div className={`absolute top-0 right-0 left-0 h-[3px] ${isRTL ? 'rounded-tl-2xl' : 'rounded-tr-2xl'} bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform ${isRTL ? 'origin-right' : 'origin-left'}`} />
            <CurrencyDollarIcon className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{t('clients.avgDebt')}</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(stats.avgDebt)}</p>
          </div>
        </div>
      </div>

      {/* Status Filter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" data-tour="clients-status">
        <button
          onClick={() => { setStatusFilter('all'); setBalanceFilter('all'); }}
          className={`p-3 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${
            statusFilter === 'all' && balanceFilter === 'all'
              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30 shadow-sm shadow-blue-500/10'
              : 'border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <UserGroupIcon className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.totalClients}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('clients.all')}</p>
        </button>

        <button
          onClick={() => { setStatusFilter('active'); setBalanceFilter('all'); }}
          className={`p-3 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${
            statusFilter === 'active' && balanceFilter === 'all'
              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/30 shadow-sm shadow-emerald-500/10'
              : 'border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.activeClients}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('clients.activeLabel')}</p>
        </button>

        <button
          onClick={() => { setStatusFilter('inactive'); setBalanceFilter('all'); }}
          className={`p-3 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${
            statusFilter === 'inactive'
              ? 'border-gray-500 bg-gray-50/80 dark:bg-gray-700/50 shadow-sm'
              : 'border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <UserMinusIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.inactiveClients}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('clients.disabledLabel')}</p>
        </button>

        <button
          onClick={() => { setStatusFilter('all'); setBalanceFilter('has_debt'); }}
          className={`p-3 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${
            balanceFilter === 'has_debt'
              ? 'border-red-500 bg-red-50/80 dark:bg-red-900/30 shadow-sm shadow-red-500/10'
              : 'border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.clientsWithDebt}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('clients.hasDebt')}</p>
        </button>

        <button
          onClick={() => { setStatusFilter('all'); setBalanceFilter('no_debt'); }}
          className={`p-3 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'} ${
            balanceFilter === 'no_debt'
              ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-900/30 shadow-sm shadow-teal-500/10'
              : 'border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
              <CheckCircleIcon className="w-4 h-4 text-teal-600" />
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.clientsWithoutDebt}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{t('clients.noDebt')}</p>
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden" data-tour="clients-filters">
        <div className="px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2.5 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <FunnelIcon className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="font-semibold text-sm dark:text-gray-200">{t('clients.filters')}</span>
            {hasActiveFilters && (
              <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {t('clients.filtersActive')}
              </span>
            )}
            {showFilters ? (
              <ChevronUpIcon className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                <XCircleIcon className="w-3.5 h-3.5" />
                {t('clients.resetFilters')}
              </button>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              {t('clients.countOfTotal', { count: filteredClients.length, total: stats.totalClients })}
            </span>
          </div>
        </div>

        {showFilters && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <div className="relative">
                <MagnifyingGlassIcon className={`w-4 h-4 absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
                <input
                  type="text"
                  placeholder={t('clients.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm`}
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="select text-sm">
                <option value="all">{t('clients.allStatuses')}</option>
                <option value="active">{t('clients.activeOnly')}</option>
                <option value="inactive">{t('clients.disabledOnly')}</option>
              </select>
              <select value={balanceFilter} onChange={(e) => setBalanceFilter(e.target.value as typeof balanceFilter)} className="select text-sm">
                <option value="all">{t('clients.allBalances')}</option>
                <option value="has_debt">{t('clients.hasDebtFilter')}</option>
                <option value="no_debt">{t('clients.noDebtFilter')}</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              <select value={creditLimitFilter} onChange={(e) => setCreditLimitFilter(e.target.value as typeof creditLimitFilter)} className="select text-sm">
                <option value="all">{t('clients.creditLimit')}</option>
                <option value="has_limit">{t('clients.hasCreditLimit')}</option>
                <option value="no_limit">{t('clients.noCreditLimit')}</option>
                <option value="exceeded">{t('clients.exceededLimit', { count: stats.exceededCreditLimit })}</option>
              </select>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)} className="select text-sm">
                <option value="all">{t('clients.allSources')}</option>
                <option value="web">{t('clients.fromPlatform')}</option>
                <option value="app">{t('clients.fromApp')}</option>
              </select>
              <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className="select text-sm">
                <option value="">{t('clients.allUsers')}</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>{seller.name} ({seller.role === 'admin' ? t('clients.roleAdmin') : seller.role === 'seller' ? t('clients.roleSeller') : seller.role === 'livreur' ? t('clients.roleDriver') : seller.role === 'cashvan' ? t('clients.roleCashvan') : seller.role})</option>
                ))}
              </select>
              <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="select text-sm">
                <option value="">{t('clients.allWarehouses')}</option>
                <option value="none">{t('clients.noWarehouse')}</option>
                {warehousesList.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <select value={copyFilter} onChange={(e) => setCopyFilter(e.target.value as typeof copyFilter)} className="select text-sm">
                <option value="all">{t('clients.allCopyFilter')}</option>
                <option value="copies">{t('clients.copiesOnly')}</option>
                <option value="originals">{t('clients.originalsOnly')}</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('clients.creationDate')}</span>
              </div>
              <div className="flex items-center gap-2">
                <DateInput value={dateFrom} onChange={(v) => setDateFrom(v)} className="text-sm" placeholder={t('clients.from')} />
                <span className="text-gray-400">-</span>
                <DateInput value={dateTo} onChange={(v) => setDateTo(v)} className="text-sm" placeholder={t('clients.to')} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
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

      {/* Table Card */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden" data-tour="clients-table">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <TableCellsIcon className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{t('clients.clientsList')}</span>
              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">{filteredClients.length}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                  <th className="px-3 py-3 text-center w-10">
                    <input type="checkbox" checked={filteredClients.length > 0 && selectedClientIds.size === filteredClients.length} onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 rounded" />
                  </th>
                  <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('clients.clientCol')}</th>
                  <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('clients.contactCol')}</th>
                  <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('clients.warehouseCol')}</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('clients.balanceCol')}</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('clients.creditLimitCol')}</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('clients.statusCol')}</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('clients.sourceCol')}</th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('clients.actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                        <UserGroupIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 font-medium">{t('clients.noMatchingClients')}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('clients.tryChangingFilters')}</p>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className={`group hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors ${selectedClientIds.has(client.id) ? 'bg-blue-50/50 dark:bg-blue-900/30' : ''}`}>
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={selectedClientIds.has(client.id)} onChange={() => toggleClientSelection(client.id)} className="w-4 h-4 text-blue-600 rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">{client.name.charAt(0)}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">{client.name}</div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              {client.code && (
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">{client.code}</span>
                              )}
                              {client.client_category && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  {client.client_category.name}
                                </span>
                              )}
                              {client.copied_from && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" title={t('clients.copyFrom', { name: client.original_client?.name || `#${client.copied_from}` })}>
                                  {t('clients.copy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {client.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                              <PhoneIcon className="w-3.5 h-3.5 text-gray-400" />
                              <span dir="ltr" className="text-xs">{client.phone}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                              <EnvelopeIcon className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate max-w-[140px] text-xs">{client.email}</span>
                            </div>
                          )}
                          {!client.phone && !client.email && (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {client.warehouse ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                            {client.warehouse.name}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const totalDebt = Number(client.combined_debt) || 0;
                          const salesDebt = Number(client.sales_debt) || 0;
                          const deliveryDebt = Number(client.delivery_debt) || 0;
                          return (
                            <>
                              <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                totalDebt > 0
                                  ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800'
                                  : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                              }`}>
                                {totalDebt > 0 && <ArrowTrendingUpIcon className="w-3.5 h-3.5" />}
                                {formatCurrency(totalDebt)}
                              </div>
                              {totalDebt > 0 && (
                                <div className="text-[10px] text-gray-400 mt-1 space-y-0.5">
                                  {salesDebt > 0 && <div>{t('clients.salesDebt', { amount: formatCurrency(salesDebt) })}</div>}
                                  {deliveryDebt > 0 && <div>{t('clients.deliveryDebt', { amount: formatCurrency(deliveryDebt) })}</div>}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {client.credit_limit ? (
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{formatCurrency(client.credit_limit)}</span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium ${
                          client.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800'
                            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800'
                        }`}>
                          {client.is_active ? (
                            <><CheckCircleIcon className="w-3 h-3" /> {t('clients.active')}</>
                          ) : (
                            <><XMarkIcon className="w-3 h-3" /> {t('clients.disabled')}</>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium ${
                            client.source === 'app'
                              ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800'
                              : 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800'
                          }`}>
                            {client.source === 'app' ? (
                              <><DevicePhoneMobileIcon className="w-3 h-3" /> {t('clients.appSource')}</>
                            ) : (
                              <><ComputerDesktopIcon className="w-3 h-3" /> {t('clients.platformSource')}</>
                            )}
                          </span>
                          {client.creator && (
                            <span className="text-[10px] text-gray-400">{client.creator.name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenDetails(client)}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                            title={t('clients.viewDetails')}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                            title={t('clients.edit')}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClient(client);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                            title={t('clients.delete')}
                          >
                            <TrashIcon className="w-4 h-4" />
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
                                className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors"
                                title={t('clients.cancelCopy')}
                              >
                                <XCircleIcon className="w-4 h-4" />
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
                                className="p-1.5 hover:bg-teal-100 dark:hover:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg transition-colors"
                                title={t('clients.convertToNormal')}
                              >
                                <CheckCircleIcon className="w-4 h-4" />
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
                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                            className={`input w-full pr-9 ${formErrors.phone ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                            placeholder="0xxx xxx xxx"
                            dir="ltr"
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
                        <input type="text" value={formData.rc} onChange={(e) => handleFieldChange('rc', e.target.value)} className={`input w-full ${formErrors.rc ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="00/00-0000000B00" />
                        {formErrors.rc && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.rc[0]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.nifLabel')}</label>
                        <input type="text" value={formData.nif} onChange={(e) => handleFieldChange('nif', e.target.value)} className={`input w-full ${formErrors.nif ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="000000000000000" />
                        {formErrors.nif && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.nif[0]}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.aiLabel')}</label>
                        <input type="text" value={formData.ai} onChange={(e) => handleFieldChange('ai', e.target.value)} className={`input w-full ${formErrors.ai ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="00000000000" />
                        {formErrors.ai && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.ai[0]}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.nisLabel')}</label>
                        <input type="text" value={formData.nis} onChange={(e) => handleFieldChange('nis', e.target.value)} className={`input w-full ${formErrors.nis ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="000000000000000" />
                        {formErrors.nis && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ExclamationTriangleIcon className="w-3 h-3 flex-shrink-0" />{formErrors.nis[0]}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">{t('clients.ribLabel')}</label>
                      <input type="text" value={formData.rib} onChange={(e) => handleFieldChange('rib', e.target.value)} className={`input w-full ${formErrors.rib ? 'border-red-400 ring-1 ring-red-200' : ''}`} dir="ltr" placeholder="00000 00000 00000000000 00" />
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
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
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
