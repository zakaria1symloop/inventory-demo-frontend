'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { deliveriesApi, ordersApi, usersApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import Link from 'next/link';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import { useLocale } from '@/lib/i18n/context';
import {
  TruckIcon,
  PlusIcon,
  EyeIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

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
  const { t, locale, dir } = useLocale();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<Order[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [livreurFilter, setLivreurFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionFilter, setCollectionFilter] = useState(''); // 'collected', 'pending', 'partial'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;

  // Tour steps (inside component so t() works)
  const deliveryTourSteps: TourStep[] = useMemo(() => [
    { target: '[data-tour="deliveries-title"]', title: t('deliveries.tourTitle'), desc: t('deliveries.tourDesc'), position: 'bottom' },
    { target: '[data-tour="deliveries-add"]', title: t('deliveries.tourAddTitle'), desc: t('deliveries.tourAddDesc'), position: 'bottom' },
    { target: '[data-tour="deliveries-kpis"]', title: t('deliveries.tourKpisTitle'), desc: t('deliveries.tourKpisDesc'), position: 'bottom' },
    { target: '[data-tour="deliveries-chips"]', title: t('deliveries.tourChipsTitle'), desc: t('deliveries.tourChipsDesc'), position: 'bottom' },
    { target: '[data-tour="deliveries-list"]', title: t('deliveries.tourListTitle'), desc: t('deliveries.tourListDesc'), position: 'top' },
  ], [t]);

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
      toast.error(t('deliveries.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return '0 د.ج.';
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'ar-DZ');

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { class: string; text: string; color: string; bgColor: string; icon: React.ReactNode }> = {
      preparing: {
        class: 'badge-warning',
        text: t('deliveries.preparing'),
        color: 'text-amber-700 dark:text-amber-300',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        icon: <ClockIcon className="w-4 h-4" />,
      },
      in_progress: {
        class: 'badge-info',
        text: t('deliveries.inProgress'),
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        icon: <TruckIcon className="w-4 h-4" />,
      },
      completed: {
        class: 'badge-success',
        text: t('deliveries.completed'),
        color: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      cancelled: {
        class: 'badge-danger',
        text: t('deliveries.cancelled'),
        color: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        icon: <XCircleIcon className="w-4 h-4" />,
      },
    };
    return configs[status] || { class: 'badge-secondary', text: status, color: 'text-gray-700', bgColor: 'bg-gray-50', icon: null };
  };

  // Filtered deliveries
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      if (statusFilter && d.status !== statusFilter) return false;
      if (livreurFilter && d.livreur_id !== parseInt(livreurFilter)) return false;
      if (dateFrom && new Date(d.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(d.date) > new Date(dateTo)) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesRef = d.reference?.toLowerCase().includes(query);
        const matchesLivreur = d.livreur?.name?.toLowerCase().includes(query);
        const matchesVehicle = d.vehicle?.name?.toLowerCase().includes(query);
        if (!matchesRef && !matchesLivreur && !matchesVehicle) return false;
      }

      // Collection filter
      if (collectionFilter) {
        const totalAmt = Number(d.total_amount) || 0;
        const collectedAmt = Number(d.collected_amount) || 0;
        if (collectionFilter === 'collected' && collectedAmt < totalAmt) return false;
        if (collectionFilter === 'pending' && collectedAmt > 0) return false;
        if (collectionFilter === 'partial' && (collectedAmt === 0 || collectedAmt >= totalAmt)) return false;
      }

      return true;
    });
  }, [deliveries, statusFilter, livreurFilter, dateFrom, dateTo, searchQuery, collectionFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDeliveries.length / perPage);
  const paginatedDeliveries = filteredDeliveries.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, livreurFilter, dateFrom, dateTo, searchQuery, collectionFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayDeliveries = deliveries.filter(d => d.date === today);

    const totalOrders = filteredDeliveries.reduce((sum, d) => sum + d.total_orders, 0);
    const deliveredOrders = filteredDeliveries.reduce((sum, d) => sum + d.delivered_count, 0);
    const failedOrders = filteredDeliveries.reduce((sum, d) => sum + d.failed_count, 0);

    const successRate = totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(1) : '0';

    const totalAmount = filteredDeliveries.reduce((sum, d) => sum + (Number(d.total_amount) || 0), 0);
    const collectedAmount = filteredDeliveries.reduce((sum, d) => sum + (Number(d.collected_amount) || 0), 0);

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
    setCollectionFilter('');
  };

  const hasActiveFilters = statusFilter || livreurFilter || dateFrom || dateTo || searchQuery || collectionFilter;

  const [startingId, setStartingId] = useState<number | null>(null);

  const handleStartDelivery = async (id: number) => {
    if (!confirm(t('deliveries.startConfirm'))) return;
    setStartingId(id);
    try {
      await deliveriesApi.start(id);
      toast.success(t('deliveries.startSuccess'));
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || t('deliveries.startError');
      toast.error(message);
    } finally {
      setStartingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-5">
      {showTour && (
        <GuidedTour
          steps={deliveryTourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="deliveries_tour_step"
        />
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
        <div data-tour="deliveries-title">
          <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('deliveries.title')}</h1>
          <p className="text-sm text-gray-400 mt-1.5">{t('deliveries.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTour(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            title={t('deliveries.tourButton')}
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
            {t('deliveries.tourButton')}
          </button>
          <Link
            href="/dashboard/deliveries/new"
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200"
            data-tour="deliveries-add"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            <span className="hidden sm:inline">{t('deliveries.addNew')}</span>
            <span className="sm:hidden">{t('deliveries.addNewShort')}</span>
            <kbd className="hidden sm:inline bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">Insert</kbd>
          </Link>
        </div>
      </div>

      {/* ─── KPI Strip ─── */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="deliveries-kpis">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 sm:divide-x sm:divide-x-reverse divide-gray-100 dark:divide-gray-700">
          {/* Total deliveries */}
          <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.totalDeliveries}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('deliveries.kpiTotal')}</div>
            </div>
          </div>

          {/* Success rate */}
          <div className="group relative p-5 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">{kpis.successRate}%</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('deliveries.kpiSuccessRate')}</div>
            </div>
          </div>

          {/* Orders delivered / total */}
          <div className="group relative p-5 hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-2xl font-black text-gray-900 dark:text-white tabular-nums leading-none">
                <span className="text-emerald-600 dark:text-emerald-400">{kpis.deliveredOrders}</span>
                <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                <span>{kpis.totalOrders}</span>
              </div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('deliveries.kpiDelivered')}</div>
            </div>
          </div>

          {/* Failed */}
          <div className="group relative p-5 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-3xl font-black text-red-600 dark:text-red-400 tabular-nums leading-none">{kpis.failedOrders}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('deliveries.kpiFailed')}</div>
            </div>
          </div>

          {/* Collected amount */}
          <div className="group relative p-5 hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-lg font-black text-teal-600 dark:text-teal-400 tabular-nums leading-none">{formatCurrency(kpis.collectedAmount)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('deliveries.kpiCollected')}</div>
            </div>
          </div>

          {/* Unassigned orders */}
          <div className="group relative p-5 hover:bg-orange-50/40 dark:hover:bg-orange-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="text-3xl font-black text-orange-600 dark:text-orange-400 tabular-nums leading-none">{kpis.unassignedOrders}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('deliveries.kpiUnassigned')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Quick Filter Chips + Search ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3" data-tour="deliveries-chips">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('deliveries.searchPlaceholder')}
            className="input pr-10 text-sm"
          />
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
              !statusFilter
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('deliveries.chipAll')} {kpis.totalDeliveries}
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'preparing' ? '' : 'preparing')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
              statusFilter === 'preparing'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30'
            }`}
          >
            {t('deliveries.chipPreparing')} {kpis.preparingCount}
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'in_progress' ? '' : 'in_progress')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
              statusFilter === 'in_progress'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
          >
            {t('deliveries.chipInProgress')} {kpis.inProgressCount}
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'completed' ? '' : 'completed')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
              statusFilter === 'completed'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
            }`}
          >
            {t('deliveries.chipCompleted')} {kpis.completedCount}
          </button>
          <button
            onClick={() => setStatusFilter(statusFilter === 'cancelled' ? '' : 'cancelled')}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
              statusFilter === 'cancelled'
                ? 'bg-red-500 text-white'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30'
            }`}
          >
            {t('deliveries.chipCancelled')} {kpis.cancelledCount}
          </button>
        </div>

        {/* Toggle filters */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
            showFilters || hasActiveFilters
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <FunnelIcon className="w-3.5 h-3.5" />
          {t('deliveries.advancedFilters')}
          {showFilters ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
        </button>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 font-bold flex items-center gap-1">
            <XCircleIcon className="w-3.5 h-3.5" />
            {t('deliveries.clearAll')}
          </button>
        )}
      </div>

      {/* ─── Expanded Filters ─── */}
      {showFilters && (
        <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Livreur Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{t('deliveries.filterDriver')}</label>
              <select value={livreurFilter} onChange={(e) => setLivreurFilter(e.target.value)} className="select text-sm">
                <option value="">{t('deliveries.filterAllDrivers')}</option>
                {livreurs.map(livreur => (
                  <option key={livreur.id} value={livreur.id}>{livreur.name}</option>
                ))}
              </select>
            </div>

            {/* Collection Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{t('deliveries.filterCollection')}</label>
              <select value={collectionFilter} onChange={(e) => setCollectionFilter(e.target.value)} className="select text-sm">
                <option value="">{t('deliveries.filterAllCollection')}</option>
                <option value="collected">{t('deliveries.filterCollected')}</option>
                <option value="partial">{t('deliveries.filterPartial')}</option>
                <option value="pending">{t('deliveries.filterPending')}</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{t('deliveries.filterFromDate')}</label>
              <DateInput
                value={dateFrom}
                onChange={(v) => setDateFrom(v)}
                placeholder={t('deliveries.filterFromDate')}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{t('deliveries.filterToDate')}</label>
              <DateInput
                value={dateTo}
                onChange={(v) => setDateTo(v)}
                placeholder={t('deliveries.filterToDate')}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Deliveries List ─── */}
      <div data-tour="deliveries-list">
        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredDeliveries.length} {t('deliveries.deliveriesUnit')}
            {hasActiveFilters && ` (${t('deliveries.ofTotal', { total: deliveries.length })})`}
          </span>
          {kpis.todayDeliveries > 0 && (
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-full">
              {t('deliveries.todayBadge', { count: kpis.todayDeliveries, active: kpis.todayInProgress })}
            </span>
          )}
        </div>

        {paginatedDeliveries.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <TruckIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('deliveries.noResults')}</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 font-bold">
                {t('deliveries.clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedDeliveries.map((delivery) => {
              const status = getStatusConfig(delivery.status);
              const pendingCount = delivery.total_orders - delivery.delivered_count - delivery.failed_count;
              const progressPercent = delivery.total_orders > 0
                ? Math.round((delivery.delivered_count / delivery.total_orders) * 100)
                : 0;
              const totalAmt = Number(delivery.total_amount) || 0;
              const collectedAmt = Number(delivery.collected_amount) || 0;
              const collectionPercent = totalAmt > 0 ? Math.round((collectedAmt / totalAmt) * 100) : 0;

              return (
                <div
                  key={delivery.id}
                  className="group rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Status indicator strip */}
                    <div className={`sm:w-1.5 h-1.5 sm:h-auto ${
                      delivery.status === 'preparing' ? 'bg-amber-400' :
                      delivery.status === 'in_progress' ? 'bg-blue-500' :
                      delivery.status === 'completed' ? 'bg-emerald-500' :
                      'bg-red-400'
                    }`} />

                    {/* Main content */}
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Left: Reference + Status */}
                        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                          <div className={`w-9 h-9 rounded-xl ${status.bgColor} flex items-center justify-center ${status.color}`}>
                            {status.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{delivery.reference}</span>
                              <span className={`badge ${status.class} text-[10px]`}>{status.text}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <CalendarDaysIcon className="w-3 h-3" />
                                {formatDate(delivery.date)}
                              </span>
                              {delivery.start_time && (
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="w-3 h-3" />
                                  {delivery.start_time}
                                  {delivery.end_time && ` - ${delivery.end_time}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Middle: Driver + Vehicle */}
                        <div className="flex items-center gap-4 text-sm flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate">{delivery.livreur?.name || '-'}</span>
                          </div>
                          {delivery.vehicle && (
                            <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                              <TruckIcon className="w-3.5 h-3.5 text-gray-400" />
                              <span className="truncate">{delivery.vehicle.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Orders progress */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="text-center min-w-[100px]">
                            <div className="flex items-center justify-center gap-1.5 text-xs mb-1">
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{delivery.delivered_count}</span>
                              <span className="text-gray-300 dark:text-gray-600">/</span>
                              <span className="text-gray-600 dark:text-gray-300 font-medium">{delivery.total_orders}</span>
                              {delivery.failed_count > 0 && (
                                <span className="text-red-500 text-[10px] font-bold">({delivery.failed_count} {t('deliveries.failed')})</span>
                              )}
                            </div>
                            {delivery.total_orders > 0 && (
                              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full flex">
                                  <div
                                    className="bg-emerald-500 rounded-r-full"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                  {delivery.failed_count > 0 && (
                                    <div
                                      className="bg-red-400"
                                      style={{ width: `${Math.round((delivery.failed_count / delivery.total_orders) * 100)}%` }}
                                    />
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Amount */}
                          {totalAmt > 0 && (
                            <div className="text-center min-w-[90px] hidden md:block">
                              <div className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(totalAmt)}</div>
                              {collectedAmt > 0 && (
                                <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                                  {t('deliveries.collected')}: {collectionPercent}%
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {delivery.status === 'preparing' && (
                            <button
                              onClick={() => handleStartDelivery(delivery.id)}
                              disabled={startingId === delivery.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
                            >
                              {startingId === delivery.id ? (
                                <div className="spinner w-3.5 h-3.5 border-white"></div>
                              ) : (
                                <PlayIcon className="w-3.5 h-3.5" />
                              )}
                              {t('deliveries.start')}
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/dashboard/deliveries/${delivery.id}`)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            {t('deliveries.view')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('deliveries.previous')}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .map((page, i, arr) => (
                <span key={page} className="flex items-center">
                  {i > 0 && arr[i - 1] !== page - 1 && (
                    <span className="px-1.5 text-gray-400">…</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 text-sm font-bold rounded-lg transition-all ${
                      page === currentPage
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('deliveries.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
